/**
 * Browser checks for the Restaurant starter site ("Ember & Rye").
 *
 *   bash tests/env/setup.sh
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * What is checked is the same for every design: see design-checks.js.
 */
const { runDesignChecks } = require( './design-checks' );

runDesignChecks( {
	site: 'restaurant',
	name: 'Restaurant',
	pages: [
		{ path: '/', h1: 'Fire, grain and patience' },
		{ path: '/menu/', h1: 'The menu' },
		{ path: '/our-story/' },
		{ path: '/reservations/', h1: 'Book a table' },
		{ path: '/private-events/' },
		{ path: '/gallery/' },
		{ path: '/contact/' },
		{ path: '/journal/', h1: 'Journal' },
		{ path: '/first-frost-leeks/' },
		{ path: '/a-page-that-does-not-exist/', status: 404 },
	],
	counts: { pages: 8, posts: 3, images: 16, reused: 0, menus: 1 },
	pageNames: [ 'home', 'menu', 'story', 'reservations', 'private-events', 'gallery', 'contact', 'journal' ],
	headingFont: 'Cormorant Garamond',
	bodyFont: 'Jost',
	fontFiles: 3,
	menu: [ 'Menu', 'Reservations', 'Private Events', 'Our Story', 'Gallery', 'Journal', 'Contact' ],
	current: { label: 'Gallery', path: '/gallery/' },
	blog: {
		path: '/journal/',
		columns: 3,
		titles: [ 'What the first frost does to a leek', 'Why we bake our bread at four in the afternoon', 'A short guide to our wine list' ],
		open: { title: 'What the first frost does to a leek', path: '/first-frost-leeks/' },
		category: '/category/seasons/',
	},
	notFound: { h1: 'This table is not on our floor plan', button: 'Back to the home page' },
	kit: { primary: '#E39A4A', secondary: '#F2E8D9', text: '#CDC2B2', accent: '#E39A4A', button: 'rgb(227, 154, 74)', heading: 'rgb(242, 232, 217)', bodyText: 'rgb(205, 194, 178)' },
	editor: [
		[ 'restaurant:pages:home', 'Fire, grain and' ],
		[ 'restaurant:site-parts:header', 'Rye' ],
		[ 'restaurant:site-parts:footer', 'Sample content' ],
	],
	gone: '/menu/',
	brand: 'Ember & Rye',
} );
