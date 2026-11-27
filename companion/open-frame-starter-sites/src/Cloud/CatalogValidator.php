<?php
/**
 * Validation of the catalog received from the library.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Cloud;

use OpenFrame\StarterSites\Config;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Turns the downloaded catalog into data the plugin can trust.
 *
 * Nothing from the library is used as received: every value is checked
 * against the shape in schemas/catalog.schema.json and rebuilt from scratch,
 * so unknown fields never reach the rest of the plugin. A site that does not
 * pass is left out and counted; the others stay usable.
 */
class CatalogValidator {

	const SLUG    = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';
	const VERSION = '/^\d+(?:\.\d+){0,3}$/';

	/**
	 * Plugin configuration.
	 *
	 * @var Config
	 */
	private $config;

	/**
	 * Constructor.
	 *
	 * @param Config $config Plugin configuration.
	 */
	public function __construct( Config $config ) {
		$this->config = $config;
	}

	/**
	 * Validate and normalize a decoded catalog.
	 *
	 * @param mixed $raw Decoded JSON.
	 * @return array|WP_Error Normalized catalog: format, generated, categories, sites, skipped.
	 */
	public function validate( $raw ) {
		$invalid = new WP_Error( 'ofss_invalid_catalog', __( 'The starter site library sent a list that this plugin cannot read.', 'open-frame-starter-sites' ) );

		if ( ! is_array( $raw ) || ! isset( $raw['format'], $raw['sites'] ) || ! is_int( $raw['format'] ) || $raw['format'] < 1 || ! is_array( $raw['sites'] ) ) {
			return $invalid;
		}

		if ( $raw['format'] > Config::FORMAT ) {
			return new WP_Error( 'ofss_newer_catalog', __( 'The starter site library uses a newer format. Update the Open Frame Starter Sites plugin to see the list.', 'open-frame-starter-sites' ) );
		}

		$categories = array();
		foreach ( (array) ( $raw['categories'] ?? array() ) as $category ) {
			if ( is_array( $category ) && $this->is_slug( $category['slug'] ?? null ) && $this->is_text( $category['name'] ?? null, 60 ) ) {
				$categories[ $category['slug'] ] = array(
					'slug' => $category['slug'],
					'name' => sanitize_text_field( $category['name'] ),
				);
			}
		}

		$sites   = array();
		$skipped = 0;
		foreach ( $raw['sites'] as $site ) {
			$clean = $this->site( $site );
			if ( null === $clean || isset( $sites[ $clean['id'] ] ) ) {
				++$skipped;
				continue;
			}
			if ( ! isset( $categories[ $clean['category'] ] ) ) {
				$categories[ $clean['category'] ] = array(
					'slug' => $clean['category'],
					'name' => ucwords( str_replace( '-', ' ', $clean['category'] ) ),
				);
			}
			$sites[ $clean['id'] ] = $clean;
		}

		return array(
			'format'     => $raw['format'],
			'generated'  => $this->is_text( $raw['generated'] ?? null, 40 ) ? sanitize_text_field( $raw['generated'] ) : '',
			'categories' => array_values( $categories ),
			'sites'      => array_values( $sites ),
			'skipped'    => $skipped,
		);
	}

	/**
	 * Validate one site entry.
	 *
	 * @param mixed $site Raw site entry.
	 * @return array|null Normalized entry, or null when it is not acceptable.
	 */
	private function site( $site ) {
		if ( ! is_array( $site )
			|| ! $this->is_slug( $site['id'] ?? null )
			|| ! $this->is_text( $site['name'] ?? null, 60 )
			|| ! $this->is_slug( $site['category'] ?? null )
			|| ! in_array( $site['tier'] ?? null, array( 'free', 'pro' ), true )
			|| ! in_array( $site['status'] ?? null, array( 'available', 'coming_soon' ), true )
			|| ! $this->is_version( $site['version'] ?? null )
			|| ! is_array( $site['preview'] ?? null )
			|| ! $this->config->is_allowed_url( $site['preview']['thumbnail'] ?? null )
			|| ! is_array( $site['requires'] ?? null )
		) {
			return null;
		}

		$requires = $this->requires( $site['requires'] );
		if ( null === $requires ) {
			return null;
		}

		$screenshots = array();
		foreach ( array_slice( (array) ( $site['preview']['screenshots'] ?? array() ), 0, 30 ) as $shot ) {
			if ( is_array( $shot ) && $this->is_text( $shot['title'] ?? null, 60 ) && $this->config->is_allowed_url( $shot['url'] ?? null ) ) {
				$screenshots[] = array(
					'title' => sanitize_text_field( $shot['title'] ),
					'url'   => esc_url_raw( $shot['url'] ),
				);
			}
		}

		$editable = array();
		foreach ( array( 'pages', 'header', 'footer', '404', 'blog', 'single', 'shop' ) as $part ) {
			$how = $site['editable'][ $part ] ?? null;
			if ( in_array( $how, array( 'elementor', 'theme' ), true ) ) {
				$editable[ $part ] = $how;
			}
		}

		$manifest = null;
		if ( 'available' === $site['status'] ) {
			$manifest_url = $site['manifest']['url'] ?? null;
			$manifest_sum = $site['manifest']['sha256'] ?? null;
			if ( ! $this->config->is_allowed_url( $manifest_url ) || ! is_string( $manifest_sum ) || ! preg_match( '/^[a-f0-9]{64}$/', $manifest_sum ) ) {
				// A site that claims to be importable must say where its manifest is.
				return null;
			}
			$manifest = array(
				'url'    => esc_url_raw( $manifest_url ),
				'sha256' => $manifest_sum,
			);
		}

		$demo = $site['preview']['demo_url'] ?? '';

		return array(
			'id'       => $site['id'],
			'name'     => sanitize_text_field( $site['name'] ),
			'summary'  => $this->is_text( $site['summary'] ?? null, 300 ) ? sanitize_text_field( $site['summary'] ) : '',
			'category' => $site['category'],
			'tags'     => $this->text_list( $site['tags'] ?? array(), 12, 30 ),
			'tier'     => $site['tier'],
			'status'   => $site['status'],
			'version'  => $site['version'],
			'preview'  => array(
				'thumbnail'   => esc_url_raw( $site['preview']['thumbnail'] ),
				'screenshots' => $screenshots,
				'demo_url'    => $this->config->is_https_url( $demo ) ? esc_url_raw( $demo ) : '',
			),
			'pages'    => $this->text_list( $site['pages'] ?? array(), 40, 60 ),
			'requires' => $requires,
			'editable' => $editable,
			'manifest' => $manifest,
		);
	}

