#!/usr/bin/env node
/**
 * Draws the images of the Restaurant starter site.
 *
 *   node tools/sites/restaurant-art.mjs     (needs Playwright)
 *
 * A restaurant site lives on pictures of food and rooms. These are flat
 * illustrations of a table seen from above, a dining room and a wood oven, in
 * the palette of the design. They are original (CC0), small, and stand in for
 * the photographs a restaurant would put in their place.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fontFace, frame, random, render, shape } from './art.mjs';

const SITE = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites/restaurant' );
const CSS = fontFace( 'Cormorant Garamond', path.join( SITE, 'fonts/files/cormorant-garamond-latin.woff2' ), { weight: '300 700' } )
	+ fontFace( 'Cormorant Garamond', path.join( SITE, 'fonts/files/cormorant-garamond-latin-italic.woff2' ), { weight: '300 700', style: 'italic' } );

const C = { table: '#1B1714', wood: '#3A2A1E', board: '#8A5E3B', plate: '#EFE6D6', rim: '#DDD1BC', linen: '#CFC1AA', ember: '#E39A4A', flame: '#F2C46B', green: '#6F8B4C', herb: '#8FAE5D', tomato: '#C8502F', char: '#3B2A20', crust: '#D7B27A', cream: '#F6EEDD', wine: '#6B1F2A', forest: '#22302A', night: '#141210' };
const art = ( width, height, background, body ) => frame( width, height, background, body, CSS );
const drop = '0 30px 50px rgba(0,0,0,.45), 0 6px 14px rgba(0,0,0,.35)';

const circle = ( x, y, r, style = {}, inner = '' ) => shape( { left: x - r, top: y - r, width: r * 2, height: r * 2, 'border-radius': '50%', ...style }, inner );
const pill = ( x, y, w, h, rotate, style = {} ) => shape( { left: x - w / 2, top: y - h / 2, width: w, height: h, 'border-radius': Math.min( w, h ) / 2, transform: `rotate(${ rotate }deg)`, ...style } );

/** A plate seen from above; `food( r )` draws on it, with the plate's centre at ( r, r ). */
const plate = ( x, y, r, food = () => '', { color = C.plate, rim = C.rim } = {} ) =>
	circle( x, y, r, { background: color, 'box-shadow': `${ drop }, inset 0 0 0 ${ r * 0.035 }px ${ rim }, inset 0 0 0 ${ r * 0.2 }px ${ color }, inset 0 0 0 ${ r * 0.215 }px ${ rim }` }, food( r ) );

/** A glass seen from above. */
const glass = ( x, y, r, liquid = C.wine ) =>
	circle( x, y, r, { background: 'rgba(255,255,255,.10)', border: `${ Math.max( 3, r * 0.07 ) }px solid rgba(255,255,255,.55)`, 'box-shadow': drop }, circle( r * 0.93, r * 0.93, r * 0.68, { background: liquid } ) );

/** A candle: a small disc with a warm glow around it. */
const candle = ( x, y, r ) =>
	circle( x, y, r * 7, { background: 'radial-gradient(circle, rgba(242,196,107,.34) 0%, rgba(242,196,107,.12) 35%, rgba(242,196,107,0) 70%)' } )
	+ circle( x, y, r, { background: '#F3E7CF', 'box-shadow': drop }, circle( r, r, r * 0.38, { background: C.flame } ) );

/** Fork and knife beside a plate. */
const cutlery = ( x, y, length ) =>
	pill( x - length * 0.07, y, length * 0.035, length, 0, { background: '#B9B2A6' } )
	+ pill( x + length * 0.07, y - length * 0.2, length * 0.07, length * 0.6, 0, { background: '#B9B2A6' } )
	+ pill( x + length * 0.07, y + length * 0.22, length * 0.035, length * 0.56, 0, { background: '#B9B2A6' } );

const napkin = ( x, y, size, rotate ) => shape( { left: x - size / 2, top: y - size / 2, width: size, height: size, background: C.linen, transform: `rotate(${ rotate }deg)`, 'box-shadow': drop } );

