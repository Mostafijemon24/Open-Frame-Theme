<?php
/**
 * REST routes that run and undo an import.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Rest;

use OpenFrame\StarterSites\Config;
use OpenFrame\StarterSites\Import\Rollback;
use OpenFrame\StarterSites\Import\Runner;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * POST /imports, POST /imports/{id}/advance, POST /imports/{id}/rollback, GET /imports/current.
 */
class ImportsController extends Controller {

	/**
	 * Import runner.
	 *
	 * @var Runner
	 */
	private $runner;

	/**
	 * Rollback.
	 *
	 * @var Rollback
	 */
	private $rollback;

	/**
	 * Constructor.
	 *
	 * @param Config   $config   Plugin configuration.
	 * @param Runner   $runner   Import runner.
	 * @param Rollback $rollback Rollback.
	 */
	public function __construct( Config $config, Runner $runner, Rollback $rollback ) {
		$this->config   = $config;
		$this->runner   = $runner;
		$this->rollback = $rollback;
	}

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		$run = array(
			'id' => array(
				'type'     => 'string',
				'required' => true,
				'pattern'  => '^[a-z0-9]{12}$',
			),
		);

		register_rest_route(
			Config::REST_NAMESPACE,
			'/imports',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'start' ),
				'permission_callback' => array( $this, 'permission' ),
				'args'                => array(
					'site'      => array(
						'type'     => 'string',
						'required' => true,
						'pattern'  => '^[a-z0-9-]+$',
					),
					'confirmed' => array(
						'type'     => 'boolean',
						'required' => true,
					),
				),
			)
		);

		register_rest_route(
			Config::REST_NAMESPACE,
			'/imports/current',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'current' ),
				'permission_callback' => array( $this, 'permission' ),
			)
		);

		register_rest_route(
			Config::REST_NAMESPACE,
			'/imports/(?P<id>[a-z0-9]{12})/advance',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'advance' ),
				'permission_callback' => array( $this, 'permission' ),
				'args'                => $run,
			)
		);

		register_rest_route(
			Config::REST_NAMESPACE,
			'/imports/(?P<id>[a-z0-9]{12})/rollback',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'rollback' ),
				'permission_callback' => array( $this, 'permission' ),
				'args'                => $run,
			)
		);
	}

	/**
	 * Begin an import. The user has to have confirmed it on the screen.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function start( WP_REST_Request $request ) {
		if ( true !== $request['confirmed'] ) {
			return new WP_Error( 'ofss_not_confirmed', __( 'The import was not confirmed.', 'open-frame-starter-sites' ), array( 'status' => 400 ) );
		}

		$state = $this->runner->start( $request['site'] );

		return is_wp_error( $state ) ? $this->with_status( $state ) : rest_ensure_response( $this->runner->summary( $state ) );
	}

	/**
	 * The current or most recent run.
	 *
	 * @return \WP_REST_Response
	 */
	public function current() {
		$state = $this->runner->state();

		return rest_ensure_response( array( 'run' => $state ? $this->runner->summary( $state ) : null ) );
	}

	/**
	 * Do the next part of a run.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function advance( WP_REST_Request $request ) {
		$state = $this->runner->advance( $request['id'] );

		return is_wp_error( $state ) ? $this->with_status( $state ) : rest_ensure_response( $this->runner->summary( $state ) );
	}

	/**
	 * Undo a run.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public function rollback( WP_REST_Request $request ) {
		$state = $this->runner->state();
		if ( ! $state || $state['id'] !== $request['id'] ) {
			return new WP_Error( 'ofss_unknown_run', __( 'That import no longer exists.', 'open-frame-starter-sites' ), array( 'status' => 404 ) );
		}

		$state = $this->rollback->run( $state );

		return is_wp_error( $state ) ? $this->with_status( $state ) : rest_ensure_response( $this->runner->summary( $state ) );
	}
}
