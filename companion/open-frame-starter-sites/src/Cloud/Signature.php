<?php
/**
 * Verification of signed documents from the library.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Cloud;

use OpenFrame\StarterSites\Config;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Opens a signed envelope (see schemas/envelope.schema.json).
 *
 * The catalog is the only thing the plugin trusts on sight, and only because
 * it is signed with a key whose public half ships with the plugin. Whoever
 * controls the server, the storage or the connection, but not the signing
 * key, cannot change what the plugin shows or downloads.
 */
class Signature {

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
	 * The signed text of an envelope, when a known key signed it.
	 *
	 * @param mixed $envelope Decoded envelope.
	 * @return string|WP_Error The signed JSON text.
	 */
	public function open( $envelope ) {
		$refused = new WP_Error( 'ofss_bad_signature', __( 'The list of designs could not be verified, so it was not used. Please try again later.', 'open-frame-starter-sites' ) );

		if ( ! is_array( $envelope ) || ! isset( $envelope['signed'], $envelope['signatures'] ) || ! is_string( $envelope['signed'] ) || ! is_array( $envelope['signatures'] ) ) {
			return $refused;
		}

		$keys = $this->config->public_keys();

		foreach ( $envelope['signatures'] as $signature ) {
			if ( ! is_array( $signature )
				|| 'ed25519' !== ( $signature['alg'] ?? '' )
				|| ! is_string( $signature['key'] ?? null )
				|| ! is_string( $signature['sig'] ?? null )
				|| ! isset( $keys[ $signature['key'] ] )
			) {
				continue;
			}

			// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode -- Signatures and keys are binary values in base64.
			$raw_signature = base64_decode( $signature['sig'], true );
			$raw_key       = base64_decode( $keys[ $signature['key'] ], true );
			// phpcs:enable

			if ( ! is_string( $raw_signature ) || ! is_string( $raw_key ) || SODIUM_CRYPTO_SIGN_BYTES !== strlen( $raw_signature ) || SODIUM_CRYPTO_SIGN_PUBLICKEYBYTES !== strlen( $raw_key ) ) {
				continue;
			}

			try {
				if ( sodium_crypto_sign_verify_detached( $raw_signature, $envelope['signed'], $raw_key ) ) {
					return $envelope['signed'];
				}
			} catch ( \Exception $exception ) {
				continue;
			}
		}

		return $refused;
	}
}
