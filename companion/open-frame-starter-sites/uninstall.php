<?php
/**
 * Removes the plugin's own settings and the font files it stored. Pages,
 * posts and images on the site are never touched.
 *
 * @package OpenFrame\StarterSites
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Font files of imported designs: only this plugin can serve them.
$ofss_fonts = get_option( 'ofss_fonts' );
$ofss_dir   = trailingslashit( wp_get_upload_dir()['basedir'] ) . 'open-frame-fonts';
foreach ( is_array( $ofss_fonts ) ? $ofss_fonts : array() as $ofss_font ) {
	if ( is_array( $ofss_font ) && is_string( $ofss_font['file'] ?? null ) && preg_match( '/^[a-f0-9]{64}\.woff2$/', $ofss_font['file'] ) ) {
		wp_delete_file( $ofss_dir . '/' . $ofss_font['file'] );
	}
}
if ( is_dir( $ofss_dir ) && ! glob( $ofss_dir . '/*' ) ) {
	rmdir( $ofss_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- An empty folder this plugin created.
}
delete_option( 'ofss_fonts' );

foreach ( array( 'ofss_catalog', 'ofss_history', 'ofss_active_site', 'ofss_settings', 'ofss_import_state' ) as $ofss_option ) {
	delete_option( $ofss_option );
}
