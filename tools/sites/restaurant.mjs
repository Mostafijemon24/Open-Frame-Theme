#!/usr/bin/env node
/**
 * The Restaurant starter site ("Ember & Rye", a wood-fired kitchen), written as data.
 *
 *   node tools/sites/restaurant.mjs
 *
 * Writes starter-sites/restaurant/{site.json, site/, content/, media/index.json,
 * fonts/index.json}. The images come from tools/sites/restaurant-art.mjs. See
 * brief.md in the site folder for the design decisions this file implements.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks, box, builders, em, fluid, gap, ids, kitTypography, link, media, page, percent, photoIndex, px, writeSite } from './kit.mjs';

const SITE = 'restaurant';
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', SITE );

/* -------------------------------------------------------------------------
   Design tokens (see brief.md)
   ---------------------------------------------------------------------- */
const C = {
	night: '#141210',
	char: '#1E1A17',
	forest: '#1C2A23',
	cream: '#F2E8D9',
	bone: '#CDC2B2',
	ember: '#E39A4A',
	emberLight: '#F0B46C',
	line: '#3A332C',
};
const SERIF = 'Cormorant Garamond';
const SANS = 'Jost';
const PHONE = '+1 (555) 010-0177';
const TEL = 'tel:+15550100177';
const EMAIL = 'table@example.com';

const b = builders( ids() );
const { section, row, column, grid, container, widget } = b;

/* -------------------------------------------------------------------------
   Components of this design
   ---------------------------------------------------------------------- */
const sans = { typography_typography: 'custom', typography_font_family: SANS };

const heading = ( title, options = {} ) => b.heading( title, options );
const text = ( html, options = {} ) => b.text( html, options );

/** Small uppercase label with wide tracking. */
const label = ( title, { color = C.ember, align } = {} ) =>
	b.heading( title, { tag: 'p', color, align, more: { ...sans, typography_font_size: px( 13 ), typography_font_weight: '500', typography_text_transform: 'uppercase', typography_letter_spacing: px( 3 ), typography_line_height: em( 1.5 ) } } );

/** A line of sans text set as a heading widget: prices, hours, captions. */
const fact = ( title, { color = C.cream, size = 17, weight = 400, align, more = {} } = {} ) =>
	b.heading( title, { tag: 'p', color, align, more: { ...sans, typography_font_size: px( size ), typography_font_weight: String( weight ), typography_line_height: em( 1.5 ), ...more } } );

/** The short rule that sits between a label and a title. */
const ornament = ( align = 'center' ) => widget( 'divider', { color: C.ember, weight: px( 1 ), width: px( 56 ), align, gap: px( 4 ) } );

/** Label, rule, title and lead, centered unless told otherwise. */
const intro = ( name, title, lead, { tag = 'h2', align = 'center', width = 62 } = {} ) =>
	column( { width, spacing: 18, ...( align === 'center' ? { align: 'center', more: { _flex_align_self: 'center' } } : {} ) }, [
		label( name, { align } ),
		ornament( align ),
		heading( title, { tag, align } ),
		...( lead ? [ text( `<p>${ lead }</p>`, { align, size: px( 19 ) } ) ] : [] ),
	] );

/** Buttons are left to Elementor's Accent color and the button style of Site Settings. */
const button = ( title, url, options = {} ) => b.button( title, url, { ...options, kit: true } );
const outline = { background_color: 'transparent', button_text_color: C.cream, border_border: 'solid', border_width: box( 1 ), border_color: C.bone, hover_color: C.night, button_background_hover_color: C.cream, button_hover_border_color: C.cream };

const image = ( uid, { radius = 0, more = {} } = {} ) => b.image( uid, { radius, more } );

/** A name, a dotted line and a price (or any two things that belong on one line). */
const leader = ( left, right, { tag = 'h3', size = 'clamp(1.375rem, 1.25rem + 0.5vw, 1.625rem)' } = {} ) =>
	container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'baseline', flex_wrap: 'nowrap', flex_gap: gap( 14 ), padding: box( 0 ) }, [
		heading( left, { tag, size: fluid( size ), more: { _flex_size: 'none' } } ),
		widget( 'divider', { style: 'dotted', color: '#6B6156', weight: px( 2 ), gap: px( 2 ), _flex_size: 'grow', _element_width: 'initial', _element_custom_width: percent( 10 ) } ),
		fact( right, { color: C.ember, size: 17, weight: 500, more: { _flex_size: 'none' } } ),
	] );

/** One dish on the menu. */
const item = ( name, price, description ) => column( { spacing: 6 }, [ leader( name, price ), text( `<p>${ description }</p>`, { size: px( 16 ) } ) ] );

/** A part of the menu: a centered title and its dishes in two columns. */
const course = ( name, title, dishes, { background, note } = {} ) =>
	section( { background, top: 96, spacing: 48 }, [
		intro( name, title, note ),
		grid( { columns: 2, tablet: 1, spacing: 40, more: { grid_gaps: { unit: 'px', size: 40, column: '72', row: '36', isLinked: false } } }, dishes.map( ( dish ) => item( ...dish ) ) ),
	] );

