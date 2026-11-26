#!/usr/bin/env node
/**
 * Draws the images of the SaaS starter site.
 *
 *   node tools/sites/saas-art.mjs     (needs Playwright)
 *
 * A software product is sold with pictures of itself. These are screens of an
 * invented feedback tool, drawn in HTML: a dashboard, an inbox, a trends view
 * and a roadmap, plus integration tiles. Original (CC0) and small. Everything
 * else in the design is a photograph (see photo-sources.json).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fontFace, frame, render, shape } from './art.mjs';

const SITE = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites/saas' );
const CSS = fontFace( 'Sora', path.join( SITE, 'fonts/files/sora-latin.woff2' ), { weight: '100 800' } );

const C = { ink: '#0E1320', night: '#161C2E', line: '#E4E7EF', mist: '#F5F6FA', white: '#FFFFFF', text: '#4A5165', haze: '#B6BCCB', pink: '#FF4D8D', orange: '#FF8A3D', violet: '#7C5CFF', green: '#22B07D', blue: '#3B82F6', yellow: '#F5B83D' };
const GRAD = `linear-gradient(120deg, ${ C.pink }, ${ C.orange })`;
const art = ( width, height, background, body ) => frame( width, height, background, body, CSS );
const soft = '0 40px 80px rgba(14,19,32,.16), 0 8px 20px rgba(14,19,32,.08)';

const circle = ( x, y, r, style = {}, inner = '' ) => shape( { left: x - r, top: y - r, width: r * 2, height: r * 2, 'border-radius': '50%', ...style }, inner );
const rect = ( x, y, w, h, style = {}, inner = '' ) => shape( { left: x, top: y, width: w, height: h, ...style }, inner );
const bar = ( x, y, w, h = 14, color = C.line ) => rect( x, y, w, h, { background: color, 'border-radius': h / 2 } );
const word = ( text, style ) => shape( { 'font-family': 'Sora,sans-serif', 'font-weight': 600, 'white-space': 'nowrap', 'line-height': 1, ...style }, text );
const pill = ( x, y, text, color ) => shape( { left: x, top: y, padding: '8px 16px', 'border-radius': 999, background: color + '22', color, 'font-family': 'Sora,sans-serif', 'font-size': 18, 'font-weight': 600, 'white-space': 'nowrap', 'line-height': 1 }, text );

/** The window of the app: a dark sidebar and a white working area. `inner( w, h )` draws the working area. */
const app = ( w, h, inner, { active = 0 } = {} ) =>
	rect( 0, 0, w, h, { background: C.white, 'border-radius': 24, overflow: 'hidden', 'box-shadow': soft },
		rect( 0, 0, 230, h, { background: C.ink },
			circle( 54, 56, 20, { background: GRAD } ) + word( 'Loop', { left: 86, top: 42, 'font-size': 28, color: C.white } )
			+ [ 'Inbox', 'Trends', 'Roadmap', 'Customers', 'Settings' ].map( ( name, index ) => rect( 22, 120 + index * 62, 186, 46, { background: index === active ? '#252C42' : 'transparent', 'border-radius': 12 }, circle( 26, 23, 7, { background: index === active ? C.pink : '#5A627A' } ) + word( name, { left: 48, top: 14, 'font-size': 18, 'font-weight': 500, color: index === active ? C.white : '#9AA2B8' } ) ) ).join( '' ) )
		+ rect( 230, 0, w - 230, h, {}, inner( w - 230, h ) ) );

/** One piece of feedback in a list. */
const item = ( x, y, w, { color, tag, wide = 0.6 } ) =>
	rect( x, y, w, 84, { background: C.white, border: `2px solid ${ C.line }`, 'border-radius': 16 },
		circle( 44, 40, 20, { background: color } ) + bar( 82, 22, w * wide, 14, '#C9CEDB' ) + bar( 82, 48, w * wide * 0.6, 12 ) + pill( w - 190, 22, tag, color ) );

