#!/usr/bin/env node
/**
 * Draws the images of the Business starter site.
 *
 *   node tools/sites/business-art.mjs     (needs Playwright)
 *
 * The design uses abstract geometric artwork in the brand palette instead of
 * photographs: it is original, free of any licence question (CC0), small in
 * bytes, and a user replaces it with their own pictures anyway. Each image is
 * an HTML composition rendered to JPEG, so the output is the same on every run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire( import.meta.url )( 'playwright' );
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites/business/media/files' );

const C = { brand: '#2456E6', brandDark: '#1A3FB4', ink: '#0B1F3A', inkSoft: '#16335C', accent: '#F2A93B', tint: '#F3F6FB', line: '#DCE3EE', sky: '#A9C1FA', white: '#FFFFFF' };

/** A repeatable pseudo-random number generator, so compositions do not change between runs. */
const random = ( seed ) => () => ( ( seed = ( seed * 1664525 + 1013904223 ) % 4294967296 ) / 4294967296 );

const frame = ( width, height, background, body ) => `<!doctype html><meta charset="utf-8"><style>
	* { box-sizing: border-box; margin: 0; }
	body { width: ${ width }px; height: ${ height }px; background: ${ background }; position: relative; overflow: hidden; font-family: system-ui, sans-serif; }
	i { position: absolute; display: block; }
</style>${ body }`;

const shape = ( style ) => `<i style="${ Object.entries( style ).map( ( [ key, value ] ) => `${ key }:${ typeof value === 'number' ? value + 'px' : value }` ).join( ';' ) }"></i>`;

/** Rising bars: growth, results. */
function bars( width, height, seed, { background = C.tint, dark = false } = {} ) {
	const next = random( seed );
	const count = 7;
	const gap = width * 0.03;
	const barWidth = ( width * 0.76 - gap * ( count - 1 ) ) / count;
	const colors = dark ? [ C.inkSoft, C.brand, C.sky, C.brand, C.inkSoft, C.accent, C.white ] : [ C.sky, C.brand, C.ink, C.brand, C.sky, C.ink, C.accent ];
	let body = shape( { left: width * 0.08, right: width * 0.08, bottom: height * 0.16, height: 2, background: dark ? '#2A4266' : C.line } );
	for ( let index = 0; index < count; index++ ) {
		const tall = height * ( 0.2 + 0.5 * ( ( index + 1 ) / count ) * ( 0.75 + next() * 0.4 ) );
		body += shape( { left: width * 0.12 + index * ( barWidth + gap ), bottom: height * 0.16, width: barWidth, height: Math.min( tall, height * 0.68 ), background: colors[ index ], 'border-radius': `${ barWidth * 0.18 }px ${ barWidth * 0.18 }px 0 0` } );
	}
	body += shape( { right: width * 0.1, top: height * 0.1, width: height * 0.16, height: height * 0.16, 'border-radius': '50%', border: `${ Math.round( height * 0.022 ) }px solid ${ C.accent }` } );
	return frame( width, height, background, body );
}

/** Overlapping panels: structure, organisation. */
function panels( width, height, seed, { background = C.ink } = {} ) {
	const next = random( seed );
	const light = background !== C.ink;
	let body = '';
	const palette = light ? [ C.white, C.sky, C.brand, C.ink ] : [ C.inkSoft, C.brand, C.sky, C.white ];
	for ( let index = 0; index < 4; index++ ) {
		const w = width * ( 0.34 + next() * 0.16 );
		const h = height * ( 0.36 + next() * 0.2 );
		body += shape( { left: width * ( 0.1 + index * 0.16 ), top: height * ( 0.12 + ( index % 2 ) * 0.2 + next() * 0.06 ), width: w, height: h, background: palette[ index ], 'border-radius': Math.round( height * 0.035 ), opacity: index === 3 ? 0.96 : 1, 'box-shadow': '0 30px 60px rgba(11,31,58,.18)' } );
	}
	body += shape( { left: width * 0.62, top: height * 0.56, width: height * 0.3, height: height * 0.3, 'border-radius': '50%', background: C.accent } );
	body += shape( { left: width * 0.16, top: height * 0.76, width: width * 0.3, height: Math.round( height * 0.018 ), 'border-radius': 99, background: light ? C.ink : C.white, opacity: 0.85 } );
	body += shape( { left: width * 0.16, top: height * 0.81, width: width * 0.18, height: Math.round( height * 0.018 ), 'border-radius': 99, background: light ? C.brand : C.sky, opacity: 0.85 } );
	return frame( width, height, background, body );
}