/** A band with a picture behind it and a dark veil over the picture. */
const pictured = ( uid, { top = 144, bottom = top, veil = 0.62, spacing = 28, more = {} }, elements ) =>
	section( { top, bottom, spacing, more: { background_background: 'classic', background_image: media( uid ), background_position: 'center center', background_size: 'cover', background_repeat: 'no-repeat', background_overlay_background: 'classic', background_overlay_color: C.night, background_overlay_opacity: { unit: 'px', size: veil, sizes: [] }, ...more } }, elements );

/** The top of an inner page, centered. */
const pageHero = ( name, title, lead ) => section( { top: 112, bottom: 72, spacing: 0 }, [ intro( name, title, lead, { tag: 'h1', width: 70 } ) ] );

/** A block that starts with a hairline. */
const ruled = ( elements, { spacing = 12, top = 24, bottom = 24, more = {} } = {} ) =>
	container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( spacing ), padding: box( top, 0, bottom, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.line, ...more }, elements );

const hours = [ [ 'Tuesday to Thursday', '17:00 to 23:00' ], [ 'Friday and Saturday', '17:00 to 00:30' ], [ 'Sunday', '12:30 to 21:00' ], [ 'Monday', 'Closed' ] ];
const hoursList = () => column( { spacing: 14 }, hours.map( ( [ day, time ] ) => leader( day, time, { tag: 'p', size: 'clamp(1.25rem, 1.15rem + 0.4vw, 1.5rem)' } ) ) );

/* -------------------------------------------------------------------------
   Content
   ---------------------------------------------------------------------- */
const signature = [
	[ 'dish-leeks', 'Cured trout', '15', 'Shaved fennel, dill, crisp leaves' ],
	[ 'dish-flatbread', 'Oven flatbread', '13', 'Rocket, tomato, black olives, cured ham' ],
	[ 'dish-steak', 'Beef over oak', '29', 'Rosemary, soft egg, chopped tomato' ],
	[ 'dish-cheesecake', 'Warm sponge pudding', '11', 'Berries, cream poured at the table' ],
];

