<?php
/**
 * REST route for the import history.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Rest;

use OpenFrame\StarterSites\Config;
use OpenFrame\StarterSites\History\Log;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * GET /history.
 */
class HistoryController extends Controller {

	/**
	 * History.
	 *
	 * @var Log
	 */
	private $history;

	/**
	 * Constructor.
	 *
	 * @param Config $config  Plugin configuration.
	 * @param Log    $history History.
	 */
	public function __construct( Config $config, Log $history ) {
		$this->config  = $config;
		$this->history = $history;
	}

	/**
	 * Register the route.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			Config::REST_NAMESPACE,
			'/history',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'index' ),
				'permission_callback' => array( $this, 'permission' ),
			)
		);
	}

	/**
	 * Past imports, newest first.
	 *
	 * @return \WP_REST_Response
	 */
	public function index() {
		return rest_ensure_response( array( 'entries' => $this->history->all() ) );
	}
}
