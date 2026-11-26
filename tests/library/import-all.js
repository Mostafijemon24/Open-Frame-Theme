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
 * Writes <OFT_DIR>/report.json and prints a table. Exits with 1 when a design
 * could not be imported or a check failed.
 */
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { execFileSync } = require( 'node:child_process' );
const { chromium } = require( 'playwright' );
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
			if ( target.origin !== BASE || target.search || /^\/(wp-admin|wp-login\.php|wp-json|feed|comments)\b|\/feed\/?$|\.[a-z0-9]{2,5}$/i.test( target.pathname ) ) {
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
	return { pagesVisited: seen.size - queue.length, imagesSeen: images, problems, notes };
}

( async () => {
	const wanted = process.argv.slice( 2 );
	const sites = fs
		.readdirSync( path.join( ROOT, 'starter-sites' ), { withFileTypes: true } )
		.filter( ( entry ) => entry.isDirectory() && fs.existsSync( path.join( ROOT, 'starter-sites', entry.name, 'site.json' ) ) )
		.map( ( entry ) => JSON.parse( fs.readFileSync( path.join( ROOT, 'starter-sites', entry.name, 'site.json' ), 'utf8' ) ) )
		.filter( ( site ) => site.status === 'available' && ( ! wanted.length || wanted.includes( site.id ) ) )
		.sort( ( a, b ) => ( a.order ?? 100 ) - ( b.order ?? 100 ) );

	const browser = await chromium.launch();
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
	}
	await browser.close();
	restore();

	fs.writeFileSync( path.join( DIR, 'report.json' ), JSON.stringify( results, null, '\t' ) + '\n' );
	const failed = results.filter( ( result ) => result.problems.length );
	const skipped = results.filter( ( result ) => result.skipped );
	console.log( `\n${ results.length - failed.length - skipped.length } of ${ results.length } designs imported from the library on a clean site without a problem` + ( skipped.length ? `, ${ skipped.length } skipped` : '' ) + ( failed.length ? `, ${ failed.length } with problems` : '' ) + '.' );
	process.exit( failed.length ? 1 : 0 );
} )();
