<?php
/**
 * Elementor integration.
 *
 * Everything here is optional: the theme behaves exactly the same when
 * Elementor is not installed. Elementor's own "Canvas" and "Full Width" page
 * templates need no help from the theme; this file covers the rest:
 *
 * - Elementor Pro's Theme Builder can replace the header, footer, single,
 *   archive and 404 templates.
 * - A page built with Elementor on the default template spans the full width.
 * - Elementor's "Full Width" template keeps the `main` landmark of the skip link.
 * - Optionally, the theme's colors and fonts follow Elementor's Site Settings.
 *
 * @package Open_Frame
 * @since   1.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Whether Elementor is loaded.
 *
 * @since 1.1.0
 *
 * @return bool
 */
function open_frame_elementor_is_active() {
	return did_action( 'elementor/loaded' ) && class_exists( '\Elementor\Plugin' );
}

/**
 * Register every Theme Builder location (Elementor Pro).
 *
 * @since 1.1.0
 *
 * @param object $manager Elementor Pro locations manager.
 * @return void
 */
function open_frame_elementor_register_locations( $manager ) {
	if ( is_object( $manager ) && method_exists( $manager, 'register_all_core_location' ) ) {
		$manager->register_all_core_location();
	}
}
add_action( 'elementor/theme/register_locations', 'open_frame_elementor_register_locations' );

/**
 * Map a theme location to the Theme Builder location that serves it.
 *
 * @since 1.1.0
 *
 * @param string $location Theme location.
 * @return string
 */
function open_frame_elementor_location_name( $location ) {
	// Theme Builder serves the 404 page from a "single" template.
	return '404' === $location ? 'single' : $location;
}

/**
 * Render a location with a Theme Builder template when one applies.
 *
 * @since 1.1.0
 *
 * @param bool   $done     Whether the location was already rendered.
 * @param string $location Theme location.
 * @return bool
 */
function open_frame_elementor_do_location( $done, $location ) {
	if ( $done || ! function_exists( 'elementor_theme_do_location' ) ) {
		return $done;
	}

	return (bool) elementor_theme_do_location( open_frame_elementor_location_name( $location ) );
}
add_filter( 'open_frame_do_location', 'open_frame_elementor_do_location', 10, 2 );

/**
 * Tell the theme when a Theme Builder template will replace a location.
 *
 * @since 1.1.0
 *
 * @param bool   $has      Whether the location is already taken.
 * @param string $location Theme location.
 * @return bool
 */
function open_frame_elementor_has_location( $has, $location ) {
	// The function name is spelled this way in Elementor Pro.
	if ( $has || ! function_exists( 'elementor_location_exits' ) ) {
		return $has;
	}

	return (bool) elementor_location_exits( open_frame_elementor_location_name( $location ), true );
}
add_filter( 'open_frame_has_location', 'open_frame_elementor_has_location', 10, 2 );

/**
 * Treat pages built with Elementor as page-builder pages.
 *
 * @since 1.1.0
 *
 * @param bool $is_builder Whether the page is already known to be a builder page.
 * @param int  $post_id    Page ID.
 * @return bool
 */
function open_frame_elementor_is_builder_page( $is_builder, $post_id ) {
	if ( $is_builder || ! $post_id || ! open_frame_elementor_is_active() ) {
		return $is_builder;
	}

	$elementor = \Elementor\Plugin::$instance;

	// A new page opened in the editor has no Elementor content yet.
	if ( isset( $elementor->preview ) && $elementor->preview->is_preview_mode( $post_id ) ) {
		return true;
	}

	$document = isset( $elementor->documents ) ? $elementor->documents->get( $post_id ) : false;

	return $document && $document->is_built_with_elementor();
}
add_filter( 'open_frame_is_builder_page', 'open_frame_elementor_is_builder_page', 10, 2 );

/**
 * Open the `main` landmark in Elementor's "Full Width" page template.
 *
 * That template prints the content between the theme header and footer with
 * no wrapper, which would leave the skip link without a target.
 *
 * @since 1.1.0
 *
 * @return void
 */
