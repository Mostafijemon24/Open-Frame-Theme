/**
 * Browser checks for the Starter Sites screen of the companion plugin.
 *
 *   bash tests/env/setup.sh
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * The library is the mock in tests/fixtures/cloud; each test tells it how to
 * answer. Installing a plugin is real: it is downloaded from WordPress.org.
 */
const { test, before, after, beforeEach } = require( 'node:test' );
const assert = require( 'node:assert/strict' );
const { chromium } = require( 'playwright' );
const { BASE, state, hasElementorPro, hasPlugin, cloud, cloudRequests, axe, themeErrors, login } = require( './helpers' );

const SCREEN = BASE + '/wp-admin/themes.php?page=open-frame-starter-sites';

let browser;
let page;
let errors;

before( async () => {
	browser = await chromium.launch();
	page = await ( await browser.newContext( { viewport: { width: 1440, height: 1000 } } ) ).newPage();
	page.on( 'pageerror', ( error ) => errors.push( error.message ) );
	page.on( 'console', ( message ) => {
		// The avatar in the toolbar is requested from another site, which the test site cannot reach.
		if ( message.type() === 'error' && ! /Failed to load resource/.test( message.text() ) ) {
			errors.push( message.text() );
		}
	} );
	errors = [];
	state( 'reset', 'ofss:clear', 'theme:open-frame', 'plugin:starter-sites=on', 'plugin:elementor=on', 'plugin:elementor-pro=off', 'plugin:woocommerce=off', 'remove-plugin:hello-dolly' );
	cloud( 'ok' );
	await login( page );
} );

after( async () => {
	cloud( 'ok' );
	state( 'ofss:clear', 'theme:open-frame', 'plugin:elementor-pro=off', 'remove-plugin:hello-dolly' );
	await browser.close();
} );

beforeEach( () => {
	errors = [];
	cloud( 'ok' );
} );

/** Open the screen and wait until it shows the grid, the empty state or an error. */
async function open() {
	await page.goto( SCREEN );
	await page.waitForSelector( '.ofss-grid, .ofss-empty', { timeout: 30000 } );
}

const cards = () => page.locator( '.ofss-card' );
const names = () => page.locator( '.ofss-card__title' ).allTextContents();
const dialog = () => page.getByRole( 'dialog' );

/** Open the details of a design and wait for its requirement list. */
async function details( name ) {
	await page.getByRole( 'button', { name: 'View details: ' + name, exact: true } ).click();
	await dialog().locator( '.ofss-checks' ).waitFor();
}

/** The row of the requirement list that starts with a label. */
const requirement = ( label ) => dialog().locator( '.ofss-check' ).filter( { has: page.locator( 'strong', { hasText: new RegExp( '^' + label + '$' ) } ) } );

test( 'the screen lists the ten designs', async () => {
	await open();

	assert.equal( await cards().count(), 10 );
	assert.deepEqual( await names(), [ 'Business', 'Creative Agency', 'SaaS', 'Portfolio', 'Shop', 'Restaurant', 'Real Estate', 'Education', 'Medical', 'Magazine' ] );

	const broken = await page.evaluate( async () => {
		const images = [ ...document.querySelectorAll( '.ofss-card img' ) ];
		await Promise.all( images.map( ( image ) => image.decode().catch( () => {} ) ) );
		return images.filter( ( image ) => ! image.naturalWidth ).length;
	} );
	assert.equal( broken, 0, 'every preview image loads' );

	assert.equal( await page.locator( '.ofss-badge--free' ).count(), 5, 'five free designs' );
	assert.equal( await page.locator( '.ofss-badge--pro' ).count(), 5, 'five designs that need Elementor Pro' );
	assert.equal( await page.locator( '.ofss-badge--soon' ).count(), 10, 'all marked as coming soon' );
	assert.equal( await page.getByRole( 'button', { name: /import/i } ).count(), 0, 'no import button before importing exists' );
	assert.equal( await page.getByRole( 'button', { name: 'Import history' } ).count(), 0, 'no history section without history' );
	assert.deepEqual( errors, [] );
} );

