<?php
/**
 * HTTP client for the starter site library.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Cloud;

use OpenFrame\StarterSites\Config;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Reads JSON from the library API. Read-only, no credentials, no site data.
 */
class Client {

	/**
	 * Largest response the client accepts, in bytes.
	 */
	const MAX_BYTES = 1048576;

	/**
	 * Attempts made before a request counts as failed.
	 */
	const ATTEMPTS = 3;

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
	 * Fetch a JSON document from the library.
	 *
	 * @param string $path Path below the API base, for example "/catalog.json".
	 * @param string $etag ETag of the copy already held, to allow a "not modified" answer.
	 * @return array|WP_Error {
	 *     @type bool   $not_modified True when the held copy is still current.
	 *     @type array  $data         Decoded JSON (absent when not modified).
	 *     @type string $etag         ETag of the response.
	 * }
	 */
	public function get_json( $path, $etag = '' ) {
		$response = $this->get( $this->config->api_base() . '/' . ltrim( $path, '/' ), $etag );
		if ( is_wp_error( $response ) || $response['not_modified'] ) {
			return $response;
		}

		$data = json_decode( $response['body'], true );
		if ( ! is_array( $data ) ) {
			return new WP_Error( 'ofss_bad_response', __( 'The starter site library sent an answer that could not be read.', 'open-frame-starter-sites' ) );
		}

		return array(
			'not_modified' => false,
			'data'         => $data,
			'etag'         => $response['etag'],
		);
	}

	/**
	 * Fetch a small text document from one of the library's hosts.
	 *
	 * Temporary failures (no connection, HTTP 429 and 5xx) are tried again
	 * after a short pause.
	 *
	 * @param string $url  Full address. Refused unless it is on the library's hosts.
	 * @param string $etag ETag of the copy already held.
	 * @return array|WP_Error {
	 *     @type bool   $not_modified True when the held copy is still current.
	 *     @type string $body         Response body (absent when not modified).
	 *     @type string $etag         ETag of the response.
	 * }
	 */
	public function get( $url, $etag = '' ) {
		if ( 0 !== strpos( $url, $this->config->api_base() . '/' ) && ! $this->config->is_allowed_url( $url ) ) {
			return new WP_Error( 'ofss_foreign_url', __( 'The starter site library pointed to an address that is not its own, so it was not used.', 'open-frame-starter-sites' ) );
		}

		$headers = array( 'Accept' => 'application/json' );
		if ( '' !== $etag ) {
			$headers['If-None-Match'] = $etag;
		}

		$error = new WP_Error( 'ofss_unreachable', __( 'The starter site library could not be reached.', 'open-frame-starter-sites' ) );

		for ( $attempt = 1; $attempt <= self::ATTEMPTS; $attempt++ ) {
			if ( $attempt > 1 ) {
				// 0.4 s, then 1.2 s: enough for a hiccup without stalling the screen.
				usleep( (int) ( 400000 * ( 3 ** ( $attempt - 2 ) ) ) );
			}

			$response = wp_safe_remote_get(
				$url,
				array(
					'timeout'             => 8,
					'redirection'         => 2,
					'headers'             => $headers,
					'limit_response_size' => self::MAX_BYTES,
					// Identifies the plugin only. The default WordPress agent would add the site address.
					'user-agent'          => 'OpenFrameStarterSites/' . OFSS_VERSION,
				)
			);

			if ( is_wp_error( $response ) ) {
				$error = new WP_Error( 'ofss_unreachable', __( 'The starter site library could not be reached. Check that your server can make outgoing HTTPS requests.', 'open-frame-starter-sites' ), $response->get_error_message() );
				continue;
			}

			$status = (int) wp_remote_retrieve_response_code( $response );

			if ( 304 === $status ) {
				return array(
					'not_modified' => true,
					'etag'         => $etag,
				);
			}

			if ( 429 === $status || $status >= 500 ) {
				/* translators: %d: HTTP status code. */
				$error = new WP_Error( 'ofss_server_error', sprintf( __( 'The starter site library is having trouble right now (error %d). Please try again in a few minutes.', 'open-frame-starter-sites' ), $status ) );
				continue;
			}

			if ( 200 !== $status ) {
				/* translators: %d: HTTP status code. */
				return new WP_Error( 'ofss_bad_status', sprintf( __( 'The starter site library answered with an unexpected error (%d).', 'open-frame-starter-sites' ), $status ) );
			}

			$body = wp_remote_retrieve_body( $response );
			if ( ! is_string( $body ) || '' === $body || strlen( $body ) >= self::MAX_BYTES ) {
				return new WP_Error( 'ofss_bad_response', __( 'The starter site library sent an answer that could not be read.', 'open-frame-starter-sites' ) );
			}

			return array(
				'not_modified' => false,
				'body'         => $body,
				'etag'         => (string) wp_remote_retrieve_header( $response, 'etag' ),
			);
		}

		return $error;
	}
}
