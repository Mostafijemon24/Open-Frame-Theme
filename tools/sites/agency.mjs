#!/usr/bin/env node
/**
 * The Agency starter site ("Parallel", a creative studio), written as data.
 * A design of the Pro tier: its header, footer, blog and "page not found"
 * layouts are Elementor Pro Theme Builder templates, and it uses Pro widgets.
 *
 *   node tools/sites/agency.mjs
 *
 * Writes starter-sites/agency/{site.json, site/, content/, media/index.json,
 * fonts/index.json}. The images come from tools/sites/agency-art.mjs. See
 * brief.md in the site folder for the design decisions this file implements.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks, box, builders, dynamic, em, fluid, gap, ids, kitTypography, link, menu, page, percent, photoIndex, px, writeSite } from './kit.mjs';

const SITE = 'agency';
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', SITE );

/* -------------------------------------------------------------------------
   Design tokens (see brief.md)
   ---------------------------------------------------------------------- */
const C = {
	ink: '#0D0D0D',
	coal: '#1A1A19',
	paper: '#F5F3EE',
	lime: '#C8F53C',
	limeDark: '#B4E01F',
	text: '#3A3A38',
	ash: '#A9A9A3', // Text on ink.
	line: '#D9D5CB',
	dark: '#2E2E2B', // Hairlines on ink.
	violet: '#4A3AE8',
};
const DISPLAY = 'Unbounded';
const SANS = 'Inter';
const EMAIL = 'hello@example.com';

const b = builders( ids() );
const { row, column, grid, text, list, counter, container, widget } = b;

/* -------------------------------------------------------------------------
   Components of this design
   ---------------------------------------------------------------------- */
const section = ( options, elements ) => b.section( { top: 120, ...options }, elements );
const sans = { typography_typography: 'custom', typography_font_family: SANS };

const heading = ( title, options = {} ) => b.heading( title, options );

/** A line of sans text set as a heading widget. */
const fact = ( title, { color = C.ink, size = 17, weight = 500, align, more = {} } = {} ) =>
	b.heading( title, { tag: 'p', color, align, more: { ...sans, typography_font_size: px( size ), typography_font_weight: String( weight ), typography_line_height: em( 1.45 ), ...more } } );

/** Small uppercase label. */
const label = ( title, { color = C.text } = {} ) => fact( title, { color, size: 13, weight: 600, more: { typography_text_transform: 'uppercase', typography_letter_spacing: px( 1.6 ) } } );

/** An outlined pill for tags. */
const tag = ( title, { dark = false } = {} ) =>
	fact( title, { color: dark ? C.paper : C.ink, size: 13, weight: 600, more: { _element_width: 'auto', _padding: box( 7, 14 ), _border_border: 'solid', _border_width: box( 1.5 ), _border_color: dark ? C.ash : C.ink, _border_radius: box( 999 ), _flex_size: 'none' } } );
const tags = ( items, options ) => row( { spacing: 8, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, items.map( ( item ) => tag( item, options ) ) );

/** Plain buttons are left to Elementor's Accent color (lime) and the button style of Site Settings. */
const button = ( title, url, options = {} ) => b.button( title, url, { ...options, kit: true } );
const onPaper = { background_color: C.ink, button_text_color: C.paper, hover_color: C.ink, button_background_hover_color: C.lime };
const ghost = ( dark = true ) => ( { background_color: 'transparent', button_text_color: dark ? C.paper : C.ink, border_border: 'solid', border_width: box( 1.5 ), border_color: dark ? C.paper : C.ink, hover_color: C.ink, button_background_hover_color: C.lime, button_hover_border_color: C.lime } );

const image = ( uid, { radius = 0, url, more = {} } = {} ) => b.image( uid, { radius, more: { ...( url ? { link_to: 'custom', link: link( url ) } : {} ), ...more } } );

/** A block that starts with a line. */
const ruled = ( elements, { dark = false, spacing = 14, top = 28, bottom = 28, more = {} } = {} ) =>
	container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( spacing ), padding: box( top, 0, bottom, 0 ), border_border: 'solid', border_width: box( 2, 0, 0, 0 ), border_color: dark ? C.paper : C.ink, ...more }, elements );

/** One case study in a list of work. */
const caseTile = ( item, tagName = 'h3' ) =>
	column( { spacing: 18 }, [
		image( item.uid, { url: page( 'case-study' ) } ),
		row( { spacing: 16, align: 'center', justify: 'space-between', more: { flex_direction_mobile: 'row', flex_align_items_mobile: 'center' } }, [
			heading( item.name, { tag: tagName, size: fluid( 'clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem)' ), more: { link: link( page( 'case-study' ) ) } } ),
			fact( item.year, { color: C.text, size: 15, more: { _flex_size: 'none' } } ),
		] ),
		tags( item.tags ),
	] );

/** The top of an inner page, on ink. */
const pageHero = ( name, title, lead ) =>
	section( { background: C.ink, top: 112, bottom: 96, spacing: 24 }, [
		label( name, { color: C.lime } ),
		column( { width: 88 }, [ heading( title, { tag: 'h1', color: C.paper } ) ] ),
		...( lead ? [ column( { width: 56 }, [ text( `<p>${ lead }</p>`, { size: px( 20 ), color: C.ash } ) ] ) ] : [] ),
	] );

/** The closing band, shared by every page. */
const brief = () =>
	section( { background: C.lime, top: 112, spacing: 32 }, [
		heading( 'Got a brief? Or only half of one?', { size: fluid( 'clamp(2rem, 1.2rem + 4.2vw, 4.75rem)' ) } ),
		row( { spacing: 40, align: 'center', justify: 'space-between' }, [
			column( { width: 52 }, [ text( '<p>Either is a fine place to start. Tell us what you are trying to do and when; we answer within a day, with questions.</p>', { size: px( 20 ), color: C.ink } ) ] ),
			button( 'Start a project', page( 'contact' ), { more: { ...onPaper, size: 'lg', _flex_size: 'none' } } ),
		] ),
	] );

