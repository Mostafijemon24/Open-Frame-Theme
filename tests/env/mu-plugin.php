<?php
/**
 * Test double for a plugin that takes over theme locations.
 *
 * Copied to wp-content/mu-plugins by tests/env/setup.sh. It does nothing
 * unless the option `oft_fake_locations` holds a comma-separated list of
 * locations, optionally prefixed with a mode:
 *
 *   "header,footer"          answers the theme's own location filters
 *   "elementor:single"       defines elementor_theme_do_location(), the
 *                            function Elementor Pro's Theme Builder provides
 *
 * @package Open_Frame
 */

// phpcs:disable -- Test helper, only ever installed in the disposable test site.

// The mock starter site library runs on another local port. WordPress refuses
// such addresses for safety; the test site allows exactly that one.
if ( defined( 'OFSS_API_BASE' ) && 'localhost' === wp_parse_url( OFSS_API_BASE, PHP_URL_HOST ) ) {
	add_filter(
		'http_request_host_is_external',
		function ( $external, $host ) {
			return $external || 'localhost' === $host;
		},
		10,
		2
	);
	add_filter(
		'http_allowed_safe_ports',
		function ( $ports ) {
			$ports[] = (int) wp_parse_url( OFSS_API_BASE, PHP_URL_PORT );
			return $ports;
		}
	);
}

// Behind a proxy that re-signs HTTPS, trust the proxy's certificate bundle.
if ( defined( 'OFT_CA_BUNDLE' ) && OFT_CA_BUNDLE && is_readable( OFT_CA_BUNDLE ) ) {
	add_filter(
		'http_request_args',
		function ( $args, $url ) {
			$args['sslcertificates'] = OFT_CA_BUNDLE;

			// Behind such a proxy there is often no DNS on the machine itself, and
			// WordPress's "safe URL" check needs to resolve the host. Skip that
			// check for WordPress.org, and for a library on the internet that the
			// site was set up to read; the proxy does the resolving.
			$open_frame_hosts = array( 'api.wordpress.org', 'downloads.wordpress.org' );
			if ( defined( 'OFT_LIBRARY_HOST' ) && OFT_LIBRARY_HOST ) {
				$open_frame_hosts = array_merge( $open_frame_hosts, explode( ',', OFT_LIBRARY_HOST ) );
			}
			if ( in_array( wp_parse_url( $url, PHP_URL_HOST ), $open_frame_hosts, true ) ) {
				$args['reject_unsafe_urls'] = false;
			}

			return $args;
		},
		10,
		2
	);
}
$open_frame_fake = (string) get_option( 'oft_fake_locations', '' );
if ( '' === $open_frame_fake ) {
	return;
}

if ( 0 === strpos( $open_frame_fake, 'elementor:' ) ) {
	$GLOBALS['open_frame_fake_locations'] = explode( ',', substr( $open_frame_fake, 10 ) );

	function elementor_theme_do_location( $location ) {
		if ( ! in_array( $location, $GLOBALS['open_frame_fake_locations'], true ) ) {
			return false;
		}
		echo '<div class="oft-fake-location" data-source="elementor" data-location="' . esc_attr( $location ) . '">Replaced ' . esc_html( $location ) . '</div>';
		return true;
	}
	return;
}

$GLOBALS['open_frame_fake_locations'] = explode( ',', $open_frame_fake );

add_filter(
	'open_frame_has_location',
	function ( $has, $location ) {
		return $has || in_array( $location, $GLOBALS['open_frame_fake_locations'], true );
	},
	10,
	2
);

add_filter(
	'open_frame_do_location',
	function ( $done, $location ) {
		if ( $done || ! in_array( $location, $GLOBALS['open_frame_fake_locations'], true ) ) {
			return $done;
		}
		echo '<div class="oft-fake-location" data-source="filter" data-location="' . esc_attr( $location ) . '">Replaced ' . esc_html( $location ) . '</div>';
		return true;
	},
	10,
	2
);