/** A slice of citrus. */
const citrus = ( x, y, r, color = '#E9B949' ) =>
	circle( x, y, r, { background: `repeating-conic-gradient(${ color } 0deg 36deg, #F7E3A1 36deg 45deg)`, border: `${ r * 0.12 }px solid ${ color }` }, circle( r * 0.88, r * 0.88, r * 0.14, { background: '#F7E3A1' } ) );

/* ---- food ---- */
const leeks = ( r ) =>
	circle( r * 1.28, r * 1.18, r * 0.3, { background: C.ember } )
	+ [ -0.26, 0, 0.26 ].map( ( offset, index ) => pill( r * ( 0.86 + offset * 0.3 ), r * ( 1 + offset ), r * 0.92, r * 0.19, -24, { background: index === 1 ? C.herb : C.green, 'box-shadow': `inset 0 0 0 ${ r * 0.03 }px rgba(59,42,32,.55)` } ) ).join( '' )
	+ [ [ 1.2, 1.1 ], [ 1.34, 1.24 ], [ 1.22, 1.3 ], [ 1.38, 1.08 ] ].map( ( [ a, b ] ) => circle( r * a, r * b, r * 0.035, { background: '#7A4E2B' } ) ).join( '' );

const flatbread = ( r, seed = 4 ) => {
	const next = random( seed );
	let out = shape( { left: r * 0.3, top: r * 0.32, width: r * 1.4, height: r * 1.36, background: C.crust, 'border-radius': '46% 54% 51% 49% / 52% 47% 53% 48%', 'box-shadow': `inset 0 0 0 ${ r * 0.07 }px #C59A5E` } );
	for ( let index = 0; index < 9; index++ ) {
		out += circle( r * ( 0.55 + next() * 0.9 ), r * ( 0.55 + next() * 0.9 ), r * ( 0.03 + next() * 0.035 ), { background: C.char, opacity: 0.75 } );
	}
	for ( let index = 0; index < 5; index++ ) {
		out += circle( r * ( 0.62 + next() * 0.76 ), r * ( 0.62 + next() * 0.76 ), r * 0.11, { background: C.cream } );
	}
	for ( let index = 0; index < 8; index++ ) {
		out += pill( r * ( 0.58 + next() * 0.84 ), r * ( 0.58 + next() * 0.84 ), r * 0.16, r * 0.07, next() * 180, { background: C.herb } );
	}
	for ( let index = 0; index < 4; index++ ) {
		out += circle( r * ( 0.62 + next() * 0.76 ), r * ( 0.62 + next() * 0.76 ), r * 0.075, { background: C.tomato } );
	}
	return out;
};

const steak = ( r ) =>
	circle( r * 0.72, r * 1.3, r * 0.2, { background: C.green } )
	+ [ 0, 1, 2, 3, 4 ].map( ( index ) => pill( r * ( 0.72 + index * 0.17 ), r * ( 0.86 + index * 0.03 ), r * 0.15, r * 0.62, 14, { background: 'linear-gradient(90deg,#5A3222 0%,#5A3222 18%,#B4574A 18%,#C46A5A 82%,#5A3222 82%)' } ) ).join( '' )
	+ [ [ 1.32, 1.28 ], [ 1.46, 1.14 ], [ 1.24, 1.42 ] ].map( ( [ a, b ] ) => circle( r * a, r * b, r * 0.09, { background: '#E6C27A', 'box-shadow': `inset 0 0 0 ${ r * 0.02 }px #B58A45` } ) ).join( '' );

const cheesecake = ( r ) =>
	shape( { left: r * 0.52, top: r * 0.5, width: r * 0.96, height: r * 0.96, background: `linear-gradient(135deg, ${ C.char } 0%, #6B4630 14%, #F1DFB6 14%, #F6EBCB 100%)`, 'clip-path': 'polygon(50% 100%, 0 12%, 100% 12%)' } )
	+ [ [ 1.36, 1.3 ], [ 1.48, 1.16 ], [ 1.3, 1.46 ] ].map( ( [ a, b ] ) => circle( r * a, r * b, r * 0.07, { background: C.wine } ) ).join( '' )
	+ pill( r * 0.62, r * 1.4, r * 0.16, r * 0.07, 30, { background: C.herb } );