function open_frame_elementor_main_open() {
	echo '<main id="main" class="site-main of-builder">';
}
add_action( 'elementor/page_templates/header-footer/before_content', 'open_frame_elementor_main_open' );

/**
 * Close the `main` landmark in Elementor's "Full Width" page template.
 *
 * @since 1.1.0
 *
 * @return void
 */
function open_frame_elementor_main_close() {
	echo '</main>';
}
add_action( 'elementor/page_templates/header-footer/after_content', 'open_frame_elementor_main_close' );

/**
 * Offer the fonts bundled with the theme in Elementor's font list.
 *
 * @since 1.1.0
 *
 * @param array<string,string> $groups Font groups.
 * @return array<string,string>
 */
function open_frame_elementor_font_groups( $groups ) {
	$groups['open-frame'] = __( 'Open Frame (bundled)', 'open-frame' );

	return $groups;
}
add_filter( 'elementor/fonts/groups', 'open_frame_elementor_font_groups' );

/**
 * Mark the bundled fonts as local fonts.
 *
 * Elementor knows both names as Google fonts and would request them from
 * Google. They are already served from the theme folder (see theme.json), so
 * choosing them in Elementor causes no remote request.
 *
 * @since 1.1.0
 *
 * @param array<string,string> $fonts Font name => group.
 * @return array<string,string>
 */
function open_frame_elementor_fonts( $fonts ) {
	$fonts['Hanken Grotesk'] = 'open-frame';
	$fonts['JetBrains Mono'] = 'open-frame';

	return $fonts;
}
add_filter( 'elementor/fonts/additional_fonts', 'open_frame_elementor_fonts' );

/**
 * Whether the theme follows Elementor's global colors and fonts.
 *
 * @since 1.1.0
 *
 * @return bool
 */
function open_frame_elementor_follows_site_settings() {
	return open_frame_elementor_is_active() && open_frame_get_mod( 'open_frame_follow_elementor' );
}

/**
 * Add a body class while the theme follows Elementor's Site Settings.
 *
 * @since 1.1.0
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function open_frame_elementor_body_class( $classes ) {
	if ( open_frame_elementor_follows_site_settings() ) {
		$classes[] = 'of-follow-elementor';
	}

	return $classes;
}
add_filter( 'body_class', 'open_frame_elementor_body_class' );

/**
 * CSS that points the theme's tokens at Elementor's global colors and fonts.
 *
 * Elementor declares its globals on the `body` element, so the tokens are
 * redefined there. Each one falls back to the Customizer value, which keeps
 * the theme intact when a global is missing.
 *
 * @since 1.1.0
 *
 * @return string
 */
