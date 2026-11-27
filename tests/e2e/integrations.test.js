/**
 * Browser checks for the Elementor, WooCommerce and location integrations.
 *
 *   bash tests/env/setup.sh
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 */
const { test, before, after } = require( 'node:test' );
const assert = require( 'node:assert/strict' );
// The browser engine: chromium unless OFT_BROWSER names firefox or webkit.
const browserType = require( 'playwright' )[ process.env.OFT_BROWSER || 'chromium' ];
const { engineNoise, BASE, WIDTHS, state, runScript, hasElementorPro, pageIds, themeErrors, clearErrorLog, visit, facts, box, style, login } = require( './helpers' );

let browser;
let page; // A visitor.
let admin; // The administrator, in a separate session.

before( async () => {
	browser = await browserType.launch();
	page = await browser.newPage( { viewport: { width: 1440, height: 900 } } );
	admin = await ( await browser.newContext( { viewport: { width: 1440, height: 900 } } ) ).newPage();
	// Elementor Pro, when present, is only switched on by its own test.
	state( 'plugin:elementor-pro=off' );
	await login( admin );
	clearErrorLog();
} );

after( async () => {
	state( 'reset', 'plugin:elementor-pro=off', 'plugin:elementor=on', 'plugin:woocommerce=on' );
	await browser.close();
} );

const setWidth = ( width ) => page.setViewportSize( { width, height: 900 } );

/* -------------------------------------------------------------------------
   The theme on its own
   ---------------------------------------------------------------------- */
/**
 * A computed style, read again for up to two seconds while it is not the expected
 * value: a color that is still fading (buttons have a transition) is not the color
 * of the button.
 */
async function settled( page, selector, property, expected ) {
	// The pointer stays where the last click was; over a button it would show the button's hover color.
	await page.mouse.move( 1, 1 );
	let value;
	for ( let attempt = 0; attempt < 20; attempt++ ) {
		value = await style( page, selector, property );
		if ( value === expected ) {
			break;
		}
		await page.waitForTimeout( 100 );
	}
	return value;
}

test( 'theme alone: nothing from the integrations is loaded', async () => {
	state( 'reset', 'plugin:elementor=off', 'plugin:woocommerce=off' );

	for ( const url of [ '/', '/plain-page/', '/hello-world/', '/?s=hello', '/this-page-does-not-exist/' ] ) {
		for ( const width of [ 390, 1440 ] ) {
			await setWidth( width );
			const { status, errors } = await visit( page, url );
			const f = await facts( page );

			assert.equal( status, url.includes( 'does-not-exist' ) ? 404 : 200, url );
			assert.deepEqual( errors, [], `${ url } console errors` );
			assert.equal( f.overflow, 0, `${ url } overflows at ${ width }` );
			assert.ok( f.header && f.footer, `${ url } theme header and footer` );
			assert.equal( f.mains, 1, `${ url } one main landmark` );
			assert.ok( f.hasMainTarget, `${ url } skip link target` );
			assert.ok( ! f.stylesheets.includes( 'open-frame-woocommerce-css' ), 'store stylesheet not loaded' );
			assert.ok( ! f.bodyClasses.includes( 'of-builder-page' ) && ! f.bodyClasses.includes( 'of-follow-elementor' ), 'no integration body classes' );
		}
	}

	await visit( page, '/plain-page/' );
	assert.ok( await box( page, 'article.entry-single' ), 'plain page keeps its card' );
} );

test( 'theme alone: the Elementor option is hidden in the Customizer', async () => {
	state( 'reset', 'plugin:elementor=off', 'plugin:woocommerce=off' );
	await admin.goto( BASE + '/wp-admin/customize.php' );
	await admin.waitForFunction( () => window.wp?.customize?.section?.( 'open_frame_layout' )?.active() === true, null, { timeout: 30000 } );
	assert.equal( await admin.evaluate( () => window.wp.customize.section( 'open_frame_elementor' ).active() ), false );
} );

/* -------------------------------------------------------------------------
   Replaceable locations
   ---------------------------------------------------------------------- */
