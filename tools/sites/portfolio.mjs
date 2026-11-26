#!/usr/bin/env node
/**
 * The Portfolio starter site ("Juno Vale", an independent designer), written as data.
 *
 *   node tools/sites/portfolio.mjs
 *
 * Writes starter-sites/portfolio/{site.json, site/, content/, media/index.json,
 * fonts/index.json}. The images come from tools/sites/portfolio-art.mjs. See
 * brief.md in the site folder for the design decisions this file implements.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks, box, builders, em, fluid, gap, icon, ids, kitTypography, link, page, percent, px, writeSite } from './kit.mjs';

const SITE = 'portfolio';
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', SITE );

/* -------------------------------------------------------------------------
   Design tokens (see brief.md)
   ---------------------------------------------------------------------- */
const C = {
	paper: '#F4EFE7',
	sand: '#E9E1D4',
	ink: '#1C1917',
	text: '#4A443D',
	rust: '#A8390B',
	rustDark: '#832B07',
	line: '#D6CBBB',
	white: '#FFFDF9',
	stone: '#B9AFA2', // Text on the ink band.
	blush: '#F7E4D8', // Text on the rust band.
};
const SERIF = 'Fraunces';
const SANS = 'Instrument Sans';
const EMAIL = 'hello@example.com';

const b = builders( ids() );
const { section, row, column, grid, text, list, container, widget } = b;

/* -------------------------------------------------------------------------
   Components of this design
   ---------------------------------------------------------------------- */
const sans = { typography_typography: 'custom', typography_font_family: SANS };

/** Plain buttons are left to Elementor: its Accent color (rust here) and the button style of Site Settings. */
const button = ( title, url, options = {} ) => b.button( title, url, { ...options, kit: true } );

/** Figures are set in the light serif of the headings. */
const counter = ( number, title, options = {} ) => b.counter( number, title, { weight: 400, ...options } );

/** A serif heading. `<em>` inside a title is set in the italic of the typeface. */
const heading = ( title, options = {} ) => b.heading( title, options );

/** Small uppercase label in the sans typeface. */
const label = ( title, { color = C.text, align } = {} ) =>
	b.heading( title, { tag: 'p', color, align, more: { ...sans, typography_font_size: px( 13 ), typography_font_weight: '600', typography_text_transform: 'uppercase', typography_letter_spacing: px( 1.3 ), typography_line_height: em( 1.4 ) } } );

/** A line of sans text set as a heading widget, for facts and captions. */
const fact = ( title, { color = C.ink, size = 17, weight = 500, align, more = {} } = {} ) =>
	b.heading( title, { tag: 'p', color, align, more: { ...sans, typography_font_size: px( size ), typography_font_weight: String( weight ), typography_line_height: em( 1.45 ), ...more } } );

/** A text link with an arrow: a button widget without its box. */
const arrow = ( title, url, { color = C.ink, hover = C.rust, more = {} } = {} ) =>
	button( title, url, {
		more: {
			background_color: 'transparent',
			button_background_hover_color: 'transparent',
			button_text_color: color,
			hover_color: hover,
			selected_icon: icon( 'arrow-right' ),
			icon_align: 'row-reverse',
			icon_indent: px( 10 ),
			border_border: 'solid',
			border_width: box( 0, 0, 1.5, 0 ),
			border_color: color,
			button_hover_border_color: hover,
			border_radius: box( 0 ),
			text_padding: box( 0, 0, 6, 0 ),
			// Never squeezed by a sibling: the label stays on one line.
			_flex_size: 'none',
			...more,
		},
	} );

/** An image with the small radius of this design, optionally a link. */
const image = ( uid, { url, radius = 6, more = {} } = {} ) => b.image( uid, { radius, more: { ...( url ? { link_to: 'custom', link: link( url ) } : {} ), ...more } } );

/** A block that starts with a hairline. */
const ruled = ( elements, { spacing = 14, top = 28, bottom = 28, color = C.line, more = {} } = {} ) =>
	container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( spacing ), padding: box( top, 0, bottom, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: color, ...more }, elements );

