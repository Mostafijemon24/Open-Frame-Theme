<?php
/**
 * Compares what a starter site needs with what the site has.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Requirements;

use OpenFrame\StarterSites\Config;

defined( 'ABSPATH' ) || exit;

/**
 * Requirement checks. Reads only; changes nothing.
 */
class Checker {

	/**
	 * Check a site from the catalog against this WordPress installation.
	 *
	 * @param array $site Normalized catalog entry.
	 * @return array {
	 *     @type string $state       coming_soon, update_plugin, incompatible, needs_pro, needs_plugins or ready.
	 *     @type bool   $ready       Whether the site could be imported right now.
	 *     @type array  $environment Checks of WordPress, PHP, the theme and this plugin.
	 *     @type array  $plugins     Required and recommended plugins with their status.
	 * }
	 */
	public function check( array $site ) {
		$environment = $this->environment( $site['requires'], 'available' === $site['status'] );
		$plugins     = array_map( array( $this, 'plugin' ), $site['requires']['plugins'] );

		$state = 'ready';
		if ( 'coming_soon' === $site['status'] ) {
			$state = 'coming_soon';
		} elseif ( ! $this->passes( $environment, array( 'importer', 'format' ) ) ) {
			$state = 'update_plugin';
		} elseif ( ! $this->passes( $environment, array( 'wordpress', 'php', 'theme', 'zip', 'uploads' ) ) ) {
			$state = 'incompatible';
		} else {
			foreach ( $plugins as $plugin ) {
				if ( ! $plugin['required'] || 'active' === $plugin['status'] ) {
					continue;
				}
				if ( 'elementor-pro' === $plugin['slug'] ) {
					$state = 'needs_pro';
					break;
				}
				$state = 'needs_plugins';
			}
		}

		return array(
			'state'       => $state,
			'ready'       => 'ready' === $state,
			'environment' => $environment,
			'plugins'     => $plugins,
		);
	}

