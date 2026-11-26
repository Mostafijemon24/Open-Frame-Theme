/**
 * Browser checks for the Medical starter site ("Linden Clinic").
 *
 *   bash tests/env/setup.sh
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * What is checked is the same for every design: see design-checks.js.
 */
const { runDesignChecks } = require( './design-checks' );

runDesignChecks( {
	site: 'medical',
	name: 'Medical',
	pages: [
		{ path: '/', h1: 'Unhurried care, close to home' },
		{ path: '/about/' },
		{ path: '/departments/' },
		{ path: '/department/', h1: 'Cardiology' },
		{ path: '/doctors/' },
		{ path: '/dr-amara-okafor/', h1: 'Dr Amara Okafor' },
		{ path: '/appointments/', h1: 'Book an appointment' },
		{ path: '/patient-information/' },
		{ path: '/contact/' },
		{ path: '/health-notes/', h1: 'Health Notes' },
		{ path: '/heart-numbers/' },
		{ path: '/a-page-that-does-not-exist/', status: 404 },
	],
	counts: { pages: 10, posts: 3, images: 13, reused: 0, menus: 1 },
	pageNames: [ 'home', 'about', 'departments', 'department', 'doctors', 'doctor', 'appointment', 'patients', 'contact', 'notes' ],
	headingFont: 'Plus Jakarta Sans',
	bodyFont: 'Plus Jakarta Sans',
	fontFiles: 1,
	menu: [ 'Departments', 'Doctors', 'Patients', 'About', 'Health Notes', 'Contact' ],
	current: { label: 'Doctors', path: '/doctors/' },
	blog: {
		path: '/health-notes/',
		columns: 3,
		titles: [ 'Five numbers worth knowing about your heart', 'Why sleep is the first thing we ask about', 'Getting ready for winter: who is offered which vaccination' ],
		open: { title: 'Five numbers worth knowing about your heart', path: '/heart-numbers/' },
		category: '/category/heart-health/',
	},
	notFound: { h1: 'We could not find that page', button: 'Back to the home page' },
	kit: { primary: '#0B6B69', secondary: '#0F2B2D', text: '#3E5557', accent: '#BFE5DE', button: 'rgb(11, 107, 105)', heading: 'rgb(15, 43, 45)', bodyText: 'rgb(62, 85, 87)' },
	editor: [
		[ 'medical:pages:home', 'Unhurried care, close to home' ],
		[ 'medical:site-parts:header', 'Linden Clinic' ],
		[ 'medical:site-parts:footer', 'A fictional practice' ],
	],
	gone: '/departments/',
	brand: 'Linden Clinic',
} );
