<?php
/**
 * The import, as a sequence of small resumable steps.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Import;

use OpenFrame\StarterSites\Cloud\Catalog;
use OpenFrame\StarterSites\Cloud\Manifest;
use OpenFrame\StarterSites\Config;
use OpenFrame\StarterSites\Elementor\Adapter;
use OpenFrame\StarterSites\Fonts\Fonts;
use OpenFrame\StarterSites\History\Log;
use OpenFrame\StarterSites\Requirements\Checker;
use OpenFrame\StarterSites\SiteParts\SiteParts;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Runs an import one unit of work at a time.
 *
 * The browser (or a test) calls advance() repeatedly. Each call works until a
 * time budget is used up, saves where it is and returns. Nothing depends on a
 * single long request, so a slow host or a closed browser tab leaves a run
 * that can be resumed or rolled back, never a half-finished site with no way
 * out. Every object the run creates is tagged with the run ID.
 */
class Runner {

	const STATE = 'ofss_import_state';
	const LOCK  = 'ofss_import_lock';

	/**
	 * Steps in order. Each one is a method named step_<name>.
	 */
	const STEPS = array( 'preflight', 'snapshot', 'download', 'media', 'fonts', 'content', 'kit', 'menus', 'documents', 'settings', 'finalize' );

	/**
	 * Plugin configuration.
	 *
	 * @var Config
	 */
	private $config;

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
	 * Manifest client.
	 *
	 * @var Manifest
	 */
	private $manifests;

	/**
	 * Elementor adapter.
	 *
	 * @var Adapter
	 */
	private $elementor;

	/**
	 * Package reader.
	 *
	 * @var Package
	 */
	private $package;

	/**
	 * History.
	 *
	 * @var Log
	 */
	private $history;

	/**
	 * Constructor.
	 *
	 * @param Config   $config    Plugin configuration.
	 * @param Catalog  $catalog   Catalog.
	 * @param Checker  $checker   Requirement checker.
	 * @param Manifest $manifests Manifest client.
	 * @param Adapter  $elementor Elementor adapter.
	 * @param Log      $history   History.
	 */
	public function __construct( Config $config, Catalog $catalog, Checker $checker, Manifest $manifests, Adapter $elementor, Log $history ) {
		$this->config    = $config;
		$this->catalog   = $catalog;
		$this->checker   = $checker;
		$this->manifests = $manifests;
		$this->elementor = $elementor;
		$this->history   = $history;
		$this->package   = new Package( $config );
	}

	/**
	 * The current or most recent run, if any.
	 *
	 * @return array|null
	 */
	public function state() {
		$state = get_option( self::STATE );

		return is_array( $state ) && isset( $state['id'], $state['site'], $state['status'], $state['step'] ) ? $state : null;
	}

	/**
	 * Begin importing a site.
	 *
	 * @param string $site_id Site ID from the catalog.
	 * @return array|WP_Error The new run.
	 */
	public function start( $site_id ) {
		$current = $this->state();
		if ( $current && in_array( $current['status'], array( 'running', 'failed' ), true ) ) {
			return new WP_Error( 'ofss_unfinished', __( 'An earlier import did not finish. Continue it or roll it back first.', 'open-frame-starter-sites' ), array( 'status' => 409 ) );
		}

		$site = $this->catalog->find( $site_id );
		if ( is_wp_error( $site ) ) {
			return $site;
		}

		// What the previous run kept for a rollback is no longer needed.
		if ( $current ) {
			delete_option( 'ofss_snapshot_' . $current['id'] );
			$this->package->clean( $current['dir'] ?? '' );
		}

		$state = array(
			'id'       => strtolower( wp_generate_password( 12, false ) ),
			'site'     => $site['id'],
			'name'     => $site['name'],
			'version'  => $site['version'],
			'status'   => 'running',
			'step'     => 0,
			'cursor'   => 0,
			'started'  => time(),
			'manifest' => null,
			'dir'      => '',
			'media'    => array(),
			'posts'    => array(),
			'created'  => array(),
			'kit'      => 0,
			'counts'   => array(
				'pages'  => 0,
				'posts'  => 0,
				'images' => 0,
				'reused' => 0,
				'menus'  => 0,
			),
			'warnings' => array(),
			'error'    => '',
		);
		$this->save( $state );

		return $state;
	}