const posts = [
	{
		name: 'first-frost-leeks',
		title: 'What the first frost does to a leek',
		excerpt: 'Our grower called on Tuesday: the cold has come, and the leeks have turned sweet. Why the best week of the year for this dish is the first cold one.',
		image: 'note-1',
		category: 'Seasons',
		days: 5,
		content: [
			blocks.paragraph( 'Our grower called on Tuesday. The cold has come to the valley, and the leeks have turned sweet. It happens every year, and every year it changes the menu within a day.' ),
			blocks.heading( 'Why cold makes them sweet' ),
			blocks.paragraph( 'A leek protects itself from frost by turning starch into sugar. In the field that is survival. Over a fire it means the outer leaves blacken while the heart goes soft and almost honeyed.' ),
			blocks.heading( 'How we cook them' ),
			blocks.paragraph( 'Whole, unwashed, straight onto the embers for twelve minutes. We peel away the burnt layers at the pass and dress what is left with romesco and brown butter. Nothing else.' ),
			blocks.quote( 'The dish takes twelve minutes and eleven months of waiting.' ),
			blocks.paragraph( `Charred leeks are on the menu until the ground thaws. <a href="${ page( 'reservations' ) }">Book a table</a> while they last.` ),
		],
	},
	{
		name: 'bread-at-four',
		title: 'Why we bake our bread at four in the afternoon',
		excerpt: 'Most bakeries work at night. Ours fires at four, so the rye is an hour out of the oven when the first guests sit down.',
		image: 'note-3',
		category: 'Kitchen',
		days: 18,
		content: [
			blocks.paragraph( 'Most bakeries work through the night so that bread is ready by morning. We serve dinner, so we turned the clock around: the oven is loaded at four, and the rye is an hour old when the first guests sit down.' ),
			blocks.heading( 'One dough, three days' ),
			blocks.paragraph( 'The starter is fed on day one, the dough is mixed on day two and rests in the cold until the afternoon of day three. Slow fermentation is where the flavour comes from; the fire only finishes the job.' ),
			blocks.list( [ 'Stone-ground rye from a mill forty minutes away', 'A starter that is older than the restaurant', 'Oak and beech, never gas' ] ),
			blocks.paragraph( 'What is left at the end of the night becomes the crumb on the leeks and the base of tomorrow\'s soup.' ),
		],
	},
	{
		name: 'reading-the-wine-list',
		title: 'A short guide to our wine list',
		excerpt: 'Sixty bottles, most of them from growers we have visited. How the list is arranged, and what to ask for if you do not want to read it.',
		image: 'note-2',
		category: 'Cellar',
		days: 33,
		content: [
			blocks.paragraph( 'Our list has sixty bottles, most of them from growers we have visited. It is arranged by weight rather than by country, from the lightest white to the fullest red, because that is how people actually choose.' ),
			blocks.heading( 'If you do not want to read it' ),
			blocks.paragraph( 'Tell us what you are eating and what you usually enjoy. We will bring two bottles to the table and you can taste both. There is no wrong answer and no pressure to go up the page.' ),
			blocks.heading( 'By the glass' ),
			blocks.paragraph( 'Twelve wines are open every evening, and the list changes weekly. Half-glasses are always available, which is the best way to drink through a five-course menu.' ),
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
		pictured( 'hero', { top: 168, bottom: 168, veil: 0.7, spacing: 28, more: { min_height: { unit: 'vh', size: 82, sizes: [] }, flex_justify_content: 'center' } }, [
			column( { width: 74, spacing: 24, align: 'center', more: { _flex_align_self: 'center' } }, [
				label( 'Wood-fired kitchen and bar', { align: 'center', color: C.cream } ),
				heading( 'Fire, grain and <em>patience</em>', { tag: 'h1', align: 'center' } ),
				text( '<p>A small restaurant on Harbour Lane, cooking over oak and beech. The menu follows the market and changes most weeks.</p>', { align: 'center', size: px( 20 ), color: C.cream } ),
				row( { spacing: 16, justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content_mobile: 'center', flex_align_items_mobile: 'center' } }, [ button( 'Reserve a table', page( 'reservations' ) ), button( 'See the menu', page( 'menu' ), { more: outline } ) ] ),
			] ),
		] ),

		section( { background: C.char, top: 40, bottom: 40, spacing: 0 }, [
			grid( { columns: 3, tablet: 3, spacing: 24 }, [
				[ 'Open', 'Tuesday to Sunday, from 17:00' ],
				[ 'Find us', 'Harbour Lane 12, Old Port' ],
				[ 'Reservations', PHONE ],
			].map( ( [ name, value ] ) => column( { spacing: 6, align: 'center' }, [ label( name, { align: 'center' } ), fact( value, { align: 'center', size: 18 } ) ] ) ) ),
		] ),

		section( { top: 128, spacing: 0 }, [
			row( { spacing: 88, align: 'center', tablet: 'column' }, [
				column( { width: 44, more: { width_tablet: percent( 100 ) } }, [ image( 'oven' ) ] ),
				column( { width: 56, spacing: 22, more: { width_tablet: percent( 100 ) } }, [
					label( 'Our kitchen' ),
					ornament( 'left' ),
					heading( 'Everything passes through the <em>fire</em>' ),
					text( '<p>There is one oven and no gas line. Bread, vegetables, fish and meat all take their turn over the same embers, which is why the menu is short and why the room smells the way it does.</p><p>We buy from eleven growers and one fishing boat, and we write the menu after they have told us what they have.</p>' ),
					button( 'Our story', page( 'story' ), { more: outline } ),
				] ),
			] ),
		] ),

		section( { background: C.char, spacing: 56 }, [
			intro( 'From the menu', 'Four dishes people come back for' ),
			grid( { columns: 4, tablet: 2, spacing: 32 }, signature.map( ( [ uid, name, price, description ] ) =>
				column( { spacing: 14 }, [ image( uid ), leader( name, price ), text( `<p>${ description }</p>`, { size: px( 16 ) } ) ] ) ) ),
			column( { align: 'center' }, [ button( 'See the full menu', page( 'menu' ), { more: { align: 'center' } } ) ] ),
		] ),

		pictured( 'room', { top: 152, veil: 0.7 }, [
			column( { width: 60, spacing: 22, align: 'center', more: { _flex_align_self: 'center' } }, [
				label( 'Reservations', { align: 'center', color: C.cream } ),
				heading( 'A table for <em>tonight</em>?', { align: 'center' } ),
				text( '<p>We hold half the room for walk-ins. For the other half, call us or send a line, and we will confirm the same day.</p>', { align: 'center', color: C.cream, size: px( 19 ) } ),
				row( { spacing: 16, justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content_mobile: 'center', flex_align_items_mobile: 'center' } }, [ button( 'How to book', page( 'reservations' ) ), button( `Call ${ PHONE }`, TEL, { more: outline } ) ] ),
			] ),
		] ),

		section( { top: 128, spacing: 0 }, [
			row( { spacing: 88, align: 'center', tablet: 'column' }, [
				column( { width: 50, spacing: 22, more: { width_tablet: percent( 100 ) } }, [
					label( 'Private events' ),
					ornament( 'left' ),
					heading( 'The long table seats <em>fourteen</em>' ),
					text( '<p>Birthdays, rehearsal dinners, the evening after the conference. One table, one menu cooked for everyone at once, and the room to yourselves.</p>' ),
					button( 'Plan an evening', page( 'private-events' ), { more: outline } ),
				] ),
				column( { width: 50, more: { width_tablet: percent( 100 ) } }, [ image( 'long-table' ) ] ),
			] ),
		] ),

		section( { background: C.forest, top: 112, spacing: 24 }, [
			column( { width: 70, spacing: 24, align: 'center', more: { _flex_align_self: 'center' } }, [
				heading( '“The best thing I ate this year was a leek. I have thought about it every week since.”', { tag: 'p', align: 'center', size: fluid( 'clamp(1.75rem, 1.2rem + 2.4vw, 3rem)' ), more: { typography_font_style: 'italic', typography_line_height: em( 1.2 ) } } ),
				label( 'The Harbour Gazette. A sample quote', { align: 'center' } ),
			] ),
		] ),
	],
};

