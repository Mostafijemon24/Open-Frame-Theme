/**
 * Shared helpers for the browser checks.
 *
 * The checks run against the disposable site built by tests/env/setup.sh and
 * change its state (active plugins, theme mods) through tests/env/state.php.
 */
const { execFileSync } = require( 'node:child_process' );
const path = require( 'node:path' );
const os = require( 'node:os' );
const fs = require( 'node:fs' );

const ROOT = path.resolve( __dirname, '../..' );
const DIR = process.env.OFT_DIR || path.join( process.env.TMPDIR || os.tmpdir(), 'open-frame-wp-test' );
const PORT = process.env.OFT_PORT || '8890';
const WP = path.join( DIR, 'wordpress' );
const BASE = `http://localhost:${ PORT }`;

/** Widths every responsive check runs at. */
const WIDTHS = [ 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920 ];

/** Run tests/env/state.php with the given arguments and return its output. */
function state( ...args ) {
	return execFileSync( 'php', [ path.join( ROOT, 'tests/env/run.php' ), WP, path.join( ROOT, 'tests/env/state.php' ), ...args ], {
		encoding: 'utf8',
		stdio: [ 'ignore', 'pipe', 'ignore' ],
	} );
}

/** Run another helper script from tests/env inside the test site. */
function runScript( script, ...args ) {
	return execFileSync( 'php', [ path.join( ROOT, 'tests/env/run.php' ), WP, path.join( ROOT, 'tests/env', script ), ...args ], {
		encoding: 'utf8',
		stdio: [ 'ignore', 'pipe', 'ignore' ],
	} );
}

/** Whether Elementor Pro is installed in the test site (it is optional). */
function hasElementorPro() {
	return fs.existsSync( path.join( WP, 'wp-content/plugins/elementor-pro/elementor-pro.php' ) );
}

/** Whether a plugin folder exists in the test site. */
function hasPlugin( slug ) {
	return fs.existsSync( path.join( WP, 'wp-content/plugins', slug ) );
}

/** Make the mock starter site library answer in a given way (see tests/fixtures/cloud/router.php). */
function cloud( mode ) {
	fs.writeFileSync( path.join( DIR, 'cloud-mode' ), mode + '\n' );
}

/** How many times the mock library was asked for the catalog. */
function cloudRequests() {
	const file = path.join( DIR, 'cloud-requests' );
	return fs.existsSync( file ) ? parseInt( fs.readFileSync( file, 'utf8' ), 10 ) || 0 : 0;
}

/**
 * Accessibility problems in part of a page, found by axe-core.
 *
 * @param {Object}   [options]
 * @param {string[]} [options.disable] Rules to leave out, for known problems in another product's markup.
 * @param {string[]} [options.exclude] Parts inside the selector that belong to another product and are not checked.
 * @return {string[]} One line per violation, empty when there are none.
 */
