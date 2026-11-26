#!/usr/bin/env node
/**
 * Takes the preview images of a starter site from a WordPress site that has
 * the design imported.
 *
 *   node tools/sites/previews.mjs <site> <base-url> <file>=<path> [<file>=<path> …]
 *   node tools/sites/previews.mjs business http://localhost:8890 thumbnail=/ services=/services/
 *
 * Each image is the top 1200 x 900 pixels of the page, the size the library
 * expects, written to starter-sites/<site>/preview/<file>.png.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = createRequire( import.meta.url )( 'playwright' );
const [ site, base, ...shots ] = process.argv.slice( 2 );
const out = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', site, 'preview' );

const browser = await chromium.launch();
const page = await browser.newPage( { viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 } );
for ( const shot of shots ) {
	const [ file, url ] = shot.split( '=' );
	await page.goto( base + url, { waitUntil: 'networkidle' } );
	await page.screenshot( { path: path.join( out, file + '.png' ) } );
	console.log( `${ file }.png ${ Math.round( fs.statSync( path.join( out, file + '.png' ) ).size / 1024 ) } KB` );
}
await browser.close();
