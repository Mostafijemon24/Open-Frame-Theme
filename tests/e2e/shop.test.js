/**
 * Browser checks for the Shop starter site ("Sill & Shelf"), a design of the Pro tier
 * with a WooCommerce store.
 *
 *   bash tests/env/setup.sh        (with OFT_ELEMENTOR_PRO_ZIP set)
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * What is checked is the same for every design: see design-checks.js. The
 * file is skipped when Elementor Pro is not installed in the test site.
 * WooCommerce is switched on for these checks and off again afterwards.
 *
 * A product page is not in the list: on a machine without an emoji font, WordPress
 * fetches the magnifier of WooCommerce's product gallery from s.w.org, which the
 * "asks no other site for anything" check would report. That is WordPress and
 * WooCommerce, not the design.
 */
const { runDesignChecks } = require( './design-checks' );

runDesignChecks( {
	site: 'shop',
	name: 'Shop',
	pro: true,
	store: true,
	pages: [
		{ path: '/', h1: 'Useful things for a quiet room' },
		{ path: '/lookbook/', h1: 'Four corners of a home' },
		{ path: '/about/' },
		{ path: '/shipping-and-returns/' },
		{ path: '/contact/' },
		{ path: '/journal/', h1: 'Notes on plants, tables and buying well' },
		{ path: '/keeping-a-succulent-alive/', h1: 'Keeping a succulent alive, honestly' },
		{ path: '/shop/', h1: 'Shop' },
		{ path: '/a-page-that-does-not-exist/', status: 404 },
	],
	counts: { pages: 6, posts: 3, images: 17, reused: 0, menus: 1, products: 8 },
	pageNames: [ 'home', 'lookbook', 'about', 'shipping', 'contact', 'journal' ],
	headingFont: 'Outfit',
	bodyFont: 'Work Sans',
	fontFiles: 2,
	menu: [ 'Shop', 'Lookbook', 'About', 'Journal', 'Shipping', 'Contact' ],
	current: { label: 'About', path: '/about/' },
	blog: {
		path: '/journal/',
		columns: 3,
		titles: [ 'Keeping a succulent alive, honestly', 'Laying a table for six without buying anything', 'How to tell a thing that will last' ],
		open: { title: 'Keeping a succulent alive, honestly', path: '/keeping-a-succulent-alive/' },
		category: '/category/plants/',
	},
	notFound: { h1: 'This shelf is empty', button: 'Back to the home page' },
	kit: { primary: '#9A4526', secondary: '#23201C', text: '#5A534B', accent: '#9A4526', button: 'rgb(154, 69, 38)', heading: 'rgb(35, 32, 28)', bodyText: 'rgb(90, 83, 75)' },
	editor: [
		[ 'shop:pages:home', 'Useful things for a quiet room' ],
		[ 'shop:templates:header', 'Sill & Shelf' ],
		[ 'shop:templates:footer', 'Sample content' ],
	],
	gone: '/lookbook/',
	brand: 'Sill & Shelf',
} );
