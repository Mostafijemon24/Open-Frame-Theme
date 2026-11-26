/**
 * Browser checks every starter site has to pass.
 *
 * A design's own test file (for example business.test.js) describes the
 * design: its addresses, headings, menu, fonts and colors. runDesignChecks()
 * then imports it from the mock library exactly as a site owner would get it,
 * looks at it as a visitor at every supported width, opens it in the Elementor
 * editor, and rolls it back again.
 */
const { test, before, after } = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const { chromium } = require( 'playwright' );
const { BASE, WIDTHS, state, cloud, axe, themeErrors, clearErrorLog, login, hasElementorPro } = require( './helpers' );

/**
 * @param {Object}   design
 * @param {string}   design.site          Folder name of the design.
 * @param {string}   design.name          Name shown in test titles.
 * @param {Object[]} design.pages         { path, h1?, status? } for every address the design creates.
 * @param {Object}   design.counts        What the import reports.
 * @param {string[]} design.pageNames     Names of the pages inside the package.
 * @param {string}   design.headingFont   Family of the main heading.
 * @param {string}   design.bodyFont      Family of running text.
 * @param {number}   design.fontFiles     Font files the design brings (0 when it uses the theme's).
 * @param {string[]} design.menu          Labels of the primary menu, in order.
 * @param {Object}   design.current       { label, path } of a menu item to follow.
 * @param {Object}   design.blog          { path, columns, titles, open: { title, path }, category }.
 * @param {Object}   design.notFound      { h1, button }.
 * @param {Object}   design.kit           Expected global colors and computed colors.
 * @param {Array[]}  design.editor        [ uid, text ] pairs to open in the Elementor editor.
 * @param {string}   design.gone          An address that must answer 404 after the rollback.
 * @param {string}   design.brand         A word that must not remain on the home page after the rollback.
 * @param {boolean}  [design.store]       The design has products: WooCommerce is switched on for its checks.
 * @param {boolean}  [design.pro]         A design of the Pro tier: header, footer and blog are Theme Builder
 *                                        templates, the menu is Elementor Pro's. Skipped without Elementor Pro.
 */
function runDesignChecks( design ) {
const NAME = design.name;
const PAGES = design.pages;
const PRO = Boolean( design.pro );

if ( PRO && ! hasElementorPro() ) {
	test( `${ NAME }: skipped, because Elementor Pro is not installed in the test site`, { skip: true }, () => {} );
	return;
}

// Where things are: a free design is drawn by site parts and the theme, a Pro design by Theme Builder templates.
const SEL = PRO
	? { header: 'header.elementor-location-header', footer: '.elementor-location-footer', toggle: 'header.elementor-location-header .elementor-menu-toggle', menu: 'header.elementor-location-header nav.elementor-nav-menu--dropdown', row: 'header.elementor-location-header nav.elementor-nav-menu--main', items: 'a.elementor-item', current: 'header.elementor-location-header nav.elementor-nav-menu--main a.elementor-item-active', post: 'article.elementor-post', postTitle: 'article.elementor-post .elementor-post__title', postImage: 'article.elementor-post .elementor-post__thumbnail img', postLink: 'article.elementor-post .elementor-post__title a', postText: 'article.elementor-post .elementor-post__excerpt', content: '.elementor-widget-theme-post-content' }
	: { header: 'header.of-site-part--header', footer: '.of-site-part--footer', toggle: 'header.of-site-part--header .menu-toggle', menu: '#primary-menu', row: '#primary-menu', items: ':scope > li > a', current: '#primary-menu .current-menu-item > a', post: 'article', postTitle: 'article .entry-title', postImage: 'article img.wp-post-image', postLink: 'article .entry-title a', postText: 'article .entry-summary, article .entry-content', content: '.entry-content' };

let browser;
let report;
let ids;
let fontUrl = '';

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
	state( 'ofss:rollback', 'reset', 'ofss:clear', 'ofss:forget', 'theme:open-frame', 'plugin:starter-sites=on', 'plugin:elementor=on', PRO ? 'plugin:elementor-pro=on' : 'plugin:elementor-pro=off', design.store ? 'plugin:woocommerce=on' : 'plugin:woocommerce=off' );
	report = JSON.parse( state( 'ofss:import=' + design.site ).trim().split( '\n' ).pop() );
	ids = JSON.parse( state( 'ofss:ids' ).trim().split( '\n' ).pop() );
} );

