/**
 * Browser checks for the theme's recommendation of the companion plugin
 * (inc/integrations/starter-sites.php and starter-sites-notice.php).
 *
 *   bash tests/env/setup.sh
 *   node --test --test-concurrency=1 tests/e2e/recommendation.test.js
 *
 * The plugin is not in the WordPress.org Plugin Directory yet. Where a test needs
 * the directory to list it, the test site answers in the directory's place and hands
 * WordPress the package built from this repository (tests/env/mu-plugin.php). The
 * installer, the download check, the unpacking and the activation are WordPress's own.
 * Two tests ask the real WordPress.org: for a plugin that does not exist, and for one
 * that does (Hello Dolly). OFT_OFFLINE=1 skips those two.
 */
const { test, before, after, beforeEach } = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const browserType = require( 'playwright' )[ process.env.OFT_BROWSER || 'chromium' ];
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const { execFileSync } = require( 'node:child_process' );
const { engineNoise, BASE, WP, ROOT, DIR, state, axe, themeErrors, clearErrorLog, login } = require( './helpers' );

const SLUG = 'open-frame-starter-sites';
const FOLDER = path.join( WP, 'wp-content/plugins', SLUG );
const PACKAGE = path.join( ROOT, 'dist', SLUG + '.zip' );
const NOTICE = '.open-frame-starter-notice';
const MAIN = NOTICE + ' .open-frame-starter-notice__main';
const online = process.env.OFT_OFFLINE !== '1';

let browser;
let page; // The administrator.
let errors;
let wasLinked = false;

/** The plugin folder is a link to the working copy in the test site. Take it away without touching the copy. */
function removePlugin() {
	state( 'plugin:starter-sites=off' );
	if ( fs.existsSync( FOLDER ) && fs.lstatSync( FOLDER ).isSymbolicLink() ) {
		fs.unlinkSync( FOLDER );
		wasLinked = true;
	}
	// A folder an earlier test installed. The helper refuses to follow a link.
	state( 'remove-plugin:' + SLUG );
}

/** Put the plugin back as the other test files expect it. */
function restorePlugin() {
	state( 'remove-plugin:' + SLUG );
	if ( wasLinked && ! fs.existsSync( FOLDER ) ) {
		fs.symlinkSync( path.join( ROOT, 'companion', SLUG ), FOLDER );
	}
	state( 'plugin:starter-sites=on' );
}

/** The directory lists the plugin under its expected slug, and its download is our package. */
const listed = () => state( 'starter:reset', 'option:oft_starter_slug=' + SLUG, 'option:oft_directory=zip:' + PACKAGE );

const installed = () => fs.existsSync( path.join( FOLDER, SLUG + '.php' ) );
const active = () => /"starter":"active"/.test( state( 'starter:status' ) );
const open = ( target, url ) => target.goto( BASE + url, { waitUntil: 'domcontentloaded' } );
const text = async ( target, selector ) => ( await target.locator( selector ).innerText() ).replace( /\s+/g, ' ' ).trim();

before( async () => {
	execFileSync( 'bash', [ path.join( ROOT, 'bin/build-plugin-zip.sh' ) ], { stdio: 'ignore' } );
	browser = await browserType.launch();
	page = await ( await browser.newContext( { viewport: { width: 1280, height: 900 } } ) ).newPage();
	page.on( 'pageerror', ( error ) => ! engineNoise( error.message ) && errors.push( error.message ) );
	page.on( 'console', ( message ) => {
		// Other plugins of the test site (Elementor's screens) and the avatar that cannot be fetched are not the theme's.
		if ( message.type() === 'error' && ! /Failed to load resource|Prefetch request denied|^Warning: /.test( message.text() ) && ! engineNoise( message.text() ) ) {
			errors.push( message.text() );
		}
	} );
	errors = [];
	state( 'ofss:rollback', 'reset', 'ofss:clear', 'theme:open-frame', 'plugin:elementor=on', 'plugin:elementor-pro=off', 'plugin:woocommerce=off', 'remove-plugin:hello-dolly', 'user:oft-editor=editor' );
	removePlugin();
	state( 'starter:reset' );
	clearErrorLog();
	await login( page );
} );

after( async () => {
	state( 'starter:reset', 'remove-plugin:hello-dolly', 'theme:open-frame' );
	restorePlugin();
	await browser.close();
} );

beforeEach( () => {
	errors = [];
} );

/* -------------------------------------------------------------------------
   While the slug is the placeholder
   ---------------------------------------------------------------------- */
