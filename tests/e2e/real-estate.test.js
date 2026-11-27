/**
 * Browser checks for the Real Estate starter site ("Hartwell & Rowe"), a design of the Pro tier.
 *
 *   bash tests/env/setup.sh        (with OFT_ELEMENTOR_PRO_ZIP set)
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * What is checked is the same for every design: see design-checks.js. The
 * file is skipped when Elementor Pro is not installed in the test site.
 */
const { runDesignChecks } = require( './design-checks' );

runDesignChecks( {
	site: 'real-estate',
	name: 'Real Estate',
	pro: true,
	pages: [
		{ path: '/', h1: 'Homes sold by people who know the street' },
		{ path: '/homes/', h1: 'Six homes on the market now' },
		{ path: '/12-orchard-rise/', h1: '12 Orchard Rise' },
		{ path: '/agents/' },
		{ path: '/clara-hartwell/', h1: 'Clara Hartwell' },
		{ path: '/services/' },
		{ path: '/selling/' },
		{ path: '/about/' },
		{ path: '/contact/', h1: 'Call, write, or come in' },
		{ path: '/market-notes/', h1: 'Plain words about buying and selling' },
		{ path: '/what-a-valuation-is/', h1: 'What a valuation is, and what it is not' },
		{ path: '/a-page-that-does-not-exist/', status: 404 },
	],
	counts: { pages: 10, posts: 3, images: 18, reused: 0, menus: 1 },
	pageNames: [ 'home', 'listings', 'property', 'agents', 'agent', 'services', 'service', 'about', 'contact', 'notes' ],
	headingFont: 'Newsreader',
	bodyFont: 'Manrope',
	fontFiles: 2,
	menu: [ 'Homes for sale', 'Services', 'Agents', 'About', 'Market notes', 'Contact' ],
	current: { label: 'Agents', path: '/agents/' },
	blog: {
		path: '/market-notes/',
		columns: 3,
		titles: [ 'What a valuation is, and what it is not', 'How to read a floor plan in five minutes', 'The market this autumn, in four numbers' ],
		open: { title: 'What a valuation is, and what it is not', path: '/what-a-valuation-is/' },
		category: '/category/selling/',
	},
	notFound: { h1: 'This address is not on our books', button: 'Back to the home page' },
	kit: { primary: '#1F3A2E', secondary: '#16211B', text: '#4B5650', accent: '#DDB96A', button: 'rgb(247, 243, 234)', heading: 'rgb(22, 33, 27)', bodyText: 'rgb(75, 86, 80)' },
	editor: [
		[ 'real-estate:pages:home', 'Homes sold by people who know the street' ],
		[ 'real-estate:templates:header', 'Hartwell & Rowe' ],
		[ 'real-estate:templates:footer', 'Sample content' ],
	],
	gone: '/homes/',
	brand: 'Hartwell & Rowe',
} );
