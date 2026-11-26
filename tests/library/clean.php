<?php
/**
 * Turns a freshly installed WordPress into the site a new user has just before
 * opening Appearance > Starter Sites: the theme is active, the plugin is
 * active, and nothing else is. Run through tests/env/run.php.
 *
 * @package Open_Frame
 */

// phpcs:disable -- Command-line test helper, never loaded by WordPress.
switch_theme( 'open-frame' );

// What WordPress chooses by itself on a host where pretty permalinks work.
update_option( 'permalink_structure', '/%year%/%monthnum%/%day%/%postname%/' );
flush_rewrite_rules();

deactivate_plugins( array_diff( (array) get_option( 'active_plugins', array() ), array( 'open-frame-starter-sites/open-frame-starter-sites.php' ) ) );
$open_frame_result = activate_plugin( 'open-frame-starter-sites/open-frame-starter-sites.php' );
if ( is_wp_error( $open_frame_result ) ) {
	echo 'The plugin could not be activated: ', $open_frame_result->get_error_message(), "\n";
	exit( 1 );
}

echo wp_json_encode(
	array(
		'wordpress' => get_bloginfo( 'version' ),
		'theme'     => wp_get_theme()->get( 'Name' ) . ' ' . wp_get_theme()->get( 'Version' ),
		'plugins'   => array_values( (array) get_option( 'active_plugins', array() ) ),
		'pages'     => (int) wp_count_posts( 'page' )->publish,
		'posts'     => (int) wp_count_posts( 'post' )->publish,
	)
), "\n";
