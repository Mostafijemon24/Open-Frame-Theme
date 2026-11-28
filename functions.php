<?php
/**
 * Open Frame functions and definitions.
 *
 * Branding constants and the theme bootstrap are centralized here.
 *
 * @package Open_Frame
 * @since   0.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'OPEN_FRAME_VERSION', '1.2.0' );
define( 'OPEN_FRAME_DIR', get_template_directory() );
define( 'OPEN_FRAME_URI', get_template_directory_uri() );

/*
 * The companion plugin the theme recommends: Open Frame Starter Sites
 * (see inc/integrations/starter-sites.php).
 *
 * PENDING. The plugin is not in the WordPress.org Plugin Directory yet, so its
 * slug there is not known. When WordPress.org has approved the plugin, replace
 * the placeholder below with the slug it was given: the last part of the
 * plugin's address, https://wordpress.org/plugins/<slug>/. If the reviewers
 * changed the plugin's name, change the name as well.
 *
 * While the placeholder stands, the theme recommends nothing, shows no notice
 * and does not load the plugin installer.
 */
if ( ! defined( 'OPEN_FRAME_STARTER_PLUGIN_SLUG' ) ) {
	define( 'OPEN_FRAME_STARTER_PLUGIN_SLUG', 'REPLACE_WITH_ACTUAL_APPROVED_WORDPRESS_ORG_SLUG' );
}
if ( ! defined( 'OPEN_FRAME_STARTER_PLUGIN_NAME' ) ) {
	define( 'OPEN_FRAME_STARTER_PLUGIN_NAME', 'Open Frame Starter Sites' );
}

/**
 * Load a theme include file.
 *
 * @param string $relative Relative path from the theme root.
 * @return void
 */
function open_frame_require( $relative ) {
	$path = OPEN_FRAME_DIR . '/' . ltrim( $relative, '/' );
	if ( is_readable( $path ) ) {
		require_once $path;
	}
}

open_frame_require( 'inc/hooks.php' );
open_frame_require( 'inc/setup.php' );
open_frame_require( 'inc/enqueue.php' );
open_frame_require( 'inc/template-tags.php' );
open_frame_require( 'inc/template-functions.php' );
open_frame_require( 'inc/class-open-frame-walker-nav-menu.php' );
open_frame_require( 'inc/customizer/sanitize.php' );
open_frame_require( 'inc/customizer/customizer.php' );
open_frame_require( 'inc/customizer/dynamic-css.php' );
open_frame_require( 'inc/header-builder.php' );
open_frame_require( 'inc/footer-builder.php' );
open_frame_require( 'inc/blocks.php' );
open_frame_require( 'inc/integrations/elementor.php' );
open_frame_require( 'inc/integrations/woocommerce.php' );
open_frame_require( 'inc/integrations/starter-sites.php' );
open_frame_require( 'inc/integrations/starter-sites-notice.php' );
