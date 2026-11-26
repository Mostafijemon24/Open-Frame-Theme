/**
 * Browser checks for the Education starter site ("Tandem Academy").
 *
 *   bash tests/env/setup.sh
 *   node --test --test-concurrency=1 tests/e2e/*.test.js
 *
 * What is checked is the same for every design: see design-checks.js.
 */
const { runDesignChecks } = require( './design-checks' );

runDesignChecks( {
	site: 'education',
	name: 'Education',
	pages: [
		{ path: '/', h1: 'Learn the thing you keep putting off' },
		{ path: '/courses/' },
		{ path: '/web-development/', h1: 'Web development fundamentals' },
		{ path: '/instructors/' },
		{ path: '/admissions/' },
		{ path: '/events/' },
		{ path: '/about/' },
		{ path: '/contact/' },
		{ path: '/news/', h1: 'News' },
		{ path: '/what-a-course-is-like/' },
		{ path: '/a-page-that-does-not-exist/', status: 404 },
	],
	counts: { pages: 9, posts: 3, images: 16, reused: 0, menus: 1 },
	pageNames: [ 'home', 'courses', 'course-details', 'instructors', 'admissions', 'events', 'about', 'contact', 'news' ],
	headingFont: 'Bricolage Grotesque',
	bodyFont: 'Figtree',
	fontFiles: 2,
	menu: [ 'Courses', 'Instructors', 'Admissions', 'Events', 'About', 'News', 'Contact' ],
	current: { label: 'Events', path: '/events/' },
	blog: {
		path: '/news/',
		columns: 3,
		titles: [ 'Open day on 18 January: come and sit in on a class', 'Ten weeks of evenings: what a course is really like', 'From night classes to a first job in data' ],
		open: { title: 'Ten weeks of evenings: what a course is really like', path: '/what-a-course-is-like/' },
		category: '/category/student-stories/',
	},
	notFound: { h1: 'This page skipped class', button: 'Back to the home page' },
	kit: { primary: '#5B3FD6', secondary: '#16224A', text: '#3D4664', accent: '#FFCF4A', button: 'rgb(91, 63, 214)', heading: 'rgb(22, 34, 74)', bodyText: 'rgb(61, 70, 100)' },
	editor: [
		[ 'education:pages:home', 'Learn the thing you keep putting off' ],
		[ 'education:site-parts:header', 'Tandem' ],
		[ 'education:site-parts:footer', 'A fictional school' ],
	],
	gone: '/courses/',
	brand: 'Tandem',
} );