pages.menu = {
	title: 'Menu',
	content: [
		pageHero( 'Dinner', 'The <em>menu</em>', 'Written each Tuesday, after the growers have called. Dishes are made to share and arrive when they are ready.' ),
		course( 'To start', 'Small plates', [
			[ 'Oven flatbread', '13', 'Rocket, tomato, black olives, cured ham' ],
			[ 'Charred leeks', '14', 'Romesco, toasted hazelnut, burnt butter' ],
			[ 'Ember-roast squash soup', '10', 'Crème fraîche, toasted seeds' ],
			[ 'Cured trout', '15', 'Shaved fennel, dill, crisp leaves' ],
			[ 'House bread and cultured butter', '6', 'Baked at four in the afternoon' ],
			[ 'Burrata', '13', 'Grilled peach, basil, olive oil' ],
		], { background: C.char } ),
		course( 'Main', 'From the fire', [
			[ 'Beef over oak', '29', 'Rosemary, soft egg, chopped tomato' ],
			[ 'Whole sea bream', '32', 'Lemon, fennel, brown butter. For two' ],
			[ 'Half chicken', '24', 'Brined two days, harissa, yoghurt' ],
			[ 'Celeriac steak', '21', 'Hazelnut crust, mushroom jus' ],
		] ),
		course( 'With it', 'On the side', [
			[ 'Ember-roast potatoes', '7', 'Garlic, rosemary' ],
			[ 'Grilled hispi cabbage', '8', 'Anchovy butter' ],
			[ 'Bitter leaves', '7', 'Mustard dressing' ],
			[ 'Charred carrots', '8', 'Honey, cumin, labneh' ],
		], { background: C.char } ),
		course( 'To finish', 'Dessert and cheese', [
			[ 'Warm sponge pudding', '11', 'Berries, cream poured at the table' ],
			[ 'Chocolate and rye tart', '10', 'Sea salt, crème fraîche' ],
			[ 'Roast pear', '9', 'Brown sugar, vanilla ice cream' ],
			[ 'Three cheeses', '14', 'From the region, with quince' ],
		] ),
		section( { background: C.forest, top: 96, spacing: 28 }, [
			column( { width: 62, spacing: 20, align: 'center', more: { _flex_align_self: 'center' } }, [
				label( 'For the whole table', { align: 'center' } ),
				heading( 'The kitchen’s menu, <em>five courses</em>', { align: 'center' } ),
				text( '<p>Leave it to us. Five courses chosen that evening, 68 per person, with wines to match for 42. Please tell us about allergies when you book; the kitchen can adapt most dishes.</p>', { align: 'center', color: C.cream } ),
				button( 'Reserve a table', page( 'reservations' ), { more: { align: 'center' } } ),
			] ),
		] ),
	],
};

pages.story = {
	title: 'Our Story',
	slug: 'our-story',
	content: [
		pageHero( 'Our story', 'A restaurant built around one <em>oven</em>', 'Ember & Rye opened in 2017 in a former sail loft. The oven went in first, and everything else was arranged around it.' ),
		section( { top: 0, bottom: 112, spacing: 0 }, [ image( 'room' ) ] ),
		section( { top: 0, bottom: 112, spacing: 0 }, [
			row( { spacing: 88, align: 'center', tablet: 'column' }, [
				column( { width: 54, spacing: 22, more: { width_tablet: percent( 100 ) } }, [
					label( 'How it started' ),
					ornament( 'left' ),
					heading( 'Two cooks and a pile of <em>bricks</em>' ),
					text( '<p>Ines Marlow and Tobias Reyes met on the line of a hotel kitchen and spent their days off building ovens in friends\' gardens. When the sail loft came up for rent, they laid the bricks themselves over one winter.</p><p>The first menu had six dishes, because that was how many the oven could hold. It has twelve now. The rule is the same: if it cannot go near the fire, it is not on the menu.</p>' ),
				] ),
				column( { width: 46, more: { width_tablet: percent( 100 ) } }, [ image( 'oven' ) ] ),
			] ),
		] ),
		section( { background: C.char, spacing: 56 }, [
			intro( 'The people', 'Who you will meet' ),
			grid( { columns: 2, tablet: 2, spacing: 48, more: { width: percent( 76 ), width_tablet: percent( 100 ), _flex_align_self: 'center' } }, [
				[ 'chef', 'Ines Marlow', 'Chef and co-owner', 'Runs the fire. Trained in Lyon and San Sebastián, and still does the bread herself.' ],
				[ 'host', 'Tobias Reyes', 'Front of house and cellar', 'Looks after the room and the wine list. Will remember what you drank last time.' ],
			].map( ( [ uid, name, role, body ] ) => column( { spacing: 12 }, [ image( uid ), heading( name, { tag: 'h3', size: fluid( 'clamp(1.5rem, 1.3rem + 0.8vw, 2rem)' ) } ), label( role ), text( `<p>${ body }</p>` ) ] ) ) ),
		] ),
		section( { spacing: 48 }, [
			intro( 'Where it comes from', 'Eleven growers and one boat', 'We name them because they do half the work.' ),
			grid( { columns: 3, tablet: 2, spacing: 0, more: { grid_gaps: { unit: 'px', size: 0, column: '48', row: '0', isLinked: false } } }, [
				[ 'Vegetables', 'Hollow Farm, Westbrook' ], [ 'Leeks and brassicas', 'The Tully family, Marsh End' ], [ 'Fish', 'The boat “Margit”, Old Port' ],
				[ 'Beef and chicken', 'Ridgeway Pastures' ], [ 'Flour', 'Calder Mill' ], [ 'Cheese', 'Three dairies within an hour' ],
			].map( ( [ what, who ] ) => ruled( [ label( what ), fact( who, { size: 19 } ) ], { spacing: 6 } ) ) ),
		] ),
	],
};