/* -------------------------------------------------------------------------
   Content
   ---------------------------------------------------------------------- */
const cases = [
	{ uid: 'case-volt', name: 'Volt', year: '2026', tags: [ 'Brand', 'Campaign', 'Launch' ] },
	{ uid: 'case-orbit', name: 'Orbit', year: '2025', tags: [ 'Product', 'Design system' ] },
	{ uid: 'case-pulse', name: 'Pulse Festival', year: '2025', tags: [ 'Identity', 'Campaign' ] },
	{ uid: 'case-terra', name: 'Terra Outdoor', year: '2024', tags: [ 'Rebrand', 'E-commerce' ] },
	{ uid: 'case-nord', name: 'Nord Furniture', year: '2024', tags: [ 'Art direction', 'Web' ] },
	{ uid: 'case-kino', name: 'Kino Fest', year: '2023', tags: [ 'Identity', 'Motion' ] },
];

const services = [
	[ 'Brand', 'Strategy, naming, identity and the guidelines to keep them alive after we leave.' ],
	[ 'Digital', 'Websites and products, designed and built by one team that sits at one table.' ],
	[ 'Campaign', 'Launches, films and the unglamorous assets a campaign actually runs on.' ],
	[ 'Motion', 'Identity in movement: titles, product films, social loops, sound.' ],
];

const team = [
	{ uid: 'team-1', name: 'Noa Feldman', role: 'Creative director' },
	{ uid: 'team-2', name: 'Idris Kamara', role: 'Design lead' },
	{ uid: 'team-3', name: 'Freya Olsen', role: 'Strategy' },
	{ uid: 'team-4', name: 'Mateo Ruiz', role: 'Technology' },
];

