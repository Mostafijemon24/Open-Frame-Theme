<?php
/**
 * The only place where the plugin calls Elementor.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Elementor;

use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * A thin layer over Elementor's own functions. When Elementor changes, this
 * file is where the difference is absorbed; nothing else in the plugin knows
 * how Elementor stores or renders anything.
 */
class Adapter {

	/**
	 * Whether Elementor is loaded.
	 *
	 * @return bool
	 */
	public function is_ready() {
		return did_action( 'elementor/loaded' ) && class_exists( '\Elementor\Plugin' ) && isset( \Elementor\Plugin::$instance->documents );
	}

	/**
	 * Names of the widget types registered on this site.
	 *
	 * @return string[]
	 */
	public function widgets() {
		return array_keys( (array) \Elementor\Plugin::$instance->widgets_manager->get_widget_types() );
	}

	/**
	 * Whether flexbox containers, which every design is built with, are switched on.
	 *
	 * @return bool
	 */
	public function has_containers() {
		return (bool) \Elementor\Plugin::$instance->experiments->is_feature_active( 'container' );
	}

	/**
	 * ID of the active kit (Elementor's Site Settings).
	 *
	 * @return int
	 */
	public function active_kit() {
		return (int) \Elementor\Plugin::$instance->kits_manager->get_active_id();
	}

	/**
	 * Make a kit the active one.
	 *
	 * @param int $kit_id Kit ID.
	 * @return void
	 */
	public function activate_kit( $kit_id ) {
		update_option( 'elementor_active_kit', (int) $kit_id );
	}

	/**
	 * Create a kit with the given settings and make it active.
	 *
	 * The site's current kit is left as it is, so it can be switched back to.
	 *
	 * @param string $name     Name of the kit.
	 * @param array  $settings Site Settings.
	 * @return int|WP_Error Kit ID.
	 */
	public function create_kit( $name, array $settings ) {
		$kit_id = \Elementor\Plugin::$instance->kits_manager->create_new_kit( $name, $settings, true );

		return $kit_id ? (int) $kit_id : new WP_Error( 'ofss_kit', __( 'Elementor could not create the Site Settings for this design.', 'open-frame-starter-sites' ) );
	}

	/**
	 * Delete a kit that this plugin created and that is no longer in use.
	 *
	 * Elementor stops the request with a confirmation screen when a kit is
	 * trashed or deleted, to protect the user's Site Settings. A kit that is
	 * already in the trash is deleted without it, so the kit is marked as
	 * trashed first. The active kit is never touched.
	 *
	 * @param int $kit_id Kit ID.
	 * @return bool Whether the kit was deleted.
	 */
	public function delete_unused_kit( $kit_id ) {
		if ( (int) $kit_id === $this->active_kit() ) {
			return false;
		}

		wp_update_post(
			array(
				'ID'          => $kit_id,
				'post_status' => 'trash',
			)
		);

		// Elementor keeps documents in memory; it has to see the new status.
		\Elementor\Plugin::$instance->documents->get( $kit_id, false );

		return (bool) wp_delete_post( $kit_id, true );
	}

	/**
	 * Store Elementor content on a post, through Elementor itself.
	 *
	 * @param int   $post_id  Post ID.
	 * @param array $elements Element tree.
	 * @param array $settings Page settings.
	 * @return true|WP_Error
	 */
	public function save_document( $post_id, array $elements, array $settings ) {
		$document = \Elementor\Plugin::$instance->documents->get( $post_id, false );
		if ( ! $document ) {
			return new WP_Error( 'ofss_document', __( 'Elementor could not open a page of this design.', 'open-frame-starter-sites' ) );
		}

		$document->set_is_built_with_elementor( true );
		$saved = $document->save(
			array(
				'elements' => $elements,
				'settings' => $settings,
			)
		);

		return $saved ? true : new WP_Error( 'ofss_document', __( 'Elementor could not save a page of this design.', 'open-frame-starter-sites' ) );
	}

	/**
	 * The markup of an Elementor document, for display.
	 *
	 * @param int $post_id Post ID.
	 * @return string
	 */
	public function render( $post_id ) {
		return (string) \Elementor\Plugin::$instance->frontend->get_builder_content_for_display( $post_id );
	}

	/**
	 * Whether the current request is Elementor's editor or its preview.
	 *
	 * @return bool
	 */
	public function is_editing() {
		$elementor = \Elementor\Plugin::$instance;

		return ( isset( $elementor->preview ) && $elementor->preview->is_preview_mode() ) || ( isset( $elementor->editor ) && $elementor->editor->is_edit_mode() );
	}

	/**
	 * Have Elementor rebuild its generated CSS.
	 *
	 * @return void
	 */
	public function clear_cache() {
		\Elementor\Plugin::$instance->files_manager->clear_cache();
	}
}