/** Concentric arcs: focus, direction. */
function arcs( width, height, seed, { background = C.tint } = {} ) {
	const next = random( seed );
	const cx = width * ( 0.55 + next() * 0.1 );
	const cy = height * 1.02;
	const colors = [ C.ink, C.brand, C.sky, C.white, C.accent ];
	let body = '';
	for ( let index = 0; index < 5; index++ ) {
		const r = height * ( 0.95 - index * 0.17 );
		body += shape( { left: cx - r, top: cy - r, width: r * 2, height: r * 2, 'border-radius': '50%', background: colors[ index ] } );
	}
	body += shape( { left: width * 0.08, top: height * 0.12, width: width * 0.2, height: Math.round( height * 0.02 ), 'border-radius': 99, background: C.ink } );
	body += shape( { left: width * 0.08, top: height * 0.17, width: width * 0.12, height: Math.round( height * 0.02 ), 'border-radius': 99, background: C.brand } );
	return frame( width, height, background, body );
}

/** A grid of tiles with a few highlighted: systems, portfolios. */
function tiles( width, height, seed, { background = C.ink, columns = 8, rows = 4 } = {} ) {
	const next = random( seed );
	const pad = height * 0.12;
	const gap = height * 0.03;
	const tile = Math.min( ( width - pad * 2 - gap * ( columns - 1 ) ) / columns, ( height - pad * 2 - gap * ( rows - 1 ) ) / rows );
	const left = ( width - ( tile * columns + gap * ( columns - 1 ) ) ) / 2;
	const top = ( height - ( tile * rows + gap * ( rows - 1 ) ) ) / 2;
	const light = background !== C.ink;
	let body = '';
	for ( let row = 0; row < rows; row++ ) {
		for ( let column = 0; column < columns; column++ ) {
			const pick = next();
			const color = pick > 0.9 ? C.accent : pick > 0.68 ? C.brand : pick > 0.5 ? C.sky : light ? C.white : C.inkSoft;
			body += shape( { left: left + column * ( tile + gap ), top: top + row * ( tile + gap ), width: tile, height: tile, background: color, 'border-radius': pick > 0.8 ? '50%' : Math.round( tile * 0.16 ) } );
		}
	}
	return frame( width, height, background, body );
}

/** A monogram tile standing in for a portrait. */
function monogram( initials, seed ) {
	const backgrounds = [ C.tint, C.ink, C.sky, C.brand ];
	const background = backgrounds[ seed % backgrounds.length ];
	const dark = background === C.ink || background === C.brand;
	return frame( 800, 800, background, `
		${ shape( { left: 110, top: 110, width: 580, height: 580, 'border-radius': '50%', border: `10px solid ${ dark ? C.accent : C.brand }`, opacity: 0.9 } ) }
		${ shape( { left: 560, top: 96, width: 120, height: 120, 'border-radius': '50%', background: dark ? C.white : C.accent } ) }
		<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:230px;font-weight:800;letter-spacing:-8px;color:${ dark ? C.white : C.ink }">${ initials }</div>` );
}

const images = {
	hero: [ 1600, 1200, panels( 1600, 1200, 7 ) ],
	about: [ 1400, 1050, bars( 1400, 1050, 3 ) ],
	approach: [ 1400, 1050, arcs( 1400, 1050, 11 ) ],
	office: [ 2400, 840, tiles( 2400, 840, 5, { columns: 14, rows: 4 } ) ],
	'project-harbor': [ 1600, 1000, arcs( 1600, 1000, 21, { background: C.ink } ) ],
	'project-alder': [ 1600, 1000, tiles( 1600, 1000, 9, { background: C.tint, columns: 8, rows: 5 } ) ],
	'project-kestrel': [ 1600, 1000, bars( 1600, 1000, 14, { background: C.ink, dark: true } ) ],
	'project-lumen': [ 1600, 1000, panels( 1600, 1000, 30, { background: C.tint } ) ],
	'team-1': [ 800, 800, monogram( 'MH', 0 ) ],
	'team-2': [ 800, 800, monogram( 'TO', 1 ) ],
	'team-3': [ 800, 800, monogram( 'IC', 2 ) ],
	'team-4': [ 800, 800, monogram( 'DR', 3 ) ],
	'post-1': [ 1600, 840, bars( 1600, 840, 40 ) ],
	'post-2': [ 1600, 840, panels( 1600, 840, 41 ) ],
	'post-3': [ 1600, 840, tiles( 1600, 840, 42, { background: C.tint, columns: 10, rows: 4 } ) ],
};

fs.rmSync( OUT, { recursive: true, force: true } );
fs.mkdirSync( OUT, { recursive: true } );

const browser = await chromium.launch();
const page = await browser.newPage();
let total = 0;
for ( const [ name, [ width, height, html ] ] of Object.entries( images ) ) {
	await page.setViewportSize( { width, height } );
	await page.setContent( html );
	const file = path.join( OUT, name + '.jpg' );
	await page.screenshot( { path: file, type: 'jpeg', quality: 86 } );
	total += fs.statSync( file ).size;
}
await browser.close();
console.log( `${ Object.keys( images ).length } images, ${ Math.round( total / 1024 ) } KB in total.` );