const posts = [
	{
		name: 'the-half-brief',
		title: 'In praise of the half-finished brief',
		excerpt: 'The best projects we have had started with a paragraph and a deadline. Why a rough brief beats a polished one.',
		image: 'journal-1',
		category: 'Process',
		days: 6,
		content: [
			blocks.paragraph( 'The best projects we have had started with a paragraph and a deadline. The worst started with forty pages that three departments had signed off.' ),
			blocks.heading( 'A brief is a question, not an answer' ),
			blocks.paragraph( 'A polished brief has usually decided what the work should be. A rough one still asks what the problem is, which is the part we are useful for.' ),
			blocks.list( [ 'Who are we trying to reach?', 'What do they believe now?', 'What would make this a success in a year?' ] ),
			blocks.heading( 'Send it early' ),
			blocks.paragraph( `If you can answer those three, you have a brief. <a href="${ page( 'contact' ) }">Send it to us</a> before someone makes it longer.` ),
		],
	},
	{
		name: 'pitching-without-spec-work',
		title: 'Why we do not pitch with finished work',
		excerpt: 'Free creative in a pitch looks generous and helps nobody. What we show instead, and why clients tend to prefer it.',
		image: 'journal-2',
		category: 'Studio',
		days: 20,
		content: [
			blocks.paragraph( 'Free creative in a pitch looks generous and helps nobody. It is made without knowing the client, so it is a guess, and the client ends up choosing between guesses.' ),
			blocks.heading( 'What we show instead' ),
			blocks.paragraph( 'An hour of our thinking about your problem, the three questions we would start with, and two past projects that had the same shape. Then a paid first week, so that both sides can change their minds cheaply.' ),
			blocks.quote( 'A pitch should show how an agency thinks, not what it would have made if it knew you.' ),
		],
	},
	{
		name: 'shipping-on-fridays',
		title: 'We ship on Fridays, and other bad ideas that work',
		excerpt: 'Six studio habits that every handbook advises against. We kept them because the work got better.',
		image: 'journal-3',
		category: 'Studio',
		days: 34,
		content: [
			blocks.paragraph( 'Every handbook says not to launch at the end of the week. We do, because it means the whole team is in the room when it goes out, and because nobody starts something new on a Friday afternoon anyway.' ),
			blocks.heading( 'Three more' ),
			blocks.list( [ 'No slides in the first meeting', 'Designers write their own copy first', 'The client sees the mess' ] ),
			blocks.paragraph( 'None of these is a rule. They are habits that stayed because the work was better with them than without.' ),
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
		section( { background: C.ink, top: 96, bottom: 72, spacing: 36 }, [
			label( 'Independent creative studio, est. 2015', { color: C.lime } ),
			widget( 'animated-headline', {
				headline_style: 'rotate',
				animation_type: 'slide',
				before_text: 'We make brands',
				rotating_text: 'louder\nclearer\nbraver',
				after_text: '',
				tag: 'h1',
				alignment: 'left',
				title_color: C.paper,
				words_color: C.lime,
				title_typography_typography: 'custom',
				title_typography_font_family: DISPLAY,
				title_typography_font_weight: '700',
				title_typography_font_size: fluid( 'clamp(2.25rem, 0.9rem + 6.2vw, 6.5rem)' ),
				title_typography_line_height: em( 1.02 ),
				title_typography_letter_spacing: em( -0.03 ),
				words_typography_typography: 'custom',
				words_typography_font_family: DISPLAY,
				words_typography_font_weight: '700',
			} ),
			row( { spacing: 48, align: 'flex-end', justify: 'space-between' }, [
				column( { width: 46 }, [ text( '<p>Parallel is twelve people who design identities, build products and launch them. Strategy and making sit at the same table, so nothing is lost on the way between them.</p>', { size: px( 20 ), color: C.ash } ) ] ),
				row( { spacing: 14, align: 'center', more: { width: percent( 42 ), width_mobile: percent( 100 ), flex_justify_content: 'flex-end', flex_justify_content_mobile: 'flex-start', flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'See the work', page( 'work' ) ), button( 'Start a project', page( 'contact' ), { more: ghost() } ) ] ),
			] ),
		] ),
		section( { background: C.ink, top: 0, bottom: 112, spacing: 0 }, [ image( 'reel', { url: page( 'work' ) } ) ] ),

		section( { background: C.lime, top: 36, bottom: 36, spacing: 0 }, [
			heading( 'Volt ✳ Orbit ✳ Pulse Festival ✳ Terra Outdoor ✳ Nord ✳ Kino Fest', { tag: 'p', size: fluid( 'clamp(1rem, 0.8rem + 1vw, 1.5rem)' ), weight: 600, align: 'center' } ),
		] ),

		section( { spacing: 64 }, [
			row( { spacing: 24, align: 'flex-end', justify: 'space-between', more: { flex_direction_mobile: 'row', flex_align_items_mobile: 'flex-end' } }, [ column( { spacing: 12 }, [ label( 'Selected work' ), heading( 'Recent projects' ) ] ), button( 'All work', page( 'work' ), { more: { ...ghost( false ), _flex_size: 'none' } } ) ] ),
			grid( { columns: 2, tablet: 2, spacing: 40, more: { grid_gaps: { unit: 'px', size: 40, column: '40', row: '64', isLinked: false } } }, cases.slice( 0, 4 ).map( ( item ) => caseTile( item ) ) ),
		] ),

		section( { background: C.ink, spacing: 56 }, [
			row( { spacing: 48, align: 'flex-end', justify: 'space-between' }, [ column( { width: 60, spacing: 12 }, [ label( 'What we do', { color: C.lime } ), heading( 'Four disciplines, one team', { color: C.paper } ) ] ), button( 'Services', page( 'services' ), { more: { ...ghost(), _flex_size: 'none' } } ) ] ),
			grid( { columns: 4, tablet: 2, spacing: 32 }, services.map( ( [ title, body ], index ) => ruled( [ fact( '0' + ( index + 1 ), { color: C.lime, size: 15, weight: 600 } ), heading( title, { tag: 'h3', color: C.paper } ), text( `<p>${ body }</p>`, { color: C.ash } ) ], { dark: true, bottom: 0 } ) ) ),
		] ),

		section( { spacing: 0 }, [
			grid( { columns: 4, tablet: 2, spacing: 32, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, [
				[ 11, 'years as a studio' ],
				[ 140, 'projects shipped', { suffix: '+' } ],
				[ 12, 'people, no freelancers hidden' ],
				[ 31, 'awards, for what they are worth' ],
			].map( ( [ number, title, extra = {} ] ) => ruled( [ counter( number, title, { color: C.ink, titleColor: C.text, ...extra } ) ], { bottom: 0 } ) ) ),
		] ),

		section( { background: C.violet, top: 112, spacing: 28 }, [
			column( { width: 86, spacing: 28 }, [
				heading( '“They argued with our brief for a week. Then they made the thing we actually needed, and the first tariff was full in nine days.”', { tag: 'p', color: '#FFFFFF', size: fluid( 'clamp(1.375rem, 1rem + 2vw, 2.75rem)' ), weight: 600, more: { typography_line_height: em( 1.25 ) } } ),
				fact( 'Jonas Weller, founder of Volt. A sample quote.', { color: '#FFFFFF', size: 16 } ),
			] ),
		] ),

		section( { spacing: 56 }, [
			row( { spacing: 24, align: 'flex-end', justify: 'space-between', more: { flex_direction_mobile: 'row', flex_align_items_mobile: 'flex-end' } }, [ column( { spacing: 12 }, [ label( 'Journal' ), heading( 'Notes from the studio' ) ] ), button( 'All notes', page( 'journal' ), { more: { ...ghost( false ), _flex_size: 'none' } } ) ] ),
			widget( 'posts', { classic_columns: '3', classic_columns_tablet: '2', classic_columns_mobile: '1', classic_posts_per_page: 3, classic_show_excerpt: 'yes', classic_excerpt_length: 18, classic_meta_data: [ 'date' ], classic_show_read_more: '', classic_title_tag: 'h3', classic_item_ratio: { unit: 'px', size: 0.56, sizes: [] }, classic_title_color: C.ink, classic_excerpt_color: C.text, classic_meta_color: C.text, classic_row_gap: px( 40 ), classic_column_gap: px( 32 ), pagination_type: '' } ),
		] ),

		brief(),
	],
};

pages.studio = {
	title: 'Studio',
	content: [
		pageHero( 'Studio', 'Twelve people, one table, no account managers', 'We stayed small on purpose. It means the people in your first meeting are the people who do the work.' ),
		section( { background: C.ink, top: 0, bottom: 112, spacing: 0 }, [ image( 'studio' ) ] ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 40, spacing: 14, more: { width_tablet: percent( 100 ) } }, [ label( 'How we work' ), heading( 'Strategy and making, in the same room' ) ] ),
				column( { width: 60, spacing: 0, more: { width_tablet: percent( 100 ) } }, [
					[ 'Start with the argument', 'We spend the first week disagreeing with the brief, politely. Most of the value is found there.' ],
					[ 'Show the mess', 'You see sketches, dead ends and the reasons. Finished work with no history is hard to trust.' ],
					[ 'Build what we design', 'Designers and developers share projects from day one, so nothing has to be "handed over".' ],
				].map( ( [ title, body ] ) => ruled( [ heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ] ) ) ),
			] ),
		] ),
		section( { background: C.ink, spacing: 56 }, [
			column( { spacing: 12 }, [ label( 'People', { color: C.lime } ), heading( 'Four of the twelve', { color: C.paper } ) ] ),
			grid( { columns: 4, tablet: 2, spacing: 28, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, team.map( ( person ) => column( { spacing: 12 }, [ image( person.uid ), heading( person.name, { tag: 'h3', color: C.paper, size: px( 18 ) } ), fact( person.role, { color: C.ash, size: 15 } ) ] ) ) ),
			row( { spacing: 24, align: 'center', justify: 'space-between' }, [ fact( 'We hire rarely and keep people a long time.', { color: C.ash } ), button( 'Open roles', page( 'careers' ), { more: { ...ghost(), _flex_size: 'none' } } ) ] ),
		] ),
		brief(),
	],
};

