#!/usr/bin/env node
/**
 * Draws the images of the Medical starter site.
 *
 *   node tools/sites/medical-art.mjs     (needs Playwright)
 *
 * Calm, flat illustrations in teal, mist and sand: doctors, the building, the
 * reception, a consulting room and a few motifs. They are original (CC0),
 * small, and stand in for the photographs a clinic would put in their place.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { frame, render, shape } from './art.mjs';

const SITE = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites/medical' );
const C = { teal: '#0B6B69', deep: '#0A3F42', ink: '#0F2B2D', mist: '#E8F4F1', aqua: '#BFE5DE', sand: '#F6EFE6', clay: '#E9C9A8', white: '#FFFFFF', coral: '#E8826B', leaf: '#3F9E86', line: '#CFE3DE' };
const art = ( width, height, background, body ) => frame( width, height, background, body );
const soft = '0 30px 60px rgba(10,63,66,.14), 0 6px 16px rgba(10,63,66,.08)';

const circle = ( x, y, r, style = {}, inner = '' ) => shape( { left: x - r, top: y - r, width: r * 2, height: r * 2, 'border-radius': '50%', ...style }, inner );
const rect = ( x, y, w, h, style = {}, inner = '' ) => shape( { left: x, top: y, width: w, height: h, ...style }, inner );
/** A plus sign. */
const plus = ( x, y, size, color ) => rect( x - size / 2, y - size / 6, size, size / 3, { background: color, 'border-radius': size / 8 } ) + rect( x - size / 6, y - size / 2, size / 3, size, { background: color, 'border-radius': size / 8 } );
/** A heart-rate line. */
const pulse = ( x, y, width, color, stroke = 8 ) => `<svg style="position:absolute;left:${ x }px;top:${ y - 60 }px" width="${ width }" height="120" viewBox="0 0 400 120" preserveAspectRatio="none"><polyline points="0,60 110,60 140,20 175,100 210,10 245,60 400,60" fill="none" stroke="${ color }" stroke-width="${ stroke }" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
const heart = ( x, y, size, color ) => `<svg style="position:absolute;left:${ x - size / 2 }px;top:${ y - size / 2 }px" width="${ size }" height="${ size }" viewBox="0 0 100 100"><path d="M50 88 C 20 64, 6 46, 6 30 C 6 16, 17 8, 28 8 C 38 8, 46 14, 50 22 C 54 14, 62 8, 72 8 C 83 8, 94 16, 94 30 C 94 46, 80 64, 50 88 Z" fill="${ color }"/></svg>`;
const plant = ( x, y, size ) => rect( x - size * 0.22, y - size * 0.3, size * 0.44, size * 0.3, { background: C.clay, 'border-radius': `${ size * 0.04 }px ${ size * 0.04 }px ${ size * 0.12 }px ${ size * 0.12 }px` } )
	+ rect( x - size * 0.34, y - size * 0.8, size * 0.34, size * 0.5, { background: C.leaf, 'border-radius': '100% 0 100% 0' } )
	+ rect( x, y - size, size * 0.34, size * 0.7, { background: '#2F8571', 'border-radius': '0 100% 0 100%' } );

/**
 * A person from the chest up.
 *
 * @param {number} x      Centre.
 * @param {number} y      Top of the head.
 * @param {number} scale  1 is about 420px wide.
 * @param {Object} look   skin, hair, hairStyle, top, coat, stethoscope.
 */
const person = ( x, y, scale, { skin = '#E3B594', hair = '#3A2A22', hairStyle = 'short', top = C.teal, coat = false, stethoscope = false } ) => {
	const s = scale;
	let out = '';
	if ( hairStyle === 'long' ) {
		out += rect( x - 118 * s, y + 10 * s, 236 * s, 300 * s, { background: hair, 'border-radius': `${ 118 * s }px ${ 118 * s }px ${ 40 * s }px ${ 40 * s }px` } );
	}
	out += rect( x - 210 * s, y + 300 * s, 420 * s, 520 * s, { background: coat ? C.white : top, 'border-radius': `${ 180 * s }px ${ 180 * s }px 0 0` } );
	if ( coat ) {
		out += rect( x - 70 * s, y + 300 * s, 140 * s, 520 * s, { background: top, 'clip-path': 'polygon(0 0, 100% 0, 60% 100%, 40% 100%)' } )
			+ rect( x - 210 * s, y + 300 * s, 420 * s, 520 * s, { 'border-radius': `${ 180 * s }px ${ 180 * s }px 0 0`, 'box-shadow': `inset 0 0 0 ${ 3 * s }px rgba(10,63,66,.10)` } );
	}
	out += rect( x - 38 * s, y + 240 * s, 76 * s, 90 * s, { background: skin } )
		+ rect( x - 100 * s, y + 20 * s, 200 * s, 250 * s, { background: skin, 'border-radius': `${ 100 * s }px ${ 100 * s }px ${ 96 * s }px ${ 96 * s }px` } );
	out += hairStyle === 'bun' ? circle( x, y - 14 * s, 54 * s, { background: hair } ) + rect( x - 108 * s, y + 4 * s, 216 * s, 110 * s, { background: hair, 'border-radius': `${ 108 * s }px ${ 108 * s }px ${ 16 * s }px ${ 16 * s }px` } )
		: hairStyle === 'bald' ? rect( x - 104 * s, y + 60 * s, 30 * s, 80 * s, { background: hair, 'border-radius': 12 * s } ) + rect( x + 74 * s, y + 60 * s, 30 * s, 80 * s, { background: hair, 'border-radius': 12 * s } )
			: rect( x - 108 * s, y, 216 * s, hairStyle === 'long' ? 96 * s : 110 * s, { background: hair, 'border-radius': `${ 108 * s }px ${ 108 * s }px ${ 14 * s }px ${ 50 * s }px` } );
	if ( stethoscope ) {
		out += rect( x - 92 * s, y + 310 * s, 184 * s, 190 * s, { border: `${ 10 * s }px solid ${ C.ink }`, 'border-top-color': 'transparent', 'border-radius': `0 0 ${ 92 * s }px ${ 92 * s }px` } )
			+ circle( x + 60 * s, y + 520 * s, 26 * s, { background: C.aqua, border: `${ 9 * s }px solid ${ C.ink }` } );
	}
	return out;
};

const doctor = ( background, look, accent ) => art( 900, 1100, background,
	rect( 110, 150, 680, 1100, { background: accent, 'border-radius': '340px 340px 0 0' } )
	+ person( 450, 250, 1.12, { coat: true, stethoscope: true, ...look } )
	+ plus( 150, 170, 70, C.white ) );

const cover = ( background, body ) => art( 1600, 900, background, body );

const images = {
	hero: [ 1400, 1300, art( 1400, 1300, C.mist,
		rect( 240, 140, 920, 1300, { background: C.aqua, 'border-radius': '460px 460px 0 0' } )
		+ person( 700, 250, 1.5, { coat: true, stethoscope: true, hair: '#2B1D14', hairStyle: 'bun', skin: '#D9A886' } )
		+ rect( 70, 760, 430, 200, { background: C.white, 'border-radius': 28, 'box-shadow': soft }, pulse( 40, 100, 350, C.coral, 9 ) )
		+ rect( 950, 330, 360, 150, { background: C.white, 'border-radius': 28, 'box-shadow': soft }, circle( 75, 75, 42, { background: C.mist } ) + plus( 75, 75, 44, C.teal ) + rect( 140, 46, 170, 20, { background: C.ink, 'border-radius': 10 } ) + rect( 140, 86, 110, 16, { background: C.line, 'border-radius': 8 } ) )
		+ plus( 170, 250, 90, C.white ) + plus( 1250, 1010, 70, C.teal ) + circle( 1180, 170, 36, { background: C.coral } ) ) ],
	'doctor-1': [ 900, 1100, doctor( C.mist, { hair: '#2B1D14', hairStyle: 'bun', skin: '#D9A886' }, C.aqua ) ],
	'doctor-2': [ 900, 1100, doctor( C.sand, { hair: '#1F2326', hairStyle: 'short', skin: '#8C5A3C', top: C.deep }, '#EADBC8' ) ],
	'doctor-3': [ 900, 1100, doctor( C.aqua, { hair: '#7A3B22', hairStyle: 'long', skin: '#F0C9A8', top: C.coral }, C.mist ) ],
	'doctor-4': [ 900, 1100, doctor( C.mist, { hair: '#9AA5A6', hairStyle: 'bald', skin: '#E3B594', top: C.teal }, '#D5ECE7' ) ],
	building: [ 1600, 1000, art( 1600, 1000, C.mist,
		circle( 1320, 220, 120, { background: C.white } )
		+ rect( 0, 820, 1600, 180, { background: C.aqua } )
		+ rect( 300, 300, 1000, 530, { background: C.white, 'border-radius': '28px 28px 0 0', 'box-shadow': soft } )
		+ rect( 300, 300, 1000, 80, { background: C.teal, 'border-radius': '28px 28px 0 0' } ) + plus( 380, 340, 44, C.white )
		+ [ 0, 1, 2, 3, 4 ].flatMap( ( col ) => [ 0, 1 ].map( ( rowIndex ) => ( col === 2 && rowIndex === 1 ? '' : rect( 370 + col * 185, 430 + rowIndex * 170, 120, 120, { background: C.mist, 'border-radius': 14, border: `6px solid ${ C.line }` } ) ) ) ).join( '' )
		+ rect( 725, 610, 150, 220, { background: C.deep, 'border-radius': '75px 75px 0 0' } )
		+ plant( 220, 830, 220 ) + plant( 1390, 830, 260 ) ) ],
	reception: [ 1600, 1000, art( 1600, 1000, C.sand,
		rect( 0, 720, 1600, 280, { background: '#EADBC8' } )
		+ rect( 980, 120, 480, 420, { background: C.mist, 'border-radius': 24, border: `10px solid ${ C.white }` }, rect( 225, 0, 10, 400, { background: C.white } ) + circle( 120, 110, 50, { background: C.white } ) )
		+ person( 520, 150, 0.62, { top: C.deep, hair: '#7A3B22', hairStyle: 'long', skin: '#F0C9A8' } )
		+ rect( 180, 470, 700, 330, { background: C.teal, 'border-radius': '28px 28px 0 0', 'box-shadow': soft } )
		+ rect( 150, 440, 760, 50, { background: C.white, 'border-radius': 14 } )
		+ plus( 530, 640, 110, C.white )
		+ rect( 1010, 640, 180, 120, { background: C.coral, 'border-radius': 24 } ) + rect( 1010, 600, 180, 70, { background: '#F09A86', 'border-radius': '24px 24px 0 0' } )
		+ rect( 1230, 640, 180, 120, { background: C.coral, 'border-radius': 24 } ) + rect( 1230, 600, 180, 70, { background: '#F09A86', 'border-radius': '24px 24px 0 0' } )
		+ plant( 90, 800, 300 ) ) ],
	room: [ 1600, 1000, art( 1600, 1000, C.mist,
		rect( 0, 740, 1600, 260, { background: C.aqua } )
		+ rect( 140, 520, 760, 90, { background: C.white, 'border-radius': 30, 'box-shadow': soft } )
		+ rect( 140, 470, 220, 90, { background: C.teal, 'border-radius': 30, transform: 'rotate(-12deg)' } )
		+ rect( 220, 610, 24, 190, { background: C.deep } ) + rect( 800, 610, 24, 190, { background: C.deep } )
		+ rect( 1060, 200, 400, 280, { background: C.deep, 'border-radius': 24, 'box-shadow': soft }, pulse( 30, 140, 340, '#7FE0C8', 8 ) )
		+ rect( 1250, 480, 20, 280, { background: C.deep } ) + rect( 1150, 760, 220, 20, { background: C.deep, 'border-radius': 10 } )
		+ rect( 1000, 600, 150, 200, { background: C.white, 'border-radius': 16, 'box-shadow': soft } ) + plus( 1075, 670, 60, C.coral )
		+ plus( 180, 160, 80, C.white ) + plus( 760, 220, 50, C.teal ) ) ],
	family: [ 1600, 1000, art( 1600, 1000, C.sand,
		circle( 800, 1150, 760, { background: '#EFE2D1' } )
		+ person( 470, 250, 0.9, { top: C.teal, hair: '#2B1D14', hairStyle: 'long', skin: '#D9A886' } )
		+ person( 1130, 220, 0.95, { top: C.deep, hair: '#9AA5A6', hairStyle: 'bald', skin: '#E3B594' } )
		+ person( 800, 470, 0.66, { top: C.coral, hair: '#7A3B22', hairStyle: 'short', skin: '#F0C9A8' } )
		+ heart( 220, 200, 110, C.coral ) + plus( 1420, 200, 80, C.teal ) ) ],
	cardio: [ 1400, 1000, art( 1400, 1000, C.mist,
		circle( 700, 500, 360, { background: C.white, 'box-shadow': soft } )
		+ heart( 700, 500, 420, C.coral )
		+ pulse( 120, 500, 1160, C.deep, 14 )
		+ plus( 200, 190, 80, C.teal ) + plus( 1210, 810, 60, C.white ) + circle( 1180, 200, 40, { background: C.aqua } ) ) ],
	'note-1': [ 1600, 900, cover( C.teal, heart( 800, 450, 380, C.white ) + pulse( 180, 450, 1240, C.teal, 16 ) + plus( 220, 190, 90, C.aqua ) + plus( 1380, 720, 70, C.aqua ) ) ],
	'note-2': [ 1600, 900, cover( C.deep, circle( 1080, 380, 230, { background: '#F4E7B5' } ) + circle( 1000, 320, 210, { background: C.deep } ) + [ [ 300, 220, 22 ], [ 520, 520, 14 ], [ 700, 160, 16 ], [ 1380, 600, 18 ], [ 380, 680, 12 ], [ 1280, 180, 12 ] ].map( ( [ x, y, r ] ) => circle( x, y, r, { background: C.aqua } ) ).join( '' ) + rect( 0, 720, 1600, 180, { background: '#0D5154' } ) ) ],
	'note-3': [ 1600, 900, cover( C.sand, circle( 800, 450, 260, { background: C.white, 'box-shadow': soft } ) + rect( 660, 300, 280, 320, { background: C.teal, 'clip-path': 'polygon(50% 0, 100% 16%, 100% 58%, 50% 100%, 0 58%, 0 16%)' } ) + plus( 800, 450, 130, C.white ) + circle( 300, 260, 60, { background: C.coral } ) + circle( 1340, 660, 44, { background: C.aqua } ) + plus( 1290, 230, 70, C.teal ) ) ],
};

const total = await render( path.join( SITE, 'media/files' ), images, { quality: 82 } );
console.log( `${ Object.keys( images ).length } images, ${ Math.round( total / 1024 ) } KB in total.` );
