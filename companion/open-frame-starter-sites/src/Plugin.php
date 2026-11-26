<?php
/**
 * Plugin bootstrap.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites;

use OpenFrame\StarterSites\Admin\Page;
use OpenFrame\StarterSites\Cloud\Catalog;
use OpenFrame\StarterSites\Cloud\Client;
use OpenFrame\StarterSites\Cloud\Manifest;
use OpenFrame\StarterSites\Elementor\Adapter;
use OpenFrame\StarterSites\History\Log;
use OpenFrame\StarterSites\Import\Rollback;
use OpenFrame\StarterSites\Import\Runner;
use OpenFrame\StarterSites\Requirements\Checker;
use OpenFrame\StarterSites\Requirements\PluginInstaller;
use OpenFrame\StarterSites\Rest\HistoryController;
use OpenFrame\StarterSites\Rest\ImportsController;
use OpenFrame\StarterSites\Rest\RequirementsController;
use OpenFrame\StarterSites\Rest\SitesController;
use OpenFrame\StarterSites\SiteParts\SiteParts;

defined( 'ABSPATH' ) || exit;

/**
 * Wires the plugin together.
 */
final class Plugin {

	/**
	 * Start the plugin. Hooked to `plugins_loaded`.
	 *
	 * @return void
	 */
	public static function boot() {
		( new SiteParts( new Adapter() ) )->register();

		add_action( 'rest_api_init', array( self::class, 'routes' ) );

		if ( is_admin() ) {
			( new Page( new Config(), new Log() ) )->register();
		}
	}

	/**
	 * Register the REST routes. Hooked to `rest_api_init`.
	 *
	 * @return void
	 */
	public static function routes() {
		$config    = new Config();
		$client    = new Client( $config );
		$catalog   = new Catalog( $client, $config );
		$checker   = new Checker();
		$history   = new Log();
		$elementor = new Adapter();
		$runner    = new Runner( $config, $catalog, $checker, new Manifest( $client, $config ), $elementor, $history );

		( new SitesController( $config, $catalog, $checker ) )->register_routes();
		( new RequirementsController( $config, $catalog, $checker, new PluginInstaller() ) )->register_routes();
		( new HistoryController( $config, $history ) )->register_routes();
		( new ImportsController( $config, $runner, new Rollback( $config, $elementor, $history ) ) )->register_routes();
	}
}
