#!/usr/bin/env node
/**
 * The Real Estate starter site ("Hartwell & Rowe", estate agents), written as data.
 * A design of the Pro tier: its header, footer, blog and "page not found"
 * layouts are Elementor Pro Theme Builder templates, and it uses Pro widgets.
 *
 *   node tools/sites/real-estate.mjs
 *
 * Writes starter-sites/real-estate/{site.json, site/, content/, media/index.json,
 * fonts/index.json}. The pictures are photographs, chosen in photo-sources.json and
 * prepared by tools/sites/photos.mjs, which records where each came from in
 * photos.json and CREDITS.md. See brief.md in the site folder for the design decisions
 * this file implements.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks, box, builders, dynamic, em, fluid, gap, icon, ids, kitTypography, link, media, menu, page, percent, photoIndex, px, writeSite } from './kit.mjs';

const SITE = 'real-estate';
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', SITE );

/* -------------------------------------------------------------------------
   Design tokens (see brief.md)
   ---------------------------------------------------------------------- */
const C = {
	forest: '#1F3A2E',
	pine: '#16291F',
	cream: '#F7F3EA',
	sand: '#E8DFCC',
	white: '#FFFFFF',
	ink: '#16211B',
	text: '#4B5650',
	brass: '#8A6420', // Small accents on light backgrounds.
	gold: '#DDB96A', // The same accent on forest.
	line: '#DDD5C3',
	mist: '#C9D4CC', // Text on forest.
};
const SERIF = 'Newsreader';
const SANS = 'Manrope';
const PHONE = '+44 20 5550 0164';
const TEL = 'tel:+442055500164';
const EMAIL = 'hello@example.com';

const b = builders( ids() );
const { row, column, grid, text, list, counter, container, widget } = b;

/* -------------------------------------------------------------------------
   Components of this design
   ---------------------------------------------------------------------- */
// Top and bottom space are given separately: a section that starts flush still needs room below it.
const section = ( options, elements ) => b.section( { top: 112, bottom: 112, ...options }, elements );
const sans = { typography_typography: 'custom', typography_font_family: SANS };

const heading = ( title, options = {} ) => b.heading( title, options );

const fact = ( title, { color = C.ink, size = 16, weight = 500, align, more = {} } = {} ) =>
	b.heading( title, { tag: 'p', color, align, more: { ...sans, typography_font_size: px( size ), typography_font_weight: String( weight ), typography_line_height: em( 1.5 ), ...more } } );

/** Small uppercase label. */
const label = ( title, { color = C.brass, align } = {} ) => fact( title, { color, size: 13, weight: 700, align, more: { typography_text_transform: 'uppercase', typography_letter_spacing: px( 2 ) } } );

const intro = ( name, title, lead, { tag = 'h2', align, width = 60, dark = false } = {} ) =>
	column( { width, spacing: 14, ...( align === 'center' ? { align: 'center', more: { _flex_align_self: 'center' } } : {} ) }, [
		label( name, { align, color: dark ? C.gold : C.brass } ),
		heading( title, { tag, align, ...( dark ? { color: C.cream } : {} ) } ),
		...( lead ? [ text( `<p>${ lead }</p>`, { align, size: px( 19 ), ...( dark ? { color: C.mist } : {} ) } ) ] : [] ),
	] );

/** Plain buttons are forest, from the Primary color of Site Settings. */
const button = ( title, url, options = {} ) => b.button( title, url, options );
const outline = { background_color: 'transparent', button_text_color: C.forest, border_border: 'solid', border_width: box( 1.5 ), border_color: C.forest, hover_color: C.cream, button_background_hover_color: C.forest, button_hover_border_color: C.forest };
const onForest = { background_color: C.cream, button_text_color: C.forest, hover_color: C.forest, button_background_hover_color: C.gold };
const outlineOnForest = { background_color: 'transparent', button_text_color: C.cream, border_border: 'solid', border_width: box( 1.5 ), border_color: C.mist, hover_color: C.forest, button_background_hover_color: C.cream, button_hover_border_color: C.cream };
const arrow = ( title, url, { color = C.forest } = {} ) => button( title, url, { more: { background_color: 'transparent', button_background_hover_color: 'transparent', button_text_color: color, hover_color: C.brass, selected_icon: icon( 'arrow-right' ), icon_align: 'row-reverse', icon_indent: px( 8 ), border_border: 'solid', border_width: box( 0, 0, 1, 0 ), border_color: color, border_radius: box( 0 ), text_padding: box( 0, 0, 5, 0 ), _flex_size: 'none' } } );

const image = ( uid, { radius = 4, url, more = {} } = {} ) => b.image( uid, { radius, more: { ...( url ? { link_to: 'custom', link: link( url ) } : {} ), ...more } } );

const ruled = ( elements, { spacing = 12, top = 24, bottom = 24, color = C.line, more = {} } = {} ) =>
	container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( spacing ), padding: box( top, 0, bottom, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: color, ...more }, elements );

/** Bedrooms, bathrooms and floor area on one line. */
const specs = ( home, { color = C.text } = {} ) => list( [ { text: `${ home.beds } bedrooms`, icon: 'bed' }, { text: `${ home.baths } ${ home.baths === 1 ? 'bathroom' : 'bathrooms' }`, icon: 'bath' }, { text: `${ home.area } m²`, icon: 'ruler-combined' } ], { color, iconColor: C.brass, more: { view: 'inline', space_between: px( 22 ), icon_size: px( 14 ), text_indent: px( 8 ), icon_typography_typography: 'custom', icon_typography_font_size: px( 15 ), icon_typography_font_weight: '500' } } );

/** One home in a list of homes. */
const listing = ( home, tag = 'h3' ) =>
	column( { spacing: 14 }, [
		image( home.uid, { url: page( 'property' ) } ),
		row( { spacing: 12, align: 'center', justify: 'space-between', more: { flex_direction_mobile: 'row', flex_align_items_mobile: 'center' } }, [ label( home.status ), fact( home.place, { color: C.text, size: 15, more: { _flex_size: 'none' } } ) ] ),
		heading( home.name, { tag, size: fluid( 'clamp(1.375rem, 1.25rem + 0.6vw, 1.75rem)' ), more: { link: link( page( 'property' ) ) } } ),
		fact( home.price, { size: 19, weight: 700 } ),
		specs( home ),
	] );