/** A numbered row: number, title and text side by side, under a hairline. */
const numbered = ( number, title, body, { tag = 'h3', extra = [], color = C.line } = {} ) =>
	container(
		{ content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'column', flex_gap: gap( 32 ), flex_gap_mobile: gap( 10 ), padding: box( 32, 0, 32, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: color },
		[
			column( { width: 12 }, [ fact( number, { color: C.rust, size: 15, weight: 600 } ) ] ),
			column( { width: 88, spacing: 12 }, [ heading( title, { tag } ), text( `<p>${ body }</p>` ), ...extra ] ),
		]
	);

/** One project in a list of work: cover, title and year, discipline. */
const tile = ( project, tag = 'h3' ) =>
	column( { spacing: 16 }, [
		image( project.uid, { url: page( 'project-details' ) } ),
		row( { spacing: 16, align: 'baseline', justify: 'space-between', more: { flex_direction_mobile: 'row', flex_align_items_mobile: 'baseline' } }, [
			heading( project.name, { tag, ...( tag === 'h3' ? {} : { size: fluid( 'clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)' ), weight: 500 } ), more: { link: link( page( 'project-details' ) ), ...( tag === 'h3' ? {} : { typography_line_height: em( 1.2 ) } ) } } ),
			fact( project.year, { color: C.text, size: 15 } ),
		] ),
		fact( project.kind, { color: C.text, size: 16, weight: 400, more: { _margin: { unit: 'px', top: '-8', right: '0', bottom: '0', left: '0', isLinked: false } } } ),
	] );

/** Projects in two columns, the second one starting lower. */
const staggered = ( left, right, tag = 'h3' ) =>
	row( { spacing: 48, align: 'flex-start' }, [
		column( { width: 50, spacing: 72, more: { flex_gap_mobile: gap( 40 ) } }, left.map( ( project ) => tile( project, tag ) ) ),
		column( { width: 50, spacing: 72, more: { padding: box( 140, 0, 0, 0 ), padding_tablet: box( 80, 0, 0, 0 ), padding_mobile: box( 8, 0, 0, 0 ), flex_gap_mobile: gap( 40 ) } }, right.map( ( project ) => tile( project, tag ) ) ),
	] );

/** The top of an inner page: label, large title and one sentence. */
const pageHero = ( name, title, lead ) =>
	section( { top: 104, bottom: 72, spacing: 28 }, [
		label( name ),
		column( { width: 86 }, [ heading( title, { tag: 'h1' } ) ] ),
		...( lead ? [ column( { width: 54 }, [ text( `<p>${ lead }</p>`, { size: px( 20 ) } ) ] ) ] : [] ),
	] );

/* -------------------------------------------------------------------------
   Content
   ---------------------------------------------------------------------- */
const projects = [
	{ uid: 'work-tidewater', name: 'Tidewater Coffee Roasters', year: '2025', kind: 'Identity and packaging' },
	{ uid: 'work-fieldnote', name: 'Fieldnote', year: '2025', kind: 'Product design for a walking journal' },
	{ uid: 'work-kite', name: 'Paper Kite Books', year: '2024', kind: 'Cover series and art direction' },
	{ uid: 'work-lumen', name: 'Lumen Cycles', year: '2024', kind: 'Identity and retail graphics' },
	{ uid: 'work-atlas', name: 'Atlas Museum of Maps', year: '2023', kind: 'Identity and wayfinding' },
	{ uid: 'work-sol', name: 'Sol Skincare', year: '2022', kind: 'Packaging system' },
];
const [ tidewater, fieldnote, kite, lumen, atlas, sol ] = projects;

const services = [
	[ 'Brand identity', 'A name people can say, a mark they can draw from memory and a system your team can use without calling me. From strategy to guidelines.' ],
	[ 'Product design', 'Interfaces for web and mobile, designed in the browser as early as possible. I work inside your team, with your engineers, in two-week cycles.' ],
	[ 'Art direction', 'Campaigns, book covers and packaging. I bring in the photographers, illustrators and printers the job needs, and stay until it is on the shelf.' ],
];

const posts = [
	{
		name: 'saying-no',
		title: 'The projects I turned down last year, and why',
		excerpt: 'A small studio is shaped as much by the work it refuses as by the work it shows. Seven enquiries I declined, and what each one taught me.',
		image: 'note-1',
		category: 'Practice',
		days: 9,
		content: [
			blocks.paragraph( 'A small studio is shaped as much by the work it refuses as by the work it shows. Last year I said no to seven enquiries. None of them was a bad client. Each was a bad fit, which is harder to spot and more expensive to ignore.' ),
			blocks.heading( 'When the deadline is the brief' ),
			blocks.paragraph( 'Three of the seven needed an identity in under three weeks. It can be done, and the result always looks like it. I now ask one question first: what happens if this launches a month later? If the honest answer is "nothing much", there is time to do it properly.' ),
			blocks.heading( 'When nobody can decide' ),
			blocks.paragraph( 'Two had no single person who could approve the work. A committee can choose between options, but it cannot commission a point of view. I offered a short workshop to agree who decides, and one of them took it.' ),
			blocks.quote( 'A good no is specific. It says what would have to change for the answer to be yes.' ),
			blocks.paragraph( `If you are weighing up a project and are not sure it is ready for a designer, <a href="${ page( 'contact' ) }">write to me anyway</a>. Sometimes the useful answer is "not yet".` ),
		],
	},
	{
		name: 'systems-not-pages',
		title: 'Design the system first, the pages second',
		excerpt: 'Most identity projects fail quietly, a year later, when the tenth person has to make the hundredth thing. How I plan for that person.',
		image: 'note-2',
		category: 'Process',
		days: 24,
		content: [
			blocks.paragraph( 'Most identity projects fail quietly, a year after launch, when the tenth person has to make the hundredth thing and the guidelines have no answer. The logo was never the problem. The system was.' ),
			blocks.heading( 'Start with the awkward formats' ),
			blocks.paragraph( 'I begin with the pieces nobody puts in a case study: the invoice, the delivery label, the job advert, the slide with too much text. If the idea survives those, the hero image will take care of itself.' ),
			blocks.list( [ 'One typeface that does the work of three', 'A grid that still holds when the text doubles', 'Colour rules short enough to remember' ] ),
			blocks.heading( 'Hand over less' ),
			blocks.paragraph( 'A forty-page guideline is a sign that the system is too complicated. The ones that get used fit on a poster by the printer. I aim for six rules and a folder of real examples.' ),
		],
	},
	{
		name: 'better-briefs',
		title: 'Five questions that make a better brief',
		excerpt: 'You do not need a formal document to start a design project. You need honest answers to five questions, most of them about your customers.',
		image: 'note-3',
		category: 'Process',
		days: 41,
		content: [
			blocks.paragraph( 'You do not need a formal document to start a design project. You need honest answers to five questions, and most of them are about your customers rather than about design.' ),
			blocks.list( [ 'Who has to notice this, and where will they be when they do?', 'What do they believe about you today?', 'What should they do next?', 'What must not change?', 'How will we know it worked?' ] ),
			blocks.heading( 'The one people skip' ),
			blocks.paragraph( 'The fourth question is the one that saves projects. Every company has something its customers are quietly attached to: a colour, a phrase, the way the box opens. Find it before the redesign does.' ),
			blocks.paragraph( `Send me your answers, however rough, and <a href="${ page( 'contact' ) }">we can take it from there</a>.` ),
		],
	},
];

/* -------------------------------------------------------------------------
   Pages
   ---------------------------------------------------------------------- */
const pages = {};

pages.home = {
	title: 'Home',
	front_page: true,
	content: [
		section( { top: 96, bottom: 72, spacing: 40 }, [
			list( [ { text: 'Booking projects from March', icon: 'circle' } ], { color: C.ink, iconColor: C.rust, more: { icon_size: px( 9 ), text_indent: px( 10 ), icon_typography_typography: 'custom', icon_typography_font_size: px( 15 ), icon_typography_font_weight: '500' } } ),
			heading( 'Brand identities and digital products for companies with <em>something to say</em>.', { tag: 'h1' } ),
			row( { spacing: 48, align: 'flex-end', justify: 'space-between' }, [
				column( { width: 48 }, [ text( '<p>I am Juno Vale, an independent designer in Lisbon. For twelve years I have helped founders, publishers and makers look like what they are, and work the way they promise.</p>', { size: px( 20 ) } ) ] ),
				row( { spacing: 28, align: 'center', more: { width: percent( 40 ), width_mobile: percent( 100 ), flex_justify_content: 'flex-end', flex_justify_content_mobile: 'flex-start', flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [
					button( 'See selected work', page( 'work' ) ),
					arrow( 'About me', page( 'about' ) ),
				] ),
			] ),
		] ),

		section( { top: 0, bottom: 112, spacing: 18 }, [
			image( 'feature', { url: page( 'project-details' ) } ),
			row( { spacing: 24, align: 'baseline', justify: 'space-between' }, [
				fact( 'Tidewater Coffee Roasters. Identity and packaging, 2025', { color: C.text, size: 16, weight: 400 } ),
				arrow( 'View the project', page( 'project-details' ) ),
			] ),
		] ),

		section( { top: 0, bottom: 128, spacing: 56 }, [
			row( { spacing: 24, align: 'flex-end', justify: 'space-between', more: { flex_direction_mobile: 'row', flex_align_items_mobile: 'flex-end' } }, [
				column( { spacing: 14 }, [ label( 'Selected work' ), heading( 'Recent projects' ) ] ),
				arrow( 'All work', page( 'work' ) ),
			] ),
			staggered( [ fieldnote, lumen ], [ kite, atlas ] ),
		] ),

		section( { background: C.sand, spacing: 0 }, [
			row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
				column( { width: 36, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					label( 'Services' ),
					heading( 'Three ways to work together' ),
					text( '<p>Most projects start as one of these and borrow from the others. All of them start with a conversation.</p>' ),
					arrow( 'How it works', page( 'services' ) ),
				] ),
				column( { width: 64, spacing: 0, more: { width_tablet: percent( 100 ) } }, services.map( ( [ title, body ], index ) => numbered( '0' + ( index + 1 ), title, body, { color: '#C9BCA8' } ) ) ),
			] ),
		] ),

		section( { spacing: 0 }, [
			row( { spacing: 80, align: 'center', tablet: 'column' }, [
				column( { width: 40, more: { width_tablet: percent( 100 ) } }, [ image( 'portrait' ) ] ),
				column( { width: 60, spacing: 24, more: { width_tablet: percent( 100 ) } }, [
					label( 'About' ),
					heading( 'One designer, start to finish' ),
					text( '<p>There is no account manager and no junior team. You talk to the person doing the work, which keeps projects short and decisions clear. When a job needs more hands, I bring in people I have worked with for years.</p>' ),
					grid( { columns: 3, tablet: 3, spacing: 24, more: { grid_columns_grid_mobile: { unit: 'fr', size: 1, sizes: [] } } }, [
						ruled( [ heading( '12', { tag: 'p', size: fluid( 'clamp(2rem, 1.5rem + 2vw, 3rem)' ) } ), fact( 'years independent', { color: C.text, size: 15, weight: 400 } ) ], { spacing: 6, top: 18, bottom: 0 } ),
						ruled( [ heading( '70+', { tag: 'p', size: fluid( 'clamp(2rem, 1.5rem + 2vw, 3rem)' ) } ), fact( 'projects delivered', { color: C.text, size: 15, weight: 400 } ) ], { spacing: 6, top: 18, bottom: 0 } ),
						ruled( [ heading( '9', { tag: 'p', size: fluid( 'clamp(2rem, 1.5rem + 2vw, 3rem)' ) } ), fact( 'countries, mostly remote', { color: C.text, size: 15, weight: 400 } ) ], { spacing: 6, top: 18, bottom: 0 } ),
					] ),
					arrow( 'More about me', page( 'about' ) ),
				] ),
			] ),
		] ),

		section( { background: C.rust, top: 112, spacing: 28 }, [
			column( { width: 84, spacing: 28 }, [
				heading( '“Juno asked better questions about our business than our investors did. The identity came out of the answers.”', { tag: 'p', color: C.white, size: fluid( 'clamp(1.625rem, 1.1rem + 2.2vw, 2.75rem)' ), more: { typography_font_style: 'italic', typography_line_height: em( 1.22 ) } } ),
				fact( 'Inês Bragança, founder of Tidewater Coffee Roasters', { color: C.blush, size: 16, weight: 500 } ),
			] ),
		] ),
	],
};

pages.about = {
	title: 'About',
	content: [
		pageHero( 'About', 'I make brands easier to recognise and products easier to <em>use</em>.' ),
		section( { top: 0, bottom: 112, spacing: 0 }, [
			row( { spacing: 80, align: 'flex-start', tablet: 'column' }, [
				column( { width: 42, more: { width_tablet: percent( 100 ) } }, [ image( 'portrait' ) ] ),
				column( { width: 58, spacing: 22, more: { width_tablet: percent( 100 ) } }, [
					heading( 'Hello, I am Juno.', { tag: 'h2' } ),
					text( '<p>I trained as a typographer, spent six years in agencies in Rotterdam and London, and went independent in 2014. Since then I have worked with about seventy companies, from a two-person roastery to a national museum.</p><p>I like projects where the design has a job to do: a product that has to explain itself, a shop that has to be found, a book that has to be picked up. I am less useful when the brief is to look expensive.</p><p>I work alone by choice and in company when the job needs it. Over the years I have built a small circle of developers, writers, photographers and printers who know how I work.</p>' ),
					arrow( 'See my resume', page( 'resume' ) ),
				] ),
			] ),
		] ),
		section( { background: C.sand, spacing: 48 }, [
			column( { width: 60, spacing: 16 }, [ label( 'How I work' ), heading( 'Three habits I will not give up' ) ] ),
			grid( { columns: 3, spacing: 40 }, [
				[ 'Show early', 'You see rough work in the first week. It is cheaper to be wrong on Tuesday than at the presentation.' ],
				[ 'Write it down', 'Every decision gets a sentence explaining why. When someone asks in a year, the answer exists.' ],
				[ 'Design the boring parts', 'The invoice, the error message, the label on the back. That is where a brand is kept or lost.' ],
			].map( ( [ title, body ], index ) => ruled( [ fact( '0' + ( index + 1 ), { color: C.rust, size: 15, weight: 600 } ), heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { color: '#C9BCA8', bottom: 0 } ) ) ),
		] ),
		section( { bottom: 64, spacing: 0 }, [ image( 'studio' ) ] ),
		section( { top: 0, bottom: 128, spacing: 40 }, [
			column( { width: 60, spacing: 16 }, [ label( 'Clients' ), heading( 'Some of the people I have worked with' ) ] ),
			grid( { columns: 4, tablet: 2, spacing: 0, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, [ 'Tidewater', 'Fieldnote', 'Atlas Museum', 'Lumen Cycles', 'Paper Kite Books', 'Sol Skincare', 'Northgate Press', 'Harbor Studio' ].map( ( name ) =>
				ruled( [ heading( name, { tag: 'p', size: fluid( 'clamp(1.125rem, 1rem + 0.6vw, 1.5rem)' ) } ) ], { top: 22, bottom: 22 } ) ) ),
		] ),
	],
};

pages.work = {
	title: 'Work',
	content: [
		pageHero( 'Work', 'Selected work, 2022 to <em>2025</em>', 'Six projects, chosen because each one changed something measurable for the client. There are case studies for the ones I am allowed to talk about.' ),
		section( { top: 0, bottom: 128, spacing: 0 }, [ staggered( [ tidewater, kite, atlas ], [ fieldnote, lumen, sol ], 'h2' ) ] ),
	],
};

const meta = ( name, value ) => ruled( [ label( name ), fact( value, { size: 17 } ) ], { spacing: 8, top: 20, bottom: 0 } );

pages[ 'project-details' ] = {
	title: 'Tidewater Coffee Roasters',
	slug: 'tidewater-coffee-roasters',
	content: [
		pageHero( 'Case study', 'Tidewater Coffee <em>Roasters</em>', 'A new identity and packaging for a roastery on the Atlantic coast that had outgrown its market stall.' ),
		section( { top: 0, bottom: 72, spacing: 0 }, [
			grid( { columns: 4, tablet: 2, spacing: 32, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, [ meta( 'Client', 'Tidewater Coffee Roasters' ), meta( 'Year', '2025' ), meta( 'Role', 'Identity, packaging, art direction' ), meta( 'With', 'Ana Duarte, illustration' ) ] ),
		] ),
		section( { top: 0, bottom: 112, spacing: 0 }, [ image( 'feature' ) ] ),
		section( { top: 0, bottom: 72, spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start' }, [
				column( { width: 50, spacing: 16 }, [ heading( 'The brief' ), text( '<p>Tidewater sold out every weekend at the market and nowhere else. Cafés liked the coffee and could not remember the name; the bags were brown paper with a rubber stamp. The founders wanted to reach shops and online customers without looking like every other speciality roaster.</p>' ) ] ),
				column( { width: 50, spacing: 16 }, [ heading( 'The approach' ), text( '<p>I spent two days at the roastery before drawing anything. What stayed with me was the sound: the roaster sits forty metres from the sea. The mark became three lines of water, and the palette came from the building itself: kiln red, roasted black, kelp green.</p>' ) ] ),
			] ),
		] ),
		section( { top: 0, bottom: 112, spacing: 24 }, [ grid( { columns: 2, tablet: 2, spacing: 24 }, [ image( 'detail-marks' ), image( 'detail-palette' ) ] ) ] ),
		section( { background: C.sand, spacing: 48 }, [
			column( { width: 60, spacing: 16 }, [ label( 'The outcome' ), heading( 'Recognised on the shelf, and reordered' ), text( '<p>The new bags launched in March. Within one quarter the roastery had moved from a market stall to a wholesale business with a waiting list.</p>' ) ] ),
			grid( { columns: 3, tablet: 3, spacing: 32 }, [
				counter( 64, 'cafés and shops now stock it', { color: C.ink, titleColor: C.text } ),
				counter( 38, 'more online orders in the first quarter', { suffix: '%', color: C.ink, titleColor: C.text } ),
				counter( 9, 'weeks from first call to launch', { color: C.ink, titleColor: C.text } ),
			] ),
		] ),
		section( { bottom: 96, spacing: 0 }, [ image( 'detail-wide' ) ] ),
		section( { top: 0, bottom: 128, spacing: 0 }, [
			ruled( [
				row( { spacing: 24, align: 'center', justify: 'space-between' }, [
					column( { spacing: 10 }, [ label( 'Next project' ), heading( 'Fieldnote', { tag: 'h2', more: { link: link( page( 'work' ) ) } } ) ] ),
					arrow( 'Back to all work', page( 'work' ) ),
				] ),
			], { top: 40, bottom: 0 } ),
		] ),
	],
};

pages.services = {
	title: 'Services',
	content: [
		pageHero( 'Services', 'Three ways to work <em>together</em>', 'Fixed scope, fixed fee, and one person responsible for the result. If you are not sure which of these you need, start with a conversation.' ),
		section( { top: 0, bottom: 96, spacing: 0 }, [
			...[
				[ 'Brand identity', services[ 0 ][ 1 ], [ 'Positioning and naming', 'Logo, typography and colour', 'Guidelines your team will use' ], '8 to 10 weeks', page( 'service-details' ) ],
				[ 'Product design', services[ 1 ][ 1 ], [ 'Research and prototypes', 'Interface and design system', 'Working alongside engineering' ], 'From 6 weeks, in two-week cycles', null ],
				[ 'Art direction', services[ 2 ][ 1 ], [ 'Campaign and packaging concepts', 'Commissioning and shoots', 'Print supervision' ], '4 to 12 weeks', null ],
			].map( ( [ title, body, items, time, url ], index ) =>
				container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'column', flex_gap: gap( 48 ), flex_gap_mobile: gap( 16 ), padding: box( 48, 0, 48, 0 ), padding_mobile: box( 32, 0, 32, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.line }, [
					column( { width: 8 }, [ fact( '0' + ( index + 1 ), { color: C.rust, size: 15, weight: 600 } ) ] ),
					column( { width: 50, spacing: 16 }, [ heading( title, { tag: 'h2' } ), text( `<p>${ body }</p>` ), ...( url ? [ arrow( 'What is included', url ) ] : [] ) ] ),
					column( { width: 34, spacing: 18 }, [ list( items, { iconName: 'minus', color: C.ink, iconColor: C.rust } ), fact( time, { color: C.text, size: 15, weight: 400 } ) ] ),
				] ) ),
		] ),
		section( { background: C.sand, spacing: 48 }, [
			column( { width: 60, spacing: 16 }, [ label( 'Process' ), heading( 'What happens, and when' ) ] ),
			grid( { columns: 4, tablet: 2, spacing: 32 }, [
				[ 'Listen', 'A call, then a visit if I can. I read what your customers write about you before I read your deck.' ],
				[ 'Propose', 'Two pages: what I will do, what it costs, when you will see things. No surprises later.' ],
				[ 'Make', 'Rough work in week one, weekly reviews after. You always know what is finished and what is not.' ],
				[ 'Hand over', 'Files, guidelines and a session with your team. I stay available for a month at no charge.' ],
			].map( ( [ title, body ], index ) => ruled( [ fact( '0' + ( index + 1 ), { color: C.rust, size: 15, weight: 600 } ), heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { color: '#C9BCA8', bottom: 0 } ) ) ),
		] ),
		section( { spacing: 40 }, [
			column( { width: 60, spacing: 16 }, [ label( 'Questions' ), heading( 'Before you write' ) ] ),
			column( { spacing: 0 }, [
				[ 'How far ahead are you booked?', 'Usually six to eight weeks. The line at the top of the home page is kept up to date.' ],
				[ 'Do you work with agencies?', 'Yes, as an art director or identity designer on a named project, under my own name or theirs.' ],
				[ 'Can you build the website too?', 'I design it and work with a developer I trust to build it. You get one contract and one invoice.' ],
				[ 'What does a project cost?', 'Identity projects start at €9,000 and product work at €1,200 a day. A proposal always states a fixed total.' ],
			].map( ( [ question, answer ] ) => ruled( [ row( { spacing: 40, align: 'flex-start' }, [ column( { width: 42 }, [ heading( question, { tag: 'h3' } ) ] ), column( { width: 58 }, [ text( `<p>${ answer }</p>` ) ] ) ] ) ], { top: 28, bottom: 28 } ) ) ),
		] ),
	],
};

pages[ 'service-details' ] = {
	title: 'Brand identity',
	slug: 'brand-identity',
	content: [
		pageHero( 'Service', 'Brand identity, from first question to final <em>file</em>', 'For companies that are launching, growing out of their first logo, or about to be seen by many more people.' ),
		section( { top: 0, bottom: 96, spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 58, spacing: 0, more: { width_tablet: percent( 100 ) } }, [
					[ 'Weeks 1 to 2', 'Discovery', 'Interviews with you, your team and five customers. A one-page positioning statement we both sign.' ],
					[ 'Weeks 3 to 5', 'Directions', 'Two distinct routes, each shown on real things: a bag, a van, a home page. You choose one.' ],
					[ 'Weeks 6 to 8', 'System', 'The chosen route becomes a full identity: mark, type, colour, layout and tone of voice.' ],
					[ 'Weeks 9 to 10', 'Handover', 'Guidelines, templates and a working session with whoever will use them.' ],
				].map( ( [ when, title, body ] ) => ruled( [ label( when, { color: C.rust } ), heading( title, { tag: 'h2', size: fluid( 'clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)' ), weight: 500 } ), text( `<p>${ body }</p>` ) ], { spacing: 10 } ) ) ),
				column( { width: 42, more: { width_tablet: percent( 100 ) } }, [
					container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 20 ), padding: box( 36 ), padding_mobile: box( 24 ), background_background: 'classic', background_color: C.sand, border_radius: box( 6 ) }, [
						label( 'What you receive' ),
						list( [ 'Positioning statement', 'Logo in every format you will need', 'Typeface licences and colour values', 'Templates for print and screen', 'A guideline that fits on a poster' ], { iconName: 'minus', color: C.ink, iconColor: C.rust } ),
						ruled( [ heading( 'From €9,000', { tag: 'p', size: fluid( 'clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)' ) } ), fact( '8 to 10 weeks, fixed fee, paid in three parts', { color: C.text, size: 15, weight: 400 } ) ], { spacing: 6, top: 22, bottom: 4, color: '#C9BCA8' } ),
						button( 'Ask about availability', page( 'contact' ), { more: { align: 'justify' } } ),
					] ),
				] ),
			] ),
		] ),
		section( { top: 0, bottom: 128, spacing: 24 }, [ grid( { columns: 2, tablet: 2, spacing: 24 }, [ image( 'detail-palette', { url: page( 'project-details' ) } ), image( 'detail-marks', { url: page( 'project-details' ) } ) ] ), row( { spacing: 24, align: 'baseline', justify: 'space-between' }, [ fact( 'Identity work for Tidewater Coffee Roasters', { color: C.text, size: 16, weight: 400 } ), arrow( 'See the case study', page( 'project-details' ) ) ] ) ] ),
	],
};

