/**
 * Browser checks for the Agency starter site ("Parallel"), a design of the Pro tier.
 *
 *   bash tests/env/setup.sh        (with OFT_ELEMENTOR_PRO_ZIP set)
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * What is checked is the same for every design: see design-checks.js. The
 * file is skipped when Elementor Pro is not installed in the test site.
 */
const { runDesignChecks } = require( './design-checks' );

runDesignChecks( {
	site: 'agency',
	name: 'Agency',
	pro: true,
	pages: [
		{ path: '/' },
		{ path: '/studio/' },
		{ path: '/services/' },
		{ path: '/brand/' },
		{ path: '/work/' },
		{ path: '/volt/', h1: 'Volt: an electricity company that shows where the power comes from' },
		{ path: '/careers/' },
		{ path: '/contact/', h1: 'Tell us what you are trying to do' },
		{ path: '/journal/', h1: 'Journal' },
		{ path: '/the-half-brief/', h1: 'In praise of the half-finished brief' },
		{ path: '/a-page-that-does-not-exist/', status: 404 },
	],
	counts: { pages: 9, posts: 3, images: 15, reused: 0, menus: 1 },
	pageNames: [ 'home', 'studio', 'services', 'service-details', 'work', 'case-study', 'careers', 'contact', 'journal' ],
	headingFont: 'Unbounded',
	bodyFont: 'Inter',
	fontFiles: 2,
	menu: [ 'Work', 'Services', 'Studio', 'Careers', 'Journal', 'Contact' ],
	current: { label: 'Careers', path: '/careers/' },
	blog: {
		path: '/journal/',
		columns: 3,
		titles: [ 'In praise of the half-finished brief', 'Why we do not pitch with finished work', 'We ship on Fridays, and other bad ideas that work' ],
		open: { title: 'In praise of the half-finished brief', path: '/the-half-brief/' },
		category: '/category/process/',
	},
	notFound: { h1: 'This page is not in the deck', button: 'Back to the home page' },
	kit: { primary: '#0D0D0D', secondary: '#0D0D0D', text: '#3A3A38', accent: '#C8F53C', button: 'rgb(200, 245, 60)', heading: 'rgb(13, 13, 13)', bodyText: 'rgb(58, 58, 56)' },
	editor: [
		[ 'agency:pages:home', 'We make brands' ],
		[ 'agency:templates:header', 'parallel' ],
		[ 'agency:templates:footer', 'Sample content' ],
	],
	gone: '/work/',
	brand: 'Parallel',
} );