function open_frame_elementor_bridge_css() {
	$fonts   = open_frame_font_choices();
	$body    = $fonts[ open_frame_sanitize_font_choice( open_frame_get_mod( 'open_frame_body_font' ) ) ]['stack'];
	$heading = $fonts[ open_frame_sanitize_font_choice( open_frame_get_mod( 'open_frame_heading_font' ) ) ]['stack'];

	$colors = array();
	foreach ( array( 'primary', 'heading', 'text', 'accent' ) as $role ) {
		$key             = 'open_frame_color_' . $role;
		$value           = sanitize_hex_color( open_frame_get_mod( $key ) );
		$colors[ $role ] = $value ? $value : open_frame_defaults()[ $key ];
	}

	$primary = 'var(--e-global-color-primary,' . $colors['primary'] . ')';
	$text    = 'var(--e-global-color-text,' . $colors['text'] . ')';
	$heads   = 'var(--e-global-color-secondary,' . $colors['heading'] . ')';
	// Tints are mixed into the surface color, so they work on a dark design too.
	$surface = 'var(--of-color-surface,#fff)';

	$vars = array(
		'--of-color-primary'       => $primary,
		'--of-color-primary-hover' => 'color-mix(in srgb,' . $primary . ' 80%,#000)',
		'--of-color-link'          => $primary,
		'--of-color-link-hover'    => 'color-mix(in srgb,' . $primary . ' 80%,#000)',
		'--of-color-focus'         => $primary,
		'--of-primary-100'         => 'color-mix(in srgb,' . $primary . ' 12%,' . $surface . ')',
		'--of-focus-ring'          => '0 0 0 3px color-mix(in srgb,' . $primary . ' 35%,transparent)',
		'--of-color-heading'       => $heads,
		'--of-color-text'          => $text,
		// The neutral greys take the tint of the text color, so quotes, tables,
		// form fields and small print match a warm or a cool design alike.
		'--of-color-muted'         => $text,
		'--of-slate-900'           => $heads,
		'--of-slate-700'           => $text,
		'--of-slate-500'           => $text,
		'--of-slate-400'           => 'color-mix(in srgb,' . $text . ' 55%,' . $surface . ')',
		'--of-slate-300'           => 'color-mix(in srgb,' . $text . ' 30%,' . $surface . ')',
		'--of-slate-200'           => 'color-mix(in srgb,' . $text . ' 16%,' . $surface . ')',
		'--of-slate-100'           => 'color-mix(in srgb,' . $text . ' 8%,' . $surface . ')',
		'--of-slate-50'            => 'color-mix(in srgb,' . $text . ' 4%,' . $surface . ')',
		'--of-color-accent'        => 'var(--e-global-color-accent,' . $colors['accent'] . ')',
		'--of-font-heading'        => 'var(--e-global-typography-primary-font-family,' . $heading . '),' . $heading,
		'--of-font-body'           => 'var(--e-global-typography-text-font-family,' . $body . '),' . $body,
	);

	$css = 'body.of-follow-elementor{';
	foreach ( $vars as $name => $value ) {
		$css .= $name . ':' . $value . ';';
	}
	$css .= '}';

	return $css;
}

/**
 * Load Elementor's global styles and print the bridge CSS after the Customizer CSS.
 *
 * @since 1.1.0
 *
 * @return void
 */
function open_frame_elementor_enqueue() {
	if ( ! open_frame_elementor_follows_site_settings() ) {
		return;
	}

	// Elementor only prints its global styles on pages it built. Theme
	// templates (blog, posts, search) need them too.
	$kits = \Elementor\Plugin::$instance->kits_manager;
	if ( is_object( $kits ) && method_exists( $kits, 'frontend_before_enqueue_styles' ) ) {
		$kits->frontend_before_enqueue_styles();
	}

	wp_add_inline_style( 'open-frame-style', wp_strip_all_tags( open_frame_elementor_bridge_css() ) );
}
add_action( 'wp_enqueue_scripts', 'open_frame_elementor_enqueue', 30 );

/**
 * Customizer option for following Elementor's Site Settings.
 *
 * The section only appears while Elementor is active.
 *
 * @since 1.1.0
 *
 * @param WP_Customize_Manager $wp_customize Customizer manager.
 * @return void
 */
function open_frame_elementor_customize_register( $wp_customize ) {
	$wp_customize->add_section(
		'open_frame_elementor',
		array(
			'title'           => __( 'Elementor', 'open-frame' ),
			'panel'           => 'open_frame_options',
			'active_callback' => 'open_frame_elementor_is_active',
		)
	);

	$wp_customize->add_setting(
		'open_frame_follow_elementor',
		array(
			'default'           => open_frame_defaults()['open_frame_follow_elementor'],
			'sanitize_callback' => 'open_frame_sanitize_checkbox',
			'transport'         => 'refresh',
		)
	);
	$wp_customize->add_control(
		'open_frame_follow_elementor',
		array(
			'label'       => __( 'Use Elementor global colors and fonts', 'open-frame' ),
			'description' => __( 'The blog, posts, search and other theme templates follow Elementor > Site Settings: the Primary color is used for buttons and links, Secondary for headings, Text for body text and Accent for highlights; the Primary font is used for headings and the Text font for body text. While this is on, the matching colors and fonts set here in the Customizer are only used as a fallback.', 'open-frame' ),
			'section'     => 'open_frame_elementor',
			'type'        => 'checkbox',
		)
	);
}
add_action( 'customize_register', 'open_frame_elementor_customize_register', 20 );
