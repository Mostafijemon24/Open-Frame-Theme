<?php
/**
 * Customizer sanitization callbacks.
 *
 * @package Open_Frame
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sanitize a checkbox value.
 *
 * @param mixed $checked Incoming value.
 * @return bool
 */
function open_frame_sanitize_checkbox( $checked ) {
	return ( isset( $checked ) && true === (bool) $checked );
}

/**
 * Sanitize a value against a whitelist derived from the control choices.
 *
 * @param string               $input   Incoming value.
 * @param WP_Customize_Setting $setting Setting instance.
 * @return string
 */
function open_frame_sanitize_select( $input, $setting ) {
	$input   = sanitize_key( $input );
	$control = $setting->manager->get_control( $setting->id );
	$choices = ( $control && isset( $control->choices ) ) ? array_keys( $control->choices ) : array();

	return in_array( $input, $choices, true ) ? $input : $setting->default;
}

/**
 * Sanitize a positive integer, clamped to the min/max of its number control.
 *
 * @param mixed                $input   Incoming value.
 * @param WP_Customize_Setting $setting Setting instance.
 * @return int
 */
function open_frame_sanitize_int( $input, $setting ) {
	$value = absint( $input );
	if ( ! $value ) {
		return absint( $setting->default );
	}

	$control = $setting->manager->get_control( $setting->id );
	if ( $control && isset( $control->input_attrs['min'], $control->input_attrs['max'] ) ) {
		$value = open_frame_clamp( $value, (int) $control->input_attrs['min'], (int) $control->input_attrs['max'] );
	}

	return $value;
}

/**
 * Clamp a number between min and max.
 *
 * @param int $value Value.
 * @param int $min   Minimum.
 * @param int $max   Maximum.
 * @return int
 */
function open_frame_clamp( $value, $min, $max ) {
	$value = (int) $value;
	return max( $min, min( $max, $value ) );
}

/**
 * Sanitize a font family stack choice by mapping to a known set.
 *
 * @param string $input Incoming value.
 * @return string
 */
function open_frame_sanitize_font_choice( $input ) {
	$input = sanitize_key( $input );
	return array_key_exists( $input, open_frame_font_choices() ) ? $input : 'hanken';
}

/**
 * Convert a hex color to an array of red, green and blue channel values.
 *
 * @param string $hex Hex color, with or without the leading hash.
 * @return int[] Red, green and blue values (0-255).
 */
function open_frame_hex_to_rgb( $hex ) {
	$hex = ltrim( (string) $hex, '#' );
	if ( 3 === strlen( $hex ) ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}
	if ( 6 !== strlen( $hex ) || ! ctype_xdigit( $hex ) ) {
		return array( 0, 0, 0 );
	}

	return array(
		hexdec( substr( $hex, 0, 2 ) ),
		hexdec( substr( $hex, 2, 2 ) ),
		hexdec( substr( $hex, 4, 2 ) ),
	);
}

/**
 * Mix a hex color with white to produce a soft tint.
 *
 * @param string $hex    Hex color.
 * @param float  $amount Share of white in the mix, from 0 to 1.
 * @return string Hex color.
 */
function open_frame_tint( $hex, $amount ) {
	$amount = max( 0, min( 1, (float) $amount ) );
	$rgb    = open_frame_hex_to_rgb( $hex );
	$out    = '#';
	foreach ( $rgb as $channel ) {
		$out .= str_pad( dechex( (int) round( $channel + ( 255 - $channel ) * $amount ) ), 2, '0', STR_PAD_LEFT );
	}

	return $out;
}
