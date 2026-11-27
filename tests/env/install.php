<?php
/**
 * Installs WordPress in the test site. Run through tests/env/run.php.
 *
 * @package Open_Frame
 */

// phpcs:disable -- Command-line test helper, never loaded by WordPress.
require_once ABSPATH . 'wp-admin/includes/upgrade.php';

if ( is_blog_installed() ) {
	echo "WordPress is already installed.\n";
	return;
}

wp_install( 'Open Frame Test', 'admin', 'admin@example.com', true, '', 'password' );
echo "WordPress installed.\n";
