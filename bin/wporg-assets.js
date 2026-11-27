#!/usr/bin/env node
/**
 * Draws the banner and the icon of the Starter Sites plugin's page in the
 * WordPress.org directory, in the sizes the directory asks for:
 *
 *   banner-1544x500.png, banner-772x250.png
 *   icon-256x256.png, icon-128x128.png, icon.svg
 *
 * They are written to companion/open-frame-starter-sites/.wordpress-org/,
 * which is left out of the plugin ZIP: after the plugin is accepted, these
 * files go into the "assets" folder of its Subversion repository.
 *
 * The banner shows the home pages of nine designs, taken from their preview
 * pictures in starter-sites/, so run this again when a design changes.
 *
 * Development tool only (not part of the distributed theme or plugin).
 * Usage: node bin/wporg-assets.js      Needs Playwright (cd tests && npm install).
 */
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const { chromium } = require( 'playwright' );

const root = path.resolve( __dirname, '..' );
const out = path.join( root, 'companion/open-frame-starter-sites/.wordpress-org' );
const font = ( name ) => 'file://' + path.join( root, 'assets/fonts', name );
const thumb = ( site ) => 'file://' + path.join( root, 'starter-sites', site, 'preview/thumbnail.png' );

// The mark of the theme, with a second frame behind it: more than one site.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
	<defs>
		<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#4f5be6"/>
			<stop offset="1" stop-color="#2b36b8"/>
		</linearGradient>
	</defs>
	<rect width="256" height="256" rx="56" fill="url(#bg)"/>
	<rect x="46" y="46" width="124" height="124" rx="22" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="16"/>
	<rect x="78" y="78" width="132" height="132" rx="24" fill="#2f3bc4"/>
	<rect x="78" y="78" width="132" height="132" rx="24" fill="none" stroke="#ffffff" stroke-width="16"/>
	<rect x="122" y="122" width="88" height="88" rx="14" fill="#f5a623"/>
</svg>
`;

// Three columns of home pages, each set a little lower or higher than its neighbour.
const columns = [ [ 'portfolio', 'business', 'restaurant' ], [ 'agency', 'education', 'saas' ], [ 'shop', 'magazine', 'medical' ] ];

const banner = ( scale ) => `<!doctype html><meta charset="utf-8"><style>
	@font-face { font-family: "Hanken Grotesk"; font-weight: 100 900; src: url("${ font( 'hanken-grotesk-latin-wght-normal.woff2' ) }") format("woff2"); }
	@font-face { font-family: "JetBrains Mono"; font-weight: 100 800; src: url("${ font( 'jetbrains-mono-latin-wght-normal.woff2' ) }") format("woff2"); }
	* { box-sizing: border-box; }
	html { zoom: ${ scale }; }
	body { margin: 0; width: 1544px; height: 500px; overflow: hidden; position: relative; color: #fff; font-family: "Hanken Grotesk", sans-serif; -webkit-font-smoothing: antialiased;
		background: radial-gradient(520px 420px at 0% 110%, #19b3a6 0%, rgba(25,179,166,0) 70%), radial-gradient(700px 500px at 62% -20%, #5a66ea 0%, rgba(90,102,234,0) 70%), linear-gradient(120deg, #2a35b6 0%, #3f4cd6 55%, #2b36b8 100%); }
	.ring { position: absolute; left: -150px; top: -230px; width: 460px; height: 460px; border-radius: 50%; border: 44px solid rgba(255,255,255,.07); }
	.copy { position: absolute; left: 84px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; }
	.brand { display: flex; align-items: center; gap: 16px; font-size: 27px; font-weight: 700; letter-spacing: -0.01em; }
	.brand svg { width: 46px; height: 46px; border-radius: 11px; box-shadow: 0 6px 18px rgba(8,12,60,.35); }
	.eyebrow { margin: 34px 0 12px; font: 500 15px/1 "JetBrains Mono", monospace; letter-spacing: 0.2em; text-transform: uppercase; color: #9fe8df; }
	h1 { margin: 0; font-size: 62px; line-height: 1.04; font-weight: 800; letter-spacing: -0.025em; }
	p { margin: 20px 0 0; font-size: 22px; line-height: 1.4; color: rgba(255,255,255,.86); max-width: 560px; }
	.wall { position: absolute; left: 770px; top: -236px; display: flex; gap: 24px; transform: rotate(-7deg); transform-origin: 0 0; }
	.col { display: flex; flex-direction: column; gap: 24px; }
	.col:nth-child(2) { margin-top: 84px; }
	.col:nth-child(3) { margin-top: 150px; }
	.card { width: 300px; height: 225px; border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 24px 50px rgba(8,12,60,.45), 0 0 0 1px rgba(255,255,255,.14); }
	.card img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; }
</style>
<div class="ring"></div>
<div class="copy">
	<div class="brand">${ icon.replace( /\n\s*/g, '' ) }<span>Open Frame Starter Sites</span></div>
	<div class="eyebrow">For the Open Frame theme</div>
	<h1>Ten complete websites, ready to import</h1>
	<p>Made with Elementor. Preview, import, edit everything, roll back if you change your mind.</p>
</div>
<div class="wall">${ columns.map( ( sites ) => `<div class="col">${ sites.map( ( site ) => `<div class="card"><img src="${ thumb( site ) }" alt=""></div>` ).join( '' ) }</div>` ).join( '' ) }</div>`;

( async () => {
	fs.mkdirSync( out, { recursive: true } );
	fs.writeFileSync( path.join( out, 'icon.svg' ), icon );

	const browser = await chromium.launch();
	const work = fs.mkdtempSync( path.join( os.tmpdir(), 'open-frame-wporg-' ) );

	for ( const [ width, height, scale ] of [ [ 1544, 500, 1 ], [ 772, 250, 0.5 ] ] ) {
		const file = path.join( work, `banner-${ width }.html` );
		fs.writeFileSync( file, banner( scale ) );
		const page = await ( await browser.newContext( { viewport: { width, height }, deviceScaleFactor: 1 } ) ).newPage();
		await page.goto( 'file://' + file, { waitUntil: 'networkidle' } );
		await page.evaluate( () => document.fonts.ready );
		await page.screenshot( { path: path.join( out, `banner-${ width }x${ height }.png` ), clip: { x: 0, y: 0, width, height } } );
		await page.context().close();
		console.log( `banner-${ width }x${ height }.png` );
	}

	for ( const size of [ 256, 128 ] ) {
		const file = path.join( work, `icon-${ size }.html` );
		fs.writeFileSync( file, `<!doctype html><style>html, body { margin: 0; background: transparent; } svg { display: block; width: ${ size }px; height: ${ size }px; }</style>${ icon }` );
		const page = await ( await browser.newContext( { viewport: { width: size, height: size }, deviceScaleFactor: 1 } ) ).newPage();
		await page.goto( 'file://' + file );
		await page.screenshot( { path: path.join( out, `icon-${ size }x${ size }.png` ), omitBackground: true } );
		await page.context().close();
		console.log( `icon-${ size }x${ size }.png` );
	}

	fs.rmSync( work, { recursive: true, force: true } );
	await browser.close();
} )().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