/** The top of an inner page: a forest band. */
const pageHero = ( name, title, lead ) => section( { background: C.forest, top: 104, bottom: 96, spacing: 0 }, [ intro( name, title, lead, { tag: 'h1', width: 70, dark: true } ) ] );

/** The closing band, shared by most pages. */
const valuation = () =>
	section( { background: C.sand, top: 96, bottom: 96, spacing: 0 }, [
		row( { spacing: 40, align: 'center', justify: 'space-between' }, [
			column( { width: 60, spacing: 12 }, [ heading( 'Thinking of selling? Start with what it is worth.' ), text( '<p>A partner visits, looks properly and tells you a figure we would be happy to be held to. It takes an hour and costs nothing.</p>', { size: px( 19 ) } ) ] ),
			row( { spacing: 14, align: 'center', more: { width: percent( 36 ), width_mobile: percent( 100 ), flex_justify_content: 'flex-end', flex_justify_content_mobile: 'flex-start', flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Book a valuation', page( 'contact' ) ), button( 'Call us', TEL, { more: outline } ) ] ),
		] ),
	] );

/** An enquiry form (Elementor Pro). */
const enquiry = ( name, buttonText, subject, messageLabel ) =>
	widget( 'form', {
		form_name: name,
		form_fields: [
			{ _id: 'name', custom_id: 'name', field_type: 'text', field_label: 'Your name', placeholder: '', required: 'true', width: '100' },
			{ _id: 'email', custom_id: 'email', field_type: 'email', field_label: 'Email', placeholder: '', required: 'true', width: '50' },
			{ _id: 'phone', custom_id: 'phone', field_type: 'tel', field_label: 'Telephone', placeholder: '', width: '50' },
			{ _id: 'message', custom_id: 'message', field_type: 'textarea', field_label: messageLabel, placeholder: '', width: '100', rows: 4 },
		],
		show_labels: 'true',
		mark_required: 'yes',
		button_text: buttonText,
		button_width: '100',
		submit_actions: [ 'email' ],
		email_subject: subject,
		success_message: 'Thank you. One of the partners will be in touch within one working day.',
		label_color: C.ink,
		field_text_color: C.ink,
		field_background_color: C.white,
		field_border_color: '#B9B19E',
		field_border_width: box( 1 ),
		field_border_radius: box( 4 ),
		button_background_color: C.forest,
		button_text_color: C.cream,
		button_background_hover_color: C.pine,
		button_hover_color: C.cream,
		button_border_radius: box( 4 ),
		row_gap: px( 16 ),
		column_gap: px( 16 ),
	} );

/* -------------------------------------------------------------------------
   Content
   ---------------------------------------------------------------------- */
// Each home is written to match its photograph. Names, prices and figures are examples.
const homes = [
	{ uid: 'home-modern', name: '12 Orchard Rise', place: 'Hill Park', price: '£1,150,000', beds: 4, baths: 3, area: 210, status: 'New' },
	{ uid: 'home-detached', name: 'Ivy House, Church Lane', place: 'Old Town', price: '£1,450,000', beds: 5, baths: 3, area: 260, status: 'For sale' },
	{ uid: 'home-cottage', name: 'Quince Cottage', place: 'Marlow Green', price: '£685,000', beds: 3, baths: 1, area: 120, status: 'Under offer' },
	{ uid: 'home-forest', name: 'Pinewood, Forest Road', place: 'Marlow Green', price: '£895,000', beds: 4, baths: 2, area: 185, status: 'For sale' },
	{ uid: 'home-apartment', name: 'Flat 9, Linden Court', place: 'Riverside', price: '£540,000', beds: 2, baths: 2, area: 88, status: 'For sale' },
	{ uid: 'home-terrace', name: '2 Weavers’ Row', place: 'Old Town', price: '£475,000', beds: 2, baths: 1, area: 84, status: 'For sale' },
];

const agents = [
	{ uid: 'agent-1', name: 'Clara Hartwell', role: 'Partner, sales', body: 'Runs sales in the Old Town and Hill Park. Grew up three streets from the office and joined her father here in 2014.' },
	{ uid: 'agent-2', name: 'Samuel Rowe', role: 'Partner, country homes', body: 'Farms, cottages and anything with more land than neighbours. A chartered surveyor by training.' },
	{ uid: 'agent-3', name: 'Leo Marsh', role: 'Lettings', body: 'Looks after 140 rented homes and the people who live in them. Answers his own telephone.' },
];

const posts = [
	{
		name: 'what-a-valuation-is',
		title: 'What a valuation is, and what it is not',
		excerpt: 'Three agents, three figures, and the highest one is the most tempting. How to tell a valuation from a sales pitch.',
		image: 'post-1',
		category: 'Selling',
		days: 6,
		content: [
			blocks.paragraph( 'Ask three agents what your house is worth and you will hear three figures. The highest is the most tempting, and often the least useful: an agent who wants the instruction has every reason to be generous.' ),
			blocks.heading( 'What we look at' ),
			blocks.list( [ 'What has actually sold nearby in the last six months, not what is advertised', 'The condition of roof, windows, heating and wiring', 'Who is buying at this price, and how many of them there are' ] ),
			blocks.heading( 'What to ask an agent' ),
			blocks.paragraph( 'Ask which three sales the figure is based on, and what the agent would do if there were no offers in the first month. The answers tell you more than the number.' ),
			blocks.paragraph( `We are happy to be asked both. <a href="${ page( 'contact' ) }">Book a valuation</a> and bring the questions.` ),
		],
	},
	{
		name: 'reading-a-floor-plan',
		title: 'How to read a floor plan in five minutes',
		excerpt: 'Photographs are chosen to flatter. A floor plan cannot lie about where the bathroom is. What to look for before you book a viewing.',
		image: 'post-2',
		category: 'Buying',
		days: 21,
		content: [
			blocks.paragraph( 'Photographs are chosen to flatter. A floor plan cannot lie about where the bathroom is, how far the kitchen is from the table, or whether the third bedroom is a cupboard.' ),
			blocks.heading( 'Three things to check' ),
			blocks.list( [ 'Which way the main rooms face', 'How you walk from the front door to the kitchen', 'Whether any room is only reached through another' ] ),
			blocks.quote( 'A good plan is one you can walk through in your head without getting lost.' ),
			blocks.paragraph( 'Every home we list has a measured plan. If something on it is unclear, ask before the viewing rather than during it.' ),
		],
	},
	{
		name: 'the-market-this-autumn',
		title: 'The market this autumn, in four numbers',
		excerpt: 'How long homes took to sell, how close to the asking price, and which streets moved fastest. Our own figures, not a headline.',
		image: 'post-3',
		category: 'Market',
		days: 35,
		content: [
			blocks.paragraph( 'Headlines about the housing market describe a country. You are selling one house on one street. These are our own figures for the homes we sold between September and November.' ),
			blocks.list( [ 'Seven weeks, on average, from listing to an accepted offer', '97% of the asking price achieved', 'Four viewings before an offer, on average', 'One sale in five agreed before the first open day' ] ),
			blocks.heading( 'What it means if you are selling' ),
			blocks.paragraph( 'Price it honestly and the first three weeks do most of the work. The homes that took longest were the ones that started too high and came down.' ),
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
		// A split screen: words on forest, a house beside them, edge to edge.
		container( { content_width: 'full', flex_direction: 'row', flex_direction_tablet: 'column', flex_direction_mobile: 'column', flex_gap: gap( 0 ), padding: box( 0 ), background_background: 'classic', background_color: C.forest }, [
			container( { content_width: 'full', width: percent( 50 ), width_tablet: percent( 100 ), width_mobile: percent( 100 ), flex_direction: 'column', flex_justify_content: 'center', flex_gap: gap( 24 ), padding: { unit: 'px', top: '96', right: '72', bottom: '96', left: '72', isLinked: false }, padding_tablet: box( 72, 40 ), padding_mobile: box( 56, 20 ) }, [
				label( 'Estate agents since 1998', { color: C.gold } ),
				heading( 'Homes sold by people who know the street', { tag: 'h1', color: C.cream } ),
				text( '<p>Hartwell &amp; Rowe is an independent agency in the Old Town. We sell about ninety homes a year, and a partner handles every one from valuation to keys.</p>', { size: px( 20 ), color: C.mist } ),
				row( { spacing: 14, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'See homes for sale', page( 'listings' ), { more: onForest } ), button( 'Book a valuation', page( 'contact' ), { more: outlineOnForest } ) ] ),
			] ),
			container( { content_width: 'full', width: percent( 50 ), width_tablet: percent( 100 ), width_mobile: percent( 100 ), min_height: { unit: 'px', size: 680, sizes: [] }, min_height_tablet: { unit: 'px', size: 420, sizes: [] }, min_height_mobile: { unit: 'px', size: 300, sizes: [] }, padding: box( 0 ), background_background: 'classic', background_image: media( 'street' ), background_position: 'center center', background_size: 'cover', background_repeat: 'no-repeat' }, [] ),
		] ),

		section( { top: 64, bottom: 64, spacing: 0 }, [
			grid( { columns: 4, tablet: 2, spacing: 32, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, [
				[ 28, 'years in the Old Town' ],
				[ 90, 'homes sold a year' ],
				[ 97, 'of asking price, on average', { suffix: '%' } ],
				[ 7, 'weeks to an accepted offer' ],
			].map( ( [ number, title, extra = {} ] ) => ruled( [ counter( number, title, { color: C.forest, titleColor: C.text, weight: 500, ...extra } ) ], { bottom: 0 } ) ) ),
		] ),

		section( { top: 48, spacing: 56 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'For sale', 'Homes on the market now' ), arrow( 'All homes', page( 'listings' ) ) ] ),
			grid( { columns: 3, spacing: 36 }, homes.slice( 0, 3 ).map( ( home ) => listing( home ) ) ),
		] ),

		section( { background: C.forest, spacing: 0 }, [
			row( { spacing: 80, align: 'center', tablet: 'column' }, [
				column( { width: 48, more: { width_tablet: percent( 100 ) } }, [ image( 'dining' ) ] ),
				column( { width: 52, spacing: 22, more: { width_tablet: percent( 100 ) } }, [
					label( 'How we work', { color: C.gold } ),
					heading( 'One partner, from the first visit to the day you move', { color: C.cream } ),
					text( '<p>You will not be passed to a junior after signing. The person who values your home shows it, negotiates for it and telephones you every Friday, whether there is news or not.</p>', { color: C.mist } ),
					list( [ 'A measured plan and proper photographs for every home', 'Viewings shown by the partner, not a key-holder', 'One fee, agreed in writing, paid on completion' ], { color: C.cream, iconColor: C.gold } ),
					button( 'Our services', page( 'services' ), { more: outlineOnForest } ),
				] ),
			] ),
		] ),

		section( { spacing: 56 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'The people', 'Who you will deal with' ), arrow( 'Meet everyone', page( 'agents' ) ) ] ),
			grid( { columns: 3, spacing: 36 }, agents.map( ( person ) => column( { spacing: 12 }, [ image( person.uid, { url: page( 'agent' ) } ), heading( person.name, { tag: 'h3', more: { link: link( page( 'agent' ) ) } } ), label( person.role ) ] ) ) ),
		] ),

		section( { background: C.cream, top: 0, spacing: 0 }, [
			ruled( [ column( { width: 80, spacing: 22 }, [
				heading( '“Clara told us the truth about the price in the first ten minutes. It sold in three weeks, for more than the agent who promised us the moon.”', { tag: 'p', size: fluid( 'clamp(1.5rem, 1.1rem + 1.8vw, 2.5rem)' ), weight: 400, more: { typography_line_height: em( 1.25 ) } } ),
				fact( 'Ruth and Daniel Amery, sellers of 6 Mercer Row. A sample quote: replace it with the words of a client of your own.', { color: C.text } ),
			] ) ], { top: 56, bottom: 0 } ),
		] ),

		section( { spacing: 56 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'Market notes', 'Plain words about buying and selling' ), arrow( 'All notes', page( 'notes' ) ) ] ),
			widget( 'posts', { classic_columns: '3', classic_columns_tablet: '2', classic_columns_mobile: '1', classic_posts_per_page: 3, classic_show_excerpt: 'yes', classic_excerpt_length: 18, classic_meta_data: [ 'date' ], classic_show_read_more: '', classic_title_tag: 'h3', classic_item_ratio: { unit: 'px', size: 0.6, sizes: [] }, classic_img_border_radius: box( 4 ), classic_title_color: C.ink, classic_excerpt_color: C.text, classic_meta_color: C.text, classic_row_gap: px( 40 ), classic_column_gap: px( 36 ), pagination_type: '' } ),
		] ),

		valuation(),
	],
};

