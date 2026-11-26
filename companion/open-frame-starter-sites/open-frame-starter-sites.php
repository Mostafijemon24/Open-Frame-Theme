<?php
/**
 * Plugin Name:       Open Frame Starter Sites
 * Plugin URI:        https://github.com/Mostafijemon24/Open-Frame-Theme
 * Description:       Browse the starter website library for the Open Frame theme and prepare your site for an import: preview each design, see what it needs and install the required plugins.
 * Version:           0.2.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            Mostafij Emon
 * Author URI:        https://github.com/Mostafijemon24
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       open-frame-starter-sites
 * Domain Path:       /languages
 *
 * @package OpenFrame\StarterSites
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'OFSS_VERSION', '0.2.0' );
define( 'OFSS_FILE', __FILE__ );
define( 'OFSS_DIR', plugin_dir_path( __FILE__ ) );
define( 'OFSS_URL', plugin_dir_url( __FILE__ ) );

/**
 * Load a class of this plugin from the src folder.
 *
 * `OpenFrame\StarterSites\Cloud\Client` lives in `src/Cloud/Client.php`.
 */
spl_autoload_register(
	static function ( $class_name ) {
		$prefix = 'OpenFrame\\StarterSites\\';
		if ( 0 !== strpos( $class_name, $prefix ) ) {
			return;
		}

		$relative = str_replace( '\\', '/', substr( $class_name, strlen( $prefix ) ) );
		$path     = OFSS_DIR . 'src/' . $relative . '.php';
		if ( is_readable( $path ) ) {
			require_once $path;
		}
	}
);

add_action( 'plugins_loaded', array( OpenFrame\StarterSites\Plugin::class, 'boot' ) );