pages.services = {
	title: 'Services',
	content: [
		pageHero( 'Services', 'Four disciplines that work better together', 'Most projects use two or three. All of them start with a paid first week, so that both sides can change their minds cheaply.' ),
		section( { spacing: 0 }, [
			column( { spacing: 0 }, [
				[ 'Brand', services[ 0 ][ 1 ], [ 'Positioning', 'Naming', 'Identity', 'Guidelines' ], page( 'service-details' ) ],
				[ 'Digital', services[ 1 ][ 1 ], [ 'Websites', 'Products', 'Design systems', 'Build' ], null ],
				[ 'Campaign', services[ 2 ][ 1 ], [ 'Concept', 'Film', 'Launch', 'Toolkits' ], null ],
				[ 'Motion', services[ 3 ][ 1 ], [ 'Titles', 'Product films', 'Social', 'Sound' ], null ],
			].map( ( [ title, body, items, url ], index ) =>
				container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'column', flex_gap: gap( 48 ), flex_gap_mobile: gap( 16 ), padding: box( 48, 0 ), padding_mobile: box( 32, 0 ), border_border: 'solid', border_width: box( 2, 0, 0, 0 ), border_color: C.ink }, [
					column( { width: 10 }, [ fact( '0' + ( index + 1 ), { size: 15, weight: 600 } ) ] ),
					column( { width: 50, spacing: 18 }, [ heading( title, { tag: 'h2' } ), text( `<p>${ body }</p>`, { size: px( 19 ) } ), ...( url ? [ button( 'What is included', url, { more: { ...ghost( false ), size: 'sm', align: 'left' } } ) ] : [] ) ] ),
					column( { width: 40 }, [ tags( items ) ] ),
				] ) ) ),
		] ),
		section( { background: C.ink, spacing: 56 }, [
			column( { spacing: 12 }, [ label( 'Process', { color: C.lime } ), heading( 'How a project runs', { color: C.paper } ) ] ),
			grid( { columns: 4, tablet: 2, spacing: 32 }, [
				[ 'Week one', 'A paid week of questions, interviews and a first point of view. You can stop here.' ],
				[ 'Direction', 'Two or three routes, shown on real things. We choose one together.' ],
				[ 'Make', 'Weekly reviews, a shared board, no surprises. Design and build run side by side.' ],
				[ 'Launch', 'We are there on the day and for a month after. Then we hand over the keys.' ],
			].map( ( [ title, body ], index ) => ruled( [ fact( '0' + ( index + 1 ), { color: C.lime, size: 15, weight: 600 } ), heading( title, { tag: 'h3', color: C.paper } ), text( `<p>${ body }</p>`, { color: C.ash } ) ], { dark: true, bottom: 0 } ) ) ),
		] ),
		brief(),
	],
};

pages[ 'service-details' ] = {
	title: 'Brand',
	slug: 'brand',
	content: [
		pageHero( 'Service', 'Brand: what you stand for, and how it shows', 'For companies that are launching, repositioning, or tired of explaining what they do.' ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 60, spacing: 0, more: { width_tablet: percent( 100 ) } }, [
					[ 'Weeks 1 to 2', 'Positioning', 'Interviews with your team and your customers. One page that says who you are for and why.' ],
					[ 'Weeks 3 to 4', 'Name and voice', 'If you need a name, a shortlist checked for trademarks. Either way, a voice and a few lines to prove it.' ],
					[ 'Weeks 5 to 8', 'Identity', 'Mark, type, colour and motion, designed on the things you actually make.' ],
					[ 'Weeks 9 to 10', 'Guidelines and launch kit', 'A short guide your team will use, templates, and the assets for day one.' ],
				].map( ( [ when, title, body ] ) => ruled( [ label( when ), heading( title, { tag: 'h2', size: fluid( 'clamp(1.375rem, 1.2rem + 0.9vw, 2rem)' ) } ), text( `<p>${ body }</p>` ) ], { spacing: 10 } ) ) ),
				column( { width: 40, more: { width_tablet: percent( 100 ) } }, [
					container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 22 ), padding: box( 40 ), padding_mobile: box( 26 ), background_background: 'classic', background_color: C.ink }, [
						label( 'What it costs', { color: C.lime } ),
						heading( 'From €28,000', { tag: 'p', color: C.paper, size: fluid( 'clamp(1.75rem, 1.4rem + 1.6vw, 2.75rem)' ) } ),
						text( '<p>Ten weeks, fixed fee, paid in four parts. The first week is invoiced separately and is yours to keep if we part ways.</p>', { color: C.ash } ),
						list( [ 'Positioning document', 'Identity system and source files', 'Guidelines and templates', 'Launch assets' ], { color: C.paper, iconColor: C.lime, iconName: 'arrow-right' } ),
						button( 'Ask about dates', page( 'contact' ), { more: { align: 'justify' } } ),
					] ),
				] ),
			] ),
		] ),
		section( { top: 0, spacing: 24 }, [ grid( { columns: 2, tablet: 2, spacing: 24 }, [ image( 'case-volt', { url: page( 'case-study' ) } ), image( 'case-pulse', { url: page( 'case-study' ) } ) ] ), fact( 'Brand work for Volt and Pulse Festival', { color: C.text, size: 15 } ) ] ),
		brief(),
	],
};