test( 'locations: a plugin can replace the header and the footer', async () => {
	state( 'reset', 'plugin:elementor=off', 'plugin:woocommerce=off', 'option:oft_fake_locations=header,footer', 'mod:open_frame_sticky_header=true', 'mod:open_frame_transparent_header=true' );

	await visit( page, '/' );
	const f = await facts( page );
	assert.ok( ! f.header && ! f.footer, 'theme header and footer are not printed' );
	assert.equal( await page.locator( '.oft-fake-location[data-location="header"]' ).count(), 1 );
	assert.equal( await page.locator( '.oft-fake-location[data-location="footer"]' ).count(), 1 );
	assert.ok( ! f.bodyClasses.includes( 'has-sticky-header' ), 'no sticky-header class without the theme header' );
	assert.ok( ! f.bodyClasses.includes( 'has-transparent-header' ), 'no transparent-header class without the theme header' );
	assert.ok( f.hasMainTarget, 'content still rendered by the theme' );

	const order = await page.evaluate( () => {
		const position = ( selector ) => document.querySelector( selector ).getBoundingClientRect().top;
		return position( '[data-location="header"]' ) < position( '#content' ) && position( '#content' ) < position( '[data-location="footer"]' );
	} );
	assert.ok( order, 'header, content, footer in order' );
} );

test( 'locations: a plugin can replace single, archive and 404 content', async () => {
	state( 'reset', 'plugin:elementor=off', 'plugin:woocommerce=off', 'option:oft_fake_locations=single,archive,404' );

	const views = { '/hello-world/': 'single', '/plain-page/': 'single', '/': 'archive', '/?s=hello': 'archive', '/this-page-does-not-exist/': '404' };
	for ( const [ url, location ] of Object.entries( views ) ) {
		await visit( page, url );
		const f = await facts( page );
		assert.ok( f.header && f.footer, `${ url } keeps the theme header and footer` );
		assert.equal( f.mains, 1, `${ url } one main landmark` );
		assert.equal( await page.locator( `main#main.of-location--${ location } > .oft-fake-location[data-location="${ location }"]` ).count(), 1, `${ url } replaced inside main` );
		assert.equal( await page.locator( '.of-content-area' ).count(), 0, `${ url } theme template skipped` );
	}
} );

test( 'locations: Elementor Theme Builder locations are honoured', async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:woocommerce=off', 'option:oft_fake_locations=elementor:header,single' );

	await visit( page, '/hello-world/' );
	assert.equal( await page.locator( '[data-source="elementor"][data-location="header"]' ).count(), 1, 'header location' );
	assert.equal( await page.locator( 'main#main > [data-source="elementor"][data-location="single"]' ).count(), 1, 'single location' );
	assert.ok( ( await facts( page ) ).footer, 'footer falls back to the theme' );

	// Theme Builder serves 404 pages from a "single" template.
	const { status } = await visit( page, '/this-page-does-not-exist/' );
	assert.equal( status, 404 );
	assert.equal( await page.locator( 'main#main.of-location--404 > [data-location="single"]' ).count(), 1, '404 uses the single location' );

	// Archives were not offered a template, so the theme renders them.
	await visit( page, '/' );
	assert.equal( await page.locator( '.of-content-area' ).count(), 1 );
} );

/* -------------------------------------------------------------------------
   Elementor
   ---------------------------------------------------------------------- */
test( 'Elementor: default template pages span the full width', async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:woocommerce=off' );

	for ( const width of WIDTHS ) {
		await setWidth( width );
		const { errors } = await visit( page, '/el-default/' );
		const f = await facts( page );
		const hero = await box( page, '.oft-hero' );

		assert.deepEqual( errors, [], `console errors at ${ width }` );
		assert.equal( f.overflow, 0, `overflow at ${ width }` );
		assert.equal( hero.left, 0, `hero starts at the window edge at ${ width }` );
		assert.equal( hero.width, f.width, `hero spans the window at ${ width }` );
	}

	const f = await facts( page );
	assert.ok( f.bodyClasses.includes( 'of-builder-page' ) );
	assert.ok( f.header && f.footer && f.hasMainTarget );
	assert.equal( f.mains, 1 );
	assert.equal( await page.locator( 'article.entry-single' ).count(), 0, 'no page card' );
	assert.equal( await page.locator( 'h1.entry-title' ).count(), 1, 'title kept' );
} );