const chart = ( x, y, w, h, color = C.pink ) => {
	const values = [ 0.3, 0.42, 0.38, 0.55, 0.5, 0.68, 0.62, 0.8, 0.74, 0.92 ];
	const step = w / ( values.length - 1 );
	const points = values.map( ( value, index ) => `${ Math.round( index * step ) },${ Math.round( h - value * h ) }` ).join( ' ' );
	return `<svg style="position:absolute;left:${ x }px;top:${ y }px" width="${ w }" height="${ h }" viewBox="0 0 ${ w } ${ h }"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ color }" stop-opacity=".28"/><stop offset="1" stop-color="${ color }" stop-opacity="0"/></linearGradient></defs><polygon points="0,${ h } ${ points } ${ w },${ h }" fill="url(#g)"/><polyline points="${ points }" fill="none" stroke="${ color }" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};

const stat = ( x, y, w, value, label, color ) => rect( x, y, w, 130, { background: C.mist, 'border-radius': 18 }, word( value, { left: 24, top: 26, 'font-size': 42, color: C.ink } ) + word( label, { left: 24, top: 86, 'font-size': 17, 'font-weight': 500, color: C.text } ) + circle( w - 40, 40, 12, { background: color } ) );

const screens = {
	dashboard: ( w = 1800, h = 1100 ) => app( w, h, ( aw ) =>
		word( 'This week', { left: 48, top: 48, 'font-size': 34, color: C.ink } )
		+ [ [ '1,284', 'pieces of feedback', C.pink ], [ '37', 'themes', C.violet ], [ '92%', 'sorted automatically', C.green ] ].map( ( [ value, label, color ], index ) => stat( 48 + index * ( ( aw - 96 - 48 ) / 3 + 24 ), 116, ( aw - 96 - 48 ) / 3, value, label, color ) ).join( '' )
		+ rect( 48, 280, aw * 0.56, 440, { border: `2px solid ${ C.line }`, 'border-radius': 18 }, word( 'Feedback by week', { left: 28, top: 26, 'font-size': 20, color: C.ink } ) + chart( 28, 90, aw * 0.56 - 56, 310 ) )
		+ rect( 48 + aw * 0.56 + 24, 280, aw - 96 - aw * 0.56 - 24, 440, { border: `2px solid ${ C.line }`, 'border-radius': 18 },
			word( 'Top themes', { left: 28, top: 26, 'font-size': 20, color: C.ink } )
			+ [ [ 'Export to CSV', 0.86, C.pink ], [ 'Slow search', 0.7, C.orange ], [ 'Dark mode', 0.55, C.violet ], [ 'Mobile app', 0.4, C.blue ], [ 'Invoices', 0.28, C.green ] ].map( ( [ name, share, color ], index ) => word( name, { left: 28, top: 86 + index * 68, 'font-size': 17, 'font-weight': 500, color: C.text } ) + bar( 28, 114 + index * 68, ( aw - 96 - aw * 0.56 - 24 - 56 ) * share, 14, color ) ).join( '' ) )
		+ [ { color: C.pink, tag: 'Export' }, { color: C.violet, tag: 'Dark mode', wide: 0.5 }, { color: C.orange, tag: 'Search', wide: 0.56 } ].map( ( entry, index ) => item( 48, 750 + index * 100, aw - 96, entry ) ).join( '' ) ),
	inbox: ( w = 1400, h = 1000 ) => app( w, h, ( aw ) =>
		word( 'Inbox', { left: 44, top: 44, 'font-size': 32, color: C.ink } ) + pill( 170, 46, '12 new', C.pink )
		+ [ { color: C.pink, tag: 'Export' }, { color: C.orange, tag: 'Search', wide: 0.5 }, { color: C.violet, tag: 'Dark mode', wide: 0.56 }, { color: C.blue, tag: 'Mobile', wide: 0.44 }, { color: C.green, tag: 'Billing', wide: 0.58 }, { color: C.pink, tag: 'Export', wide: 0.5 }, { color: C.yellow, tag: 'Praise', wide: 0.46 }, { color: C.orange, tag: 'Search', wide: 0.6 } ].map( ( entry, index ) => item( 44, 116 + index * 104, aw - 88, entry ) ).join( '' ), { active: 0 } ),
	trends: ( w = 1400, h = 1000 ) => app( w, h, ( aw, ah ) =>
		word( 'Trends', { left: 44, top: 44, 'font-size': 32, color: C.ink } )
		+ rect( 44, 116, aw - 88, 420, { border: `2px solid ${ C.line }`, 'border-radius': 18 }, word( '“Export to CSV” is rising', { left: 28, top: 28, 'font-size': 22, color: C.ink } ) + pill( aw - 88 - 190, 26, '+38% in 4 weeks', C.pink ) + chart( 28, 100, aw - 144, 290 ) )
		+ [ [ 0.2, 110, C.pink, 'Export' ], [ 0.42, 86, C.orange, 'Search' ], [ 0.6, 70, C.violet, 'Dark mode' ], [ 0.76, 56, C.blue, 'Mobile' ], [ 0.9, 44, C.green, 'Billing' ] ].map( ( [ at, r, color, name ] ) => circle( 44 + ( aw - 88 ) * at, 590 + ( ah - 640 ) / 2, r, { background: color + '26', border: `3px solid ${ color }` } ) + word( name, { left: 44 + ( aw - 88 ) * at - 60, width: 120, 'text-align': 'center', top: 590 + ( ah - 640 ) / 2 - 9, 'font-size': 16, color: C.ink } ) ).join( '' ), { active: 1 } ),
	roadmap: ( w = 1400, h = 1000 ) => app( w, h, ( aw, ah ) =>
		word( 'Roadmap', { left: 44, top: 44, 'font-size': 32, color: C.ink } )
		+ [ [ 'Next', C.pink, 3 ], [ 'In progress', C.orange, 2 ], [ 'Shipped', C.green, 4 ] ].map( ( [ name, color, count ], column ) => {
			const cw = ( aw - 88 - 48 ) / 3;
			const x = 44 + column * ( cw + 24 );
			return rect( x, 116, cw, ah - 160, { background: C.mist, 'border-radius': 18 },
				circle( 32, 36, 9, { background: color } ) + word( name, { left: 52, top: 26, 'font-size': 19, color: C.ink } )
				+ Array.from( { length: count }, ( unused, index ) => rect( 18, 76 + index * 150, cw - 36, 130, { background: C.white, 'border-radius': 14, 'box-shadow': '0 6px 14px rgba(14,19,32,.06)' }, bar( 20, 24, ( cw - 76 ) * ( 0.9 - index * 0.12 ), 14, '#C9CEDB' ) + bar( 20, 52, ( cw - 76 ) * 0.5, 12 ) + pill( 20, 82, `${ 48 - index * 9 - column * 6 } requests`, color ) ) ).join( '' ) );
		} ).join( '' ), { active: 2 } ),
};

/** A screen floating on a background, slightly inset. */
const shot = ( name, w, h, background, pad = 80 ) => art( w, h, background, shape( { left: pad, top: pad, width: w - pad * 2, height: h - pad * 2 }, screens[ name ]( w - pad * 2, h - pad * 2 ) ) );

const marks = [
	[ 'Mailbox', C.blue, ( s ) => rect( s * 0.2, s * 0.3, s * 0.6, s * 0.4, { background: C.white, 'border-radius': s * 0.06 } ) + rect( s * 0.2, s * 0.3, s * 0.6, s * 0.4, { background: C.blue, 'clip-path': 'polygon(0 0, 50% 55%, 100% 0, 100% 12%, 50% 68%, 0 12%)' } ) ],
	[ 'Chatly', C.green, ( s ) => rect( s * 0.2, s * 0.24, s * 0.6, s * 0.42, { background: C.white, 'border-radius': `${ s * 0.14 }px ${ s * 0.14 }px ${ s * 0.14 }px ${ s * 0.03 }px` } ) + [ 0, 1, 2 ].map( ( index ) => circle( s * ( 0.36 + index * 0.14 ), s * 0.45, s * 0.04, { background: C.green } ) ).join( '' ) ],
	[ 'Desk', C.violet, ( s ) => circle( s * 0.5, s * 0.5, s * 0.28, { border: `${ s * 0.09 }px solid ${ C.white }` } ) + circle( s * 0.5, s * 0.5, s * 0.08, { background: C.white } ) ],
	[ 'Sheets', C.yellow, ( s ) => [ 0, 1, 2 ].flatMap( ( rowIndex ) => [ 0, 1 ].map( ( col ) => rect( s * ( 0.24 + col * 0.28 ), s * ( 0.24 + rowIndex * 0.19 ), s * 0.24, s * 0.14, { background: C.white, 'border-radius': s * 0.02 } ) ) ).join( '' ) ],
	[ 'Tracker', C.pink, ( s ) => rect( s * 0.22, s * 0.44, s * 0.2, s * 0.12, { background: C.white, 'border-radius': s * 0.03, transform: 'rotate(45deg)' } ) + rect( s * 0.36, s * 0.38, s * 0.42, s * 0.12, { background: C.white, 'border-radius': s * 0.03, transform: 'rotate(-45deg)' } ) ],
	[ 'Stores', C.orange, ( s ) => rect( s * 0.26, s * 0.4, s * 0.48, s * 0.36, { background: C.white, 'border-radius': s * 0.05 } ) + rect( s * 0.36, s * 0.22, s * 0.28, s * 0.26, { border: `${ s * 0.05 }px solid ${ C.white }`, 'border-radius': `${ s * 0.14 }px ${ s * 0.14 }px 0 0` } ) ],
];

const customer = ( background, color, name, accent ) => art( 1400, 1000, background,
	circle( 1120, 240, 300, { background: accent, opacity: 0.9 } )
	+ rect( 120, 620, 520, 22, { background: color, 'border-radius': 11, opacity: 0.25 } ) + rect( 120, 664, 360, 22, { background: color, 'border-radius': 11, opacity: 0.25 } )
	+ word( name, { left: 116, top: 380, 'font-size': 150, 'font-weight': 700, color, 'letter-spacing': '-0.04em' } ) );

const person = ( x, y, s, top, skin, hair ) => rect( x - 120 * s, y + 260 * s, 240 * s, 400 * s, { background: top, 'border-radius': `${ 120 * s }px ${ 120 * s }px 0 0` } )
	+ rect( x - 26 * s, y + 200 * s, 52 * s, 80 * s, { background: skin } ) + rect( x - 80 * s, y + 30 * s, 160 * s, 200 * s, { background: skin, 'border-radius': `${ 80 * s }px ${ 80 * s }px ${ 76 * s }px ${ 76 * s }px` } )
	+ rect( x - 88 * s, y, 176 * s, 100 * s, { background: hair, 'border-radius': `${ 88 * s }px ${ 88 * s }px ${ 16 * s }px ${ 40 * s }px` } );

const blend = ( a, b, body ) => art( 1600, 900, `linear-gradient(120deg, ${ a }, ${ b })`, body );

const images = {
	'app-dashboard': [ 1800, 1100, art( 1800, 1100, C.white, screens.dashboard() ) ],
	'app-inbox': [ 1400, 1000, shot( 'inbox', 1400, 1000, '#FFE3EC' ) ],
	'app-trends': [ 1400, 1000, shot( 'trends', 1400, 1000, '#FFEBD9' ) ],
	'app-roadmap': [ 1400, 1000, shot( 'roadmap', 1400, 1000, '#ECE7FF' ) ],
	integrations: [ 1600, 900, art( 1600, 900, C.mist,
		marks.map( ( [ name, color, draw ], index ) => {
			const size = 260;
			const x = 190 + ( index % 3 ) * 480;
			const y = 110 + Math.floor( index / 3 ) * 370;
			return rect( x, y, size, size, { background: color, 'border-radius': 56, 'box-shadow': soft }, draw( size ) ) + word( name, { left: x, width: size, 'text-align': 'center', top: y + size + 22, 'font-size': 26, color: C.ink } );
		} ).join( '' ) ) ],
};

const total = await render( path.join( SITE, 'media/files' ), images, { quality: 82 } );
console.log( `${ Object.keys( images ).length } images, ${ Math.round( total / 1024 ) } KB in total.` );