const soup = ( r ) =>
	circle( r, r, r * 0.74, { background: '#D9843A', 'box-shadow': `inset 0 0 0 ${ r * 0.02 }px #B8672A` } )
	+ circle( r, r, r * 0.4, { border: `${ r * 0.05 }px solid ${ C.cream }`, 'border-right-color': 'transparent', 'border-bottom-color': 'transparent', transform: 'rotate(20deg)' } )
	+ [ [ 0.8, 1.2 ], [ 1.15, 1.25 ], [ 1.3, 0.85 ], [ 0.95, 0.75 ] ].map( ( [ a, b ] ) => pill( r * a, r * b, r * 0.09, r * 0.04, a * 90, { background: '#3F5A2F' } ) ).join( '' );

const bread = ( x, y, w ) =>
	shape( { left: x - w / 2, top: y - w * 0.34, width: w, height: w * 0.68, background: C.board, 'border-radius': w * 0.06, 'box-shadow': drop, transform: 'rotate(-8deg)' },
		[ 0, 1, 2, 3 ].map( ( index ) => shape( { left: w * ( 0.1 + index * 0.17 ), top: w * 0.12, width: w * 0.2, height: w * 0.44, background: '#E7CFA0', 'border-radius': '45% 45% 40% 40%', border: `${ w * 0.022 }px solid #9C6B3A`, 'box-shadow': '8px 0 0 rgba(0,0,0,.12)' } ) ).join( '' )
		+ circle( w * 0.86, w * 0.34, w * 0.08, { background: '#F4E3A6' } ) );

const table = () => `<i style="inset:0;background:radial-gradient(ellipse at 50% 40%, #2A211B 0%, ${ C.table } 70%)"></i>`;

/** One dish, on its own plate, with cutlery and a glass. */
const dish = ( food, { glassColor = C.wine, extra = '' } = {} ) => art( 1000, 1000, C.table,
	table()
	+ napkin( 190, 560, 250, 12 )
	+ cutlery( 190, 560, 420 )
	+ plate( 540, 520, 300, food )
	+ glass( 850, 190, 82, glassColor )
	+ candle( 120, 150, 26 )
	+ extra );

/** A room in elevation: arches, lamps and a banquette. */
const room = ( width, height ) => {
	let body = `<i style="inset:0;background:linear-gradient(#2B211B, #1F1814)"></i>`;
	for ( let index = 0; index < 3; index++ ) {
		const x = width * ( 0.1 + index * 0.29 );
		body += shape( { left: x, top: height * 0.14, width: width * 0.22, height: height * 0.62, background: '#3A2D24', 'border-radius': `${ width * 0.11 }px ${ width * 0.11 }px 0 0` } )
			+ shape( { left: x + width * 0.02, top: height * 0.19, width: width * 0.18, height: height * 0.57, background: index === 1 ? C.forest : '#30251E', 'border-radius': `${ width * 0.09 }px ${ width * 0.09 }px 0 0` } )
			+ circle( x + width * 0.11, height * 0.3, width * 0.1, { background: 'radial-gradient(circle, rgba(242,196,107,.5) 0%, rgba(242,196,107,.14) 40%, rgba(242,196,107,0) 70%)' } )
			+ shape( { left: x + width * 0.109, top: 0, width: 3, height: height * 0.27, background: '#0F0C0A' } )
			+ circle( x + width * 0.11, height * 0.3, width * 0.022, { background: C.flame } );
	}
	body += shape( { left: 0, top: height * 0.76, width, height: height * 0.24, background: '#15110E' } )
		+ shape( { left: width * 0.04, top: height * 0.62, width: width * 0.92, height: height * 0.16, background: '#2F4036', 'border-radius': `${ height * 0.03 }px ${ height * 0.03 }px 0 0` } )
		+ shape( { left: width * 0.04, top: height * 0.72, width: width * 0.92, height: height * 0.07, background: '#263329' } );
	for ( let index = 0; index < 3; index++ ) {
		const x = width * ( 0.14 + index * 0.29 );
		body += shape( { left: x, top: height * 0.7, width: width * 0.14, height: height * 0.022, background: C.board, 'border-radius': 6 } )
			+ shape( { left: x + width * 0.066, top: height * 0.72, width: width * 0.008, height: height * 0.2, background: '#0F0C0A' } )
			+ shape( { left: x + width * 0.04, top: height * 0.915, width: width * 0.06, height: height * 0.012, background: '#0F0C0A', 'border-radius': 4 } )
			+ shape( { left: x + width * 0.045, top: height * 0.655, width: width * 0.012, height: height * 0.046, background: C.cream, 'border-radius': 3 } )
			+ circle( x + width * 0.051, height * 0.648, width * 0.006, { background: C.flame } );
	}
	return art( width, height, C.night, body );
};