pages.reservations = {
	title: 'Reservations',
	content: [
		pageHero( 'Reservations', 'Book a <em>table</em>', 'By telephone or by email. We answer both ourselves and confirm on the same day.' ),
		section( { top: 0, bottom: 112, spacing: 0 }, [
			row( { spacing: 88, align: 'flex-start', tablet: 'column' }, [
				column( { width: 50, spacing: 0, more: { width_tablet: percent( 100 ) } }, [
					ruled( [ label( 'Telephone, from 14:00' ), heading( PHONE, { tag: 'p', size: fluid( 'clamp(1.75rem, 1.3rem + 2vw, 2.75rem)' ), more: { link: link( TEL ) } } ) ] ),
					ruled( [ label( 'Email' ), heading( EMAIL, { tag: 'p', size: fluid( 'clamp(1.75rem, 1.3rem + 2vw, 2.75rem)' ), more: { link: link( `mailto:${ EMAIL }` ) } } ) ] ),
					ruled( [ text( '<p>Tell us the date, the time, how many you are and anything the kitchen should know. Tables are held for fifteen minutes.</p>' ), row( { spacing: 16, more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Call to book', TEL ), button( 'Send an email', `mailto:${ EMAIL }?subject=Reservation`, { more: outline } ) ] ) ], { spacing: 22 } ),
				] ),
				column( { width: 50, more: { width_tablet: percent( 100 ) } }, [
					container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 26 ), padding: box( 44 ), padding_mobile: box( 26 ), background_background: 'classic', background_color: C.char, border_border: 'solid', border_width: box( 1 ), border_color: C.line }, [
						column( { spacing: 12 }, [ label( 'Opening hours' ), heading( 'When we are open', { tag: 'h2', size: fluid( 'clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)' ) } ) ] ),
						hoursList(),
						text( '<p>The kitchen closes one hour before the room. Half the tables are kept for walk-ins every evening.</p>', { size: px( 16 ) } ),
					] ),
				] ),
			] ),
		] ),
		section( { background: C.char, spacing: 48 }, [
			intro( 'Good to know', 'Before you come' ),
			grid( { columns: 3, spacing: 48 }, [
				[ 'Groups', 'Up to eight at an ordinary table. From nine to fourteen, ask for the long table and a set menu.' ],
				[ 'Allergies and diets', 'Tell us when you book. Most dishes can be adapted; the kitchen handles nuts, gluten and dairy.' ],
				[ 'Changes', 'Plans change. Let us know by 15:00 on the day and there is nothing to pay.' ],
			].map( ( [ title, body ] ) => ruled( [ heading( title, { tag: 'h3', size: fluid( 'clamp(1.5rem, 1.3rem + 0.8vw, 2rem)' ) } ), text( `<p>${ body }</p>` ) ], { bottom: 0 } ) ) ),
		] ),
	],
};

pages[ 'private-events' ] = {
	title: 'Private Events',
	content: [
		pageHero( 'Private events', 'The room, the fire and the table to <em>yourselves</em>', 'For eight to forty guests, with a menu written for the evening.' ),
		section( { top: 0, bottom: 112, spacing: 96 }, [
			row( { spacing: 72, align: 'center', tablet: 'column' }, [
				column( { width: 56, more: { width_tablet: percent( 100 ) } }, [ image( 'long-table' ) ] ),
				column( { width: 44, spacing: 18, more: { width_tablet: percent( 100 ) } }, [ label( 'Seated, 8 to 14 guests' ), heading( 'The long table' ), text( '<p>One oak table in the back room, beside the oven. Five courses served on platters, family style, with wine chosen to match.</p>' ), fact( 'From 85 per person', { color: C.ember, weight: 500 } ) ] ),
			] ),
			row( { spacing: 72, align: 'center', tablet: 'column' }, [
				column( { width: 44, spacing: 18, more: { width_tablet: percent( 100 ) } }, [ label( 'Standing, up to 40 guests' ), heading( 'The bar' ), text( '<p>The front room and the bar for a reception. Flatbreads and small plates from the fire, cocktails and a short list of wine.</p>' ), fact( 'From 55 per person', { color: C.ember, weight: 500 } ) ] ),
				column( { width: 56, more: { width_tablet: percent( 100 ) } }, [ image( 'bar' ) ] ),
			] ),
		] ),
		section( { background: C.char, spacing: 48 }, [
			intro( 'How it works', 'Three steps to an evening' ),
			grid( { columns: 3, spacing: 48 }, [
				[ 'Write to us', 'A date, a number of guests and the occasion. We reply within a day with what is possible.' ],
				[ 'Choose the menu', 'Ines proposes a menu for the season. You can change anything, and we plan around allergies.' ],
				[ 'Arrive', 'The table is laid and the fire is lit. A deposit of 20% holds the date; the rest is paid on the night.' ],
			].map( ( [ title, body ], index ) => ruled( [ label( 'Step ' + ( index + 1 ) ), heading( title, { tag: 'h3', size: fluid( 'clamp(1.5rem, 1.3rem + 0.8vw, 2rem)' ) } ), text( `<p>${ body }</p>` ) ], { bottom: 0 } ) ) ),
		] ),
		section( { top: 112, spacing: 24 }, [
			column( { width: 62, spacing: 22, align: 'center', more: { _flex_align_self: 'center' } }, [
				heading( 'Tell us about your <em>evening</em>', { align: 'center' } ),
				text( `<p>Write to ${ EMAIL } or call ${ PHONE }. Tobias answers every enquiry himself.</p>`, { align: 'center' } ),
				row( { spacing: 16, justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content_mobile: 'center', flex_align_items_mobile: 'center' } }, [ button( 'Send an enquiry', `mailto:${ EMAIL }?subject=Private%20event` ), button( 'Call us', TEL, { more: outline } ) ] ),
			] ),
		] ),
	],
};