test( 'Elementor: "Hide Title" works and leaves no gap', async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:woocommerce=off' );
	await setWidth( 1440 );
	await visit( page, '/el-hide-title/' );

	assert.equal( await style( page, 'h1.entry-title', 'display' ), 'none' );
	const header = await box( page, '#masthead' );
	const hero = await box( page, '.oft-hero' );
	assert.equal( hero.top, header.top + header.height, 'hero sits directly under the header' );
} );

test( 'Elementor: Full Width and Canvas templates', async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:woocommerce=off' );

	for ( const width of WIDTHS ) {
		await setWidth( width );

		await visit( page, '/el-full-width/' );
		let f = await facts( page );
		let hero = await box( page, '.oft-hero' );
		assert.equal( f.overflow, 0, `full width overflow at ${ width }` );
		assert.equal( hero.width, f.width, `full width hero at ${ width }` );
		assert.ok( f.header && f.footer, 'full width keeps header and footer' );
		assert.ok( f.hasMainTarget && f.mains === 1, 'full width has the skip link target' );

		await visit( page, '/el-canvas/' );
		f = await facts( page );
		hero = await box( page, '.oft-hero' );
		assert.equal( f.overflow, 0, `canvas overflow at ${ width }` );
		assert.equal( hero.width, f.width, `canvas hero at ${ width }` );
		assert.equal( hero.top, 0, 'canvas starts at the top' );
		assert.ok( ! f.header && ! f.footer, 'canvas has no theme header or footer' );
	}
} );

test( 'Elementor: widgets keep their own styles', async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:woocommerce=off' );
	await setWidth( 1440 );
	await visit( page, '/el-full-width/' );

	assert.equal( await style( page, '.oft-hero .elementor-button', 'backgroundColor' ), 'rgb(245, 166, 35)' );
	assert.equal( await style( page, '.oft-hero .elementor-button', 'color' ), 'rgb(17, 17, 17)' );
	assert.equal( await style( page, '.oft-hero .elementor-heading-title', 'color' ), 'rgb(255, 255, 255)' );
	assert.equal( await style( page, '.oft-hero .elementor-button', 'textDecorationLine' ), 'none' );
} );

test( 'Elementor: pages with a sidebar and plain pages are left alone', async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:woocommerce=off', 'mod:open_frame_page_layout=right-sidebar' );
	await setWidth( 1440 );

	await visit( page, '/el-default/' );
	let f = await facts( page );
	assert.ok( ! f.bodyClasses.includes( 'of-builder-page' ), 'sidebar layout wins' );
	assert.equal( await page.locator( '.of-sidebar' ).count(), 1 );

	state( 'reset' );
	await visit( page, '/plain-page/' );
	f = await facts( page );
	assert.ok( ! f.bodyClasses.includes( 'of-builder-page' ) );
	assert.equal( await page.locator( 'article.entry-single' ).count(), 1, 'plain page keeps its card' );
} );

test( 'Elementor: the editor opens every template', async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:woocommerce=off' );
	const ids = pageIds();

	for ( const slug of [ 'el-default', 'el-full-width', 'el-canvas' ] ) {
		const errors = [];
		const onPageError = ( error ) => errors.push( error.message );
		admin.on( 'pageerror', onPageError );

		await admin.goto( `${ BASE }/wp-admin/post.php?post=${ ids[ slug ] }&action=elementor` );
		const frame = admin.frameLocator( '#elementor-preview-iframe' );
		await frame.locator( 'body.elementor-editor-active .oft-hero' ).waitFor( { state: 'visible', timeout: 90000 } );

		const preview = await frame.locator( '.oft-hero' ).evaluate( ( hero ) => ( {
			heroWidth: Math.round( hero.getBoundingClientRect().width ),
			frameWidth: document.documentElement.clientWidth,
			editable: !! hero.closest( '.elementor-edit-area' ),
		} ) );
		assert.ok( preview.editable, `${ slug }: content is inside the editable area` );
		assert.equal( preview.heroWidth, preview.frameWidth, `${ slug }: full-width section in the editor` );
		assert.equal( await admin.locator( '#elementor-fatal-error-dialog, .elementor-preview-loading-error' ).count(), 0, `${ slug }: no editor error` );

		// Let the editor finish loading its parts: leaving in the middle makes Firefox report each interrupted download as an error.
		await admin.waitForLoadState( 'networkidle' ).catch( () => {} );
		admin.off( 'pageerror', onPageError );
		assert.deepEqual( errors.filter( ( message ) => ! engineNoise( message ) ), [], `${ slug }: script errors in the editor` );
	}
} );

