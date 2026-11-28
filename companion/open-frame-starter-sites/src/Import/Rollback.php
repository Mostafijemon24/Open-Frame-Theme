<?php
/**
 * Undoing an import.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Import;

use OpenFrame\StarterSites\Config;
use OpenFrame\StarterSites\Elementor\Adapter;
use OpenFrame\StarterSites\Fonts\Fonts;
use OpenFrame\StarterSites\History\Log;
use OpenFrame\StarterSites\SiteParts\SiteParts;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Removes what a run created and puts back the settings it changed.
 *
 * Only objects tagged with the run ID are deleted. Content the import did not
 * create, and images it reused from an earlier import, are left alone.
 */
class Rollback {

	/**
	 * Plugin configuration.
	 *
	 * @var Config
	 */
	private $config;

	/**
	 * Elementor adapter.
	 *
	 * @var Adapter
	 */
	private $elementor;

	/**
	 * History.
	 *
	 * @var Log
	 */
	private $history;

	/**
	 * Constructor.
	 *
	 * @param Config  $config    Plugin configuration.
	 * @param Adapter $elementor Elementor adapter.
	 * @param Log     $history   History.
	 */
	public function __construct( Config $config, Adapter $elementor, Log $history ) {
		$this->config    = $config;
		$this->elementor = $elementor;
		$this->history   = $history;
	}

	/**
	 * Roll back a run, finished or not.
	 *
	 * @param array $state Run (see Runner).
	 * @return array|WP_Error The run afterwards.
	 */
	public function run( array $state ) {
		if ( 'rolled_back' === $state['status'] ) {
			return $state;
		}

		$lock = get_transient( Runner::LOCK );
		if ( is_array( $lock ) && $lock['expires'] > time() ) {
			return new WP_Error( 'ofss_busy', __( 'The import is still running in another window. Give it a moment.', 'open-frame-starter-sites' ), array( 'status' => 409 ) );
		}

		$snapshot = get_option( 'ofss_snapshot_' . $state['id'] );

		// The kit first: Elementor refuses to delete the one that is in use.
		if ( is_array( $snapshot ) ) {
			$this->restore( $snapshot, array( 'elementor_active_kit', 'elementor_previous_kit' ) );
		}

		$posts = get_posts(
			array(
				'post_type'   => array( 'page', 'post', 'product', 'attachment', 'elementor_library', 'nav_menu_item', SiteParts::POST_TYPE ),
				'post_status' => array( 'publish', 'draft', 'private', 'pending', 'inherit', 'trash' ),
				'numberposts' => -1,
				'fields'      => 'ids',
				'meta_key'    => '_ofss_run', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- Run once, when the user asks to undo an import.
				'meta_value'  => $state['id'], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			)
		);
		foreach ( $posts as $post_id ) {
			if ( 'attachment' === get_post_type( $post_id ) ) {
				wp_delete_attachment( $post_id, true );
			} elseif ( 'elementor_library' === get_post_type( $post_id ) ) {
				if ( ! $this->elementor->is_ready() ) {
					continue;
				}
				if ( $this->elementor->is_kit( $post_id ) ) {
					$this->elementor->delete_unused_kit( $post_id );
				} else {
					$this->elementor->delete_template( $post_id );
				}
			} else {
				wp_delete_post( $post_id, true );
			}
		}

		$menus = get_terms(
			array(
				'taxonomy'   => 'nav_menu',
				'hide_empty' => false,
				'fields'     => 'ids',
				'meta_key'   => '_ofss_run', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value' => $state['id'], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			)
		);
		foreach ( is_wp_error( $menus ) ? array() : $menus as $menu_id ) {
			wp_delete_nav_menu( $menu_id );
		}

		$categories = get_terms(
			array(
				// Product categories only exist while WooCommerce is active.
				'taxonomy'   => taxonomy_exists( 'product_cat' ) ? array( 'category', 'product_cat' ) : 'category',
				'hide_empty' => false,
				'meta_key'   => '_ofss_run', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value' => $state['id'], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			)
		);
		foreach ( is_wp_error( $categories ) ? array() : $categories as $category ) {
			wp_delete_term( $category->term_id, $category->taxonomy );
		}

		( new Fonts() )->remove_run( $state['id'] );

		// The other settings last: deleting a menu makes WordPress rewrite the
		// theme's menu locations, which would undo part of the restore.
		if ( is_array( $snapshot ) ) {
			$this->restore( $snapshot, array( 'show_on_front', 'page_on_front', 'page_for_posts' ) );

			// To the theme they were taken from, which need not be the active one
			// any more (a child theme activated since). Snapshots of 1.0.0 do not name it.
			$stylesheet = isset( $snapshot['stylesheet'] ) && is_string( $snapshot['stylesheet'] ) && '' !== $snapshot['stylesheet'] ? $snapshot['stylesheet'] : get_stylesheet();
			if ( is_array( $snapshot['theme_mods'] ) ) {
				update_option( 'theme_mods_' . $stylesheet, $snapshot['theme_mods'] );
			} else {
				delete_option( 'theme_mods_' . $stylesheet );
			}

			if ( is_array( $snapshot['active_site'] ) ) {
				update_option( 'ofss_active_site', $snapshot['active_site'], false );
			} else {
				delete_option( 'ofss_active_site' );
			}
		}

		( new Package( $this->config ) )->clean( $state['dir'] ?? '' );
		delete_option( 'ofss_snapshot_' . $state['id'] );

		if ( $this->elementor->is_ready() ) {
			$this->elementor->clear_cache();
		}

		$this->history->add(
			array(
				'id'       => $state['id'] . 'r',
				'site'     => $state['site'],
				'name'     => $state['name'],
				'version'  => $state['version'],
				'result'   => 'rolled_back',
				'started'  => $state['started'],
				'finished' => time(),
			)
		);

		$state['status'] = 'rolled_back';
		$state['dir']    = '';
		$state['error']  = '';
		update_option( Runner::STATE, $state, false );

		return $state;
	}

	/**
	 * Put options back to what they were, removing those that did not exist.
	 *
	 * @param array    $snapshot Saved values.
	 * @param string[] $options  Option names.
	 * @return void
	 */
	private function restore( array $snapshot, array $options ) {
		foreach ( $options as $option ) {
			if ( false === ( $snapshot[ $option ] ?? false ) ) {
				delete_option( $option );
			} else {
				update_option( $option, $snapshot[ $option ] );
			}
		}
	}
}
