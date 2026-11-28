<?php
/**
 * The notice that recommends the companion plugin, Open Frame Starter Sites.
 *
 * One dismissible notice on the Dashboard, Themes and Plugins screens, with
 * the step that fits the site: install the plugin, activate it, or open it.
 * Every step is a click of the user; the theme does none of them by itself and
 * never sends the user to another screen.
 *
 * What the theme knows about the plugin, and its registration with TGM Plugin
 * Activation, are in starter-sites.php. Nothing is shown while the plugin's
 * slug in functions.php is still the placeholder.
 *
 * @package Open_Frame
 * @since   1.2.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Address that activates the installed companion plugin, with WordPress's own action.
 *
 * @since 1.2.0
 *
 * @param string $file Main file of the plugin.
 * @return string
 */
function open_frame_starter_plugin_activate_url( $file ) {
	return wp_nonce_url(
		add_query_arg(
			array(
				'action' => 'activate',
				'plugin' => rawurlencode( $file ),
			),
			admin_url( 'plugins.php' )
		),
		'activate-plugin_' . $file
	);
}

/**
 * What the notice offers to the current user on the current screen.
 *
 * @since 1.2.0
 *
 * @return array|null {
 *     Null when no notice is shown.
 *
 *     @type string $status `not-installed`, `inactive` or `active`.
 *     @type string $url    Address of the main button.
 * }
 */
function open_frame_starter_notice_state() {
	static $state = false;

	if ( false !== $state ) {
		return $state;
	}
	$state = null;

	$status = open_frame_starter_plugin_status();
	if ( 'pending' === $status || is_network_admin() || is_user_admin() || ! current_user_can( 'edit_theme_options' ) ) {
		return $state;
	}

	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || ! in_array( $screen->id, array( 'dashboard', 'themes', 'plugins' ), true ) ) {
		return $state;
	}

	if ( get_user_meta( get_current_user_id(), 'open_frame_starter_notice_dismissed', true ) ) {
		return $state;
	}

	$url = '';
	if ( 'not-installed' === $status && current_user_can( 'install_plugins' ) && wp_is_file_mod_allowed( 'open_frame_install_plugin' ) ) {
		$url = open_frame_starter_plugin_install_url();
	} elseif ( 'inactive' === $status ) {
		$file = open_frame_starter_plugin_file();
		$url  = current_user_can( 'activate_plugin', $file ) ? open_frame_starter_plugin_activate_url( $file ) : '';
	} elseif ( 'active' === $status ) {
		$url = open_frame_starter_plugin_screen_url();
	}

	// Without something the user can do, there is nothing to show.
	if ( '' !== $url ) {
		$state = array(
			'status' => $status,
			'url'    => $url,
		);
	}

	return $state;
}

/**
 * Print the notice.
 *
 * @since 1.2.0
 *
 * @return void
 */
function open_frame_starter_notice() {
	$state = open_frame_starter_notice_state();
	if ( null === $state ) {
		return;
	}

	$dismiss_url = wp_nonce_url( add_query_arg( 'open-frame-dismiss', 'starter-sites' ), 'open_frame_dismiss_starter_notice' );
	$name        = open_frame_starter_plugin_name();

	if ( 'active' === $state['status'] ) {
		$title  = __( 'Starter Sites is ready', 'open-frame' );
		$button = __( 'Open Starter Sites', 'open-frame' );
		$text   = __( 'Look through the designs, see what each one needs and import the one you like. Every import can be rolled back.', 'open-frame' );
		if ( ! open_frame_elementor_is_active() ) {
			$text .= ' ' . __( 'The designs are made with Elementor, which is not active on this site. Starter Sites shows what each design needs and installs it only when you ask it to.', 'open-frame' );
		}
	} elseif ( 'inactive' === $state['status'] ) {
		$title  = __( 'Start with a complete website', 'open-frame' );
		$button = __( 'Activate Starter Sites', 'open-frame' );
		/* translators: %s: plugin name. */
		$text = sprintf( __( '%s is installed but not active. Activate it to look through professionally designed websites made with Elementor and import one in a few clicks.', 'open-frame' ), $name );
	} else {
		$title  = __( 'Start with a complete website', 'open-frame' );
		$button = __( 'Install Starter Sites', 'open-frame' );
		/* translators: %s: plugin name. */
		$text = sprintf( __( '%s is a free, optional plugin with professionally designed websites made with Elementor. Preview a design, import the complete website in a few clicks, and roll the import back if you change your mind.', 'open-frame' ), $name );
	}
	?>
	<div class="notice notice-info is-dismissible open-frame-starter-notice" data-status="<?php echo esc_attr( $state['status'] ); ?>">
		<p class="open-frame-starter-notice__title"><strong><?php echo esc_html( $title ); ?></strong></p>
		<p><?php echo esc_html( $text ); ?></p>
		<p class="open-frame-starter-notice__result" role="status" aria-live="polite" hidden></p>
		<p class="open-frame-starter-notice__actions">
			<a class="button button-primary open-frame-starter-notice__main" href="<?php echo esc_url( $state['url'] ); ?>"><?php echo esc_html( $button ); ?></a>
			<?php if ( 'active' !== $state['status'] ) : ?>
				<a class="button open-frame-starter-notice__more" href="<?php echo esc_url( open_frame_starter_plugin_directory_url() ); ?>" target="_blank" rel="noopener noreferrer">
					<?php esc_html_e( 'Learn more', 'open-frame' ); ?>
					<span class="screen-reader-text"><?php esc_html_e( '(opens in a new tab)', 'open-frame' ); ?></span>
				</a>
			<?php endif; ?>
			<a class="open-frame-starter-notice__dismiss" href="<?php echo esc_url( $dismiss_url ); ?>"><?php esc_html_e( 'Dismiss', 'open-frame' ); ?></a>
		</p>
	</div>
	<?php
}
add_action( 'admin_notices', 'open_frame_starter_notice' );

