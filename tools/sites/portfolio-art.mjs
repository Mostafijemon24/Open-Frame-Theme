#!/usr/bin/env node
/**
 * Draws the images of the Portfolio starter site.
 *
 *   node tools/sites/portfolio-art.mjs     (needs Playwright)
 *
 * A portfolio needs pictures of work. These are invented projects drawn as
 * flat studio shots: packaging, app screens, posters, book covers. They are
 * original (CC0), small, and stand in for the photographs a designer would
 * put in their place.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fontFace, frame, render, shape } from './art.mjs';

const SITE = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites/portfolio' );
const FONTS = fontFace( 'Fraunces', path.join( SITE, 'fonts/files/fraunces-latin.woff2' ) )
	+ fontFace( 'Fraunces', path.join( SITE, 'fonts/files/fraunces-latin-italic.woff2' ), { style: 'italic' } )
	+ fontFace( 'Instrument Sans', path.join( SITE, 'fonts/files/instrument-sans-latin.woff2' ), { weight: '400 700' } );

const C = { paper: '#F4EFE7', sand: '#E9E1D4', ink: '#1C1917', rust: '#A8390B', clay: '#D9A283', stone: '#B9AFA2', white: '#FFFDF9' };
const CSS = `${ FONTS } .serif{font-family:Fraunces,serif} .sans{font-family:"Instrument Sans",sans-serif} i{line-height:1}`;
const art = ( width, height, background, body ) => frame( width, height, background, body, CSS );
const shadow = '0 40px 70px rgba(28,25,23,.18), 0 8px 18px rgba(28,25,23,.10)';
const label = ( text, style ) => shape( { 'font-family': '"Instrument Sans",sans-serif', 'font-weight': 600, 'letter-spacing': '0.16em', 'text-transform': 'uppercase', 'white-space': 'nowrap', ...style }, text );
const serif = ( text, style ) => shape( { 'font-family': 'Fraunces,serif', 'white-space': 'nowrap', ...style }, text );

/** Wavy lines, the mark of the invented coffee roaster. */
const waves = ( x, y, width, color, count = 3, stroke = 6, gapY = 22 ) => {
	let out = '';
	for ( let line = 0; line < count; line++ ) {
		const segments = Math.round( width / 60 );
		let d = `M0 ${ stroke }`;
		for ( let index = 0; index < segments; index++ ) {
			d += ` q15 ${ -stroke * 2.4 } 30 0 t30 0`;
		}
		out += `<svg style="position:absolute;left:${ x }px;top:${ y + line * gapY }px" width="${ width }" height="${ stroke * 6 }" viewBox="0 -${ stroke * 2 } ${ width } ${ stroke * 6 }"><path d="${ d }" fill="none" stroke="${ color }" stroke-width="${ stroke }" stroke-linecap="round"/></svg>`;
	}
	return out;
};

/** A coffee bag. */
const bag = ( x, y, w, h, { body = C.white, band = C.rust, text = C.white, name = 'Tidewater', note = 'Washed · 250 g' } = {} ) =>
	shape( { left: x, top: y, width: w, height: h, background: body, 'border-radius': `${ w * 0.04 }px ${ w * 0.04 }px ${ w * 0.02 }px ${ w * 0.02 }px`, 'box-shadow': shadow, overflow: 'hidden' },
		shape( { left: 0, top: 0, width: w, height: h * 0.07, background: 'rgba(28,25,23,.08)' } )
		+ shape( { left: 0, top: h * 0.3, width: w, height: h * 0.4, background: band } )
		+ waves( w * 0.14, h * 0.36, w * 0.72, text, 3, w * 0.014, h * 0.035 )
		+ serif( name, { left: 0, width: w, top: h * 0.52, 'text-align': 'center', 'font-size': w * 0.15, 'font-weight': 500, color: text, 'letter-spacing': '-0.02em' } )
		+ label( note, { left: 0, width: w, top: h * 0.8, 'text-align': 'center', 'font-size': w * 0.042, color: C.ink } )
		+ label( 'Coffee roasters', { left: 0, width: w, top: h * 0.16, 'text-align': 'center', 'font-size': w * 0.042, color: C.ink } ) );

