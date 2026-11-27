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

// What WordPress chooses by itself on a host where pretty permalinks work, or,
// with the argument "plain", what it falls back to where they do not.
update_option( 'permalink_structure', in_array( 'plain', $open_frame_args, true ) ? '' : '/%year%/%monthnum%/%day%/%postname%/' );
flush_rewrite_rules();

// With the argument "existing": a site somebody has already worked on, with a
// page as its front page, a blog page, a menu in the header and a published post.
if ( in_array( 'existing', $open_frame_args, true ) ) {
	$open_frame_front = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'Welcome to my site', 'post_name' => 'welcome', 'post_content' => '<p>My own home page.</p>' ) );
	$open_frame_blog  = wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'My news', 'post_name' => 'my-news' ) );
	wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => 'About', 'post_name' => 'about', 'post_content' => '<p>My own about page.</p>' ) );
	wp_insert_post( array( 'post_type' => 'post', 'post_status' => 'publish', 'post_title' => 'My first article', 'post_content' => '<p>Written before any design was imported.</p>' ) );
	update_option( 'show_on_front', 'page' );
	update_option( 'page_on_front', $open_frame_front );
	update_option( 'page_for_posts', $open_frame_blog );

	$open_frame_menu = wp_create_nav_menu( 'My menu' );
	wp_update_nav_menu_item( $open_frame_menu, 0, array( 'menu-item-title' => 'Welcome', 'menu-item-object' => 'page', 'menu-item-object-id' => $open_frame_front, 'menu-item-type' => 'post_type', 'menu-item-status' => 'publish' ) );
	set_theme_mod( 'nav_menu_locations', array( 'primary' => $open_frame_menu ) );
	set_theme_mod( 'open_frame_container_width', 1100 );
}

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
