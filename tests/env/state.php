<?php
/**
 * Puts the test site in a known state. Run through tests/env/run.php.
 *
 * Arguments, in any number and order:
 *   plugin:<slug>=on|off     activate or deactivate a plugin
 *   mod:<name>=<value>       set a theme mod ("true"/"false" become booleans)
 *   option:<name>=<value>    set an option
 *   reset                    remove every theme mod and test option
 *   theme:<slug>             switch to a theme
 *   ofss:forget              drop the saved starter site catalog
 *   ofss:history             record one past import
 *   ofss:imported=<id>@<v>   pretend a starter site was imported in that version
 *   ofss:clear               remove everything the three above created
 *   remove-plugin:<slug>     deactivate and delete a plugin the tests installed
 *   ids                      print the IDs of the fixture pages as JSON
 *
 * @package Open_Frame
 */

// phpcs:disable -- Command-line test helper, never loaded by WordPress.
$open_frame_plugins = array(
	'elementor'     => 'elementor/elementor.php',
	'elementor-pro' => 'elementor-pro/elementor-pro.php',
	'woocommerce'   => 'woocommerce/woocommerce.php',
	'theme-check'   => 'theme-check/theme-check.php',
	'starter-sites' => 'open-frame-starter-sites/open-frame-starter-sites.php',
);

foreach ( $open_frame_args as $open_frame_arg ) {
	if ( 'reset' === $open_frame_arg ) {
		remove_theme_mods();
		delete_option( 'oft_fake_locations' );
		continue;
	}

	if ( 'ids' === $open_frame_arg ) {
		$open_frame_ids = array();
		foreach ( array( 'plain-page', 'el-default', 'el-hide-title', 'el-full-width', 'el-canvas' ) as $open_frame_slug ) {
			$open_frame_page                    = get_page_by_path( $open_frame_slug );
			$open_frame_ids[ $open_frame_slug ] = $open_frame_page ? $open_frame_page->ID : 0;
		}
		echo wp_json_encode( $open_frame_ids ), "\n";
		continue;
	}

	if ( 'ofss:forget' === $open_frame_arg ) {
		delete_option( 'ofss_catalog' );
		continue;
	}

	if ( 'ofss:history' === $open_frame_arg ) {
		update_option(
			'ofss_history',
			array(
				array(
					'id'       => 'run1',
					'site'     => 'business',
					'name'     => 'Business',
					'version'  => '1.0.0',
					'result'   => 'success',
					'started'  => 1795000000,
					'finished' => 1795000090,
					'warnings' => array( 'One image could not be downloaded.' ),
				),
			),
			false
		);
		continue;
	}

	if ( 'ofss:clear' === $open_frame_arg ) {
		delete_option( 'ofss_catalog' );
		delete_option( 'ofss_history' );
		delete_option( 'ofss_active_site' );
		continue;
	}

	if ( 0 === strpos( $open_frame_arg, 'ofss:imported=' ) ) {
		list( $open_frame_site, $open_frame_version ) = explode( '@', substr( $open_frame_arg, 14 ) );
		update_option(
			'ofss_active_site',
			array(
				'slug'    => $open_frame_site,
				'version' => $open_frame_version,
			),
			false
		);
		continue;
	}

	if ( 0 === strpos( $open_frame_arg, 'theme:' ) ) {
		switch_theme( substr( $open_frame_arg, 6 ) );
		continue;
	}

	if ( 0 === strpos( $open_frame_arg, 'remove-plugin:' ) ) {
		$open_frame_slug = sanitize_key( substr( $open_frame_arg, 14 ) );
		foreach ( array_keys( get_plugins( '/' . $open_frame_slug ) ) as $open_frame_file ) {
			deactivate_plugins( $open_frame_slug . '/' . $open_frame_file );
		}
		if ( $open_frame_slug && is_dir( WP_PLUGIN_DIR . '/' . $open_frame_slug ) && ! is_link( WP_PLUGIN_DIR . '/' . $open_frame_slug ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			WP_Filesystem();
			$GLOBALS['wp_filesystem']->delete( WP_PLUGIN_DIR . '/' . $open_frame_slug, true );
		}
		wp_clean_plugins_cache();
		continue;
	}

	list( $open_frame_key, $open_frame_value ) = array_pad( explode( '=', $open_frame_arg, 2 ), 2, '' );
	list( $open_frame_type, $open_frame_name ) = array_pad( explode( ':', $open_frame_key, 2 ), 2, '' );

	if ( 'true' === $open_frame_value ) {
		$open_frame_value = true;
	} elseif ( 'false' === $open_frame_value ) {
		$open_frame_value = false;
	}

	if ( 'plugin' === $open_frame_type && isset( $open_frame_plugins[ $open_frame_name ] ) ) {
		if ( 'on' === $open_frame_value ) {
			if ( ! file_exists( WP_PLUGIN_DIR . '/' . $open_frame_plugins[ $open_frame_name ] ) ) {
				continue;
			}
			activate_plugin( $open_frame_plugins[ $open_frame_name ] );
		} else {
			deactivate_plugins( $open_frame_plugins[ $open_frame_name ] );
		}
	} elseif ( 'mod' === $open_frame_type ) {
		set_theme_mod( $open_frame_name, $open_frame_value );
	} elseif ( 'option' === $open_frame_type ) {
		update_option( $open_frame_name, $open_frame_value );
	}
}
