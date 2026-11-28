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
 *   ofss:interrupt           start an import of the reference design and stop it part-way
 *   ofss:import=<site>       import a design completely
 *   ofss:rollback            roll back the current import, if there is one
 *   ofss:ids                 print the IDs of imported posts, keyed by their name in the package
 *   remove-plugin:<slug>     deactivate and delete a plugin the tests installed
 *   starter:reset            forget the recommended plugin's slug, the stand-in directory and every dismissal
 *   starter:status           print what the theme knows about the recommended plugin, as JSON
 *   plugins                  print which of the test site's plugins are active, as JSON
 *   user:<login>=<role>      make sure a user with that role exists (password "password")
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

	if ( 'ofss:interrupt' === $open_frame_arg || 'ofss:rollback' === $open_frame_arg ) {
		$open_frame_config  = new OpenFrame\StarterSites\Config();
		$open_frame_client  = new OpenFrame\StarterSites\Cloud\Client( $open_frame_config );
		$open_frame_adapter = new OpenFrame\StarterSites\Elementor\Adapter();
		$open_frame_log     = new OpenFrame\StarterSites\History\Log();
		$open_frame_runner  = new OpenFrame\StarterSites\Import\Runner( $open_frame_config, new OpenFrame\StarterSites\Cloud\Catalog( $open_frame_client, $open_frame_config ), new OpenFrame\StarterSites\Requirements\Checker(), new OpenFrame\StarterSites\Cloud\Manifest( $open_frame_client, $open_frame_config ), $open_frame_adapter, $open_frame_log );

		if ( 'ofss:rollback' === $open_frame_arg ) {
			$open_frame_run = $open_frame_runner->state();
			if ( $open_frame_run ) {
				delete_transient( 'ofss_import_lock' );
				( new OpenFrame\StarterSites\Import\Rollback( $open_frame_config, $open_frame_adapter, $open_frame_log ) )->run( $open_frame_run );
			}
			delete_option( 'ofss_import_state' );
		} else {
			// As if the browser had been closed after the images were imported.
			$open_frame_run = $open_frame_runner->start( 'reference' );
			$open_frame_runner->advance( $open_frame_run['id'], 5 );
		}
		continue;
	}

	if ( 0 === strpos( $open_frame_arg, 'ofss:import=' ) ) {
		$open_frame_config  = new OpenFrame\StarterSites\Config();
		$open_frame_client  = new OpenFrame\StarterSites\Cloud\Client( $open_frame_config );
		$open_frame_runner  = new OpenFrame\StarterSites\Import\Runner( $open_frame_config, new OpenFrame\StarterSites\Cloud\Catalog( $open_frame_client, $open_frame_config ), new OpenFrame\StarterSites\Requirements\Checker(), new OpenFrame\StarterSites\Cloud\Manifest( $open_frame_client, $open_frame_config ), new OpenFrame\StarterSites\Elementor\Adapter(), new OpenFrame\StarterSites\History\Log() );
		$open_frame_run     = $open_frame_runner->start( substr( $open_frame_arg, 12 ) );
		$open_frame_guard   = 400;
		while ( ! is_wp_error( $open_frame_run ) && 'running' === $open_frame_run['status'] && $open_frame_guard-- > 0 ) {
			$open_frame_run = $open_frame_runner->advance( $open_frame_run['id'] );
		}
		echo wp_json_encode(
			is_wp_error( $open_frame_run )
				? array( 'status' => 'error', 'error' => $open_frame_run->get_error_message() )
				: array( 'status' => $open_frame_run['status'], 'error' => $open_frame_run['error'], 'counts' => $open_frame_run['counts'], 'warnings' => $open_frame_run['warnings'] )
		), "\n";
		continue;
	}

	if ( 'ofss:ids' === $open_frame_arg ) {
		$open_frame_ids = array();
		foreach ( get_posts( array( 'post_type' => array_values( get_post_types() ), 'post_status' => 'any', 'numberposts' => -1, 'meta_key' => '_ofss_uid' ) ) as $open_frame_post ) { // phpcs:ignore WordPress.DB.SlowDBQuery
			$open_frame_ids[ get_post_meta( $open_frame_post->ID, '_ofss_uid', true ) ] = $open_frame_post->ID;
		}
		echo wp_json_encode( $open_frame_ids ), "\n";
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

	if ( 'starter:reset' === $open_frame_arg ) {
		delete_option( 'oft_starter_slug' );
		delete_option( 'oft_directory' );
		delete_metadata( 'user', 0, 'open_frame_starter_notice_dismissed', '', true );
		continue;
	}

	if ( 'plugins' === $open_frame_arg ) {
		$open_frame_states = array();
		foreach ( $open_frame_plugins as $open_frame_name => $open_frame_file ) {
			$open_frame_states[ $open_frame_name ] = ! file_exists( WP_PLUGIN_DIR . '/' . $open_frame_file ) ? 'missing' : ( is_plugin_active( $open_frame_file ) ? 'active' : 'inactive' );
		}
		echo wp_json_encode( $open_frame_states ), "\n";
		continue;
	}

	if ( 'starter:status' === $open_frame_arg ) {
		$open_frame_companion = 'open-frame-starter-sites/open-frame-starter-sites.php';
		wp_clean_plugins_cache();
		echo wp_json_encode(
			array(
				'slug'      => open_frame_starter_plugin_slug(),
				'status'    => open_frame_starter_plugin_status(),
				'tgmpa'     => class_exists( 'TGM_Plugin_Activation', false ),
				'file'      => open_frame_starter_plugin_file(),
				'starter'   => ! file_exists( WP_PLUGIN_DIR . '/' . $open_frame_companion ) ? 'missing' : ( is_plugin_active( $open_frame_companion ) ? 'active' : 'inactive' ),
				'dismissed' => (bool) get_user_meta( 1, 'open_frame_starter_notice_dismissed', true ),
			)
		), "\n";
		continue;
	}

	if ( 0 === strpos( $open_frame_arg, 'user:' ) ) {
		list( $open_frame_login, $open_frame_role ) = array_pad( explode( '=', substr( $open_frame_arg, 5 ), 2 ), 2, 'subscriber' );
		$open_frame_user = get_user_by( 'login', $open_frame_login );
		if ( ! $open_frame_user ) {
			wp_insert_user(
				array(
					'user_login' => $open_frame_login,
					'user_pass'  => 'password',
					'user_email' => $open_frame_login . '@example.org',
					'role'       => $open_frame_role,
				)
			);
		}
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
