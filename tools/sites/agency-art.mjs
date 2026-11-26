#!/usr/bin/env node
/**
 * Draws the images of the Agency starter site.
 *
 *   node tools/sites/agency-art.mjs     (needs Playwright)
 *
 * Loud, flat graphics: one cover per invented case study, a reel made of
 * them, the studio, four portraits and three typographic covers. They are
 * original (CC0), small, and stand in for the work an agency would show.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fontFace, frame, render, shape } from './art.mjs';

const SITE = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites/agency' );
const CSS = fontFace( 'Unbounded', path.join( SITE, 'fonts/files/unbounded-latin.woff2' ), { weight: '200 900' } );

const C = { ink: '#0D0D0D', paper: '#F5F3EE', lime: '#C8F53C', violet: '#5B4BFF', red: '#FF4D2E', sand: '#E7DFCF', forest: '#12372A', orange: '#FF9A3D', pink: '#FFB8E0', grey: '#2A2A28' };
const art = ( width, height, background, body ) => frame( width, height, background, body, CSS );

const circle = ( x, y, r, style = {}, inner = '' ) => shape( { left: x - r, top: y - r, width: r * 2, height: r * 2, 'border-radius': '50%', ...style }, inner );
const rect = ( x, y, w, h, style = {}, inner = '' ) => shape( { left: x, top: y, width: w, height: h, ...style }, inner );
const word = ( text, style ) => shape( { 'font-family': 'Unbounded,sans-serif', 'font-weight': 800, 'white-space': 'nowrap', 'line-height': 0.95, 'letter-spacing': '-0.03em', ...style }, text );

/* Each cover is drawn at 1600 x 1200 and reused, scaled, in the reel. */
const covers = {
	volt: ( w = 1600, h = 1200 ) => art( w, h, C.lime,
		rect( w * 0.56, h * 0.12, w * 0.26, h * 0.76, { background: C.ink, 'border-radius': `${ w * 0.03 }px ${ w * 0.03 }px ${ w * 0.02 }px ${ w * 0.02 }px` },
			rect( 0, 0, w * 0.26, h * 0.05, { background: '#3A3A38', 'border-radius': `${ w * 0.03 }px ${ w * 0.03 }px 0 0` } )
			+ rect( w * 0.07, h * 0.2, w * 0.12, h * 0.36, { background: C.lime, 'clip-path': 'polygon(58% 0, 8% 56%, 44% 56%, 30% 100%, 92% 38%, 54% 38%)' } ) )
		+ word( 'VOLT', { left: w * 0.05, top: h * 0.08, 'font-size': h * 0.2, color: C.ink } )
		+ word( '0% SUGAR', { left: w * 0.05, bottom: h * 0.08, 'font-size': h * 0.06, color: C.ink } ) ),
	orbit: ( w = 1600, h = 1200 ) => art( w, h, C.violet,
		circle( w * 0.22, h * 0.3, h * 0.42, { background: '#7163FF' } )
		+ circle( w * 0.8, h * 0.8, h * 0.3, { border: `${ h * 0.03 }px solid ${ C.lime }` } )
		+ rect( w * 0.38, h * 0.1, w * 0.24, h * 0.8, { background: C.ink, 'border-radius': w * 0.035 },
			rect( w * 0.012, w * 0.012, w * 0.216, h * 0.8 - w * 0.024, { background: C.paper, 'border-radius': w * 0.026, overflow: 'hidden' },
				word( '€2,480', { left: w * 0.02, top: h * 0.1, 'font-size': h * 0.05, color: C.ink } )
				+ rect( w * 0.02, h * 0.2, w * 0.176, h * 0.2, { background: C.violet, 'border-radius': w * 0.016 } )
				+ [ 0, 1, 2 ].map( ( index ) => rect( w * 0.02, h * ( 0.44 + index * 0.09 ), w * 0.176, h * 0.07, { background: '#E4E0D6', 'border-radius': w * 0.012 }, circle( h * 0.035, h * 0.035, h * 0.02, { background: index === 1 ? C.lime : C.ink } ) ) ).join( '' ) ) )
		+ word( 'orbit', { left: w * 0.05, bottom: h * 0.07, 'font-size': h * 0.13, color: C.paper } ) ),
	nord: ( w = 1600, h = 1200 ) => art( w, h, C.sand,
		rect( 0, h * 0.78, w, h * 0.22, { background: '#D8CDB8' } )
		+ rect( w * 0.36, h * 0.24, w * 0.3, h * 0.3, { background: C.forest, 'border-radius': `${ w * 0.15 }px ${ w * 0.15 }px ${ w * 0.02 }px ${ w * 0.02 }px` } )
		+ rect( w * 0.33, h * 0.52, w * 0.36, h * 0.09, { background: C.orange, 'border-radius': w * 0.02 } )
		+ rect( w * 0.36, h * 0.61, w * 0.015, h * 0.2, { background: C.ink } ) + rect( w * 0.645, h * 0.61, w * 0.015, h * 0.2, { background: C.ink } )
		+ circle( w * 0.82, h * 0.3, h * 0.11, { background: C.orange } )
		+ rect( w * 0.819, h * 0.3, w * 0.004, h * 0.5, { background: C.ink } )
		+ word( 'NORD', { left: w * 0.05, top: h * 0.07, 'font-size': h * 0.12, color: C.forest } ) ),
	pulse: ( w = 1600, h = 1200 ) => art( w, h, C.ink,
		[ [ 0.46, C.red ], [ 0.37, C.ink ], [ 0.3, C.pink ], [ 0.21, C.ink ], [ 0.14, C.lime ], [ 0.06, C.ink ] ].map( ( [ r, color ] ) => circle( w * 0.62, h * 0.5, h * r, { background: color } ) ).join( '' )
		+ word( 'PULSE', { left: w * 0.05, top: h * 0.07, 'font-size': h * 0.17, color: C.paper } )
		+ word( '26', { left: w * 0.05, bottom: h * 0.06, 'font-size': h * 0.3, color: C.lime } ) ),
	terra: ( w = 1600, h = 1200 ) => art( w, h, C.forest,
		circle( w * 0.72, h * 0.3, h * 0.16, { background: C.orange } )
		+ rect( w * 0.02, h * 0.3, w * 0.6, h * 0.7, { background: '#1E5A44', 'clip-path': 'polygon(50% 0, 100% 100%, 0 100%)' } )
		+ rect( w * 0.38, h * 0.45, w * 0.6, h * 0.55, { background: C.lime, 'clip-path': 'polygon(50% 0, 100% 100%, 0 100%)' } )
		+ rect( w * 0.2, h * 0.3, w * 0.24, h * 0.2, { background: C.paper, 'clip-path': 'polygon(50% 0, 78% 60%, 62% 48%, 50% 72%, 38% 48%, 22% 60%)' } )
		+ word( 'terra', { left: w * 0.05, top: h * 0.06, 'font-size': h * 0.13, color: C.paper } ) ),
	kino: ( w = 1600, h = 1200 ) => art( w, h, C.red,
		rect( w * 0.58, 0, w * 0.22, h, { background: C.ink }, Array.from( { length: 7 }, ( unused, index ) => rect( w * 0.03, h * ( 0.03 + index * 0.14 ), w * 0.16, h * 0.11, { background: index % 3 === 1 ? C.lime : C.paper, 'border-radius': w * 0.008 } ) ).join( '' ) )
		+ word( 'K', { left: w * 0.06, top: h * 0.06, 'font-size': h * 0.72, color: C.ink } )
		+ word( 'KINO FEST', { left: w * 0.06, bottom: h * 0.05, 'font-size': h * 0.055, color: C.ink } ) ),
};

