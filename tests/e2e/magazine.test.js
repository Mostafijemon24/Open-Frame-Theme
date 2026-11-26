/**
 * Browser checks for the Magazine starter site ("Common Ground"), a design of the Pro tier.
 *
 *   bash tests/env/setup.sh        (with OFT_ELEMENTOR_PRO_ZIP set)
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * What is checked is the same for every design: see design-checks.js. The
 * file is skipped when Elementor Pro is not installed in the test site.
 */
const { runDesignChecks } = require( './design-checks' );

runDesignChecks( {
	site: 'magazine',
	name: 'Magazine',
	pro: true,
	pages: [
		{ path: '/', h1: 'Two houses at the end of the road' },
		{ path: '/about/' },
		{ path: '/marta-lind/', h1: 'Marta Lind' },
		{ path: '/subscribe/', h1: 'Four issues a year, through your letterbox' },
		{ path: '/contact/' },
		{ path: '/stories/', h1: 'All stories' },
		{ path: '/category/table/', h1: 'Table' },
		{ path: '/one-loaf-three-days/', h1: 'One loaf, three days' },
		{ path: '/a-page-that-does-not-exist/', status: 404 },
	],
	counts: { pages: 6, posts: 9, images: 14, reused: 0, menus: 1 },
	pageNames: [ 'home', 'about', 'author', 'subscribe', 'contact', 'stories' ],
	headingFont: 'Literata',
	bodyFont: 'Public Sans',
	fontFiles: 2,
	menu: [ 'Places', 'Table', 'Craft', 'All stories', 'About', 'Subscribe' ],
	current: { label: 'About', path: '/about/' },
	blog: {
		path: '/stories/',
		columns: 3,
		titles: [ 'Two houses at the end of the road', 'One loaf, three days', 'Forty pots before lunch', 'A summer village that empties in October', 'The lime seller’s scale', 'The bench by the window', 'The street that paints itself white', 'In praise of the slow first cup', 'A band of red in grey cloth' ],
		open: { title: 'One loaf, three days', path: '/one-loaf-three-days/' },
		category: '/category/craft/',
	},
	notFound: { h1: 'This page was never printed', button: 'Back to the front page' },
	kit: { primary: '#111111', secondary: '#111111', text: '#3D3D3D', accent: '#B5121B', button: 'rgb(17, 17, 17)', heading: 'rgb(17, 17, 17)', bodyText: 'rgb(61, 61, 61)' },
	editor: [
		[ 'magazine:pages:home', 'Cover story' ],
		[ 'magazine:templates:header', 'Common Ground' ],
		[ 'magazine:templates:footer', 'Sample content' ],
	],
	gone: '/about/',
	brand: 'Common Ground',
} );
