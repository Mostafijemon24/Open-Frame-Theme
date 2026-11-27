<?php
/**
 * Plugin settings that are not stored in the database.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites;

defined( 'ABSPATH' ) || exit;

/**
 * Where the library lives, who may use it and what the plugin can read.
 */
class Config {

	/**
	 * REST namespace of the plugin.
	 */
	const REST_NAMESPACE = 'open-frame-starter-sites/v1';

	/**
	 * Highest catalog and package format this version understands.
	 */
	const FORMAT = 1;

	/**
	 * Default address of the library API.
	 */
	const DEFAULT_API_BASE = 'https://api.buildbetters.com/v1';

	/**
	 * Hosts that serve preview images and packages for the default library.
	 */
	const DEFAULT_ASSET_HOSTS = array( 'api.buildbetters.com', 'cdn.buildbetters.com' );

	/**
	 * Public keys of the library, by key ID (see tools/library.mjs keygen).
	 *
	 * The catalog must be signed with the private half of one of these; a list
	 * of designs signed with any other key is refused. To replace a key, add the
	 * new one beside the old one and release, then sign with both for a while.
	 */
	const PUBLIC_KEYS = array(
		'135200d7' => 'oQdItC/+hV9UnQRbn3nRipk+89gfuMpFrbwpYvBNUVE=',
	);

	/**
	 * How long a downloaded catalog counts as fresh, in seconds.
	 */
	const CATALOG_TTL = 12 * HOUR_IN_SECONDS;

	/**
	 * Slug of the theme the starter sites are made for.
	 */
	const THEME = 'open-frame';

	/**
	 * Capability needed to use the Starter Sites screen and its REST routes.
	 *
	 * @return string
	 */
	public function capability() {
		/**
		 * Filters the capability needed to use Starter Sites.
		 *
		 * @since 0.1.0
		 *
		 * @param string $capability Capability name. Default 'manage_options'.
		 */
		return (string) apply_filters( 'ofss_capability', 'manage_options' );
	}

	/**
	 * Address of the library API, without a trailing slash.
	 *
	 * `OFSS_API_BASE` in wp-config.php replaces the default, for staging or a
	 * self-hosted library. An address that is not acceptable (see
	 * is_allowed_url()) is ignored.
	 *
	 * @return string
	 */
	public function api_base() {
		if ( defined( 'OFSS_API_BASE' ) && is_string( OFSS_API_BASE ) ) {
			$base = untrailingslashit( OFSS_API_BASE );
			if ( $this->is_acceptable_scheme( $base ) ) {
				return $base;
			}
		}

		return self::DEFAULT_API_BASE;
	}

	/**
	 * Public keys a catalog may be signed with: key ID => raw key in base64.
	 *
	 * While developing against a local library (see api_base()), `OFSS_PUBLIC_KEYS`
	 * in wp-config.php supplies the keys of that library. On a live site the
	 * keys that ship with the plugin cannot be replaced.
	 *
	 * @return array<string,string>
	 */
	public function public_keys() {
		if ( defined( 'OFSS_PUBLIC_KEYS' ) && is_array( OFSS_PUBLIC_KEYS ) && self::DEFAULT_API_BASE !== $this->api_base() && in_array( wp_get_environment_type(), array( 'local', 'development' ), true ) ) {
			return array_filter( OFSS_PUBLIC_KEYS, 'is_string' );
		}

		return self::PUBLIC_KEYS;
	}

	/**
	 * Hosts (with port, when one is given) that may serve images and packages.
	 *
	 * @return string[]
	 */
	public function asset_hosts() {
		$base  = $this->api_base();
		$hosts = self::DEFAULT_API_BASE === $base ? self::DEFAULT_ASSET_HOSTS : array( $this->host_of( $base ) );

		/**
		 * Filters the hosts that may serve preview images and packages.
		 *
		 * @since 0.1.0
		 *
		 * @param string[] $hosts    Host names, with ":port" when not the default port.
		 * @param string   $api_base Address of the library API.
		 */
		return array_values( array_filter( (array) apply_filters( 'ofss_asset_hosts', $hosts, $base ) ) );
	}

	/**
	 * Whether a URL from the catalog may be used for an image or a download.
	 *
	 * @param string $url URL to check.
	 * @return bool
	 */
	public function is_allowed_url( $url ) {
		return is_string( $url )
			&& $this->is_acceptable_scheme( $url )
			&& in_array( $this->host_of( $url ), $this->asset_hosts(), true );
	}

	/**
	 * Whether a URL is a plain HTTPS link (used for links that only open in the browser).
	 *
	 * @param string $url URL to check.
	 * @return bool
	 */
	public function is_https_url( $url ) {
		return is_string( $url ) && 'https' === wp_parse_url( $url, PHP_URL_SCHEME ) && (bool) wp_parse_url( $url, PHP_URL_HOST );
	}

	/**
	 * HTTPS everywhere; plain HTTP only for a library on this machine while developing.
	 *
	 * @param string $url URL to check.
	 * @return bool
	 */
	private function is_acceptable_scheme( $url ) {
		$scheme = wp_parse_url( $url, PHP_URL_SCHEME );
		$host   = wp_parse_url( $url, PHP_URL_HOST );

		if ( ! $host ) {
			return false;
		}
		if ( 'https' === $scheme ) {
			return true;
		}

		return 'http' === $scheme
			&& in_array( $host, array( 'localhost', '127.0.0.1' ), true )
			&& in_array( wp_get_environment_type(), array( 'local', 'development' ), true );
	}

	/**
	 * Host of a URL, with the port when there is one.
	 *
	 * @param string $url URL.
	 * @return string
	 */
	private function host_of( $url ) {
		$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
		$port = wp_parse_url( $url, PHP_URL_PORT );

		return $port ? $host . ':' . $port : $host;
	}
}
