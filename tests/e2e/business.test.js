/**
 * Browser checks for the Business starter site ("Halden Advisory").
 *
 *   bash tests/env/setup.sh
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * The design is imported from the mock library exactly as a site owner would
 * get it, looked at as a visitor at every supported width, opened in the
 * Elementor editor, and rolled back again.
 */
const { test, before, after } = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const { chromium } = require( 'playwright' );
const { BASE, WIDTHS, state, cloud, axe, themeErrors, clearErrorLog, login } = require( './helpers' );

/** Every address the design creates, with the one heading a visitor should find there. */
const PAGES = [
	{ path: '/', h1: 'Clear decisions for companies that have outgrown guesswork' },
	{ path: '/about/' },
	{ path: '/services/' },
	{ path: '/strategy/' },
	{ path: '/projects/' },
	{ path: '/harbor-freight-lines/' },
	{ path: '/team/' },
	{ path: '/pricing/' },
	{ path: '/contact/' },
	{ path: '/insights/', h1: 'Insights' },
	{ path: '/cost-to-serve/', post: true },
	{ path: '/a-page-that-does-not-exist/', status: 404 },
];

let browser;
let report;
let ids;

/** A visitor: not logged in, with a note of everything that goes wrong. */
async function visitor( width ) {
	const context = await browser.newContext( { viewport: { width, height: 900 } } );
	const page = await context.newPage();
	const problems = [];
	const external = [];
	page.on( 'pageerror', ( error ) => problems.push( error.message ) );
	page.on( 'console', ( message ) => {
		if ( message.type() === 'error' && ! /Failed to load resource: the server responded with a status of 404/.test( message.text() ) ) {
			problems.push( message.text() );
		}
	} );
	page.on( 'request', ( request ) => {
		const url = new URL( request.url() );
		if ( /^https?:$/.test( url.protocol ) && url.hostname !== 'localhost' ) {
			external.push( url.hostname );
		}
	} );
	return { context, page, problems, external };
}

/** Scroll through the page so that lazy images and entrance effects run. */
function scrollThrough( page ) {
	return page.evaluate( async () => {
		for ( let y = 0; y < document.documentElement.scrollHeight; y += 600 ) {
			window.scrollTo( 0, y );
			await new Promise( ( resolve ) => setTimeout( resolve, 60 ) );
		}
		await Promise.all( [ ...document.images ].map( ( image ) => image.decode().catch( () => {} ) ) );
		window.scrollTo( 0, 0 );
	} );
}

before( async () => {
	browser = await chromium.launch();
	clearErrorLog();
	cloud( 'ok' );
	state( 'ofss:rollback', 'reset', 'ofss:clear', 'ofss:forget', 'theme:open-frame', 'plugin:starter-sites=on', 'plugin:elementor=on', 'plugin:elementor-pro=off', 'plugin:woocommerce=off' );
	report = JSON.parse( state( 'ofss:import=business' ).trim().split( '\n' ).pop() );
	ids = JSON.parse( state( 'ofss:ids' ).trim().split( '\n' ).pop() );
} );

after( async () => {
	state( 'ofss:rollback', 'ofss:clear', 'ofss:forget', 'reset' );
	await browser.close();
} );

test( 'Business imports completely, with free Elementor only', () => {
	assert.equal( report.status, 'done', report.error || '' );
	assert.deepEqual( report.warnings, [] );
	assert.deepEqual( report.counts, { pages: 10, posts: 3, images: 15, reused: 0, menus: 1 } );
	for ( const name of [ 'home', 'about', 'services', 'service-details', 'projects', 'project-details', 'team', 'pricing', 'contact', 'insights' ] ) {
		assert.ok( ids[ `business:pages:${ name }` ], `page ${ name } exists` );
	}
	for ( const name of [ 'header', 'footer', 'not-found' ] ) {
		assert.ok( ids[ `business:site-parts:${ name }` ], `site part ${ name } exists` );
	}
} );

