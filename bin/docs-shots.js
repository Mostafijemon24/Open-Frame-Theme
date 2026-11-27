#!/usr/bin/env node
/**
 * Takes the screenshots of the Starter Sites guide (docs/STARTER-SITES.md) and
 * of the Elementor and WooCommerce chapters of the theme guide, with the red
 * numbered markers the guides use.
 *
 * Development tool only (not part of the distributed theme or plugin).
 *
 *   node bin/docs-shots.js <base-url> [<name> …]
 *
 * The site at <base-url> is a test site built by tests/env/setup.sh, with the
 * user "admin" / "password", Elementor installed, and the library the plugin
 * is pointed at serving the ten designs. Without names every picture of the
 * Starter Sites guide is taken; with names only those. The two pictures of
 * the theme guide, "elementor-page-layout" and "woocommerce-shop", are taken
 * only when named, because they need the site in another state (see below).
 * Pictures are written to docs/images/.
 * Needs Playwright (cd tests && npm install).
 */
const fs = require( 'node:fs' );
const os = require( 'node:os' );
const path = require( 'node:path' );
const { chromium } = require( 'playwright' );

const [ BASE, ...only ] = process.argv.slice( 2 );
// DOCS_OUT writes somewhere else, and DOCS_MARKS=no leaves the markers out: together they give
// the pictures for the plugin's page in the WordPress.org directory (see docs/dev/RELEASE.md).
const OUT = process.env.DOCS_OUT ? path.resolve( process.env.DOCS_OUT ) : path.resolve( __dirname, '../docs/images' );
const MARKS = process.env.DOCS_MARKS !== 'no';
const SCREEN = BASE + '/wp-admin/themes.php?page=open-frame-starter-sites';

/** Things in the WordPress admin that belong to the test site, not to the guide. */
const TIDY = `
	#wp-admin-bar-sqlite-db-integration, .e-notice, .notice.e-notice, #wpfooter, .update-nag, .woocommerce-message, .woocommerce-layout__activity-panel-wrapper { display: none !important; }
	html { scroll-behavior: auto !important; }
`;

/**
 * Draw a red frame with a numbered badge around elements of the page.
 *
 * @param {import('playwright').Page} page
 * @param {Array<[string, number, string?]>} marks Selector, number, and the corner of the badge (tl, tr, bl, br; default tl).
 */
async function mark( page, marks ) {
	if ( ! MARKS ) {
		return;
	}
	for ( const [ selector, number, corner = 'tl' ] of marks ) {
		const box = await page.locator( selector ).first().boundingBox();
		if ( ! box ) {
			throw new Error( `Nothing to mark for "${ selector }"` );
		}
		await page.evaluate( ( [ rect, n, where ] ) => {
			const pad = 5;
			const frame = document.createElement( 'div' );
			frame.className = 'docs-mark';
			Object.assign( frame.style, {
				position: 'fixed', zIndex: 2147483646, pointerEvents: 'none', boxSizing: 'border-box',
				left: rect.x - pad + 'px', top: rect.y - pad + 'px', width: rect.width + pad * 2 + 'px', height: rect.height + pad * 2 + 'px',
				border: '2px solid #e11d48', borderRadius: '8px', boxShadow: '0 0 0 2px #fff, inset 0 0 0 1px #fff',
			} );
			const badge = document.createElement( 'div' );
			badge.className = 'docs-mark';
			badge.textContent = n;
			const x = where.includes( 'r' ) ? rect.x + rect.width + pad - 11 : rect.x - pad - 11;
			const y = where.includes( 'b' ) ? rect.y + rect.height + pad - 11 : rect.y - pad - 11;
			Object.assign( badge.style, {
				position: 'fixed', zIndex: 2147483647, pointerEvents: 'none', left: x + 'px', top: y + 'px', width: '22px', height: '22px',
				borderRadius: '50%', background: '#e11d48', color: '#fff', border: '2px solid #fff', boxShadow: '0 1px 4px rgba(15,23,42,.35)',
				font: '700 12px/18px -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', textAlign: 'center', boxSizing: 'content-box',
			} );
			document.body.append( frame, badge );
		}, [ box, number, corner ] );
	}
}

const unmark = ( page ) => page.evaluate( () => document.querySelectorAll( '.docs-mark' ).forEach( ( element ) => element.remove() ) );

async function shoot( page, name, marks = [], options = {} ) {
	await page.addStyleTag( { content: TIDY } ).catch( () => {} );
	await mark( page, marks );
	await page.screenshot( { path: path.join( OUT, name + '.png' ), ...options } );
	await unmark( page );
	console.log( name + '.png' );
}

