<?php
/**
 * Manifest of one starter site version.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Cloud;

use OpenFrame\StarterSites\Config;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Downloads a manifest and accepts it only when it is the exact file the
 * signed catalog names (same SHA-256) and everything in it points at the
 * library's own hosts.
 */
class Manifest {

	/**
	 * Library client.
	 *
	 * @var Client
	 */
	private $client;

	/**
	 * Plugin configuration.
	 *
	 * @var Config
	 */
	private $config;

	/**
	 * Constructor.
	 *
	 * @param Client $client Library client.
	 * @param Config $config Plugin configuration.
	 */
	public function __construct( Client $client, Config $config ) {
		$this->client = $client;
		$this->config = $config;
	}

	/**
	 * Fetch and verify the manifest of a site from the catalog.
	 *
	 * @param array $site Normalized catalog entry.
	 * @return array|WP_Error Manifest with `package`, `media`, `fonts`, `files`, `pages` and `widgets`.
	 */
	public function fetch( array $site ) {
		$damaged = new WP_Error( 'ofss_bad_manifest', __( 'The download for this design is damaged or was altered, so it was not used. Please try again later.', 'open-frame-starter-sites' ) );

		if ( empty( $site['manifest']['url'] ) || empty( $site['manifest']['sha256'] ) ) {
			return new WP_Error( 'ofss_no_manifest', __( 'This design cannot be imported yet.', 'open-frame-starter-sites' ) );
		}

		$response = $this->client->get( $site['manifest']['url'] );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		if ( ! hash_equals( $site['manifest']['sha256'], hash( 'sha256', $response['body'] ) ) ) {
			return $damaged;
		}

		$raw = json_decode( $response['body'], true );
		if ( ! is_array( $raw )
			|| ( $raw['id'] ?? null ) !== $site['id']
			|| ( $raw['version'] ?? null ) !== $site['version']
			|| ! is_int( $raw['format'] ?? null )
			|| ! $this->is_file( $raw['package'] ?? null )
			|| ! is_array( $raw['files'] ?? null )
			|| ! is_array( $raw['pages'] ?? null )
		) {
			return $damaged;
		}

		if ( $raw['format'] > Config::FORMAT ) {
			return new WP_Error( 'ofss_newer_package', __( 'This design needs a newer version of the Open Frame Starter Sites plugin. Update the plugin, then come back.', 'open-frame-starter-sites' ) );
		}

		$manifest = array(
			'id'      => $site['id'],
			'version' => $site['version'],
			'format'  => $raw['format'],
			'package' => $this->file( $raw['package'] ),
			'files'   => array(),
			'pages'   => array(),
			'media'   => array(),
			'fonts'   => array(),
			'widgets' => array(),
		);

		foreach ( $raw['files'] as $name => $file ) {
			if ( ! is_string( $name ) || ! preg_match( '#^[A-Za-z0-9._/-]+\.(json|md)$#', $name ) || false !== strpos( $name, '..' ) || '/' === $name[0]
				|| ! is_array( $file ) || ! $this->is_sha256( $file['sha256'] ?? null ) || ! is_int( $file['bytes'] ?? null ) ) {
				return $damaged;
			}
			$manifest['files'][ $name ] = array(
				'sha256' => $file['sha256'],
				'bytes'  => $file['bytes'],
			);
		}

		foreach ( $raw['pages'] as $page ) {
			if ( ! is_array( $page ) || ! is_string( $page['uid'] ?? null ) || ! preg_match( '/^[a-z0-9-]+:[a-z-]+:[a-z0-9-]+$/', $page['uid'] ) ) {
				return $damaged;
			}
			$manifest['pages'][] = array(
				'uid'        => $page['uid'],
				'title'      => sanitize_text_field( (string) ( $page['title'] ?? '' ) ),
				'front_page' => ! empty( $page['front_page'] ),
			);
		}

		foreach ( array( 'media', 'fonts' ) as $kind ) {
			foreach ( (array) ( $raw[ $kind ] ?? array() ) as $item ) {
				if ( ! $this->is_file( $item ) ) {
					return $damaged;
				}
				$clean = $this->file( $item );
				if ( 'media' === $kind ) {
					if ( ! is_string( $item['uid'] ?? null ) || ! preg_match( '/^[a-z0-9-]+$/', $item['uid'] ) || ! in_array( $item['mime'] ?? '', array( 'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif' ), true ) ) {
						return $damaged;
					}
					$clean += array(
						'uid'    => $item['uid'],
						'mime'   => $item['mime'],
						'width'  => (int) ( $item['width'] ?? 0 ),
						'height' => (int) ( $item['height'] ?? 0 ),
						'alt'    => sanitize_text_field( (string) ( $item['alt'] ?? '' ) ),
					);
				} else {
					$clean += array(
						'family' => sanitize_text_field( (string) ( $item['family'] ?? '' ) ),
						'weight' => sanitize_text_field( (string) ( $item['weight'] ?? '400' ) ),
						'style'  => 'italic' === ( $item['style'] ?? '' ) ? 'italic' : 'normal',
					);
				}
				$manifest[ $kind ][] = $clean;
			}
		}

		foreach ( (array) ( $raw['requires']['elementor']['widgets'] ?? array() ) as $widget ) {
			if ( is_string( $widget ) && preg_match( '/^[a-z0-9_-]+$/', $widget ) ) {
				$manifest['widgets'][] = $widget;
			}
		}

		return $manifest;
	}

	/**
	 * Whether a value describes a downloadable file on the library's hosts.
	 *
	 * @param mixed $file Value.
	 * @return bool
	 */
	private function is_file( $file ) {
		return is_array( $file )
			&& $this->config->is_allowed_url( $file['url'] ?? null )
			&& $this->is_sha256( $file['sha256'] ?? null )
			&& is_int( $file['bytes'] ?? null )
			&& $file['bytes'] > 0;
	}

	/**
	 * The trusted fields of a file description.
	 *
	 * @param array $file File description.
	 * @return array
	 */
	private function file( array $file ) {
		return array(
			'url'    => esc_url_raw( $file['url'] ),
			'sha256' => $file['sha256'],
			'bytes'  => $file['bytes'],
		);
	}

	/**
	 * Whether a value is a SHA-256 in lowercase hex.
	 *
	 * @param mixed $value Value.
	 * @return bool
	 */
	private function is_sha256( $value ) {
		return is_string( $value ) && 1 === preg_match( '/^[a-f0-9]{64}$/', $value );
	}
}