	/**
	 * Do as much of a run as fits in one request.
	 *
	 * @param string $run_id    Run ID.
	 * @param int    $max_units Stop after this many units of work (0: use the time budget). Used by tests.
	 * @return array|WP_Error The run afterwards.
	 */
	public function advance( $run_id, $max_units = 0 ) {
		$state = $this->state();
		if ( ! $state || $state['id'] !== $run_id ) {
			return new WP_Error( 'ofss_unknown_run', __( 'That import no longer exists.', 'open-frame-starter-sites' ), array( 'status' => 404 ) );
		}
		if ( in_array( $state['status'], array( 'done', 'rolled_back' ), true ) ) {
			return $state;
		}

		$lock = get_transient( self::LOCK );
		if ( is_array( $lock ) && $lock['expires'] > time() ) {
			return new WP_Error( 'ofss_busy', __( 'The import is already running in another window. Give it a moment.', 'open-frame-starter-sites' ), array( 'status' => 409 ) );
		}
		set_transient( self::LOCK, array( 'expires' => time() + 90 ), 120 );

		// Half of what the server allows, and never more than twenty seconds.
		$allowed  = (int) ini_get( 'max_execution_time' );
		$deadline = microtime( true ) + min( 20, $allowed > 0 ? max( 5, $allowed / 2 ) : 20 );
		$units    = 0;

		$state['status'] = 'running';
		$state['error']  = '';

		$total = count( self::STEPS );

		while ( $state['step'] < $total ) {
			$method = 'step_' . self::STEPS[ $state['step'] ];
			$result = $this->$method( $state );

			if ( is_wp_error( $result ) ) {
				$state['status'] = 'failed';
				$state['error']  = $result->get_error_message();
				break;
			}

			if ( true === $result ) {
				++$state['step'];
				$state['cursor'] = 0;
			}

			$this->save( $state );
			++$units;

			if ( ( $max_units && $units >= $max_units ) || microtime( true ) >= $deadline ) {
				break;
			}
		}

		if ( 'running' === $state['status'] && $state['step'] >= $total ) {
			$state['status'] = 'done';
		}

		$this->save( $state );
		delete_transient( self::LOCK );

		return $state;
	}

	/**
	 * What the browser needs to know about a run.
	 *
	 * @param array $state Run.
	 * @return array
	 */
	public function summary( array $state ) {
		$labels = array(
			'preflight' => __( 'Checking your site', 'open-frame-starter-sites' ),
			'snapshot'  => __( 'Saving your current settings', 'open-frame-starter-sites' ),
			'download'  => __( 'Downloading the design', 'open-frame-starter-sites' ),
			'media'     => __( 'Importing images', 'open-frame-starter-sites' ),
			'fonts'     => __( 'Importing fonts', 'open-frame-starter-sites' ),
			'content'   => __( 'Creating pages', 'open-frame-starter-sites' ),
			'kit'       => __( 'Setting colors and fonts', 'open-frame-starter-sites' ),
			'documents' => __( 'Building the pages in Elementor', 'open-frame-starter-sites' ),
			'menus'     => __( 'Creating menus', 'open-frame-starter-sites' ),
			'settings'  => __( 'Applying settings', 'open-frame-starter-sites' ),
			'finalize'  => __( 'Finishing', 'open-frame-starter-sites' ),
		);
		$total  = count( self::STEPS );
		$step   = min( $state['step'], $total - 1 );
		$front  = (int) get_option( 'page_on_front' );

		return array(
			'id'       => $state['id'],
			'site'     => $state['site'],
			'name'     => $state['name'],
			'version'  => $state['version'],
			'status'   => $state['status'],
			'step'     => self::STEPS[ $step ],
			'label'    => $labels[ self::STEPS[ $step ] ],
			'percent'  => 'done' === $state['status'] ? 100 : (int) floor( 100 * $state['step'] / $total ),
			'error'    => $state['error'],
			'counts'   => $state['counts'],
			'warnings' => $state['warnings'],
			'links'    => 'done' === $state['status'] ? array(
				'view'      => home_url( '/' ),
				'edit'      => $front ? admin_url( 'post.php?post=' . $front . '&action=elementor' ) : '',
				'customize' => admin_url( 'customize.php' ),
			) : array(),
		);
	}

	/**
	 * Store a run.
	 *
	 * @param array $state Run.
	 * @return void
	 */
	public function save( array $state ) {
		update_option( self::STATE, $state, false );
	}

	// Steps. Each returns true when the step is complete, false when there is
	// more of it to do in a later unit, or a WP_Error.

	/**
	 * Make sure the site can take this design before anything is changed.
	 *
	 * @param array $state Run.
	 * @return true|WP_Error
	 */
	private function step_preflight( array &$state ) {
		$site = $this->catalog->find( $state['site'] );
		if ( is_wp_error( $site ) ) {
			return $site;
		}

		$check = $this->checker->check( $site );
		if ( ! $check['ready'] ) {
			return new WP_Error( 'ofss_not_ready', __( 'Your site does not have everything this design needs yet. Close this and look at the list under "What it needs".', 'open-frame-starter-sites' ) );
		}

		if ( ! $this->elementor->is_ready() ) {
			return new WP_Error( 'ofss_no_elementor', __( 'Elementor is not active.', 'open-frame-starter-sites' ) );
		}
		if ( ! $this->elementor->has_containers() ) {
			return new WP_Error( 'ofss_no_containers', __( 'This design is built with Elementor containers. Turn on "Container" under Elementor > Settings > Features, then try again.', 'open-frame-starter-sites' ) );
		}

		$manifest = $this->manifests->fetch( $site );
		if ( is_wp_error( $manifest ) ) {
			return $manifest;
		}

		$missing = array_diff( $manifest['widgets'], $this->elementor->widgets() );
		if ( $missing ) {
			return new WP_Error(
				'ofss_missing_widgets',
				sprintf(
					/* translators: %s: comma-separated list of Elementor widget names. */
					__( 'This design uses Elementor widgets that are not available on your site: %s. Update Elementor, then try again.', 'open-frame-starter-sites' ),
					implode( ', ', $missing )
				)
			);
		}

		$dir = $this->package->workspace( $state['id'] );
		if ( is_wp_error( $dir ) ) {
			return $dir;
		}

		$state['manifest'] = $manifest;
		$state['dir']      = $dir;

		return true;
	}

