<?php
/**
 * Asset loading.
 *
 * The bundled web fonts are declared in theme.json (settings.typography
 * .fontFamilies[].fontFace), so WordPress prints their @font-face rules on the
 * frontend and in the block editor. No remote font requests are made.
 *
 * @package Open_Frame
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueue frontend styles and scripts.
 *
 * @return void
 */
function open_frame_enqueue_assets() {
	$version = OPEN_FRAME_VERSION;

	// Always load the parent stylesheet so child themes inherit the design system.
	wp_enqueue_style( 'open-frame-style', OPEN_FRAME_URI . '/style.css', array(), $version );

	if ( is_child_theme() ) {
		wp_enqueue_style(
			'open-frame-child-style',
			get_stylesheet_uri(),
			array( 'open-frame-style' ),
			wp_get_theme()->get( 'Version' )
		);
	}

	wp_enqueue_script(
		'open-frame-navigation',
		OPEN_FRAME_URI . '/assets/js/navigation.js',
		array(),
		$version,
		true
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'open_frame_enqueue_assets' );

/**
 * Flag JavaScript support as early as possible.
 *
 * Swaps the `no-js` class on the root element for `js` so the stylesheet can
 * offer a usable, fully expanded menu when scripts are unavailable.
 *
 * @return void
 */
function open_frame_javascript_detection() {
	wp_print_inline_script_tag( "document.documentElement.className = document.documentElement.className.replace( /\\bno-js\\b/, 'js' );" );
}
add_action( 'wp_head', 'open_frame_javascript_detection', 0 );