test( 'the screen fits phones, tablets and desktops', async () => {
	for ( const width of [ 360, 390, 782, 1024, 1440, 1920 ] ) {
		await page.setViewportSize( { width, height: 900 } );
		await open();
		const overflow = await page.evaluate( () => document.documentElement.scrollWidth - document.documentElement.clientWidth );
		assert.equal( overflow, 0, `no horizontal scrolling at ${ width }` );

		await details( 'Shop' );
		const box = await dialog().boundingBox();
		assert.ok( box.x >= 0 && box.x + box.width <= width + 1, `the details fit the window at ${ width }` );
		await page.keyboard.press( 'Escape' );
	}
	await page.setViewportSize( { width: 1440, height: 1000 } );
	assert.deepEqual( errors, [] );
} );

test( 'search and filters narrow the list', async () => {
	await open();

	await page.getByRole( 'searchbox', { name: 'Search designs' } ).fill( 'clinic' );
	await assert.doesNotReject( page.waitForFunction( () => document.querySelectorAll( '.ofss-card' ).length === 1 ) );
	assert.deepEqual( await names(), [ 'Medical' ], 'search looks in the tags' );

	await page.getByRole( 'searchbox', { name: 'Search designs' } ).fill( 'STORE products' );
	await page.waitForFunction( () => document.querySelector( '.ofss-card__title' )?.textContent === 'Shop' );
	assert.deepEqual( await names(), [ 'Shop' ], 'every word has to match, in any case' );

	await page.getByRole( 'searchbox', { name: 'Search designs' } ).fill( '' );
	await page.getByRole( 'combobox', { name: 'Category' } ).selectOption( { label: 'Creative' } );
	assert.deepEqual( await names(), [ 'Creative Agency', 'Portfolio' ] );

	await page.getByRole( 'combobox', { name: 'Elementor version' } ).selectOption( 'free' );
	assert.deepEqual( await names(), [ 'Portfolio' ], 'filters combine' );

	await page.getByRole( 'combobox', { name: 'Category' } ).selectOption( '' );
	assert.equal( await cards().count(), 5 );
	await page.getByRole( 'combobox', { name: 'Elementor version' } ).selectOption( 'pro' );
	assert.deepEqual( await names(), [ 'Creative Agency', 'SaaS', 'Shop', 'Real Estate', 'Magazine' ] );

	// Nothing matches: say so, and offer the way back.
	await page.getByRole( 'searchbox', { name: 'Search designs' } ).fill( 'zzzz' );
	await page.getByRole( 'heading', { name: 'No designs match your search' } ).waitFor();
	await page.getByRole( 'button', { name: 'Show all designs' } ).click();
	assert.equal( await cards().count(), 10 );
	assert.equal( await page.getByRole( 'searchbox', { name: 'Search designs' } ).inputValue(), '' );

	// Screen readers are told how many are left.
	await page.getByRole( 'combobox', { name: 'Elementor version' } ).selectOption( 'free' );
	await page.waitForFunction( () => /5 designs shown/.test( document.querySelector( '#a11y-speak-polite' )?.textContent || '' ) );
	assert.deepEqual( errors, [] );
} );

test( 'the details open and close with the keyboard, and focus returns', async () => {
	await open();

	const trigger = page.getByRole( 'button', { name: 'View details: Business', exact: true } );
	await trigger.focus();
	await page.keyboard.press( 'Enter' );
	await dialog().locator( '.ofss-checks' ).waitFor();

	assert.ok( await page.evaluate( () => document.querySelector( '[role="dialog"]' ).contains( document.activeElement ) ), 'focus moves into the dialog' );
	assert.ok( await dialog().getByRole( 'heading', { name: 'Business', level: 1 } ).count(), 'the dialog is named after the design' );

	// Tab stays inside the dialog.
	for ( let press = 0; press < 12; press++ ) {
		await page.keyboard.press( 'Tab' );
		assert.ok( await page.evaluate( () => document.querySelector( '[role="dialog"]' ).contains( document.activeElement ) ), 'focus stays in the dialog' );
	}

	await page.keyboard.press( 'Escape' );
	await dialog().waitFor( { state: 'detached' } );
	assert.ok( await trigger.evaluate( ( element ) => element === document.activeElement ), 'focus returns to the button that opened the dialog' );

	// The preview is a mouse shortcut for the same thing, and is not a second tab stop.
	assert.equal( await page.locator( '.ofss-card__preview' ).first().getAttribute( 'tabindex' ), '-1' );
	await page.locator( '.ofss-card__preview' ).first().click();
	await dialog().locator( '.ofss-checks' ).waitFor();
	await dialog().getByRole( 'button', { name: 'Close' } ).click();
	assert.deepEqual( errors, [] );
} );

