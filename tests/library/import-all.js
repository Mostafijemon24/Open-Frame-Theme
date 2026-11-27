#!/usr/bin/env node
/**
 * Imports every design from a running library into a clean WordPress site, the
 * way a new user would: Appearance > Starter Sites, open the design, let the
 * screen activate what it needs, import, look at every page, roll back.
 *
 *   node tests/library/import-all.js [site …]
 *
 * Started by tests/library/rehearsal.sh, which builds the library, serves it
 * through the real Worker and prepares the site. Before each design the site
 * is put back to the state saved in <OFT_DIR>/clean (database and uploads), so
 * no design sees what another left behind.
 *
 * With OFT_PHONES=1 a few pages of each design are also opened on an emulated
 * iPhone and an emulated Android phone (see phones() below).
 *
 * Writes <OFT_DIR>/report.json and prints a table. Exits with 1 when a design
 * could not be imported or a check failed.
 */
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { execFileSync } = require( 'node:child_process' );
// The browser engine: chromium unless OFT_BROWSER names firefox or webkit.
const browserType = require( 'playwright' )[ process.env.OFT_BROWSER || 'chromium' ];
const { BASE, DIR, WP, ROOT, hasPlugin, login } = require( '../e2e/helpers.js' );

const SCREEN = BASE + '/wp-admin/themes.php?page=open-frame-starter-sites';
const CONTENT = path.join( WP, 'wp-content' );
const LOG = path.join( CONTENT, 'debug.log' );
/** Requests WordPress itself makes to other sites on a site without content of its own: the avatar of the sample comment and the emoji pictures. */
const WORDPRESS_HOSTS = [ 'secure.gravatar.com', 's.w.org' ];
const MAX_PAGES = 80;

const php = ( script, ...args ) => execFileSync( 'php', [ path.join( ROOT, 'tests/env/run.php' ), WP, path.join( ROOT, script ), ...args ], { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ] } );
const snapshot = () => JSON.parse( php( 'tests/library/snapshot.php' ).trim().split( '\n' ).pop() );

/** Put the site back to the clean state. */
function restore() {
	for ( const folder of [ 'database', 'uploads' ] ) {
		fs.rmSync( path.join( CONTENT, folder ), { recursive: true, force: true } );
		if ( fs.existsSync( path.join( DIR, 'clean', folder ) ) ) {
			fs.cpSync( path.join( DIR, 'clean', folder ), path.join( CONTENT, folder ), { recursive: true } );
		}
	}
	fs.rmSync( LOG, { force: true } );
}

/**
 * What PHP logged while a design was imported, looked at and rolled back.
 * Messages of the theme and the plugin are problems, and so is a fatal error
 * of anyone; notices from other plugins are counted and kept in <OFT_DIR>/logs.
 */
function phpMessages( site ) {
	const lines = fs.existsSync( LOG ) ? fs.readFileSync( LOG, 'utf8' ).split( '\n' ).filter( ( line ) => /PHP (Fatal|Warning|Notice|Deprecated|Parse)/.test( line ) ) : [];
	if ( lines.length ) {
		fs.mkdirSync( path.join( DIR, 'logs' ), { recursive: true } );
		fs.copyFileSync( LOG, path.join( DIR, 'logs', site + '.log' ) );
	}
	// A design that names an icon Elementor does not have makes Elementor warn; that is the design's fault.
	const ours = lines.filter( ( line ) => /PHP (Fatal|Parse)/.test( line ) || line.includes( '/themes/open-frame/' ) || line.includes( 'open-frame-starter-sites' ) || line.includes( 'font-icon-svg' ) );
	return { ours, others: lines.length - ours.length };
}

