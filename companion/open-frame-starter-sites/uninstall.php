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

// What an unfinished import left behind: the copy of the settings it changed
// and its working folder, which only ever holds the package and an index file.
$ofss_state = get_option( 'ofss_import_state' );
if ( is_array( $ofss_state ) && is_string( $ofss_state['id'] ?? null ) && preg_match( '/^[A-Za-z0-9]{1,32}$/', $ofss_state['id'] ) ) {
	delete_option( 'ofss_snapshot_' . $ofss_state['id'] );
}
delete_transient( 'ofss_import_lock' );

$ofss_work = trailingslashit( wp_get_upload_dir()['basedir'] ) . 'open-frame-starter-sites';
foreach ( is_dir( $ofss_work ) ? (array) glob( $ofss_work . '/*', GLOB_ONLYDIR ) : array() as $ofss_run ) {
	foreach ( array( 'package.zip', 'index.php' ) as $ofss_file ) {
		if ( is_file( $ofss_run . '/' . $ofss_file ) ) {
			wp_delete_file( $ofss_run . '/' . $ofss_file );
		}
	}
	if ( ! glob( $ofss_run . '/*' ) ) {
		rmdir( $ofss_run ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- An empty folder this plugin created.
	}
}
if ( is_dir( $ofss_work ) ) {
	if ( is_file( $ofss_work . '/index.php' ) ) {
		wp_delete_file( $ofss_work . '/index.php' );
	}
	if ( ! glob( $ofss_work . '/*' ) ) {
		rmdir( $ofss_work ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- An empty folder this plugin created.
	}
}

foreach ( array( 'ofss_catalog', 'ofss_history', 'ofss_active_site', 'ofss_settings', 'ofss_import_state' ) as $ofss_option ) {
	delete_option( $ofss_option );
}