pages.work = {
	title: 'Work',
	content: [
		pageHero( 'Work', 'Six projects we would do again', 'Chosen because each one moved a number the client cared about.' ),
		section( { spacing: 0 }, [ grid( { columns: 2, tablet: 2, spacing: 40, more: { grid_gaps: { unit: 'px', size: 40, column: '40', row: '72', isLinked: false } } }, cases.map( ( item ) => caseTile( item, 'h2' ) ) ) ] ),
		brief(),
	],
};

const meta = ( name, value ) => ruled( [ label( name, { color: C.ash } ), fact( value, { color: C.paper } ) ], { dark: true, spacing: 8, top: 18, bottom: 0 } );

pages[ 'case-study' ] = {
	title: 'Volt',
	slug: 'volt',
	content: [
		section( { background: C.ink, top: 112, bottom: 72, spacing: 40 }, [
			label( 'Case study', { color: C.lime } ),
			heading( 'Volt: an electricity company that shows where the power comes from', { tag: 'h1', color: C.paper } ),
			grid( { columns: 4, tablet: 2, spacing: 32, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, [ meta( 'Client', 'Volt Energy' ), meta( 'Year', '2026' ), meta( 'Scope', 'Brand, campaign, launch' ), meta( 'Team', 'Six people, fourteen weeks' ) ] ),
		] ),
		section( { background: C.ink, top: 0, bottom: 112, spacing: 0 }, [ image( 'case-volt' ) ] ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start' }, [
				column( { width: 50, spacing: 16 }, [ heading( 'The problem' ), text( '<p>Electricity suppliers all promise the same green leaf in the same soft colours. Volt had something better, a tariff that names the wind farm your power came from each hour, and a brand nobody could tell apart from the others on the comparison site.</p>' ) ] ),
				column( { width: 50, spacing: 16 }, [ heading( 'What we did' ), text( '<p>We took everything off the brand except the name, a bolt and the three facts people ask about. One violet, the colour of the sky a second before thunder, used so consistently that the bill does the advertising. The launch film is fifteen seconds of a storm and one line of type.</p>' ) ] ),
			] ),
		] ),
		section( { top: 0, spacing: 0 }, [
			grid( { columns: 3, tablet: 3, spacing: 32 }, [
				[ 9, 'days to fill the first tariff' ],
				[ 2400, 'households a week by the end of the year' ],
				[ 41, 'of customers open the hourly report', { suffix: '%' } ],
			].map( ( [ number, title, extra = {} ] ) => ruled( [ counter( number, title, { color: C.ink, titleColor: C.text, ...extra } ) ], { bottom: 0 } ) ) ),
		] ),
		section( { top: 0, spacing: 24 }, [ grid( { columns: 2, tablet: 2, spacing: 24 }, [ image( 'case-orbit' ), image( 'case-terra' ) ] ) ] ),
		section( { top: 0, spacing: 0 }, [
			ruled( [ row( { spacing: 24, align: 'center', justify: 'space-between' }, [ column( { spacing: 8 }, [ label( 'Next project' ), heading( 'Orbit', { tag: 'h2', more: { link: link( page( 'work' ) ) } } ) ] ), button( 'All work', page( 'work' ), { more: { ...ghost( false ), _flex_size: 'none' } } ) ] ) ], { top: 40, bottom: 0 } ),
		] ),
		brief(),
	],
};

const role = ( title, kind, place ) =>
	container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'column', flex_align_items: 'center', flex_align_items_mobile: 'flex-start', flex_gap: gap( 32 ), flex_gap_mobile: gap( 10 ), padding: box( 28, 0 ), border_border: 'solid', border_width: box( 2, 0, 0, 0 ), border_color: C.ink }, [
		column( { width: 46 }, [ heading( title, { tag: 'h3' } ) ] ),
		column( { width: 20 }, [ fact( kind, { color: C.text, size: 16 } ) ] ),
		column( { width: 20 }, [ fact( place, { color: C.text, size: 16 } ) ] ),
		button( 'Apply', `mailto:${ EMAIL }?subject=${ encodeURIComponent( title ) }`, { more: { ...ghost( false ), size: 'sm', _flex_size: 'none' } } ),
	] );

pages.careers = {
	title: 'Careers',
	content: [
		pageHero( 'Careers', 'We hire rarely, and for a long time', 'Twelve people, three open roles. Everyone here ships real work in their first month.' ),
		section( { spacing: 40 }, [
			column( { spacing: 12 }, [ label( 'Open roles' ), heading( 'Looking for' ) ] ),
			column( { spacing: 0 }, [ role( 'Senior brand designer', 'Full time', 'Berlin or remote' ), role( 'Front-end developer', 'Full time', 'Berlin' ), role( 'Producer', 'Four days a week', 'Berlin' ) ] ),
			fact( 'Nothing that fits? Write anyway, with work you are proud of.', { color: C.text } ),
		] ),
		section( { background: C.ink, spacing: 56 }, [
			column( { spacing: 12 }, [ label( 'What you get', { color: C.lime } ), heading( 'The deal', { color: C.paper } ) ] ),
			grid( { columns: 3, spacing: 32 }, [
				[ 'Four-day weeks in summer', 'June to August, the studio closes on Fridays. The work has never suffered.' ],
				[ 'A budget for learning', '€2,000 a year, for anything you can argue makes you better at this.' ],
				[ 'Pay you can look up', 'Salaries follow a published table. Nobody negotiates, so nobody loses.' ],
			].map( ( [ title, body ] ) => ruled( [ heading( title, { tag: 'h3', color: C.paper } ), text( `<p>${ body }</p>`, { color: C.ash } ) ], { dark: true, bottom: 0 } ) ) ),
		] ),
		brief(),
	],
};