/** Import one design through the screen and return what happened. */
async function importDesign( browser, site ) {
	const result = { site: site.id, name: site.name, version: site.version, tier: site.tier, problems: [], notes: [] };
	const started = Date.now();
	restore();

	const context = await browser.newContext( { viewport: { width: 1440, height: 1000 } } );
	const page = await context.newPage();
	const dialog = () => page.getByRole( 'dialog' );

	try {
		await login( page );
		await page.goto( SCREEN );
		await page.waitForSelector( '.ofss-grid, .ofss-empty', { timeout: 60000 } );
		await page.getByRole( 'button', { name: 'View details: ' + site.name, exact: true } ).click();
		await dialog().locator( '.ofss-checks' ).waitFor();

		// Let the screen activate the plugins the design needs, one button at a time.
		result.activated = [];
		for ( let guard = 0; guard < 6; guard++ ) {
			const waiting = dialog().locator( '.ofss-checks > .ofss-check' ).filter( { has: page.getByRole( 'button', { name: /^(Activate|Install and activate)/ } ) } );
			if ( ! ( await waiting.count() ) ) {
				break;
			}
			// Name the row, so that the wait below is for this plugin and not for the next one in the list.
			const plugin = ( await waiting.first().locator( 'strong' ).first().textContent() ).trim();
			const row = dialog().locator( '.ofss-checks > .ofss-check' ).filter( { has: page.locator( 'strong', { hasText: new RegExp( '^' + plugin.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) + '$' ) } ) } );
			result.activated.push( plugin );
			await row.getByRole( 'button' ).click();
			await row.locator( '.ofss-check__detail', { hasText: /Active$/ } ).waitFor( { timeout: 240000 } );
		}

		const state = ( await dialog().locator( '.ofss-details__state' ).textContent() ).trim();
		if ( ! /has everything this design needs/.test( state ) ) {
			throw new Error( 'The site is not ready for the design: ' + state );
		}

		const before = snapshot();
		await dialog().getByRole( 'button', { name: 'Import this design' } ).click();
		const confirm = dialog().getByRole( 'group', { name: 'Confirm the import' } );
		await confirm.getByRole( 'checkbox' ).check();
		await confirm.getByRole( 'button', { name: 'Start the import' } ).click();

		const importStarted = Date.now();
		const done = dialog().getByRole( 'heading', { name: 'Imported', exact: true } );
		const stopped = dialog().getByRole( 'heading', { name: 'The import stopped', exact: true } );
		await done.or( stopped ).waitFor( { timeout: 600000 } );
		if ( await stopped.count() ) {
			throw new Error( 'The import stopped: ' + ( await dialog().locator( '.ofss-import' ).textContent() ).trim() );
		}
		result.importSeconds = Math.round( ( Date.now() - importStarted ) / 1000 );
		result.report = ( await dialog().locator( '.components-notice.is-success .components-notice__content' ).textContent() ).replace( /\s+/g, ' ' ).trim();
		const warnings = await dialog().locator( '.components-notice.is-warning' ).allTextContents();
		if ( warnings.length ) {
			result.problems.push( 'the import reported: ' + warnings.join( ' ' ).replace( /\s+/g, ' ' ).trim() );
		}

		// What a visitor sees: every page that can be reached from the home page.
		const seen = await crawl( browser, site );
		result.problems.push( ...seen.problems );
		result.notes.push( ...seen.notes );
		result.pagesVisited = seen.pagesVisited;
		result.imagesSeen = seen.imagesSeen;

		// The same pages on two emulated phones, upright and on their side.
		if ( process.env.OFT_PHONES ) {
			const held = await phones( seen.pages.slice( 0, 4 ) );
			result.problems.push( ...held.problems );
			result.notes.push( ...held.notes );
			result.phones = held.summary;
		}

		// Rolling back leaves nothing of the design behind.
		await dialog().getByRole( 'button', { name: 'Roll back this import' } ).click();
		await dialog().getByRole( 'group', { name: 'Roll back the import' } ).getByRole( 'button', { name: 'Yes, roll back' } ).click();
		await dialog().getByRole( 'button', { name: 'Import this design' } ).waitFor( { timeout: 180000 } );
		const after = snapshot();
		if ( JSON.stringify( after ) !== JSON.stringify( before ) ) {
			result.problems.push( `after the rollback the site is not as it was: ${ JSON.stringify( before ) } became ${ JSON.stringify( after ) }` );
		}
		result.rolledBack = true;
	} catch ( error ) {
		result.problems.push( error.message.split( '\n' )[ 0 ] );
		await page.screenshot( { path: path.join( DIR, 'shots', site.id + '-failure.png' ) } ).catch( () => {} );
	}

	const logged = phpMessages( site.id );
	if ( logged.ours.length ) {
		result.problems.push( `${ logged.ours.length } PHP messages caused by the theme, the plugin or the design, the first: ${ logged.ours[ 0 ].slice( 0, 300 ) }` );
	}
	if ( logged.others ) {
		result.notes.push( `${ logged.others } PHP notices from other plugins` );
	}
	await context.close();
	result.seconds = Math.round( ( Date.now() - started ) / 1000 );
	return result;
}