	/**
	 * Remember every setting the import is going to change.
	 *
	 * @param array $state Run.
	 * @return true
	 */
	private function step_snapshot( array &$state ) {
		update_option(
			'ofss_snapshot_' . $state['id'],
			array(
				'show_on_front'          => get_option( 'show_on_front' ),
				'page_on_front'          => get_option( 'page_on_front' ),
				'page_for_posts'         => get_option( 'page_for_posts' ),
				'elementor_active_kit'   => get_option( 'elementor_active_kit' ),
				'elementor_previous_kit' => get_option( 'elementor_previous_kit' ),
				'theme_mods'             => get_option( 'theme_mods_' . get_stylesheet() ),
				'active_site'            => get_option( 'ofss_active_site' ),
			),
			false
		);

		return true;
	}

	/**
	 * Download the package and check it against the manifest.
	 *
	 * @param array $state Run.
	 * @return true|WP_Error
	 */
	private function step_download( array &$state ) {
		$zip = $state['dir'] . '/package.zip';

		$fetched = $this->package->fetch( $state['manifest']['package'], $zip );
		if ( is_wp_error( $fetched ) ) {
			return $fetched;
		}

		return $this->package->inspect( $zip, $state['manifest']['files'] );
	}

	/**
	 * Import one image per unit of work.
	 *
	 * @param array $state Run.
	 * @return bool|WP_Error
	 */
	private function step_media( array &$state ) {
		$item = $state['manifest']['media'][ $state['cursor'] ] ?? null;
		if ( null === $item ) {
			return true;
		}

		// The same file from an earlier import is used again instead of stored twice.
		$existing = get_posts(
			array(
				'post_type'   => 'attachment',
				'post_status' => 'inherit',
				'numberposts' => 1,
				'fields'      => 'ids',
				'meta_key'    => '_ofss_source_hash', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- One lookup per imported image.
				'meta_value'  => $item['sha256'], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			)
		);

		if ( $existing ) {
			$state['media'][ $item['uid'] ] = (int) $existing[0];
			++$state['counts']['reused'];
			++$state['cursor'];
			return false;
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$extensions = array(
			'image/jpeg' => 'jpg',
			'image/png'  => 'png',
			'image/webp' => 'webp',
			'image/avif' => 'avif',
			'image/gif'  => 'gif',
		);
		$name       = $state['site'] . '-' . $item['uid'] . '.' . $extensions[ $item['mime'] ];
		$temp       = $state['dir'] . '/' . $item['sha256'] . '.' . $extensions[ $item['mime'] ];

		$fetched = $this->package->fetch( $item, $temp );
		if ( is_wp_error( $fetched ) ) {
			return $fetched;
		}

		// The file has to be the kind of image it claims to be.
		$type = wp_check_filetype_and_ext( $temp, $name );
		$size = wp_getimagesize( $temp );
		if ( empty( $type['type'] ) || $type['type'] !== $item['mime'] || ! $size ) {
			wp_delete_file( $temp );
			return new WP_Error( 'ofss_bad_image', __( 'An image of this design is not a valid image, so the import was stopped.', 'open-frame-starter-sites' ) );
		}

		$attachment = media_handle_sideload(
			array(
				'name'     => $name,
				'tmp_name' => $temp,
			),
			0
		);
		if ( is_wp_error( $attachment ) ) {
			wp_delete_file( $temp );
			return new WP_Error( 'ofss_media', __( 'An image could not be added to the media library. Check that the uploads folder can be written to.', 'open-frame-starter-sites' ) );
		}

		update_post_meta( $attachment, '_wp_attachment_image_alt', $item['alt'] );
		update_post_meta( $attachment, '_ofss_source_hash', $item['sha256'] );
		$this->tag( $state, $attachment, $state['site'] . ':media:' . $item['uid'] );

		$state['media'][ $item['uid'] ] = (int) $attachment;
		++$state['counts']['images'];
		++$state['cursor'];

		return false;
	}

	/**
	 * Store one font file per unit of work.
	 *
	 * The files are kept in the uploads folder under their hash and served by
	 * this site, so the design asks no font service for anything.
	 *
	 * @param array $state Run.
	 * @return bool|WP_Error
	 */
	private function step_fonts( array &$state ) {
		$item = $state['manifest']['fonts'][ $state['cursor'] ] ?? null;
		if ( null === $item ) {
			return true;
		}

		$fonts = new Fonts();
		if ( ! $fonts->has( $item['sha256'] ) ) {
			$dir = $fonts->location()['dir'];
			if ( ! wp_mkdir_p( $dir ) ) {
				return new WP_Error( 'ofss_fonts', __( 'The uploads folder cannot be written to. Ask your hosting company to make wp-content/uploads writable.', 'open-frame-starter-sites' ) );
			}

			// Recorded before it is downloaded, so a rollback finds the file even if this request dies.
			$fonts->add( $item, $state['id'] );

			$file    = $dir . '/' . $item['sha256'] . '.woff2';
			$fetched = $this->package->fetch( $item, $file );
			if ( is_wp_error( $fetched ) ) {
				return $fetched;
			}

			// The file has to be the kind of font it claims to be.
			if ( 'wOF2' !== file_get_contents( $file, false, null, 0, 4 ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- The first four bytes of a local file.
				wp_delete_file( $file );
				return new WP_Error( 'ofss_bad_font', __( 'A font of this design is not a valid font file, so the import was stopped.', 'open-frame-starter-sites' ) );
			}
		}

		++$state['cursor'];

		return false;
	}

	/**
	 * Create one page or site part per unit of work (without its Elementor content yet).
	 *
	 * @param array $state Run.
	 * @return bool|WP_Error
	 */
	private function step_content( array &$state ) {
		$name = $this->documents( $state )[ $state['cursor'] ] ?? null;
		if ( null === $name ) {
			return true;
		}

		$data = $this->package->read( $state['dir'] . '/package.zip', $name, $state['manifest']['files'] );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		preg_match( '#^content/(pages|posts|products|site-parts|templates)/([a-z0-9-]+)\.json$#', $name, $match );
		if ( 'posts' === $match[1] ) {
			return $this->import_post( $state, $match[2], $data );
		}

		if ( 'products' === $match[1] ) {
			return $this->import_product( $state, $match[2], $data );
		}

		if ( 'templates' === $match[1] ) {
			return $this->import_template( $state, $match[2], $data );
		}

		$is_part = 'site-parts' === $match[1];
		$uid     = $state['site'] . ':' . $match[1] . ':' . $match[2];
		$key     = ( $is_part ? 'site-part' : 'page' ) . '/' . $match[2];

		if ( $is_part && ! in_array( $data['location'] ?? '', SiteParts::LOCATIONS, true ) ) {
			return new WP_Error( 'ofss_bad_part', __( 'The package of this design is damaged or was altered, so it was not used. Please try again.', 'open-frame-starter-sites' ) );
		}

		$template = $is_part ? 'elementor_canvas' : (string) ( $data['template'] ?? 'elementor_header_footer' );
		if ( ! in_array( $template, array( 'default', 'elementor_header_footer', 'elementor_canvas' ), true ) ) {
			$template = 'elementor_header_footer';
		}

		$existing = $this->find( $uid );
		$post_id  = wp_insert_post(
			array(
				'ID'           => $existing,
				'post_type'    => $is_part ? SiteParts::POST_TYPE : 'page',
				'post_status'  => 'publish',
				'post_title'   => sanitize_text_field( (string) ( $data['title'] ?? $match[2] ) ),
				'post_name'    => sanitize_title( (string) ( $data['slug'] ?? $match[2] ) ),
				'post_content' => '',
			),
			true
		);
		if ( is_wp_error( $post_id ) ) {
			return new WP_Error( 'ofss_content', __( 'A page of this design could not be created.', 'open-frame-starter-sites' ) );
		}

		update_post_meta( $post_id, '_wp_page_template', $template );
		if ( $is_part ) {
			update_post_meta( $post_id, SiteParts::LOCATION_META, $data['location'] );
		}
		if ( ! $existing ) {
			$this->tag( $state, $post_id, $uid );
			$state['counts']['pages'] += $is_part ? 0 : 1;
		}

		$state['posts'][ $key ] = (int) $post_id;
		if ( ! $is_part && ! empty( $data['front_page'] ) ) {
			// Links to this page should point at the site address, not at /home/.
			$state['front'] = $key;
		}
		++$state['cursor'];

		return false;
	}

	/**
	 * Create one Theme Builder template of the design (without its content yet).
	 *
	 * Designs for Elementor Pro bring their header, footer, blog and "page
	 * not found" layouts as templates of its Theme Builder.
	 *
	 * @param array  $state Run.
	 * @param string $name  Name of the template inside the package.
	 * @param array  $data  Template data from the package.
	 * @return false|WP_Error
	 */
	private function import_template( array &$state, $name, array $data ) {
		$uid      = $state['site'] . ':templates:' . $name;
		$existing = $this->find( $uid );

		if ( ! $existing ) {
			$existing = $this->elementor->create_template( (string) ( $data['type'] ?? '' ), sanitize_text_field( (string) ( $data['title'] ?? $name ) ) );
			if ( is_wp_error( $existing ) ) {
				return $existing;
			}
			$this->tag( $state, $existing, $uid );
		}

		$state['posts'][ 'template/' . $name ] = (int) $existing;
		++$state['cursor'];

		return false;
	}

	/**
	 * Create one blog post of the design.
	 *
	 * Posts are ordinary block content, shown by the theme's blog templates.
	 * They are imported after the images, so a featured image can be set.
	 *
	 * @param array  $state Run.
	 * @param string $name  Name of the post inside the package.
	 * @param array  $data  Post data from the package.
	 * @return false|WP_Error
	 */
	private function import_post( array &$state, $name, array $data ) {
		$uid      = $state['site'] . ':posts:' . $name;
		$existing = $this->find( $uid );
		$resolver = new TokenResolver( $state['media'], $state['posts'], (string) ( $state['front'] ?? '' ), (array) ( $state['menus'] ?? array() ) );

		$post_id = wp_insert_post(
			array(
				'ID'           => $existing,
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_title'   => sanitize_text_field( (string) ( $data['title'] ?? $name ) ),
				'post_name'    => sanitize_title( (string) ( $data['slug'] ?? $name ) ),
				'post_excerpt' => sanitize_text_field( (string) ( $data['excerpt'] ?? '' ) ),
				'post_content' => wp_kses_post( (string) $resolver->resolve( (string) ( $data['content'] ?? '' ) ) ),
				// Spread the sample posts over the past weeks, newest first.
				'post_date'    => gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS * max( 0, (int) ( $data['days_ago'] ?? 0 ) ) ),
			),
			true
		);
		if ( is_wp_error( $post_id ) ) {
			return new WP_Error( 'ofss_content', __( 'A blog post of this design could not be created.', 'open-frame-starter-sites' ) );
		}

		$image = $resolver->id( $data['featured'] ?? '' );
		if ( $image ) {
			set_post_thumbnail( $post_id, $image );
		}

		$categories = array();
		foreach ( array_slice( (array) ( $data['categories'] ?? array() ), 0, 5 ) as $category ) {
			$category = sanitize_text_field( (string) $category );
			$term     = term_exists( $category, 'category' );
			if ( ! $term ) {
				$term = wp_insert_term( $category, 'category' );
				if ( ! is_wp_error( $term ) ) {
					update_term_meta( $term['term_id'], '_ofss_run', $state['id'] );
				}
			}
			if ( ! is_wp_error( $term ) && $term ) {
				$categories[] = (int) $term['term_id'];
			}
		}
		if ( $categories ) {
			wp_set_post_categories( $post_id, $categories );
		}

		if ( ! $existing ) {
			$this->tag( $state, $post_id, $uid );
			++$state['counts']['posts'];
		}

		$state['posts'][ 'post/' . $name ] = (int) $post_id;
		++$state['cursor'];

		return false;
	}

	/**
	 * Create one product of the design, as a simple WooCommerce product.
	 *
	 * Products come after the images, so each can have its picture. The
	 * store's own pages (shop, cart, checkout, account) are WooCommerce's.
	 *
	 * @param array  $state Run.
	 * @param string $name  Name of the product inside the package.
	 * @param array  $data  Product data from the package.
	 * @return false|WP_Error
	 */
	private function import_product( array &$state, $name, array $data ) {
		if ( ! class_exists( '\WC_Product_Simple' ) || ! function_exists( 'wc_get_product' ) ) {
			return new WP_Error( 'ofss_no_store', __( 'This design has products, and WooCommerce is not active. Activate WooCommerce and try again.', 'open-frame-starter-sites' ) );
		}

		$uid      = $state['site'] . ':products:' . $name;
		$existing = $this->find( $uid );
		$resolver = new TokenResolver( $state['media'], $state['posts'], (string) ( $state['front'] ?? '' ), (array) ( $state['menus'] ?? array() ) );
		$product  = $existing ? wc_get_product( $existing ) : null;
		if ( ! $product instanceof \WC_Product ) {
			$product  = new \WC_Product_Simple();
			$existing = 0;
		}

		$categories = array();
		foreach ( array_slice( (array) ( $data['categories'] ?? array() ), 0, 5 ) as $category ) {
			$category = sanitize_text_field( (string) $category );
			$term     = term_exists( $category, 'product_cat' );
			if ( ! $term ) {
				$term = wp_insert_term( $category, 'product_cat' );
				if ( ! is_wp_error( $term ) ) {
					update_term_meta( $term['term_id'], '_ofss_run', $state['id'] );
				}
			}
			if ( ! is_wp_error( $term ) && $term ) {
				$categories[] = (int) $term['term_id'];
			}
		}

		$gallery = array();
		foreach ( array_slice( (array) ( $data['gallery'] ?? array() ), 0, 8 ) as $reference ) {
			$gallery[] = $resolver->id( $reference );
		}

		$product->set_name( sanitize_text_field( (string) ( $data['title'] ?? $name ) ) );
		$product->set_slug( sanitize_title( (string) ( $data['slug'] ?? $name ) ) );
		$product->set_status( 'publish' );
		$product->set_catalog_visibility( 'visible' );
		$product->set_short_description( wp_kses_post( (string) ( $data['excerpt'] ?? '' ) ) );
		$product->set_description( wp_kses_post( (string) $resolver->resolve( (string) ( $data['content'] ?? '' ) ) ) );
		$product->set_regular_price( wc_format_decimal( (string) ( $data['price'] ?? '' ) ) );
		$product->set_sale_price( isset( $data['sale_price'] ) ? wc_format_decimal( (string) $data['sale_price'] ) : '' );
		$product->set_featured( ! empty( $data['featured'] ) );
		$product->set_image_id( $resolver->id( $data['image'] ?? '' ) );
		$product->set_gallery_image_ids( array_values( array_filter( $gallery ) ) );
		if ( $categories ) {
			$product->set_category_ids( $categories );
		}

		$post_id = (int) $product->save();
		if ( ! $post_id ) {
			return new WP_Error( 'ofss_content', __( 'A product of this design could not be created.', 'open-frame-starter-sites' ) );
		}

		if ( ! $existing ) {
			$this->tag( $state, $post_id, $uid );
			// Only designs with a store count products, so other summaries stay as they were.
			$state['counts']['products'] = (int) ( $state['counts']['products'] ?? 0 ) + 1;
		}

		$state['posts'][ 'product/' . $name ] = $post_id;
		++$state['cursor'];

		return false;
	}

	/**
	 * Create the Site Settings (kit) of the design and make it the active one.
	 *
	 * @param array $state Run.
	 * @return true|WP_Error
	 */
	private function step_kit( array &$state ) {
		if ( ! isset( $state['manifest']['files']['site/kit.json'] ) ) {
			return true;
		}

		$settings = $this->package->read( $state['dir'] . '/package.zip', 'site/kit.json', $state['manifest']['files'] );
		if ( is_wp_error( $settings ) ) {
			return $settings;
		}

		// Only settings a design is meant to bring; never custom code.
		$allowed = array();
		foreach ( $settings as $key => $value ) {
			if ( in_array( $key, array( 'system_colors', 'custom_colors', 'system_typography', 'custom_typography', 'container_width', 'space_between_widgets', 'viewport_md', 'viewport_lg' ), true ) || preg_match( '/^(body|link|h[1-6]|button|form_field|paragraph)_/', $key ) ) {
				$allowed[ $key ] = map_deep( $value, array( $this, 'clean_scalar' ) );
			}
		}

		$kit = $this->elementor->create_kit( 'Open Frame: ' . $state['name'], $allowed );
		if ( is_wp_error( $kit ) ) {
			return $kit;
		}

		$this->tag( $state, $kit, $state['site'] . ':kit' );
		$state['kit'] = $kit;

		return true;
	}

	/**
	 * Give one page or site part its Elementor content per unit of work.
	 *
	 * @param array $state Run.
	 * @return bool|WP_Error
	 */
	private function step_documents( array &$state ) {
		$name = $this->documents( $state )[ $state['cursor'] ] ?? null;
		if ( null === $name ) {
			return true;
		}

		$data = $this->package->read( $state['dir'] . '/package.zip', $name, $state['manifest']['files'] );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		preg_match( '#^content/(pages|posts|site-parts|templates)/([a-z0-9-]+)\.json$#', $name, $match );

		// Blog posts and pages without Elementor content (the posts page) have nothing to build.
		if ( 'posts' === $match[1] || empty( $data['elementor'] ) ) {
			++$state['cursor'];
			return false;
		}

		$kinds    = array(
			'pages'      => 'page',
			'site-parts' => 'site-part',
			'templates'  => 'template',
		);
		$post_id  = $state['posts'][ $kinds[ $match[1] ] . '/' . $match[2] ] ?? 0;
		$resolver = new TokenResolver( $state['media'], $state['posts'], (string) ( $state['front'] ?? '' ), (array) ( $state['menus'] ?? array() ) );

		$elements = $resolver->resolve( (array) ( $data['elementor']['content'] ?? array() ) );
		$settings = $resolver->resolve( (array) ( $data['elementor']['page_settings'] ?? array() ) );

		if ( 'templates' !== $match[1] ) {
			$settings['template'] = get_post_meta( $post_id, '_wp_page_template', true );
		}

		$saved = $this->elementor->save_document( $post_id, $elements, $settings );
		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		foreach ( array_unique( $resolver->unresolved ) as $reference ) {
			/* translators: 1: page title, 2: reference inside the package. */
			$state['warnings'][] = sprintf( __( '"%1$s": a link or image (%2$s) could not be connected.', 'open-frame-starter-sites' ), get_the_title( $post_id ), $reference );
		}

		if ( 'templates' === $match[1] ) {
			// Where the template is used: the whole site, single posts, archives and so on.
			$conditions = array();
			foreach ( (array) ( $data['conditions'] ?? array() ) as $condition ) {
				$parts = array_values( array_filter( array_map( array( $this, 'clean_scalar' ), (array) $condition ), 'is_string' ) );
				if ( $parts && in_array( $parts[0], array( 'include', 'exclude' ), true ) ) {
					$conditions[] = array_slice( $parts, 0, 4 );
				}
			}
			$this->elementor->set_conditions( $post_id, $conditions );
		}

		update_post_meta( $post_id, '_ofss_hash', md5( (string) get_post_meta( $post_id, '_elementor_data', true ) ) );
		++$state['cursor'];

		return false;
	}

	/**
	 * Create the menus of the design and put them in the theme's locations.
	 *
	 * @param array $state Run.
	 * @return true|WP_Error
	 */
	private function step_menus( array &$state ) {
		if ( ! isset( $state['manifest']['files']['site/menus.json'] ) ) {
			return true;
		}

		$menus = $this->package->read( $state['dir'] . '/package.zip', 'site/menus.json', $state['manifest']['files'] );
		if ( is_wp_error( $menus ) ) {
			return $menus;
		}

		$resolver  = new TokenResolver( $state['media'], $state['posts'], (string) ( $state['front'] ?? '' ), (array) ( $state['menus'] ?? array() ) );
		$locations = (array) get_theme_mod( 'nav_menu_locations', array() );

		foreach ( $menus as $menu ) {
			if ( ! is_array( $menu ) || ! preg_match( '/^[a-z0-9-]+$/', (string) ( $menu['uid'] ?? '' ) ) ) {
				continue;
			}
			$uid   = $state['site'] . ':menu:' . $menu['uid'];
			$found = get_terms(
				array(
					'taxonomy'   => 'nav_menu',
					'hide_empty' => false,
					'fields'     => 'ids',
					'meta_key'   => '_ofss_uid', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- One lookup per imported menu.
					'meta_value' => $uid, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				)
			);

			if ( $found && ! is_wp_error( $found ) ) {
				$menu_id = (int) $found[0];
				foreach ( (array) wp_get_nav_menu_items( $menu_id, array( 'post_status' => 'any' ) ) as $old ) {
					wp_delete_post( $old->ID, true );
				}
			} else {
				$title   = sanitize_text_field( $state['name'] . ': ' . ( $menu['name'] ?? $menu['uid'] ) );
				$menu_id = wp_create_nav_menu( $title );
				if ( is_wp_error( $menu_id ) ) {
					$menu_id = wp_create_nav_menu( $title . ' ' . $state['id'] );
				}
				if ( is_wp_error( $menu_id ) ) {
					return new WP_Error( 'ofss_menu', __( 'A menu of this design could not be created.', 'open-frame-starter-sites' ) );
				}
				update_term_meta( $menu_id, '_ofss_uid', $uid );
				update_term_meta( $menu_id, '_ofss_site', $state['site'] );
				update_term_meta( $menu_id, '_ofss_run', $state['id'] );
				++$state['counts']['menus'];
			}

			foreach ( (array) ( $menu['items'] ?? array() ) as $item ) {
				$target = $resolver->id( $item['url'] ?? '' );
				$args   = array(
					'menu-item-title'  => sanitize_text_field( (string) ( $item['title'] ?? '' ) ),
					'menu-item-status' => 'publish',
				);
				if ( $target ) {
					$args += array(
						'menu-item-type'      => 'post_type',
						'menu-item-object'    => get_post_type( $target ),
						'menu-item-object-id' => $target,
					);
				} else {
					$args += array(
						'menu-item-type' => 'custom',
						'menu-item-url'  => esc_url_raw( (string) $resolver->resolve( (string) ( $item['url'] ?? '#' ) ) ),
					);
				}
				wp_update_nav_menu_item( $menu_id, 0, $args );
			}

			// Widgets that ask which menu to show name it by its slug.
			$term = get_term( $menu_id, 'nav_menu' );
			if ( $term && ! is_wp_error( $term ) ) {
				$state['menus'][ $menu['uid'] ] = $term->slug;
			}

			$location = (string) ( $menu['location'] ?? '' );
			if ( array_key_exists( $location, get_registered_nav_menus() ) ) {
				$locations[ $location ] = $menu_id;
			}
		}

		set_theme_mod( 'nav_menu_locations', $locations );

		return true;
	}

	/**
	 * Apply the theme settings and the front page of the design.
	 *
	 * @param array $state Run.
	 * @return true|WP_Error
	 */
	private function step_settings( array &$state ) {
		$files = $state['manifest']['files'];
		$zip   = $state['dir'] . '/package.zip';

		if ( isset( $files['site/theme-mods.json'] ) && function_exists( 'open_frame_defaults' ) ) {
			$mods = $this->package->read( $zip, 'site/theme-mods.json', $files );
			if ( is_wp_error( $mods ) ) {
				return $mods;
			}

			// Only settings the theme itself defines, in the type the theme expects.
			foreach ( open_frame_defaults() as $key => $default ) {
				if ( ! array_key_exists( $key, $mods ) ) {
					continue;
				}
				$value = $mods[ $key ];
				if ( is_bool( $default ) ) {
					$value = (bool) $value;
				} elseif ( is_int( $default ) ) {
					$value = (int) $value;
				} elseif ( is_string( $default ) && preg_match( '/^#[0-9a-f]{3,8}$/i', $default ) ) {
					$value = sanitize_hex_color( (string) $value );
				} else {
					$value = sanitize_text_field( (string) $value );
				}
				if ( null !== $value && '' !== $value ) {
					set_theme_mod( $key, $value );
				}
			}
		}

		if ( isset( $files['site/options.json'] ) ) {
			$options = $this->package->read( $zip, 'site/options.json', $files );
			if ( is_wp_error( $options ) ) {
				return $options;
			}

			$resolver = new TokenResolver( $state['media'], $state['posts'], (string) ( $state['front'] ?? '' ), (array) ( $state['menus'] ?? array() ) );
			$front    = $resolver->id( $options['page_on_front'] ?? '' );
			if ( 'page' === ( $options['show_on_front'] ?? '' ) && $front ) {
				update_option( 'show_on_front', 'page' );
				update_option( 'page_on_front', $front );
			}
			$blog = $resolver->id( $options['page_for_posts'] ?? '' );
			if ( $blog ) {
				update_option( 'page_for_posts', $blog );
			}
		}

		return true;
	}

	/**
	 * Rebuild Elementor's files, check the result and write the report.
	 *
	 * @param array $state Run.
	 * @return true
	 */
	private function step_finalize( array &$state ) {
		$this->elementor->clear_cache();

		$front = (int) get_option( 'page_on_front' );
		if ( 'page' !== get_option( 'show_on_front' ) || ! $front || 'publish' !== get_post_status( $front ) ) {
			$state['warnings'][] = __( 'The home page was not set. Choose it under Settings > Reading.', 'open-frame-starter-sites' );
		}
		foreach ( $state['posts'] as $post_id ) {
			if ( false !== strpos( (string) get_post_meta( $post_id, '_elementor_data', true ), 'ofss:' ) ) {
				/* translators: %s: page title. */
				$state['warnings'][] = sprintf( __( '"%s" contains a link or image that could not be connected.', 'open-frame-starter-sites' ), get_the_title( $post_id ) );
			}
		}
		$state['warnings'] = array_values( array_unique( $state['warnings'] ) );

		update_option(
			'ofss_active_site',
			array(
				'slug'        => $state['site'],
				'version'     => $state['version'],
				'run_id'      => $state['id'],
				'imported_at' => time(),
			),
			false
		);

		$this->history->add(
			array(
				'id'       => $state['id'],
				'site'     => $state['site'],
				'name'     => $state['name'],
				'version'  => $state['version'],
				'result'   => 'success',
				'started'  => $state['started'],
				'finished' => time(),
				'counts'   => $state['counts'],
				'warnings' => $state['warnings'],
			)
		);

		$this->package->clean( $state['dir'] );
		$state['dir'] = '';

		/**
		 * Fires after a starter site has been imported. Cache plugins can purge here.
		 *
		 * @since 0.2.0
		 *
		 * @param string $site Site ID.
		 * @param array  $state The finished run.
		 */
		do_action( 'ofss_import_complete', $state['site'], $state );

		return true;
	}

	// Helpers.

	/**
	 * The pages and site parts of the package, in a fixed order.
	 *
	 * @param array $state Run.
	 * @return string[] Entry names.
	 */
	private function documents( array $state ) {
		$names = array_values( preg_grep( '#^content/(pages|posts|products|site-parts|templates)/[a-z0-9-]+\.json$#', array_keys( $state['manifest']['files'] ) ) );
		sort( $names );

		return $names;
	}

	/**
	 * ID of the post that was imported under a uid before, or 0.
	 *
	 * @param string $uid Identity inside the library.
	 * @return int
	 */
	private function find( $uid ) {
		$found = get_posts(
			array(
				'post_type'   => array( 'page', 'post', 'product', 'elementor_library', SiteParts::POST_TYPE ),
				'post_status' => array( 'publish', 'draft', 'private', 'pending' ),
				'numberposts' => 1,
				'fields'      => 'ids',
				'meta_key'    => '_ofss_uid', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- One lookup per imported page.
				'meta_value'  => $uid, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			)
		);

		return $found ? (int) $found[0] : 0;
	}

	/**
	 * Mark a post as created by this run.
	 *
	 * @param array  $state   Run.
	 * @param int    $post_id Post ID.
	 * @param string $uid     Identity inside the library.
	 * @return void
	 */
	private function tag( array &$state, $post_id, $uid ) {
		update_post_meta( $post_id, '_ofss_site', $state['site'] );
		update_post_meta( $post_id, '_ofss_uid', $uid );
		update_post_meta( $post_id, '_ofss_run', $state['id'] );
		$state['created'][] = (int) $post_id;
	}

	/**
	 * Clean one value of the kit settings.
	 *
	 * @param mixed $value Value.
	 * @return mixed
	 */
	public function clean_scalar( $value ) {
		return is_string( $value ) ? sanitize_text_field( $value ) : $value;
	}
}