/** A picture that opens large when it is clicked. */
const shot = ( uid ) => image( uid, { more: { link_to: 'file', open_lightbox: 'yes' } } );

pages.gallery = {
	title: 'Gallery',
	content: [
		pageHero( 'Gallery', 'The room, the fire, the <em>plates</em>', null ),
		section( { top: 0, bottom: 128, spacing: 0 }, [
			row( { spacing: 24, align: 'flex-start', tablet: 'row' }, [
				column( { width: 33.33, spacing: 24 }, [ 'oven', 'dish-flatbread', 'bar' ].map( shot ) ),
				column( { width: 33.33, spacing: 24 }, [ 'dish-leeks', 'room', 'cocktail', 'long-table' ].map( shot ) ),
				column( { width: 33.33, spacing: 24 }, [ 'bread', 'dish-steak', 'dish-cheesecake' ].map( shot ) ),
			] ),
		] ),
	],
};

pages.contact = {
	title: 'Contact and Location',
	content: [
		pageHero( 'Contact and location', 'Harbour Lane 12, <em>Old Port</em>', 'Five minutes on foot from Central Station, at the end of the lane, under the brass lantern.' ),
		section( { top: 0, bottom: 112, spacing: 0 }, [
			grid( { columns: 3, tablet: 1, spacing: 48 }, [
				ruled( [ label( 'Find us' ), fact( 'Harbour Lane 12', { size: 20 } ), fact( 'Old Port, 20457', { size: 20 } ), text( '<p>Tram 4 and 7 to Fish Market. Parking at Quay Garage, three minutes away. Step-free entrance from the courtyard.</p>', { size: px( 16 ) } ) ], { bottom: 0 } ),
				ruled( [ label( 'Talk to us' ), fact( PHONE, { size: 20, more: { link: link( TEL ) } } ), fact( EMAIL, { size: 20, more: { link: link( `mailto:${ EMAIL }` ) } } ), text( '<p>The telephone is answered from 14:00 on the days we are open. Email is read every morning.</p>', { size: px( 16 ) } ) ], { bottom: 0 } ),
				ruled( [ label( 'Opening hours' ), hoursList() ], { bottom: 0, spacing: 16 } ),
			] ),
		] ),
		section( { top: 0, bottom: 128, spacing: 40 }, [
			image( 'room' ),
			column( { align: 'center' }, [ button( 'Reserve a table', page( 'reservations' ), { more: { align: 'center' } } ) ] ),
		] ),
	],
};

// The posts page: listed by the theme's blog template, so it has no Elementor content.
pages.journal = { title: 'Journal', plain: true };

/* -------------------------------------------------------------------------
   Header, footer and "page not found"
   ---------------------------------------------------------------------- */
const wordmark = ( size, more = {} ) => heading( 'Ember <em>&amp;</em> Rye', { tag: 'p', color: C.cream, size: px( size ), weight: 500, more: { link: link( page( 'home' ) ), typography_line_height: em( 1 ), ...more } } );