/** The wood oven: a brick wall, an arch and a fire. */
const oven = ( width, height ) => {
	let body = `<i style="inset:0;background:#3A2A22"></i>`;
	const rows = 22;
	for ( let rowIndex = 0; rowIndex < rows; rowIndex++ ) {
		for ( let col = -1; col < 8; col++ ) {
			body += shape( { left: col * width / 7 + ( rowIndex % 2 ) * width / 14 + 5, top: rowIndex * height / rows + 5, width: width / 7 - 10, height: height / rows - 10, background: ( rowIndex * 7 + col ) % 5 === 0 ? '#4A342A' : '#43302699', 'border-radius': 4 } );
		}
	}
	body += shape( { left: width * 0.16, top: height * 0.3, width: width * 0.68, height: height * 0.46, background: '#201612', 'border-radius': `${ width * 0.34 }px ${ width * 0.34 }px 0 0`, 'box-shadow': `0 0 0 ${ width * 0.035 }px #5A4034` } )
		+ shape( { left: width * 0.2, top: height * 0.34, width: width * 0.6, height: height * 0.42, background: `radial-gradient(ellipse at 50% 100%, ${ C.flame } 0%, ${ C.ember } 28%, #9C3F1E 55%, #2A1712 82%)`, 'border-radius': `${ width * 0.3 }px ${ width * 0.3 }px 0 0` } )
		+ pill( width * 0.42, height * 0.735, width * 0.3, height * 0.03, -6, { background: '#2A1712' } )
		+ pill( width * 0.58, height * 0.74, width * 0.3, height * 0.03, 8, { background: '#3B2018' } )
		+ shape( { left: 0, top: height * 0.76, width, height: height * 0.05, background: '#5A4034' } )
		+ shape( { left: 0, top: height * 0.81, width, height: height * 0.19, background: '#241A15' } );
	return art( width, height, C.night, body );
};

/** A repeating pattern for the journal covers. */
const pattern = ( width, height, background, item, { cols = 8, rows = 4, seed = 3 } = {} ) => {
	const next = random( seed );
	let body = '';
	for ( let rowIndex = 0; rowIndex < rows; rowIndex++ ) {
		for ( let col = 0; col <= cols; col++ ) {
			body += item( ( col + ( rowIndex % 2 ) * 0.5 ) * width / cols, ( rowIndex + 0.5 ) * height / rows, next );
		}
	}
	return art( width, height, background, body );
};

const stalk = ( x, y, size, color ) =>
	pill( x, y, size * 0.05, size, 0, { background: color } )
	+ [ -0.36, -0.2, -0.04, 0.12 ].map( ( offset ) => pill( x - size * 0.09, y + size * offset, size * 0.09, size * 0.2, 28, { background: color } ) + pill( x + size * 0.09, y + size * offset, size * 0.09, size * 0.2, -28, { background: color } ) ).join( '' )
	+ pill( x, y - size * 0.5, size * 0.09, size * 0.2, 0, { background: color } );

