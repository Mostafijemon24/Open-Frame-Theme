<?php
/**
 * WooCommerce integration.
 *
 * Declares support, wraps the shop templates in the theme's layout and loads
 * a small stylesheet that applies the design tokens to the store. Nothing
 * here runs unless WooCommerce is active.
 *
 * @package Open_Frame
 * @since   1.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Declare WooCommerce support.
 *
 * @since 1.1.0
 *
 * @return void
 */
function open_frame_woocommerce_setup() {
	add_theme_support(
		'woocommerce',
		array(
			'thumbnail_image_width' => 480,
			'single_image_width'    => 800,
			'product_grid'          => array(
				'default_columns' => 3,
				'min_columns'     => 2,
				'max_columns'     => 4,
			),
		)
	);
	add_theme_support( 'wc-product-gallery-zoom' );
	add_theme_support( 'wc-product-gallery-lightbox' );
	add_theme_support( 'wc-product-gallery-slider' );
}
add_action( 'after_setup_theme', 'open_frame_woocommerce_setup' );

/**
 * Whether WooCommerce is active.
 *
 * @since 1.1.0
 *
 * @return bool
 */
function open_frame_woocommerce_is_active() {
	return class_exists( 'WooCommerce' );
}

/**
 * Whether the current view belongs to the store.
 *
 * @since 1.1.0
 *
 * @return bool
 */
function open_frame_is_woocommerce_view() {
	if ( ! open_frame_woocommerce_is_active() ) {
		return false;
	}

	return is_woocommerce() || is_cart() || is_checkout() || is_account_page();
}

/**
 * Replace WooCommerce's content wrappers and sidebar with the theme's.
 *
 * @since 1.1.0
 *
 * @return void
 */
function open_frame_woocommerce_hooks() {
	if ( ! open_frame_woocommerce_is_active() ) {
		return;
	}

	remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );
	remove_action( 'woocommerce_after_main_content', 'woocommerce_output_content_wrapper_end', 10 );
	remove_action( 'woocommerce_sidebar', 'woocommerce_get_sidebar', 10 );

	add_action( 'woocommerce_before_main_content', 'open_frame_woocommerce_wrapper_start', 10 );
	add_action( 'woocommerce_after_main_content', 'open_frame_woocommerce_wrapper_end', 10 );
}
add_action( 'init', 'open_frame_woocommerce_hooks' );

/**
 * Open the theme layout around the shop templates.
 *
 * @since 1.1.0
 *
 * @return void
 */
function open_frame_woocommerce_wrapper_start() {
	echo '<div class="of-container of-content-area">';
	echo '<div class="' . esc_attr( open_frame_layout_classes() ) . '">';
	echo '<main id="main" class="site-main of-primary of-woocommerce">';
}

/**
 * Close the theme layout around the shop templates.
 *
 * @since 1.1.0
 *
 * @return void
 */
function open_frame_woocommerce_wrapper_end() {
	echo '</main></div></div>';
}

/**
 * Give store views the full container width.
 *
 * The shop is an archive and would otherwise take the blog layout and its
 * sidebar; the cart and checkout need more room than the content width.
 *
 * @since 1.1.0
 *
 * @param string $layout Layout for the current view.
 * @return string
 */
function open_frame_woocommerce_layout( $layout ) {
	return open_frame_is_woocommerce_view() ? 'full-width' : $layout;
}
add_filter( 'open_frame_layout', 'open_frame_woocommerce_layout' );

/**
 * Load the store stylesheet.
 *
 * Products can appear on any page (blocks, shortcodes, page builders), so the
 * stylesheet loads on every view while WooCommerce is active.
 *
 * @since 1.1.0
 *
 * @return void
 */
function open_frame_woocommerce_enqueue() {
	if ( ! open_frame_woocommerce_is_active() ) {
		return;
	}

	wp_enqueue_style(
		'open-frame-woocommerce',
		OPEN_FRAME_URI . '/assets/css/woocommerce.css',
		array( 'open-frame-style' ),
		OPEN_FRAME_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'open_frame_woocommerce_enqueue', 15 );
