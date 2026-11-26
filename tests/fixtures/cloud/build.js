#!/usr/bin/env node
/**
 * Builds the mock library from sites.js:
 *
 *   v1/catalog.json                     the catalog, with {{BASE}} where the server address goes
 *   v1/previews/<site>/thumbnail.png    a placeholder preview per site
 *
 * The previews say "Preview coming soon" on purpose: the designs do not exist
 * yet. Usage: node tests/fixtures/cloud/build.js   (needs Playwright)
 */
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { chromium } = require( 'playwright' );
const source = require( './sites' );

const out = path.join( __dirname, 'v1' );

const cover = ( site ) => {
	const [ background, accent, text ] = site.colors;
	return `<!doctype html><meta charset="utf-8"><style>
		* { box-sizing: border-box; margin: 0; }
		body { width: 1200px; height: 900px; background: ${ background }; color: ${ text }; font: 500 28px/1.3 system-ui, sans-serif; padding: 72px; display: flex; flex-direction: column; }
		.bar { display: flex; align-items: center; gap: 28px; opacity: .85; }
		.logo { width: 44px; height: 44px; border-radius: 10px; background: ${ accent }; }
		.nav { display: flex; gap: 22px; margin-left: auto; }
		.nav i { display: block; width: 84px; height: 12px; border-radius: 6px; background: currentColor; opacity: .35; }
		h1 { font-size: 104px; line-height: 1; letter-spacing: -0.03em; margin-top: auto; }
		p { margin-top: 28px; font-size: 34px; opacity: .8; }
		.tag { display: inline-block; margin-top: 44px; padding: 14px 26px; border-radius: 999px; background: ${ accent }; color: ${ background }; font-weight: 700; align-self: flex-start; }
	</style><div class="bar"><span class="logo"></span><div class="nav"><i></i><i></i><i></i><i></i></div></div>
	<h1>${ site.name }</h1><p>${ site.pages.length } pages</p><span class="tag">Preview coming soon</span>`;
};

( async () => {
	const browser = await chromium.launch();
	const page = await browser.newPage( { viewport: { width: 1200, height: 900 } } );

	const sites = [];
	for ( const site of source.sites ) {
		const dir = path.join( out, 'previews', site.id );
		fs.mkdirSync( dir, { recursive: true } );
		await page.setContent( cover( site ) );
		await page.screenshot( { path: path.join( dir, 'thumbnail.png' ) } );

		sites.push( {
			id: site.id,
			name: site.name,
			summary: site.summary,
			category: site.category,
			tags: site.tags,
			tier: site.tier,
			status: 'coming_soon',
			version: '1.0.0',
			preview: { thumbnail: `{{BASE}}/previews/${ site.id }/thumbnail.png`, screenshots: [], demo_url: '' },
			pages: site.pages,
			requires: { format: 1, wordpress: '6.8', php: '7.4', theme: '1.1.0', importer: '1.0.0', plugins: site.plugins },
			editable: site.editable,
		} );
	}
	await browser.close();

	const catalog = { format: 1, generated: '2026-11-26T00:00:00Z', categories: source.categories, sites };
	fs.writeFileSync( path.join( out, 'catalog.json' ), JSON.stringify( catalog, null, '\t' ) + '\n' );
	console.log( `Wrote ${ sites.length } sites to ${ path.relative( process.cwd(), out ) }` );
} )();
