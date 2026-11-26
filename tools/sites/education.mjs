#!/usr/bin/env node
/**
 * The Education starter site ("Tandem Academy", evening courses for adults), written as data.
 *
 *   node tools/sites/education.mjs
 *
 * Writes starter-sites/education/{site.json, site/, content/, media/index.json,
 * fonts/index.json}. The images come from tools/sites/education-art.mjs. See
 * brief.md in the site folder for the design decisions this file implements.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks, box, builders, em, fluid, gap, icon, ids, kitTypography, link, page, percent, px, writeSite } from './kit.mjs';

const SITE = 'education';
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', SITE );

/* -------------------------------------------------------------------------
   Design tokens (see brief.md)
   ---------------------------------------------------------------------- */
const C = {
	iris: '#5B3FD6',
	irisDark: '#4630B0',
	navy: '#16224A',
	text: '#3D4664',
	sun: '#FFCF4A',
	coral: '#FF7A59',
	sky: '#DCE9FF',
	mint: '#CFF0DF',
	peach: '#FFE1D2',
	lilac: '#E7E0FF',
	paper: '#FFFBF2',
	white: '#FFFFFF',
	line: '#E6E1D3',
	haze: '#C9D1EA', // Text on the navy panels.
};
const DISPLAY = 'Bricolage Grotesque';
const SANS = 'Figtree';
const EMAIL = 'hello@example.com';
const PHONE = '+1 (555) 010-0163';
const TEL = 'tel:+15550100163';

const b = builders( ids() );
const { row, column, grid, text, button, list, counter, container, widget } = b;

/** Blocks follow each other with one gap below each, so a page is a stack of panels. */
const section = ( options, elements ) => b.section( { top: 0, bottom: 96, ...options }, elements );

/* -------------------------------------------------------------------------
   Components of this design
   ---------------------------------------------------------------------- */
const sans = { typography_typography: 'custom', typography_font_family: SANS };
const hardShadow = ( size = 8, color = C.navy ) => ( { box_shadow_box_shadow_type: 'yes', box_shadow_box_shadow: { horizontal: size, vertical: size, blur: 0, spread: 0, color } } );
const outlined = { border_border: 'solid', border_width: box( 2 ), border_color: C.navy };

const heading = ( title, options = {} ) => b.heading( title, options );

/** A line of sans text set as a heading widget: facts, names, captions. */
const fact = ( title, { color = C.navy, size = 17, weight = 600, align, more = {} } = {} ) =>
	b.heading( title, { tag: 'p', color, align, more: { ...sans, typography_font_size: px( size ), typography_font_weight: String( weight ), typography_line_height: em( 1.45 ), ...more } } );

/** A small rounded label, like a sticker. */
const chip = ( title, { background = C.sun, color = C.navy } = {} ) =>
	b.heading( title, { tag: 'p', color, more: { ...sans, typography_font_size: px( 14 ), typography_font_weight: '700', typography_line_height: em( 1.2 ), _element_width: 'auto', _background_background: 'classic', _background_color: background, _padding: box( 8, 14 ), _border_radius: box( 999 ), _flex_size: 'none' } } );

const chips = ( items ) => row( { spacing: 8, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, items.map( ( item ) => ( typeof item === 'string' ? chip( item, { background: C.white } ) : chip( ...item ) ) ) );

/** A large rounded block of color. */
const panel = ( background, elements, { padding = 64, spacing = 24, radius = 36, more = {} } = {} ) =>
	container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( spacing ), padding: box( padding ), padding_tablet: box( Math.round( padding * 0.7 ) ), padding_mobile: box( 28, 22 ), background_background: 'classic', background_color: background, border_radius: box( radius ), border_radius_mobile: box( 24 ), ...more }, elements );

/** A card with a dark outline and a hard shadow. */
const card = ( elements, { background = C.white, padding = 28, spacing = 14, shadow = 8, more = {} } = {} ) =>
	container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( spacing ), padding: box( padding ), padding_mobile: box( 22 ), background_background: 'classic', background_color: background, border_radius: box( 24 ), ...outlined, ...hardShadow( shadow ), ...more }, elements );

const ghost = { background_color: C.white, button_text_color: C.navy, hover_color: C.navy, button_background_hover_color: C.sun };
const onNavy = { background_color: C.sun, button_text_color: C.navy, hover_color: C.navy, button_background_hover_color: C.white, border_color: C.sun };

/** A text link with an arrow. */
const arrow = ( title, url, { color = C.navy } = {} ) =>
	button( title, url, { more: { background_color: 'transparent', button_background_hover_color: 'transparent', button_text_color: color, hover_color: C.iris, selected_icon: icon( 'arrow-right' ), icon_align: 'row-reverse', icon_indent: px( 8 ), border_border: 'solid', border_width: box( 0 ), text_padding: box( 0 ), button_box_shadow_box_shadow_type: 'yes', button_box_shadow_box_shadow: { horizontal: 0, vertical: 0, blur: 0, spread: 0, color: 'rgba(0,0,0,0)' }, _flex_size: 'none' } } );

const image = ( uid, { radius = 24, more = {} } = {} ) => b.image( uid, { radius, more } );
const round = ( uid, size ) => b.image( uid, { more: { image_border_radius: { unit: '%', top: '50', right: '50', bottom: '50', left: '50', isLinked: true }, ...( size ? { width: px( size ) } : {} ), image_border_border: 'solid', image_border_width: box( 2 ), image_border_color: C.navy } } );

/** Label chip, heading and optional lead. */
const intro = ( label, title, lead, { tag = 'h2', width = 62, dark = false, background = C.sun } = {} ) =>
	column( { width, spacing: 16, more: { flex_align_items: 'flex-start' } }, [
		chip( label, { background } ),
		heading( title, { tag, ...( dark ? { color: C.white } : {} ) } ),
		...( lead ? [ text( `<p>${ lead }</p>`, { size: px( 19 ), ...( dark ? { color: C.haze } : {} ) } ) ] : [] ),
	] );