/** A line of the resume: years, role and place, a sentence. */
const entry = ( years, title, place, body ) =>
	container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'column', flex_gap: gap( 40 ), flex_gap_mobile: gap( 8 ), padding: box( 28, 0, 28, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.line }, [
		column( { width: 20 }, [ fact( years, { color: C.text, size: 15 } ) ] ),
		column( { width: 80, spacing: 8 }, [ heading( title, { tag: 'h3' } ), fact( place, { color: C.rust, size: 15, weight: 600 } ), ...( body ? [ text( `<p>${ body }</p>` ) ] : [] ) ] ),
	] );

const resumeBlock = ( name, title, entries ) =>
	section( { top: 0, bottom: 96, spacing: 0 }, [
		row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
			column( { width: 28, spacing: 14, more: { width_tablet: percent( 100 ) } }, [ label( name ), heading( title ) ] ),
			column( { width: 72, spacing: 0, more: { width_tablet: percent( 100 ) } }, entries ),
		] ),
	] );

pages.resume = {
	title: 'Resume',
	content: [
		pageHero( 'Resume', 'Twelve years independent, six before that in <em>studios</em>', null ),
		section( { top: 0, bottom: 96, spacing: 0 }, [ row( { spacing: 28, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Email me for a PDF copy', `mailto:${ EMAIL }?subject=Resume` ), arrow( 'See the work', page( 'work' ) ) ] ) ] ),
		resumeBlock( 'Experience', 'Where I have worked', [
			entry( '2014 to now', 'Independent designer', 'Juno Vale Studio, Lisbon', 'Identity, product design and art direction for about seventy clients in nine countries.' ),
			entry( '2011 to 2014', 'Senior designer', 'Marlowe and Finch, London', 'Led identity projects for cultural and retail clients; ran a team of four.' ),
			entry( '2008 to 2011', 'Designer', 'Studio Kade, Rotterdam', 'Editorial and exhibition design. Learned to set type properly.' ),
		] ),
		resumeBlock( 'Education', 'Where I studied', [
			entry( '2006 to 2008', 'MA Type and Media', 'Royal Academy of Art, The Hague', null ),
			entry( '2003 to 2006', 'BA Graphic Design', 'Faculty of Fine Arts, Porto', null ),
		] ),
		resumeBlock( 'Recognition', 'Awards and talks', [
			entry( '2025', 'Packaging of the year, shortlist', 'European Design Awards', 'For Tidewater Coffee Roasters.' ),
			entry( '2024', '“Design the boring parts”', 'Talk at Offset Lisbon', null ),
			entry( '2023', 'Identity, gold', 'Iberian Design Annual', 'For Atlas Museum of Maps.' ),
		] ),
		section( { background: C.sand, spacing: 40 }, [
			column( { width: 60, spacing: 16 }, [ label( 'Skills' ), heading( 'What I do myself, and what I direct' ) ] ),
			grid( { columns: 3, spacing: 40 }, [
				[ 'Design', [ 'Identity systems', 'Typography and type selection', 'Packaging', 'Interface design' ] ],
				[ 'Tools', [ 'Figma', 'Glyphs', 'InDesign and Illustrator', 'HTML and CSS, enough to prototype' ] ],
				[ 'Direction', [ 'Photography and illustration', 'Copywriting', 'Front-end development', 'Print production' ] ],
			].map( ( [ title, items ] ) => ruled( [ heading( title, { tag: 'h3' } ), list( items, { iconName: 'minus', color: C.ink, iconColor: C.rust } ) ], { color: '#C9BCA8', bottom: 0, spacing: 18 } ) ) ),
		] ),
	],
};

pages.contact = {
	title: 'Contact',
	content: [
		pageHero( 'Contact', 'Tell me about your <em>project</em>.', 'A few lines are enough to start. I answer every message myself, usually within two working days.' ),
		section( { top: 0, bottom: 128, spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 56, spacing: 0, more: { width_tablet: percent( 100 ) } }, [
					ruled( [ label( 'Email' ), heading( EMAIL, { tag: 'p', size: fluid( 'clamp(1.5rem, 1.1rem + 1.8vw, 2.5rem)' ), more: { link: link( `mailto:${ EMAIL }` ) } } ) ], { spacing: 10 } ),
					ruled( [ label( 'Telephone' ), heading( '+351 555 010 142', { tag: 'p', size: fluid( 'clamp(1.5rem, 1.1rem + 1.8vw, 2.5rem)' ), more: { link: link( 'tel:+351555010142' ) } } ) ], { spacing: 10 } ),
					ruled( [ label( 'Studio' ), fact( 'Rua das Flores 18, 2.º, 1200-195 Lisbon', { size: 19, weight: 400 } ), fact( 'Monday to Thursday, 9:30 to 17:30 (WET)', { color: C.text, size: 16, weight: 400 } ) ], { spacing: 10 } ),
					button( 'Write an email', `mailto:${ EMAIL }?subject=New%20project`, { more: { align: 'left' } } ),
				] ),
				column( { width: 44, more: { width_tablet: percent( 100 ) } }, [
					container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 20 ), padding: box( 36 ), padding_mobile: box( 24 ), background_background: 'classic', background_color: C.sand, border_radius: box( 6 ) }, [
						heading( 'A good first email says', { tag: 'h2', size: fluid( 'clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)' ), weight: 500 } ),
						list( [ 'What your company does, in a sentence', 'What you need designed', 'When it has to be live', 'Roughly what you can spend' ], { iconName: 'minus', color: C.ink, iconColor: C.rust } ),
						ruled( [ text( '<p>Not sure about some of these? Send what you have. Working it out together is part of the job.</p>' ) ], { top: 20, bottom: 0, color: '#C9BCA8' } ),
					] ),
				] ),
			] ),
		] ),
	],
};