pages.listings = {
	title: 'Homes for Sale',
	slug: 'homes',
	content: [
		pageHero( 'For sale', 'Six homes on the market now', 'Each one has been visited, measured and photographed by a partner. Telephone to arrange a viewing, or ask on the page of the home.' ),
		section( { spacing: 0 }, [ grid( { columns: 3, spacing: 36, more: { grid_gaps: { unit: 'px', size: 36, column: '36', row: '64', isLinked: false } } }, homes.map( ( home ) => listing( home, 'h2' ) ) ) ] ),
		section( { top: 0, spacing: 0 }, [ ruled( [ row( { spacing: 40, align: 'center', justify: 'space-between' }, [ column( { width: 62, spacing: 8 }, [ heading( 'Not seeing the right one?', { tag: 'h2', size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ) } ), text( '<p>About one home in five is sold before it is advertised. Tell us what you are looking for and we will telephone first.</p>' ) ] ), button( 'Register your search', page( 'contact' ), { more: { ...outline, _flex_size: 'none' } } ) ] ) ], { top: 48, bottom: 0 } ) ] ),
		valuation(),
	],
};

const featured = homes[ 0 ];

pages.property = {
	title: '12 Orchard Rise',
	slug: '12-orchard-rise',
	content: [
		section( { top: 72, bottom: 48, spacing: 28 }, [
			row( { spacing: 32, align: 'flex-end', justify: 'space-between' }, [
				column( { width: 64, spacing: 12 }, [ label( 'New to the market · Hill Park' ), heading( featured.name, { tag: 'h1', size: fluid( 'clamp(2rem, 1.4rem + 2.8vw, 3.5rem)' ) } ), specs( featured ) ] ),
				column( { width: 30, spacing: 4, more: { flex_align_items: 'flex-end', flex_align_items_mobile: 'flex-start' } }, [ fact( 'Guide price', { color: C.text, size: 15 } ), heading( featured.price, { tag: 'p', size: fluid( 'clamp(1.75rem, 1.4rem + 1.6vw, 2.75rem)' ), weight: 500 } ) ] ),
			] ),
			image( 'home-modern-wide' ),
			grid( { columns: 2, tablet: 2, spacing: 24 }, [ image( 'living' ), image( 'kitchen' ) ] ),
		] ),
		section( { top: 24, spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 60, spacing: 40, more: { width_tablet: percent( 100 ) } }, [
					column( { spacing: 16 }, [ heading( 'About this home' ), text( '<p>Built in 2016 near the top of Orchard Rise, the house is arranged over three floors: a garage and utility room at street level, the kitchen and living room above, and four bedrooms on the top floor, where the main bedroom has the tall corner window.</p><p>The living room has a herringbone oak floor and faces the garden. The kitchen was refitted in 2022, with an island that seats two.</p>' ) ] ),
					column( { spacing: 16 }, [ heading( 'What is here', { tag: 'h2', size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ) } ), grid( { columns: 2, tablet: 2, spacing: 0, more: { grid_gaps: { unit: 'px', size: 0, column: '40', row: '0', isLinked: false } } }, [ [ 'Floors', 'Three' ], [ 'Built', '2016' ], [ 'Heating', 'Gas, underfloor on two floors' ], [ 'Energy rating', 'B' ], [ 'Parking', 'Garage and one space' ], [ 'Outside', 'Garden to the rear' ], [ 'Tenure', 'Freehold' ], [ 'Council tax', 'Band G' ] ].map( ( [ name, value ] ) => ruled( [ row( { spacing: 16, justify: 'space-between', align: 'baseline', more: { flex_direction_mobile: 'row', flex_align_items_mobile: 'baseline' } }, [ fact( name, { color: C.text } ), fact( value, { weight: 700, more: { _flex_size: 'none' } } ) ] ) ], { top: 14, bottom: 14 } ) ) ) ] ),
					column( { spacing: 16 }, [ heading( 'The area', { tag: 'h2', size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ) } ), text( '<p>Hill Park is ten minutes on foot from the Old Town and the station. The primary school at the foot of the hill is rated outstanding, and the path at the end of the garden leads into forty acres of common.</p>' ) ] ),
				] ),
				column( { width: 40, more: { width_tablet: percent( 100 ) } }, [
					container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 20 ), padding: box( 36 ), padding_mobile: box( 24 ), background_background: 'classic', background_color: C.white, border_border: 'solid', border_width: box( 1 ), border_color: C.line, border_radius: box( 4 ) }, [
						heading( 'Arrange a viewing', { tag: 'h2', size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ) } ),
						fact( `Clara Hartwell shows this home herself. ${ PHONE }`, { color: C.text } ),
						enquiry( 'Viewing request', 'Request a viewing', 'Viewing request: 12 Orchard Rise', 'When would suit you?' ),
					] ),
				] ),
			] ),
		] ),
		section( { top: 0, spacing: 48 }, [ ruled( [ row( { spacing: 24, align: 'center', justify: 'space-between' }, [ heading( 'More homes for sale', { tag: 'h2', size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ) } ), arrow( 'All homes', page( 'listings' ) ) ] ) ], { top: 48, bottom: 0 } ), grid( { columns: 3, spacing: 36 }, [ homes[ 1 ], homes[ 2 ], homes[ 3 ] ].map( ( home ) => listing( home ) ) ) ] ),
	],
};

