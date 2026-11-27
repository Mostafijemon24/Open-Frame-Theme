/**
 * Browser checks for the Business starter site ("Halden Advisory").
 *
 *   bash tests/env/setup.sh
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * What is checked is the same for every design: see design-checks.js.
 */
const { runDesignChecks } = require( './design-checks' );

runDesignChecks( {
	site: 'business',
	name: 'Business',
	pages: [
		{ path: '/', h1: 'Clear decisions for companies that have outgrown guesswork' },
		{ path: '/about/' },
		{ path: '/services/' },
		{ path: '/strategy/' },
		{ path: '/projects/' },
		{ path: '/harbor-terminals/' },
		{ path: '/team/' },
		{ path: '/pricing/' },
		{ path: '/contact/' },
		{ path: '/insights/', h1: 'Insights' },
		{ path: '/cost-to-serve/' },
		{ path: '/a-page-that-does-not-exist/', status: 404 },
	],
	counts: { pages: 10, posts: 3, images: 15, reused: 0, menus: 1 },
	pageNames: [ 'home', 'about', 'services', 'service-details', 'projects', 'project-details', 'team', 'pricing', 'contact', 'insights' ],
	headingFont: 'Hanken Grotesk',
	bodyFont: 'Hanken Grotesk',
	fontFiles: 0,
	menu: [ 'About', 'Services', 'Projects', 'Pricing', 'Insights', 'Contact' ],
	current: { label: 'Pricing', path: '/pricing/' },
	blog: {
		path: '/insights/',
		columns: 3,
		titles: [ 'Your best customer may be your least profitable', 'If the strategy does not fit on a page, nobody will use it', 'Cancel a third of your recurring meetings and see what breaks' ],
		open: { title: 'Your best customer may be your least profitable', path: '/cost-to-serve/' },
		category: '/category/finance/',
	},
	notFound: { h1: 'This page has moved, or never existed', button: 'Back to the home page' },
	kit: { primary: '#2456E6', secondary: '#0B1F3A', text: '#46546A', accent: '#F2A93B', button: 'rgb(36, 86, 230)', heading: 'rgb(11, 31, 58)', bodyText: 'rgb(70, 84, 106)' },
	editor: [
		[ 'business:pages:home', 'Clear decisions for companies that have outgrown guesswork' ],
		[ 'business:site-parts:header', 'Halden' ],
		[ 'business:site-parts:footer', 'Halden Advisory' ],
	],
	gone: '/pricing/',
	brand: 'Halden',
} );
