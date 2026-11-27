<?php
/**
 * Creates or removes Elementor Pro Theme Builder templates for the checks.
 * Run through tests/env/run.php with one argument: "on" or "off".
 *
 * Needs Elementor Pro in the test site (see OFT_ELEMENTOR_PRO_ZIP in
 * tests/env/setup.sh). Elementor Pro is never part of this repository.
 *
 * @package Open_Frame
 */

// phpcs:disable -- Command-line test helper, never loaded by WordPress.
if ( ! class_exists( '\ElementorPro\Modules\ThemeBuilder\Module' ) ) {
	echo "Elementor Pro is not active.\n";
	return;
}

$open_frame_module     = \ElementorPro\Modules\ThemeBuilder\Module::instance();
$open_frame_conditions = $open_frame_module->get_conditions_manager();

// Remove what an earlier run created.
foreach ( get_posts(
	array(
		'post_type'   => 'elementor_library',
		'post_status' => 'any',
		'numberposts' => -1,
		'meta_key'    => '_oft_fixture',
	)
) as $open_frame_post ) {
	wp_delete_post( $open_frame_post->ID, true );
}

if ( 'on' === ( $open_frame_args[0] ?? 'on' ) ) {
	$open_frame_templates = array(
		'header'       => array( 'include', 'general' ),
		'footer'       => array( 'include', 'general' ),
		'single-post'  => array( 'include', 'singular', 'post' ),
		'archive'      => array( 'include', 'archive' ),
		'error-404'    => array( 'include', 'singular', 'not_found404' ),
	);

	foreach ( $open_frame_templates as $open_frame_type => $open_frame_condition ) {
		$open_frame_document = \Elementor\Plugin::$instance->documents->create(
			$open_frame_type,
			array(
				'post_title'  => 'OFT ' . $open_frame_type,
				'post_status' => 'publish',
			)
		);
		if ( is_wp_error( $open_frame_document ) ) {
			echo $open_frame_type, ': ', $open_frame_document->get_error_message(), "\n";
			continue;
		}

		$open_frame_document->save(
			array(
				'elements' => array(
					array(
						'id'       => substr( md5( $open_frame_type ), 0, 7 ),
						'elType'   => 'container',
						'settings' => array(
							'content_width' => 'full',
							'css_classes'   => 'oft-pro oft-pro-' . $open_frame_type,
						),
						'elements' => array(
							array(
								'id'         => substr( md5( $open_frame_type . 'h' ), 0, 7 ),
								'elType'     => 'widget',
								'widgetType' => 'heading',
								'settings'   => array(
									'title'       => 'Theme Builder ' . $open_frame_type,
									'header_size' => 'p',
								),
								'elements'   => array(),
							),
						),
					),
				),
			)
		);

		update_post_meta( $open_frame_document->get_main_id(), '_oft_fixture', 1 );
		$open_frame_conditions->save_conditions( $open_frame_document->get_main_id(), array( $open_frame_condition ) );
		echo $open_frame_type, ' => ', $open_frame_document->get_main_id(), "\n";
	}
}

$open_frame_conditions->get_cache()->regenerate();
\Elementor\Plugin::$instance->files_manager->clear_cache();
echo "Theme Builder fixtures: ", $open_frame_args[0] ?? 'on', "\n";