pages.agents = {
	title: 'Agents',
	content: [
		pageHero( 'The people', 'The three people who value, show and negotiate', 'There are nine of us in the office. These are the three you will deal with from the first visit to the day you move.' ),
		section( { spacing: 0 }, [ grid( { columns: 3, spacing: 36 }, agents.map( ( person ) => column( { spacing: 14 }, [ image( person.uid, { url: page( 'agent' ) } ), label( person.role ), heading( person.name, { tag: 'h2', size: fluid( 'clamp(1.5rem, 1.3rem + 0.8vw, 1.875rem)' ), more: { link: link( page( 'agent' ) ) } } ), text( `<p>${ person.body }</p>` ), arrow( 'Profile', page( 'agent' ) ) ] ) ) ) ] ),
		valuation(),
	],
};

pages.agent = {
	title: 'Clara Hartwell',
	slug: 'clara-hartwell',
	content: [
		section( { background: C.forest, top: 88, bottom: 88, spacing: 0 }, [
			row( { spacing: 72, align: 'center', tablet: 'column' }, [
				column( { width: 34, more: { width_tablet: percent( 56 ), width_mobile: percent( 100 ) } }, [ image( 'agent-1' ) ] ),
				column( { width: 66, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					label( 'Partner, sales', { color: C.gold } ),
					heading( 'Clara Hartwell', { tag: 'h1', color: C.cream } ),
					text( '<p>Clara joined her father at the agency in 2014 and became a partner five years later. She does every valuation in the Old Town herself, and shows every home she takes on.</p>', { size: px( 20 ), color: C.mist } ),
					list( [ { text: PHONE, icon: 'phone-alt', url: TEL }, { text: EMAIL, icon: 'envelope', url: `mailto:${ EMAIL }` } ], { color: C.cream, iconColor: C.gold } ),
					button( 'Ask Clara for a valuation', page( 'contact' ), { more: onForest } ),
				] ),
			] ),
		] ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 56, spacing: 16, more: { width_tablet: percent( 100 ) } }, [ heading( 'In her own words' ), text( '<p>“I was eleven when my father let me hold the tape measure. What I learned from him is that a house is worth what someone will pay for it on a Tuesday in the rain, and that telling a seller anything else is a kindness that costs them money.”</p><p>Clara is a Fellow of the national association of estate agents and sits on the board of the Old Town conservation trust.</p>' ) ] ),
				column( { width: 44, spacing: 0, more: { width_tablet: percent( 100 ) } }, [ [ 'Homes sold', '310' ], [ 'Area', 'Old Town, Hill Park' ], [ 'With the agency since', '2014' ], [ 'Speaks', 'English, French' ] ].map( ( [ name, value ] ) => ruled( [ row( { spacing: 16, justify: 'space-between', align: 'baseline', more: { flex_direction_mobile: 'row', flex_align_items_mobile: 'baseline' } }, [ fact( name, { color: C.text } ), fact( value, { weight: 700, more: { _flex_size: 'none' } } ) ] ) ], { top: 16, bottom: 16 } ) ) ),
			] ),
		] ),
		section( { top: 0, spacing: 48 }, [ ruled( [ heading( 'Homes Clara is selling', { tag: 'h2', size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ) } ) ], { top: 48, bottom: 0 } ), grid( { columns: 3, spacing: 36 }, [ homes[ 0 ], homes[ 1 ], homes[ 5 ] ].map( ( home ) => listing( home ) ) ) ] ),
		valuation(),
	],
};