/**
 * Load the style and the script of the notice, on the screens that show it.
 *
 * @since 1.2.0
 *
 * @return void
 */
function open_frame_starter_notice_assets() {
	$state = open_frame_starter_notice_state();
	if ( null === $state ) {
		return;
	}

	wp_enqueue_style( 'open-frame-starter-notice', OPEN_FRAME_URI . '/assets/css/admin-starter-notice.css', array(), OPEN_FRAME_VERSION );
	wp_enqueue_script( 'open-frame-starter-notice', OPEN_FRAME_URI . '/assets/js/admin-starter-notice.js', array( 'wp-a11y' ), OPEN_FRAME_VERSION, true );

	$data = array(
		'ajaxUrl'      => admin_url( 'admin-ajax.php' ),
		'slug'         => open_frame_starter_plugin_slug(),
		'dismissNonce' => wp_create_nonce( 'open_frame_dismiss_starter_notice' ),
		// The nonce of WordPress's own "install-plugin" request, only for users who may install.
		'installNonce' => 'not-installed' === $state['status'] ? wp_create_nonce( 'updates' ) : '',
		'strings'      => array(
			'installing'  => __( 'Installing…', 'open-frame' ),
			'installed'   => __( 'Installed. Reloading the page…', 'open-frame' ),
			'tryAgain'    => __( 'Try again', 'open-frame' ),
			/* translators: %s: the reason WordPress gave. */
			'failed'      => __( 'The plugin could not be installed: %s', 'open-frame' ),
			'failedPlain' => __( 'The plugin could not be installed. Check the connection of your site and try again.', 'open-frame' ),
			'unavailable' => __( 'WordPress could not get this plugin from the WordPress.org Plugin Directory. It may not be published there yet, or WordPress.org cannot be reached from this site at the moment. Nothing was installed.', 'open-frame' ),
		),
	);

	wp_add_inline_script( 'open-frame-starter-notice', 'window.openFrameStarterNotice = ' . wp_json_encode( $data ) . ';', 'before' );
}
add_action( 'admin_enqueue_scripts', 'open_frame_starter_notice_assets' );

/**
 * Remember that the current user dismissed the notice.
 *
 * @since 1.2.0
 *
 * @return void
 */
function open_frame_starter_notice_remember_dismissal() {
	update_user_meta( get_current_user_id(), 'open_frame_starter_notice_dismissed', 1 );
}

/**
 * Dismiss the notice from the script.
 *
 * @since 1.2.0
 *
 * @return void
 */
function open_frame_starter_notice_dismiss_ajax() {
	check_ajax_referer( 'open_frame_dismiss_starter_notice', 'nonce' );

	if ( ! current_user_can( 'edit_theme_options' ) ) {
		wp_send_json_error( null, 403 );
	}

	open_frame_starter_notice_remember_dismissal();
	wp_send_json_success();
}
add_action( 'wp_ajax_open_frame_dismiss_starter_notice', 'open_frame_starter_notice_dismiss_ajax' );

/**
 * Dismiss the notice from its link, for browsers without JavaScript.
 *
 * @since 1.2.0
 *
 * @return void
 */
function open_frame_starter_notice_dismiss_link() {
	if ( ! isset( $_GET['open-frame-dismiss'] ) || 'starter-sites' !== sanitize_key( wp_unslash( $_GET['open-frame-dismiss'] ) ) ) {
		return;
	}

	check_admin_referer( 'open_frame_dismiss_starter_notice' );

	if ( current_user_can( 'edit_theme_options' ) ) {
		open_frame_starter_notice_remember_dismissal();
	}

	wp_safe_redirect( remove_query_arg( array( 'open-frame-dismiss', '_wpnonce' ) ) );
	exit;
}
add_action( 'admin_init', 'open_frame_starter_notice_dismiss_link' );