/** The top of an inner page: a rounded panel of color with the title in it. */
const pageHero = ( background, label, title, lead, extra = [] ) =>
	section( { top: 24, bottom: 72, spacing: 0 }, [ panel( background, [ column( { width: 70, spacing: 18, more: { flex_align_items: 'flex-start' } }, [ chip( label, { background: C.white } ), heading( title, { tag: 'h1' } ), ...( lead ? [ text( `<p>${ lead }</p>`, { size: px( 20 ) } ) ] : [] ), ...extra ] ) ], { padding: 72 } ) ] );

/* -------------------------------------------------------------------------
   Content
   ---------------------------------------------------------------------- */
const courses = [
	{ uid: 'course-code', color: C.sky, name: 'Web development fundamentals', weeks: '10 weeks', level: 'Beginner', fee: '1,450', when: 'Tue and Thu, 18:30 to 21:00', body: 'HTML, CSS and JavaScript from an empty file to a site you put online yourself.' },
	{ uid: 'course-data', color: C.mint, name: 'Data analysis with spreadsheets and SQL', weeks: '8 weeks', level: 'Beginner', fee: '1,150', when: 'Mon and Wed, 18:30 to 20:30', body: 'Ask a question of a dataset and answer it with a chart your manager can read.' },
	{ uid: 'course-design', color: C.lilac, name: 'Interface design', weeks: '10 weeks', level: 'Intermediate', fee: '1,450', when: 'Tue and Thu, 18:30 to 21:00', body: 'Layout, type and colour for screens, practised on a real brief from a local company.' },
	{ uid: 'course-language', color: C.peach, name: 'Spanish for work', weeks: '12 weeks', level: 'All levels', fee: '780', when: 'Wednesday, 18:00 to 20:00', body: 'Meetings, email and small talk. Groups of eight, taught entirely in Spanish from week three.' },
	{ uid: 'course-photo', color: '#FFE9A8', name: 'Photography weekends', weeks: '4 Saturdays', level: 'Beginner', fee: '520', when: 'Saturday, 10:00 to 16:00', body: 'Get off automatic. Light, composition and editing, with a walk through the old town each week.' },
	{ uid: 'course-writing', color: C.sky, name: 'Writing clearly at work', weeks: '6 weeks', level: 'All levels', fee: '490', when: 'Monday, 18:30 to 20:30', body: 'Reports, proposals and difficult emails, edited line by line in a small group.' },
];

const teachers = [
	{ uid: 'teacher-1', name: 'Dana Whitlock', subject: 'Interface design', bio: 'Product designer for twelve years, most recently at a bank. Teaches the course she wishes she had taken.' },
	{ uid: 'teacher-2', name: 'Samuel Okoye', subject: 'Web development', bio: 'Front-end engineer and former apprentice. Believes nobody learns to code by watching someone else type.' },
	{ uid: 'teacher-3', name: 'Lucía Fernández', subject: 'Spanish', bio: 'From Seville, a teacher for fifteen years. Her groups are known for laughing through the wall.' },
	{ uid: 'teacher-4', name: 'Priya Raman', subject: 'Data analysis', bio: 'Analyst at a city hospital. Brings real, messy data to class, with the names removed.' },
];

const events = [
	[ '18', 'Jan', 'Open day', 'Sit in on a class, meet the instructors and ask anything. Saturday, 10:00 to 14:00.' ],
	[ '27', 'Jan', 'Taster: your first web page', 'Two hours, free, no experience needed. Bring a laptop. Tuesday, 18:30.' ],
	[ '05', 'Feb', 'Graduate showcase', 'The autumn groups present their final projects. Wednesday, 19:00, with drinks.' ],
	[ '14', 'Feb', 'Careers evening', 'Four former students on changing jobs after a course. Friday, 18:30.' ],
	[ '02', 'Mar', 'Spring term begins', 'First classes of the spring term. Applications close two weeks before.' ],
];

const posts = [
	{
		name: 'open-day-january',
		title: 'Open day on 18 January: come and sit in on a class',
		excerpt: 'The doors are open from ten until two. Try a twenty-minute lesson in any subject, meet the people who teach it and see the rooms.',
		image: 'news-1',
		category: 'Events',
		days: 4,
		content: [
			blocks.paragraph( 'On Saturday 18 January the doors are open from ten until two. You can try a twenty-minute lesson in any subject, meet the people who teach it and see the rooms you would be learning in.' ),
			blocks.heading( 'What happens on the day' ),
			blocks.list( [ 'Short lessons every half hour, in all six subjects', 'Instructors and former students in the café to answer questions', 'Advice on fees, instalments and employer funding' ] ),
			blocks.heading( 'Do I need to book?' ),
			blocks.paragraph( `No. Come when it suits you and stay as long as you like. If you already know which course you want, <a href="${ page( 'admissions' ) }">the admissions page</a> explains how to apply.` ),
		],
	},
	{
		name: 'what-a-course-is-like',
		title: 'Ten weeks of evenings: what a course is really like',
		excerpt: 'Two evenings a week after a full day of work is a real commitment. A week-by-week account from someone who has just finished.',
		image: 'news-2',
		category: 'Student stories',
		days: 16,
		content: [
			blocks.paragraph( 'Two evenings a week after a full day of work is a real commitment. We asked Mira, who finished the web development course in December, to describe how the ten weeks actually felt.' ),
			blocks.heading( 'Weeks one to three: everything is new' ),
			blocks.paragraph( '“I went home with a headache the first night. By week three I had a page with my name on it, online, and I showed it to everyone at work.”' ),
			blocks.heading( 'Weeks four to seven: the dip' ),
			blocks.paragraph( '“JavaScript nearly finished me. What helped was that the group was small enough for Samuel to notice, and that everyone else was stuck in the same place.”' ),
			blocks.quote( 'Nobody tells you the middle is the hard part. It is, and then it is over.' ),
			blocks.heading( 'Weeks eight to ten: your own project' ),
			blocks.paragraph( '“I built a booking page for my sister\'s salon. It is not perfect and it is in use, which is more than I can say for most things I have started.”' ),
		],
	},
	{
		name: 'night-classes-to-first-job',
		title: 'From night classes to a first job in data',
		excerpt: 'Jonas spent nine years in a warehouse office. Eight weeks of spreadsheets and SQL later, he moved to the planning team.',
		image: 'news-3',
		category: 'Student stories',
		days: 30,
		content: [
			blocks.paragraph( 'Jonas spent nine years in a warehouse office, keeping stock lists that nobody read. He took the data analysis course because he suspected the lists could be useful.' ),
			blocks.heading( 'One chart changed the conversation' ),
			blocks.paragraph( 'For his final project he used his own company\'s numbers and showed which products were ordered too early. His manager asked him to present it to the planning team. Three months later he joined them.' ),
			blocks.heading( 'His advice' ),
			blocks.paragraph( 'Bring a question from your own job to the first class. The course makes more sense when the data is something you care about.' ),
		],
	},
];

