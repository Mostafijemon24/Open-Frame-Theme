/**
 * Browser checks for the Portfolio starter site ("Juno Vale").
 *
 *   bash tests/env/setup.sh
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * What is checked is the same for every design: see design-checks.js.
 */
const { runDesignChecks } = require( './design-checks' );

runDesignChecks( {
	site: 'portfolio',
	name: 'Portfolio',
	pages: [
		{ path: '/', h1: 'Brand identities and digital products for companies with something to say.' },
		{ path: '/about/' },
		{ path: '/work/' },
		{ path: '/tidewater-coffee-roasters/', h1: 'Tidewater Coffee Roasters' },
		{ path: '/services/' },
		{ path: '/brand-identity/' },
		{ path: '/resume/' },
		{ path: '/contact/' },
		{ path: '/notes/', h1: 'Notes' },
		{ path: '/saying-no/' },
		{ path: '/a-page-that-does-not-exist/', status: 404 },
	],
	counts: { pages: 9, posts: 3, images: 15, reused: 0, menus: 1 },
	pageNames: [ 'home', 'about', 'work', 'project-details', 'services', 'service-details', 'resume', 'contact', 'notes' ],
	headingFont: 'Fraunces',
	bodyFont: 'Instrument Sans',
	fontFiles: 3,
	menu: [ 'Work', 'Services', 'About', 'Resume', 'Notes', 'Contact' ],
	current: { label: 'Resume', path: '/resume/' },
	blog: {
		path: '/notes/',
		columns: 2,
		titles: [ 'The projects I turned down last year, and why', 'Design the system first, the pages second', 'Five questions that make a better brief' ],
		open: { title: 'The projects I turned down last year, and why', path: '/saying-no/' },
		category: '/category/practice/',
	},
	notFound: { h1: 'This page has wandered off.', button: 'Back to the home page' },
	kit: { primary: '#A8390B', secondary: '#1C1917', text: '#4A443D', accent: '#A8390B', button: 'rgb(168, 57, 11)', heading: 'rgb(28, 25, 23)', bodyText: 'rgb(74, 68, 61)' },
	editor: [
		[ 'portfolio:pages:home', 'Brand identities and digital products' ],
		[ 'portfolio:site-parts:header', 'Juno Vale' ],
		[ 'portfolio:site-parts:footer', 'Sample content' ],
	],
	gone: '/work/',
	brand: 'Juno Vale',
} );
