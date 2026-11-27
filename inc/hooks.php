<?php
/**
 * Replaceable template locations.
 *
 * Plugins (a page builder's theme builder, for example) can take over the
 * header, the footer or the main content of a view without the theme knowing
 * about them. The theme asks first, and prints its own template when nobody
 * answers.
 *
 * Locations: `header`, `footer`, `single`, `archive` and `404`.
 *
 * @package Open_Frame
 * @since   1.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Whether something other than the theme will render a location.
 *
 * Answers without printing anything, so it can be used before the output
 * starts (for body classes, for example).
 *
 * @since 1.1.0
 *
 * @param string $location Location name.
 * @return bool
 */
function open_frame_has_location( $location ) {
	/**
	 * Filters whether a location is rendered by something other than the theme.
	 *
	 * @since 1.1.0
	 *
	 * @param bool   $has      Whether the location is taken. Default false.
	 * @param string $location Location name.
	 */
	return (bool) apply_filters( 'open_frame_has_location', false, $location );
}

/**
 * Let a plugin render a location.
 *
 * A callback on the `open_frame_do_location` filter prints its markup and
 * returns true. Content locations (`single`, `archive`, `404`) are wrapped in
 * the `main` landmark the skip link points to.
 *
 * @since 1.1.0
 *
 * @param string $location Location name.
 * @return bool True when the location was rendered and the theme template must be skipped.
 */
function open_frame_do_location( $location ) {
	$is_content = in_array( $location, array( 'single', 'archive', '404' ), true );

	if ( $is_content ) {
		ob_start();
	}

	/**
	 * Filters whether a location has been rendered by something other than the theme.
	 *
	 * @since 1.1.0
	 *
	 * @param bool   $done     Whether the location was rendered. Default false.
	 * @param string $location Location name.
	 */
	$done = (bool) apply_filters( 'open_frame_do_location', false, $location );

	if ( $is_content ) {
		$markup = ob_get_clean();

		if ( $done ) {
			echo '<main id="main" class="site-main of-location of-location--' . esc_attr( $location ) . '">';
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Markup printed by the plugin that rendered the location.
			echo $markup;
			echo '</main>';
		}
	}

	return $done;
}
