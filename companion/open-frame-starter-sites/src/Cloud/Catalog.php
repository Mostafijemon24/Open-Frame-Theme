<?php
/**
 * The list of starter sites, with caching.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Cloud;

use OpenFrame\StarterSites\Config;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Keeps a validated copy of the catalog and refreshes it when it is old.
 *
 * The copy lives in an option rather than a transient on purpose: when the
 * library cannot be reached, the last good list is still shown.
 */
class Catalog {

	const OPTION = 'ofss_catalog';

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
	 * Get the catalog.
	 *
	 * @param bool $refresh Ask the library even when the saved copy is fresh.
	 * @return array|WP_Error {
	 *     @type array    $catalog    Normalized catalog (see CatalogValidator::validate()).
	 *     @type int      $fetched_at When the copy was last confirmed, as a Unix timestamp.
	 *     @type bool     $stale      True when the library could not be reached and a saved copy is shown.
	 *     @type WP_Error $error      Why the refresh failed (only when stale).
	 * }
	 */
	public function get( $refresh = false ) {
		$saved = $this->saved();

		if ( $saved && ! $refresh && ( time() - $saved['fetched_at'] ) < Config::CATALOG_TTL ) {
			return array(
				'catalog'    => $saved['catalog'],
				'fetched_at' => $saved['fetched_at'],
				'stale'      => false,
			);
		}

		$response = $this->client->get_json( '/catalog.json', $saved ? $saved['etag'] : '' );

		if ( ! is_wp_error( $response ) && ! empty( $response['not_modified'] ) && $saved ) {
			$saved['fetched_at'] = time();
			$this->save( $saved );

			return array(
				'catalog'    => $saved['catalog'],
				'fetched_at' => $saved['fetched_at'],
				'stale'      => false,
			);
		}

		$catalog = is_wp_error( $response ) ? $response : $this->read( $response['data'] ?? null );

		if ( is_wp_error( $catalog ) ) {
			if ( ! $saved ) {
				return $catalog;
			}

			return array(
				'catalog'    => $saved['catalog'],
				'fetched_at' => $saved['fetched_at'],
				'stale'      => true,
				'error'      => $catalog,
			);
		}

		$fresh = array(
			'catalog'    => $catalog,
			'etag'       => (string) $response['etag'],
			'fetched_at' => time(),
			'source'     => $this->config->api_base(),
		);
		$this->save( $fresh );

		return array(
			'catalog'    => $catalog,
			'fetched_at' => $fresh['fetched_at'],
			'stale'      => false,
		);
	}

	/**
	 * Verify the signature of a downloaded catalog, then validate what it says.
	 *
	 * @param mixed $envelope Decoded response.
	 * @return array|WP_Error Normalized catalog.
	 */
	private function read( $envelope ) {
		$signed = ( new Signature( $this->config ) )->open( $envelope );
		if ( is_wp_error( $signed ) ) {
			return $signed;
		}

		return ( new CatalogValidator( $this->config ) )->validate( json_decode( $signed, true ) );
	}

	/**
	 * Find one site in the catalog.
	 *
	 * @param string $id Site ID.
	 * @return array|WP_Error
	 */
	public function find( $id ) {
		$result = $this->get();
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		foreach ( $result['catalog']['sites'] as $site ) {
			if ( $site['id'] === $id ) {
				return $site;
			}
		}

		return new WP_Error( 'ofss_unknown_site', __( 'That starter site is not in the library.', 'open-frame-starter-sites' ), array( 'status' => 404 ) );
	}

	/**
	 * The saved copy, if it came from the library in use.
	 *
	 * @return array|null
	 */
	private function saved() {
		$saved = get_option( self::OPTION );

		if ( ! is_array( $saved )
			|| ! isset( $saved['catalog']['sites'], $saved['fetched_at'], $saved['etag'], $saved['source'] )
			|| $saved['source'] !== $this->config->api_base()
		) {
			return null;
		}

		return $saved;
	}

	/**
	 * Save a copy without loading it on every request.
	 *
	 * @param array $data Copy to save.
	 * @return void
	 */
	private function save( array $data ) {
		update_option( self::OPTION, $data, false );
	}
}