/**
 * A picture of the open dialog alone. The window is made tall first, so that the
 * dialog shows all it has without scrolling and every marker lands on what it names.
 */
async function shootDialog( page, name, marks = [], height = 0 ) {
	await page.setViewportSize( { width: 1200, height: 1500 } );
	await page.waitForTimeout( 400 );
	await page.locator( '[role="dialog"] .components-modal__content' ).evaluate( ( element ) => ( element.scrollTop = 0 ) ).catch( () => {} );
	const box = await page.locator( '.components-modal__frame' ).first().boundingBox();
	// With a height, only the upper part of the dialog is kept.
	const clip = { x: Math.max( 0, box.x - 28 ), y: Math.max( 0, box.y - 28 ), width: Math.min( 1200, box.width + 56 ), height: height ? Math.min( height, box.height + 28 ) : box.height + 56 };
	await shoot( page, name, marks, { clip } );
	await page.setViewportSize( { width: 1200, height: 800 } );
}

const wanted = ( name ) => ! only.length || only.includes( name );

( async () => {
	const browser = await chromium.launch();
	const context = await browser.newContext( { viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 } );
	const page = await context.newPage();

	await page.goto( BASE + '/wp-login.php' );
	await page.fill( '#user_login', 'admin' );
	await page.fill( '#user_pass', 'password' );
	await Promise.all( [ page.waitForURL( /wp-admin/, { waitUntil: 'domcontentloaded' } ), page.click( '#wp-submit' ) ] );

	const dialog = () => page.getByRole( 'dialog' );
	const openScreen = async () => {
		await page.goto( SCREEN );
		await page.waitForSelector( '.ofss-grid' );
		await page.waitForLoadState( 'networkidle' );
	};
	const openDetails = async ( name ) => {
		await page.getByRole( 'button', { name: 'View details: ' + name, exact: true } ).click();
		await dialog().locator( '.ofss-checks' ).waitFor();
		await page.waitForTimeout( 500 );
	};

	/* ------------------------------------------------------------------ The Starter Sites screen */

	if ( wanted( 'starter-sites-screen' ) ) {
		await openScreen();
		await shoot( page, 'starter-sites-screen', [
			[ '#adminmenu .wp-submenu li.current a', 1, 'tr' ],
			[ '.ofss-toolbar__search', 2 ],
			[ '.ofss-toolbar__select >> nth=0', 3 ],
			[ '.ofss-toolbar__select >> nth=1', 4 ],
			[ '.ofss-card >> nth=0', 5 ],
			[ '.ofss-card >> nth=1 >> .ofss-badges', 6, 'tr' ],
			[ '.ofss-toolbar__refresh button', 7, 'tr' ],
		] );
	}

	if ( wanted( 'starter-sites-details' ) ) {
		await openScreen();
		await openDetails( 'Business' );
		await shootDialog( page, 'starter-sites-details', [
			[ '[role="dialog"] .ofss-details__shots', 1, 'bl' ],
			[ '[role="dialog"] .ofss-details__state', 2 ],
			[ '[role="dialog"] .ofss-checks', 3, 'tr' ],
			[ '[role="dialog"] .ofss-check__action button', 4, 'bl' ],
			[ '[role="dialog"] .ofss-pages', 5 ],
			[ '[role="dialog"] .ofss-editable', 6 ],
		] );
		// Further down in the same dialog.
		await dialog().getByRole( 'button', { name: 'Activate' } ).click();
		await dialog().getByRole( 'button', { name: 'Import this design' } ).waitFor( { timeout: 120000 } );
		await dialog().getByRole( 'button', { name: 'Import this design' } ).scrollIntoViewIfNeeded();
		await page.waitForTimeout( 300 );
		await shootDialog( page, 'starter-sites-ready', [
			[ '[role="dialog"] .ofss-details__state', 1 ],
			[ '[role="dialog"] button:has-text("Import this design")', 2, 'tr' ],
		], 560 );

		await dialog().getByRole( 'button', { name: 'Import this design' } ).click();
		const confirm = dialog().getByRole( 'group', { name: 'Confirm the import' } );
		await confirm.waitFor();
		await confirm.scrollIntoViewIfNeeded();
		await shootDialog( page, 'starter-sites-confirm', [
			[ '[role="dialog"] .ofss-import__changes', 1 ],
			[ '[role="dialog"] .ofss-import__agree', 2 ],
			[ '[role="dialog"] button:has-text("Start the import")', 3, 'tr' ],
		], 720 );

		await confirm.getByRole( 'checkbox' ).check();
		await confirm.getByRole( 'button', { name: 'Start the import' } ).click();
		await dialog().getByRole( 'progressbar', { name: 'Import progress' } ).waitFor();
		// Part of the way in, so that the bar and the name of a step are to be seen.
		await page.waitForFunction( () => Number( document.querySelector( '.ofss-progress' )?.getAttribute( 'aria-valuenow' ) ) >= 20, null, { timeout: 120000, polling: 50 } ).catch( () => {} );
		await shootDialog( page, 'starter-sites-progress', [ [ '[role="dialog"] .ofss-progress', 1 ], [ '[role="dialog"] .ofss-progress__label', 2, 'bl' ] ], 560 ).catch( ( error ) => console.log( 'progress: ' + error.message ) );

		await dialog().getByRole( 'heading', { name: 'Imported', exact: true } ).waitFor( { timeout: 300000 } );
		await dialog().getByRole( 'heading', { name: 'Imported', exact: true } ).scrollIntoViewIfNeeded();
		await page.waitForTimeout( 300 );
		await shootDialog( page, 'starter-sites-imported', [
			[ '[role="dialog"] .components-notice.is-success', 1 ],
			[ '[role="dialog"] .ofss-import__links', 2, 'bl' ],
			[ '[role="dialog"] button:has-text("Roll back this import")', 3, 'tr' ],
		], 600 );
	}

	if ( wanted( 'starter-sites-history' ) ) {
		await openScreen();
		await page.getByRole( 'button', { name: 'Import history' } ).click();
		await page.getByRole( 'table', { name: 'Past imports, newest first' } ).waitFor();
		await shoot( page, 'starter-sites-history', [
			[ '.ofss-views button >> nth=1', 1, 'tr' ],
			[ 'table.widefat', 2 ],
		] );
	}

	if ( wanted( 'starter-sites-site-parts' ) ) {
		await page.goto( BASE + '/wp-admin/edit.php?post_type=of_site_part' );
		await page.locator( '#the-list tr' ).first().hover();
		await shoot( page, 'starter-sites-site-parts', [
			[ '#adminmenu .wp-submenu li.current a', 1, 'tr' ],
			[ '#the-list', 2 ],
		] );
	}

	if ( wanted( 'starter-sites-home' ) ) {
		const visitor = await ( await browser.newContext( { viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 } ) ).newPage();
		await visitor.goto( BASE + '/', { waitUntil: 'networkidle' } );
		await visitor.screenshot( { path: path.join( OUT, 'starter-sites-home.png' ) } );
		console.log( 'starter-sites-home.png' );
		await visitor.context().close();
	}

	if ( wanted( 'starter-sites-editor' ) ) {
		const front = await page.evaluate( async ( base ) => ( await ( await fetch( base + '/wp-json/wp/v2/settings', { headers: { 'X-WP-Nonce': window.wpApiSettings ? window.wpApiSettings.nonce : '' } } ) ).json() ).page_on_front, BASE ).catch( () => 0 );
		await page.goto( BASE + '/wp-admin/edit.php?post_type=page' );
		const edit = front
			? `${ BASE }/wp-admin/post.php?post=${ front }&action=elementor`
			: ( await page.locator( '#the-list tr:has(.post-state:has-text("Front Page")) .row-title' ).first().getAttribute( 'href' ) ).replace( 'action=edit', 'action=elementor' );
		// Elementor's editor needs more room than the other pictures.
		await page.setViewportSize( { width: 1440, height: 900 } );
		await page.goto( edit );
		await page.frameLocator( '#elementor-preview-iframe' ).locator( '.elementor-edit-area h1' ).first().waitFor( { timeout: 120000 } );
		await page.waitForLoadState( 'networkidle' ).catch( () => {} );
		await page.waitForTimeout( 2500 );
		// The Structure panel covers the page; close it, then pick the main heading so its settings show.
		await page.locator( '#elementor-navigator__close' ).click( { timeout: 5000 } ).catch( () => {} );
		await page.frameLocator( '#elementor-preview-iframe' ).locator( '.elementor-edit-area h1' ).first().click();
		await page.waitForTimeout( 1500 );
		await shoot( page, 'starter-sites-editor', [
			[ '.elementor-control-title .elementor-control-input-wrapper', 1, 'tr' ],
			[ '[aria-label="Switch Device"]', 2, 'bl' ],
			[ 'header [role="group"]:has-text("Publish")', 3, 'bl' ],
			[ 'header button:has-text("Elementor Logo")', 4, 'br' ],
		] );
		await page.setViewportSize( { width: 1200, height: 800 } );
	}

	/* ------------------------------------------------------------------ The ten designs on one sheet */

	if ( wanted( 'starter-sites-designs' ) ) {
		const sources = path.resolve( __dirname, '../starter-sites' );
		const sites = fs.readdirSync( sources )
			.filter( ( name ) => fs.existsSync( path.join( sources, name, 'site.json' ) ) )
			.map( ( name ) => ( { ...JSON.parse( fs.readFileSync( path.join( sources, name, 'site.json' ), 'utf8' ) ), dir: name } ) )
			.sort( ( a, b ) => a.order - b.order );
		const cards = sites.map( ( site ) => `<figure><img src="file://${ path.join( sources, site.dir, 'preview/thumbnail.png' ) }" alt=""><figcaption><b>${ site.name }</b><span class="${ site.tier }">${ site.tier === 'pro' ? 'Needs Elementor Pro' : 'Free' }</span></figcaption></figure>` ).join( '' );
		const sheet = path.join( os.tmpdir(), 'open-frame-designs.html' );
		fs.writeFileSync( sheet, `<!doctype html><meta charset="utf-8"><style>
			body { margin: 0; padding: 28px; background: #f1f5f9; font: 15px/1.3 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
			main { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
			figure { margin: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(15,23,42,.06); }
			img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; object-position: top; border-bottom: 1px solid #e2e8f0; }
			figcaption { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; padding: 12px 14px 14px; }
			span { padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; }
			.free { background: #dcfce7; color: #14532d; } .pro { background: #f3e8ff; color: #581c87; }
		</style><main>${ cards }</main>` );
		const sheetPage = await ( await browser.newContext( { viewport: { width: 1200, height: 560 }, deviceScaleFactor: 1 } ) ).newPage();
		await sheetPage.goto( 'file://' + sheet, { waitUntil: 'networkidle' } );
		await sheetPage.screenshot( { path: path.join( OUT, 'starter-sites-designs.png' ), fullPage: true } );
		console.log( 'starter-sites-designs.png' );
		await sheetPage.context().close();
		fs.unlinkSync( sheet );
	}

	/* ------------------------------------------------------------------ The theme guide: Elementor and WooCommerce
	 * These two need a site without an imported design, with WooCommerce active and a few products, and with an
	 * empty Elementor page whose address ends in /landing-page/. */

	if ( only.includes( 'elementor-page-layout' ) ) {
		await page.goto( BASE + '/wp-admin/edit.php?post_type=page&s=Landing+page' );
		const edit = ( await page.locator( '#the-list .row-title' ).first().getAttribute( 'href' ) ).replace( 'action=edit', 'action=elementor' );
		await page.setViewportSize( { width: 1440, height: 900 } );
		await page.goto( edit );
		await page.locator( 'header button[aria-label="Page Settings"]' ).waitFor( { timeout: 120000 } );
		await page.waitForLoadState( 'networkidle' ).catch( () => {} );
		await page.waitForTimeout( 2500 );
		await page.locator( '#elementor-navigator__close' ).click( { timeout: 5000 } ).catch( () => {} );
		await page.locator( 'header button[aria-label="Page Settings"]' ).click();
		await page.locator( '.elementor-control-template select' ).waitFor();
		await page.waitForTimeout( 800 );
		await shoot( page, 'elementor-page-layout', [
			[ 'header button[aria-label="Page Settings"]', 1, 'br' ],
			[ '.elementor-control-template .elementor-control-input-wrapper', 2, 'tr' ],
			[ '.elementor-control-hide_title .elementor-control-input-wrapper', 3, 'tr' ],
		] );
		await page.setViewportSize( { width: 1200, height: 800 } );
	}

	if ( only.includes( 'woocommerce-shop' ) ) {
		const visitor = await ( await browser.newContext( { viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 1 } ) ).newPage();
		await visitor.goto( BASE + '/shop/', { waitUntil: 'networkidle' } );
		await visitor.addStyleTag( { content: '.woocommerce-store-notice, .demo_store { display: none !important; }' } );
		await visitor.screenshot( { path: path.join( OUT, 'woocommerce-shop.png' ) } );
		console.log( 'woocommerce-shop.png' );
		await visitor.goto( BASE + '/product/ceramic-jug/', { waitUntil: 'networkidle' } );
		await visitor.screenshot( { path: path.join( OUT, 'woocommerce-product.png' ) } );
		console.log( 'woocommerce-product.png' );
		await visitor.context().close();
	}

	await browser.close();
} )().catch( ( error ) => {
	console.error( error.message );
	process.exit( 1 );
} );