test( 'the details say what a design needs and where each part is edited', async () => {
	await open();
	await details( 'Business' );

	assert.match( await dialog().locator( '.ofss-details__state' ).textContent(), /on its way and cannot be imported yet/ );
	for ( const label of [ 'WordPress', 'PHP', 'Open Frame theme', 'ZIP support on the server', 'Uploads folder can be written to', 'Elementor' ] ) {
		assert.ok( await requirement( label ).evaluate( ( row ) => row.classList.contains( 'ofss-check--ok' ) ), `${ label } is met` );
	}
	assert.match( await requirement( 'WordPress' ).textContent(), /needs 6\.8 or newer, you have \d/ );
	assert.match( await requirement( 'Elementor' ).textContent(), /Active/ );
	assert.equal( await requirement( 'Open Frame Starter Sites plugin' ).count(), 0, 'no plugin-version check for a design that is not out yet' );

	assert.equal( await dialog().locator( '.ofss-pages li' ).count(), 12 );
	assert.equal( await dialog().getByRole( 'heading', { name: '12 pages included' } ).count(), 1 );

	const editable = await dialog().locator( '.ofss-editable tr' ).allTextContents();
	assert.ok( editable.includes( 'HeaderEdit with Elementor' ) );
	assert.ok( editable.includes( 'Blog and archivesSet in the Customizer' ), 'a free design says honestly that the blog is not edited in Elementor' );
	await page.keyboard.press( 'Escape' );

	await details( 'Magazine' );
	assert.ok( ( await dialog().locator( '.ofss-editable tr' ).allTextContents() ).includes( 'Blog and archivesEdit with Elementor' ) );
	await page.keyboard.press( 'Escape' );
	assert.deepEqual( errors, [] );
} );

