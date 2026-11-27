<?php
/**
 * Prints what a rollback has to put back, as JSON. Run through tests/env/run.php
 * before an import and after its rollback; the two must be equal.
 *
 * @package Open_Frame
 */

// phpcs:disable -- Command-line test helper, never loaded by WordPress.
global $wpdb;

echo wp_json_encode(
	array(
		// Posts and terms an import marked as its own.
		'marked_posts'   => (int) $wpdb->get_var( "SELECT COUNT(DISTINCT post_id) FROM $wpdb->postmeta WHERE meta_key IN ( '_ofss_run', '_ofss_site', '_ofss_uid' )" ),
		'marked_terms'   => (int) $wpdb->get_var( "SELECT COUNT(DISTINCT term_id) FROM $wpdb->termmeta WHERE meta_key IN ( '_ofss_run', '_ofss_site', '_ofss_uid' )" ),
		'attachments'    => (int) $wpdb->get_var( "SELECT COUNT(*) FROM $wpdb->posts WHERE post_type = 'attachment'" ),
		'menus'          => (int) wp_count_terms( array( 'taxonomy' => 'nav_menu', 'hide_empty' => false ) ),
		'show_on_front'  => (string) get_option( 'show_on_front' ),
		'page_on_front'  => (int) get_option( 'page_on_front' ),
		'page_for_posts' => (int) get_option( 'page_for_posts' ),
		'theme_mods'     => md5( (string) wp_json_encode( get_option( 'theme_mods_' . get_stylesheet() ) ) ),
		'active_site'    => get_option( 'ofss_active_site', null ),
		// The owner's own content: titles and addresses of every page and post that no import marked.
		'own_content'    => md5( (string) wp_json_encode( $wpdb->get_results( "SELECT ID, post_title, post_name, post_status, post_content FROM $wpdb->posts WHERE post_type IN ( 'page', 'post', 'nav_menu_item' ) AND ID NOT IN ( SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_ofss_run' ) ORDER BY ID" ) ) ),
	)
), "\n";
