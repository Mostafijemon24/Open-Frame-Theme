<?php
/**
 * Header, footer and "page not found" built in Elementor.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\SiteParts;

use OpenFrame\StarterSites\Elementor\Adapter;

defined( 'ABSPATH' ) || exit;

/**
 * Lets a design bring a header, a footer and a 404 page that are edited with
 * the free version of Elementor.
 *
 * A site part is a post of its own type with Elementor content. The Open
 * Frame theme asks, through its location filters, whether something else
 * renders a location; this class answers for the locations that have a site
 * part. Elementor Pro's Theme Builder is asked first by the theme, so its
 * templates win when both exist.
 */
class SiteParts {

	const POST_TYPE     = 'of_site_part';
	const LOCATION_META = '_ofss_location';
	const LOCATIONS     = array( 'header', 'footer', '404' );

	/**
	 * Elementor adapter.
	 *
	 * @var Adapter
	 */
	private $elementor;

	/**
	 * Site part IDs by location, looked up once per request.
	 *
	 * @var array<string,int>|null
	 */
	private $parts = null;

	/**
	 * Constructor.
	 *
	 * @param Adapter $elementor Elementor adapter.
	 */
	public function __construct( Adapter $elementor ) {
		$this->elementor = $elementor;
	}

	/**
	 * Hook into WordPress and the theme.
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_action( 'template_redirect', array( $this, 'hide_from_visitors' ) );
		add_filter( 'open_frame_has_location', array( $this, 'has_location' ), 20, 2 );
		add_filter( 'open_frame_do_location', array( $this, 'do_location' ), 20, 2 );
		add_action( 'save_post_' . self::POST_TYPE, array( $this, 'forget' ) );
		add_action( 'deleted_post', array( $this, 'forget' ) );
	}

	/**
	 * Register the post type.
	 *
	 * It has to be viewable so Elementor's editor can load its preview;
	 * hide_from_visitors() keeps everyone else out.
	 *
	 * @return void
	 */
	public function register_post_type() {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'              => array(
					'name'          => __( 'Site Parts', 'open-frame-starter-sites' ),
					'singular_name' => __( 'Site Part', 'open-frame-starter-sites' ),
					'edit_item'     => __( 'Edit Site Part', 'open-frame-starter-sites' ),
					'search_items'  => __( 'Search Site Parts', 'open-frame-starter-sites' ),
					'not_found'     => __( 'No site parts yet. They are created when you import a starter site.', 'open-frame-starter-sites' ),
				),
				'public'              => true,
				'exclude_from_search' => true,
				'show_in_nav_menus'   => false,
				'show_in_admin_bar'   => false,
				'show_in_rest'        => false,
				'show_ui'             => true,
				'show_in_menu'        => 'themes.php',
				'has_archive'         => false,
				'rewrite'             => false,
				'capability_type'     => 'page',
				'map_meta_cap'        => true,
				'supports'            => array( 'title', 'elementor' ),
			)
		);
	}

	/**
	 * A site part has no page of its own for visitors.
	 *
	 * @return void
	 */
	public function hide_from_visitors() {
		if ( ! is_singular( self::POST_TYPE ) || current_user_can( 'edit_pages' ) ) {
			return;
		}

		global $wp_query;
		$wp_query->set_404();
		status_header( 404 );
		nocache_headers();
	}

	/**
	 * Whether a site part will render a location.
	 *
	 * @param bool   $has      Whether the location is already taken.
	 * @param string $location Theme location.
	 * @return bool
	 */
	public function has_location( $has, $location ) {
		return $has || $this->part( $location ) > 0;
	}

	/**
	 * Render a location with its site part.
	 *
	 * @param bool   $done     Whether the location was already rendered.
	 * @param string $location Theme location.
	 * @return bool
	 */
	public function do_location( $done, $location ) {
		$part = $done ? 0 : $this->part( $location );
		if ( ! $part ) {
			return $done;
		}

		$tags = array(
			'header' => 'header',
			'footer' => 'footer',
			'404'    => 'div',
		);

		printf( '<%1$s class="of-site-part of-site-part--%2$s">', esc_attr( $tags[ $location ] ), esc_attr( $location ) );
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Markup rendered by Elementor from the site part's own content.
		echo $this->elementor->render( $part );
		printf( '</%s>', esc_attr( $tags[ $location ] ) );

		return true;
	}

	/**
	 * Forget the looked-up site parts when one changes.
	 *
	 * @return void
	 */
	public function forget() {
		$this->parts = null;
	}

	/**
	 * ID of the published site part for a location, or 0.
	 *
	 * Nothing is rendered while a site part itself is being edited or
	 * previewed, or when Elementor is not active.
	 *
	 * @param string $location Theme location.
	 * @return int
	 */
	private function part( $location ) {
		if ( ! in_array( $location, self::LOCATIONS, true ) || ! $this->elementor->is_ready() || is_singular( self::POST_TYPE ) ) {
			return 0;
		}

		if ( null === $this->parts ) {
			$this->parts = array();
			$posts       = get_posts(
				array(
					'post_type'   => self::POST_TYPE,
					'post_status' => 'publish',
					'numberposts' => 20,
					'orderby'     => 'date',
					'order'       => 'ASC',
				)
			);
			foreach ( $posts as $post ) {
				// The newest part for a location wins.
				$this->parts[ (string) get_post_meta( $post->ID, self::LOCATION_META, true ) ] = $post->ID;
			}
		}

		return (int) ( $this->parts[ $location ] ?? 0 );
	}
}
