<?php
/**
 * Dynamic CSS generated from Customizer settings.
 *
 * Output as an inline stylesheet attached to the main theme stylesheet so it
 * loads with correct ordering and benefits from the same cache-busting version.
 * Only values that differ from the stylesheet defaults are printed, so the
 * tokens in style.css stay the single source of truth.
 *
 * @package Open_Frame
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Map of color settings to the CSS custom property each one controls.
 *
 * @return array<string,string>
 */
function open_frame_color_variables() {
	return array(
		'open_frame_color_primary'       => '--of-color-primary',
		'open_frame_color_primary_hover' => '--of-color-primary-hover',
		'open_frame_color_secondary'     => '--of-color-secondary',
		'open_frame_color_accent'        => '--of-color-accent',
		'open_frame_color_heading'       => '--of-color-heading',
		'open_frame_color_text'          => '--of-color-text',
		'open_frame_color_link'          => '--of-color-link',
		'open_frame_color_link_hover'    => '--of-color-link-hover',
		'open_frame_color_border'        => '--of-color-border',
		'open_frame_color_bg'            => '--of-color-bg',
		'open_frame_color_surface'       => '--of-color-surface',
	);
}

/**
 * Build the dynamic CSS string from theme mods.
 *
 * @return string
 */
function open_frame_build_dynamic_css() {
	$defaults = open_frame_defaults();
	$fonts    = open_frame_font_choices();
	$vars     = array();

	/*
	 * Block editor presets (palette colors, layout sizes). WordPress declares
	 * these on `body` up to 6.5 and on `:root` from 6.6, so they are printed in
	 * a `body` rule, which takes effect on every supported version.
	 */
	$block_vars = array();
	$presets    = array_flip( open_frame_palette_settings() );

	// Global colors.
	foreach ( open_frame_color_variables() as $key => $property ) {
		$value = sanitize_hex_color( open_frame_get_mod( $key ) );
		if ( $value && strtolower( $value ) !== strtolower( $defaults[ $key ] ) ) {
			$vars[ $property ] = $value;
			if ( isset( $presets[ $key ] ) ) {
				$block_vars[ '--wp--preset--color--' . $presets[ $key ] ] = $value;
			}
		}
	}

	// Tints derived from the primary color (hover backgrounds, focus ring).
	if ( isset( $vars['--of-color-primary'] ) ) {
		$rgb                      = open_frame_hex_to_rgb( $vars['--of-color-primary'] );
		$vars['--of-primary-100'] = open_frame_tint( $vars['--of-color-primary'], 0.88 );
		$vars['--of-focus-ring']  = sprintf( '0 0 0 3px rgba(%d,%d,%d,0.35)', $rgb[0], $rgb[1], $rgb[2] );
	}

	// Typography.
	$body_font    = open_frame_sanitize_font_choice( open_frame_get_mod( 'open_frame_body_font' ) );
	$heading_font = open_frame_sanitize_font_choice( open_frame_get_mod( 'open_frame_heading_font' ) );
	if ( $body_font !== $defaults['open_frame_body_font'] ) {
		$vars['--of-font-body'] = $fonts[ $body_font ]['stack'];
	}
	if ( $heading_font !== $defaults['open_frame_heading_font'] ) {
		$vars['--of-font-heading'] = $fonts[ $heading_font ]['stack'];
	}

	$base_size = open_frame_clamp( open_frame_get_mod( 'open_frame_base_font_size' ), 14, 22 );
	if ( $base_size !== $defaults['open_frame_base_font_size'] ) {
		// Expressed in rem so the visitor's browser font-size preference still applies.
		$vars['--of-fs-body'] = ( $base_size / 16 ) . 'rem';
	}

	$line_height = open_frame_clamp( open_frame_get_mod( 'open_frame_body_line_height' ), 120, 200 );
	if ( $line_height !== $defaults['open_frame_body_line_height'] ) {
		$vars['--of-lh-body'] = (string) ( $line_height / 100 );
	}

	$heading_weight = open_frame_clamp( open_frame_get_mod( 'open_frame_heading_weight' ), 400, 900 );
	if ( $heading_weight !== $defaults['open_frame_heading_weight'] ) {
		$vars['--of-fw-heading'] = (string) $heading_weight;
	}

	// Layout.
	$container = open_frame_clamp( open_frame_get_mod( 'open_frame_container_width' ), 800, 1600 );
	if ( $container !== $defaults['open_frame_container_width'] ) {
		$vars['--of-container-wide']                  = $container . 'px';
		$block_vars['--wp--style--global--wide-size'] = $container . 'px';
	}

	$content = open_frame_clamp( open_frame_get_mod( 'open_frame_content_width' ), 600, 1400 );
	if ( $content !== $defaults['open_frame_content_width'] ) {
		$vars['--of-content-width']                      = $content . 'px';
		$block_vars['--wp--style--global--content-size'] = $content . 'px';
	}

	$section = open_frame_clamp( open_frame_get_mod( 'open_frame_section_spacing' ), 16, 160 );
	if ( $section !== $defaults['open_frame_section_spacing'] ) {
		$vars['--of-section-spacing'] = $section . 'px';
	}

	// Header and footer colors are always printed so the controls stay truthful
	// even when the global surface color has been changed.
	$chrome = array(
		'open_frame_header_bg'      => '--of-header-bg',
		'open_frame_header_text'    => '--of-header-text',
		'open_frame_footer_bg'      => '--of-footer-bg',
		'open_frame_footer_text'    => '--of-footer-text',
		'open_frame_footer_heading' => '--of-footer-heading',
	);
	foreach ( $chrome as $key => $property ) {
		$value = sanitize_hex_color( open_frame_get_mod( $key ) );
		if ( $value ) {
			$vars[ $property ] = $value;
		}
	}

	$css = '';

	if ( ! empty( $vars ) ) {
		$css .= ':root{';
		foreach ( $vars as $name => $value ) {
			$css .= $name . ':' . $value . ';';
		}
		$css .= '}';
	}

	if ( ! empty( $block_vars ) ) {
		$css .= 'body{';
		foreach ( $block_vars as $name => $value ) {
			$css .= $name . ':' . $value . ';';
		}
		$css .= '}';
	}

	return $css;
}

/**
 * Attach the dynamic CSS to the main stylesheet.
 *
 * @return void
 */
function open_frame_output_dynamic_css() {
	$css = open_frame_build_dynamic_css();
	if ( '' !== $css ) {
		wp_add_inline_style( 'open-frame-style', wp_strip_all_tags( $css ) );
	}
}
add_action( 'wp_enqueue_scripts', 'open_frame_output_dynamic_css', 20 );