const person = ( background, coat, hair, { hat = false } = {} ) => art( 1000, 1200, background,
	circle( 500, 520, 380, { background: 'rgba(255,255,255,.06)' } )
	+ shape( { left: 210, top: 760, width: 580, height: 700, 'border-radius': '290px 290px 0 0', background: coat } )
	+ shape( { left: 455, top: 690, width: 90, height: 120, background: '#D8A988' } )
	+ shape( { left: 370, top: 400, width: 260, height: 320, 'border-radius': '130px 130px 120px 120px', background: '#D8A988' } )
	+ ( hat
		? shape( { left: 345, top: 300, width: 310, height: 150, 'border-radius': '80px 80px 12px 12px', background: C.cream } ) + shape( { left: 360, top: 420, width: 280, height: 44, background: '#E6DAC3' } )
		: shape( { left: 350, top: 360, width: 300, height: 170, 'border-radius': '150px 150px 30px 60px', background: hair } ) )
	+ shape( { left: 470, top: 800, width: 60, height: 400, background: 'rgba(0,0,0,.14)' } ) );

const images = {
	hero: [ 2000, 1200, art( 2000, 1200, C.table,
		table()
		+ shape( { left: 720, top: 330, width: 620, height: 560, background: C.board, 'border-radius': 40, 'box-shadow': drop, transform: 'rotate(-6deg)' } )
		+ circle( 1030, 610, 250, {}, flatbread( 250, 9 ) )
		+ plate( 330, 300, 250, leeks )
		+ plate( 1640, 880, 270, steak )
		+ plate( 250, 1060, 230, soup, { color: '#2E2924', rim: '#3B352E' } )
		+ plate( 1720, 190, 200, cheesecake )
		+ glass( 620, 180, 74 ) + glass( 1420, 250, 74, '#E8C66A' ) + glass( 620, 1010, 70, '#E8C66A' ) + glass( 1330, 1050, 74 )
		+ candle( 960, 150, 24 ) + candle( 1130, 1060, 24 )
		+ cutlery( 60, 620, 330 ) + cutlery( 1930, 480, 330 )
		+ `<i style="inset:0;background:radial-gradient(ellipse at 50% 50%, rgba(20,18,16,0) 30%, rgba(20,18,16,.55) 100%)"></i>` ), 68 ],
	'dish-leeks': [ 1000, 1000, dish( leeks, { glassColor: '#E8C66A' } ) ],
	'dish-flatbread': [ 1000, 1000, dish( ( r ) => flatbread( r, 12 ) ) ],
	'dish-steak': [ 1000, 1000, dish( steak ) ],
	'dish-cheesecake': [ 1000, 1000, dish( cheesecake, { glassColor: '#B5651D' } ) ],
	room: [ 1600, 1100, room( 1600, 1100 ) ],
	oven: [ 1200, 1500, oven( 1200, 1500 ) ],
	'long-table': [ 1600, 1000, art( 1600, 1000, C.table,
		table()
		+ shape( { left: 120, top: 300, width: 1360, height: 400, background: C.wood, 'border-radius': 24, 'box-shadow': drop } )
		+ shape( { left: 120, top: 455, width: 1360, height: 90, background: C.linen, opacity: 0.9 } )
		+ [ 0, 1, 2, 3, 4, 5 ].map( ( index ) => plate( 260 + index * 216, 385, 70 ) + plate( 260 + index * 216, 615, 70 ) + glass( 330 + index * 216, 330, 22 ) + glass( 190 + index * 216, 670, 22, '#E8C66A' ) ).join( '' )
		+ [ 0, 1, 2 ].map( ( index ) => candle( 420 + index * 380, 500, 16 ) ).join( '' )
		+ [ 0, 1 ].map( ( index ) => circle( 610 + index * 380, 500, 34, { background: C.green } ) ).join( '' ) ) ],
	bar: [ 1600, 1000, art( 1600, 1000, C.night,
		`<i style="inset:0;background:radial-gradient(ellipse at 50% 30%, rgba(227,154,74,.35) 0%, rgba(227,154,74,.08) 45%, rgba(20,18,16,0) 75%)"></i>`
		+ [ 0, 1 ].map( ( shelf ) => shape( { left: 120, top: 380 + shelf * 300, width: 1360, height: 18, background: '#4A3527' } )
			+ Array.from( { length: 13 }, ( unused, index ) => {
				const tall = 150 + ( ( index * 37 + shelf * 53 ) % 90 );
				const wide = 46 + ( ( index * 17 ) % 22 );
				const color = [ '#2E4A3A', C.wine, '#B5651D', '#1F2D3A', '#C8A45A' ][ ( index + shelf * 2 ) % 5 ];
				const x = 170 + index * 100;
				return shape( { left: x, top: 380 + shelf * 300 - tall, width: wide, height: tall, background: color, 'border-radius': '10px 10px 4px 4px' } )
					+ shape( { left: x + wide * 0.32, top: 380 + shelf * 300 - tall - 54, width: wide * 0.36, height: 60, background: color, 'border-radius': '6px 6px 0 0' } )
					+ shape( { left: x + wide * 0.14, top: 380 + shelf * 300 - tall * 0.55, width: wide * 0.72, height: tall * 0.3, background: 'rgba(246,238,221,.82)' } );
			} ).join( '' ) ).join( '' )
		+ shape( { left: 0, top: 800, width: 1600, height: 200, background: '#2A1E17' } )
		+ shape( { left: 0, top: 800, width: 1600, height: 14, background: '#5A4034' } ) ) ],
	cocktail: [ 1000, 1000, art( 1000, 1000, C.table,
		table()
		+ napkin( 500, 520, 520, 18 )
		+ circle( 500, 500, 250, { background: 'rgba(255,255,255,.12)', border: '16px solid rgba(255,255,255,.6)', 'box-shadow': drop }, circle( 234, 234, 196, { background: '#D9843A' } ) + citrus( 300, 190, 86, '#E9B949' ) + shape( { left: 120, top: 250, width: 110, height: 110, background: 'rgba(255,255,255,.4)', 'border-radius': 16, transform: 'rotate(18deg)' } ) + shape( { left: 220, top: 300, width: 100, height: 100, background: 'rgba(255,255,255,.3)', 'border-radius': 16, transform: 'rotate(-12deg)' } ) )
		+ citrus( 840, 800, 70, '#E9B949' ) + citrus( 160, 180, 56, '#D9843A' )
		+ candle( 850, 160, 26 ) ) ],
	bread: [ 1000, 1000, art( 1000, 1000, C.table,
		table()
		+ bread( 470, 520, 700 )
		+ plate( 800, 220, 110, ( r ) => circle( r, r, r * 0.5, { background: '#F4E3A6' } ) )
		+ glass( 180, 190, 74, '#E8C66A' )
		+ pill( 840, 760, 26, 300, 24, { background: '#B9B2A6' } ) ) ],
	chef: [ 1000, 1200, person( '#2A211B', C.cream, '#3B2A20', { hat: true } ) ],
	host: [ 1000, 1200, person( C.forest, '#141210', '#7A3B22' ) ],
	'note-1': [ 1600, 900, pattern( 1600, 900, C.forest, ( x, y ) => stalk( x, y, 190, '#C8A45A' ), { cols: 8, rows: 3 } ), 72 ],
	'note-2': [ 1600, 900, pattern( 1600, 900, '#2A211B', ( x, y, next ) => citrus( x, y, 78 + next() * 36, next() > 0.5 ? '#E9B949' : '#D9843A' ), { cols: 6, rows: 3 } ), 66 ],
	'note-3': [ 1600, 900, pattern( 1600, 900, C.night, ( x, y, next ) => circle( x + next() * 40, y + next() * 60 - 30, 10 + next() * 34, { background: next() > 0.4 ? C.ember : C.flame, opacity: 0.35 + next() * 0.65 } ), { cols: 12, rows: 5, seed: 8 } ) ],
};

const total = await render( path.join( SITE, 'media/files' ), images, { quality: 80 } );
console.log( `${ Object.keys( images ).length } images, ${ Math.round( total / 1024 ) } KB in total.` );