test( 'a design that needs Elementor Pro points to Elementor and never installs it', async () => {
	state( 'plugin:elementor-pro=off' );
	await open();
	await details( 'Creative Agency' );

	const row = requirement( 'Elementor Pro' );
	assert.ok( await row.evaluate( ( element ) => element.classList.contains( 'ofss-check--fail' ) ) );
	assert.equal( await row.getByRole( 'button', { name: /install/i } ).count(), 0, 'no install button for Elementor Pro' );

	if ( hasElementorPro() ) {
		// Installed by the site owner but switched off: it can be activated here.
		assert.match( await row.textContent(), /Installed, not active/ );
		await row.getByRole( 'button', { name: 'Activate: Elementor Pro' } ).click();
		await row.locator( '.dashicons-yes-alt' ).waitFor( { timeout: 60000 } );
		assert.match( await row.textContent(), /Active/ );
		assert.match( state( 'ids' ), /\{/ ); // The site still answers after the activation.
		state( 'plugin:elementor-pro=off' );
	} else {
		assert.match( await row.textContent(), /Not installed/ );
		const link = row.getByRole( 'link', { name: /Get Elementor Pro/ } );
		assert.equal( await link.getAttribute( 'href' ), 'https://elementor.com/pro/' );
		assert.equal( await link.getAttribute( 'target' ), '_blank' );
		assert.match( await link.getAttribute( 'rel' ), /noopener/ );
	}
	await page.keyboard.press( 'Escape' );
	assert.deepEqual( errors, [] );
} );

test( 'a required plugin is installed from WordPress.org and activated', async () => {
	state( 'remove-plugin:hello-dolly', 'ofss:forget' );
	assert.ok( ! hasPlugin( 'hello-dolly' ), 'the plugin is not installed beforehand' );
	cloud( 'install' );
	await open();

	assert.equal( await cards().count(), 11 );
	await details( 'Install Test' );

	const row = requirement( 'Hello Dolly' );
	assert.match( await row.textContent(), /Not installed/ );
	const button = row.getByRole( 'button', { name: 'Install and activate: Hello Dolly' } );
	await button.click();

	// While it works the button says so and cannot be pressed twice.
	await page.waitForFunction( () => /Installing Hello Dolly/.test( document.querySelector( '[role="dialog"]' ).textContent ) );
	assert.equal( await row.getByRole( 'button' ).getAttribute( 'aria-disabled' ), 'true' );

	// Finished, one way or the other: active, or an error that says why.
	await Promise.race( [
		row.locator( '.dashicons-yes-alt' ).waitFor( { timeout: 120000 } ),
		dialog().locator( '.components-notice.is-error' ).waitFor( { timeout: 120000 } ),
	] );
	assert.equal( await dialog().locator( '.components-notice.is-error' ).count(), 0, 'no error: ' + ( await dialog().locator( '.components-notice.is-error' ).allTextContents() ).join( ' ' ) );
	assert.match( await row.textContent(), /Active/ );
	assert.equal( await row.getByRole( 'button' ).count(), 0, 'nothing left to do' );
	assert.ok( hasPlugin( 'hello-dolly' ), 'the plugin is on disk' );
	await page.waitForFunction( () => /Hello Dolly is now active/.test( document.querySelector( '#a11y-speak-polite' )?.textContent || '' ) );

	// The administrator stays on this screen (no redirect to a plugin's welcome page).
	assert.ok( page.url().includes( 'page=open-frame-starter-sites' ) );
	await page.keyboard.press( 'Escape' );

	state( 'remove-plugin:hello-dolly', 'ofss:forget' );
	assert.deepEqual( errors, [] );
} );

test( 'when the library cannot be reached, the screen explains and recovers', async () => {
	state( 'ofss:forget' );
	cloud( 'down' );
	await page.goto( SCREEN );

	const alert = page.getByRole( 'alert' ).filter( { hasText: 'The designs could not be loaded' } );
	await alert.waitFor( { timeout: 30000 } );
	assert.match( await alert.textContent(), /having trouble right now.*try again in a few minutes/i );
	assert.equal( await cards().count(), 0 );

	cloud( 'ok' );
	await alert.getByRole( 'button', { name: 'Try again' } ).click();
	await page.waitForSelector( '.ofss-grid' );
	assert.equal( await cards().count(), 10 );

	// With a list already saved, a failing library does not empty the screen.
	cloud( 'down' );
	await page.getByRole( 'button', { name: 'Check for new designs' } ).click();
	const notice = page.locator( '.ofss-notice', { hasText: 'Showing the list saved earlier' } );
	await notice.waitFor( { timeout: 30000 } );
	assert.equal( await cards().count(), 10 );

	cloud( 'ok' );
	await page.getByRole( 'button', { name: 'Check for new designs' } ).click();
	await notice.waitFor( { state: 'detached', timeout: 30000 } );

	// Console errors are expected here: the browser reports the failed requests.
} );

test( 'answers that are not a catalog are refused with a clear message', async () => {
	for ( const [ mode, message ] of [
		[ 'garbage', /could not be read/ ],
		[ 'wrong-shape', /cannot read/ ],
		[ 'missing', /unexpected error \(404\)/ ],
		[ 'newer', /newer format.*Update the Open Frame Starter Sites plugin/ ],
	] ) {
		state( 'ofss:forget' );
		cloud( mode );
		await page.goto( SCREEN );
		const alert = page.getByRole( 'alert' ).filter( { hasText: 'The designs could not be loaded' } );
		await alert.waitFor( { timeout: 30000 } );
		assert.match( await alert.textContent(), message, mode );
	}
	state( 'ofss:forget' );
} );

test( 'a list that is not signed by the library is not used', async () => {
	for ( const mode of [ 'unsigned', 'bad-signature', 'foreign-key' ] ) {
		state( 'ofss:forget' );
		cloud( mode );
		await page.goto( SCREEN );
		const alert = page.getByRole( 'alert' ).filter( { hasText: 'The designs could not be loaded' } );
		await alert.waitFor( { timeout: 30000 } );
		assert.match( await alert.textContent(), /could not be verified, so it was not used/, mode );
		assert.equal( await cards().count(), 0, mode );
	}

	// With a good list already saved, a forged one changes nothing on screen.
	state( 'ofss:forget' );
	cloud( 'ok' );
	await open();
	cloud( 'bad-signature' );
	await page.getByRole( 'button', { name: 'Check for new designs' } ).click();
	const notice = page.locator( '.ofss-notice', { hasText: 'Showing the list saved earlier' } );
	await notice.waitFor( { timeout: 30000 } );
	assert.match( await notice.textContent(), /could not be verified/ );
	assert.equal( await cards().count(), 10 );
	assert.equal( ( await names() )[ 0 ], 'Business', 'the changed name from the forged list is not shown' );
	state( 'ofss:forget' );
} );

test( 'entries that break the rules are left out, and markup is shown as text', async () => {
	state( 'ofss:forget' );
	cloud( 'partial' );
	let dialogs = 0;
	const onDialog = ( popup ) => {
		dialogs++;
		popup.dismiss();
	};
	page.on( 'dialog', onDialog );

	await open();
	assert.equal( await cards().count(), 10, 'the four bad entries are not listed' );
	const titles = await names();
	assert.ok( ! titles.some( ( title ) => /foreign|bad-plugin|no-manifest/i.test( title ) ) );
	assert.equal( titles[ 1 ], 'Agency', 'a script in a name is removed, not shown and not run' );
	assert.equal( await page.locator( '.ofss-card script' ).count(), 0 );
	assert.equal( dialogs, 0, 'no script from the catalog ran' );

	page.off( 'dialog', onDialog );
	state( 'ofss:forget' );
	assert.deepEqual( errors, [] );
} );

test( 'a design that is out but needs a newer plugin says so', async () => {
	state( 'ofss:forget' );
	cloud( 'available' );
	await open();

	assert.equal( await cards().count(), 11 );
	const card = cards().filter( { hasText: 'Reference' } ).first();
	assert.equal( await card.locator( '.ofss-badge--soon' ).count(), 0 );

	await details( 'Reference' );
	assert.match( await dialog().locator( '.ofss-details__state' ).textContent(), /needs a newer version of the Open Frame Starter Sites plugin/ );
	const row = requirement( 'Open Frame Starter Sites plugin' );
	assert.ok( await row.evaluate( ( element ) => element.classList.contains( 'ofss-check--fail' ) ) );
	assert.match( await row.textContent(), /needs 1\.0\.0 or newer, you have 0\.1\.0/ );
	assert.equal( await dialog().getByRole( 'button', { name: /import/i } ).count(), 0 );
	await page.keyboard.press( 'Escape' );

	state( 'ofss:forget' );
	assert.deepEqual( errors, [] );
} );

test( 'the list is cached and only fetched again on request', async () => {
	state( 'ofss:forget' );
	await open();
	const afterFirst = cloudRequests();

	await open();
	await details( 'Business' );
	await page.keyboard.press( 'Escape' );
	assert.equal( cloudRequests(), afterFirst, 'reloading the screen and opening details use the saved list' );

	await page.getByRole( 'button', { name: 'Check for new designs' } ).click();
	await page.waitForFunction( () => /up to date/.test( document.querySelector( '#a11y-speak-polite' )?.textContent || '' ) );
	assert.equal( cloudRequests(), afterFirst + 1, 'one request when the user asks' );
	assert.deepEqual( errors, [] );
} );

test( 'another theme: the screen says the designs need Open Frame', async () => {
	state( 'theme:twentytwentyfive' );
	try {
		await open();
		const notice = page.locator( '.ofss-notice', { hasText: 'made for the Open Frame theme, which is not active' } );
		assert.equal( await notice.count(), 1 );
		assert.match( await notice.getByRole( 'link', { name: 'Go to Themes' } ).getAttribute( 'href' ), /themes\.php$/ );

		await details( 'Business' );
		const row = requirement( 'Open Frame theme' );
		assert.ok( await row.evaluate( ( element ) => element.classList.contains( 'ofss-check--fail' ) ) );
		assert.match( await row.textContent(), /not active.*Activate the Open Frame theme/ );
		await page.keyboard.press( 'Escape' );
	} finally {
		state( 'theme:open-frame' );
	}
	assert.deepEqual( errors, [] );
} );

test( 'import history and imported versions are shown when they exist', async () => {
	state( 'ofss:history', 'ofss:imported=business@0.9.0' );
	try {
		await open();
		assert.equal( await cards().filter( { hasText: 'Business' } ).first().locator( '.ofss-badge--update' ).count(), 1, '"Update available" on an older import' );

		await page.getByRole( 'button', { name: 'Import history' } ).click();
		const table = page.getByRole( 'table', { name: 'Past imports, newest first' } );
		await table.waitFor();
		assert.match( await table.locator( 'tbody tr' ).first().textContent(), /Business 1\.0\.0.*Imported.*One image could not be downloaded\./ );
		assert.equal( await page.locator( '.ofss-grid' ).count(), 0 );

		await page.getByRole( 'button', { name: 'Designs', exact: true } ).click();
		assert.equal( await cards().count(), 10 );

		state( 'ofss:imported=business@1.0.0' );
		await open();
		const card = cards().filter( { hasText: 'Business' } ).first();
		assert.equal( await card.locator( '.ofss-badge--imported' ).count(), 1 );
		assert.equal( await card.locator( '.ofss-badge--update' ).count(), 0 );
	} finally {
		state( 'ofss:clear' );
	}
	assert.deepEqual( errors, [] );
} );

test( 'accessibility: no problems found by axe on the list and in the details', async () => {
	await open();
	assert.deepEqual( await axe( page, '.ofss-wrap' ), [], 'the list' );

	await details( 'Creative Agency' );
	// The dialog animates in; contrast is measured once it is fully opaque.
	await page.waitForTimeout( 400 );
	assert.deepEqual( await axe( page, '[role="dialog"]' ), [], 'the details' );
	await page.keyboard.press( 'Escape' );

	await page.getByRole( 'searchbox', { name: 'Search designs' } ).fill( 'zzzz' );
	assert.deepEqual( await axe( page, '.ofss-wrap' ), [], 'the empty state' );
} );

test( 'the plugin loads nothing outside its own screen', async () => {
	for ( const url of [ '/wp-admin/index.php', '/wp-admin/themes.php', '/' ] ) {
		await page.goto( BASE + url );
		const loaded = await page.evaluate( () => [ ...document.querySelectorAll( 'script[src], link[rel="stylesheet"]' ) ].map( ( element ) => element.src || element.href ).filter( ( address ) => address.includes( 'open-frame-starter-sites' ) ) );
		assert.deepEqual( loaded, [], url );
	}

	await page.goto( BASE + '/wp-admin/themes.php' );
	assert.equal( await page.locator( '#adminmenu a', { hasText: 'Starter Sites' } ).count(), 1, 'menu entry under Appearance' );
	await page.goto( BASE + '/wp-admin/plugins.php' );
	assert.equal( await page.locator( 'tr[data-slug="open-frame-starter-sites"] .row-actions a', { hasText: 'Starter Sites' } ).count(), 1, 'link from the Plugins list' );
} );

test( 'without the plugin there is no menu entry and no REST route', async () => {
	state( 'plugin:starter-sites=off' );
	try {
		await page.goto( BASE + '/wp-admin/themes.php' );
		assert.equal( await page.locator( '#adminmenu a', { hasText: 'Starter Sites' } ).count(), 0 );
		const response = await page.request.get( BASE + '/wp-json/open-frame-starter-sites/v1/sites' );
		assert.equal( response.status(), 404 );
	} finally {
		state( 'plugin:starter-sites=on' );
	}
} );

test( 'the plugin and the theme logged no PHP errors', () => {
	assert.deepEqual( themeErrors().filter( ( line ) => ! /wp-content\/plugins\/(elementor|woocommerce)/.test( line ) ), [] );
} );