/* -------------------------------------------------------------------------
   Shared blocks
   ---------------------------------------------------------------------- */
const courseCard = ( course, tag = 'h3' ) =>
	card( [
		image( course.uid, { radius: 16 } ),
		chips( [ course.weeks, course.level ] ),
		heading( course.name, { tag, ...( tag === 'h3' ? {} : { size: fluid( 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)' ) } ) } ),
		text( `<p>${ course.body }</p>` ),
		arrow( 'Course details', page( 'course-details' ) ),
	], { background: course.color, padding: 20, more: { padding_mobile: box( 16 ) } } );

const eventRow = ( [ day, month, title, body ], tag = 'h3' ) =>
	card( [
		container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_gap: gap( 24 ), flex_gap_mobile: gap( 16 ), flex_wrap: 'nowrap', padding: box( 0 ) }, [
			container( { content_width: 'full', width: px( 92 ), width_mobile: px( 76 ), flex_direction: 'column', flex_align_items: 'center', flex_gap: gap( 0 ), padding: box( 12, 0 ), background_background: 'classic', background_color: C.navy, border_radius: box( 18 ), _flex_size: 'none' }, [
				heading( day, { tag: 'p', color: C.white, align: 'center', size: px( 34 ), more: { typography_line_height: em( 1 ) } } ),
				fact( month, { color: C.sun, size: 14, weight: 700, align: 'center', more: { typography_text_transform: 'uppercase', typography_letter_spacing: px( 1 ) } } ),
			] ),
			column( { spacing: 6 }, [ heading( title, { tag, ...( tag === 'h3' ? {} : { size: fluid( 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)' ), weight: 700 } ) } ), text( `<p>${ body }</p>`, { size: px( 16 ) } ) ] ),
		] ),
	], { padding: 20, shadow: 6 } );

const openDay = () =>
	section( { spacing: 0 }, [
		panel( C.coral, [
			row( { spacing: 40, align: 'center', justify: 'space-between' }, [
				column( { width: 62, spacing: 12 }, [ heading( 'Not sure which course fits? Come to an open day.' ), text( '<p>Sit in on a class, meet the instructors and ask every question you have. No booking, no sales talk.</p>', { color: C.navy, size: px( 19 ) } ) ] ),
				column( { width: 32, spacing: 14, more: { flex_align_items: 'flex-start' } }, [ button( 'See the next dates', page( 'events' ), { more: { background_color: C.navy, button_text_color: C.white, hover_color: C.navy, button_background_hover_color: C.white } } ) ] ),
			] ),
		], { more: { ...outlined, ...hardShadow( 10 ) } } ),
	] );

/* -------------------------------------------------------------------------
   Pages
   ---------------------------------------------------------------------- */
const pages = {};

pages.home = {
	title: 'Home',
	front_page: true,
	content: [
		section( { top: 24, bottom: 56, spacing: 0 }, [
			panel( C.sun, [
				row( { spacing: 40, align: 'center', tablet: 'column' }, [
					column( { width: 54, spacing: 22, more: { width_tablet: percent( 100 ), flex_align_items: 'flex-start' } }, [
						chip( 'Evening and weekend courses for adults', { background: C.white } ),
						heading( 'Learn the thing you keep putting off', { tag: 'h1' } ),
						text( '<p>Small classes in code, data, design and languages, taught after work by people who do the job during the day.</p>', { size: px( 20 ), color: C.navy } ),
						row( { spacing: 14, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Browse courses', page( 'courses' ) ), button( 'Visit an open day', page( 'events' ), { more: ghost } ) ] ),
					] ),
					column( { width: 46, more: { width_tablet: percent( 100 ) } }, [ image( 'hero', { radius: 28 } ) ] ),
				] ),
			], { padding: 56, more: { padding: box( 56, 56, 56, 64 ) } } ),
		] ),

		section( { top: 0, bottom: 96, spacing: 0 }, [
			grid( { columns: 4, tablet: 2, spacing: 20, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, [
				[ 1200, 'graduates since 2016', { suffix: '+' } ],
				[ 86, 'finish their course', { suffix: '%' } ],
				[ 14, 'students in a class, at most' ],
				[ 32, 'instructors who work in their field' ],
			].map( ( [ number, title, extra = {} ] ) => card( [ counter( number, title, { color: C.navy, titleColor: C.text, weight: 800, ...extra } ) ], { padding: 22, shadow: 6 } ) ) ),
		] ),

		section( { top: 0, spacing: 48 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'Courses', 'Six subjects, all starting from where you are', null, { width: 64 } ), arrow( 'All courses', page( 'courses' ) ) ] ),
			grid( { columns: 3, spacing: 28 }, courses.slice( 0, 3 ).map( ( course ) => courseCard( course ) ) ),
		] ),

		section( { top: 0, spacing: 0 }, [
			panel( C.navy, [
				intro( 'How it works', 'From curious to capable in three steps', null, { dark: true, width: 70 } ),
				grid( { columns: 3, spacing: 40 }, [
					[ 'Try a class', 'Come to an open day or a free taster evening. See the room, meet the group, decide later.' ],
					[ 'Join a small group', 'Fourteen people at most, two evenings a week. You build something real from the first session.' ],
					[ 'Leave with proof', 'A finished project, a certificate, and an instructor who will give you a reference.' ],
				].map( ( [ title, body ], index ) => column( { spacing: 12 }, [ heading( String( index + 1 ), { tag: 'p', color: C.sun, size: px( 64 ), more: { typography_line_height: em( 1 ) } } ), heading( title, { tag: 'h3', color: C.white } ), text( `<p>${ body }</p>`, { color: C.haze } ) ] ) ) ),
			], { spacing: 44 } ),
		] ),

		section( { spacing: 48 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'Instructors', 'Taught by people who do it for a living', null, { width: 64, background: C.mint } ), arrow( 'Meet them all', page( 'instructors' ) ) ] ),
			grid( { columns: 4, tablet: 2, spacing: 28, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, teachers.map( ( person ) => column( { spacing: 10, align: 'center' }, [ round( person.uid ), heading( person.name, { tag: 'h3', align: 'center', size: px( 20 ) } ), fact( person.subject, { color: C.text, size: 15, weight: 500, align: 'center' } ) ] ) ) ),
		] ),

		section( { top: 0, spacing: 0 }, [
			panel( C.lilac, [
				column( { width: 82, spacing: 22 }, [
					heading( '“I had tried three online courses and finished none. In a room with thirteen other people, I did not miss a single evening.”', { tag: 'p', size: fluid( 'clamp(1.5rem, 1.1rem + 1.8vw, 2.5rem)' ), more: { typography_line_height: em( 1.2 ) } } ),
					fact( 'Mira Castell, web development, autumn group', { color: C.text, size: 16 } ),
				] ),
			] ),
		] ),

		section( { spacing: 40 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'What is on', 'Come and see for yourself', null, { width: 64, background: C.peach } ), arrow( 'All events', page( 'events' ) ) ] ),
			column( { spacing: 20 }, events.slice( 0, 3 ).map( ( event ) => eventRow( event ) ) ),
		] ),

		openDay(),
	],
};

pages.courses = {
	title: 'Courses',
	content: [
		pageHero( C.sky, 'Courses', 'Six courses, one promise: you will make something', 'Every course ends with a project of your own. Classes run in the evening or on Saturdays, in groups of fourteen or fewer.' ),
		section( { top: 0, spacing: 0 }, [ grid( { columns: 3, spacing: 28 }, courses.map( ( course ) => courseCard( course, 'h2' ) ) ) ] ),
		section( { top: 0, spacing: 40 }, [
			intro( 'Choosing', 'Which one is for me?', null, { background: C.mint } ),
			grid( { columns: 3, spacing: 28 }, [
				[ C.mint, 'I want a new job', 'Web development, data analysis and interface design are the three that most often lead to a change of role. Each has a careers evening.' ],
				[ C.peach, 'I want to be better at the one I have', 'Writing clearly and Spanish for work fit around a full week and show results in the first month.' ],
				[ '#FFE9A8', 'I want to make things', 'Photography weekends are for the pleasure of it. No homework, four Saturdays, a lot of walking.' ],
			].map( ( [ color, title, body ] ) => panel( color, [ heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { padding: 32, spacing: 12, radius: 24 } ) ) ),
		] ),
		openDay(),
	],
};

pages[ 'course-details' ] = {
	title: 'Web development fundamentals',
	slug: 'web-development',
	content: [
		pageHero( C.sky, 'Course', 'Web development fundamentals', 'HTML, CSS and JavaScript from an empty file to a site you put online yourself.', [ chips( [ '10 weeks', 'Tue and Thu, 18:30 to 21:00', 'Beginner', 'Max. 14 students' ] ), row( { spacing: 14, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Apply for the next group', page( 'admissions' ) ), button( 'Try a free taster', page( 'events' ), { more: ghost } ) ] ) ] ),
		section( { top: 0, spacing: 0 }, [
			row( { spacing: 56, align: 'flex-start', tablet: 'column' }, [
				column( { width: 60, spacing: 40, more: { width_tablet: percent( 100 ) } }, [
					column( { spacing: 16 }, [ heading( 'What you will be able to do' ), list( [ 'Build a responsive page from a blank file', 'Lay out content with modern CSS', 'Make a page react to clicks and input with JavaScript', 'Use Git and put a site online', 'Read other people\'s code without panic', 'Know what to learn next, and where' ], { color: C.navy, iconColor: C.iris, iconName: 'check-circle' } ) ] ),
					column( { spacing: 16 }, [
						heading( 'Week by week' ),
						column( { spacing: 14 }, [
							[ 'Weeks 1 to 3', 'Pages', 'Structure with HTML, style with CSS. By the third week your first page is online.' ],
							[ 'Weeks 4 to 7', 'Behaviour', 'JavaScript from variables to events. The hard part, taken slowly, in pairs.' ],
							[ 'Weeks 8 to 10', 'Your project', 'A small site of your own choosing, built in class with help and shown to the group.' ],
						].map( ( [ when, title, body ] ) => card( [ chips( [ [ when, { background: C.sun } ] ] ), heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { padding: 24, shadow: 6, spacing: 10 } ) ) ),
					] ),
				] ),
				column( { width: 40, spacing: 28, more: { width_tablet: percent( 100 ) } }, [
					image( 'course-code' ),
					panel( C.sun, [
						fact( 'Next group starts 2 March', { size: 16, weight: 700 } ),
						heading( '€1,450', { tag: 'p', size: px( 48 ), more: { typography_line_height: em( 1 ) } } ),
						text( '<p>Everything included. Pay at once, or in three instalments at no extra cost.</p>', { color: C.navy, size: px( 16 ) } ),
						button( 'Apply now', page( 'admissions' ), { more: { align: 'justify' } } ),
					], { padding: 32, spacing: 14, radius: 24, more: { ...outlined, ...hardShadow( 8 ) } } ),
					card( [
						row( { spacing: 18, align: 'center', more: { flex_direction_mobile: 'row', flex_align_items_mobile: 'center', flex_wrap: 'nowrap' } }, [ container( { content_width: 'full', width: px( 88 ), padding: box( 0 ), _flex_size: 'none' }, [ round( 'teacher-2' ) ] ), column( { spacing: 4 }, [ fact( 'Your instructor', { color: C.text, size: 14, weight: 600 } ), heading( 'Samuel Okoye', { tag: 'h3', size: px( 20 ) } ) ] ) ] ),
						text( '<p>Front-end engineer and former apprentice. Believes nobody learns to code by watching someone else type.</p>', { size: px( 16 ) } ),
					], { padding: 24, shadow: 6 } ),
				] ),
			] ),
		] ),
		openDay(),
	],
};

pages.instructors = {
	title: 'Instructors',
	content: [
		pageHero( C.mint, 'Instructors', 'People who do the job by day and teach it by night', 'Every instructor works in the field they teach. That is why the examples are current and the advice is honest.' ),
		section( { top: 0, spacing: 0 }, [
			grid( { columns: 2, tablet: 2, spacing: 28 }, teachers.map( ( person ) =>
				card( [ row( { spacing: 24, align: 'center', more: { flex_wrap: 'nowrap' } }, [ container( { content_width: 'full', width: px( 150 ), width_mobile: px( 120 ), padding: box( 0 ), _flex_size: 'none' }, [ round( person.uid ) ] ), column( { spacing: 8, more: { flex_align_items: 'flex-start' } }, [ chip( person.subject, { background: C.sun } ), heading( person.name, { tag: 'h2', size: fluid( 'clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)' ) } ), text( `<p>${ person.bio }</p>`, { size: px( 16 ) } ) ] ) ] ) ], { padding: 28 } ) ) ),
		] ),
		section( { top: 0, spacing: 0 }, [
			panel( C.navy, [
				row( { spacing: 40, align: 'center', justify: 'space-between' }, [
					column( { width: 62, spacing: 12 }, [ heading( 'Would you like to teach with us?', { color: C.white } ), text( '<p>We look for people who are good at their work and patient with beginners. Teaching experience helps, and is not required.</p>', { color: C.haze } ) ] ),
					column( { width: 32, more: { flex_align_items: 'flex-start' } }, [ button( 'Write to us', `mailto:${ EMAIL }?subject=Teaching`, { more: onNavy } ) ] ),
				] ),
			] ),
		] ),
		section( { top: 0, bottom: 112, spacing: 0 }, [ image( 'group', { radius: 36 } ) ] ),
	],
};

pages.admissions = {
	title: 'Admissions and Fees',
	content: [
		pageHero( C.peach, 'Admissions and fees', 'Applying takes ten minutes. There is no entrance exam.', 'We ask what you want from the course and whether the evenings fit your life. That is all.' ),
		section( { top: 0, spacing: 40 }, [
			intro( 'How to apply', 'Four steps, one of them optional' ),
			grid( { columns: 4, tablet: 2, spacing: 24 }, [
				[ 'Write to us', 'Tell us which course and why. Two sentences are enough.' ],
				[ 'A short call', 'Fifteen minutes with the instructor, to check the level is right for you.' ],
				[ 'Visit (optional)', 'Come to an open day or a taster evening before you decide.' ],
				[ 'Reserve your place', 'A deposit of €100 holds your seat. The rest is due before the first class.' ],
			].map( ( [ title, body ], index ) => card( [ heading( String( index + 1 ), { tag: 'p', color: C.iris, size: px( 44 ), more: { typography_line_height: em( 1 ) } } ), heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>`, { size: px( 16 ) } ) ], { padding: 24, shadow: 6, spacing: 10 } ) ) ),
			row( { spacing: 14, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Apply by email', `mailto:${ EMAIL }?subject=Application` ), button( `Call ${ PHONE }`, TEL, { more: ghost } ) ] ),
		] ),
		section( { top: 0, spacing: 0 }, [
			panel( C.white, [
				intro( 'Fees', 'What each course costs', 'Materials, software and the certificate are included. There are no other charges.', { background: C.sun } ),
				column( { spacing: 0 }, courses.map( ( course ) =>
					container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'column', flex_align_items: 'center', flex_align_items_mobile: 'flex-start', flex_gap: gap( 24 ), flex_gap_mobile: gap( 4 ), padding: box( 18, 0 ), border_border: 'solid', border_width: box( 2, 0, 0, 0 ), border_color: C.line }, [
						column( { width: 44 }, [ heading( course.name, { tag: 'h3', size: px( 19 ) } ) ] ),
						column( { width: 16 }, [ fact( course.weeks, { color: C.text, size: 16, weight: 500 } ) ] ),
						column( { width: 26 }, [ fact( course.when, { color: C.text, size: 16, weight: 500 } ) ] ),
						column( { width: 14, more: { flex_align_items: 'flex-end', flex_align_items_mobile: 'flex-start' } }, [ fact( '€' + course.fee, { size: 19, weight: 800 } ) ] ),
					] ) ) ),
			], { padding: 48, spacing: 32, more: { ...outlined, ...hardShadow( 10 ) } } ),
		] ),
		section( { top: 0, spacing: 40 }, [
			intro( 'Paying', 'Three ways to make it affordable', null, { background: C.mint } ),
			grid( { columns: 3, spacing: 28 }, [
				[ C.mint, 'Instalments', 'Three equal payments over the length of the course, with no interest and no paperwork.' ],
				[ C.sky, 'Your employer', 'Many companies pay for training. We send an invoice and a course outline for your manager.' ],
				[ C.lilac, 'Reduced fee', 'Two places in every group are half price, for people who could not otherwise come. Just ask.' ],
			].map( ( [ color, title, body ] ) => panel( color, [ heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { padding: 32, spacing: 12, radius: 24 } ) ) ),
		] ),
		section( { top: 0, bottom: 112, spacing: 32 }, [
			intro( 'Questions', 'Before you apply', null, { background: C.peach } ),
			// Plain questions and answers: Elementor's accordion widget marks its
			// titles with ARIA attributes that do not fit their role, so it is not used.
			grid( { columns: 2, tablet: 1, spacing: 24 }, [
				[ 'What if I miss a class?', 'Every session is summarised in writing, and the instructor holds a catch-up half hour before the next class.' ],
				[ 'Do I need my own laptop?', 'For the code, data and design courses, yes. Any laptop from the last six years will do. We lend a few each term.' ],
				[ 'Is there a certificate?', 'Yes, if you attend at least eight in ten sessions and finish the project. It lists what you made, not only that you were there.' ],
				[ 'Can I get my money back?', 'In full until the second class. After that, we move your place to a later group at no cost.' ],
			].map( ( [ title, body ] ) => card( [ heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { padding: 28, shadow: 6, spacing: 10 } ) ) ),
		] ),
	],
};

pages.events = {
	title: 'Events',
	content: [
		pageHero( '#FFE9A8', 'Events', 'Open days, tasters and evenings worth leaving the sofa for', 'All of them are free. None of them needs booking, unless it says so.' ),
		section( { top: 0, spacing: 20 }, events.map( ( event ) => eventRow( event, 'h2' ) ) ),
		section( { top: 0, bottom: 112, spacing: 0 }, [
			panel( C.navy, [
				row( { spacing: 40, align: 'center', justify: 'space-between' }, [
					column( { width: 62, spacing: 12 }, [ heading( 'Cannot make any of these?', { color: C.white } ), text( '<p>Write to us and we will find twenty minutes for you to visit a class in progress.</p>', { color: C.haze } ) ] ),
					column( { width: 32, more: { flex_align_items: 'flex-start' } }, [ button( 'Arrange a visit', page( 'contact' ), { more: onNavy } ) ] ),
				] ),
			] ),
		] ),
	],
};

pages.about = {
	title: 'About',
	content: [
		pageHero( C.lilac, 'About', 'A school for people who already have a job', 'Tandem Academy started in 2016 in two rooms above a bakery, with one course and nine students.' ),
		section( { top: 0, spacing: 0 }, [
			row( { spacing: 64, align: 'center', tablet: 'column' }, [
				column( { width: 50, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					heading( 'Why evenings, and why small' ),
					text( '<p>Most adults who want to learn something new cannot stop working to do it. Online courses fit the timetable and lose most people by week three. We thought a room, a teacher and a dozen classmates would do better.</p><p>It has. Eighty-six in a hundred of our students finish, because someone notices when they are not there.</p>' ),
					arrow( 'Meet the instructors', page( 'instructors' ) ),
				] ),
				column( { width: 50, more: { width_tablet: percent( 100 ) } }, [ image( 'campus', { radius: 36 } ) ] ),
			] ),
		] ),
		section( { top: 0, spacing: 40 }, [
			intro( 'What we believe', 'Three rules we teach by', null, { background: C.mint } ),
			grid( { columns: 3, spacing: 28 }, [
				[ C.sky, 'Make, then explain', 'You build something in the first hour. The theory comes when you need it, which is when it sticks.' ],
				[ C.peach, 'Nobody is behind', 'Groups are small enough to go at the speed of the room. Asking twice is how it works.' ],
				[ C.mint, 'Finish something', 'A course ends with a project you can show, not a test you can forget.' ],
			].map( ( [ color, title, body ] ) => panel( color, [ heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { padding: 32, spacing: 12, radius: 24 } ) ) ),
		] ),
		section( { top: 0, spacing: 0 }, [ image( 'group', { radius: 36 } ) ] ),
		openDay(),
	],
};

pages.contact = {
	title: 'Contact',
	content: [
		pageHero( C.sky, 'Contact', 'Ask us anything. A person answers.', 'The office is open on weekday afternoons and before every evening class.' ),
		section( { top: 0, spacing: 0 }, [
			grid( { columns: 3, spacing: 28 }, [
				card( [ chip( 'Visit' ), heading( '14 Mill Street, second floor', { tag: 'h2', size: px( 22 ) } ), text( '<p>Above the bakery, five minutes from the station. Bike racks in the yard, lift at the side entrance.</p>', { size: px( 16 ) } ) ], { background: C.white } ),
				card( [ chip( 'Call', { background: C.mint } ), heading( PHONE, { tag: 'h2', size: px( 22 ), more: { link: link( TEL ) } } ), text( '<p>Monday to Friday, 13:00 to 18:30. Outside those hours, leave a message and we call back the next day.</p>', { size: px( 16 ) } ) ], { background: C.white } ),
				card( [ chip( 'Write', { background: C.peach } ), heading( EMAIL, { tag: 'h2', size: px( 22 ), more: { link: link( `mailto:${ EMAIL }` ) } } ), text( '<p>For applications, questions about fees, or to arrange a visit. We reply within one working day.</p>', { size: px( 16 ) } ) ], { background: C.white } ),
			] ),
		] ),
		section( { top: 0, bottom: 112, spacing: 28 }, [ image( 'campus', { radius: 36 } ), row( { spacing: 14, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Write an email', `mailto:${ EMAIL }` ), button( 'See the open days', page( 'events' ), { more: ghost } ) ] ) ] ),
	],
};

// The posts page: listed by the theme's blog template, so it has no Elementor content.
pages.news = { title: 'News', plain: true };

/* -------------------------------------------------------------------------
   Header, footer and "page not found"
   ---------------------------------------------------------------------- */
const footLinks = ( title, items ) =>
	column( { width: 20, spacing: 14, more: { width_tablet: percent( 30 ) } }, [
		fact( title, { color: C.sun, size: 14, weight: 700, more: { typography_text_transform: 'uppercase', typography_letter_spacing: px( 1.2 ) } } ),
		list( items.map( ( [ label, url ] ) => ( { text: label, url } ) ), { color: C.white, more: { view: 'traditional', icon_size: px( 0 ), text_indent: px( 0 ), text_color_hover: C.sun } } ),
	] );

const parts = {
	header: {
		title: 'Header',
		location: 'header',
		content: [
			// A floating bar: a white, outlined pill inside the page margin.
			container( { content_width: 'boxed', flex_direction: 'column', padding: box( 16, 24, 0, 24 ), padding_mobile: box( 12, 16, 0, 16 ), background_background: 'classic', background_color: C.paper }, [
				container(
					{ content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'space-between', flex_gap: gap( 24 ), flex_wrap: 'nowrap', padding: box( 10, 12, 10, 28 ), padding_mobile: box( 8, 10, 8, 20 ), background_background: 'classic', background_color: C.white, border_radius: box( 999 ), border_radius_mobile: box( 20 ), ...outlined, ...hardShadow( 5 ) },
					[
						heading( 'Tandem', { tag: 'p', color: C.navy, size: px( 26 ), weight: 800, more: { link: link( page( 'home' ) ), typography_letter_spacing: px( -0.6 ), _flex_size: 'none' } } ),
						container( { content_width: 'full', width: percent( 10 ), width_mobile: percent( 10 ), flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'flex-end', flex_gap: gap( 16 ), flex_wrap: 'nowrap', padding: box( 0 ), _flex_size: 'grow' }, [
							widget( 'of-nav-menu', { align: 'flex-end', color: C.navy, color_active: C.iris, typography_typography: 'custom', typography_font_family: SANS, typography_font_size: px( 16 ), typography_font_weight: '600', _flex_size: 'grow' } ),
							button( 'Apply', page( 'admissions' ), { more: { size: 'sm', hide_mobile: 'hidden-mobile', button_box_shadow_box_shadow_type: 'yes', button_box_shadow_box_shadow: { horizontal: 0, vertical: 0, blur: 0, spread: 0, color: 'rgba(0,0,0,0)' } } } ),
						] ),
					]
				),
			] ),
		],
	},
	footer: {
		title: 'Footer',
		location: 'footer',
		content: [
			container( { content_width: 'full', flex_direction: 'column', padding: box( 0 ), background_background: 'classic', background_color: C.paper }, [
				section( { background: C.navy, top: 80, bottom: 32, spacing: 48, more: { border_radius: { unit: 'px', top: '40', right: '40', bottom: '0', left: '0', isLinked: false }, border_radius_mobile: { unit: 'px', top: '24', right: '24', bottom: '0', left: '0', isLinked: false } } }, [
					row( { spacing: 48, align: 'flex-start', tablet: 'row', more: { flex_wrap_tablet: 'wrap' } }, [
						column( { width: 40, spacing: 14, more: { width_tablet: percent( 100 ) } }, [
							heading( 'Tandem', { tag: 'p', color: C.white, size: px( 32 ), weight: 800 } ),
							text( '<p>Evening and weekend courses for adults, in small groups, taught by people who do the job.</p>', { color: C.haze } ),
						] ),
						footLinks( 'Learn', [ [ 'Courses', page( 'courses' ) ], [ 'Instructors', page( 'instructors' ) ], [ 'Events', page( 'events' ) ], [ 'News', page( 'news' ) ] ] ),
						footLinks( 'Join', [ [ 'Admissions and fees', page( 'admissions' ) ], [ 'About', page( 'about' ) ], [ 'Contact', page( 'contact' ) ] ] ),
						footLinks( 'Reach us', [ [ EMAIL, `mailto:${ EMAIL }` ], [ PHONE, TEL ] ] ),
					] ),
					container( { content_width: 'full', flex_direction: 'column', padding: box( 24, 0, 0, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: '#33406B' }, [ fact( '© Tandem Academy. A fictional school, made for the Open Frame Education starter site.', { color: C.haze, size: 14, weight: 400 } ) ] ),
				] ),
			] ),
		],
	},
	'not-found': {
		title: 'Page not found',
		location: '404',
		content: [
			section( { top: 24, bottom: 112, spacing: 0 }, [
				panel( C.lilac, [
					column( { width: 66, spacing: 20, more: { flex_align_items: 'flex-start' } }, [
						chip( 'Error 404', { background: C.white } ),
						heading( 'This page skipped class', { tag: 'h1' } ),
						text( '<p>It is not where the link said it would be. The courses and the timetable are still here.</p>', { size: px( 20 ) } ),
						row( { spacing: 14, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Back to the home page', page( 'home' ) ), button( 'Browse courses', page( 'courses' ), { more: ghost } ) ] ),
					] ),
				], { padding: 88 } ),
			] ),
		],
	},
};

/* -------------------------------------------------------------------------
   Site Settings, theme settings, menus, media and fonts
   ---------------------------------------------------------------------- */
const displayType = ( prefix, options ) => kitTypography( prefix, { family: DISPLAY, ...options } );
const sansType = ( prefix, options ) => kitTypography( prefix, { family: SANS, ...options } );

const kit = {
	// The convention the theme's "Use Elementor global colors and fonts" option expects:
	// Primary = brand, Secondary = headings, Text = body, Accent = highlight.
	system_colors: [
		{ _id: 'primary', title: 'Primary', color: C.iris },
		{ _id: 'secondary', title: 'Secondary', color: C.navy },
		{ _id: 'text', title: 'Text', color: C.text },
		{ _id: 'accent', title: 'Accent', color: C.sun },
	],
	custom_colors: [
		{ _id: 'ofcoral', title: 'Coral', color: C.coral },
		{ _id: 'ofsky', title: 'Sky', color: C.sky },
		{ _id: 'ofmint', title: 'Mint', color: C.mint },
		{ _id: 'ofpeach', title: 'Peach', color: C.peach },
		{ _id: 'oflilac', title: 'Lilac', color: C.lilac },
		{ _id: 'ofpaper', title: 'Paper', color: C.paper },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: DISPLAY, typography_font_weight: '800' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '600' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '700' },
	],
	container_width: px( 1200 ),
	body_background_background: 'classic',
	body_background_color: C.paper,
	body_color: C.text,
	...sansType( 'body', { fontSize: px( 18 ), weight: 400, lineHeight: 1.6 } ),
	link_normal_color: C.iris,
	link_hover_color: C.irisDark,
	h1_color: C.navy,
	...displayType( 'h1', { fontSize: fluid( 'clamp(2.375rem, 1.3rem + 4.6vw, 4.5rem)' ), weight: 800, lineHeight: 1.03, spacing: -0.03 } ),
	h2_color: C.navy,
	...displayType( 'h2', { fontSize: fluid( 'clamp(1.875rem, 1.3rem + 2.4vw, 3rem)' ), weight: 800, lineHeight: 1.08, spacing: -0.025 } ),
	h3_color: C.navy,
	...displayType( 'h3', { fontSize: fluid( 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)' ), weight: 700, lineHeight: 1.2, spacing: -0.01 } ),
	h4_color: C.navy,
	...sansType( 'h4', { fontSize: px( 18 ), weight: 700, lineHeight: 1.35 } ),
	...sansType( 'button', { fontSize: px( 16 ), weight: 700, lineHeight: 1.2 } ),
	button_text_color: C.white,
	button_background_color: C.iris,
	button_hover_text_color: C.white,
	button_hover_background_color: C.navy,
	button_border_border: 'solid',
	button_border_width: box( 2 ),
	button_border_color: C.navy,
	button_border_radius: box( 999 ),
	button_padding: box( 15, 26 ),
	button_box_shadow_box_shadow_type: 'yes',
	button_box_shadow_box_shadow: { horizontal: 4, vertical: 4, blur: 0, spread: 0, color: C.navy },
};

const themeMods = {
	open_frame_follow_elementor: true,
	open_frame_color_primary: C.iris.toLowerCase(),
	open_frame_color_primary_hover: C.irisDark.toLowerCase(),
	open_frame_color_heading: C.navy.toLowerCase(),
	open_frame_color_text: C.text.toLowerCase(),
	open_frame_color_link: C.iris.toLowerCase(),
	open_frame_color_link_hover: C.irisDark.toLowerCase(),
	open_frame_color_accent: C.sun.toLowerCase(),
	open_frame_color_border: C.line.toLowerCase(),
	open_frame_color_bg: C.paper.toLowerCase(),
	open_frame_color_surface: C.white.toLowerCase(),
	open_frame_container_width: 1200,
	open_frame_blog_style: 'grid',
	open_frame_blog_columns: 3,
	open_frame_blog_title: true,
	open_frame_blog_layout: 'full-width',
	open_frame_single_layout: 'no-sidebar',
	open_frame_page_layout: 'no-sidebar',
};

const licence = 'CC0-1.0. Original artwork generated for this starter site (tools/sites/education-art.mjs).';
const mediaIndex = [
	{ uid: 'hero', file: 'hero.jpg', alt: 'A laptop on a stack of books, with a plant and a mug' },
	...courses.map( ( course ) => ( { uid: course.uid, file: course.uid + '.jpg', alt: `Illustration for the course “${ course.name }”` } ) ),
	{ uid: 'campus', file: 'campus.jpg', alt: 'The academy building, with trees on both sides' },
	{ uid: 'group', file: 'group.jpg', alt: 'Five students standing together' },
	...teachers.map( ( person ) => ( { uid: person.uid, file: person.uid + '.jpg', alt: `Illustrated portrait of ${ person.name }` } ) ),
	...posts.map( ( post ) => ( { uid: post.image, file: post.image + '.jpg', alt: '' } ) ),
].map( ( entry ) => ( { ...entry, licence } ) );

const fonts = [
	{ family: DISPLAY, weight: '200 800', style: 'normal', file: 'bricolage-grotesque-latin.woff2', licence: 'OFL-1.1. Copyright 2022 The Bricolage Grotesque Project Authors.' },
	{ family: SANS, weight: '300 900', style: 'normal', file: 'figtree-latin.woff2', licence: 'OFL-1.1. Copyright 2022 The Figtree Project Authors.' },
];

const used = writeSite( {
	site: SITE,
	out: OUT,
	pages,
	parts,
	posts,
	kit,
	themeMods,
	options: { show_on_front: 'page', page_on_front: page( 'home' ), page_for_posts: page( 'news' ) },
	menus: [ { uid: 'primary', name: 'Primary', location: 'primary', items: [ [ 'Courses', 'courses' ], [ 'Instructors', 'instructors' ], [ 'Admissions', 'admissions' ], [ 'Events', 'events' ], [ 'About', 'about' ], [ 'News', 'news' ], [ 'Contact', 'contact' ] ].map( ( [ title, name ] ) => ( { title, url: page( name ) } ) ) } ],
	media: mediaIndex,
	fonts,
	catalog: {
		summary: 'A bright, friendly site for an academy or training centre: courses, a course page with syllabus and fee, instructors, admissions and fees, events and news.',
		colors: [ C.sun.toLowerCase(), C.iris.toLowerCase(), C.navy.toLowerCase() ],
		pages: [ 'Home', 'Courses', 'Course Details', 'Instructors', 'Admissions and Fees', 'Events', 'About', 'News (blog)', 'Single Post', 'Contact', '404' ],
		screenshots: [ { title: 'Courses', file: 'courses.png' }, { title: 'Course details', file: 'course.png' }, { title: 'Admissions and fees', file: 'admissions.png' } ],
		requires: { importer: '0.4.0' },
	},
} );

console.log( `Education: ${ Object.keys( pages ).length } pages, ${ Object.keys( parts ).length } site parts, ${ posts.length } posts. Widgets: ${ used.join( ', ' ) }` );