const tile = ( name, x, y, w, h ) => `<iframe srcdoc="${ covers[ name ]( w, h ).replace( /&/g, '&amp;' ).replace( /"/g, '&quot;' ) }" style="position:absolute;left:${ x }px;top:${ y }px;width:${ w }px;height:${ h }px;border:0"></iframe>`;

/** A portrait in two flat colors. */
const portrait = ( background, body, hair, style ) => art( 900, 1100, background,
	rect( 150, 700, 600, 500, { background: body, 'border-radius': '300px 300px 0 0' } )
	+ ( style === 'long' ? rect( 285, 250, 330, 420, { background: hair, 'border-radius': '165px 165px 50px 50px' } ) : '' )
	+ rect( 400, 610, 100, 130, { background: '#E7B796' } )
	+ rect( 320, 290, 260, 340, { background: '#E7B796', 'border-radius': '130px 130px 124px 124px' } )
	+ ( style === 'cap' ? rect( 300, 250, 300, 130, { background: hair, 'border-radius': '150px 150px 0 0' } ) + rect( 300, 360, 380, 40, { background: hair, 'border-radius': 20 } )
		: style === 'bun' ? circle( 450, 220, 74, { background: hair } ) + rect( 305, 260, 290, 140, { background: hair, 'border-radius': '145px 145px 24px 24px' } )
			: rect( 305, 262, 290, style === 'long' ? 120 : 150, { background: hair, 'border-radius': '145px 145px 20px 70px' } ) )
	+ ( style === 'short' ? rect( 345, 430, 90, 44, { background: C.ink, 'border-radius': 12 } ) + rect( 465, 430, 90, 44, { background: C.ink, 'border-radius': 12 } ) + rect( 435, 446, 30, 10, { background: C.ink } ) : '' ) );

