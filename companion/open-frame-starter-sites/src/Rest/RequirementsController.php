<?php
/**
 * REST route that installs or activates a required plugin.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Rest;

use OpenFrame\StarterSites\Cloud\Catalog;
use OpenFrame\StarterSites\Config;
use OpenFrame\StarterSites\Requirements\Checker;
use OpenFrame\StarterSites\Requirements\PluginInstaller;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * POST /requirements.
 */
class RequirementsController extends Controller {

	/**
	 * Catalog.
	 *
	 * @var Catalog
	 */
	private $catalog;

	/**
	 * Requirement checker.
	 *
	 * @var Checker
	 */
	private $checker;

	/**
	 * Plugin installer.
	 *
	 * @var PluginInstaller
	 */
	private $installer;

	/**
	 * Constructor.
	 *
	 * @param Config          $config    Plugin configuration.
	 * @param Catalog         $catalog   Catalog.
	 * @param Checker         $checker   Requirement checker.
	 * @param PluginInstaller $installer Plugin installer.
	 */
	public function __construct( Config $config, Catalog $catalog, Checker $checker, PluginInstaller $installer ) {
		$this->config    = $config;
		$this->catalog   = $catalog;
		$this->checker   = $checker;
		$this->installer = $installer;
	}

	/**
	 * Register the route.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			Config::REST_NAMESPACE,
			'/requirements',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'resolve' ),
				'permission_callback' => array( $this, 'permission' ),
				'args'                => array(
					'site'   => array(
						'type'     => 'string',
						'required' => true,
						'pattern'  => '^[a-z0-9-]+$',
					),
					'plugin' => array(
						'type'     => 'string',
						'required' => true,
						'pattern'  => '^[a-z0-9-]+$',
					),
				),
			)
		);
	}

	/**
	 * Install, update or activate one plugin that a site requires.
	 *
	 * The request names a site and a plugin, never a download address or an
	 * action. The plugin must be listed by that site in the verified catalog,
	 * and what happens to it is decided here from its current status.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function resolve( WP_REST_Request $request ) {
		$site = $this->catalog->find( $request['site'] );
		if ( is_wp_error( $site ) ) {
			return $this->with_status( $site );
		}

		$requirement = null;
		foreach ( $site['requires']['plugins'] as $plugin ) {
			if ( $plugin['slug'] === $request['plugin'] ) {
				$requirement = $this->checker->plugin( $plugin );
				break;
			}
		}

		if ( null === $requirement ) {
			return new WP_Error( 'ofss_unknown_plugin', __( 'That plugin is not required by this starter site.', 'open-frame-starter-sites' ), array( 'status' => 400 ) );
		}

		if ( 'active' !== $requirement['status'] ) {
			if ( ! in_array( $requirement['action'], array( 'install', 'update', 'activate' ), true ) ) {
				return new WP_Error( 'ofss_external_plugin', __( 'This plugin is not available from WordPress.org and has to be installed by hand.', 'open-frame-starter-sites' ), array( 'status' => 400 ) );
			}

			$result = $this->installer->perform( $requirement, $requirement['action'] );
			if ( is_wp_error( $result ) ) {
				$data = $result->get_error_data();
				return new WP_Error( $result->get_error_code(), $result->get_error_message(), array( 'status' => is_array( $data ) && isset( $data['status'] ) ? $data['status'] : 500 ) );
			}
		}

		return rest_ensure_response(
			array(
				'requirements' => $this->checker->check( $site ),
			)
		);
	}
}