test( 'Elementor: the theme can follow global colors and fonts', async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:woocommerce=off' );
	await setWidth( 1440 );

	// Off by default: theme colors.
	await visit( page, '/plain-page/' );
	assert.equal( await style( page, '.entry-content p a', 'color' ), 'rgb(63, 76, 214)' );
	assert.ok( ! ( await facts( page ) ).bodyClasses.includes( 'of-follow-elementor' ) );

	state( 'mod:open_frame_follow_elementor=true' );
	await visit( page, '/plain-page/' );

	const result = await page.evaluate( () => {
		const probe = ( property, value ) => {
			const element = document.createElement( 'span' );
			element.style[ property ] = value;
			document.body.append( element );
			const computed = getComputedStyle( element )[ property ];
			element.remove();
			return computed;
		};
		const of = ( selector, property ) => getComputedStyle( document.querySelector( selector ) )[ property ];
		return {
			link: of( '.entry-content p a', 'color' ),
			primary: probe( 'color', 'var(--e-global-color-primary)' ),
			heading: of( '.entry-content h2', 'color' ),
			secondary: probe( 'color', 'var(--e-global-color-secondary)' ),
			text: of( '.entry-content p', 'color' ),
			textGlobal: probe( 'color', 'var(--e-global-color-text)' ),
			bodyFont: of( '.entry-content p', 'fontFamily' ),
			headingFont: of( '.entry-content h2', 'fontFamily' ),
			textFontGlobal: getComputedStyle( document.body ).getPropertyValue( '--e-global-typography-text-font-family' ).trim(),
			primaryFontGlobal: getComputedStyle( document.body ).getPropertyValue( '--e-global-typography-primary-font-family' ).trim(),
		};
	} );

	assert.equal( result.link, result.primary, 'links use the Primary color' );
	assert.equal( result.heading, result.secondary, 'headings use the Secondary color' );
	assert.equal( result.text, result.textGlobal, 'body text uses the Text color' );
	const first = ( stack ) => stack.split( ',' )[ 0 ].replace( /["']/g, '' ).trim();
	assert.equal( first( result.bodyFont ), first( result.textFontGlobal ), 'body font follows the Text font' );
	assert.equal( first( result.headingFont ), first( result.primaryFontGlobal ), 'heading font follows the Primary font' );
	assert.match( result.bodyFont, /Hanken Grotesk/, 'the theme font stays as the fallback' );

	// With Elementor switched off the option has no effect.
	state( 'plugin:elementor=off' );
	await visit( page, '/plain-page/' );
	assert.equal( await style( page, '.entry-content p a', 'color' ), 'rgb(63, 76, 214)' );
} );

test( 'Elementor: the option appears in the Customizer', async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:woocommerce=off' );
	await admin.goto( BASE + '/wp-admin/customize.php' );
	await admin.waitForFunction( () => window.wp?.customize?.section?.( 'open_frame_elementor' )?.active() === true, null, { timeout: 30000 } );
	assert.ok( await admin.evaluate( () => !! window.wp.customize.control( 'open_frame_follow_elementor' ) ) );
} );

