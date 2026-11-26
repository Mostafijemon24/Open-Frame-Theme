<?php
/**
 * REST routes for the catalog.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Rest;

use OpenFrame\StarterSites\Cloud\Catalog;
use OpenFrame\StarterSites\Config;
use OpenFrame\StarterSites\Requirements\Checker;
use WP_REST_Request;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * GET /sites and GET /sites/{id}.
 */
class SitesController extends Controller {

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
	 * Constructor.
	 *
	 * @param Config  $config  Plugin configuration.
	 * @param Catalog $catalog Catalog.
	 * @param Checker $checker Requirement checker.
	 */
	public function __construct( Config $config, Catalog $catalog, Checker $checker ) {
		$this->config  = $config;
		$this->catalog = $catalog;
		$this->checker = $checker;
	}

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			Config::REST_NAMESPACE,
			'/sites',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'index' ),
				'permission_callback' => array( $this, 'permission' ),
				'args'                => array(
					'refresh' => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
			)
		);

		register_rest_route(
			Config::REST_NAMESPACE,
			'/sites/(?P<id>[a-z0-9-]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'show' ),
				'permission_callback' => array( $this, 'permission' ),
			)
		);
	}

	/**
	 * The catalog, with the state of every site on this installation.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function index( WP_REST_Request $request ) {
		$result = $this->catalog->get( (bool) $request['refresh'] );
		if ( is_wp_error( $result ) ) {
			return $this->with_status( $result );
		}

		$active = get_option( 'ofss_active_site' );
		$sites  = array();
		foreach ( $result['catalog']['sites'] as $site ) {
			$check = $this->checker->check( $site );

			$imported = is_array( $active ) && isset( $active['slug'], $active['version'] ) && $active['slug'] === $site['id'];

			$sites[] = array(
				'id'               => $site['id'],
				'name'             => $site['name'],
				'summary'          => $site['summary'],
				'category'         => $site['category'],
				'tags'             => $site['tags'],
				'tier'             => $site['tier'],
				'status'           => $site['status'],
				'version'          => $site['version'],
				'thumbnail'        => $site['preview']['thumbnail'],
				'page_count'       => count( $site['pages'] ),
				'state'            => $check['state'],
				'imported_version' => $imported ? (string) $active['version'] : '',
				'update_available' => $imported && version_compare( (string) $active['version'], $site['version'], '<' ),
			);
		}

		return rest_ensure_response(
			array(
				'sites'      => $sites,
				'categories' => $result['catalog']['categories'],
				'fetched_at' => $result['fetched_at'],
				'stale'      => $result['stale'],
				'notice'     => $result['stale'] ? $result['error']->get_error_message() : '',
			)
		);
	}

	/**
	 * One site with its full requirement check.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function show( WP_REST_Request $request ) {
		$site = $this->catalog->find( $request['id'] );
		if ( is_wp_error( $site ) ) {
			return $this->with_status( $site );
		}

		// Where the package lives is of no use to the browser.
		unset( $site['manifest'] );

		$site['requirements'] = $this->checker->check( $site );

		return rest_ensure_response( $site );
	}
}
