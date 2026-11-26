<?php
/**
 * Removes the plugin's own settings. Content on the site is never touched.
 *
 * @package OpenFrame\StarterSites
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

foreach ( array( 'ofss_catalog', 'ofss_history', 'ofss_active_site', 'ofss_settings', 'ofss_import_state' ) as $ofss_option ) {
	delete_option( $ofss_option );
}