pages.contact = {
	title: 'Contact',
	content: [
		pageHero( 'Contact', 'Tell us what you are trying to do', 'A few lines are enough. We answer within one working day, usually with questions.' ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 58, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					heading( 'Start a project', { tag: 'h2' } ),
					widget( 'form', {
						form_name: 'Project enquiry',
						form_fields: [
							{ _id: 'name', custom_id: 'name', field_type: 'text', field_label: 'Your name', placeholder: '', required: 'true', width: '50' },
							{ _id: 'email', custom_id: 'email', field_type: 'email', field_label: 'Email', placeholder: '', required: 'true', width: '50' },
							{ _id: 'company', custom_id: 'company', field_type: 'text', field_label: 'Company', placeholder: '', width: '50' },
							{ _id: 'budget', custom_id: 'budget', field_type: 'select', field_label: 'Budget', field_options: 'Not sure yet\nUnder €25,000\n€25,000 to €75,000\nOver €75,000', width: '50' },
							{ _id: 'message', custom_id: 'message', field_type: 'textarea', field_label: 'What are you trying to do, and by when?', placeholder: '', required: 'true', width: '100', rows: 6 },
						],
						show_labels: 'true',
						mark_required: 'yes',
						button_text: 'Send it',
						button_width: '100',
						submit_actions: [ 'email' ],
						email_subject: 'New project enquiry',
						success_message: 'Thank you. We will write back within one working day.',
						label_color: C.ink,
						field_text_color: C.ink,
						field_background_color: '#FFFFFF',
						field_border_color: C.ink,
						field_border_width: box( 1.5 ),
						field_border_radius: box( 0 ),
						button_background_color: C.ink,
						button_text_color: C.paper,
						button_background_hover_color: C.lime,
						button_hover_color: C.ink,
						row_gap: px( 18 ),
						column_gap: px( 18 ),
					} ),
				] ),
				column( { width: 42, spacing: 0, more: { width_tablet: percent( 100 ) } }, [
					ruled( [ label( 'Email' ), heading( EMAIL, { tag: 'p', size: fluid( 'clamp(1.125rem, 1rem + 0.8vw, 1.5rem)' ), more: { link: link( `mailto:${ EMAIL }` ) } } ) ], { spacing: 8 } ),
					ruled( [ label( 'Telephone' ), heading( '+49 30 5550 0142', { tag: 'p', size: fluid( 'clamp(1.125rem, 1rem + 0.8vw, 1.5rem)' ), more: { link: link( 'tel:+493055500142' ) } } ) ], { spacing: 8 } ),
					ruled( [ label( 'Studio' ), fact( 'Parallel, Lindenstraße 41, 10969 Berlin', { size: 18 } ), fact( 'Monday to Thursday, 9:30 to 18:00', { color: C.text, size: 16 } ) ], { spacing: 8 } ),
				] ),
			] ),
		] ),
	],
};

// The posts page: shown by the archive template, so it has no Elementor content of its own.
pages.journal = { title: 'Journal', plain: true };

/* -------------------------------------------------------------------------
   Theme Builder templates (Elementor Pro)
   ---------------------------------------------------------------------- */
const navMenu = ( more = {} ) =>
	widget( 'nav-menu', {
		menu: menu( 'primary' ),
		layout: 'horizontal',
		align_items: 'end',
		pointer: 'underline',
		animation_line: 'fade',
		dropdown: 'tablet',
		full_width: 'stretch',
		text_align: 'aside',
		toggle: 'burger',
		toggle_align: 'right',
		menu_typography_typography: 'custom',
		menu_typography_font_family: SANS,
		menu_typography_font_size: px( 16 ),
		menu_typography_font_weight: '500',
		color_menu_item: C.paper,
		color_menu_item_hover: C.lime,
		pointer_color_menu_item_hover: C.lime,
		color_menu_item_active: C.lime,
		pointer_color_menu_item_active: C.lime,
		padding_horizontal_menu_item: px( 14 ),
		color_dropdown_item: C.paper,
		background_color_dropdown_item: C.coal,
		color_dropdown_item_hover: C.ink,
		background_color_dropdown_item_hover: C.lime,
		toggle_color: C.paper,
		toggle_background_color: C.coal,
		toggle_size: px( 30 ),
		...more,
	} );

/** The posts of the current archive, three to a row. */
const postList = () =>
	widget( 'archive-posts', { archive_classic_columns: '3', archive_classic_columns_tablet: '2', archive_classic_columns_mobile: '1', archive_classic_show_excerpt: 'yes', archive_classic_excerpt_length: 20, archive_classic_meta_data: [ 'date' ], archive_classic_show_read_more: '', archive_classic_title_tag: 'h2', archive_classic_item_ratio: { unit: 'px', size: 0.56, sizes: [] }, archive_classic_title_color: C.ink, archive_classic_excerpt_color: C.text, archive_classic_meta_color: C.text, archive_classic_row_gap: px( 48 ), archive_classic_column_gap: px( 32 ), pagination_type: 'numbers', nothing_found_message: 'Nothing here yet.' } );

