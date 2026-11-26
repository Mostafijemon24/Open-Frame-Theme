<?php
/**
 * Runs a PHP script inside the test site, as the administrator.
 *
 * Usage: php tests/env/run.php <wordpress-dir> <script.php> [arguments…]
 * The script receives its arguments in $open_frame_args.
 *
 * @package Open_Frame
 */

// phpcs:disable -- Command-line test helper, never loaded by WordPress.
if ( 'cli' !== PHP_SAPI ) {
	exit( 1 );
}

$open_frame_wp     = rtrim( $argv[1], '/' );
$open_frame_script = $argv[2];
$open_frame_args   = array_slice( $argv, 3 );

$_SERVER['HTTP_HOST']      = 'localhost';
$_SERVER['REQUEST_URI']    = '/';
$_SERVER['REQUEST_METHOD'] = 'GET';

if ( 'install.php' === basename( $open_frame_script ) ) {
	define( 'WP_INSTALLING', true );
} else {
	define( 'WP_ADMIN', true );
}

require $open_frame_wp . '/wp-load.php';

if ( ! defined( 'WP_INSTALLING' ) ) {
	require_once ABSPATH . 'wp-admin/includes/admin.php';
	wp_set_current_user( 1 );
}

require $open_frame_script;