/** A phone showing a simple app screen. */
const phone = ( x, y, w, { accent = '#3E5C45', cards = 3, title = 'Today', dark = false } = {} ) => {
	const h = w * 2.05;
	const screen = dark ? '#20301F' : '#FBFAF6';
	const ink = dark ? '#EAF0E4' : '#1E2A1F';
	let inner = shape( { left: w * 0.36, top: w * 0.05, width: w * 0.28, height: w * 0.055, background: '#111', 'border-radius': w } )
		+ serif( title, { left: w * 0.1, top: w * 0.22, 'font-size': w * 0.15, 'font-weight': 500, color: ink } )
		+ shape( { left: w * 0.1, top: w * 0.44, width: w * 0.8, height: w * 0.5, background: accent, 'border-radius': w * 0.06 } )
		+ shape( { left: w * 0.17, top: w * 0.52, width: w * 0.3, height: w * 0.035, background: 'rgba(255,255,255,.75)', 'border-radius': w } )
		+ shape( { left: w * 0.17, top: w * 0.6, width: w * 0.46, height: w * 0.035, background: 'rgba(255,255,255,.45)', 'border-radius': w } )
		+ shape( { left: w * 0.62, top: w * 0.68, width: w * 0.2, height: w * 0.2, 'border-radius': '50%', background: 'rgba(255,255,255,.9)' } );
	for ( let index = 0; index < cards; index++ ) {
		const top = w * ( 1.02 + index * 0.27 );
		inner += shape( { left: w * 0.1, top, width: w * 0.8, height: w * 0.22, background: dark ? '#2B3F2A' : '#EFEDE4', 'border-radius': w * 0.05 } )
			+ shape( { left: w * 0.15, top: top + w * 0.055, width: w * 0.11, height: w * 0.11, 'border-radius': '50%', background: index === 1 ? '#E0A458' : accent } )
			+ shape( { left: w * 0.31, top: top + w * 0.065, width: w * ( 0.3 + index * 0.06 ), height: w * 0.032, background: ink, opacity: 0.8, 'border-radius': w } )
			+ shape( { left: w * 0.31, top: top + w * 0.125, width: w * 0.22, height: w * 0.026, background: ink, opacity: 0.3, 'border-radius': w } );
	}
	return shape( { left: x, top: y, width: w, height: h, background: '#151515', 'border-radius': w * 0.15, 'box-shadow': shadow, padding: 0 },
		shape( { left: w * 0.035, top: w * 0.035, width: w * 0.93, height: h - w * 0.07, background: screen, 'border-radius': w * 0.12, overflow: 'hidden' }, inner ) );
};

/** A poster with one large letter or word. */
const poster = ( x, y, w, h, { background, color, big, small = 'Atlas Museum', size = 0.9, rotate = 0, footer = 'Open daily · 10 to 18' } ) =>
	shape( { left: x, top: y, width: w, height: h, background, 'box-shadow': shadow, transform: `rotate(${ rotate }deg)`, overflow: 'hidden' },
		serif( big, { left: w * 0.07, top: h * 0.04, 'font-size': w * size, 'font-weight': 400, color, 'letter-spacing': '-0.04em', 'line-height': 0.9 } )
		+ label( small, { left: w * 0.08, top: h * 0.86, 'font-size': w * 0.04, color } )
		+ label( footer, { left: w * 0.08, top: h * 0.92, 'font-size': w * 0.032, color, opacity: 0.7 } ) );

/** A book, seen from the front. */
const book = ( x, y, w, h, { background, color, title, author = 'Paper Kite Books', rotate = 0, motif = 'circle' } ) =>
	shape( { left: x, top: y, width: w, height: h, background, 'border-radius': `${ w * 0.01 }px ${ w * 0.03 }px ${ w * 0.03 }px ${ w * 0.01 }px`, 'box-shadow': shadow, transform: `rotate(${ rotate }deg)`, overflow: 'hidden' },
		shape( { left: 0, top: 0, width: w * 0.04, height: h, background: 'rgba(0,0,0,.14)' } )
		+ ( motif === 'circle'
			? shape( { left: w * 0.22, top: h * 0.4, width: w * 0.56, height: w * 0.56, 'border-radius': '50%', background: color, opacity: 0.92 } )
			: motif === 'kite'
				? shape( { left: w * 0.3, top: h * 0.42, width: w * 0.4, height: w * 0.4, background: color, transform: 'rotate(45deg)' } )
				: shape( { left: w * 0.14, top: h * 0.5, width: w * 0.72, height: h * 0.05, background: color } ) + shape( { left: w * 0.14, top: h * 0.6, width: w * 0.5, height: h * 0.05, background: color } ) + shape( { left: w * 0.14, top: h * 0.7, width: w * 0.62, height: h * 0.05, background: color } ) )
		+ shape( { left: w * 0.12, top: h * 0.08, width: w * 0.8, 'font-family': 'Fraunces,serif', 'font-size': w * 0.135, 'font-weight': 500, 'line-height': 1.02, color, 'letter-spacing': '-0.02em' }, title )
		+ label( author, { left: w * 0.12, top: h * 0.9, 'font-size': w * 0.036, color } ) );