	/**
	 * Whether the checks with the given IDs all passed.
	 *
	 * @param array    $environment Environment checks.
	 * @param string[] $ids         IDs to look at.
	 * @return bool
	 */
	private function passes( array $environment, array $ids ) {
		foreach ( $environment as $item ) {
			if ( in_array( $item['id'], $ids, true ) && ! $item['ok'] ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Check WordPress, PHP, the theme, this plugin and the server.
	 *
	 * @param array $requires  Requirements of the site.
	 * @param bool  $available Whether the site can be imported. A site that is still on its
	 *                         way has no package yet, so the plugin version is not checked.
	 * @return array[]
	 */
	private function environment( array $requires, $available ) {
		$items = array();

		if ( '' !== $requires['wordpress'] ) {
			$current = get_bloginfo( 'version' );
			$items[] = array(
				'id'       => 'wordpress',
				'label'    => 'WordPress',
				'required' => $requires['wordpress'],
				'current'  => $current,
				'ok'       => version_compare( $current, $requires['wordpress'], '>=' ),
				'help'     => __( 'Update WordPress under Dashboard > Updates.', 'open-frame-starter-sites' ),
			);
		}

		if ( '' !== $requires['php'] ) {
			$items[] = array(
				'id'       => 'php',
				'label'    => 'PHP',
				'required' => $requires['php'],
				'current'  => PHP_VERSION,
				'ok'       => version_compare( PHP_VERSION, $requires['php'], '>=' ),
				'help'     => __( 'Ask your hosting company to switch the site to a newer PHP version.', 'open-frame-starter-sites' ),
			);
		}

		$theme   = wp_get_theme( get_template() );
		$active  = Config::THEME === get_template();
		$version = $active ? (string) $theme->get( 'Version' ) : '';
		$items[] = array(
			'id'       => 'theme',
			'label'    => __( 'Open Frame theme', 'open-frame-starter-sites' ),
			'required' => $requires['theme'],
			'current'  => $active ? $version : __( 'not active', 'open-frame-starter-sites' ),
			'ok'       => $active && ( '' === $requires['theme'] || version_compare( $version, $requires['theme'], '>=' ) ),
			'help'     => $active
				? __( 'Update the Open Frame theme under Dashboard > Updates.', 'open-frame-starter-sites' )
				: __( 'Activate the Open Frame theme (or a child theme of it) under Appearance > Themes.', 'open-frame-starter-sites' ),
		);

		if ( $available ) {
			$needs_update = '' !== $requires['importer'] && version_compare( OFSS_VERSION, $requires['importer'], '<' );
			$newer_format = $requires['format'] > Config::FORMAT;
			$items[]      = array(
				'id'       => $newer_format ? 'format' : 'importer',
				'label'    => __( 'Open Frame Starter Sites plugin', 'open-frame-starter-sites' ),
				'required' => $requires['importer'],
				'current'  => OFSS_VERSION,
				'ok'       => ! $needs_update && ! $newer_format,
				'help'     => __( 'This design needs a newer version of the Open Frame Starter Sites plugin. Update the plugin, then come back.', 'open-frame-starter-sites' ),
			);
		}

		$items[] = array(
			'id'       => 'zip',
			'label'    => __( 'ZIP support on the server', 'open-frame-starter-sites' ),
			'required' => '',
			'current'  => '',
			'ok'       => class_exists( 'ZipArchive' ),
			'help'     => __( 'Ask your hosting company to enable the PHP "zip" extension.', 'open-frame-starter-sites' ),
		);

		$uploads = wp_upload_dir( null, false );
		$items[] = array(
			'id'       => 'uploads',
			'label'    => __( 'Uploads folder can be written to', 'open-frame-starter-sites' ),
			'required' => '',
			'current'  => '',
			'ok'       => empty( $uploads['error'] ) && wp_is_writable( $uploads['basedir'] ),
			'help'     => __( 'Ask your hosting company to make the wp-content/uploads folder writable.', 'open-frame-starter-sites' ),
		);

		return $items;
	}

	/**
	 * Status of one plugin from the catalog.
	 *
	 * @param array $plugin Plugin requirement.
	 * @return array Requirement plus `status`, `current`, `action` and `allowed`.
	 */
	public function plugin( array $plugin ) {
		$file    = $this->installed_file( $plugin );
		$status  = 'missing';
		$current = '';

		if ( '' !== $file ) {
			$data    = get_plugins()[ $file ];
			$current = (string) $data['Version'];
			$status  = is_plugin_active( $file ) ? 'active' : 'inactive';

			if ( '' !== $plugin['version'] && version_compare( $current, $plugin['version'], '<' ) ) {
				$status = 'outdated';
			}
		}

		$action = '';
		if ( 'inactive' === $status ) {
			$action = 'activate';
		} elseif ( 'active' !== $status ) {
			$action = 'wordpress.org' !== $plugin['source'] ? 'external' : ( 'missing' === $status ? 'install' : 'update' );
		}

		return array_merge(
			$plugin,
			array(
				'file'    => '' !== $file ? $file : $plugin['file'],
				'status'  => $status,
				'current' => $current,
				'action'  => $action,
				'allowed' => $this->allowed( $action, '' !== $file ? $file : $plugin['file'] ),
			)
		);
	}

	/**
	 * Main file of a plugin as installed, or an empty string.
	 *
	 * The catalog names the usual main file; a copy installed under the same
	 * folder with another main file is recognized too.
	 *
	 * @param array $plugin Plugin requirement.
	 * @return string Path relative to the plugins folder.
	 */
	public function installed_file( array $plugin ) {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$installed = get_plugins();
		if ( isset( $installed[ $plugin['file'] ] ) ) {
			return $plugin['file'];
		}

		foreach ( array_keys( $installed ) as $file ) {
			if ( 0 === strpos( $file, $plugin['slug'] . '/' ) ) {
				return $file;
			}
		}

		return '';
	}

	/**
	 * Whether the current user may carry out an action on this site.
	 *
	 * @param string $action install, activate, update, external or an empty string.
	 * @param string $file   Plugin file.
	 * @return bool
	 */
	private function allowed( $action, $file ) {
		switch ( $action ) {
			case 'install':
				return current_user_can( 'install_plugins' ) && current_user_can( 'activate_plugins' ) && wp_is_file_mod_allowed( 'ofss_install_plugin' );
			case 'update':
				return current_user_can( 'update_plugins' ) && wp_is_file_mod_allowed( 'ofss_update_plugin' );
			case 'activate':
				return current_user_can( 'activate_plugin', $file );
			default:
				return false;
		}
	}
}