// The posts page: listed by the theme's blog template, so it has no Elementor content.
pages.notes = { title: 'Notes', plain: true };

/* -------------------------------------------------------------------------
   Header, footer and "page not found"
   ---------------------------------------------------------------------- */
const parts = {
	header: {
		title: 'Header',
		location: 'header',
		content: [
			container(
				{
					content_width: 'boxed',
					flex_direction: 'row',
					flex_direction_mobile: 'row',
					flex_align_items: 'center',
					flex_justify_content: 'space-between',
					flex_gap: gap( 32 ),
					flex_wrap: 'nowrap',
					padding: box( 24, 24, 20, 24 ),
					padding_mobile: box( 14, 20 ),
					background_background: 'classic',
					background_color: C.paper,
				},
				[
					heading( 'Juno Vale', { tag: 'p', color: C.ink, size: px( 26 ), weight: 500, more: { link: link( page( 'home' ) ), typography_letter_spacing: px( -0.4 ) } } ),
					container( { content_width: 'full', width: percent( 10 ), width_mobile: percent( 10 ), flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'flex-end', flex_wrap: 'nowrap', padding: box( 0 ), _flex_size: 'grow' }, [
						widget( 'of-nav-menu', { align: 'flex-end', color: C.ink, color_active: C.rust, typography_typography: 'custom', typography_font_family: SANS, typography_font_size: px( 16 ), typography_font_weight: '500', _flex_size: 'grow' } ),
					] ),
				]
			),
		],
	},
	footer: {
		title: 'Footer',
		location: 'footer',
		content: [
			section( { background: C.ink, top: 104, bottom: 36, spacing: 64 }, [
				column( { spacing: 20 }, [
					label( 'Have a project in mind?', { color: C.stone } ),
					heading( 'Let’s <em>talk</em>.', { tag: 'h2', color: C.paper, size: fluid( 'clamp(3rem, 1.2rem + 8vw, 7.5rem)' ), more: { link: link( page( 'contact' ) ), typography_line_height: em( 1 ) } } ),
				] ),
				row( { spacing: 40, align: 'flex-start', justify: 'space-between', tablet: 'row', more: { flex_wrap_tablet: 'wrap' } }, [
					column( { width: 34, spacing: 10, more: { width_tablet: percent( 100 ) } }, [
						fact( EMAIL, { color: C.paper, size: 19, weight: 500, more: { link: link( `mailto:${ EMAIL }` ) } } ),
						fact( 'Lisbon, Portugal. Working worldwide.', { color: C.stone, size: 16, weight: 400 } ),
					] ),
					list( [ [ 'Work', 'work' ], [ 'Services', 'services' ], [ 'About', 'about' ] ].map( ( [ title, name ] ) => ( { text: title, url: page( name ) } ) ), { color: C.stone, more: { view: 'traditional', icon_size: px( 0 ), text_indent: px( 0 ), text_color_hover: C.paper } } ),
					list( [ [ 'Resume', 'resume' ], [ 'Notes', 'notes' ], [ 'Contact', 'contact' ] ].map( ( [ title, name ] ) => ( { text: title, url: page( name ) } ) ), { color: C.stone, more: { view: 'traditional', icon_size: px( 0 ), text_indent: px( 0 ), text_color_hover: C.paper } } ),
				] ),
				ruled( [ fact( '© Juno Vale. A fictional designer, made for the Open Frame Portfolio starter site.', { color: C.stone, size: 14, weight: 400 } ) ], { top: 24, bottom: 0, color: '#3A3530' } ),
			] ),
		],
	},
	'not-found': {
		title: 'Page not found',
		location: '404',
		content: [
			section( { top: 128, bottom: 128, spacing: 28 }, [
				label( 'Error 404' ),
				column( { width: 80 }, [ heading( 'This page has <em>wandered off</em>.', { tag: 'h1' } ) ] ),
				column( { width: 50 }, [ text( '<p>The link may be old, or the address mistyped. The work is still where it was.</p>', { size: px( 20 ) } ) ] ),
				row( { spacing: 28, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Back to the home page', page( 'home' ) ), arrow( 'See the work', page( 'work' ) ) ] ),
			] ),
		],
	},
};

/* -------------------------------------------------------------------------
   Site Settings, theme settings, menus, media and fonts
   ---------------------------------------------------------------------- */
const serifType = ( prefix, options ) => kitTypography( prefix, { family: SERIF, ...options } );
const sansType = ( prefix, options ) => kitTypography( prefix, { family: SANS, ...options } );

const kit = {
	// The convention the theme's "Use Elementor global colors and fonts" option expects:
	// Primary = brand, Secondary = headings, Text = body, Accent = highlight.
	system_colors: [
		{ _id: 'primary', title: 'Primary', color: C.rust },
		{ _id: 'secondary', title: 'Secondary', color: C.ink },
		{ _id: 'text', title: 'Text', color: C.text },
		{ _id: 'accent', title: 'Accent', color: C.rust },
	],
	custom_colors: [
		{ _id: 'ofpaper', title: 'Paper', color: C.paper },
		{ _id: 'ofsand', title: 'Sand', color: C.sand },
		{ _id: 'ofline', title: 'Line', color: C.line },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: SERIF, typography_font_weight: '400' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '500' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '600' },
	],
	container_width: px( 1240 ),
	body_color: C.text,
	...sansType( 'body', { fontSize: px( 17 ), weight: 400, lineHeight: 1.65 } ),
	link_normal_color: C.rust,
	link_hover_color: C.rustDark,
	h1_color: C.ink,
	...serifType( 'h1', { fontSize: fluid( 'clamp(2.5rem, 1.1rem + 6.2vw, 5.75rem)' ), weight: 400, lineHeight: 1.03, spacing: -0.025 } ),
	h2_color: C.ink,
	...serifType( 'h2', { fontSize: fluid( 'clamp(2rem, 1.4rem + 2.6vw, 3.5rem)' ), weight: 400, lineHeight: 1.08, spacing: -0.02 } ),
	h3_color: C.ink,
	...serifType( 'h3', { fontSize: fluid( 'clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)' ), weight: 500, lineHeight: 1.2, spacing: -0.01 } ),
	h4_color: C.ink,
	...sansType( 'h4', { fontSize: px( 17 ), weight: 600, lineHeight: 1.35 } ),
	...sansType( 'button', { fontSize: px( 16 ), weight: 600, lineHeight: 1.2 } ),
	button_text_color: C.white,
	button_background_color: C.rust,
	button_hover_text_color: C.paper,
	button_hover_background_color: C.ink,
	button_border_radius: box( 999 ),
	button_padding: box( 16, 28 ),
};

const themeMods = {
	open_frame_follow_elementor: true,
	open_frame_color_primary: C.rust.toLowerCase(),
	open_frame_color_primary_hover: C.rustDark.toLowerCase(),
	open_frame_color_heading: C.ink.toLowerCase(),
	open_frame_color_text: C.text.toLowerCase(),
	open_frame_color_link: C.rust.toLowerCase(),
	open_frame_color_link_hover: C.rustDark.toLowerCase(),
	open_frame_color_accent: C.rust.toLowerCase(),
	open_frame_color_border: C.line.toLowerCase(),
	open_frame_color_bg: C.paper.toLowerCase(),
	open_frame_color_surface: C.white.toLowerCase(),
	open_frame_container_width: 1240,
	open_frame_blog_style: 'grid',
	open_frame_blog_columns: 2,
	open_frame_blog_title: true,
	open_frame_blog_layout: 'full-width',
	open_frame_single_layout: 'no-sidebar',
	open_frame_page_layout: 'no-sidebar',
};

const licence = 'CC0-1.0. Original artwork generated for this starter site (tools/sites/portfolio-art.mjs).';
const media = [
	{ uid: 'feature', file: 'feature.jpg', alt: 'Three coffee bags with a wave mark, in white, rust and green' },
	...projects.map( ( project ) => ( { uid: project.uid, file: project.uid + '.jpg', alt: `${ project.name }: ${ project.kind.toLowerCase() }` } ) ),
	{ uid: 'portrait', file: 'portrait.jpg', alt: 'Illustrated portrait of Juno Vale' },
	{ uid: 'studio', file: 'studio.jpg', alt: 'A type specimen, colour swatches and a pencil on a desk' },
	{ uid: 'detail-marks', file: 'detail-marks.jpg', alt: 'Four versions of the Tidewater mark' },
	{ uid: 'detail-palette', file: 'detail-palette.jpg', alt: 'The Tidewater colour palette and the line “Slow roasted, by the sea”' },
	{ uid: 'detail-wide', file: 'detail-wide.jpg', alt: 'Tidewater shop sign, bags and cups' },
	...posts.map( ( post ) => ( { uid: post.image, file: post.image + '.jpg', alt: '' } ) ),
].map( ( item ) => ( { ...item, licence } ) );

const fonts = [
	{ family: SERIF, weight: '100 900', style: 'normal', file: 'fraunces-latin.woff2', licence: 'OFL-1.1. Copyright 2020 The Fraunces Project Authors.' },
	{ family: SERIF, weight: '100 900', style: 'italic', file: 'fraunces-latin-italic.woff2', licence: 'OFL-1.1. Copyright 2020 The Fraunces Project Authors.' },
	{ family: SANS, weight: '400 700', style: 'normal', file: 'instrument-sans-latin.woff2', licence: 'OFL-1.1. Copyright 2022 The Instrument Sans Project Authors.' },
];

const used = writeSite( {
	site: SITE,
	out: OUT,
	pages,
	parts,
	posts,
	kit,
	themeMods,
	options: { show_on_front: 'page', page_on_front: page( 'home' ), page_for_posts: page( 'notes' ) },
	menus: [ { uid: 'primary', name: 'Primary', location: 'primary', items: [ [ 'Work', 'work' ], [ 'Services', 'services' ], [ 'About', 'about' ], [ 'Resume', 'resume' ], [ 'Notes', 'notes' ], [ 'Contact', 'contact' ] ].map( ( [ title, name ] ) => ( { title, url: page( name ) } ) ) } ],
	media,
	fonts,
	catalog: {
		summary: 'A personal site for an independent designer: large serif type on warm paper, staggered project covers, a case study, services, a resume and notes.',
		colors: [ C.paper.toLowerCase(), C.rust.toLowerCase(), C.ink.toLowerCase() ],
		pages: [ 'Home', 'About', 'Work', 'Project Details', 'Services', 'Service Details', 'Resume', 'Notes (blog)', 'Single Post', 'Contact', '404' ],
		screenshots: [ { title: 'Work', file: 'work.png' }, { title: 'Case study', file: 'case-study.png' }, { title: 'Services', file: 'services.png' } ],
		requires: { importer: '0.4.0' },
	},
} );

console.log( `Portfolio: ${ Object.keys( pages ).length } pages, ${ Object.keys( parts ).length } site parts, ${ posts.length } posts. Widgets: ${ used.join( ', ' ) }` );
