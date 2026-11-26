#!/usr/bin/env node
/**
 * Draws the images of the Education starter site.
 *
 *   node tools/sites/education-art.mjs     (needs Playwright)
 *
 * Bright, flat, geometric pictures: one tile per course, a hero composition,
 * the building, a group and four instructors. They are original (CC0), small,
 * and stand in for the photographs an academy would put in their place.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fontFace, frame, random, render, shape } from './art.mjs';

const SITE = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites/education' );
const CSS = fontFace( 'Bricolage Grotesque', path.join( SITE, 'fonts/files/bricolage-grotesque-latin.woff2' ), { weight: '200 800' } );

const C = { iris: '#5B3FD6', navy: '#16224A', sun: '#FFCF4A', coral: '#FF7A59', sky: '#DCE9FF', mint: '#CFF0DF', peach: '#FFE1D2', lilac: '#E7E0FF', paper: '#FFFBF2', white: '#FFFFFF', leaf: '#2FA36B', blue: '#3D7BF2' };
const art = ( width, height, background, body ) => frame( width, height, background, body, CSS );

const circle = ( x, y, r, style = {}, inner = '' ) => shape( { left: x - r, top: y - r, width: r * 2, height: r * 2, 'border-radius': '50%', ...style }, inner );
const rect = ( x, y, w, h, style = {}, inner = '' ) => shape( { left: x, top: y, width: w, height: h, ...style }, inner );
const word = ( text, style ) => shape( { 'font-family': 'Bricolage Grotesque,sans-serif', 'font-weight': 800, 'white-space': 'nowrap', 'line-height': 1, ...style }, text );
/** A four-pointed sparkle. */
const sparkle = ( x, y, size, color ) => rect( x - size / 2, y - size / 2, size, size, { background: color, 'clip-path': 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)' } );
const hard = ( color = C.navy, offset = 12 ) => `${ offset }px ${ offset }px 0 ${ color }`;

/* ---- course tiles, 1200 x 900 ---- */
const courses = {
	'course-design': art( 1200, 900, C.lilac,
		circle( 330, 470, 210, { background: C.iris } )
		+ rect( 520, 230, 380, 380, { background: C.sun, 'border-radius': 48, transform: 'rotate(12deg)' } )
		+ rect( 700, 420, 300, 300, { background: C.coral, 'clip-path': 'polygon(50% 0, 100% 100%, 0 100%)' } )
		+ `<svg style="position:absolute;left:150px;top:150px" width="900" height="600" viewBox="0 0 900 600"><path d="M40 520 C 220 80, 520 620, 860 120" fill="none" stroke="${ C.navy }" stroke-width="10" stroke-linecap="round"/></svg>`
		+ [ [ 190, 670 ], [ 1010, 270 ] ].map( ( [ x, y ] ) => rect( x - 22, y - 22, 44, 44, { background: C.white, border: `8px solid ${ C.navy }` } ) ).join( '' )
		+ sparkle( 990, 690, 90, C.navy ) ),
	'course-code': art( 1200, 900, C.sky,
		rect( 170, 150, 860, 600, { background: C.navy, 'border-radius': 36, 'box-shadow': hard( C.iris, 22 ) },
			[ C.coral, C.sun, C.leaf ].map( ( color, index ) => circle( 60 + index * 46, 56, 15, { background: color } ) ).join( '' )
			+ [ [ 0, 240, C.sun ], [ 1, 420, C.white ], [ 1, 300, C.coral ], [ 2, 360, C.sky ], [ 1, 200, C.white ], [ 0, 150, C.sun ] ].map( ( [ indent, width, color ], index ) => rect( 70 + indent * 70, 140 + index * 68, width, 28, { background: color, 'border-radius': 14 } ) ).join( '' )
			+ word( '{ }', { right: 70, top: 300, 'font-size': 200, color: C.iris } ) )
		+ sparkle( 1080, 150, 80, C.coral ) ),
	'course-data': art( 1200, 900, C.mint,
		rect( 150, 690, 900, 12, { background: C.navy, 'border-radius': 6 } )
		+ [ [ 210, 230, C.iris ], [ 370, 360, C.coral ], [ 530, 300, C.sun ], [ 690, 470, C.iris ], [ 850, 540, C.navy ] ].map( ( [ x, h, color ] ) => rect( x, 690 - h, 120, h, { background: color, 'border-radius': '24px 24px 0 0' } ) ).join( '' )
		+ `<svg style="position:absolute;left:0;top:0" width="1200" height="900"><polyline points="270,400 430,270 590,330 750,160 910,100" fill="none" stroke="${ C.navy }" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>`
		+ [ [ 270, 400 ], [ 430, 270 ], [ 590, 330 ], [ 750, 160 ], [ 910, 100 ] ].map( ( [ x, y ] ) => circle( x, y, 20, { background: C.white, border: `8px solid ${ C.navy }` } ) ).join( '' )
		+ circle( 250, 200, 80, { background: `conic-gradient(${ C.coral } 0 35%, ${ C.sun } 35% 70%, ${ C.iris } 70% 100%)` } ) ),
	'course-language': art( 1200, 900, C.peach,
		rect( 150, 170, 540, 300, { background: C.iris, 'border-radius': '60px 60px 60px 12px', 'box-shadow': hard() }, word( '¡Hola!', { left: 70, top: 86, 'font-size': 130, color: C.white } ) )
		+ rect( 520, 440, 520, 280, { background: C.sun, 'border-radius': '60px 60px 12px 60px', 'box-shadow': hard() }, word( 'Hello!', { left: 80, top: 80, 'font-size': 124, color: C.navy } ) )
		+ rect( 190, 560, 250, 150, { background: C.white, 'border-radius': '40px 40px 40px 10px', 'box-shadow': hard( C.navy, 10 ) }, [ 0, 1, 2 ].map( ( index ) => circle( 70 + index * 55, 75, 16, { background: C.coral } ) ).join( '' ) )
		+ sparkle( 950, 240, 100, C.coral ) ),
	'course-photo': art( 1200, 900, C.sun,
		rect( 250, 280, 700, 440, { background: C.navy, 'border-radius': 56, 'box-shadow': hard( C.coral, 20 ) } )
		+ rect( 420, 210, 220, 110, { background: C.navy, 'border-radius': '30px 30px 0 0' } )
		+ circle( 600, 500, 160, { background: C.white } ) + circle( 600, 500, 120, { background: C.iris } ) + circle( 600, 500, 60, { background: C.navy } ) + circle( 640, 460, 22, { background: C.white, opacity: 0.8 } )
		+ rect( 800, 330, 90, 50, { background: C.sun, 'border-radius': 14 } )
		+ sparkle( 170, 200, 110, C.white ) + sparkle( 1040, 760, 70, C.navy ) ),
	'course-writing': art( 1200, 900, C.sky,
		rect( 270, 130, 560, 660, { background: C.white, 'border-radius': 28, 'box-shadow': hard( C.navy, 16 ), transform: 'rotate(-4deg)' },
			rect( 0, 0, 70, 660, { background: C.coral, 'border-radius': '28px 0 0 28px' } )
			+ [ 0, 1, 2, 3, 4, 5 ].map( ( index ) => rect( 130, 110 + index * 80, index === 5 ? 200 : 340 - ( index % 2 ) * 60, 22, { background: index === 0 ? C.navy : '#C9D1EA', 'border-radius': 11 } ) ).join( '' ) )
		+ rect( 760, 260, 70, 480, { background: C.sun, 'border-radius': 12, transform: 'rotate(24deg)', 'box-shadow': hard( C.navy, 8 ) }, rect( 0, 0, 70, 80, { background: C.coral, 'border-radius': '12px 12px 0 0' } ) + rect( 0, 400, 70, 80, { background: C.navy, 'clip-path': 'polygon(0 0, 100% 0, 50% 100%)' } ) )
		+ sparkle( 990, 180, 90, C.iris ) ),
};

/** A flat portrait: shoulders, head and one of four kinds of hair. */
const portrait = ( background, top, skin, hair, style ) => {
	const styles = {
		bob: rect( 240, 190, 320, 300, { background: hair, 'border-radius': '160px 160px 40px 40px' } ),
		bun: circle( 400, 170, 70, { background: hair } ) + rect( 265, 215, 270, 150, { background: hair, 'border-radius': '135px 135px 20px 20px' } ),
		short: rect( 265, 205, 270, 130, { background: hair, 'border-radius': '135px 135px 10px 60px' } ),
		curly: [ [ 290, 270 ], [ 340, 215 ], [ 400, 195 ], [ 460, 215 ], [ 510, 270 ], [ 280, 340 ], [ 520, 340 ] ].map( ( [ x, y ] ) => circle( x, y, 62, { background: hair } ) ).join( '' ),
	};
	return art( 800, 800, background,
		rect( 150, 590, 500, 420, { background: top, 'border-radius': '250px 250px 0 0' } )
		+ ( style === 'bob' || style === 'curly' ? styles[ style ] : '' )
		+ rect( 360, 520, 80, 110, { background: skin } )
		+ rect( 285, 250, 230, 290, { background: skin, 'border-radius': '115px 115px 110px 110px' } )
		+ ( style === 'bob' ? rect( 285, 230, 230, 90, { background: hair, 'border-radius': '115px 115px 20px 20px' } ) : '' )
		+ ( style === 'bun' || style === 'short' ? styles[ style ] : '' )
		+ ( style === 'curly' ? rect( 300, 235, 200, 70, { background: hair, 'border-radius': '100px 100px 30px 30px' } ) : '' )
		+ ( style === 'short' ? circle( 350, 400, 34, { border: `8px solid ${ C.navy }` } ) + circle( 450, 400, 34, { border: `8px solid ${ C.navy }` } ) + rect( 384, 396, 32, 8, { background: C.navy } ) : '' ) );
};

/** Scattered shapes, for the covers of news items. */
const confetti = ( width, height, background, seed, big ) => {
	const next = random( seed );
	const colors = [ C.iris, C.sun, C.coral, C.navy, C.white ];
	let body = '';
	for ( let index = 0; index < 26; index++ ) {
		const x = next() * width;
		let y = next() * height;
		// Keep the middle band clear for the words.
		if ( y > height * 0.3 && y < height * 0.68 && x < width * 0.8 ) {
			y = y < height * 0.5 ? y - height * 0.24 : y + height * 0.24;
		}
		const size = 40 + next() * 90;
		const color = colors[ index % colors.length ];
		const kind = index % 4;
		body += kind === 0 ? circle( x, y, size / 2, { background: color } )
			: kind === 1 ? rect( x, y, size, size, { background: color, 'border-radius': size * 0.22, transform: `rotate(${ next() * 80 }deg)` } )
				: kind === 2 ? sparkle( x, y, size, color )
					: rect( x, y, size * 1.6, size * 0.36, { background: color, 'border-radius': size, transform: `rotate(${ next() * 180 }deg)` } );
	}
	return art( width, height, background, body + big );
};

const images = {
	// The hero sits on the sun-coloured panel of the home page, so it has the same background.
	hero: [ 1400, 1200, art( 1400, 1200, C.sun,
		circle( 760, 560, 430, { background: '#FFE08A' } )
		// A stack of books.
		+ [ [ 300, 880, 620, C.iris ], [ 350, 790, 540, C.coral ], [ 320, 700, 580, C.navy ] ].map( ( [ x, y, w, color ] ) => rect( x, y, w, 84, { background: color, 'border-radius': 16 }, rect( w - 150, 22, 120, 40, { background: C.white, 'border-radius': 8, opacity: 0.9 } ) ) ).join( '' )
		// A laptop on top of them.
		+ rect( 420, 330, 500, 330, { background: C.navy, 'border-radius': 28 }, rect( 26, 26, 448, 278, { background: C.sky, 'border-radius': 12 }, [ [ 0, 200, C.iris ], [ 1, 280, C.navy ], [ 1, 180, C.coral ], [ 0, 240, C.navy ] ].map( ( [ indent, w, color ], index ) => rect( 40 + indent * 50, 50 + index * 52, w, 22, { background: color, 'border-radius': 11 } ) ).join( '' ) ) )
		+ rect( 360, 660, 620, 40, { background: '#0E1736', 'border-radius': '8px 8px 24px 24px' } )
		// A plant and a mug.
		+ rect( 1010, 760, 170, 210, { background: C.coral, 'border-radius': '16px 16px 40px 40px' } )
		+ rect( 1085, 520, 20, 260, { background: C.leaf } ) + rect( 1000, 520, 110, 180, { background: C.leaf, 'border-radius': '100% 0 100% 0' } ) + rect( 1095, 440, 120, 200, { background: '#3DBB7E', 'border-radius': '0 100% 0 100%' } )
		+ rect( 150, 820, 150, 150, { background: C.white, 'border-radius': '16px 16px 40px 40px' } ) + circle( 130, 890, 46, { border: `18px solid ${ C.white }` } )
		+ rect( 0, 964, 1400, 16, { background: C.navy } )
		// Speech and sparkles.
		+ rect( 930, 170, 300, 180, { background: C.white, 'border-radius': '50px 50px 50px 12px', 'box-shadow': hard( C.navy, 12 ) }, word( 'A+', { left: 70, top: 44, 'font-size': 100, color: C.iris } ) )
		+ sparkle( 250, 300, 130, C.white ) + sparkle( 330, 520, 70, C.coral ) + sparkle( 1230, 520, 90, C.navy ) ) ],
	...Object.fromEntries( Object.entries( courses ).map( ( [ name, html ] ) => [ name, [ 1200, 900, html ] ] ) ),
	campus: [ 1600, 1000, art( 1600, 1000, C.sky,
		circle( 1340, 210, 110, { background: C.sun } )
		+ rect( 0, 800, 1600, 200, { background: C.mint } )
		+ rect( 330, 250, 940, 560, { background: C.paper, 'border-radius': '36px 36px 0 0', 'box-shadow': hard( C.navy, 18 ) } )
		+ rect( 330, 250, 940, 90, { background: C.iris, 'border-radius': '36px 36px 0 0' } )
		+ [ 0, 1, 2, 3 ].flatMap( ( col ) => [ 0, 1 ].map( ( rowIndex ) => rect( 410 + col * 215, 400 + rowIndex * 170, 130, 120, { background: ( col + rowIndex ) % 3 === 0 ? C.sun : C.sky, 'border-radius': 18, border: `8px solid ${ C.navy }` } ) ) ).join( '' )
		+ rect( 730, 620, 140, 190, { background: C.coral, 'border-radius': '70px 70px 0 0', border: `8px solid ${ C.navy }` } )
		+ [ 170, 1430 ].map( ( x ) => rect( x - 12, 620, 24, 190, { background: C.navy } ) + circle( x, 560, 110, { background: C.leaf } ) + circle( x + 60, 630, 70, { background: '#3DBB7E' } ) ).join( '' )
		+ word( 'TANDEM', { left: 640, top: 272, 'font-size': 52, color: C.white, 'letter-spacing': '0.12em' } ) ) ],
	group: [ 1600, 1000, art( 1600, 1000, C.mint,
		circle( 800, 1100, 700, { background: '#B5E6CC' } )
		+ [ [ 260, C.iris, '#E0B08F', C.navy ], [ 530, C.sun, '#8C5A3C', '#1B1B1B' ], [ 800, C.coral, '#F0C9A8', '#7A3B22' ], [ 1070, C.navy, '#C68E63', '#2B1D14' ], [ 1340, C.white, '#E8B994', C.iris ] ].map( ( [ x, top, skin, hair ], index ) =>
			rect( x - 150, 640 - ( index % 2 ) * 40, 300, 460, { background: top, 'border-radius': '150px 150px 0 0' } )
			+ rect( x - 30, 570 - ( index % 2 ) * 40, 60, 90, { background: skin } )
			+ rect( x - 90, 380 - ( index % 2 ) * 40, 180, 220, { background: skin, 'border-radius': '90px 90px 86px 86px' } )
			+ rect( x - 100, 350 - ( index % 2 ) * 40, 200, 110, { background: hair, 'border-radius': '100px 100px 20px 40px' } ) ).join( '' )
		+ sparkle( 160, 180, 100, C.sun ) + sparkle( 1440, 200, 80, C.coral ) + sparkle( 800, 150, 60, C.iris ) ) ],
	'teacher-1': [ 800, 800, portrait( C.lilac, C.iris, '#E0B08F', '#2B1D14', 'bob' ) ],
	'teacher-2': [ 800, 800, portrait( C.sun, C.navy, '#8C5A3C', '#1B1B1B', 'short' ) ],
	'teacher-3': [ 800, 800, portrait( C.peach, C.coral, '#F0C9A8', '#A8522E', 'bun' ) ],
	'teacher-4': [ 800, 800, portrait( C.sky, C.white, '#C68E63', '#16224A', 'curly' ) ],
	'news-1': [ 1600, 900, confetti( 1600, 900, C.iris, 5, word( 'Open day', { left: 110, top: 330, 'font-size': 230, color: C.white } ) ) ],
	'news-2': [ 1600, 900, confetti( 1600, 900, C.sun, 9, word( '10 weeks', { left: 110, top: 330, 'font-size': 230, color: C.navy } ) ) ],
	'news-3': [ 1600, 900, confetti( 1600, 900, C.mint, 14, word( 'First job', { left: 110, top: 330, 'font-size': 230, color: C.navy } ) ) ],
};

const total = await render( path.join( SITE, 'media/files' ), images, { quality: 80 } );
console.log( `${ Object.keys( images ).length } images, ${ Math.round( total / 1024 ) } KB in total.` );