test( 'placeholder slug: the theme recommends nothing and loads no installer', async () => {
	state( 'starter:reset' );
	assert.match( state( 'starter:status' ), /"slug":"","status":"pending","tgmpa":false/ );

	for ( const url of [ '/wp-admin/index.php', '/wp-admin/themes.php', '/wp-admin/plugins.php' ] ) {
		await open( page, url );
		assert.equal( await page.locator( NOTICE ).count(), 0, `no notice on ${ url }` );
		assert.equal( await page.locator( '#adminmenu a[href*="open-frame-recommended-plugins"]' ).count(), 0, `no installer screen in the menu on ${ url }` );
	}

	const response = await open( page, '/wp-admin/themes.php?page=open-frame-recommended-plugins' );
	assert.equal( response.status(), 403, 'the installer screen does not exist' );
	assert.deepEqual( errors, [] );
} );

/* -------------------------------------------------------------------------
   Status A: not installed
   ---------------------------------------------------------------------- */
test( 'not installed: one notice on the Dashboard, Themes and Plugins screens, nowhere else', async () => {
	listed();
	assert.match( state( 'starter:status' ), /"status":"not-installed","tgmpa":true/ );

	for ( const url of [ '/wp-admin/index.php', '/wp-admin/themes.php', '/wp-admin/plugins.php' ] ) {
		await open( page, url );
		assert.equal( await page.locator( NOTICE ).count(), 1, `one notice on ${ url }` );
	}
	for ( const url of [ '/wp-admin/edit.php', '/wp-admin/options-general.php', '/wp-admin/customize.php', '/wp-admin/themes.php?page=open-frame-recommended-plugins', '/wp-admin/plugin-install.php' ] ) {
		await open( page, url );
		assert.equal( await page.locator( NOTICE ).count(), 0, `no notice on ${ url }` );
	}

	await open( page, '/wp-admin/index.php' );
	assert.equal( await page.locator( NOTICE ).getAttribute( 'data-status' ), 'not-installed' );
	assert.match( await text( page, NOTICE ), /Open Frame Starter Sites is a free, optional plugin/ );
	assert.equal( await text( page, MAIN ), 'Install Starter Sites' );
	assert.equal( await page.locator( NOTICE + ' .open-frame-starter-notice__more' ).getAttribute( 'href' ), `https://wordpress.org/plugins/${ SLUG }/` );
	assert.equal( await page.locator( NOTICE + ' .open-frame-starter-notice__dismiss' ).count(), 1 );
	assert.equal( await page.locator( NOTICE + ' .notice-dismiss' ).count(), 1, 'WordPress added its close button' );

	// Without JavaScript the button leads to the installer screen of TGM Plugin Activation, with a nonce.
	assert.match( await page.locator( MAIN ).getAttribute( 'href' ), /themes\.php\?page=open-frame-recommended-plugins&plugin=open-frame-starter-sites&tgmpa-install=install-plugin&tgmpa-nonce=[a-f0-9]{10}$/ );

	assert.deepEqual( await axe( page, NOTICE ), [], 'accessibility of the notice' );
	assert.equal( installed(), false, 'looking installs nothing' );
	assert.deepEqual( errors, [] );
} );

test( 'not installed: the installer screen lists the plugin as recommended, from the WordPress repository', async () => {
	listed();
	await open( page, '/wp-admin/themes.php?page=open-frame-recommended-plugins' );
	assert.equal( await text( page, '.wrap h1' ), 'Recommended Plugins' );
	const row = await text( page, '#the-list tr' );
	assert.match( row, /Open Frame Starter Sites/ );
	assert.match( row, /WordPress Repository/ );
	assert.match( row, /Recommended/ );
	assert.doesNotMatch( row, /Required/ );
	assert.equal( installed(), false );
	assert.deepEqual( errors, [] );
} );

test( 'activating the theme installs nothing, activates nothing and stays on the Themes screen', async () => {
	listed();
	state( 'theme:twentytwentyfive' );
	await open( page, '/wp-admin/themes.php' );
	assert.equal( await page.locator( NOTICE ).count(), 0, 'another theme is active: no notice' );

	await Promise.all( [
		page.waitForURL( /themes\.php\?activated=true/, { waitUntil: 'domcontentloaded' } ),
		page.locator( '.theme[data-slug="open-frame"] a.activate' ).click(),
	] );
	assert.match( page.url(), /\/wp-admin\/themes\.php/, 'no redirect to another screen' );
	assert.equal( await page.locator( NOTICE ).count(), 1, 'the recommendation is shown' );
	assert.equal( installed(), false, 'nothing was installed' );
	assert.equal( active(), false );
	assert.deepEqual( errors, [] );
} );

