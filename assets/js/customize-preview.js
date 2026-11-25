/**
 * Open Frame Customizer live preview.
 *
 * Applies postMessage settings instantly by updating CSS custom properties,
 * so color, typography and layout changes are visible without a full refresh.
 * Mirrors inc/customizer/dynamic-css.php.
 */
( function ( $ ) {
	'use strict';

	if ( typeof wp === 'undefined' || ! wp.customize ) {
		return;
	}

	var root = document.documentElement;

	function cssVar( name, value ) {
		root.style.setProperty( name, value );
	}

	// Site title & description.
	wp.customize( 'blogname', function ( value ) {
		value.bind( function ( to ) {
			$( '.site-title a' ).text( to );
		} );
	} );
	wp.customize( 'blogdescription', function ( value ) {
		value.bind( function ( to ) {
			$( '.site-description' ).text( to );
		} );
	} );

	function clearVar( name ) {
		// 'initial' makes var() fall back to the stylesheet default.
		root.style.setProperty( name, 'initial' );
	}

	// Mix a hex color with white (amount = share of white, 0-1).
	function hexToRgb( hex ) {
		var value = String( hex ).replace( '#', '' );
		if ( value.length === 3 ) {
			value = value[ 0 ] + value[ 0 ] + value[ 1 ] + value[ 1 ] + value[ 2 ] + value[ 2 ];
		}
		return [
			parseInt( value.substr( 0, 2 ), 16 ) || 0,
			parseInt( value.substr( 2, 2 ), 16 ) || 0,
			parseInt( value.substr( 4, 2 ), 16 ) || 0
		];
	}

	function tint( hex, amount ) {
		return '#' + hexToRgb( hex ).map( function ( channel ) {
			var mixed = Math.round( channel + ( 255 - channel ) * amount ).toString( 16 );
			return mixed.length === 1 ? '0' + mixed : mixed;
		} ).join( '' );
	}

	var colorMap = {
		open_frame_color_primary: '--of-color-primary',
		open_frame_color_primary_hover: '--of-color-primary-hover',
		open_frame_color_secondary: '--of-color-secondary',
		open_frame_color_accent: '--of-color-accent',
		open_frame_color_heading: '--of-color-heading',
		open_frame_color_text: '--of-color-text',
		open_frame_color_link: '--of-color-link',
		open_frame_color_link_hover: '--of-color-link-hover',
		open_frame_color_border: '--of-color-border',
		open_frame_color_bg: '--of-color-bg',
		open_frame_color_surface: '--of-color-surface',
		open_frame_header_bg: '--of-header-bg',
		open_frame_header_text: '--of-header-text',
		open_frame_footer_bg: '--of-footer-bg',
		open_frame_footer_text: '--of-footer-text',
		open_frame_footer_heading: '--of-footer-heading'
	};

	// Block editor palette slugs that mirror a Customizer color.
	var presetMap = {
		open_frame_color_primary: 'primary',
		open_frame_color_primary_hover: 'primary-dark',
		open_frame_color_secondary: 'secondary',
		open_frame_color_accent: 'accent',
		open_frame_color_heading: 'heading',
		open_frame_color_text: 'text',
		open_frame_color_border: 'border',
		open_frame_color_surface: 'surface',
		open_frame_color_bg: 'background'
	};

	Object.keys( colorMap ).forEach( function ( setting ) {
		wp.customize( setting, function ( value ) {
			value.bind( function ( to ) {
				var rgb;

				if ( ! to ) {
					clearVar( colorMap[ setting ] );
					return;
				}

				cssVar( colorMap[ setting ], to );

				// Block palette colors follow the same settings.
				if ( presetMap[ setting ] ) {
					cssVar( '--wp--preset--color--' + presetMap[ setting ], to );
				}

				// Keep the derived tints in step with the primary color.
				if ( setting === 'open_frame_color_primary' ) {
					rgb = hexToRgb( to );
					cssVar( '--of-primary-100', tint( to, 0.88 ) );
					cssVar( '--of-focus-ring', '0 0 0 3px rgba(' + rgb.join( ',' ) + ',0.35)' );
				}
			} );
		} );
	} );

	wp.customize( 'open_frame_base_font_size', function ( value ) {
		value.bind( function ( to ) {
			cssVar( '--of-fs-body', ( parseInt( to, 10 ) / 16 ) + 'rem' );
		} );
	} );

	wp.customize( 'open_frame_body_line_height', function ( value ) {
		value.bind( function ( to ) {
			cssVar( '--of-lh-body', String( parseInt( to, 10 ) / 100 ) );
		} );
	} );

	wp.customize( 'open_frame_heading_weight', function ( value ) {
		value.bind( function ( to ) {
			cssVar( '--of-fw-heading', String( parseInt( to, 10 ) ) );
		} );
	} );

	wp.customize( 'open_frame_container_width', function ( value ) {
		value.bind( function ( to ) {
			cssVar( '--of-container-wide', parseInt( to, 10 ) + 'px' );
			cssVar( '--wp--style--global--wide-size', parseInt( to, 10 ) + 'px' );
		} );
	} );

	wp.customize( 'open_frame_content_width', function ( value ) {
		value.bind( function ( to ) {
			cssVar( '--of-content-width', parseInt( to, 10 ) + 'px' );
			cssVar( '--wp--style--global--content-size', parseInt( to, 10 ) + 'px' );
		} );
	} );

	wp.customize( 'open_frame_section_spacing', function ( value ) {
		value.bind( function ( to ) {
			cssVar( '--of-section-spacing', parseInt( to, 10 ) + 'px' );
		} );
	} );

	// Font family choices (stacks are passed from PHP so both stay in sync).
	var fontStacks = ( window.openFramePreview && window.openFramePreview.fonts ) || {};

	wp.customize( 'open_frame_body_font', function ( value ) {
		value.bind( function ( to ) {
			if ( fontStacks[ to ] ) {
				cssVar( '--of-font-body', fontStacks[ to ] );
			}
		} );
	} );

	wp.customize( 'open_frame_heading_font', function ( value ) {
		value.bind( function ( to ) {
			if ( fontStacks[ to ] ) {
				cssVar( '--of-font-heading', fontStacks[ to ] );
			}
		} );
	} );
}( jQuery ) );
