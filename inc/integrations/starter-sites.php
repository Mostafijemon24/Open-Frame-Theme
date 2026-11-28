<?php
/**
 * The companion plugin, Open Frame Starter Sites: what the theme knows about
 * it, and its registration as a recommended plugin.
 *
 * The plugin is optional. The theme works the same without it, installs
 * nothing by itself and activates nothing by itself. This file:
 *
 * - tells where the plugin stands on the site (not installed, inactive, active);
 * - registers it as a recommended (not required) plugin with the bundled
 *   TGM Plugin Activation library, which adds the screen
 *   Appearance > Recommended Plugins.
 *
 * The notice that offers the plugin is in starter-sites-notice.php.
 *
 * The plugin is installed from the WordPress.org Plugin Directory only, by
 * WordPress's own installer, and only when the user clicks. No ZIP file is
 * bundled and no other download address is configured.
 *
 * Which plugin is recommended is set in functions.php. While the slug there
 * is still the placeholder, everything here and in the notice stays switched off.
 *
 * @package Open_Frame
 * @since   1.2.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Slug of the companion plugin in the WordPress.org Plugin Directory.
 *
 * @since 1.2.0
 *
 * @return string The slug, or an empty string while it is not known.
 */
function open_frame_starter_plugin_slug() {
	$slug = defined( 'OPEN_FRAME_STARTER_PLUGIN_SLUG' ) ? OPEN_FRAME_STARTER_PLUGIN_SLUG : '';

	// A directory slug is lowercase letters, digits and single hyphens. The
	// placeholder in functions.php is not, so it reads as "not known yet".
	if ( ! is_string( $slug ) || ! preg_match( '/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug ) ) {
		return '';
	}

	return $slug;
}

/**
 * Name of the companion plugin.
 *
 * @since 1.2.0
 *
 * @return string
 */
function open_frame_starter_plugin_name() {
	return defined( 'OPEN_FRAME_STARTER_PLUGIN_NAME' ) && is_string( OPEN_FRAME_STARTER_PLUGIN_NAME ) && '' !== OPEN_FRAME_STARTER_PLUGIN_NAME
		? OPEN_FRAME_STARTER_PLUGIN_NAME
		: 'Open Frame Starter Sites';
}

/**
 * Main file of the companion plugin as it is installed on this site.
 *
 * @since 1.2.0
 *
 * @return string Path relative to the plugins folder, or an empty string when the plugin is not installed.
 */
function open_frame_starter_plugin_file() {
	$slug = open_frame_starter_plugin_slug();
	if ( '' === $slug ) {
		return '';
	}

	if ( ! function_exists( 'get_plugins' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	// A plugin from the directory is installed in a folder named after its slug.
	$files = array_keys( get_plugins( '/' . $slug ) );

	return $files ? $slug . '/' . $files[0] : '';
}

/**
 * Where the companion plugin stands on this site.
 *
 * @since 1.2.0
 *
 * @return string `pending` (no directory slug yet), `not-installed`, `inactive` or `active`.
 */
function open_frame_starter_plugin_status() {
	if ( '' === open_frame_starter_plugin_slug() ) {
		return 'pending';
	}

	$file = open_frame_starter_plugin_file();
	if ( '' === $file ) {
		return 'not-installed';
	}

	return is_plugin_active( $file ) ? 'active' : 'inactive';
}

/**
 * Address of the companion plugin's page in the WordPress.org Plugin Directory.
 *
 * @since 1.2.0
 *
 * @return string
 */
function open_frame_starter_plugin_directory_url() {
	return 'https://wordpress.org/plugins/' . open_frame_starter_plugin_slug() . '/';
}

/**
 * Address of the companion plugin's own screen, Appearance > Starter Sites.
 *
 * @since 1.2.0
 *
 * @return string The address, or an empty string when the screen does not exist for this user.
 */
function open_frame_starter_plugin_screen_url() {
	$page = 'open-frame-starter-sites';

	// WordPress registers the screen only for users who may open it.
	if ( ! has_action( get_plugin_page_hookname( $page, 'themes.php' ) ) ) {
		return '';
	}

	return admin_url( 'themes.php?page=' . $page );
}

/*
 * The bundled TGM Plugin Activation library: admin screens only, and only
 * once there is a plugin in the directory to recommend.
 */
if ( is_admin() && '' !== open_frame_starter_plugin_slug() ) {
	open_frame_require( 'inc/tgmpa/class-tgm-plugin-activation.php' );
}

/**
 * Register the recommended plugin with TGM Plugin Activation.
 *
 * @since 1.2.0
 *
 * @return void
 */
function open_frame_register_recommended_plugins() {
	$slug = open_frame_starter_plugin_slug();
	if ( '' === $slug ) {
		return;
	}

	$plugins = array(
		array(
			'name'               => open_frame_starter_plugin_name(),
			'slug'               => $slug, // From the WordPress.org Plugin Directory; no `source`, so no other download.
			'required'           => false, // Recommended only.
			'force_activation'   => false,
			'force_deactivation' => false,
		),
	);

	$config = array(
		'id'           => 'open-frame',
		'menu'         => 'open-frame-recommended-plugins',
		'parent_slug'  => 'themes.php',
		'capability'   => 'edit_theme_options',
		'has_notices'  => false, // The theme shows one notice of its own: starter-sites-notice.php.
		'dismissable'  => true,
		'is_automatic' => false, // Installing does not activate; activating is a second click.
		'strings'      => array(
			'page_title' => __( 'Recommended Plugins', 'open-frame' ),
			'menu_title' => __( 'Recommended Plugins', 'open-frame' ),
		),
	);

	tgmpa( $plugins, $config );
}
add_action( 'tgmpa_register', 'open_frame_register_recommended_plugins' );

/**
 * Address that installs the companion plugin through the Recommended Plugins screen.
 *
 * Used when the button in the notice cannot do the work in place: without
 * JavaScript, and when WordPress has to ask for FTP details first.
 *
 * @since 1.2.0
 *
 * @return string
 */
function open_frame_starter_plugin_install_url() {
	if ( ! isset( $GLOBALS['tgmpa'] ) || ! is_object( $GLOBALS['tgmpa'] ) || ! method_exists( $GLOBALS['tgmpa'], 'get_tgmpa_url' ) ) {
		return '';
	}

	$url = add_query_arg(
		array(
			'plugin'        => rawurlencode( open_frame_starter_plugin_slug() ),
			'tgmpa-install' => 'install-plugin',
		),
		$GLOBALS['tgmpa']->get_tgmpa_url()
	);

	return wp_nonce_url( $url, 'tgmpa-install', 'tgmpa-nonce' );
}