/* -------------------------------------------------------------------------
   The journey: install, activate, open
   ---------------------------------------------------------------------- */
test( 'install, then activate, then open: three clicks, each one the user\'s', async () => {
	listed();
	await open( page, '/wp-admin/index.php' );

	await page.locator( MAIN ).click();
	await page.waitForSelector( NOTICE + '[data-status="inactive"]', { timeout: 60000 } );
	assert.equal( installed(), true, 'the plugin was installed' );
	assert.equal( active(), false, 'installing did not activate it' );
	assert.match( page.url(), /\/wp-admin\/index\.php/, 'still on the Dashboard' );
	assert.equal( await text( page, MAIN ), 'Activate Starter Sites' );
	assert.match( await text( page, NOTICE ), /is installed but not active/ );
	assert.deepEqual( await axe( page, NOTICE ), [], 'accessibility of the notice' );

	await Promise.all( [ page.waitForURL( /plugins\.php/, { waitUntil: 'domcontentloaded' } ), page.locator( MAIN ).click() ] );
	assert.equal( active(), true, 'the plugin is active' );
	assert.match( await text( page, '#message' ), /Plugin activated/ );
	assert.equal( await page.locator( NOTICE ).getAttribute( 'data-status' ), 'active' );
	assert.equal( await text( page, MAIN ), 'Open Starter Sites' );
	assert.equal( await page.locator( NOTICE + ' .open-frame-starter-notice__more' ).count(), 0 );
	assert.equal( await page.locator( '#adminmenu a[href*="open-frame-recommended-plugins"]' ).count(), 0, 'nothing left to recommend: the installer screen is gone' );

	await Promise.all( [ page.waitForURL( /page=open-frame-starter-sites/, { waitUntil: 'domcontentloaded' } ), page.locator( MAIN ).click() ] );
	await page.waitForSelector( '#ofss-root' );
	assert.equal( await text( page, '.wrap h1' ), 'Starter Sites' );

	// The notice has done its work and does not come back.
	await open( page, '/wp-admin/index.php' );
	assert.equal( await page.locator( NOTICE ).count(), 0 );
	assert.deepEqual( errors, [] );
} );

test( 'already active: the notice offers to open it, and says so when Elementor is missing', async () => {
	state( 'starter:reset', 'option:oft_starter_slug=' + SLUG, 'plugin:starter-sites=on', 'plugin:elementor=on' );
	await open( page, '/wp-admin/themes.php' );
	assert.equal( await page.locator( NOTICE ).getAttribute( 'data-status' ), 'active' );
	assert.doesNotMatch( await text( page, NOTICE ), /Elementor, which is not active/ );

	state( 'plugin:elementor=off' );
	await open( page, '/wp-admin/themes.php' );
	assert.match( await text( page, NOTICE ), /made with Elementor, which is not active on this site/ );
	assert.match( await page.locator( MAIN ).getAttribute( 'href' ), /themes\.php\?page=open-frame-starter-sites$/ );
	state( 'plugin:elementor=on' );
	assert.deepEqual( errors, [] );
} );

test( 'deactivated: the notice offers to activate it again', async () => {
	state( 'starter:reset', 'option:oft_starter_slug=' + SLUG, 'plugin:starter-sites=off' );
	await open( page, '/wp-admin/plugins.php' );
	assert.equal( await page.locator( NOTICE ).getAttribute( 'data-status' ), 'inactive' );
	assert.match( await page.locator( MAIN ).getAttribute( 'href' ), /plugins\.php\?action=activate&plugin=open-frame-starter-sites%2Fopen-frame-starter-sites\.php&_wpnonce=[a-f0-9]{10}$/ );
	assert.deepEqual( errors, [] );
} );

/* -------------------------------------------------------------------------
   Dismissing
   ---------------------------------------------------------------------- */