	/**
	 * Validate the requirements of a site.
	 *
	 * @param array $requires Raw requirements.
	 * @return array|null
	 */
	private function requires( array $requires ) {
		$clean = array(
			'format'    => isset( $requires['format'] ) && is_int( $requires['format'] ) && $requires['format'] > 0 ? $requires['format'] : 1,
			'wordpress' => '',
			'php'       => '',
			'theme'     => '',
			'importer'  => '',
			'plugins'   => array(),
		);

		foreach ( array( 'wordpress', 'php', 'theme', 'importer' ) as $key ) {
			if ( isset( $requires[ $key ] ) ) {
				if ( ! $this->is_version( $requires[ $key ] ) ) {
					return null;
				}
				$clean[ $key ] = $requires[ $key ];
			}
		}

		$seen = array();
		foreach ( (array) ( $requires['plugins'] ?? array() ) as $plugin ) {
			if ( ! is_array( $plugin )
				|| ! $this->is_slug( $plugin['slug'] ?? null )
				|| isset( $seen[ $plugin['slug'] ] )
				|| ! $this->is_text( $plugin['name'] ?? null, 60 )
				|| ! is_string( $plugin['file'] ?? null )
				|| ! preg_match( '#^[a-z0-9-]+/[a-z0-9._-]+\.php$#', $plugin['file'] )
				|| 0 !== strpos( $plugin['file'], $plugin['slug'] . '/' )
				|| ! in_array( $plugin['source'] ?? null, array( 'wordpress.org', 'external' ), true )
				|| ( isset( $plugin['version'] ) && ! $this->is_version( $plugin['version'] ) )
			) {
				return null;
			}

			$url = $plugin['url'] ?? '';

			$seen[ $plugin['slug'] ] = true;
			$clean['plugins'][]      = array(
				'slug'     => $plugin['slug'],
				'name'     => sanitize_text_field( $plugin['name'] ),
				'file'     => $plugin['file'],
				'version'  => $plugin['version'] ?? '',
				'source'   => $plugin['source'],
				'required' => ! isset( $plugin['required'] ) || (bool) $plugin['required'],
				'url'      => $this->config->is_https_url( $url ) ? esc_url_raw( $url ) : '',
			);
		}

		return $clean;
	}

	/**
	 * Keep the plain strings of a list.
	 *
	 * @param mixed $items  Raw list.
	 * @param int   $max    Most items kept.
	 * @param int   $length Longest string kept.
	 * @return string[]
	 */
	private function text_list( $items, $max, $length ) {
		$clean = array();
		foreach ( array_slice( (array) $items, 0, $max ) as $item ) {
			if ( $this->is_text( $item, $length ) ) {
				$clean[] = sanitize_text_field( $item );
			}
		}
		return $clean;
	}

	/**
	 * Whether a value is a slug.
	 *
	 * @param mixed $value Value.
	 * @return bool
	 */
	private function is_slug( $value ) {
		return is_string( $value ) && strlen( $value ) <= 60 && 1 === preg_match( self::SLUG, $value );
	}

	/**
	 * Whether a value is a dotted version number.
	 *
	 * @param mixed $value Value.
	 * @return bool
	 */
	private function is_version( $value ) {
		return is_string( $value ) && strlen( $value ) <= 20 && 1 === preg_match( self::VERSION, $value );
	}

	/**
	 * Whether a value is a non-empty string of at most a given length.
	 *
	 * @param mixed $value  Value.
	 * @param int   $length Longest accepted length.
	 * @return bool
	 */
	private function is_text( $value, $length ) {
		return is_string( $value ) && '' !== trim( $value ) && strlen( $value ) <= $length;
	}
}