/** A cosmetics bottle. */
const bottle = ( x, y, w, h, { body, cap = C.ink, text = C.ink, name = 'Sol', kind = 'Day cream' } ) =>
	shape( { left: x + w * 0.3, top: y, width: w * 0.4, height: h * 0.16, background: cap, 'border-radius': `${ w * 0.05 }px ${ w * 0.05 }px 0 0` } )
	+ shape( { left: x, top: y + h * 0.16, width: w, height: h * 0.84, background: body, 'border-radius': `${ w * 0.16 }px ${ w * 0.16 }px ${ w * 0.07 }px ${ w * 0.07 }px`, 'box-shadow': shadow },
		serif( name, { left: 0, width: w, top: h * 0.26, 'text-align': 'center', 'font-size': w * 0.36, 'font-style': 'italic', 'font-weight': 400, color: text } )
		+ label( kind, { left: 0, width: w, top: h * 0.56, 'text-align': 'center', 'font-size': w * 0.06, color: text } ) );

const surface = ( width, height, color, from = 0.72 ) => shape( { left: 0, top: height * from, width, height: height * ( 1 - from ), background: color } );

const images = {
	// Tidewater Coffee Roasters: the featured project.
	feature: [ 1800, 1100, art( 1800, 1100, C.sand,
		surface( 1800, 1100, '#DDD2C1', 0.74 )
		+ bag( 330, 250, 330, 620, { body: C.white, band: C.ink, name: 'Tidewater', note: 'Natural · 250 g' } )
		+ bag( 735, 170, 370, 700 )
		+ bag( 1180, 250, 330, 620, { body: '#F1DCCB', band: '#2F4A45', name: 'Tidewater', note: 'Decaf · 250 g' } ) ) ],
	'work-tidewater': [ 1200, 1500, art( 1200, 1500, C.rust,
		waves( 120, 200, 960, '#F3D9C8', 4, 12, 64 )
		+ bag( 360, 560, 480, 800 )
		+ label( 'Tidewater Coffee Roasters', { left: 120, top: 110, 'font-size': 26, color: '#F3D9C8' } ) ) ],
	'work-fieldnote': [ 1200, 900, art( 1200, 900, '#CBD6C2',
		shape( { left: 760, top: -120, width: 620, height: 620, 'border-radius': '50%', background: '#B7C6AC' } )
		+ phone( 300, 150, 290, { title: 'Today' } )
		+ phone( 640, 90, 290, { title: 'Walks', dark: true, accent: '#6F9A6B' } ) ) ],
	'work-atlas': [ 1200, 900, art( 1200, 900, '#1B1B1B',
		poster( 110, 110, 300, 420, { background: '#E9B824', color: '#1B1B1B', big: 'A', rotate: -2 } )
		+ poster( 450, 150, 300, 420, { background: '#F4EFE7', color: '#1B1B1B', big: 'tl', rotate: 1 } )
		+ poster( 790, 110, 300, 420, { background: '#D5482B', color: '#F4EFE7', big: 'as', rotate: -1 } )
		+ label( 'Atlas Museum of Maps · Identity and wayfinding', { left: 110, top: 760, 'font-size': 22, color: '#F4EFE7' } )
		+ shape( { left: 110, top: 720, width: 980, height: 2, background: '#F4EFE7', opacity: 0.4 } ) ) ],
	'work-lumen': [ 1200, 1500, art( 1200, 1500, '#16304F',
		shape( { left: 230, top: 420, width: 360, height: 360, 'border-radius': '50%', border: '46px solid #F4EFE7' } )
		+ shape( { left: 610, top: 420, width: 360, height: 360, 'border-radius': '50%', border: '46px solid #F2B84B' } )
		+ shape( { left: 410, top: 577, width: 380, height: 46, background: '#F4EFE7', transform: 'rotate(-24deg)', 'border-radius': 23 } )
		+ serif( 'Lumen', { left: 0, width: 1200, top: 930, 'text-align': 'center', 'font-size': 190, 'font-weight': 500, color: '#F4EFE7', 'letter-spacing': '-0.03em' } )
		+ label( 'Cycles · Est. 2014', { left: 0, width: 1200, top: 1160, 'text-align': 'center', 'font-size': 30, color: '#F2B84B' } ) ) ],
	'work-kite': [ 1200, 1500, art( 1200, 1500, '#E6DCCB',
		surface( 1200, 1500, '#D8CBB5', 0.8 )
		+ book( 120, 360, 400, 600, { background: '#274C43', color: '#F2E6CF', title: 'The Quiet<br>Hours', rotate: -5 } )
		+ book( 680, 330, 400, 600, { background: '#D5482B', color: '#F7ECD9', title: 'Salt and<br>Weather', rotate: 4, motif: 'lines' } )
		+ book( 380, 520, 440, 660, { background: '#F2E6CF', color: '#1C1917', title: 'A Field<br>Guide to<br>Getting Lost', motif: 'kite' } ) ) ],
	'work-sol': [ 1200, 900, art( 1200, 900, '#F3CDB8',
		shape( { left: -100, top: 300, width: 800, height: 800, 'border-radius': '50%', background: '#F7DCCB' } )
		+ surface( 1200, 900, '#E9B79E', 0.76 )
		+ bottle( 260, 270, 190, 440, { body: '#FFF6EC', name: 'Sol', kind: 'Cleanser' } )
		+ bottle( 505, 190, 200, 520, { body: '#C8553D', cap: '#FFF6EC', text: '#FFF6EC', name: 'Sol', kind: 'Day cream' } )
		+ bottle( 760, 310, 180, 400, { body: '#F1E0B8', name: 'Sol', kind: 'Night oil' } ) ) ],

	// The designer and the studio.
	portrait: [ 1200, 1500, art( 1200, 1500, C.sand,
		shape( { left: 150, top: 220, width: 900, height: 900, 'border-radius': '50%', background: '#DDD0BC' } )
		+ shape( { left: 250, top: 900, width: 700, height: 900, 'border-radius': '350px 350px 0 0', background: C.ink } )
		+ shape( { left: 540, top: 800, width: 120, height: 160, background: C.clay } )
		+ shape( { left: 430, top: 470, width: 340, height: 400, 'border-radius': '170px 170px 160px 160px', background: C.clay } )
		+ shape( { left: 400, top: 410, width: 400, height: 250, 'border-radius': '200px 200px 60px 90px', background: C.rust } )
		+ shape( { left: 400, top: 560, width: 90, height: 330, 'border-radius': '40px 0 60px 60px', background: C.rust } ) ) ],
	studio: [ 1600, 1000, art( 1600, 1000, '#DDD2C1',
		shape( { left: 140, top: 150, width: 520, height: 700, background: C.white, 'box-shadow': shadow, transform: 'rotate(-4deg)' },
			serif( 'Aa', { left: 60, top: 60, 'font-size': 300, 'font-weight': 400, color: C.ink } )
			+ shape( { left: 60, top: 470, width: 400, height: 6, background: C.ink } )
			+ shape( { left: 60, top: 520, width: 300, height: 10, background: C.stone, 'border-radius': 5 } )
			+ shape( { left: 60, top: 560, width: 360, height: 10, background: C.stone, 'border-radius': 5 } )
			+ shape( { left: 60, top: 600, width: 220, height: 10, background: C.stone, 'border-radius': 5 } ) )
		+ shape( { left: 760, top: 210, width: 150, height: 420, background: C.rust, 'box-shadow': shadow, transform: 'rotate(6deg)' } )
		+ shape( { left: 930, top: 190, width: 150, height: 420, background: C.ink, 'box-shadow': shadow, transform: 'rotate(2deg)' } )
		+ shape( { left: 1100, top: 220, width: 150, height: 420, background: C.clay, 'box-shadow': shadow, transform: 'rotate(-3deg)' } )
		+ shape( { left: 1270, top: 200, width: 150, height: 420, background: '#2F4A45', 'box-shadow': shadow, transform: 'rotate(5deg)' } )
		+ shape( { left: 760, top: 760, width: 620, height: 22, background: '#E0A458', 'border-radius': '4px 11px 11px 4px', 'box-shadow': '0 12px 20px rgba(28,25,23,.2)', transform: 'rotate(-3deg)' } )
		+ shape( { left: 1368, top: 742, width: 60, height: 22, background: C.ink, 'border-radius': '0 11px 11px 0', transform: 'rotate(-3deg)' } ) ) ],

	// The case study.
	'detail-marks': [ 1200, 1200, art( 1200, 1200, C.paper,
		shape( { left: 0, top: 0, width: 600, height: 600, background: C.rust }, waves( 150, 250, 300, '#F3D9C8', 3, 9, 36 ) )
		+ shape( { left: 600, top: 0, width: 600, height: 600, background: C.white }, serif( 'T', { left: 0, width: 600, top: 120, 'text-align': 'center', 'font-size': 380, 'font-weight': 500, color: C.rust } ) )
		+ shape( { left: 0, top: 600, width: 600, height: 600, background: C.sand }, shape( { left: 170, top: 170, width: 260, height: 260, 'border-radius': '50%', border: `10px solid ${ C.ink }` }, waves( 55, 95, 150, C.ink, 2, 6, 26 ) ) )
		+ shape( { left: 600, top: 600, width: 600, height: 600, background: C.ink }, serif( 'Tidewater', { left: 0, width: 600, top: 235, 'text-align': 'center', 'font-size': 104, 'font-weight': 500, color: C.paper, 'letter-spacing': '-0.02em' } ) + label( 'Coffee roasters', { left: 0, width: 600, top: 370, 'text-align': 'center', 'font-size': 22, color: C.clay } ) ) ) ],
	'detail-palette': [ 1200, 1200, art( 1200, 1200, C.white,
		[ [ C.rust, 'Kiln', '#F3D9C8' ], [ C.ink, 'Roast', C.paper ], [ '#2F4A45', 'Kelp', C.paper ], [ C.clay, 'Clay', C.ink ], [ C.sand, 'Sand', C.ink ] ].map( ( [ color, name, text ], index ) =>
			shape( { left: 90 + index * 208, top: 90, width: 188, height: 560, background: color, 'border-radius': 12 }, label( name, { left: 22, top: 500, 'font-size': 20, color: text } ) ) ).join( '' )
		+ serif( 'Slow roasted,', { left: 90, top: 730, 'font-size': 150, 'font-weight': 400, color: C.ink, 'letter-spacing': '-0.03em' } )
		+ serif( 'by the sea.', { left: 90, top: 900, 'font-size': 150, 'font-weight': 400, 'font-style': 'italic', color: C.rust, 'letter-spacing': '-0.03em' } ) ) ],
	'detail-wide': [ 1800, 1000, art( 1800, 1000, '#2F4A45',
		shape( { left: 0, top: 700, width: 1800, height: 300, background: '#263D39' } )
		+ shape( { left: 140, top: 150, width: 1520, height: 300, background: C.paper, 'box-shadow': shadow },
			serif( 'Tidewater', { left: 70, top: 62, 'font-size': 176, 'font-weight': 500, color: C.rust, 'letter-spacing': '-0.02em' } )
			+ waves( 1010, 105, 420, C.rust, 3, 10, 44 ) )
		+ shape( { left: 250, top: 520, width: 260, height: 330, background: C.white, 'box-shadow': shadow }, shape( { left: 0, top: 110, width: 260, height: 110, background: C.rust } ) )
		+ shape( { left: 590, top: 560, width: 220, height: 290, background: '#F1DCCB', 'box-shadow': shadow }, shape( { left: 0, top: 96, width: 220, height: 100, background: C.ink } ) )
		+ shape( { left: 1000, top: 600, width: 180, height: 250, 'border-radius': '14px 14px 60px 60px', background: C.paper, 'box-shadow': shadow }, waves( 30, 100, 120, C.rust, 2, 5, 22 ) )
		+ shape( { left: 1260, top: 600, width: 180, height: 250, 'border-radius': '14px 14px 60px 60px', background: C.rust, 'box-shadow': shadow }, waves( 30, 100, 120, C.paper, 2, 5, 22 ) ) ) ],
};

// Covers of the three notes: quiet typographic cards.
const note = ( background, color, accent, big, small ) => art( 1600, 900, background,
	serif( big, { left: 110, top: 250, 'font-size': 330, 'font-weight': 400, 'font-style': 'italic', color, 'letter-spacing': '-0.04em' } )
	+ shape( { left: 110, top: 150, width: 1380, height: 3, background: color, opacity: 0.35 } )
	+ label( small, { left: 110, top: 90, 'font-size': 24, color } )
	+ shape( { left: 1250, top: 520, width: 240, height: 240, 'border-radius': '50%', background: accent } ) );
images[ 'note-1' ] = [ 1600, 900, note( C.ink, C.paper, C.rust, 'No.', 'On saying no' ) ];
images[ 'note-2' ] = [ 1600, 900, note( C.sand, C.ink, C.rust, 'Grid', 'On systems' ) ];
images[ 'note-3' ] = [ 1600, 900, note( C.rust, '#F7E4D8', C.ink, 'Brief', 'On briefs' ) ];


const total = await render( path.join( SITE, 'media/files' ), images, { quality: 82 } );
console.log( `${ Object.keys( images ).length } images, ${ Math.round( total / 1024 ) } KB in total.` );