pages.services = {
	title: 'Services',
	content: [
		pageHero( 'Services', 'Selling, buying, letting, and saying what a home is worth', 'Four things we do every week. Each has a fixed fee, agreed in writing before we start.' ),
		section( { spacing: 0 }, [
			column( { spacing: 0 }, [
				[ 'Selling', 'From valuation to completion, handled by one partner. Photographs, a measured plan, viewings and negotiation are all included.', '1.25% of the sale price', page( 'service' ) ],
				[ 'Buying', 'We search for you, including homes that are not advertised, and negotiate on your side of the table.', 'A fixed fee from £4,000', null ],
				[ 'Lettings', 'Finding a tenant, or looking after the tenancy as well. We manage 140 homes for their owners.', 'From 8% of the rent', null ],
				[ 'Valuations', 'For a sale, for probate, or simply to know. A written figure with the sales it is based on.', 'Free before a sale', null ],
			].map( ( [ title, body, fee, url ] ) =>
				container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'column', flex_gap: gap( 48 ), flex_gap_mobile: gap( 12 ), padding: box( 40, 0 ), padding_mobile: box( 28, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.line }, [
					column( { width: 30 }, [ heading( title, { tag: 'h2' } ) ] ),
					column( { width: 44, spacing: 16 }, [ text( `<p>${ body }</p>`, { size: px( 19 ) } ), ...( url ? [ arrow( 'How selling with us works', url ) ] : [] ) ] ),
					column( { width: 26, spacing: 4 }, [ label( 'Fee' ), fact( fee, { size: 18, weight: 700 } ) ] ),
				] ) ) ),
		] ),
		valuation(),
	],
};

pages.service = {
	title: 'Selling',
	slug: 'selling',
	content: [
		pageHero( 'Selling', 'Selling your home, one step at a time', 'Most sales take four months from the first visit to the day you hand over the keys. Here is what happens in each.' ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 60, spacing: 0, more: { width_tablet: percent( 100 ) } }, [
					[ 'Week 1', 'Valuation', 'A partner visits and gives you a figure, with the three sales it is based on.' ],
					[ 'Weeks 2 to 3', 'Preparing', 'Photographs, a measured plan and the legal pack, so that a buyer\'s solicitor has nothing to wait for.' ],
					[ 'Weeks 4 to 8', 'Viewings', 'Shown by the partner. You hear from us after every viewing and every Friday.' ],
					[ 'Weeks 9 to 16', 'Offer to keys', 'We check the buyer can proceed, then stay on the telephone to both solicitors until it completes.' ],
				].map( ( [ when, title, body ] ) => ruled( [ label( when ), heading( title, { tag: 'h2', size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ) } ), text( `<p>${ body }</p>` ) ], { spacing: 8 } ) ) ),
				column( { width: 40, more: { width_tablet: percent( 100 ) } }, [
					container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 18 ), padding: box( 36 ), padding_mobile: box( 24 ), background_background: 'classic', background_color: C.forest, border_radius: box( 4 ) }, [
						label( 'The fee', { color: C.gold } ),
						heading( '1.25% of the sale price', { tag: 'p', color: C.cream, size: fluid( 'clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)' ) } ),
						text( '<p>Paid on completion. Nothing if the home does not sell, and no tie-in after twelve weeks.</p>', { color: C.mist } ),
						list( [ 'Photographs and a measured plan', 'Every viewing shown by a partner', 'Advertising on the main portals', 'A weekly telephone call' ], { color: C.cream, iconColor: C.gold } ),
						button( 'Book a valuation', page( 'contact' ), { more: { ...onForest, align: 'justify' } } ),
					] ),
				] ),
			] ),
		] ),
		valuation(),
	],
};

