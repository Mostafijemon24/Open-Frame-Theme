<?php
/**
 * Creates the content the checks rely on. Safe to run again.
 * Run through tests/env/run.php (setup.sh does this).
 *
 * @package Open_Frame
 */

// phpcs:disable -- Command-line test helper, never loaded by WordPress.
switch_theme( 'open-frame' );
update_option( 'permalink_structure', '/%postname%/' );

foreach ( array( 'elementor/elementor.php', 'woocommerce/woocommerce.php', 'open-frame-starter-sites/open-frame-starter-sites.php' ) as $open_frame_plugin ) {
	if ( ! is_plugin_active( $open_frame_plugin ) ) {
		$open_frame_result = activate_plugin( $open_frame_plugin );
		if ( is_wp_error( $open_frame_result ) ) {
			echo 'Could not activate ', $open_frame_plugin, ': ', $open_frame_result->get_error_message(), "\n";
		}
		// Plugins finish loading on the next request.
		echo "Activated $open_frame_plugin; run the fixtures again.\n";
		$open_frame_rerun = true;
	}
}
if ( ! empty( $open_frame_rerun ) ) {
	passthru( escapeshellcmd( PHP_BINARY ) . ' ' . escapeshellarg( __DIR__ . '/run.php' ) . ' ' . escapeshellarg( rtrim( ABSPATH, '/' ) ) . ' ' . escapeshellarg( __FILE__ ) );
	return;
}

/**
 * Create a page once and return its ID.
 */
function open_frame_test_page( $slug, $title, $content = '' ) {
	$page = get_page_by_path( $slug );
	return wp_insert_post(
		array(
			'ID'           => $page ? $page->ID : 0,
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_content' => $content,
		)
	);
}

function open_frame_test_id() {
	return substr( md5( uniqid( '', true ) ), 0, 7 );
}

function open_frame_test_widget( $type, $settings ) {
	return array(
		'id'         => open_frame_test_id(),
		'elType'     => 'widget',
		'widgetType' => $type,
		'settings'   => $settings,
		'elements'   => array(),
	);
}

function open_frame_test_container( $settings, $children ) {
	return array(
		'id'       => open_frame_test_id(),
		'elType'   => 'container',
		'settings' => $settings,
		'elements' => $children,
	);
}

// Plain content.
open_frame_test_page( 'plain-page', 'Plain page', '<!-- wp:paragraph --><p>Plain block content with a <a href="#">link</a>.</p><!-- /wp:paragraph --><!-- wp:heading --><h2 class="wp-block-heading">A heading</h2><!-- /wp:heading -->' );

// Elementor pages, one per page template.
if ( did_action( 'elementor/loaded' ) ) {
	$open_frame_padding  = array(
		'unit'     => 'px',
		'top'      => '96',
		'right'    => '24',
		'bottom'   => '96',
		'left'     => '24',
		'isLinked' => false,
	);
	$open_frame_elements = array(
		open_frame_test_container(
			array(
				'content_width'         => 'full',
				'background_background' => 'classic',
				'background_color'      => '#0f172a',
				'padding'               => $open_frame_padding,
				'css_classes'           => 'oft-hero',
			),
			array(
				open_frame_test_widget(
					'heading',
					array(
						'title'       => 'Full-bleed hero section',
						'header_size' => 'h2',
						'title_color' => '#ffffff',
						'align'       => 'center',
					)
				),
				open_frame_test_widget(
					'text-editor',
					array(
						'editor'     => '<p>A paragraph with a <a href="#">link</a> in an Elementor text widget.</p>',
						'text_color' => '#cbd5e1',
						'align'      => 'center',
					)
				),
				open_frame_test_widget(
					'button',
					array(
						'text'              => 'Elementor button',
						'align'             => 'center',
						'background_color'  => '#f5a623',
						'button_text_color' => '#111111',
					)
				),
			)
		),
		open_frame_test_container(
			array(
				'content_width' => 'boxed',
				'css_classes'   => 'oft-boxed',
			),
			array(
				open_frame_test_widget(
					'heading',
					array(
						'title'       => 'Boxed section',
						'header_size' => 'h2',
					)
				),
				open_frame_test_widget( 'button', array( 'text' => 'Default button' ) ),
			)
		),
	);

	$open_frame_pages = array(
		'el-default'    => array( 'default', array() ),
		'el-hide-title' => array( 'default', array( 'hide_title' => 'yes' ) ),
		'el-full-width' => array( 'elementor_header_footer', array() ),
		'el-canvas'     => array( 'elementor_canvas', array() ),
	);
	foreach ( $open_frame_pages as $open_frame_slug => $open_frame_page ) {
		$open_frame_id = open_frame_test_page( $open_frame_slug, 'Elementor ' . $open_frame_slug );
		update_post_meta( $open_frame_id, '_wp_page_template', $open_frame_page[0] );
		$open_frame_document = \Elementor\Plugin::$instance->documents->get( $open_frame_id, false );
		$open_frame_document->set_is_built_with_elementor( true );
		$open_frame_document->save(
			array(
				'elements' => $open_frame_elements,
				'settings' => array_merge( array( 'template' => $open_frame_page[0] ), $open_frame_page[1] ),
			)
		);
	}
	\Elementor\Plugin::$instance->files_manager->clear_cache();
	echo "Elementor pages ready.\n";
}

// A small store.
if ( class_exists( 'WooCommerce' ) ) {
	WC_Install::install();
	WC_Install::create_pages();
	update_option( 'woocommerce_coming_soon', 'no' );
	update_option( 'woocommerce_onboarding_profile', array( 'skipped' => true ) );
	update_option( 'woocommerce_default_country', 'US:CA' );
	update_option(
		'woocommerce_cod_settings',
		array(
			'enabled' => 'yes',
			'title'   => 'Cash on delivery',
		)
	);

	$open_frame_products = array(
		'Linen Overshirt'                                                     => 89,
		'Canvas Weekender Bag with a Very Long Product Name To Test Wrapping' => 145,
		'Ceramic Pour-Over Set'                                               => 64,
		'Merino Crew Sock'                                                    => 18,
		'Walnut Desk Tray'                                                    => 42,
		'Brass Key Hook'                                                      => 24,
		'Wool Throw'                                                          => 120,
	);
	$open_frame_index    = 0;
	foreach ( $open_frame_products as $open_frame_name => $open_frame_price ) {
		$open_frame_sku = 'oft-' . $open_frame_index;
		if ( ! wc_get_product_id_by_sku( $open_frame_sku ) ) {
			$open_frame_product = new WC_Product_Simple();
			$open_frame_product->set_name( $open_frame_name );
			$open_frame_product->set_slug( 'oft-product-' . $open_frame_index );
			$open_frame_product->set_sku( $open_frame_sku );
			$open_frame_product->set_regular_price( $open_frame_price );
			if ( 0 === $open_frame_index % 3 ) {
				$open_frame_product->set_sale_price( $open_frame_price - 10 );
			}
			$open_frame_product->set_description( str_repeat( 'Made to last and designed to be used every day. ', 6 ) );
			$open_frame_product->set_short_description( 'Short description with the key selling points.' );
			$open_frame_product->set_status( 'publish' );
			$open_frame_product->save();
		}
		++$open_frame_index;
	}
	echo "Store ready.\n";
}

flush_rewrite_rules();
