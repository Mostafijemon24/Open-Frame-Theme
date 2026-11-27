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
	 * Kinds of Theme Builder template a design may bring.
	 */
	const TEMPLATE_TYPES = array( 'header', 'footer', 'single-post', 'single-page', 'archive', 'search-results', 'error-404' );

	/**
	 * Whether Elementor Pro's Theme Builder is available.
	 *
	 * @return bool
	 */
	public function has_theme_builder() {
		return class_exists( '\\ElementorPro\\Modules\\ThemeBuilder\\Module' );
	}

	/**
	 * Create an empty Theme Builder template.
	 *
	 * @param string $type  One of TEMPLATE_TYPES.
	 * @param string $title Title shown in the Theme Builder.
	 * @return int|WP_Error Post ID.
	 */
	public function create_template( $type, $title ) {
		if ( ! $this->has_theme_builder() || ! in_array( $type, self::TEMPLATE_TYPES, true ) ) {
			return new WP_Error( 'ofss_template', __( 'This design needs Elementor Pro for its header, footer and blog templates.', 'open-frame-starter-sites' ) );
		}

		$document = \Elementor\Plugin::$instance->documents->create(
			$type,
			array(
				'post_title'  => $title,
				'post_status' => 'publish',
			)
		);

		return is_wp_error( $document ) || ! $document ? new WP_Error( 'ofss_template', __( 'Elementor Pro could not create a template of this design.', 'open-frame-starter-sites' ) ) : (int) $document->get_main_id();
	}

	/**
	 * Say where a Theme Builder template is used.
	 *
	 * @param int     $post_id    Template.
	 * @param array[] $conditions Each a list such as array( 'include', 'general' ).
	 * @return void
	 */
	public function set_conditions( $post_id, array $conditions ) {
		if ( $this->has_theme_builder() ) {
			\ElementorPro\Modules\ThemeBuilder\Module::instance()->get_conditions_manager()->save_conditions( $post_id, $conditions );
		}
	}

	/**
	 * Delete a Theme Builder template and forget where it was used.
	 *
	 * @param int $post_id Template.
	 * @return void
	 */
	public function delete_template( $post_id ) {
		wp_delete_post( $post_id, true );

		if ( $this->has_theme_builder() ) {
			\ElementorPro\Modules\ThemeBuilder\Module::instance()->get_conditions_manager()->get_cache()->regenerate();
		}
	}

	/**
	 * Whether a post in Elementor's library is a kit (Site Settings) rather than a template.
	 *
	 * @param int $post_id Post ID.
	 * @return bool
	 */
	public function is_kit( $post_id ) {
		return 'kit' === get_post_meta( $post_id, '_elementor_template_type', true );
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
	 * Put the stylesheet of an Elementor document into the head of the page.
	 *
	 * Elementor adds the stylesheet of a document at the moment the document
	 * is rendered. For a header that is after the head has been sent, so the
	 * stylesheet would arrive at the end of the page: the header would first
	 * appear unstyled, and the page would jump when the styles came in.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	public function enqueue_styles( $post_id ) {
		$elementor = \Elementor\Plugin::$instance;

		if ( class_exists( '\Elementor\Core\Files\CSS\Post' ) ) {
			\Elementor\Core\Files\CSS\Post::create( $post_id )->enqueue();
		}

		// The styles of the widgets the document uses, which Elementor notes with the
		// document once it has been rendered. Only the styles: a script that is
		// loaded this early runs before Elementor has printed the settings it reads.
		if ( ! isset( $elementor->assets_loader ) || ! method_exists( $elementor->assets_loader, 'enable_assets' ) ) {
			return;
		}

		$assets = get_post_meta( $post_id, '_elementor_page_assets', true );
		if ( is_array( $assets ) && ! empty( $assets['styles'] ) && is_array( $assets['styles'] ) ) {
			$elementor->assets_loader->enable_assets( array( 'styles' => $assets['styles'] ) );
		}
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