test( 'Business: every page fits every width, loads its images and asks no other site for anything', async () => {
	for ( const width of WIDTHS ) {
		const { context, page, problems, external } = await visitor( width );
		for ( const item of PAGES ) {
			const response = await page.goto( BASE + item.path, { waitUntil: 'load' } );
			const where = `${ item.path } at ${ width }`;
			assert.equal( response.status(), item.status || 200, where );
			await scrollThrough( page );

			const found = await page.evaluate( () => ( {
				overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
				h1: [ ...document.querySelectorAll( 'h1' ) ].map( ( heading ) => heading.textContent.trim() ),
				mains: document.querySelectorAll( 'main' ).length,
				target: !! document.querySelector( 'main#main' ),
				header: document.querySelectorAll( 'header.of-site-part--header' ).length,
				footer: document.querySelectorAll( '.of-site-part--footer' ).length,
				themeChrome: document.querySelectorAll( '#masthead, #colophon' ).length,
				broken: [ ...document.images ].filter( ( image ) => ! image.naturalWidth ).map( ( image ) => image.currentSrc || image.src ),
				noAlt: [ ...document.images ].filter( ( image ) => ! image.hasAttribute( 'alt' ) ).length,
				leftovers: document.documentElement.innerHTML.includes( 'ofss://' ),
				headingFont: getComputedStyle( document.querySelector( 'h1' ) ).fontFamily.split( ',' )[ 0 ].replace( /"/g, '' ),
				bodyFont: getComputedStyle( document.body ).fontFamily.split( ',' )[ 0 ].replace( /"/g, '' ),
				small: [ ...document.querySelectorAll( 'main p, main li, footer a, footer p' ) ].filter( ( node ) => node.offsetParent && parseFloat( getComputedStyle( node ).fontSize ) < 13 ).length,
			} ) );

			assert.equal( found.overflow, 0, `${ where }: nothing wider than the screen` );
			assert.equal( found.h1.length, 1, `${ where }: one main heading (${ found.h1.join( ' | ' ) })` );
			if ( item.h1 ) {
				assert.equal( found.h1[ 0 ], item.h1, where );
			}
			assert.equal( found.mains, 1, `${ where }: one main area` );
			assert.ok( found.target, `${ where }: the skip link has its target` );
			assert.equal( found.header, 1, `${ where }: the header of the design` );
			assert.equal( found.footer, 1, `${ where }: the footer of the design` );
			assert.equal( found.themeChrome, 0, `${ where }: not the header or footer of the theme` );
			assert.deepEqual( found.broken, [], `${ where }: every image loads` );
			assert.equal( found.noAlt, 0, `${ where }: every image has an alt attribute` );
			assert.ok( ! found.leftovers, `${ where }: no unresolved reference` );
			assert.equal( found.headingFont, 'Hanken Grotesk', where );
			assert.equal( found.bodyFont, 'Hanken Grotesk', where );
			assert.equal( found.small, 0, `${ where }: no running text under 13px` );
		}
		assert.deepEqual( problems, [], `script errors at ${ width }` );
		assert.deepEqual( [ ...new Set( external ) ], [], `requests to other sites at ${ width }` );
		await context.close();
	}
} );

test( 'Business: the menu works on a phone and with a keyboard', async () => {
	const { context, page, problems } = await visitor( 390 );
	await page.goto( BASE + '/' );
	const toggle = page.locator( 'header.of-site-part--header .menu-toggle' );
	const menu = page.locator( '#primary-menu' );
	assert.ok( await toggle.isVisible(), 'the menu button shows on a phone' );
	assert.ok( ! ( await menu.isVisible() ), 'the menu starts closed' );

	const size = await toggle.boundingBox();
	assert.ok( size.width >= 44 && size.height >= 44, `the button is large enough to tap (${ size.width }x${ size.height })` );

	await toggle.click();
	assert.equal( await toggle.getAttribute( 'aria-expanded' ), 'true' );
	assert.ok( await menu.isVisible() );
	assert.deepEqual( await menu.locator( ':scope > li > a' ).allTextContents(), [ 'About', 'Services', 'Projects', 'Pricing', 'Insights', 'Contact' ] );
	const inside = await menu.evaluate( ( list ) => {
		const rect = list.getBoundingClientRect();
		return rect.left >= 0 && rect.right <= document.documentElement.clientWidth;
	} );
	assert.ok( inside, 'the open menu stays on the screen' );

	await page.keyboard.press( 'Escape' );
	assert.equal( await toggle.getAttribute( 'aria-expanded' ), 'false', 'Escape closes it' );

	await toggle.click();
	await Promise.all( [ page.waitForURL( BASE + '/pricing/' ), menu.getByRole( 'link', { name: 'Pricing' } ).click() ] );
	assert.equal( await page.locator( '#primary-menu .current-menu-item > a' ).textContent(), 'Pricing', 'the current page is marked' );

	// On a desktop the menu is a row and the button is gone.
	await page.setViewportSize( { width: 1440, height: 900 } );
	await page.goto( BASE + '/' );
	assert.ok( ! ( await toggle.isVisible() ) );
	assert.ok( await menu.isVisible() );
	await page.keyboard.press( 'Tab' );
	assert.equal( await page.evaluate( () => document.activeElement.className ), 'skip-link screen-reader-text', 'the skip link comes first' );
	assert.deepEqual( problems, [] );
	await context.close();
} );

test( 'Business: every link inside the site leads somewhere', async () => {
	const { context, page } = await visitor( 1440 );
	const links = new Map();
	for ( const item of PAGES ) {
		await page.goto( BASE + item.path );
		const found = await page.evaluate( () => [ ...document.querySelectorAll( 'a[href]' ) ].map( ( anchor ) => ( { href: anchor.href, raw: anchor.getAttribute( 'href' ), text: anchor.textContent.trim().slice( 0, 40 ) } ) ) );
		for ( const link of found ) {
			assert.ok( link.raw && link.raw !== '#', `${ item.path }: "${ link.text }" has a real target` );
			if ( link.raw.startsWith( '#' ) ) {
				// A link within the page, such as the skip link.
				assert.equal( await page.locator( link.raw ).count(), 1, `${ item.path }: "${ link.text }" has its target on the page` );
			} else if ( link.href.startsWith( BASE ) && ! links.has( link.href.split( '#' )[ 0 ] ) ) {
				links.set( link.href.split( '#' )[ 0 ], `${ item.path } "${ link.text }"` );
			} else if ( ! link.href.startsWith( BASE ) ) {
				assert.match( link.href, /^(mailto:|tel:)/, `${ item.path }: "${ link.text }" does not leave the site` );
			}
		}
	}
	assert.ok( links.size >= 15, `found ${ links.size } different links` );
	for ( const [ url, from ] of links ) {
		const response = await page.request.get( url, { maxRedirects: 0 } );
		assert.equal( response.status(), 200, `${ url } (linked from ${ from })` );
	}
	await context.close();
} );

test( 'Business: the blog shows the three articles, each with its picture', async () => {
	const { context, page, problems } = await visitor( 1440 );
	await page.goto( BASE + '/insights/' );
	assert.ok( await page.locator( 'h1.page-title' ).isVisible(), 'the page has a visible title' );
	const titles = ( await page.locator( 'article .entry-title' ).allTextContents() ).map( ( title ) => title.trim() );
	for ( const title of [ 'Your best customer may be your least profitable', 'If the strategy does not fit on a page, nobody will use it', 'Cancel a third of your recurring meetings and see what breaks' ] ) {
		assert.ok( titles.includes( title ), title );
	}
	assert.equal( await page.locator( 'article img.wp-post-image' ).count(), 3 );
	assert.equal( ( await page.request.get( BASE + '/category/finance/' ) ).status(), 200, 'articles are filed under their categories' );
	const columns = await page.locator( 'article' ).evaluateAll( ( articles ) => new Set( articles.map( ( article ) => Math.round( article.getBoundingClientRect().left ) ) ).size );
	assert.equal( columns, 3, 'three columns on a desktop' );

	await Promise.all( [ page.waitForURL( BASE + '/cost-to-serve/' ), page.getByRole( 'link', { name: 'Your best customer may be your least profitable' } ).first().click() ] );
	assert.equal( await page.locator( 'h1' ).textContent().then( ( text ) => text.trim() ), 'Your best customer may be your least profitable' );
	assert.ok( await page.locator( '.entry-content p' ).count() >= 4, 'the article has its text' );
	assert.ok( await page.locator( '.entry-content h2' ).count() >= 2, 'and its subheadings' );
	assert.deepEqual( problems, [] );
	await context.close();
} );

test( 'Business: the "not found" page of the design helps the visitor on', async () => {
	const { context, page } = await visitor( 1440 );
	const response = await page.goto( BASE + '/a-page-that-does-not-exist/' );
	assert.equal( response.status(), 404 );
	assert.equal( await page.locator( 'h1' ).textContent().then( ( text ) => text.trim() ), 'This page has moved, or never existed' );
	await Promise.all( [ page.waitForURL( BASE + '/' ), page.locator( 'main' ).getByRole( 'link', { name: 'Back to the home page' } ).click() ] );
	await context.close();
} );

test( 'Business: pages pass the automated accessibility checks', async () => {
	for ( const width of [ 390, 1440 ] ) {
		const { context, page } = await visitor( width );
		for ( const item of PAGES ) {
			await page.goto( BASE + item.path );
			await scrollThrough( page );
			// Counters run for a moment; wait until they show their final numbers.
			await page.waitForTimeout( 1500 );
			assert.deepEqual( await axe( page, 'body' ), [], `${ item.path } at ${ width }` );
		}
		await context.close();
	}
} );

test( 'Business: colors and fonts come from Elementor Site Settings', async () => {
	const { context, page } = await visitor( 1440 );
	await page.goto( BASE + '/' );
	const kit = await page.evaluate( () => {
		const styles = getComputedStyle( document.body );
		const read = ( name ) => styles.getPropertyValue( name ).trim().toUpperCase();
		return {
			primary: read( '--e-global-color-primary' ),
			secondary: read( '--e-global-color-secondary' ),
			text: read( '--e-global-color-text' ),
			accent: read( '--e-global-color-accent' ),
			follows: document.body.classList.contains( 'of-follow-elementor' ),
			button: getComputedStyle( document.querySelector( 'main .elementor-button' ) ).backgroundColor,
			heading: getComputedStyle( document.querySelector( 'main h2.elementor-heading-title' ) ).color,
		};
	} );
	assert.deepEqual( kit, {
		primary: '#2456E6',
		secondary: '#0B1F3A',
		text: '#46546A',
		accent: '#F2A93B',
		follows: true,
		button: 'rgb(36, 86, 230)',
		heading: 'rgb(11, 31, 58)',
	} );

	// The blog is drawn by the theme, and follows the same settings.
	await page.goto( BASE + '/insights/' );
	const blog = await page.evaluate( () => ( {
		title: getComputedStyle( document.querySelector( 'article .entry-title a' ) ).color,
		text: getComputedStyle( document.querySelector( 'article .entry-summary, article .entry-content' ) ).color,
	} ) );
	assert.deepEqual( blog, { title: 'rgb(11, 31, 58)', text: 'rgb(70, 84, 106)' } );
	await context.close();
} );

test( 'Business: the home page, the header and the footer open in the Elementor editor', async () => {
	const context = await browser.newContext( { viewport: { width: 1440, height: 1000 } } );
	const page = await context.newPage();
	const problems = [];
	page.on( 'pageerror', ( error ) => problems.push( error.message ) );
	await login( page );

	const parts = [
		[ 'business:pages:home', 'Clear decisions for companies that have outgrown guesswork' ],
		[ 'business:site-parts:header', 'Halden' ],
		[ 'business:site-parts:footer', 'Halden Advisory' ],
	];
	for ( const [ uid, text ] of parts ) {
		await page.goto( `${ BASE }/wp-admin/post.php?post=${ ids[ uid ] }&action=elementor` );
		const frame = page.frameLocator( '#elementor-preview-iframe' );
		const area = frame.locator( 'body.elementor-editor-active .elementor-edit-area' ).first();
		await area.waitFor( { timeout: 90000 } );
		await frame.locator( '.elementor-edit-area .elementor-widget' ).first().waitFor( { timeout: 60000 } );
		assert.ok( ( await area.textContent() ).includes( text ), `${ uid }: its content is in the editable area` );
		assert.equal( await frame.locator( '.elementor-edit-area .elementor-widget-empty, .elementor-edit-area .elementor-widget-unknown' ).count(), 0, `${ uid }: every widget is known to free Elementor` );
		assert.equal( await page.locator( '#elementor-fatal-error-dialog, .elementor-preview-loading-error' ).count(), 0, `${ uid }: no editor error` );
	}
	assert.deepEqual( problems, [], 'script errors in the editor' );
	await context.close();
} );

test( 'Business: rolling back returns the site to what it was, without PHP errors', async () => {
	state( 'ofss:rollback' );
	const { context, page } = await visitor( 1440 );
	await page.goto( BASE + '/' );
	assert.equal( await page.locator( '#masthead' ).count(), 1, 'the theme header is back' );
	assert.equal( await page.getByText( 'Halden' ).count(), 0, 'nothing of the design is left on the home page' );
	assert.equal( ( await page.goto( BASE + '/pricing/' ) ).status(), 404 );
	assert.equal( ( await page.goto( BASE + '/category/finance/' ) ).status(), 404, 'the categories of the articles are gone too' );
	assert.deepEqual( JSON.parse( state( 'ofss:ids' ).trim().split( '\n' ).pop() ), [] );
	await context.close();
	assert.deepEqual( themeErrors(), [] );
} );
