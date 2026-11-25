<?php
/**
 * Header builder: Customizer controls + render helpers.
 *
 * @package Open_Frame
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register header Customizer section.
 *
 * @param WP_Customize_Manager $wp_customize Manager.
 * @param array                $defaults     Default values.
 * @return void
 */
function open_frame_customize_header( $wp_customize, $defaults ) {
	$wp_customize->add_section(
		'open_frame_header',
		array(
			'title' => __( 'Header Builder', 'open-frame' ),
			'panel' => 'open_frame_options',
		)
	);

	$wp_customize->add_setting(
		'open_frame_header_layout',
		array(
			'default'           => $defaults['open_frame_header_layout'],
			'sanitize_callback' => 'open_frame_sanitize_select',
			'transport'         => 'refresh',
		)
	);
	$wp_customize->add_control(
		'open_frame_header_layout',
		array(
			'label'   => __( 'Header layout', 'open-frame' ),
			'section' => 'open_frame_header',
			'type'    => 'select',
			'choices' => open_frame_header_layouts(),
		)
	);

	$wp_customize->add_setting(
		'open_frame_header_bg',
		array(
			'default'           => $defaults['open_frame_header_bg'],
			'sanitize_callback' => 'sanitize_hex_color',
			'transport'         => 'postMessage',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'open_frame_header_bg',
			array(
				'label'   => __( 'Header background', 'open-frame' ),
				'section' => 'open_frame_header',
			)
		)
	);

	$wp_customize->add_setting(
		'open_frame_header_text',
		array(
			'default'           => $defaults['open_frame_header_text'],
			'sanitize_callback' => 'sanitize_hex_color',
			'transport'         => 'postMessage',
		)
	);
	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'open_frame_header_text',
			array(
				'label'       => __( 'Header text color', 'open-frame' ),
				'description' => __( 'Site title, tagline and menu links. Leave empty to use the theme defaults.', 'open-frame' ),
				'section'     => 'open_frame_header',
			)
		)
	);

	$toggles = array(
		'open_frame_show_site_title'    => array(
			__( 'Show site title and tagline', 'open-frame' ),
			__( 'When unchecked the text stays available to screen readers and search engines. Useful when your logo already contains the site name.', 'open-frame' ),
		),
		'open_frame_sticky_header'      => array(
			__( 'Sticky header', 'open-frame' ),
			__( 'Keeps the header visible at the top of the screen while scrolling.', 'open-frame' ),
		),
		'open_frame_transparent_header' => array(
			__( 'Transparent header on front page', 'open-frame' ),
			__( 'Removes the header background on the front page. With the Landing Page template the header overlays the first block.', 'open-frame' ),
		),
		'open_frame_header_search'      => array(
			__( 'Show search in header', 'open-frame' ),
			'',
		),
	);
	foreach ( $toggles as $id => $toggle ) {
		$wp_customize->add_setting(
			$id,
			array(
				'default'           => $defaults[ $id ],
				'sanitize_callback' => 'open_frame_sanitize_checkbox',
				'transport'         => 'refresh',
			)
		);
		$wp_customize->add_control(
			$id,
			array(
				'label'       => $toggle[0],
				'description' => $toggle[1],
				'section'     => 'open_frame_header',
				'type'        => 'checkbox',
			)
		);
	}
}

/**
 * CSS classes for the site header element.
 *
 * @return string[]
 */
function open_frame_header_classes() {
	$layout = open_frame_get_mod( 'open_frame_header_layout' );
	if ( ! array_key_exists( $layout, open_frame_header_layouts() ) ) {
		$layout = 'logo-left-menu-right';
	}

	$classes = array( 'site-header', 'header-layout-' . $layout );

	if ( open_frame_get_mod( 'open_frame_sticky_header' ) ) {
		$classes[] = 'is-sticky';
	}
	if ( open_frame_has_transparent_header() ) {
		$classes[] = 'is-transparent';
	}

	return $classes;
}

/**
 * Whether the transparent header applies to the current view.
 *
 * @return bool
 */
function open_frame_has_transparent_header() {
	return open_frame_get_mod( 'open_frame_transparent_header' ) && is_front_page();
}

/**
 * Available header layouts.
 *
 * @return array<string,string>
 */
function open_frame_header_layouts() {
	return array(
		'logo-left-menu-right'   => __( 'Logo left, menu right', 'open-frame' ),
		'logo-left-menu-center'  => __( 'Logo left, menu centered', 'open-frame' ),
		'logo-center-menu-below' => __( 'Centered logo, menu below', 'open-frame' ),
		'logo-left-menu-left'    => __( 'Logo & menu left', 'open-frame' ),
		'logo-right-menu-left'   => __( 'Logo right, menu left', 'open-frame' ),
	);
}

/**
 * Output the site branding (logo or site title + description).
 *
 * @return void
 */
function open_frame_site_branding() {
	$text_class = 'site-branding-text';
	if ( ! open_frame_get_mod( 'open_frame_show_site_title' ) ) {
		// Hidden visually only: the site name stays available to assistive technology.
		$text_class .= ' screen-reader-text';
	}

	echo '<div class="site-branding">';
	if ( has_custom_logo() ) {
		the_custom_logo();
	}

	echo '<div class="' . esc_attr( $text_class ) . '">';
	if ( is_front_page() && is_home() ) {
		printf( '<h1 class="site-title"><a href="%1$s" rel="home">%2$s</a></h1>', esc_url( home_url( '/' ) ), esc_html( get_bloginfo( 'name' ) ) );
	} else {
		printf( '<p class="site-title"><a href="%1$s" rel="home">%2$s</a></p>', esc_url( home_url( '/' ) ), esc_html( get_bloginfo( 'name' ) ) );
	}

	$description = get_bloginfo( 'description', 'display' );
	if ( $description || is_customize_preview() ) {
		printf( '<p class="site-description">%s</p>', esc_html( $description ) );
	}
	echo '</div>';
	echo '</div>';
}

/**
 * Output the primary navigation (with accessible fallback).
 *
 * @return void
 */
function open_frame_primary_nav() {
	if ( ! has_nav_menu( 'primary' ) ) {
		if ( current_user_can( 'edit_theme_options' ) ) {
			echo '<nav class="main-navigation" aria-label="' . esc_attr__( 'Primary', 'open-frame' ) . '">';
			printf(
				'<a class="of-menu-setup" href="%s">%s</a>',
				esc_url( admin_url( 'nav-menus.php' ) ),
				esc_html__( 'Add a menu', 'open-frame' )
			);
			echo '</nav>';
		}
		return;
	}

	echo '<nav id="site-navigation" class="main-navigation" aria-label="' . esc_attr__( 'Primary', 'open-frame' ) . '">';
	echo '<button type="button" class="menu-toggle of-plain" aria-controls="primary-menu" aria-expanded="false">';
	echo '<span class="menu-toggle-bar" aria-hidden="true"></span>';
	echo '<span class="screen-reader-text">' . esc_html__( 'Menu', 'open-frame' ) . '</span>';
	echo '</button>';

	wp_nav_menu(
		array(
			'theme_location' => 'primary',
			'menu_id'        => 'primary-menu',
			'container'      => false,
			'walker'         => new Open_Frame_Walker_Nav_Menu(),
		)
	);
	echo '</nav>';
}

/**
 * Output the header search when enabled.
 *
 * @return void
 */
function open_frame_header_search() {
	if ( ! open_frame_get_mod( 'open_frame_header_search' ) ) {
		return;
	}
	echo '<div class="header-search">';
	get_search_form();
	echo '</div>';
}
