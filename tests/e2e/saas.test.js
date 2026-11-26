/**
 * Browser checks for the SaaS starter site ("Loop"), a design of the Pro tier.
 *
 *   bash tests/env/setup.sh        (with OFT_ELEMENTOR_PRO_ZIP set)
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * What is checked is the same for every design: see design-checks.js. The
 * file is skipped when Elementor Pro is not installed in the test site.
 */
const { runDesignChecks } = require( './design-checks' );

runDesignChecks( {
	site: 'saas',
	name: 'SaaS',
	pro: true,
	pages: [
		{ path: '/', h1: 'Know what your customers are asking for' },
		{ path: '/features/' },
		{ path: '/inbox/' },
		{ path: '/pricing/' },
		{ path: '/integrations/' },
		{ path: '/customers/' },
		{ path: '/about/' },
		{ path: '/demo/', h1: 'Thirty minutes, with your own feedback' },
		{ path: '/privacy/', h1: 'Privacy policy' },
		{ path: '/terms/', h1: 'Terms of service' },
		{ path: '/blog/', h1: 'Notes on listening to customers' },
		{ path: '/counting-requests-is-not-prioritising/', h1: 'Counting requests is not prioritising' },
		{ path: '/a-page-that-does-not-exist/', status: 404 },
	],
	counts: { pages: 11, posts: 3, images: 12, reused: 0, menus: 1 },
	pageNames: [ 'home', 'features', 'feature', 'pricing', 'integrations', 'customers', 'about', 'contact', 'privacy', 'terms', 'blog' ],
	headingFont: 'Sora',
	bodyFont: 'DM Sans',
	fontFiles: 2,
	menu: [ 'Features', 'Pricing', 'Integrations', 'Customers', 'Blog', 'Book a demo' ],
	current: { label: 'Customers', path: '/customers/' },
	blog: {
		path: '/blog/',
		columns: 3,
		titles: [ 'Counting requests is not prioritising', 'What we learned reading ninety days of our own support inbox', 'Closing the loop: telling customers what happened to their idea' ],
		open: { title: 'Counting requests is not prioritising', path: '/counting-requests-is-not-prioritising/' },
		category: '/category/product/',
	},
	notFound: { h1: 'We could not sort this one', button: 'Back to the home page' },
	kit: { primary: '#0E1320', secondary: '#0E1320', text: '#4A5165', accent: '#FF4D8D', button: 'rgb(255, 255, 255)', heading: 'rgb(14, 19, 32)', bodyText: 'rgb(74, 81, 101)' },
	editor: [
		[ 'saas:pages:home', 'Know what your customers are asking for' ],
		[ 'saas:templates:header', 'Loop' ],
		[ 'saas:templates:footer', 'Sample content' ],
	],
	gone: '/pricing/',
	brand: 'Loop reads',
} );
