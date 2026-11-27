<?php
/**
 * Installs, updates and activates plugins from WordPress.org.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Requirements;

use Plugin_Upgrader;
use WP_Ajax_Upgrader_Skin;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Uses WordPress's own installer. Plugins come from WordPress.org only;
 * nothing is bundled with, or downloaded from, the starter site library.
 */
class PluginInstaller {

	/**
	 * Carry out an action for a plugin requirement.
	 *
	 * The caller has already confirmed that the plugin is listed by a site in
	 * the verified catalog and that the action is the one the checker offers.
	 *
	 * @param array  $plugin Plugin requirement with status (see Checker::plugin()).
	 * @param string $action install, update or activate.
	 * @return true|WP_Error
	 */
	public function perform( array $plugin, $action ) {
		if ( ! $plugin['allowed'] ) {
			return new WP_Error(
				'ofss_not_allowed',
				is_multisite()
					? __( 'On a network of sites, plugins are installed by the network administrator. Ask them to install this plugin.', 'open-frame-starter-sites' )
					: __( 'Your account, or this site, is not allowed to install or change plugins. Install the plugin by hand under Plugins > Add New.', 'open-frame-starter-sites' ),
				array( 'status' => 403 )
			);
		}

		if ( 'activate' === $action ) {
			return $this->activate( $plugin['file'] );
		}

		if ( 'wordpress.org' !== $plugin['source'] ) {
			return new WP_Error( 'ofss_external_plugin', __( 'This plugin is not available from WordPress.org and has to be installed by hand.', 'open-frame-starter-sites' ), array( 'status' => 400 ) );
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/misc.php';
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
		require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

		if ( 'direct' !== get_filesystem_method() ) {
			return new WP_Error( 'ofss_filesystem', __( 'This server asks for FTP details before it installs plugins. Install the plugin under Plugins > Add New, then come back.', 'open-frame-starter-sites' ), array( 'status' => 409 ) );
		}

		$result = 'update' === $action ? $this->update( $plugin['file'] ) : $this->install( $plugin['slug'] );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		wp_clean_plugins_cache();

		$file = ( new Checker() )->installed_file( $plugin );
		if ( '' === $file ) {
			return new WP_Error( 'ofss_install_failed', __( 'The plugin was downloaded but could not be found afterwards. Install it under Plugins > Add New.', 'open-frame-starter-sites' ) );
		}

		return $this->activate( $file );
	}

	/**
	 * Install a plugin from WordPress.org.
	 *
	 * @param string $slug Plugin slug.
	 * @return true|WP_Error
	 */
	private function install( $slug ) {
		$api = plugins_api(
			'plugin_information',
			array(
				'slug'   => $slug,
				'fields' => array( 'sections' => false ),
			)
		);
		if ( is_wp_error( $api ) || empty( $api->download_link ) ) {
			return new WP_Error( 'ofss_plugin_lookup', __( 'WordPress.org could not be reached to download the plugin. Try again, or install it under Plugins > Add New.', 'open-frame-starter-sites' ) );
		}

		// WordPress.org offers the newest version only. When that one needs a newer
		// WordPress or PHP than this site has, WordPress refuses the package with a
		// message that does not say why; say it here, before trying.
		$name = isset( $api->name ) ? wp_strip_all_tags( (string) $api->name ) : $slug;
		if ( ! empty( $api->requires ) && ! is_wp_version_compatible( (string) $api->requires ) ) {
			return new WP_Error(
				'ofss_plugin_needs_wordpress',
				sprintf(
					/* translators: 1: plugin name, 2: WordPress version the plugin needs, 3: WordPress version of this site. */
					__( 'The current version of %1$s needs WordPress %2$s or newer, and this site has WordPress %3$s. Update WordPress under Dashboard > Updates, then try again.', 'open-frame-starter-sites' ),
					$name,
					(string) $api->requires,
					get_bloginfo( 'version' )
				)
			);
		}
		if ( ! empty( $api->requires_php ) && ! is_php_version_compatible( (string) $api->requires_php ) ) {
			return new WP_Error(
				'ofss_plugin_needs_php',
				sprintf(
					/* translators: 1: plugin name, 2: PHP version the plugin needs, 3: PHP version of this site. */
					__( 'The current version of %1$s needs PHP %2$s or newer, and this site runs PHP %3$s. Your hosting company can change the PHP version.', 'open-frame-starter-sites' ),
					$name,
					(string) $api->requires_php,
					PHP_VERSION
				)
			);
		}

		$skin     = new WP_Ajax_Upgrader_Skin();
		$upgrader = new Plugin_Upgrader( $skin );

		return $this->outcome( $upgrader->install( $api->download_link ), $skin );
	}

	/**
	 * Update an installed plugin to its current version.
	 *
	 * @param string $file Plugin file.
	 * @return true|WP_Error
	 */
	private function update( $file ) {
		wp_update_plugins();

		$skin     = new WP_Ajax_Upgrader_Skin();
		$upgrader = new Plugin_Upgrader( $skin );
		$results  = $upgrader->bulk_upgrade( array( $file ) );

		return $this->outcome( is_array( $results ) ? ( $results[ $file ] ?? false ) : $results, $skin );
	}

	/**
	 * Turn what the upgrader returned into success or an error with a usable message.
	 *
	 * @param mixed                 $result Upgrader result.
	 * @param WP_Ajax_Upgrader_Skin $skin   Upgrader skin, which collects errors.
	 * @return true|WP_Error
	 */
	private function outcome( $result, WP_Ajax_Upgrader_Skin $skin ) {
		$error = null;
		if ( is_wp_error( $result ) ) {
			$error = $result;
		} elseif ( is_wp_error( $skin->result ) ) {
			$error = $skin->result;
		} elseif ( $skin->get_errors()->has_errors() ) {
			$error = $skin->get_errors();
		}

		if ( $error || ! $result ) {
			return new WP_Error(
				'ofss_install_failed',
				sprintf(
					/* translators: %s: reason reported by WordPress. */
					__( 'WordPress could not install the plugin: %s', 'open-frame-starter-sites' ),
					$error ? $error->get_error_message() : __( 'the plugins folder could not be written to.', 'open-frame-starter-sites' )
				)
			);
		}

		return true;
	}

	/**
	 * Activate a plugin.
	 *
	 * @param string $file Plugin file.
	 * @return true|WP_Error
	 */
	private function activate( $file ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';

		$result = activate_plugin( $file );
		if ( is_wp_error( $result ) ) {
			return new WP_Error(
				'ofss_activation_failed',
				sprintf(
					/* translators: %s: reason reported by WordPress. */
					__( 'The plugin could not be activated: %s', 'open-frame-starter-sites' ),
					$result->get_error_message()
				)
			);
		}

		// Some plugins send the administrator to a welcome screen after
		// activation. That would take them away from this screen.
		delete_transient( 'elementor_activation_redirect' );
		delete_transient( '_wc_activation_redirect' );

		return true;
	}
}