after( async () => {
	state( 'ofss:rollback', 'ofss:clear', 'ofss:forget', 'reset', 'plugin:woocommerce=off' );
	await browser.close();
} );

test( `${ NAME } imports completely, with free Elementor only`, () => {
	assert.equal( report.status, 'done', report.error || '' );
	assert.deepEqual( report.warnings, [] );
	assert.deepEqual( report.counts, design.counts );
	for ( const name of design.pageNames ) {
		assert.ok( ids[ `${ design.site }:pages:${ name }` ], `page ${ name } exists` );
	}
	for ( const name of PRO ? [ 'header', 'footer', 'archive', 'single', 'not-found' ] : [ 'header', 'footer', 'not-found' ] ) {
		assert.ok( ids[ `${ design.site }:${ PRO ? 'templates' : 'site-parts' }:${ name }` ], `${ PRO ? 'template' : 'site part' } ${ name } exists` );
	}
} );

test( `${ NAME }: every page fits every width, loads its images and asks no other site for anything`, async () => {
	for ( const width of WIDTHS ) {
		const { context, page, problems, external } = await visitor( width );
		for ( const item of PAGES ) {
			const response = await page.goto( BASE + item.path, { waitUntil: 'load' } );
			const where = `${ item.path } at ${ width }`;
			assert.equal( response.status(), item.status || 200, where );
			await scrollThrough( page );

			await page.evaluate( () => document.fonts.ready );
			const found = await page.evaluate( ( SEL ) => ( {
				overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
				h1: [ ...document.querySelectorAll( 'h1' ) ].map( ( heading ) => heading.textContent.trim() ),
				mains: document.querySelectorAll( 'main' ).length,
				target: !! document.querySelector( 'main#main' ),
				header: document.querySelectorAll( SEL.header ).length,
				footer: document.querySelectorAll( SEL.footer ).length,
				themeChrome: document.querySelectorAll( '#masthead, #colophon' ).length,
				broken: [ ...document.images ].filter( ( image ) => ! image.naturalWidth ).map( ( image ) => image.currentSrc || image.src ),
				noAlt: [ ...document.images ].filter( ( image ) => ! image.hasAttribute( 'alt' ) ).length,
				leftovers: document.documentElement.innerHTML.includes( 'ofss://' ),
				headingFont: getComputedStyle( document.querySelector( 'h1' ) ).fontFamily.split( ',' )[ 0 ].replace( /"/g, '' ),
				bodyFont: getComputedStyle( document.body ).fontFamily.split( ',' )[ 0 ].replace( /"/g, '' ),
				fontsLoaded: [ getComputedStyle( document.querySelector( 'h1' ) ), getComputedStyle( document.body ) ].every( ( style ) => document.fonts.check( `${ style.fontWeight } 16px ${ style.fontFamily.split( ',' )[ 0 ] }` ) ),
				small: [ ...document.querySelectorAll( 'main p, main li, footer a, footer p' ) ].filter( ( node ) => node.offsetParent && parseFloat( getComputedStyle( node ).fontSize ) < 13 ).length,
			} ), SEL );

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
			assert.equal( found.headingFont, design.headingFont, where );
			assert.equal( found.bodyFont, design.bodyFont, where );
			assert.ok( found.fontsLoaded, `${ where }: both typefaces are really loaded, not replaced by a fallback` );
			assert.equal( found.small, 0, `${ where }: no running text under 13px` );
		}
		assert.deepEqual( problems, [], `script errors at ${ width }` );
		assert.deepEqual( [ ...new Set( external ) ], [], `requests to other sites at ${ width }` );
		await context.close();
	}
} );

test( `${ NAME }: the menu works on a phone and with a keyboard`, async () => {
	const { context, page, problems } = await visitor( 390 );
	await page.goto( BASE + '/' );
	const toggle = page.locator( SEL.toggle );
	const menu = page.locator( SEL.menu );
	assert.ok( await toggle.isVisible(), 'the menu button shows on a phone' );
	assert.ok( ! ( await menu.isVisible() ), 'the menu starts closed' );

	const size = await toggle.boundingBox();
	assert.ok( size.width >= 44 && size.height >= 44, `the button is large enough to tap (${ size.width }x${ size.height })` );

	await toggle.click();
	assert.equal( await toggle.getAttribute( 'aria-expanded' ), 'true' );
	// Elementor Pro's menu slides open; wait until it has.
	await menu.locator( SEL.items ).first().waitFor( { state: 'visible', timeout: 5000 } );
	assert.ok( await menu.isVisible() );
	assert.deepEqual( ( await menu.locator( SEL.items ).allTextContents() ).map( ( label ) => label.trim() ), design.menu );
	const inside = await menu.evaluate( ( list ) => {
		const rect = list.getBoundingClientRect();
		return rect.left >= 0 && rect.right <= document.documentElement.clientWidth;
	} );
	assert.ok( inside, 'the open menu stays on the screen' );

	if ( PRO ) {
		// Elementor Pro's menu closes with its own button.
		await toggle.click();
		assert.equal( await toggle.getAttribute( 'aria-expanded' ), 'false', 'the button closes it' );
	} else {
		await page.keyboard.press( 'Escape' );
		assert.equal( await toggle.getAttribute( 'aria-expanded' ), 'false', 'Escape closes it' );
	}

	await toggle.click();
	await Promise.all( [ page.waitForURL( BASE + design.current.path ), menu.getByRole( 'link', { name: design.current.label, exact: true } ).click() ] );
	assert.equal( ( await page.locator( SEL.current ).first().textContent() ).trim(), design.current.label, 'the current page is marked' );

	// On a desktop the menu is a row and the button is gone.
	await page.setViewportSize( { width: 1440, height: 900 } );
	await page.goto( BASE + '/' );
	assert.ok( ! ( await toggle.isVisible() ) );
	assert.ok( await page.locator( SEL.row ).isVisible() );
	await page.keyboard.press( 'Tab' );
	assert.equal( await page.evaluate( () => document.activeElement.className ), 'skip-link screen-reader-text', 'the skip link comes first' );
	assert.deepEqual( problems, [] );
	await context.close();
} );

test( `${ NAME }: every link inside the site leads somewhere`, async () => {
	const { context, page } = await visitor( 1440 );
	const links = new Map();
	for ( const item of PAGES ) {
		await page.goto( BASE + item.path );
		const found = await page.evaluate( () => [ ...document.querySelectorAll( 'a[href]:not([aria-expanded])' ) ].map( ( anchor ) => ( { href: anchor.href, raw: anchor.getAttribute( 'href' ), text: anchor.textContent.trim().slice( 0, 40 ) } ) ) );
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

test( `${ NAME }: the blog shows the three articles, each with its picture`, async () => {
	const { context, page, problems } = await visitor( 1440 );
	await page.goto( BASE + design.blog.path );
	assert.ok( await page.locator( 'h1' ).isVisible(), 'the page has a visible title' );
	const titles = ( await page.locator( SEL.postTitle ).allTextContents() ).map( ( title ) => title.trim() );
	for ( const title of design.blog.titles ) {
		assert.ok( titles.includes( title ), title );
	}
	assert.equal( await page.locator( SEL.postImage ).count(), design.blog.titles.length );
	assert.equal( ( await page.request.get( BASE + design.blog.category ) ).status(), 200, 'articles are filed under their categories' );
	const columns = await page.locator( SEL.post ).evaluateAll( ( articles ) => new Set( articles.map( ( article ) => Math.round( article.getBoundingClientRect().left ) ) ).size );
	assert.equal( columns, design.blog.columns, `${ design.blog.columns } columns on a desktop` );

	await Promise.all( [ page.waitForURL( BASE + design.blog.open.path ), page.getByRole( 'link', { name: design.blog.open.title } ).first().click() ] );
	assert.equal( await page.locator( 'h1' ).textContent().then( ( text ) => text.trim() ), design.blog.open.title );
	const sizes = await page.evaluate( ( content ) => ( { title: parseFloat( getComputedStyle( document.querySelector( 'h1' ) ).fontSize ), sub: parseFloat( getComputedStyle( document.querySelector( content + ' h2' ) ).fontSize ) } ), SEL.content );
	assert.ok( sizes.sub < sizes.title, `a subheading (${ sizes.sub }px) is smaller than the title of the article (${ sizes.title }px)` );
	assert.ok( await page.locator( SEL.content + ' p' ).count() >= 3, 'the article has its text' );
	assert.ok( await page.locator( SEL.content + ' h2' ).count() >= 1, 'and its subheadings' );
	assert.deepEqual( problems, [] );
	await context.close();
} );

test( `${ NAME }: the "not found" page of the design helps the visitor on`, async () => {
	const { context, page } = await visitor( 1440 );
	const response = await page.goto( BASE + '/a-page-that-does-not-exist/' );
	assert.equal( response.status(), 404 );
	assert.equal( await page.locator( 'h1' ).textContent().then( ( text ) => text.trim() ), design.notFound.h1 );
	await Promise.all( [ page.waitForURL( BASE + '/' ), page.locator( 'main' ).getByRole( 'link', { name: design.notFound.button } ).click() ] );
	await context.close();
} );

test( `${ NAME }: pages pass the automated accessibility checks`, async () => {
	for ( const width of [ 390, 1440 ] ) {
		const { context, page } = await visitor( width );
		for ( const item of PAGES ) {
			await page.goto( BASE + item.path );
			await scrollThrough( page );
			// Counters run for a moment; wait until they show their final numbers.
			await page.waitForTimeout( 1500 );
			// Elementor Pro's Posts widget gives each article the role "listitem", which axe-core's
			// best-practice rule "aria-allowed-role" rejects. It is Elementor Pro's markup, not the design's.
			assert.deepEqual( await axe( page, 'body', { disable: PRO ? [ 'aria-allowed-role' ] : [] } ), [], `${ item.path } at ${ width }` );
		}
		await context.close();
	}
} );

test( `${ NAME }: its typefaces are served by the site itself`, async () => {
	const { context, page } = await visitor( 1440 );
	const fontRequests = [];
	page.on( 'response', ( response ) => {
		if ( response.request().resourceType() === 'font' ) {
			fontRequests.push( { url: response.url(), status: response.status() } );
		}
	} );
	await page.goto( BASE + '/' );
	await page.evaluate( () => document.fonts.ready );
	assert.ok( fontRequests.length >= 1, 'at least one font file is requested' );
	for ( const request of fontRequests ) {
		assert.ok( request.url.startsWith( BASE + '/' ), `${ request.url } comes from this site` );
		assert.equal( request.status, 200, request.url );
	}
	const stored = fontRequests.filter( ( request ) => request.url.includes( '/uploads/open-frame-fonts/' ) );
	if ( design.fontFiles ) {
		assert.ok( stored.length >= 1 && stored.length <= design.fontFiles, `between one and ${ design.fontFiles } of the design's font files are used on the home page (${ stored.length })` );
		fontUrl = stored[ 0 ].url;
	} else {
		assert.equal( stored.length, 0, 'the design uses the fonts of the theme' );
	}
	assert.equal( await page.locator( 'link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]' ).count(), 0, 'no link to a font service' );
	await context.close();
} );

test( `${ NAME }: colors and fonts come from Elementor Site Settings`, async () => {
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
	assert.deepEqual( kit, { primary: design.kit.primary, secondary: design.kit.secondary, text: design.kit.text, accent: design.kit.accent, follows: true, button: design.kit.button, heading: design.kit.heading } );

	// The blog is drawn by the theme, and follows the same settings.
	await page.goto( BASE + design.blog.path );
	const blog = await page.evaluate( ( SEL ) => ( {
		title: getComputedStyle( document.querySelector( SEL.postLink ) ).color,
		text: getComputedStyle( document.querySelector( SEL.postText ) ).color,
	} ), SEL );
	assert.deepEqual( blog, { title: design.kit.heading, text: design.kit.bodyText } );
	await context.close();
} );

test( `${ NAME }: the home page, the header and the footer open in the Elementor editor`, async () => {
	const context = await browser.newContext( { viewport: { width: 1440, height: 1000 } } );
	const page = await context.newPage();
	const problems = [];
	page.on( 'pageerror', ( error ) => problems.push( error.message ) );
	await login( page );

	const parts = design.editor;
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

test( `${ NAME }: rolling back returns the site to what it was, without PHP errors`, async () => {
	state( 'ofss:rollback' );
	const { context, page } = await visitor( 1440 );
	await page.goto( BASE + '/' );
	assert.equal( await page.locator( '#masthead' ).count(), 1, 'the theme header is back' );
	assert.equal( await page.getByText( design.brand ).count(), 0, 'nothing of the design is left on the home page' );
	assert.equal( ( await page.goto( BASE + design.gone ) ).status(), 404 );
	assert.equal( ( await page.goto( BASE + design.blog.category ) ).status(), 404, 'the categories of the articles are gone too' );
	assert.deepEqual( JSON.parse( state( 'ofss:ids' ).trim().split( '\n' ).pop() ), [] );
	if ( fontUrl ) {
		assert.equal( ( await page.request.get( fontUrl ) ).status(), 404, 'the font files are gone too' );
	}
	await context.close();
	assert.deepEqual( themeErrors(), [] );
} );
}

module.exports = { runDesignChecks };