pages.about = {
	title: 'About',
	content: [
		pageHero( 'About', 'An agency small enough to remember your house', 'Founded in 1998 by a father and daughter, in the office on Mercer Row we still work from.' ),
		section( { top: 0, bottom: 0, spacing: 0, more: { background_background: 'gradient', background_color: C.forest, background_color_stop: { unit: '%', size: 50, sizes: [] }, background_color_b: C.cream, background_color_b_stop: { unit: '%', size: 50, sizes: [] }, background_gradient_angle: { unit: 'deg', size: 180, sizes: [] } } }, [ image( 'old-town' ) ] ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 40, spacing: 14, more: { width_tablet: percent( 100 ) } }, [ label( 'Our story' ), heading( 'Twenty-eight years on one street' ) ] ),
				column( { width: 60, more: { width_tablet: percent( 100 ) } }, [ text( '<p>George Hartwell opened the office after thirty years as a surveyor, with one rule: tell people the truth about their house, even when they would rather hear something else. His daughter Clara joined him in 2014.</p><p>Samuel Rowe became a partner in 2011 and brought the country homes with him. George retired in 2016 and still calls in on Fridays to read the window.</p><p>We have stayed independent and stayed small. Nine people, three partners, about ninety sales a year.</p>' ) ] ),
			] ),
		] ),
		section( { background: C.forest, spacing: 48 }, [
			intro( 'What we hold to', 'Three promises, in writing', null, { dark: true } ),
			grid( { columns: 3, spacing: 40 }, [
				[ 'An honest figure', 'We value a home at what we believe it will sell for, and show the sales the figure is based on.' ],
				[ 'A named partner', 'One person from start to finish. You have their own telephone number.' ],
				[ 'A call every Friday', 'Whether there is news or not. Silence is the commonest complaint about agents, so we removed it.' ],
			].map( ( [ title, body ] ) => ruled( [ heading( title, { tag: 'h3', color: C.cream } ), text( `<p>${ body }</p>`, { color: C.mist } ) ], { color: '#3A5446', bottom: 0 } ) ) ),
		] ),
		valuation(),
	],
};

pages.contact = {
	title: 'Contact',
	content: [
		pageHero( 'Contact', 'Call, write, or come in', 'The office is on Mercer Row, opposite the bakery. There is always a partner in on Saturdays.' ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 54, spacing: 20, more: { width_tablet: percent( 100 ) } }, [ heading( 'Book a valuation, or ask us anything', { tag: 'h2' } ), enquiry( 'Contact', 'Send', 'Enquiry from the website', 'How can we help?' ) ] ),
				column( { width: 46, spacing: 0, more: { width_tablet: percent( 100 ) } }, [
					ruled( [ label( 'Telephone' ), heading( PHONE, { tag: 'p', size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ), more: { link: link( TEL ) } } ) ], { spacing: 6 } ),
					ruled( [ label( 'Email' ), heading( EMAIL, { tag: 'p', size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ), more: { link: link( `mailto:${ EMAIL }` ) } } ) ], { spacing: 6 } ),
					ruled( [ label( 'Office' ), fact( '22 Mercer Row, Old Town', { size: 19 } ), fact( 'Monday to Friday 9:00 to 18:00, Saturday 10:00 to 15:00', { color: C.text } ) ], { spacing: 6 } ),
				] ),
			] ),
		] ),
	],
};

// The posts page: shown by the archive template, so it has no Elementor content of its own.
pages.notes = { title: 'Market Notes', slug: 'market-notes', plain: true };

/* -------------------------------------------------------------------------
   Theme Builder templates (Elementor Pro)
   ---------------------------------------------------------------------- */
const postList = () =>
	widget( 'archive-posts', { archive_classic_columns: '3', archive_classic_columns_tablet: '2', archive_classic_columns_mobile: '1', archive_classic_show_excerpt: 'yes', archive_classic_excerpt_length: 20, archive_classic_meta_data: [ 'date' ], archive_classic_show_read_more: '', archive_classic_title_tag: 'h2', archive_classic_item_ratio: { unit: 'px', size: 0.6, sizes: [] }, archive_classic_img_border_radius: box( 4 ), archive_classic_title_color: C.ink, archive_classic_excerpt_color: C.text, archive_classic_meta_color: C.text, archive_classic_row_gap: px( 56 ), archive_classic_column_gap: px( 36 ), pagination_type: 'numbers', nothing_found_message: 'Nothing here yet.' } );

const footLinks = ( title, items ) =>
	column( { width: 18, spacing: 14, more: { width_tablet: percent( 30 ) } }, [
		label( title, { color: C.gold } ),
		list( items.map( ( [ name, url ] ) => ( { text: name, url } ) ), { color: C.mist, more: { view: 'traditional', icon_size: px( 0 ), text_indent: px( 0 ), text_color_hover: C.cream } } ),
	] );

