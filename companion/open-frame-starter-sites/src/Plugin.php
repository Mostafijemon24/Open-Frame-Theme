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
use OpenFrame\StarterSites\History\Log;
use OpenFrame\StarterSites\Requirements\Checker;
use OpenFrame\StarterSites\Requirements\PluginInstaller;
use OpenFrame\StarterSites\Rest\HistoryController;
use OpenFrame\StarterSites\Rest\RequirementsController;
use OpenFrame\StarterSites\Rest\SitesController;

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
		$config  = new Config();
		$catalog = new Catalog( new Client( $config ), $config );
		$checker = new Checker();
		$history = new Log();

		add_action(
			'rest_api_init',
			static function () use ( $config, $catalog, $checker, $history ) {
				( new SitesController( $config, $catalog, $checker ) )->register_routes();
				( new RequirementsController( $config, $catalog, $checker, new PluginInstaller() ) )->register_routes();
				( new HistoryController( $config, $history ) )->register_routes();
			}
		);

		if ( is_admin() ) {
			( new Page( $config, $history ) )->register();
		}
	}
}
