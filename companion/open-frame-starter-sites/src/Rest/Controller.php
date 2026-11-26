<?php
/**
 * Shared behaviour of the plugin's REST controllers.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Rest;

use OpenFrame\StarterSites\Config;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Base controller: one permission rule for every route.
 */
abstract class Controller {

	/**
	 * Plugin configuration.
	 *
	 * @var Config
	 */
	protected $config;

	/**
	 * Register the routes of the controller.
	 *
	 * @return void
	 */
	abstract public function register_routes();

	/**
	 * Only users who may manage the site can use these routes.
	 *
	 * WordPress has already verified the REST nonce for cookie logins; a
	 * request without a valid nonce arrives here as a logged-out visitor.
	 *
	 * @return true|WP_Error
	 */
	public function permission() {
		if ( current_user_can( $this->config->capability() ) ) {
			return true;
		}

		return new WP_Error(
			'ofss_forbidden',
			__( 'You are not allowed to use Starter Sites on this site.', 'open-frame-starter-sites' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Give an error from the library a status code that fits.
	 *
	 * @param WP_Error $error Error.
	 * @return WP_Error
	 */
	protected function with_status( WP_Error $error ) {
		$data = $error->get_error_data();
		if ( is_array( $data ) && isset( $data['status'] ) ) {
			return $error;
		}

		// The details stay on the server; the message is written for the user.
		return new WP_Error( $error->get_error_code(), $error->get_error_message(), array( 'status' => 503 ) );
	}
}