/** Follow every link on the site, starting at the home page, as a visitor who is not logged in. */
async function crawl( browser, site ) {
	const context = await browser.newContext( { viewport: { width: 1440, height: 900 } } );
	const page = await context.newPage();
	const problems = [];
	const external = new Set();
	let scriptErrors = [];
	page.on( 'pageerror', ( error ) => scriptErrors.push( error.message ) );
	page.on( 'request', ( request ) => {
		const url = new URL( request.url() );
		if ( /^https?:$/.test( url.protocol ) && url.origin !== BASE ) {
			external.add( url.host );
		}
	} );

	const queue = [ BASE + '/' ];
	const seen = new Set( queue );
	let images = 0;

	while ( queue.length && seen.size <= MAX_PAGES ) {
		const url = queue.shift();
		const where = url.slice( BASE.length ) || '/';
		scriptErrors = [];
		const response = await page.goto( url, { waitUntil: 'load' } );
		if ( response.status() !== 200 ) {
			problems.push( `${ where }: HTTP ${ response.status() }` );
			continue;
		}
		const found = await page.evaluate( async () => {
			const pictures = [ ...document.querySelectorAll( 'img' ) ];
			pictures.forEach( ( image ) => ( image.loading = 'eager' ) );
			await Promise.all( pictures.map( ( image ) => image.decode().catch( () => {} ) ) );
			return {
				images: pictures.length,
				broken: pictures.filter( ( image ) => ! image.naturalWidth ).map( ( image ) => image.currentSrc || image.src ),
				leftovers: /ofss:\/\//.test( document.documentElement.outerHTML ),
				h1: document.querySelectorAll( 'h1' ).length,
				links: [ ...document.querySelectorAll( 'a[href]' ) ].map( ( link ) => link.href ),
			};
		} );
		images += found.images;
		found.broken.forEach( ( source ) => problems.push( `${ where }: a picture does not load (${ source })` ) );
		if ( found.leftovers ) {
			problems.push( `${ where }: a reference of the package was not replaced` );
		}
		if ( found.h1 !== 1 ) {
			problems.push( `${ where }: ${ found.h1 } main headings` );
		}
		scriptErrors.forEach( ( message ) => problems.push( `${ where }: script error: ${ message }` ) );

		for ( const link of found.links ) {
			const target = new URL( link );
			target.hash = '';
			// Only pages of the site: no admin, no feeds, no files, no links that do something (add to basket, log out, reply).
			// With plain permalinks a page's address is a query (?page_id=12); those are followed, other queries are not.
			const plain = [ ...target.searchParams.keys() ].every( ( key ) => [ 'page_id', 'p', 'cat', 'product', 'product_cat', 'post_type', 'm', 'author' ].includes( key ) );
			if ( target.origin !== BASE || ! plain || /^\/(wp-admin|wp-login\.php|wp-json|feed|comments)\b|\/feed\/?$|\.[a-z0-9]{2,5}$/i.test( target.pathname ) ) {
				continue;
			}
			if ( ! seen.has( target.href ) ) {
				seen.add( target.href );
				queue.push( target.href );
			}
		}
	}

	await page.goto( BASE + '/' );
	fs.mkdirSync( path.join( DIR, 'shots' ), { recursive: true } );
	await page.screenshot( { path: path.join( DIR, 'shots', site.id + '.png' ) } );
	await context.close();

	const foreign = [ ...external ].filter( ( host ) => ! WORDPRESS_HOSTS.includes( host ) );
	if ( foreign.length ) {
		problems.push( 'requests to other sites: ' + foreign.join( ', ' ) );
	}
	const notes = [ ...external ].filter( ( host ) => WORDPRESS_HOSTS.includes( host ) ).map( ( host ) => `WordPress asked ${ host }` );
	return { pagesVisited: seen.size - queue.length, imagesSeen: images, problems, notes, pages: [ ...seen ].slice( 0, seen.size - queue.length ) };
}

/**
 * A few pages on an emulated iPhone (in WebKit, the engine of Safari) and an
 * emulated Android phone (in Chromium), upright and on their side: nothing
 * wider than the screen, a menu button that opens and closes the menu when
 * tapped, nothing to tap that is smaller than 24 by 24 pixels unless it has
 * room around it (WCAG 2.2, criterion 2.5.8), and "Skip to content" as the
 * first stop of the Tab key.
 *
 * This is an emulation: the screen size, the touch input and the browser
 * engine of a phone, not the phone. docs/dev/QA-CHECKLIST.md says what still
 * needs a hand and an eye.
 */
