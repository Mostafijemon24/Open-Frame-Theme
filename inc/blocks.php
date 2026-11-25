<?php
/**
 * Block styles and the block pattern category.
 *
 * The patterns themselves live in the /patterns directory, where WordPress
 * registers them automatically.
 *
 * @package Open_Frame
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register custom block styles.
 *
 * @return void
 */
function open_frame_register_block_styles() {
	if ( ! function_exists( 'register_block_style' ) ) {
		return;
	}

	register_block_style(
		'core/quote',
		array(
			'name'  => 'open-frame-card',
			'label' => __( 'Card', 'open-frame' ),
		)
	);

	register_block_style(
		'core/group',
		array(
			'name'  => 'open-frame-card',
			'label' => __( 'Card', 'open-frame' ),
		)
	);

	register_block_style(
		'core/paragraph',
		array(
			'name'  => 'open-frame-eyebrow',
			'label' => __( 'Eyebrow', 'open-frame' ),
		)
	);

	register_block_style(
		'core/button',
		array(
			'name'  => 'open-frame-soft',
			'label' => __( 'Soft', 'open-frame' ),
		)
	);

	register_block_style(
		'core/image',
		array(
			'name'  => 'open-frame-shadow',
			'label' => __( 'Shadow', 'open-frame' ),
		)
	);
}
add_action( 'init', 'open_frame_register_block_styles' );

/**
 * Register the Open Frame block pattern category.
 *
 * @return void
 */
function open_frame_register_pattern_category() {
	if ( ! function_exists( 'register_block_pattern_category' ) ) {
		return;
	}

	register_block_pattern_category(
		'open-frame',
		array(
			'label'       => __( 'Open Frame', 'open-frame' ),
			'description' => __( 'Ready-made sections designed for the Open Frame theme.', 'open-frame' ),
		)
	);
}
add_action( 'init', 'open_frame_register_pattern_category' );

/**
 * Map of block editor palette slugs to the Customizer color settings.
 *
 * @return array<string,string>
 */
function open_frame_palette_settings() {
	return array(
		'primary'      => 'open_frame_color_primary',
		'primary-dark' => 'open_frame_color_primary_hover',
		'secondary'    => 'open_frame_color_secondary',
		'accent'       => 'open_frame_color_accent',
		'heading'      => 'open_frame_color_heading',
		'text'         => 'open_frame_color_text',
		'border'       => 'open_frame_color_border',
		'surface'      => 'open_frame_color_surface',
		'background'   => 'open_frame_color_bg',
	);
}

/**
 * Keep the block editor color palette in step with the Customizer colors.
 *
 * Blocks that use a palette color (for example a "Primary" background) follow
 * the Global Colors chosen in the Customizer, on the frontend and in the editor.
 *
 * @param WP_Theme_JSON_Data $theme_json Theme data from theme.json.
 * @return WP_Theme_JSON_Data
 */
function open_frame_filter_theme_json( $theme_json ) {
	$data    = $theme_json->get_data();
	$palette = array();

	if ( isset( $data['settings']['color']['palette']['theme'] ) ) {
		$palette = $data['settings']['color']['palette']['theme'];
	} elseif ( isset( $data['settings']['color']['palette'] ) ) {
		$palette = $data['settings']['color']['palette'];
	}

	if ( empty( $palette ) || ! is_array( $palette ) ) {
		return $theme_json;
	}

	$defaults = open_frame_defaults();
	$settings = open_frame_palette_settings();
	$changed  = false;

	foreach ( $palette as $index => $entry ) {
		if ( ! is_array( $entry ) || ! isset( $entry['slug'], $settings[ $entry['slug'] ] ) ) {
			continue;
		}

		$key   = $settings[ $entry['slug'] ];
		$color = sanitize_hex_color( open_frame_get_mod( $key ) );
		if ( $color && strtolower( $color ) !== strtolower( $defaults[ $key ] ) ) {
			$palette[ $index ]['color'] = $color;
			$changed                    = true;
		}
	}

	if ( ! $changed ) {
		return $theme_json;
	}

	return $theme_json->update_with(
		array(
			'version'  => WP_Theme_JSON::LATEST_SCHEMA,
			'settings' => array(
				'color' => array(
					'palette' => array_values( $palette ),
				),
			),
		)
	);
}
add_filter( 'wp_theme_json_data_theme', 'open_frame_filter_theme_json' );
