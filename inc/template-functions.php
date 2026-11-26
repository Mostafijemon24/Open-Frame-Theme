<?php
/**
 * Template functions: body classes, layout resolution, misc hooks.
 *
 * @package Open_Frame
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Resolve the configured layout for the current view.
 *
 * @return string One of: right-sidebar, left-sidebar, no-sidebar, full-width.
 */
function open_frame_get_layout() {
	$layout = 'right-sidebar';

	if ( is_404() ) {
		$layout = 'no-sidebar';
	} elseif ( is_page() ) {
		$layout = open_frame_get_mod( 'open_frame_page_layout' );
		if ( is_page_template( array( 'page-templates/full-width.php', 'page-templates/landing.php' ) ) ) {
			$layout = 'full-width';
		}
	} elseif ( is_singular( 'post' ) ) {
		$layout = open_frame_get_mod( 'open_frame_single_layout' );
	} elseif ( is_home() || is_archive() || is_search() ) {
		$layout = open_frame_get_mod( 'open_frame_blog_layout' );
	}

	$layout  = apply_filters( 'open_frame_layout', $layout );
	$allowed = array( 'right-sidebar', 'left-sidebar', 'no-sidebar', 'full-width' );

	return in_array( $layout, $allowed, true ) ? $layout : 'right-sidebar';
}

/**
 * The widget area used as the sidebar for the current view.
 *
 * @return string Sidebar ID.
 */
function open_frame_get_sidebar_id() {
	return ( is_home() || is_archive() || is_search() ) ? 'sidebar-blog' : 'sidebar-main';
}

/**
 * Whether the active layout shows a sidebar and one has widgets.
 *
 * @return bool
 */
function open_frame_has_sidebar() {
	if ( in_array( open_frame_get_layout(), array( 'no-sidebar', 'full-width' ), true ) ) {
		return false;
	}

	return is_active_sidebar( open_frame_get_sidebar_id() );
}

/**
 * Resolve the layout that actually renders.
 *
 * A sidebar layout with an empty widget area falls back to the centered
 * content-width column instead of leaving an empty column behind.
 *
 * @return string One of: right-sidebar, left-sidebar, no-sidebar, full-width.
 */
function open_frame_get_effective_layout() {
	$layout = open_frame_get_layout();

	if ( in_array( $layout, array( 'right-sidebar', 'left-sidebar' ), true ) && ! open_frame_has_sidebar() ) {
		return 'no-sidebar';
	}

	return $layout;
}

/**
 * CSS classes for the main layout wrapper.
 *
 * @return string
 */
function open_frame_layout_classes() {
	$layout  = open_frame_get_effective_layout();
	$classes = array( 'of-layout', 'of-layout--' . $layout );

	if ( open_frame_has_sidebar() ) {
		$classes[] = 'of-layout--has-sidebar';
	}

	return implode( ' ', array_map( 'sanitize_html_class', $classes ) );
}

/**
 * Whether the current page is laid out by a page builder.
 *
 * Such pages drop the page card and span the full width of the window. Only
 * pages on the default template without a sidebar qualify; a page builder
 * integration confirms through the `open_frame_is_builder_page` filter.
 *
 * @since 1.1.0
 *
 * @return bool
 */
function open_frame_is_builder_page() {
	if ( ! is_page() || is_page_template() || open_frame_has_sidebar() ) {
		return false;
	}

	/**
	 * Filters whether the current page is laid out by a page builder.
	 *
	 * @since 1.1.0
	 *
	 * @param bool $is_builder Whether a page builder lays out the page. Default false.
	 * @param int  $post_id    Page ID.
	 */
	return (bool) apply_filters( 'open_frame_is_builder_page', false, get_queried_object_id() );
}

/**
 * Add helpful classes to the body element.
 *
 * @param array $classes Existing classes.
 * @return array
 */
function open_frame_body_classes( $classes ) {
	if ( ! is_singular() ) {
		$classes[] = 'hfeed';
	}

	$classes[] = 'layout-' . open_frame_get_effective_layout();

	if ( 'boxed' === open_frame_get_mod( 'open_frame_site_layout' ) ) {
		$classes[] = 'boxed-layout';
	}

	if ( ! open_frame_has_sidebar() ) {
		$classes[] = 'no-sidebar';
	}

	if ( open_frame_get_mod( 'open_frame_sticky_header' ) && ! open_frame_has_location( 'header' ) ) {
		$classes[] = 'has-sticky-header';
	}

	if ( open_frame_has_transparent_header() ) {
		$classes[] = 'has-transparent-header';
	}

	if ( open_frame_is_builder_page() ) {
		$classes[] = 'of-builder-page';
	}

	return $classes;
}
add_filter( 'body_class', 'open_frame_body_classes' );

/**
 * Add a pingback url when the site is set to accept them.
 *
 * @return void
 */
function open_frame_pingback_header() {
	if ( is_singular() && pings_open() ) {
		printf( '<link rel="pingback" href="%s">' . "\n", esc_url( get_bloginfo( 'pingback_url' ) ) );
	}
}
add_action( 'wp_head', 'open_frame_pingback_header' );

/**
 * Use a custom excerpt "more" string.
 *
 * @param string $more Default more string.
 * @return string
 */
function open_frame_excerpt_more( $more ) {
	return is_admin() ? $more : '&hellip;';
}
add_filter( 'excerpt_more', 'open_frame_excerpt_more' );

/**
 * Apply the Customizer-controlled excerpt length.
 *
 * @param int $length Default length.
 * @return int
 */
function open_frame_excerpt_length( $length ) {
	if ( is_admin() ) {
		return $length;
	}
	return open_frame_clamp( open_frame_get_mod( 'open_frame_excerpt_length' ), 5, 80 );
}
add_filter( 'excerpt_length', 'open_frame_excerpt_length' );

/**
 * CSS classes for the posts listing container based on Customizer settings.
 *
 * @return string
 */
function open_frame_posts_grid_classes() {
	$style   = open_frame_get_mod( 'open_frame_blog_style' );
	$style   = in_array( $style, array( 'list', 'grid' ), true ) ? $style : 'list';
	$classes = array( 'posts-grid', 'posts-grid--' . $style );

	if ( 'grid' === $style ) {
		$cols      = open_frame_clamp( open_frame_get_mod( 'open_frame_blog_columns' ), 2, 4 );
		$classes[] = 'posts-grid--cols-' . $cols;
	}

	return implode( ' ', array_map( 'sanitize_html_class', $classes ) );
}
