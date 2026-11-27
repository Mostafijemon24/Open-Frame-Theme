<?php
/**
 * The Starter Sites screen.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Admin;

use OpenFrame\StarterSites\Config;
use OpenFrame\StarterSites\History\Log;

defined( 'ABSPATH' ) || exit;

/**
 * Adds Appearance > Starter Sites and loads its application.
 */
class Page {

	const SLUG = 'open-frame-starter-sites';

	/**
	 * Plugin configuration.
	 *
	 * @var Config
	 */
	private $config;

	/**
	 * History.
	 *
	 * @var Log
	 */
	private $history;

	/**
	 * Hook suffix of the screen.
	 *
	 * @var string
	 */
	private $hook = '';

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
	 * Hook into WordPress.
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'admin_menu', array( $this, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'assets' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( OFSS_FILE ), array( $this, 'action_links' ) );
	}

	/**
	 * Add the screen under Appearance.
	 *
	 * @return void
	 */
	public function menu() {
		$this->hook = (string) add_theme_page(
			__( 'Starter Sites', 'open-frame-starter-sites' ),
			__( 'Starter Sites', 'open-frame-starter-sites' ),
			$this->config->capability(),
			self::SLUG,
			array( $this, 'render' )
		);
	}

	/**
	 * Link to the screen from the Plugins list.
	 *
	 * @param string[] $links Existing links.
	 * @return string[]
	 */
	public function action_links( $links ) {
		array_unshift(
			$links,
			sprintf( '<a href="%s">%s</a>', esc_url( admin_url( 'themes.php?page=' . self::SLUG ) ), esc_html__( 'Starter Sites', 'open-frame-starter-sites' ) )
		);

		return $links;
	}

	/**
	 * Load the application, on this screen only.
	 *
	 * @param string $hook Current admin screen.
	 * @return void
	 */
	public function assets( $hook ) {
		if ( '' === $this->hook || $hook !== $this->hook ) {
			return;
		}

		wp_enqueue_style( 'ofss-admin', OFSS_URL . 'assets/admin/app.css', array( 'wp-components' ), OFSS_VERSION );
		wp_enqueue_script(
			'ofss-admin',
			OFSS_URL . 'assets/admin/app.js',
			array( 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n', 'wp-a11y', 'wp-url' ),
			OFSS_VERSION,
			true
		);
		wp_set_script_translations( 'ofss-admin', 'open-frame-starter-sites', OFSS_DIR . 'languages' );

		wp_add_inline_script(
			'ofss-admin',
			'window.ofssData = ' . wp_json_encode(
				array(
					'namespace'   => Config::REST_NAMESPACE,
					'themeActive' => Config::THEME === get_template(),
					'themesUrl'   => admin_url( 'themes.php' ),
					'hasHistory'  => $this->history->has_entries(),
					'version'     => OFSS_VERSION,
				)
			) . ';',
			'before'
		);
	}

	/**
	 * Print the screen. The application fills in the rest.
	 *
	 * @return void
	 */
	public function render() {
		?>
		<div class="wrap ofss-wrap">
			<h1><?php esc_html_e( 'Starter Sites', 'open-frame-starter-sites' ); ?></h1>
			<p class="ofss-intro"><?php esc_html_e( 'Complete websites made for the Open Frame theme. Pick a design to see its pages and what it needs.', 'open-frame-starter-sites' ); ?></p>
			<div id="ofss-root">
				<noscript>
					<div class="notice notice-warning inline"><p><?php esc_html_e( 'Starter Sites needs JavaScript. Please turn it on in your browser and reload this page.', 'open-frame-starter-sites' ); ?></p></div>
				</noscript>
			</div>
		</div>
		<?php
	}
}