test( 'dismissed: with the link, with the close button and without JavaScript, and it stays away', async () => {
	removePlugin();

	// The "Dismiss" link.
	listed();
	await open( page, '/wp-admin/index.php' );
	await Promise.all( [
		page.waitForResponse( ( response ) => response.url().includes( 'admin-ajax.php' ) && response.request().postData()?.includes( 'open_frame_dismiss_starter_notice' ) ),
		page.locator( NOTICE + ' .open-frame-starter-notice__dismiss' ).click(),
	] );
	assert.equal( await page.locator( NOTICE ).count(), 0, 'gone at once' );
	for ( const url of [ '/wp-admin/index.php', '/wp-admin/themes.php', '/wp-admin/plugins.php' ] ) {
		await open( page, url );
		assert.equal( await page.locator( NOTICE ).count(), 0, `stays away on ${ url }` );
	}

	// The close button WordPress adds.
	listed();
	await open( page, '/wp-admin/themes.php' );
	await Promise.all( [
		page.waitForResponse( ( response ) => response.url().includes( 'admin-ajax.php' ) && response.request().postData()?.includes( 'open_frame_dismiss_starter_notice' ) ),
		page.locator( NOTICE + ' .notice-dismiss' ).click(),
	] );
	await open( page, '/wp-admin/themes.php' );
	assert.equal( await page.locator( NOTICE ).count(), 0, 'stays away after the close button' );

	// Without JavaScript the link itself does it, and returns to the same screen.
	listed();
	const context = await browser.newContext( { javaScriptEnabled: false } );
	const plain = await context.newPage();
	await login( plain );
	await open( plain, '/wp-admin/plugins.php' );
	await plain.locator( NOTICE + ' .open-frame-starter-notice__dismiss' ).click();
	await plain.waitForURL( /\/wp-admin\/plugins\.php$/ );
	assert.equal( await plain.locator( NOTICE ).count(), 0 );
	await context.close();

	// The choice belongs to the user who made it.
	assert.match( state( 'starter:status' ), /"dismissed":true/ );
	assert.equal( installed(), false );
	assert.deepEqual( errors, [] );
} );

/* -------------------------------------------------------------------------
   When it goes wrong
   ---------------------------------------------------------------------- */
test( 'WordPress.org cannot be reached: an understandable message, and "Try again" works once it can', async () => {
	removePlugin();
	state( 'starter:reset', 'option:oft_starter_slug=' + SLUG, 'option:oft_directory=down' );
	await open( page, '/wp-admin/index.php' );
	await page.locator( MAIN ).click();
	await page.waitForSelector( NOTICE + '.notice-error', { timeout: 60000 } );
	assert.match( await text( page, NOTICE + ' .open-frame-starter-notice__result' ), /could not get this plugin from the WordPress\.org Plugin Directory.*Nothing was installed\./ );
	assert.equal( await text( page, MAIN ), 'Try again' );
	assert.equal( installed(), false );
	assert.deepEqual( await axe( page, NOTICE ), [], 'accessibility of the notice with an error' );

	// The connection is back; the same button, without reloading.
	state( 'option:oft_directory=zip:' + PACKAGE );
	await page.locator( MAIN ).click();
	await page.waitForSelector( NOTICE + '[data-status="inactive"]', { timeout: 60000 } );
	assert.equal( installed(), true );
	assert.equal( active(), false );
	assert.deepEqual( errors, [] );
} );