async function axe( page, selector, { disable = [], exclude = [] } = {} ) {
	await page.addScriptTag( { path: require.resolve( 'axe-core/axe.min.js' ) } );
	const rules = Object.fromEntries( disable.map( ( rule ) => [ rule, { enabled: false } ] ) );
	const results = await page.evaluate( ( [ sel, off, not ] ) => window.axe.run( { include: [ [ sel ] ], exclude: not.map( ( part ) => [ part ] ) }, { runOnly: [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice' ], rules: off } ), [ selector, rules, exclude ] );
	return results.violations.map( ( violation ) => `${ violation.id }: ${ violation.help } (${ violation.nodes.map( ( node ) => node.target.join( ' ' ) ).slice( 0, 3 ).join( ', ' ) })` );
}

/** IDs of the fixture pages, keyed by slug. */
function pageIds() {
	return JSON.parse( state( 'ids' ).trim().split( '\n' ).pop() );
}

/** Lines the theme or the companion plugin wrote to the PHP error log. */
function themeErrors() {
	const log = path.join( WP, 'wp-content/debug.log' );
	if ( ! fs.existsSync( log ) ) {
		return [];
	}
	return fs
		.readFileSync( log, 'utf8' )
		.split( '\n' )
		.filter( ( line ) => line.includes( '/themes/open-frame/' ) || line.includes( 'open-frame-starter-sites' ) || line.includes( ROOT + '/' ) );
}

/** Forget earlier PHP errors. */
function clearErrorLog() {
	fs.rmSync( path.join( WP, 'wp-content/debug.log' ), { force: true } );
}

/**
 * Open a page and collect what went wrong while it loaded.
 *
 * @return {{ status: number, errors: string[] }}
 */
async function visit( page, url, options = {} ) {
	const errors = [];
	const onPageError = ( error ) => errors.push( error.message );
	const onConsole = ( message ) => {
		// Missing sample images of the test store are not the theme's concern.
		if ( message.type() === 'error' && ! /Failed to load resource|Prefetch request denied: URL must be secure/.test( message.text() ) ) {
			errors.push( message.text() );
		}
	};
	page.on( 'pageerror', onPageError );
	page.on( 'console', onConsole );
	const response = await page.goto( url.startsWith( 'http' ) ? url : BASE + url, { waitUntil: options.waitUntil || 'load' } );
	page.off( 'pageerror', onPageError );
	page.off( 'console', onConsole );
	return { status: response.status(), errors };
}

/** Facts about the page that most checks need. */
function facts( page ) {
	return page.evaluate( () => {
		const root = document.documentElement;
		return {
			overflow: root.scrollWidth - root.clientWidth,
			width: root.clientWidth,
			mains: document.querySelectorAll( 'main' ).length,
			hasMainTarget: !! document.querySelector( 'main#main' ),
			skipLink: document.querySelector( '.skip-link' )?.getAttribute( 'href' ) || null,
			header: !! document.querySelector( '#masthead' ),
			footer: !! document.querySelector( '#colophon' ),
			bodyClasses: [ ...document.body.classList ],
			stylesheets: [ ...document.querySelectorAll( 'link[rel="stylesheet"]' ) ].map( ( link ) => link.id ),
		};
	} );
}

/** Left edge and width of the first element matching a selector, or null. */
function box( page, selector ) {
	return page.evaluate( ( sel ) => {
		const element = document.querySelector( sel );
		if ( ! element ) {
			return null;
		}
		const rect = element.getBoundingClientRect();
		return { left: Math.round( rect.left ), top: Math.round( rect.top + window.scrollY ), width: Math.round( rect.width ), height: Math.round( rect.height ) };
	}, selector );
}

/** A computed style property of the first element matching a selector. */
function style( page, selector, property ) {
	return page.evaluate( ( [ sel, prop ] ) => {
		const element = document.querySelector( sel );
		return element ? getComputedStyle( element )[ prop ] : null;
	}, [ selector, property ] );
}

/**
 * Whether a script error comes from the browser engine or from Elementor's editor rather than from the page under test.
 *
 * Only Firefox and WebKit report these. Both report downloads that were still running when a page was left
 * as failed: parts of the Elementor editor's preview ("failed to load chunk") and requests of the WordPress
 * dashboard ("due to access control checks" is WebKit's wording). In Firefox, Elementor 4.4's editor also
 * sometimes fails to load its "global classes" (editor-global-classes.js) and says so with a bare TypeError.
 */
function engineNoise( message ) {
	const engine = process.env.OFT_BROWSER || 'chromium';
	if ( engine === 'chromium' ) {
		return false;
	}
	return /^(Error: )?\[elementor\] failed to load chunk |due to access control checks\.?$/.test( message )
		|| ( engine === 'firefox' && /^can't convert undefined to object$|frontendIndex is undefined/.test( message ) );
}

/** Log in as the administrator, or as another user of the test site (password "password"). */
async function login( page, user = 'admin' ) {
	// Tried twice: the test site answers one request at a time, and now and then the login
	// waits behind a request the page before it left unfinished (seen in Firefox only).
	for ( let attempt = 1; ; attempt++ ) {
		try {
			await page.goto( BASE + '/wp-login.php' );
			await page.fill( '#user_login', user );
			await page.fill( '#user_pass', 'password' );
			// Until the dashboard's own markup is there, not until its last picture has loaded: the
			// dashboard asks another site for the user's avatar, and where that site cannot be reached
			// the wait for "everything loaded" can outlast the test.
			await Promise.all( [ page.waitForURL( /wp-admin/, { waitUntil: 'domcontentloaded', timeout: 45000 } ), page.click( '#wp-submit' ) ] );
			return;
		} catch ( error ) {
			if ( attempt === 2 ) {
				throw error;
			}
		}
	}
}

module.exports = { engineNoise, BASE, WIDTHS, WP, ROOT, DIR, state, runScript, hasElementorPro, hasPlugin, cloud, cloudRequests, axe, pageIds, themeErrors, clearErrorLog, visit, facts, box, style, login };