const templates = {
	header: {
		title: 'Header',
		type: 'header',
		conditions: [ [ 'include', 'general' ] ],
		content: [
			container( { content_width: 'boxed', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'space-between', flex_gap: gap( 32 ), flex_wrap: 'nowrap', padding: box( 18, 24 ), padding_mobile: box( 12, 20 ), background_background: 'classic', background_color: C.ink }, [
				heading( 'parallel', { tag: 'p', color: C.paper, size: px( 24 ), weight: 800, more: { link: link( page( 'home' ) ), typography_letter_spacing: px( -1 ), _flex_size: 'none' } } ),
				container( { content_width: 'full', width: percent( 10 ), width_mobile: percent( 10 ), flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'flex-end', flex_gap: gap( 20 ), flex_wrap: 'nowrap', padding: box( 0 ), _flex_size: 'grow' }, [
					navMenu( { _flex_size: 'grow' } ),
					button( 'Start a project', page( 'contact' ), { more: { size: 'sm', hide_mobile: 'hidden-mobile', hide_tablet: 'hidden-tablet' } } ),
				] ),
			] ),
		],
	},
	footer: {
		title: 'Footer',
		type: 'footer',
		conditions: [ [ 'include', 'general' ] ],
		content: [
			b.section( { background: C.ink, top: 96, bottom: 36, spacing: 56 }, [
				heading( 'parallel', { tag: 'p', color: C.paper, size: fluid( 'clamp(3rem, 1rem + 10vw, 9rem)' ), weight: 800, more: { typography_letter_spacing: em( -0.05 ), typography_line_height: em( 0.9 ) } } ),
				row( { spacing: 40, align: 'flex-start', justify: 'space-between', tablet: 'row', more: { flex_wrap_tablet: 'wrap' } }, [
					column( { width: 34, spacing: 8, more: { width_tablet: percent( 100 ) } }, [ fact( EMAIL, { color: C.paper, size: 19, more: { link: link( `mailto:${ EMAIL }` ) } } ), fact( 'Lindenstraße 41, 10969 Berlin', { color: C.ash, size: 16 } ) ] ),
					list( [ [ 'Work', 'work' ], [ 'Services', 'services' ], [ 'Studio', 'studio' ] ].map( ( [ title, name ] ) => ( { text: title, url: page( name ) } ) ), { color: C.ash, more: { view: 'traditional', icon_size: px( 0 ), text_indent: px( 0 ), text_color_hover: C.lime } } ),
					list( [ [ 'Careers', 'careers' ], [ 'Journal', 'journal' ], [ 'Contact', 'contact' ] ].map( ( [ title, name ] ) => ( { text: title, url: page( name ) } ) ), { color: C.ash, more: { view: 'traditional', icon_size: px( 0 ), text_indent: px( 0 ), text_color_hover: C.lime } } ),
				] ),
				container( { content_width: 'full', flex_direction: 'column', padding: box( 24, 0, 0, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.dark }, [ fact( 'Sample content: Parallel is a fictional studio made for the Open Frame Agency starter site. The clients, figures and quote are examples to replace with your own.', { color: C.ash, size: 14, weight: 400 } ) ] ),
			] ),
		],
	},
	archive: {
		title: 'Journal',
		type: 'archive',
		// The page that lists the posts. Elementor Pro has no title of its own for it, so the heading is written here.
		conditions: [ [ 'include', 'archive', 'post_archive' ] ],
		content: [
			section( { background: C.ink, top: 112, bottom: 96, spacing: 20 }, [
				label( 'Notes from the studio', { color: C.lime } ),
				heading( 'Journal', { tag: 'h1', color: C.paper } ),
			] ),
			section( { spacing: 0 }, [ postList() ] ),
			brief(),
		],
	},
	'archive-terms': {
		title: 'Categories and other archives',
		type: 'archive',
		conditions: [ [ 'include', 'archive' ] ],
		content: [
			section( { background: C.ink, top: 112, bottom: 96, spacing: 20 }, [
				label( 'Journal', { color: C.lime } ),
				widget( 'theme-archive-title', { __dynamic__: { title: dynamic( 'archive-title' ) }, header_size: 'h1', title_color: C.paper } ),
			] ),
			section( { spacing: 0 }, [ postList() ] ),
			brief(),
		],
	},
	single: {
		title: 'Journal article',
		type: 'single-post',
		conditions: [ [ 'include', 'singular', 'post' ] ],
		content: [
			section( { background: C.ink, top: 112, bottom: 80, spacing: 24 }, [
				widget( 'post-info', { view: 'inline', icon_list: [ { _id: 'date', type: 'date', show_icon: 'none' }, { _id: 'terms', type: 'terms', taxonomy: 'category', show_icon: 'none' } ], text_color: C.lime, icon_typography_typography: 'custom', icon_typography_font_family: SANS, icon_typography_font_size: px( 14 ), icon_typography_font_weight: '600', icon_typography_text_transform: 'uppercase', icon_typography_letter_spacing: px( 1.4 ), space_between: px( 20 ) } ),
				column( { width: 86 }, [ widget( 'theme-post-title', { __dynamic__: { title: dynamic( 'post-title' ) }, header_size: 'h1', title_color: C.paper } ) ] ),
			] ),
			section( { top: 0, bottom: 0, spacing: 0, more: { background_background: 'gradient', background_color: C.ink, background_color_stop: { unit: '%', size: 50, sizes: [] }, background_color_b: C.paper, background_color_b_stop: { unit: '%', size: 50, sizes: [] }, background_gradient_angle: { unit: 'deg', size: 180, sizes: [] } } }, [ widget( 'theme-post-featured-image', { __dynamic__: { image: dynamic( 'post-featured-image' ) }, image_size: 'full' } ) ] ),
			section( { top: 72, spacing: 48 }, [
				column( { width: 66, more: { _flex_align_self: 'center', width_tablet: percent( 100 ) } }, [ widget( 'theme-post-content', { text_color: C.text } ) ] ),
				column( { width: 66, more: { _flex_align_self: 'center', width_tablet: percent( 100 ) } }, [ ruled( [ widget( 'post-navigation', { show_label: 'yes', prev_label: 'Previous', next_label: 'Next', show_arrow: '', show_title: 'yes', label_color: C.text, text_color: C.ink, hover_color: C.violet } ) ], { bottom: 0 } ) ] ),
			] ),
			brief(),
		],
	},
	'not-found': {
		title: 'Page not found',
		type: 'error-404',
		conditions: [ [ 'include', 'singular', 'not_found404' ] ],
		content: [
			section( { background: C.ink, top: 144, bottom: 144, spacing: 28 }, [
				label( 'Error 404', { color: C.lime } ),
				column( { width: 80 }, [ heading( 'This page is not in the deck', { tag: 'h1', color: C.paper } ) ] ),
				column( { width: 50 }, [ text( '<p>It was cut, moved, or never made it past the first round. The work is still here.</p>', { size: px( 20 ), color: C.ash } ) ] ),
				row( { spacing: 14, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Back to the home page', page( 'home' ) ), button( 'See the work', page( 'work' ), { more: ghost() } ) ] ),
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
		{ _id: 'primary', title: 'Primary', color: C.ink },
		{ _id: 'secondary', title: 'Secondary', color: C.ink },
		{ _id: 'text', title: 'Text', color: C.text },
		{ _id: 'accent', title: 'Accent', color: C.lime },
	],
	custom_colors: [
		{ _id: 'ofpaper', title: 'Paper', color: C.paper },
		{ _id: 'ofviolet', title: 'Violet', color: C.violet },
		{ _id: 'ofash', title: 'Ash', color: C.ash },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: DISPLAY, typography_font_weight: '700' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '500' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '600' },
	],
	container_width: px( 1280 ),
	body_background_background: 'classic',
	body_background_color: C.paper,
	body_color: C.text,
	...sansType( 'body', { fontSize: px( 17 ), weight: 400, lineHeight: 1.65 } ),
	link_normal_color: C.ink,
	link_hover_color: C.violet,
	h1_color: C.ink,
	...displayType( 'h1', { fontSize: fluid( 'clamp(2rem, 1rem + 4.6vw, 4.75rem)' ), weight: 700, lineHeight: 1.05, spacing: -0.03 } ),
	h2_color: C.ink,
	...displayType( 'h2', { fontSize: fluid( 'clamp(1.625rem, 1.1rem + 2.2vw, 3rem)' ), weight: 700, lineHeight: 1.1, spacing: -0.025 } ),
	h3_color: C.ink,
	...displayType( 'h3', { fontSize: fluid( 'clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem)' ), weight: 600, lineHeight: 1.25, spacing: -0.015 } ),
	h4_color: C.ink,
	...sansType( 'h4', { fontSize: px( 17 ), weight: 600, lineHeight: 1.4 } ),
	...sansType( 'button', { fontSize: px( 16 ), weight: 600, lineHeight: 1.2 } ),
	button_text_color: C.ink,
	button_background_color: C.lime,
	button_hover_text_color: C.ink,
	button_hover_background_color: C.paper,
	button_border_radius: box( 999 ),
	button_padding: box( 16, 28 ),
};

const themeMods = {
	open_frame_follow_elementor: true,
	open_frame_color_primary: C.ink.toLowerCase(),
	open_frame_color_primary_hover: C.violet.toLowerCase(),
	open_frame_color_heading: C.ink.toLowerCase(),
	open_frame_color_text: C.text.toLowerCase(),
	open_frame_color_link: C.ink.toLowerCase(),
	open_frame_color_link_hover: C.violet.toLowerCase(),
	open_frame_color_accent: C.lime.toLowerCase(),
	open_frame_color_border: C.line.toLowerCase(),
	open_frame_color_bg: C.paper.toLowerCase(),
	open_frame_container_width: 1280,
	open_frame_single_layout: 'no-sidebar',
	open_frame_page_layout: 'no-sidebar',
};

// The photographs, with where each came from (photos.json, written by tools/sites/photos.mjs).
// Portraits are named after the invented people; Elementor Pro links the covers to their articles, so each is named after its article.
const mediaIndex = photoIndex( OUT, {
	...Object.fromEntries( team.map( ( person ) => [ person.uid, `Portrait of ${ person.name }` ] ) ),
	...Object.fromEntries( posts.map( ( post ) => [ post.image, `Cover of the article “${ post.title }”` ] ) ),
} );

const fonts = [
	{ family: DISPLAY, weight: '200 900', style: 'normal', file: 'unbounded-latin.woff2', licence: 'OFL-1.1. Copyright 2022 The Unbounded Project Authors.' },
	{ family: SANS, weight: '100 900', style: 'normal', file: 'inter-latin.woff2', licence: 'OFL-1.1. Copyright 2016 The Inter Project Authors.' },
];

const used = writeSite( {
	site: SITE,
	out: OUT,
	pages,
	templates,
	posts,
	kit,
	themeMods,
	options: { show_on_front: 'page', page_on_front: page( 'home' ), page_for_posts: page( 'journal' ) },
	menus: [ { uid: 'primary', name: 'Primary', location: 'primary', items: [ [ 'Work', 'work' ], [ 'Services', 'services' ], [ 'Studio', 'studio' ], [ 'Careers', 'careers' ], [ 'Journal', 'journal' ], [ 'Contact', 'contact' ] ].map( ( [ title, name ] ) => ( { title, url: page( name ) } ) ) } ],
	media: mediaIndex,
	fonts,
	catalog: {
		summary: 'A loud, confident site for a studio or agency: case studies, services, careers and a journal, with a contact form. Header, footer and blog are Theme Builder templates.',
		colors: [ C.ink.toLowerCase(), C.lime.toLowerCase(), C.paper.toLowerCase() ],
		pages: [ 'Home', 'Studio', 'Services', 'Service Details', 'Work', 'Case Study', 'Careers', 'Journal (blog)', 'Single Post', 'Contact', '404' ],
		screenshots: [ { title: 'Work', file: 'work.png' }, { title: 'Case study', file: 'case-study.png' }, { title: 'Contact', file: 'contact.png' } ],
		requires: { importer: '0.5.0' },
	},
} );

console.log( `Agency: ${ Object.keys( pages ).length } pages, ${ Object.keys( templates ).length } templates, ${ posts.length } posts. Widgets: ${ used.join( ', ' ) }` );