test( 'the download is broken: WordPress\'s reason is shown, nothing is left behind, and it can be tried again', async () => {
	removePlugin();
	const broken = path.join( DIR, 'broken-package.zip' );
	fs.writeFileSync( broken, 'This is not a ZIP archive.' );
	state( 'starter:reset', 'option:oft_starter_slug=' + SLUG, 'option:oft_directory=zip:' + broken );

	await open( page, '/wp-admin/themes.php' );
	await page.locator( MAIN ).click();
	await page.waitForSelector( NOTICE + '.notice-error', { timeout: 60000 } );
	const reason = await text( page, NOTICE + ' .open-frame-starter-notice__result' );
	assert.match( reason, /^The plugin could not be installed: .{10,}/ );
	assert.doesNotMatch( reason, /[<>]|&#?\w+;/, 'the reason is shown as text, without markup' );
	assert.equal( await text( page, MAIN ), 'Try again' );
	assert.equal( installed(), false );
	assert.equal( fs.existsSync( FOLDER ), false, 'no half-installed folder' );
	assert.deepEqual( errors, [] );
} );

test( 'the plugin is not in the directory (asked of the real WordPress.org): it says so and installs nothing', { skip: ! online }, async () => {
	removePlugin();
	// A slug nobody will register, so the answer stays "not found" after the real plugin is published.
	state( 'starter:reset', 'option:oft_starter_slug=open-frame-no-such-plugin-in-the-directory' );
	await open( page, '/wp-admin/index.php' );
	assert.equal( await page.locator( NOTICE ).getAttribute( 'data-status' ), 'not-installed' );
	await page.locator( MAIN ).click();
	await page.waitForSelector( NOTICE + '.notice-error', { timeout: 60000 } );
	assert.match( await text( page, NOTICE + ' .open-frame-starter-notice__result' ), /It may not be published there yet/ );
	assert.equal( await text( page, MAIN ), 'Try again' );
	assert.equal( await page.locator( NOTICE + ' .open-frame-starter-notice__more' ).getAttribute( 'href' ), 'https://wordpress.org/plugins/open-frame-no-such-plugin-in-the-directory/' );
	assert.deepEqual( errors, [] );
} );

test( 'a plugin that is in the directory is installed from the real WordPress.org, not activated', { skip: ! online }, async () => {
	// Hello Dolly stands in: it shows that the button reaches the real directory and its real download.
	state( 'starter:reset', 'remove-plugin:hello-dolly', 'option:oft_starter_slug=hello-dolly' );
	await open( page, '/wp-admin/index.php' );
	await page.locator( MAIN ).click();
	await page.waitForSelector( NOTICE + '[data-status="inactive"]', { timeout: 90000 } );
	const status = state( 'starter:status' );
	assert.match( status, /"slug":"hello-dolly","status":"inactive"/ );
	assert.match( status, /"file":"hello-dolly\\\/hello\.php"/ );
	state( 'remove-plugin:hello-dolly' );
	assert.deepEqual( errors, [] );
} );

/* -------------------------------------------------------------------------
   Without JavaScript, and without the rights
   ---------------------------------------------------------------------- */
test( 'without JavaScript: the button installs through the installer screen, and does not activate', async () => {
	removePlugin();
	listed();
	const context = await browser.newContext( { javaScriptEnabled: false } );
	const plain = await context.newPage();
	await login( plain );
	await open( plain, '/wp-admin/index.php' );
	await plain.locator( MAIN ).click();
	await plain.waitForURL( /page=open-frame-recommended-plugins/ );
	assert.match( await text( plain, '.wrap' ), /Successfully installed the plugin/ );
	assert.equal( installed(), true );
	assert.equal( active(), false, 'installing did not activate it' );

	await open( plain, '/wp-admin/index.php' );
	assert.equal( await plain.locator( NOTICE ).getAttribute( 'data-status' ), 'inactive' );
	await context.close();
} );

test( 'a user who may not install plugins sees no notice and cannot use its requests', async () => {
	removePlugin();
	listed();
	const context = await browser.newContext();
	const editor = await context.newPage();
	await login( editor, 'oft-editor' );
	await open( editor, '/wp-admin/index.php' );
	assert.equal( await editor.locator( NOTICE ).count(), 0 );
	assert.equal( await editor.locator( '#adminmenu a[href*="open-frame-recommended-plugins"]' ).count(), 0 );

	const answers = await editor.evaluate( async () => {
		const send = async ( fields ) => {
			const response = await fetch( '/wp-admin/admin-ajax.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams( fields ).toString() } );
			return response.status + ' ' + ( await response.text() ).slice( 0, 60 );
		};
		return {
			install: await send( { action: 'install-plugin', slug: 'open-frame-starter-sites', _ajax_nonce: 'x' } ),
			dismiss: await send( { action: 'open_frame_dismiss_starter_notice', nonce: 'x' } ),
		};
	} );
	assert.match( answers.install, /^403 / );
	assert.match( answers.dismiss, /^403 / );

	const response = await open( editor, '/wp-admin/themes.php?page=open-frame-recommended-plugins&plugin=open-frame-starter-sites&tgmpa-install=install-plugin&tgmpa-nonce=x' );
	assert.equal( response.status(), 403 );
	assert.equal( installed(), false );
	await context.close();

	// The administrator's own requests need their nonce too.
	await open( page, '/wp-admin/index.php' );
	const forged = await page.evaluate( async () => {
		const response = await fetch( '/wp-admin/admin-ajax.php', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'action=open_frame_dismiss_starter_notice&nonce=wrong' } );
		return response.status;
	} );
	assert.equal( forged, 403 );
	assert.equal( await page.locator( NOTICE ).count(), 1, 'a request without the nonce dismissed nothing' );
} );

/* -------------------------------------------------------------------------
   The theme without the plugin, and the error log
   ---------------------------------------------------------------------- */
test( 'the front of the site loads nothing of the recommendation, and PHP reported nothing', async () => {
	removePlugin();
	listed();
	const visitor = await ( await browser.newContext() ).newPage();
	const response = await open( visitor, '/' );
	assert.equal( response.status(), 200 );
	const html = await visitor.content();
	assert.doesNotMatch( html, /admin-starter-notice|tgmpa|open-frame-starter-notice/ );
	assert.match( html, /<!-- oft-installer:absent -->/, 'the installer library is not loaded for visitors' );
	await visitor.context().close();

	assert.deepEqual( themeErrors().filter( ( line ) => ! /broken-package/.test( line ) ), [], 'nothing from the theme or the installer in the PHP error log' );
} );