const typo = ( background, color, accent, text ) => art( 1600, 900, background,
	word( text, { left: 90, top: 250, 'font-size': 330, color } )
	+ rect( 90, 700, 1420, 14, { background: accent } )
	+ circle( 1420, 190, 80, { background: accent } ) );

const images = {
	'case-volt': [ 1600, 1200, covers.volt() ],
	'case-orbit': [ 1600, 1200, covers.orbit() ],
	'case-nord': [ 1600, 1200, covers.nord() ],
	'case-pulse': [ 1600, 1200, covers.pulse() ],
	'case-terra': [ 1600, 1200, covers.terra() ],
	'case-kino': [ 1600, 1200, covers.kino() ],
	reel: [ 1800, 1000, art( 1800, 1000, C.ink,
		tile( 'pulse', 20, 20, 700, 525 ) + tile( 'volt', 740, 20, 510, 300 ) + tile( 'orbit', 1270, 20, 510, 300 )
		+ tile( 'kino', 740, 340, 400, 640 ) + tile( 'terra', 1160, 340, 620, 640 ) + tile( 'nord', 20, 565, 700, 415 ) ), 70 ],
	studio: [ 1600, 1000, art( 1600, 1000, C.paper,
		rect( 0, 760, 1600, 240, { background: '#E4E0D6' } )
		+ rect( 120, 120, 620, 420, { background: C.lime, 'border-radius': 12 }, rect( 300, 0, 16, 420, { background: C.paper } ) + rect( 0, 200, 620, 16, { background: C.paper } ) )
		+ rect( 200, 600, 1200, 36, { background: C.ink, 'border-radius': 8 } )
		+ rect( 260, 636, 24, 220, { background: C.ink } ) + rect( 1316, 636, 24, 220, { background: C.ink } )
		+ [ 0, 1, 2 ].map( ( index ) => rect( 330 + index * 330, 380, 260, 180, { background: C.ink, 'border-radius': 14 }, rect( 14, 14, 232, 152, { background: [ C.violet, C.red, C.forest ][ index ], 'border-radius': 6 } ) ) + rect( 450 + index * 330, 560, 20, 40, { background: C.ink } ) ).join( '' )
		+ rect( 1010, 150, 300, 380, { background: C.ink }, word( 'Aa', { left: 40, top: 70, 'font-size': 150, color: C.lime } ) )
		+ rect( 1420, 520, 26, 240, { background: C.forest } ) + circle( 1433, 470, 100, { background: C.forest } ) + rect( 1380, 760, 110, 100, { background: C.red, 'border-radius': '8px 8px 30px 30px' } ) ) ],
	'team-1': [ 900, 1100, portrait( C.lime, C.ink, C.ink, 'bun' ) ],
	'team-2': [ 900, 1100, portrait( C.violet, C.paper, C.ink, 'short' ) ],
	'team-3': [ 900, 1100, portrait( C.sand, C.red, '#7A3B22', 'long' ) ],
	'team-4': [ 900, 1100, portrait( C.ink, C.lime, C.red, 'cap' ) ],
	'journal-1': [ 1600, 900, typo( C.ink, C.paper, C.lime, 'BRIEF' ) ],
	'journal-2': [ 1600, 900, typo( C.lime, C.ink, C.ink, 'PITCH' ) ],
	'journal-3': [ 1600, 900, typo( C.violet, C.paper, C.lime, 'SHIP' ) ],
};

const total = await render( path.join( SITE, 'media/files' ), images, { quality: 80 } );
console.log( `${ Object.keys( images ).length } images, ${ Math.round( total / 1024 ) } KB in total.` );