async function phones( pages ) {
	const playwright = require( 'playwright' );
	const problems = [];
	const notes = [];
	const summary = [];

	for ( const [ engine, upright, sideways ] of [ [ 'webkit', 'iPhone 15', 'iPhone 15 landscape' ], [ 'chromium', 'Pixel 7', 'Pixel 7 landscape' ] ] ) {
		let browser;
		try {
			browser = await playwright[ engine ].launch();
		} catch ( error ) {
			notes.push( `${ upright }: not checked, the ${ engine } engine is not installed` );
			continue;
		}
		let small = 0;
		let checked = 0;

		for ( const device of [ upright, sideways ] ) {
			const context = await browser.newContext( { ...playwright.devices[ device ] } );
			const page = await context.newPage();
			for ( const url of pages ) {
				const where = `${ device }, ${ url.slice( BASE.length ) || '/' }`;
				const response = await page.goto( url, { waitUntil: 'load' } ).catch( ( error ) => ( { status: () => error.message.split( '\n' )[ 0 ] } ) );
				if ( response.status() !== 200 ) {
					problems.push( `${ where }: ${ response.status() }` );
					continue;
				}
				await page.waitForTimeout( 400 );
				checked++;

				const seen = await page.evaluate( () => {
					const root = document.documentElement;
					const visible = ( element ) => {
						const box = element.getBoundingClientRect();
						const style = getComputedStyle( element );
						return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && Number( style.opacity ) > 0;
					};
					// A link inside a sentence is as high as its line; the rule for targets leaves those out.
					const inSentence = ( element ) => {
						const block = element.closest( 'p, li, figcaption, blockquote, td, dd' );
						return element.tagName === 'A' && block && block.textContent.trim().length > element.textContent.trim().length + 12;
					};
					const targets = [ ...document.querySelectorAll( 'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, summary' ) ]
						.filter( ( element ) => visible( element ) && ! inSentence( element ) && ! element.closest( '.screen-reader-text, .skip-link, #wpadminbar' ) );
					// WCAG 2.2, 2.5.8: a target under 24 by 24 pixels is still in order when a circle of
					// 24 pixels around its centre touches no other target and no other such circle.
					const boxes = targets.map( ( element ) => {
						const box = element.getBoundingClientRect();
						return { element, box, small: box.width < 24 || box.height < 24, x: box.left + box.width / 2, y: box.top + box.height / 2 };
					} );
					const tooSmall = boxes.filter( ( target ) => target.small && boxes.some( ( other ) => {
						if ( other === target || other.element.contains( target.element ) || target.element.contains( other.element ) || other.element.href && other.element.href === target.element.href ) {
							return false;
						}
						if ( other.small ) {
							return Math.hypot( other.x - target.x, other.y - target.y ) < 24;
						}
						const dx = Math.max( other.box.left - target.x, 0, target.x - other.box.right );
						const dy = Math.max( other.box.top - target.y, 0, target.y - other.box.bottom );
						return Math.hypot( dx, dy ) < 12;
					} ) ).map( ( target ) => target.element );
					return {
						overflow: root.scrollWidth - root.clientWidth,
						small: tooSmall.length,
						example: tooSmall.slice( 0, 2 ).map( ( element ) => {
							const box = element.getBoundingClientRect();
							return `${ ( element.textContent.trim() || element.getAttribute( 'aria-label' ) || element.tagName ).slice( 0, 30 ) } (${ Math.round( box.width ) } by ${ Math.round( box.height ) })`;
						} ),
					};
				} );
				if ( seen.overflow > 1 ) {
					problems.push( `${ where }: the page is ${ seen.overflow } pixels wider than the screen` );
				}
				if ( seen.small ) {
					small += seen.small;
					problems.push( `${ where }: ${ seen.small } things to tap are smaller than 24 by 24 pixels and closer than 24 pixels to the next, for example ${ seen.example.join( '; ' ) }` );
				}

				// The menu button, on the home page with the phone upright.
				if ( device === upright && url === pages[ 0 ] ) {
					const marked = await page.evaluate( () => {
						const inView = ( link ) => {
							const box = link.getBoundingClientRect();
							return box.width > 0 && box.height > 0 && box.top < innerHeight && box.bottom > 0 && box.left < innerWidth && box.right > 0 && getComputedStyle( link ).visibility !== 'hidden';
						};
						window.oftLinks = () => [ ...document.querySelectorAll( 'nav a, [role="navigation"] a' ) ].filter( inView ).length;
						const toggle = [ ...document.querySelectorAll( 'button[aria-expanded], [role="button"][aria-expanded]' ) ].find( ( element ) => {
							const box = element.getBoundingClientRect();
							return box.width >= 20 && box.height >= 20 && box.top < 200 && getComputedStyle( element ).display !== 'none';
						} );
						if ( toggle ) {
							toggle.setAttribute( 'data-oft-toggle', '1' );
						}
						return toggle ? window.oftLinks() : -1;
					} );
					if ( marked < 0 ) {
						problems.push( `${ where }: no menu button` );
					} else {
						const toggle = page.locator( '[data-oft-toggle]' );
						await toggle.tap();
						await page.waitForTimeout( 500 );
						const opened = await page.evaluate( () => ( { links: window.oftLinks(), state: document.querySelector( '[data-oft-toggle]' ).getAttribute( 'aria-expanded' ) } ) );
						if ( opened.state !== 'true' || opened.links < marked + 3 ) {
							problems.push( `${ where }: tapping the menu button did not open the menu (${ opened.links - marked } more links to be seen, the button says expanded="${ opened.state }")` );
						} else {
							await toggle.tap( { timeout: 3000 } ).catch( () => page.keyboard.press( 'Escape' ) );
							await page.waitForTimeout( 500 );
							const closed = await page.evaluate( () => document.querySelector( '[data-oft-toggle]' ).getAttribute( 'aria-expanded' ) );
							if ( closed !== 'false' ) {
								problems.push( `${ where }: the menu did not close again` );
							}
						}
					}
				}
			}
			await context.close();
		}
		summary.push( `${ upright }: ${ checked } page views, ${ small } targets too small and too close` );
		await browser.close();
	}

	// The keyboard: the first stop of the Tab key.
	const browser = await browserType.launch();
	const page = await ( await browser.newContext( { viewport: { width: 1280, height: 800 } } ) ).newPage();
	await page.goto( pages[ 0 ], { waitUntil: 'load' } );
	await page.keyboard.press( 'Tab' );
	const first = await page.evaluate( () => ( document.activeElement.textContent || '' ).trim() );
	if ( ! /skip to (the )?content/i.test( first ) ) {
		problems.push( `keyboard: the first stop of the Tab key is "${ first.slice( 0, 40 ) }", not "Skip to content"` );
	}
	await browser.close();

	return { problems, notes, summary };
}