test( 'Elementor Pro: Theme Builder templates replace the theme templates', { skip: ! hasElementorPro() && 'Elementor Pro is not installed in the test site' }, async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:elementor-pro=on', 'plugin:woocommerce=off', 'mod:open_frame_sticky_header=true' );
	runScript( 'pro-fixtures.php', 'on' );

	try {
		const views = {
			'/hello-world/': { content: 'single-post', location: 'single' },
			'/this-page-does-not-exist/': { content: 'error-404', location: '404' },
			'/': { content: 'archive' },
			'/?s=hello': { content: 'archive' },
		};
		for ( const [ url, expected ] of Object.entries( views ) ) {
			for ( const width of [ 390, 1440 ] ) {
				await setWidth( width );
				const { errors } = await visit( page, url );
				const f = await facts( page );
				assert.deepEqual( errors, [], `${ url } console errors` );
				assert.equal( f.overflow, 0, `${ url } overflows at ${ width }` );
				assert.ok( ! f.header && ! f.footer, `${ url } theme header and footer replaced` );
				assert.equal( await page.locator( '.oft-pro-header' ).count(), 1, `${ url } Theme Builder header` );
				assert.equal( await page.locator( '.oft-pro-footer' ).count(), 1, `${ url } Theme Builder footer` );
				assert.equal( await page.locator( `main#main .oft-pro-${ expected.content }` ).count(), 1, `${ url } Theme Builder content inside main` );
				assert.equal( f.mains, 1, `${ url } one main landmark` );
				assert.equal( await page.locator( '.of-content-area' ).count(), 0, `${ url } theme template skipped` );
				assert.ok( ! f.bodyClasses.includes( 'has-sticky-header' ), `${ url } no sticky class without the theme header` );
				if ( expected.location ) {
					assert.equal( await page.locator( `main#main.of-location--${ expected.location }` ).count(), 1, `${ url } location wrapper` );
				}
			}
		}

		// A page has no matching single template: theme content, Theme Builder header and footer.
		await visit( page, '/plain-page/' );
		assert.equal( await page.locator( 'article.entry-single' ).count(), 1, 'page keeps the theme template' );
		assert.equal( await page.locator( '.oft-pro-header' ).count(), 1 );

		// Canvas still has neither header nor footer.
		await visit( page, '/el-canvas/' );
		assert.equal( await page.locator( '.oft-pro-header, .oft-pro-footer' ).count(), 0, 'Canvas has no header or footer' );

		// Removing the templates gives the theme templates back.
		runScript( 'pro-fixtures.php', 'off' );
		await visit( page, '/hello-world/' );
		const f = await facts( page );
		assert.ok( f.header && f.footer, 'theme header and footer are back' );
		assert.equal( await page.locator( '.of-content-area' ).count(), 1 );
		assert.ok( f.bodyClasses.includes( 'has-sticky-header' ) );
	} finally {
		runScript( 'pro-fixtures.php', 'off' );
		state( 'plugin:elementor-pro=off' );
	}
} );

/* -------------------------------------------------------------------------
   WooCommerce
   ---------------------------------------------------------------------- */