const templates = {
	header: {
		title: 'Header',
		type: 'header',
		conditions: [ [ 'include', 'general' ] ],
		content: [
			container( { content_width: 'boxed', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'space-between', flex_gap: gap( 32 ), flex_wrap: 'nowrap', padding: box( 18, 24 ), padding_mobile: box( 12, 20 ), background_background: 'classic', background_color: C.cream, border_border: 'solid', border_width: box( 0, 0, 1, 0 ), border_color: C.line }, [
				heading( 'Hartwell &amp; Rowe', { tag: 'p', color: C.forest, size: px( 26 ), weight: 500, more: { link: link( page( 'home' ) ), typography_letter_spacing: px( -0.3 ), _flex_size: 'none' } } ),
				container( { content_width: 'full', width: percent( 10 ), width_mobile: percent( 10 ), flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'flex-end', flex_gap: gap( 20 ), flex_wrap: 'nowrap', padding: box( 0 ), _flex_size: 'grow' }, [
					widget( 'nav-menu', { menu: menu( 'primary' ), layout: 'horizontal', align_items: 'end', pointer: 'underline', animation_line: 'fade', dropdown: 'tablet', full_width: 'stretch', text_align: 'aside', toggle: 'burger', toggle_align: 'right', menu_typography_typography: 'custom', menu_typography_font_family: SANS, menu_typography_font_size: px( 15 ), menu_typography_font_weight: '600', color_menu_item: C.ink, color_menu_item_hover: C.forest, pointer_color_menu_item_hover: C.brass, color_menu_item_active: C.forest, pointer_color_menu_item_active: C.brass, padding_horizontal_menu_item: px( 13 ), color_dropdown_item: C.ink, background_color_dropdown_item: C.cream, color_dropdown_item_hover: C.cream, background_color_dropdown_item_hover: C.forest, toggle_color: C.forest, toggle_background_color: C.sand, toggle_size: px( 30 ), _flex_size: 'grow' } ),
					button( 'Book a valuation', page( 'contact' ), { more: { size: 'sm', hide_mobile: 'hidden-mobile', hide_tablet: 'hidden-tablet' } } ),
				] ),
			] ),
		],
	},
	footer: {
		title: 'Footer',
		type: 'footer',
		conditions: [ [ 'include', 'general' ] ],
		content: [
			b.section( { background: C.pine, top: 80, bottom: 32, spacing: 48 }, [
				row( { spacing: 48, align: 'flex-start', tablet: 'row', more: { flex_wrap_tablet: 'wrap' } }, [
					column( { width: 40, spacing: 14, more: { width_tablet: percent( 100 ) } }, [ heading( 'Hartwell &amp; Rowe', { tag: 'p', color: C.cream, size: px( 30 ), weight: 500 } ), text( '<p>Independent estate agents in the Old Town since 1998. 22 Mercer Row.</p>', { color: C.mist } ) ] ),
					footLinks( 'Homes', [ [ 'For sale', page( 'listings' ) ], [ 'Selling', page( 'service' ) ], [ 'All services', page( 'services' ) ] ] ),
					footLinks( 'Agency', [ [ 'About', page( 'about' ) ], [ 'The partners', page( 'agents' ) ], [ 'Market notes', page( 'notes' ) ] ] ),
					footLinks( 'Contact', [ [ PHONE, TEL ], [ EMAIL, `mailto:${ EMAIL }` ], [ 'Book a valuation', page( 'contact' ) ] ] ),
				] ),
				container( { content_width: 'full', flex_direction: 'column', padding: box( 24, 0, 0, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: '#2C4337' }, [ fact( 'Sample content: Hartwell & Rowe is a fictional agency made for the Open Frame Real Estate starter site. The homes, prices, figures and client quote are examples to replace with your own.', { color: C.mist, size: 14, weight: 400 } ) ] ),
			] ),
		],
	},
	archive: {
		title: 'Market notes',
		type: 'archive',
		// The page that lists the posts. Elementor Pro has no title of its own for it, so the heading is written here.
		conditions: [ [ 'include', 'archive', 'post_archive' ] ],
		content: [ pageHero( 'Market notes', 'Plain words about buying and selling', 'Written by the partners, from what we see in the office each week.' ), section( { spacing: 0 }, [ postList() ] ), valuation() ],
	},
	'archive-terms': {
		title: 'Categories and other archives',
		type: 'archive',
		conditions: [ [ 'include', 'archive' ] ],
		content: [
			section( { background: C.forest, top: 104, bottom: 96, spacing: 14 }, [ label( 'Market notes', { color: C.gold } ), widget( 'theme-archive-title', { __dynamic__: { title: dynamic( 'archive-title' ) }, header_size: 'h1', title_color: C.cream } ) ] ),
			section( { spacing: 0 }, [ postList() ] ),
			valuation(),
		],
	},
	single: {
		title: 'Article',
		type: 'single-post',
		conditions: [ [ 'include', 'singular', 'post' ] ],
		content: [
			section( { background: C.forest, top: 104, bottom: 88, spacing: 18 }, [
				widget( 'post-info', { view: 'inline', icon_list: [ { _id: 'terms', type: 'terms', taxonomy: 'category', show_icon: 'none' }, { _id: 'date', type: 'date', show_icon: 'none' } ], text_color: C.gold, icon_typography_typography: 'custom', icon_typography_font_family: SANS, icon_typography_font_size: px( 13 ), icon_typography_font_weight: '700', icon_typography_text_transform: 'uppercase', icon_typography_letter_spacing: px( 2 ), space_between: px( 20 ) } ),
				column( { width: 76 }, [ widget( 'theme-post-title', { __dynamic__: { title: dynamic( 'post-title' ) }, header_size: 'h1', title_color: C.cream } ) ] ),
			] ),
			section( { top: 72, spacing: 48 }, [
				row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
					column( { width: 62, spacing: 36, more: { width_tablet: percent( 100 ) } }, [ widget( 'theme-post-featured-image', { __dynamic__: { image: dynamic( 'post-featured-image' ) }, image_size: 'full', image_border_radius: box( 4 ) } ), widget( 'theme-post-content', { text_color: C.text } ), ruled( [ widget( 'post-navigation', { show_label: 'yes', prev_label: 'Previous', next_label: 'Next', show_arrow: '', show_title: 'yes', label_color: C.text, text_color: C.ink, hover_color: C.brass } ) ], { bottom: 0 } ) ] ),
					column( { width: 38, more: { width_tablet: percent( 100 ) } }, [ container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 16 ), padding: box( 32 ), padding_mobile: box( 24 ), background_background: 'classic', background_color: C.sand, border_radius: box( 4 ) }, [ heading( 'Thinking of selling?', { tag: 'h2', size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ) } ), text( '<p>A partner visits and tells you a figure we would be happy to be held to. It takes an hour and costs nothing.</p>' ), button( 'Book a valuation', page( 'contact' ), { more: { align: 'justify' } } ) ] ) ] ),
				] ),
			] ),
		],
	},
	'not-found': {
		title: 'Page not found',
		type: 'error-404',
		conditions: [ [ 'include', 'singular', 'not_found404' ] ],
		content: [
			section( { background: C.forest, top: 144, bottom: 144, spacing: 22 }, [
				label( 'Error 404', { color: C.gold } ),
				column( { width: 70 }, [ heading( 'This address is not on our books', { tag: 'h1', color: C.cream } ) ] ),
				column( { width: 50 }, [ text( '<p>The page may have been a home that has since sold, or the link may be mistyped.</p>', { size: px( 20 ), color: C.mist } ) ] ),
				row( { spacing: 14, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Back to the home page', page( 'home' ), { more: onForest } ), button( 'See homes for sale', page( 'listings' ), { more: outlineOnForest } ) ] ),
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
		{ _id: 'primary', title: 'Primary', color: C.forest },
		{ _id: 'secondary', title: 'Secondary', color: C.ink },
		{ _id: 'text', title: 'Text', color: C.text },
		{ _id: 'accent', title: 'Accent', color: C.gold },
	],
	custom_colors: [
		{ _id: 'ofcream', title: 'Cream', color: C.cream },
		{ _id: 'ofsand', title: 'Sand', color: C.sand },
		{ _id: 'ofbrass', title: 'Brass (text)', color: C.brass },
		{ _id: 'ofline', title: 'Line', color: C.line },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: SERIF, typography_font_weight: '500' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '500' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '700' },
	],
	container_width: px( 1240 ),
	body_background_background: 'classic',
	body_background_color: C.cream,
	body_color: C.text,
	...sansType( 'body', { fontSize: px( 17 ), weight: 400, lineHeight: 1.7 } ),
	link_normal_color: C.forest,
	link_hover_color: C.brass,
	h1_color: C.ink,
	...serifType( 'h1', { fontSize: fluid( 'clamp(2.375rem, 1.4rem + 4.2vw, 4.5rem)' ), weight: 500, lineHeight: 1.06, spacing: -0.02 } ),
	h2_color: C.ink,
	...serifType( 'h2', { fontSize: fluid( 'clamp(1.875rem, 1.4rem + 2.2vw, 3rem)' ), weight: 500, lineHeight: 1.12, spacing: -0.015 } ),
	h3_color: C.ink,
	...serifType( 'h3', { fontSize: fluid( 'clamp(1.375rem, 1.25rem + 0.6vw, 1.75rem)' ), weight: 500, lineHeight: 1.2, spacing: -0.01 } ),
	h4_color: C.ink,
	...sansType( 'h4', { fontSize: px( 17 ), weight: 700, lineHeight: 1.4 } ),
	...sansType( 'button', { fontSize: px( 15 ), weight: 700, lineHeight: 1.2 } ),
	button_text_color: C.cream,
	button_background_color: C.forest,
	button_hover_text_color: C.cream,
	button_hover_background_color: C.pine,
	button_border_radius: box( 4 ),
	button_padding: box( 16, 26 ),
};

const themeMods = {
	open_frame_follow_elementor: true,
	open_frame_color_primary: C.forest.toLowerCase(),
	open_frame_color_primary_hover: C.pine.toLowerCase(),
	open_frame_color_heading: C.ink.toLowerCase(),
	open_frame_color_text: C.text.toLowerCase(),
	open_frame_color_link: C.forest.toLowerCase(),
	open_frame_color_link_hover: C.brass.toLowerCase(),
	open_frame_color_accent: C.gold.toLowerCase(),
	open_frame_color_border: C.line.toLowerCase(),
	open_frame_color_bg: C.cream.toLowerCase(),
	open_frame_container_width: 1240,
	open_frame_single_layout: 'no-sidebar',
	open_frame_page_layout: 'no-sidebar',
};

// The photographs, with where each came from (written by tools/sites/photos.mjs).
const mediaIndex = photoIndex( OUT );

const fonts = [
	{ family: SERIF, weight: '200 800', style: 'normal', file: 'newsreader-latin.woff2', licence: 'OFL-1.1. Copyright 2020 The Newsreader Project Authors.' },
	{ family: SANS, weight: '200 800', style: 'normal', file: 'manrope-latin.woff2', licence: 'OFL-1.1. Copyright 2019 The Manrope Project Authors.' },
];

const used = writeSite( {
	site: SITE,
	out: OUT,
	pages,
	templates,
	posts,
	kit,
	themeMods,
	options: { show_on_front: 'page', page_on_front: page( 'home' ), page_for_posts: page( 'notes' ) },
	menus: [ { uid: 'primary', name: 'Primary', location: 'primary', items: [ [ 'Homes for sale', 'listings' ], [ 'Services', 'services' ], [ 'Agents', 'agents' ], [ 'About', 'about' ], [ 'Market notes', 'notes' ], [ 'Contact', 'contact' ] ].map( ( [ title, name ] ) => ( { title, url: page( name ) } ) ) } ],
	media: mediaIndex,
	fonts,
	catalog: {
		summary: 'A calm, established site for an estate agency: homes for sale, a property page with a viewing form, agents with profiles, services and market notes. Header, footer and blog are Theme Builder templates.',
		colors: [ C.forest.toLowerCase(), C.gold.toLowerCase(), C.cream.toLowerCase() ],
		pages: [ 'Home', 'Homes for Sale', 'Property Details', 'Agents', 'Agent Profile', 'Services', 'Service Details', 'About', 'Market Notes (blog)', 'Single Post', 'Contact', '404' ],
		screenshots: [ { title: 'Homes for sale', file: 'homes.png' }, { title: 'Property details', file: 'property.png' }, { title: 'Agents', file: 'agents.png' } ],
		requires: { importer: '0.5.0' },
	},
} );

console.log( `Real Estate: ${ Object.keys( pages ).length } pages, ${ Object.keys( templates ).length } templates, ${ posts.length } posts. Widgets: ${ used.join( ', ' ) }` );