const parts = {
	header: {
		title: 'Header',
		location: 'header',
		content: [
			// One wrapping row: on a desktop the name sits between the hours and the
			// button and the menu takes a line of its own; on a phone only the name
			// and the theme's menu button remain, side by side.
			container(
				{
					content_width: 'boxed',
					flex_direction: 'row',
					flex_direction_mobile: 'row',
					flex_align_items: 'center',
					flex_justify_content: 'space-between',
					flex_wrap: 'wrap',
					flex_wrap_mobile: 'nowrap',
					flex_gap: { unit: 'px', size: 16, column: '24', row: '14', isLinked: false },
					padding: box( 22, 24, 0, 24 ),
					padding_mobile: box( 12, 20 ),
					background_background: 'classic',
					background_color: C.night,
					border_border: 'solid',
					border_width: box( 0, 0, 1, 0 ),
					border_color: C.line,
				},
				[
					fact( 'Open Tuesday to Sunday from 17:00', { color: C.bone, size: 14, more: { typography_letter_spacing: px( 0.6 ), hide_mobile: 'hidden-mobile', _element_width: 'initial', _element_custom_width: percent( 30 ) } } ),
					wordmark( 34, { align: 'center', align_mobile: 'left', _element_width: 'initial', _element_custom_width: percent( 34 ), _element_width_mobile: 'auto' } ),
					container( { content_width: 'full', width: percent( 30 ), flex_direction: 'row', flex_justify_content: 'flex-end', padding: box( 0 ), hide_mobile: 'hidden-mobile' }, [ button( 'Reserve', page( 'reservations' ), { more: { size: 'sm' } } ) ] ),
					widget( 'of-nav-menu', { align: 'center', color: C.cream, color_active: C.ember, typography_typography: 'custom', typography_font_family: SANS, typography_font_size: px( 14 ), typography_font_weight: '500', typography_text_transform: 'uppercase', typography_letter_spacing: px( 2 ), _element_width: 'initial', _element_custom_width: percent( 100 ), _element_width_mobile: 'auto', _padding: { unit: 'px', top: '6', right: '0', bottom: '10', left: '0', isLinked: false }, _padding_mobile: box( 0 ) } ),
				]
			),
		],
	},
	footer: {
		title: 'Footer',
		location: 'footer',
		content: [
			section( { background: C.char, top: 96, bottom: 36, spacing: 56, more: { border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.line } }, [
				column( { spacing: 14, align: 'center' }, [ heading( 'Ember <em>&amp;</em> Rye', { tag: 'p', color: C.cream, align: 'center', size: fluid( 'clamp(2.5rem, 1.8rem + 3vw, 4rem)' ), weight: 500, more: { typography_line_height: em( 1 ) } } ), label( 'Wood-fired kitchen and bar', { align: 'center' } ) ] ),
				grid( { columns: 3, tablet: 3, spacing: 40 }, [
					column( { spacing: 8, align: 'center' }, [ label( 'Visit', { align: 'center', color: C.bone } ), fact( 'Harbour Lane 12', { align: 'center' } ), fact( 'Old Port, 20457', { align: 'center' } ) ] ),
					column( { spacing: 8, align: 'center' }, [ label( 'Hours', { align: 'center', color: C.bone } ), fact( 'Tuesday to Saturday from 17:00', { align: 'center' } ), fact( 'Sunday from 12:30', { align: 'center' } ) ] ),
					column( { spacing: 8, align: 'center' }, [ label( 'Reservations', { align: 'center', color: C.bone } ), fact( PHONE, { align: 'center', more: { link: link( TEL ) } } ), fact( EMAIL, { align: 'center', more: { link: link( `mailto:${ EMAIL }` ) } } ) ] ),
				] ),
				ruled( [
					b.list( [ [ 'Menu', 'menu' ], [ 'Reservations', 'reservations' ], [ 'Private Events', 'private-events' ], [ 'Our Story', 'story' ], [ 'Gallery', 'gallery' ], [ 'Journal', 'journal' ], [ 'Contact', 'contact' ] ].map( ( [ title, name ] ) => ( { text: title, url: page( name ) } ) ), { color: C.bone, more: { view: 'inline', icon_align: 'center', icon_size: px( 0 ), text_indent: px( 0 ), space_between: px( 28 ), text_color_hover: C.ember, icon_typography_typography: 'custom', icon_typography_font_size: px( 14 ), icon_typography_text_transform: 'uppercase', icon_typography_letter_spacing: px( 2 ) } } ),
					fact( 'Sample content: Ember & Rye is a fictional restaurant made for the Open Frame Restaurant starter site. The dishes, prices, people and quote are examples to replace with your own.', { color: C.bone, size: 14, align: 'center' } ),
				], { top: 32, bottom: 0, spacing: 22 } ),
			] ),
		],
	},
	'not-found': {
		title: 'Page not found',
		location: '404',
		content: [
			section( { top: 144, bottom: 144, spacing: 0 }, [
				column( { width: 66, spacing: 22, align: 'center', more: { _flex_align_self: 'center' } }, [
					label( 'Error 404', { align: 'center' } ),
					ornament(),
					heading( 'This table is not on our <em>floor plan</em>', { tag: 'h1', align: 'center' } ),
					text( '<p>The page you asked for has moved or was never set. The menu and the reservations page are where they have always been.</p>', { align: 'center', size: px( 19 ) } ),
					row( { spacing: 16, justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content_mobile: 'center', flex_align_items_mobile: 'center' } }, [ button( 'Back to the home page', page( 'home' ) ), button( 'See the menu', page( 'menu' ), { more: outline } ) ] ),
				] ),
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
		{ _id: 'primary', title: 'Primary', color: C.ember },
		{ _id: 'secondary', title: 'Secondary', color: C.cream },
		{ _id: 'text', title: 'Text', color: C.bone },
		{ _id: 'accent', title: 'Accent', color: C.ember },
	],
	custom_colors: [
		{ _id: 'ofnight', title: 'Night', color: C.night },
		{ _id: 'ofchar', title: 'Char', color: C.char },
		{ _id: 'offorest', title: 'Forest', color: C.forest },
		{ _id: 'ofline', title: 'Line', color: C.line },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: SERIF, typography_font_weight: '500' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '500' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '500' },
	],
	container_width: px( 1200 ),
	body_background_background: 'classic',
	body_background_color: C.night,
	body_color: C.bone,
	...sansType( 'body', { fontSize: px( 18 ), weight: 400, lineHeight: 1.7 } ),
	link_normal_color: C.ember,
	link_hover_color: C.emberLight,
	h1_color: C.cream,
	...serifType( 'h1', { fontSize: fluid( 'clamp(2.75rem, 1.3rem + 6.4vw, 6.25rem)' ), weight: 500, lineHeight: 1, spacing: -0.01 } ),
	h2_color: C.cream,
	...serifType( 'h2', { fontSize: fluid( 'clamp(2.125rem, 1.5rem + 2.8vw, 3.75rem)' ), weight: 500, lineHeight: 1.06, spacing: -0.005 } ),
	h3_color: C.cream,
	...serifType( 'h3', { fontSize: fluid( 'clamp(1.5rem, 1.3rem + 0.8vw, 2rem)' ), weight: 600, lineHeight: 1.15 } ),
	h4_color: C.cream,
	...sansType( 'h4', { fontSize: px( 17 ), weight: 500, lineHeight: 1.4 } ),
	...sansType( 'button', { fontSize: px( 14 ), weight: 500, lineHeight: 1.2, transform: 'uppercase', spacing: 0.14 } ),
	button_text_color: C.night,
	button_background_color: C.ember,
	button_hover_text_color: C.night,
	button_hover_background_color: C.cream,
	button_border_radius: box( 0 ),
	button_padding: box( 17, 30 ),
};

const themeMods = {
	open_frame_follow_elementor: true,
	open_frame_color_primary: C.ember.toLowerCase(),
	open_frame_color_primary_hover: C.emberLight.toLowerCase(),
	open_frame_color_heading: C.cream.toLowerCase(),
	open_frame_color_text: C.bone.toLowerCase(),
	open_frame_color_link: C.ember.toLowerCase(),
	open_frame_color_link_hover: C.emberLight.toLowerCase(),
	open_frame_color_accent: C.ember.toLowerCase(),
	open_frame_color_border: C.line.toLowerCase(),
	open_frame_color_bg: C.night.toLowerCase(),
	open_frame_color_surface: C.char.toLowerCase(),
	open_frame_container_width: 1200,
	open_frame_blog_style: 'grid',
	open_frame_blog_columns: 3,
	open_frame_blog_title: true,
	open_frame_blog_layout: 'full-width',
	open_frame_single_layout: 'no-sidebar',
	open_frame_page_layout: 'no-sidebar',
};

// The photographs, with where each came from (photos.json, written by tools/sites/photos.mjs).
// The hero lies under the headline and the article covers beside their titles: decoration, so no alt text.
const mediaIndex = photoIndex( OUT, { hero: '', host: 'Tobias Reyes behind the bar', ...Object.fromEntries( posts.map( ( post ) => [ post.image, '' ] ) ) } );

const fonts = [
	{ family: SERIF, weight: '300 700', style: 'normal', file: 'cormorant-garamond-latin.woff2', licence: 'OFL-1.1. Copyright 2015 The Cormorant Project Authors.' },
	{ family: SERIF, weight: '300 700', style: 'italic', file: 'cormorant-garamond-latin-italic.woff2', licence: 'OFL-1.1. Copyright 2015 The Cormorant Project Authors.' },
	{ family: SANS, weight: '100 900', style: 'normal', file: 'jost-latin.woff2', licence: 'OFL-1.1. Copyright 2020 The Jost Project Authors.' },
];

const used = writeSite( {
	site: SITE,
	out: OUT,
	pages,
	parts,
	posts,
	kit,
	themeMods,
	options: { show_on_front: 'page', page_on_front: page( 'home' ), page_for_posts: page( 'journal' ) },
	menus: [ { uid: 'primary', name: 'Primary', location: 'primary', items: [ [ 'Menu', 'menu' ], [ 'Reservations', 'reservations' ], [ 'Private Events', 'private-events' ], [ 'Our Story', 'story' ], [ 'Gallery', 'gallery' ], [ 'Journal', 'journal' ], [ 'Contact', 'contact' ] ].map( ( [ title, name ] ) => ( { title, url: page( name ) } ) ) } ],
	media: mediaIndex,
	fonts,
	catalog: {
		summary: 'A dark, candle-lit site for a restaurant: a full menu with prices, reservations by phone and email, private events, a gallery and a journal.',
		colors: [ C.night.toLowerCase(), C.ember.toLowerCase(), C.cream.toLowerCase() ],
		pages: [ 'Home', 'Menu', 'Our Story', 'Reservations', 'Private Events', 'Gallery', 'Journal (blog)', 'Single Post', 'Contact and Location', '404' ],
		screenshots: [ { title: 'Menu', file: 'menu.png' }, { title: 'Reservations', file: 'reservations.png' }, { title: 'Our story', file: 'story.png' } ],
		requires: { importer: '0.4.0' },
	},
} );

console.log( `Restaurant: ${ Object.keys( pages ).length } pages, ${ Object.keys( parts ).length } site parts, ${ posts.length } posts. Widgets: ${ used.join( ', ' ) }` );
