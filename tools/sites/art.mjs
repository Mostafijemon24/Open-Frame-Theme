/**
 * Shared helpers for drawing the images of a starter site.
 *
 * A design's art script (for example portfolio-art.mjs) describes each image
 * as an HTML composition; render() turns them into JPEG files with Playwright.
 * The compositions are deterministic, so the files are the same on every run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

/** A repeatable pseudo-random number generator. */
export const random = ( seed ) => () => ( ( seed = ( seed * 1664525 + 1013904223 ) % 4294967296 ) / 4294967296 );

const UNITLESS = new Set( [ 'opacity', 'font-weight', 'line-height', 'z-index', 'flex' ] );

/** An absolutely positioned shape; numbers are pixels, except for properties that take plain numbers. */
export const shape = ( style, inner = '' ) => `<i style="${ Object.entries( style ).map( ( [ key, value ] ) => `${ key }:${ typeof value === 'number' && ! UNITLESS.has( key ) ? value + 'px' : value }` ).join( ';' ).replace( /"/g, "'" ) }">${ inner }</i>`;

/** A font file as an @font-face rule, so artwork can use the design's own typefaces. */
export const fontFace = ( family, file, { weight = '100 900', style = 'normal' } = {} ) =>
	`@font-face{font-family:"${ family }";font-weight:${ weight };font-style:${ style };src:url(data:font/woff2;base64,${ fs.readFileSync( file ).toString( 'base64' ) }) format("woff2");}`;

/** The page an image is drawn on. */
export const frame = ( width, height, background, body, css = '' ) => `<!doctype html><meta charset="utf-8"><style>
	* { box-sizing: border-box; margin: 0; }
	body { width: ${ width }px; height: ${ height }px; background: ${ background }; position: relative; overflow: hidden; font-family: system-ui, sans-serif; }
	i { position: absolute; display: block; font-style: normal; }
	${ css }
</style>${ body }`;

/**
 * Render images to a folder.
 *
 * @param {string} out    Folder.
 * @param {Object} images name => [ width, height, html, quality? ].
 * @param {Object} [options]
 * @param {number} [options.quality] JPEG quality.
 * @return {Promise<number>} Bytes written.
 */
export async function render( out, images, { quality = 84 } = {} ) {
	const { chromium } = createRequire( import.meta.url )( 'playwright' );
	// The folder may also hold photographs, so nothing in it is removed.
	fs.mkdirSync( out, { recursive: true } );

	const browser = await chromium.launch();
	const page = await browser.newPage();
	let total = 0;
	for ( const [ name, [ width, height, html, own ] ] of Object.entries( images ) ) {
		await page.setViewportSize( { width, height } );
		await page.setContent( html );
		await page.evaluate( () => document.fonts.ready );
		const file = path.join( out, name + '.jpg' );
		await page.screenshot( { path: file, type: 'jpeg', quality: own || quality } );
		const bytes = fs.statSync( file ).size;
		total += bytes;
		if ( bytes > 100 * 1024 ) {
			console.warn( `${ name }.jpg is ${ Math.round( bytes / 1024 ) } KB, over the 100 KB budget of one image.` );
		}
	}
	await browser.close();
	return total;
}