test( 'WooCommerce: shop, product, cart, checkout and account', async () => {
	state( 'reset', 'plugin:elementor=off', 'plugin:woocommerce=on' );
	const context = await browser.newContext( { viewport: { width: 1440, height: 900 } } );
	const shop = await context.newPage();
	const primary = 'rgb(63, 76, 214)';

	// Put something in the cart first, so the cart and checkout have content.
	await visit( shop, '/product/oft-product-0/' );
	await shop.click( 'button.single_add_to_cart_button' );
	await shop.waitForSelector( '.woocommerce-message' );

	const views = [ '/shop/', '/product/oft-product-0/', '/cart/', '/checkout/', '/my-account/' ];
	for ( const url of views ) {
		for ( const width of WIDTHS ) {
			await shop.setViewportSize( { width, height: 900 } );
			const { status, errors } = await visit( shop, url );
			const f = await facts( shop );
			assert.equal( status, 200, url );
			assert.deepEqual( errors, [], `${ url } console errors at ${ width }` );
			assert.equal( f.overflow, 0, `${ url } overflows at ${ width }` );
			assert.equal( f.mains, 1, `${ url } one main landmark` );
			assert.ok( f.hasMainTarget && f.header && f.footer, `${ url } theme layout` );
			assert.ok( f.bodyClasses.includes( 'layout-full-width' ), `${ url } full-width layout` );
			assert.ok( f.stylesheets.includes( 'open-frame-woocommerce-css' ), 'store stylesheet loaded' );
		}
	}

	// Shop grid.
	await shop.setViewportSize( { width: 1440, height: 900 } );
	await visit( shop, '/shop/' );
	assert.equal( await shop.locator( '.of-sidebar' ).count(), 0, 'no blog sidebar in the shop' );
	const cards = await shop.evaluate( () => [ ...document.querySelectorAll( 'ul.products li.product' ) ].map( ( card ) => {
		const rect = card.getBoundingClientRect();
		return { top: Math.round( rect.top ), height: Math.round( rect.height ), left: Math.round( rect.left ) };
	} ) );
	const firstRow = cards.filter( ( card ) => card.top === cards[ 0 ].top );
	assert.ok( firstRow.length >= 3, `several products per row on desktop (${ firstRow.length })` );
	assert.ok( firstRow.every( ( card ) => card.height === firstRow[ 0 ].height ), 'cards in a row share one height' );
	assert.equal( await settled( shop, 'ul.products li.product .button', 'backgroundColor', primary ), primary, 'buttons use the primary color' );

	await shop.setViewportSize( { width: 360, height: 900 } );
	await visit( shop, '/shop/' );
	const narrow = await shop.evaluate( () => {
		const cardsTop = [ ...document.querySelectorAll( 'ul.products li.product' ) ].map( ( card ) => Math.round( card.getBoundingClientRect().top ) );
		return cardsTop.filter( ( top ) => top === cardsTop[ 0 ] ).length;
	} );
	assert.equal( narrow, 2, 'two products per row on a phone' );

	// Product page.
	await shop.setViewportSize( { width: 1440, height: 900 } );
	await visit( shop, '/product/oft-product-0/' );
	assert.equal( await settled( shop, 'button.single_add_to_cart_button', 'backgroundColor', primary ), primary );
	const gallery = await box( shop, '.woocommerce-product-gallery' );
	const summary = await box( shop, '.summary' );
	assert.ok( summary.left > gallery.left + gallery.width - 1, 'summary next to the gallery on desktop' );
	await shop.setViewportSize( { width: 390, height: 900 } );
	await visit( shop, '/product/oft-product-0/' );
	const stackedGallery = await box( shop, '.woocommerce-product-gallery' );
	const stackedSummary = await box( shop, '.summary' );
	assert.ok( stackedSummary.top >= stackedGallery.top + stackedGallery.height, 'summary below the gallery on a phone' );

	// Cart and checkout stay inside the page card.
	await shop.setViewportSize( { width: 1440, height: 900 } );
	for ( const [ url, block ] of [ [ '/cart/', '.wp-block-woocommerce-cart' ], [ '/checkout/', '.wp-block-woocommerce-checkout' ] ] ) {
		await visit( shop, url );
		await shop.waitForSelector( block );
		const card = await box( shop, 'article.entry-single' );
		const inner = await box( shop, block );
		assert.ok( inner.left > card.left && inner.left + inner.width < card.left + card.width, `${ url } block inside the card` );
	}
	await visit( shop, '/cart/' );
	await shop.waitForSelector( '.wc-block-cart-items__row', { timeout: 30000 } );
	assert.equal( await style( shop, '.wc-block-cart__submit-button', 'backgroundColor' ), primary, 'checkout button uses the primary color' );

	await context.close();
} );

test( 'WooCommerce: products placed on an ordinary page are styled', async () => {
	state( 'reset', 'plugin:elementor=off', 'plugin:woocommerce=on' );
	await setWidth( 1440 );
	await visit( page, '/plain-page/' );
	assert.ok( ( await facts( page ) ).stylesheets.includes( 'open-frame-woocommerce-css' ) );
} );

/* -------------------------------------------------------------------------
   Everything together, and the error log
   ---------------------------------------------------------------------- */
test( 'Elementor and WooCommerce together', async () => {
	state( 'reset', 'plugin:elementor=on', 'plugin:woocommerce=on' );
	for ( const url of [ '/', '/el-default/', '/el-full-width/', '/el-canvas/', '/shop/', '/product/oft-product-0/', '/plain-page/' ] ) {
		for ( const width of [ 360, 768, 1440 ] ) {
			await setWidth( width );
			const { status, errors } = await visit( page, url );
			assert.equal( status, 200, url );
			assert.deepEqual( errors, [], `${ url } console errors` );
			assert.equal( ( await facts( page ) ).overflow, 0, `${ url } overflows at ${ width }` );
		}
	}
} );

test( 'the theme logged no PHP errors, warnings or notices', () => {
	assert.deepEqual( themeErrors(), [] );
} );