( async () => {
	const wanted = process.argv.slice( 2 );
	const sites = fs
		.readdirSync( path.join( ROOT, 'starter-sites' ), { withFileTypes: true } )
		.filter( ( entry ) => entry.isDirectory() && fs.existsSync( path.join( ROOT, 'starter-sites', entry.name, 'site.json' ) ) )
		.map( ( entry ) => JSON.parse( fs.readFileSync( path.join( ROOT, 'starter-sites', entry.name, 'site.json' ), 'utf8' ) ) )
		.filter( ( site ) => site.status === 'available' && ( ! wanted.length || wanted.includes( site.id ) ) )
		.sort( ( a, b ) => ( a.order ?? 100 ) - ( b.order ?? 100 ) );

	const browser = await browserType.launch();
	const results = [];
	for ( const site of sites ) {
		const missing = site.requires.plugins.filter( ( plugin ) => plugin.source !== 'wordpress.org' && ! hasPlugin( plugin.slug ) ).map( ( plugin ) => plugin.name );
		if ( missing.length ) {
			// Elementor Pro cannot be downloaded; without it a Pro design is left out, and the report says so.
			results.push( { site: site.id, name: site.name, version: site.version, tier: site.tier, skipped: `${ missing.join( ', ' ) } is not installed on the test site`, problems: [] } );
			console.log( `- ${ site.name }: skipped (${ missing.join( ', ' ) } is not installed)` );
			continue;
		}
		const result = await importDesign( browser, site );
		results.push( result );
		console.log( `${ result.problems.length ? '✗' : '✓' } ${ site.name } ${ site.version }: ${ result.report || 'not imported' } (${ result.pagesVisited ?? 0 } pages visited, ${ result.seconds } s)` );
		result.problems.forEach( ( problem ) => console.log( '    ' + problem ) );
		result.notes.forEach( ( note ) => console.log( '    note: ' + note ) );
		( result.phones || [] ).forEach( ( line ) => console.log( '    ' + line ) );
	}
	await browser.close();
	restore();

	fs.writeFileSync( path.join( DIR, 'report.json' ), JSON.stringify( results, null, '\t' ) + '\n' );
	const failed = results.filter( ( result ) => result.problems.length );
	const skipped = results.filter( ( result ) => result.skipped );
	console.log( `\n${ results.length - failed.length - skipped.length } of ${ results.length } designs imported from the library on a clean site without a problem` + ( skipped.length ? `, ${ skipped.length } skipped` : '' ) + ( failed.length ? `, ${ failed.length } with problems` : '' ) + '.' );
	process.exit( failed.length ? 1 : 0 );
} )();
