#!/usr/bin/env node
/**
 * The SaaS starter site ("Loop", a customer feedback tool), written as data.
 * A design of the Pro tier: its header, footer, blog and "page not found"
 * layouts are Elementor Pro Theme Builder templates, and it uses Pro widgets.
 *
 *   node tools/sites/saas.mjs
 *
 * Writes starter-sites/saas/{site.json, site/, content/, media/index.json,
 * fonts/index.json}. The images come from tools/sites/saas-art.mjs. See
 * brief.md in the site folder for the design decisions this file implements.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks, box, builders, dynamic, em, fluid, gap, icon, ids, kitTypography, link, menu, page, percent, px, writeSite } from './kit.mjs';

const SITE = 'saas';
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', SITE );

/* -------------------------------------------------------------------------
   Design tokens (see brief.md)
   ---------------------------------------------------------------------- */
const C = {
	ink: '#0E1320',
	night: '#161C2E',
	text: '#4A5165',
	white: '#FFFFFF',
	mist: '#F5F6FA',
	line: '#E4E7EF',
	pink: '#FF4D8D',
	orange: '#FF8A3D',
	rose: '#C81E5B', // The pink, dark enough for text on white.
	haze: '#B6BCCB', // Text on ink.
	blush: '#FFE3EC',
	peach: '#FFEBD9',
	lilac: '#ECE7FF',
};
const DISPLAY = 'Sora';
const SANS = 'DM Sans';
const EMAIL = 'hello@example.com';

const b = builders( ids() );
const { row, column, grid, text, list, counter, container, widget } = b;

/* -------------------------------------------------------------------------
   Components of this design
   ---------------------------------------------------------------------- */
const section = ( options, elements ) => b.section( { top: 112, ...options }, elements );
const sans = { typography_typography: 'custom', typography_font_family: SANS };
const softShadow = { box_shadow_box_shadow_type: 'yes', box_shadow_box_shadow: { horizontal: 0, vertical: 24, blur: 60, spread: 0, color: 'rgba(14,19,32,0.10)' } };
/** The warm gradient of the brand, as a background. */
const gradient = ( angle = 120 ) => ( { background_background: 'gradient', background_color: C.pink, background_color_b: C.orange, background_gradient_angle: { unit: 'deg', size: angle, sizes: [] } } );

const heading = ( title, options = {} ) => b.heading( title, options );

const fact = ( title, { color = C.ink, size = 17, weight = 500, align, more = {} } = {} ) =>
	b.heading( title, { tag: 'p', color, align, more: { ...sans, typography_font_size: px( size ), typography_font_weight: String( weight ), typography_line_height: em( 1.45 ), ...more } } );

/** A small pill above a heading. */
const pill = ( title, { background = C.blush, color = C.rose, align } = {} ) =>
	fact( title, { color, size: 14, weight: 700, align, more: { _element_width: 'auto', _background_background: 'classic', _background_color: background, _padding: box( 7, 14 ), _border_radius: box( 999 ), _flex_size: 'none' } } );

const intro = ( name, title, lead, { tag = 'h2', align = 'center', width = 62, dark = false } = {} ) =>
	column( { width, spacing: 16, ...( align === 'center' ? { align: 'center', more: { _flex_align_self: 'center' } } : { more: { flex_align_items: 'flex-start' } } ) }, [
		pill( name, dark ? { background: '#2A2238', color: '#FF9EC0', align } : { align } ),
		heading( title, { tag, align, ...( dark ? { color: C.white } : {} ) } ),
		...( lead ? [ text( `<p>${ lead }</p>`, { align, size: px( 19 ), ...( dark ? { color: C.haze } : {} ) } ) ] : [] ),
	] );

/** Plain buttons are ink, from the Primary color of Site Settings. */
const button = ( title, url, options = {} ) => b.button( title, url, options );
const ghost = { background_color: 'transparent', button_text_color: C.ink, border_border: 'solid', border_width: box( 1.5 ), border_color: C.line, hover_color: C.ink, button_background_hover_color: C.mist, button_hover_border_color: C.ink };
const onInk = { background_color: C.white, button_text_color: C.ink, hover_color: C.ink, button_background_hover_color: C.blush };
const ghostOnInk = { background_color: 'transparent', button_text_color: C.white, border_border: 'solid', border_width: box( 1.5 ), border_color: '#3A4258', hover_color: C.ink, button_background_hover_color: C.white, button_hover_border_color: C.white };
const arrow = ( title, url ) => button( title, url, { more: { background_color: 'transparent', button_background_hover_color: 'transparent', button_text_color: C.rose, hover_color: C.ink, selected_icon: icon( 'arrow-right' ), icon_align: 'row-reverse', icon_indent: px( 8 ), text_padding: box( 0 ), _flex_size: 'none' } } );

const image = ( uid, { radius = 20, shadow = false, more = {} } = {} ) => b.image( uid, { radius, more: { ...( shadow ? { image_box_shadow_box_shadow_type: 'yes', image_box_shadow_box_shadow: { horizontal: 0, vertical: 30, blur: 70, spread: 0, color: 'rgba(14,19,32,0.18)' } } : {} ), ...more } } );

/** A card: white with a hairline, or tinted. */
const card = ( elements, { background = C.white, padding = 32, spacing = 14, shadow = false, more = {} } = {} ) =>
	container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( spacing ), padding: box( padding ), padding_mobile: box( 24 ), background_background: 'classic', background_color: background, border_radius: box( 20 ), ...( background === C.white ? { border_border: 'solid', border_width: box( 1 ), border_color: C.line } : {} ), ...( shadow ? softShadow : {} ), ...more }, elements );

/** A feature: a picture of the product in a tinted card, with a title and a sentence. */
const feature = ( uid, tint, title, body, url, tag = 'h3' ) =>
	card( [ image( uid, { radius: 14 } ), column( { spacing: 10, more: { padding: box( 8, 8, 8, 8 ) } }, [ heading( title, { tag, ...( tag === 'h3' ? {} : { size: fluid( 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)' ) } ) } ), text( `<p>${ body }</p>` ), ...( url ? [ arrow( 'How it works', url ) ] : [] ) ] ) ], { background: tint, padding: 16, spacing: 12 } );

/** The top of an inner page: centered, on white. */
const pageHero = ( name, title, lead, extra = [] ) => section( { top: 96, bottom: 72, spacing: 28 }, [ intro( name, title, lead, { tag: 'h1', width: 70 } ), ...extra ] );

/** The closing band: the gradient, with ink text. */
const tryIt = () =>
	section( { top: 0, bottom: 112, spacing: 0 }, [
		container( { content_width: 'full', flex_direction: 'column', flex_align_items: 'center', flex_gap: gap( 22 ), padding: box( 80, 40 ), padding_mobile: box( 48, 24 ), border_radius: box( 28 ), ...gradient() }, [
			heading( 'Hear your customers by Friday', { align: 'center', color: C.ink } ),
			text( '<p>Connect your support inbox and Loop sorts the last ninety days of feedback while you make coffee. Free for fourteen days, no card.</p>', { align: 'center', color: C.ink, size: px( 19 ), more: { _element_width: 'initial', _element_custom_width: percent( 60 ), _element_custom_width_mobile: percent( 100 ) } } ),
			row( { spacing: 14, justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content_mobile: 'center', flex_align_items_mobile: 'center' } }, [ button( 'Start a free trial', page( 'pricing' ) ), button( 'Book a demo', page( 'contact' ), { more: { background_color: 'transparent', button_text_color: C.ink, border_border: 'solid', border_width: box( 1.5 ), border_color: C.ink, hover_color: C.white, button_background_hover_color: C.ink } } ) ] ),
		] ),
	] );

/* -------------------------------------------------------------------------
   Content
   ---------------------------------------------------------------------- */
const features = [
	[ 'app-inbox', C.blush, 'One inbox for everything customers say', 'Email, chat, reviews and call notes arrive in one list, already tagged by topic.' ],
	[ 'app-trends', C.peach, 'See what is rising before it is loud', 'Loop groups similar requests and shows which themes grew this month, and for whom.' ],
	[ 'app-roadmap', C.lilac, 'A roadmap with the evidence attached', 'Every item links to the customers who asked for it, so prioritising stops being a debate.' ],
];

const plans = [
	{ name: 'Starter', price: '29', note: 'For a first product and a small team.', items: [ '2 seats', '1,000 pieces of feedback a month', 'Email and chat sources', '30 days of history' ], cta: 'Start free' },
	{ name: 'Team', price: '89', note: 'For product teams that ship every week.', items: [ '10 seats', '10,000 pieces of feedback a month', 'All sources and integrations', 'Trends and roadmap', 'Unlimited history' ], cta: 'Start free', featured: true },
	{ name: 'Scale', price: '249', note: 'For several products and a support organisation.', items: [ 'Unlimited seats', '100,000 pieces of feedback a month', 'Single sign-on', 'Audit log', 'A named contact' ], cta: 'Talk to us' },
];

const posts = [
	{
		name: 'counting-requests-is-not-prioritising',
		title: 'Counting requests is not prioritising',
		excerpt: 'The feature with the most votes is rarely the one to build next. What to look at instead of the count.',
		image: 'blog-1',
		category: 'Product',
		days: 5,
		content: [
			blocks.paragraph( 'The feature with the most votes is rarely the one to build next. Votes measure how many people noticed a gap, not how much it costs them, and not whether they are the customers you want more of.' ),
			blocks.heading( 'Three questions beside the count' ),
			blocks.list( [ 'Who is asking: new accounts, or the ones about to renew?', 'What do they do today instead?', 'What happens if we never build it?' ] ),
			blocks.heading( 'A small example' ),
			blocks.paragraph( 'One team found that "export to CSV" had forty requests and "faster search" had twelve. The twelve came from their eight largest accounts. They built search first, and the export requests fell by half, because people had been exporting in order to search.' ),
			blocks.paragraph( `Loop shows who is behind every theme. <a href="${ page( 'feature' ) }">See how the inbox works</a>.` ),
		],
	},
	{
		name: 'reading-ninety-days-of-support',
		title: 'What we learned reading ninety days of our own support inbox',
		excerpt: 'Before building Loop we read 4,100 messages by hand. Four things surprised us.',
		image: 'blog-2',
		category: 'Company',
		days: 19,
		content: [
			blocks.paragraph( 'Before building Loop we read 4,100 of our own support messages by hand, with a spreadsheet and too much coffee. It took two people three weeks.' ),
			blocks.heading( 'What surprised us' ),
			blocks.paragraph( 'A third of all messages were about four things. Customers rarely named a feature; they described a morning that went wrong. And the loudest requests in our planning meetings barely appeared at all.' ),
			blocks.quote( 'Nobody asked for a dashboard. Forty people asked how to answer their manager\'s question by Monday.' ),
			blocks.heading( 'Why this became a product' ),
			blocks.paragraph( 'Reading everything worked, and nobody can afford to do it every quarter. Loop is the reading, done every day.' ),
		],
	},
	{
		name: 'closing-the-loop',
		title: 'Closing the loop: telling customers what happened to their idea',
		excerpt: 'People forgive a no. They do not forgive silence. A simple routine for answering every request, eventually.',
		image: 'blog-3',
		category: 'Product',
		days: 33,
		content: [
			blocks.paragraph( 'People forgive a no. They do not forgive silence. Most feedback tools are good at collecting requests and bad at the second half: telling the person what became of theirs.' ),
			blocks.heading( 'A routine that takes ten minutes a week' ),
			blocks.list( [ 'When something ships, write to everyone who asked for it', 'When something is declined, say so, with one sentence of why', 'Once a quarter, publish what changed because of feedback' ] ),
			blocks.paragraph( 'The first of these is the cheapest marketing a product team will ever do.' ),
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
		section( { background: C.ink, top: 104, bottom: 0, spacing: 56, more: { background_background: 'gradient', background_color: C.ink, background_color_b: '#2A1830', background_gradient_type: 'radial', background_gradient_position: 'top center' } }, [
			column( { width: 78, spacing: 24, align: 'center', more: { _flex_align_self: 'center' } }, [
				pill( 'New: themes that find themselves', { background: '#2A2238', color: '#FF9EC0', align: 'center' } ),
				heading( 'Know what your customers are asking for', { tag: 'h1', align: 'center', color: C.white } ),
				text( '<p>Loop reads every email, chat and review, sorts them by topic and shows you what is rising. No tagging, no spreadsheets, no guessing in the planning meeting.</p>', { align: 'center', size: px( 20 ), color: C.haze } ),
				row( { spacing: 14, justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content_mobile: 'center', flex_align_items_mobile: 'center' } }, [ button( 'Start a free trial', page( 'pricing' ), { more: onInk } ), button( 'Book a demo', page( 'contact' ), { more: ghostOnInk } ) ] ),
				fact( 'Free for 14 days. No credit card.', { color: C.haze, size: 15, align: 'center' } ),
			] ),
			image( 'app-dashboard', { radius: 0, more: { image_border_radius: { unit: 'px', top: '24', right: '24', bottom: '0', left: '0', isLinked: false } } } ),
		] ),

		section( { top: 56, bottom: 56, spacing: 20 }, [
			fact( 'Product teams at these companies read their customers with Loop', { color: C.text, size: 15, align: 'center' } ),
			heading( 'northpost · driftline · fable&amp;co · quietly · harbor', { tag: 'p', align: 'center', color: '#667085', size: fluid( 'clamp(1.125rem, 0.9rem + 1vw, 1.625rem)' ), weight: 600 } ),
		] ),

		section( { top: 56, spacing: 56 }, [
			intro( 'What it does', 'From a pile of messages to a plan', 'Three screens, in the order you will use them on a Monday.' ),
			grid( { columns: 3, spacing: 24 }, features.map( ( [ uid, tint, title, body ] ) => feature( uid, tint, title, body, page( 'feature' ) ) ) ),
		] ),

		section( { background: C.mist, spacing: 56 }, [
			intro( 'How it starts', 'Useful on the first afternoon' ),
			grid( { columns: 3, spacing: 32 }, [
				[ 'Connect', 'Point Loop at your support inbox, your chat tool and your reviews. It takes about four minutes.' ],
				[ 'Let it read', 'The last ninety days are sorted into themes while you do something else.' ],
				[ 'Decide', 'Open Trends, see what grew, and take the three largest themes to your next planning meeting.' ],
			].map( ( [ title, body ], index ) => card( [ heading( String( index + 1 ), { tag: 'p', color: C.rose, size: px( 40 ), more: { typography_line_height: em( 1 ) } } ), heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { spacing: 12 } ) ) ),
		] ),

		section( { spacing: 0 }, [
			grid( { columns: 4, tablet: 2, spacing: 24, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, [
				[ 92, 'of messages sorted without a human', { suffix: '%' } ],
				[ 4, 'minutes to connect a source' ],
				[ 1200, 'product teams', { suffix: '+' } ],
				[ 14, 'days free, with everything' ],
			].map( ( [ number, title, extra = {} ] ) => counter( number, title, { color: C.ink, titleColor: C.text, weight: 600, ...extra } ) ) ),
		] ),

		section( { background: C.ink, spacing: 56 }, [
			intro( 'Customers', 'Teams that stopped guessing', null, { dark: true } ),
			grid( { columns: 3, spacing: 24 }, [
				[ '“We cancelled the quarterly feedback review. Loop is the review, and it is finished every morning.”', 'Maya Lindström', 'Head of product, Northpost' ],
				[ '“It found a billing problem that forty customers had described in forty different ways.”', 'Rafael Ortiz', 'Support lead, Driftline' ],
				[ '“For the first time, the roadmap argument was about customers and not about who spoke last.”', 'Hannah Weiss', 'Founder, Fable &amp; Co' ],
			].map( ( [ quote, name, role ] ) => card( [ heading( quote, { tag: 'p', color: C.white, size: px( 19 ), weight: 500, more: { ...sans, typography_line_height: em( 1.5 ) } } ), column( { spacing: 2 }, [ fact( name, { color: C.white, size: 16, weight: 700 } ), fact( role, { color: C.haze, size: 15 } ) ] ) ], { background: C.night, spacing: 22 } ) ) ),
			column( { align: 'center' }, [ button( 'Read their stories', page( 'customers' ), { more: { ...ghostOnInk, align: 'center' } } ) ] ),
		] ),

		section( { spacing: 56 }, [
			intro( 'From the blog', 'Notes on listening to customers' ),
			widget( 'posts', { classic_columns: '3', classic_columns_tablet: '2', classic_columns_mobile: '1', classic_posts_per_page: 3, classic_show_excerpt: 'yes', classic_excerpt_length: 18, classic_meta_data: [ 'date' ], classic_show_read_more: '', classic_title_tag: 'h3', classic_item_ratio: { unit: 'px', size: 0.56, sizes: [] }, classic_img_border_radius: box( 16 ), classic_title_color: C.ink, classic_excerpt_color: C.text, classic_meta_color: C.text, classic_row_gap: px( 40 ), classic_column_gap: px( 28 ), pagination_type: '' } ),
		] ),

		tryIt(),
	],
};

pages.features = {
	title: 'Features',
	content: [
		pageHero( 'Features', 'Everything between "a customer said" and "we shipped it"', 'Loop does the reading and the sorting. You do the deciding.' ),
		section( { top: 0, bottom: 112, spacing: 0 }, [ grid( { columns: 3, spacing: 24 }, features.map( ( [ uid, tint, title, body ] ) => feature( uid, tint, title, body, page( 'feature' ), 'h2' ) ) ) ] ),
		section( { background: C.mist, spacing: 56 }, [
			intro( 'And the rest', 'Small things that add up' ),
			grid( { columns: 3, spacing: 24 }, [
				[ 'Themes that find themselves', 'No tag list to maintain. Loop proposes themes and learns from the ones you rename or merge.' ],
				[ 'Segments', 'Filter any view by plan, company size or how long a customer has been with you.' ],
				[ 'Reply from Loop', 'Tell everyone who asked for something that it shipped, in one message.' ],
				[ 'Weekly digest', 'The three largest changes of the week, in your inbox on Monday at nine.' ],
				[ 'Private by default', 'Customer messages are never used to train anything outside your account.' ],
				[ 'Export everything', 'Your feedback is yours. CSV and an API, on every plan.' ],
			].map( ( [ title, body ] ) => card( [ heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { spacing: 10 } ) ) ),
		] ),
		section( { spacing: 0 }, [ row( { spacing: 64, align: 'center', tablet: 'column' }, [ column( { width: 46, spacing: 18, more: { width_tablet: percent( 100 ), flex_align_items: 'flex-start' } }, [ pill( 'Integrations' ), heading( 'Works with the tools you already have' ), text( '<p>Loop reads from your support, chat and review tools and writes to your tracker. Nothing to migrate.</p>' ), arrow( 'See all integrations', page( 'integrations' ) ) ] ), column( { width: 54, more: { width_tablet: percent( 100 ) } }, [ image( 'integrations' ) ] ) ] ) ] ),
		tryIt(),
	],
};

pages.feature = {
	title: 'Inbox',
	slug: 'inbox',
	content: [
		pageHero( 'Feature', 'One inbox for everything customers say', 'Email, chat, reviews and call notes in one list, already sorted by topic when you open it.', [ row( { spacing: 14, justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content_mobile: 'center', flex_align_items_mobile: 'center' } }, [ button( 'Start a free trial', page( 'pricing' ) ), button( 'Book a demo', page( 'contact' ), { more: ghost } ) ] ) ] ),
		section( { top: 0, bottom: 112, spacing: 0 }, [ image( 'app-inbox', { radius: 28 } ) ] ),
		section( { spacing: 72 }, [
			...[
				[ 'Sorted before you read it', 'Every message gets a theme and a tone as it arrives. You can rename a theme once and Loop applies it to everything, past and future.', [ 'No tag list to maintain', 'Works in eleven languages', 'Learns from every correction' ], 'app-trends', false ],
				[ 'Who said it matters', 'Each message carries the customer\'s plan, size and age, pulled from your billing tool. Sort a theme by revenue, not by volume.', [ 'Segments by plan and size', 'Renewal dates on every account', 'Private notes for your team' ], 'app-roadmap', true ],
			].map( ( [ title, body, items, uid, flip ] ) => {
				const words = column( { width: 46, spacing: 18, more: { width_tablet: percent( 100 ) } }, [ heading( title ), text( `<p>${ body }</p>` ), list( items, { color: C.ink, iconColor: C.rose, iconName: 'check-circle' } ) ] );
				const picture = column( { width: 54, more: { width_tablet: percent( 100 ) } }, [ image( uid ) ] );
				return row( { spacing: 64, align: 'center', tablet: 'column' }, flip ? [ picture, words ] : [ words, picture ] );
			} ),
		] ),
		section( { background: C.mist, spacing: 40 }, [
			intro( 'Questions', 'Before you connect your inbox' ),
			grid( { columns: 2, tablet: 1, spacing: 24 }, [
				[ 'Does Loop answer customers?', 'No. It reads and sorts. Replies stay in the tools your support team already uses.' ],
				[ 'How long does setup take?', 'About four minutes per source. Sorting ninety days of history takes under an hour.' ],
				[ 'Which languages work?', 'Eleven today, including English, Spanish, German, French and Portuguese.' ],
				[ 'Can we leave?', 'Yes, with everything. Export is on every plan, and deleting an account deletes its data within thirty days.' ],
			].map( ( [ title, body ] ) => card( [ heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { spacing: 10 } ) ) ),
		] ),
		tryIt(),
	],
};

const plan = ( item ) =>
	widget( 'price-table', {
		heading: item.name,
		sub_heading: item.note,
		heading_tag: 'h2',
		currency_symbol: 'euro',
		price: item.price,
		currency_format: '',
		period: 'per month',
		features_list: item.items.map( ( entry, index ) => ( { _id: `${ item.name.toLowerCase() }${ index }`, item_text: entry, selected_item_icon: icon( 'check' ), item_icon_color: C.rose } ) ),
		button_text: item.cta,
		link: link( item.cta === 'Talk to us' ? page( 'contact' ) : page( 'contact' ) ),
		footer_additional_info: item.featured ? 'Most teams choose this one' : '',
		show_ribbon: item.featured ? 'yes' : '',
		ribbon_title: 'Popular',
		ribbon_bg_color: C.rose,
		ribbon_text_color: C.white,
		header_bg_color: item.featured ? C.ink : C.mist,
		heading_color: item.featured ? C.white : C.ink,
		sub_heading_color: item.featured ? C.haze : C.text,
		heading_typography_typography: 'custom',
		heading_typography_font_family: DISPLAY,
		heading_typography_font_size: px( 24 ),
		heading_typography_font_weight: '600',
		pricing_element_bg_color: C.white,
		price_color: C.ink,
		price_typography_typography: 'custom',
		price_typography_font_family: DISPLAY,
		price_typography_font_weight: '600',
		period_color: C.text,
		features_list_bg_color: C.white,
		features_list_color: C.ink,
		features_list_alignment: 'left',
		features_list_padding: box( 8, 32, 8, 32 ),
		footer_bg_color: C.white,
		button_text_color: item.featured ? C.white : C.ink,
		button_background_color: item.featured ? C.ink : C.mist,
		button_hover_color: C.white,
		button_background_hover_color: C.rose,
		button_border_radius: box( 12 ),
		additional_info_color: C.text,
		_border_border: 'solid',
		_border_width: box( 1 ),
		_border_color: item.featured ? C.ink : C.line,
		_border_radius: box( 20 ),
	} );

pages.pricing = {
	title: 'Pricing',
	content: [
		pageHero( 'Pricing', 'One price per team, not per message read', 'Every plan starts with fourteen days free, with everything switched on. No card until you decide.' ),
		section( { top: 0, bottom: 112, spacing: 0 }, [ grid( { columns: 3, tablet: 1, spacing: 24 }, plans.map( plan ) ) ] ),
		section( { top: 0, bottom: 112, spacing: 40 }, [
			intro( 'Good to know', 'The small print, in large print' ),
			grid( { columns: 3, spacing: 24 }, [
				[ 'What counts as a piece of feedback?', 'One message, review or call note from a customer. Replies from your own team do not count.' ],
				[ 'What if we go over?', 'Nothing is cut off. We write to you, and the plan moves up at the next invoice if it keeps happening.' ],
				[ 'Is there a yearly price?', 'Yes: two months free when you pay for a year. Ask for an invoice if you cannot pay by card.' ],
			].map( ( [ title, body ] ) => card( [ heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { background: C.mist, spacing: 10 } ) ) ),
		] ),
		tryIt(),
	],
};

pages.integrations = {
	title: 'Integrations',
	content: [
		pageHero( 'Integrations', 'Loop reads where your customers already write', 'Six sources today, and an API for the rest. Each takes a few minutes to connect.' ),
		section( { top: 0, bottom: 112, spacing: 0 }, [ image( 'integrations', { radius: 28 } ) ] ),
		section( { spacing: 0 }, [
			grid( { columns: 3, spacing: 24 }, [
				[ 'Mailbox', 'Shared support inboxes. Reads new messages as they arrive and the last ninety days on day one.' ],
				[ 'Chatly', 'Live chat transcripts, with the customer attached to each conversation.' ],
				[ 'Desk', 'Tickets and their internal notes, including tickets that are already closed.' ],
				[ 'Sheets', 'A spreadsheet of survey answers or call notes. Paste a link and choose the column.' ],
				[ 'Tracker', 'Send a theme to your issue tracker with every request attached. Status comes back to Loop.' ],
				[ 'Stores', 'Public reviews of your apps, read every night.' ],
			].map( ( [ title, body ] ) => card( [ heading( title, { tag: 'h2', size: fluid( 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)' ) } ), text( `<p>${ body }</p>` ) ], { spacing: 10 } ) ) ),
		] ),
		section( { top: 0, bottom: 112, spacing: 0 }, [ card( [ row( { spacing: 40, align: 'center', justify: 'space-between' }, [ column( { width: 64, spacing: 10 }, [ heading( 'Something we do not read yet?', { size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ) } ), text( '<p>The API accepts feedback from anywhere, and we add sources by request. Tell us what you use.</p>' ) ] ), button( 'Ask for a source', page( 'contact' ), { more: { _flex_size: 'none' } } ) ] ) ], { background: C.mist, padding: 44 } ) ] ),
		tryIt(),
	],
};

pages.customers = {
	title: 'Customers',
	content: [
		pageHero( 'Customers', 'What changed when teams started reading everything', 'Three companies, three different problems, one habit.' ),
		section( { top: 0, bottom: 112, spacing: 72 }, [
			...[
				[ 'customer-1', 'Northpost', 'Logistics software, 140 people', 'Found the feature behind a third of all churn', 'Northpost lost customers in their fourth month and did not know why. Loop grouped ninety days of cancellations and found that most mentioned the same missing report.', [ [ '31%', 'less churn in two quarters' ], [ '6 weeks', 'from finding to shipping' ] ], false ],
				[ 'customer-2', 'Driftline', 'Booking tool for surf schools, 12 people', 'A billing bug described in forty ways', 'Nobody wrote "billing bug". They wrote about a strange charge, a wrong date, an angry parent. Loop put the forty messages next to each other.', [ [ '40', 'tickets, one cause' ], [ '1 day', 'to find it' ] ], true ],
				[ 'customer-3', 'Fable & Co', 'Publishing platform, 60 people', 'A roadmap the whole company could read', 'Every item on the roadmap now shows who asked for it. Sales stopped promising dates, because they can see the queue.', [ [ '3×', 'more replies to "it shipped" emails' ], [ '0', 'roadmap meetings longer than an hour' ] ], false ],
			].map( ( [ uid, name, kind, title, body, figures, flip ] ) => {
				const words = column( { width: 52, spacing: 18, more: { width_tablet: percent( 100 ), flex_align_items: 'flex-start' } }, [ pill( kind ), heading( title ), text( `<p>${ body }</p>` ), grid( { columns: 2, tablet: 2, spacing: 24, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, figures.map( ( [ value, name2 ] ) => column( { spacing: 2 }, [ heading( value, { tag: 'p', size: px( 36 ), more: { typography_line_height: em( 1.1 ) } } ), fact( name2, { color: C.text, size: 15 } ) ] ) ) ) ] );
				const picture = column( { width: 48, more: { width_tablet: percent( 100 ) } }, [ image( uid ) ] );
				return row( { spacing: 64, align: 'center', tablet: 'column' }, flip ? [ words, picture ] : [ picture, words ] );
			} ),
		] ),
		tryIt(),
	],
};

pages.about = {
	title: 'About',
	content: [
		pageHero( 'About', 'We built Loop because we were tired of guessing', 'Nineteen people in Lisbon and Toronto, most of whom used to run support or product somewhere else.' ),
		section( { top: 0, bottom: 112, spacing: 0 }, [ image( 'team', { radius: 28 } ) ] ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 42, spacing: 16, more: { width_tablet: percent( 100 ), flex_align_items: 'flex-start' } }, [ pill( 'Our story' ), heading( 'It started with a spreadsheet' ) ] ),
				column( { width: 58, more: { width_tablet: percent( 100 ) } }, [ text( '<p>In 2021 two of us read 4,100 support messages by hand to settle an argument about what to build next. It took three weeks, and it settled the argument in an afternoon.</p><p>Every product team should be able to do that every week, without the three weeks. That is the whole company.</p><p>We are independent and profitable, and we intend to stay both. We answer our own support inbox, and yes, Loop reads it.</p>' ) ] ),
			] ),
		] ),
		section( { background: C.mist, spacing: 48 }, [
			intro( 'How we work', 'Three rules we try not to break' ),
			grid( { columns: 3, spacing: 24 }, [
				[ 'Your data is yours', 'We never train on customer messages outside your account, and export is free on every plan.' ],
				[ 'Small releases, every week', 'We ship on Tuesdays and write down what changed, in plain words.' ],
				[ 'A person answers', 'Support is done by the people who build the product, in turn.' ],
			].map( ( [ title, body ] ) => card( [ heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ], { spacing: 10 } ) ) ),
		] ),
		tryIt(),
	],
};

pages.contact = {
	title: 'Book a Demo',
	slug: 'demo',
	content: [
		section( { top: 96, spacing: 0 }, [
			row( { spacing: 72, align: 'flex-start', tablet: 'column' }, [
				column( { width: 46, spacing: 22, more: { width_tablet: percent( 100 ), flex_align_items: 'flex-start' } }, [
					pill( 'Book a demo' ),
					heading( 'Thirty minutes, with your own feedback', { tag: 'h1' } ),
					text( '<p>Send us a sample of your support inbox and we will show you what Loop makes of it. If it is not useful, you will know in half an hour.</p>', { size: px( 19 ) } ),
					list( [ 'A real person from our product team', 'Your data, not a canned example', 'No follow-up calls unless you ask' ], { color: C.ink, iconColor: C.rose, iconName: 'check-circle' } ),
					fact( `Prefer email? ${ EMAIL }`, { color: C.text, size: 16, more: { link: link( `mailto:${ EMAIL }` ) } } ),
				] ),
				column( { width: 54, more: { width_tablet: percent( 100 ) } }, [
					card( [
						heading( 'Tell us where to reach you', { tag: 'h2', size: fluid( 'clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)' ) } ),
						widget( 'form', {
							form_name: 'Demo request',
							form_fields: [
								{ _id: 'name', custom_id: 'name', field_type: 'text', field_label: 'Your name', placeholder: '', required: 'true', width: '50' },
								{ _id: 'email', custom_id: 'email', field_type: 'email', field_label: 'Work email', placeholder: '', required: 'true', width: '50' },
								{ _id: 'company', custom_id: 'company', field_type: 'text', field_label: 'Company', placeholder: '', width: '50' },
								{ _id: 'size', custom_id: 'size', field_type: 'select', field_label: 'Team size', field_options: '1 to 10\n11 to 50\n51 to 200\nMore than 200', width: '50' },
								{ _id: 'message', custom_id: 'message', field_type: 'textarea', field_label: 'Where does your feedback live today?', placeholder: '', width: '100', rows: 4 },
							],
							show_labels: 'true',
							mark_required: 'yes',
							button_text: 'Request a demo',
							button_width: '100',
							submit_actions: [ 'email' ],
							email_subject: 'New demo request',
							success_message: 'Thank you. We will write within one working day to find a time.',
							label_color: C.ink,
							field_text_color: C.ink,
							field_background_color: C.white,
							field_border_color: '#C9CEDB',
							field_border_width: box( 1 ),
							field_border_radius: box( 10 ),
							button_background_color: C.ink,
							button_text_color: C.white,
							button_background_hover_color: C.rose,
							button_hover_color: C.white,
							button_border_radius: box( 12 ),
							row_gap: px( 16 ),
							column_gap: px( 16 ),
						} ),
					], { padding: 40, spacing: 22, shadow: true } ),
				] ),
			] ),
		] ),
	],
};

/** A legal page: a table of contents beside the text. */
const legal = ( title, updated, sections ) => [
	section( { top: 96, bottom: 56, spacing: 16 }, [ column( { width: 70, spacing: 14, more: { flex_align_items: 'flex-start' } }, [ pill( 'Legal' ), heading( title, { tag: 'h1' } ), fact( `Last updated on ${ updated }. This is sample text for a fictional company, not legal advice.`, { color: C.text, size: 16 } ) ] ) ] ),
	section( { top: 0, bottom: 112, spacing: 0 }, [
		row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
			column( { width: 30, more: { width_tablet: percent( 100 ) } }, [ card( [ fact( 'On this page', { size: 15, weight: 700 } ), list( sections.map( ( [ name ] ) => ( { text: name, url: '#' + name.toLowerCase().replace( /[^a-z0-9]+/g, '-' ) } ) ), { color: C.text, more: { view: 'traditional', icon_size: px( 0 ), text_indent: px( 0 ), text_color_hover: C.rose, space_between: px( 8 ) } } ) ], { background: C.mist, padding: 28, spacing: 14 } ) ] ),
			column( { width: 70, spacing: 36, more: { width_tablet: percent( 100 ) } }, sections.map( ( [ name, body ] ) => column( { spacing: 12 }, [ heading( name, { tag: 'h2', size: fluid( 'clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)' ), more: { _element_id: name.toLowerCase().replace( /[^a-z0-9]+/g, '-' ) } } ), text( body ) ] ) ) ),
		] ),
	] ),
];

pages.privacy = {
	title: 'Privacy',
	content: legal( 'Privacy policy', '1 November 2026', [
		[ 'What we collect', '<p>Account details you give us (name, email, company), the customer feedback you connect, and basic usage data such as which pages of the app are opened.</p>' ],
		[ 'How we use it', '<p>To provide the service, to answer your support requests and to send invoices. Feedback you connect is processed only to sort and display it inside your account.</p>' ],
		[ 'What we never do', '<p>We do not sell data, we do not show advertising, and we do not use your customers\' messages to train models outside your account.</p>' ],
		[ 'Where it is stored', '<p>On servers in the European Union. Backups are encrypted and kept for thirty days.</p>' ],
		[ 'Your choices', '<p>You can export or delete your data at any time from Settings. Deleting an account removes its data from our systems within thirty days.</p>' ],
		[ 'Contact', `<p>Questions about privacy go to <a href="mailto:${ EMAIL }">${ EMAIL }</a>. A person answers.</p>` ],
	] ),
};

pages.terms = {
	title: 'Terms',
	content: legal( 'Terms of service', '1 November 2026', [
		[ 'The service', '<p>Loop is software that reads and organises customer feedback you connect to it. We work to keep it available and will tell you in advance about planned interruptions.</p>' ],
		[ 'Your account', '<p>You are responsible for who has access to your account and for having the right to connect the feedback you connect.</p>' ],
		[ 'Paying', '<p>Plans are billed monthly or yearly in advance. You can cancel at any time; the plan runs to the end of the period you paid for.</p>' ],
		[ 'Your content', '<p>Everything you connect remains yours. You give us permission to process it only to provide the service to you.</p>' ],
		[ 'Ending', '<p>You may close your account whenever you like. We may suspend an account that is used to break the law or to harm the service, and will say why.</p>' ],
		[ 'Changes', '<p>If these terms change in a way that matters, we write to the account owner thirty days before the change takes effect.</p>' ],
	] ),
};

// The posts page: shown by the archive template, so it has no Elementor content of its own.
pages.blog = { title: 'Blog', plain: true };

/* -------------------------------------------------------------------------
   Theme Builder templates (Elementor Pro)
   ---------------------------------------------------------------------- */
const postList = () =>
	widget( 'archive-posts', { archive_classic_columns: '3', archive_classic_columns_tablet: '2', archive_classic_columns_mobile: '1', archive_classic_show_excerpt: 'yes', archive_classic_excerpt_length: 20, archive_classic_meta_data: [ 'date' ], archive_classic_show_read_more: '', archive_classic_title_tag: 'h2', archive_classic_item_ratio: { unit: 'px', size: 0.56, sizes: [] }, archive_classic_img_border_radius: box( 16 ), archive_classic_title_color: C.ink, archive_classic_excerpt_color: C.text, archive_classic_meta_color: C.text, archive_classic_row_gap: px( 48 ), archive_classic_column_gap: px( 28 ), pagination_type: 'numbers', nothing_found_message: 'Nothing here yet.' } );

const footLinks = ( title, items ) =>
	column( { width: 18, spacing: 14, more: { width_tablet: percent( 30 ) } }, [
		fact( title, { color: C.white, size: 15, weight: 700 } ),
		list( items.map( ( [ name, url ] ) => ( { text: name, url } ) ), { color: C.haze, more: { view: 'traditional', icon_size: px( 0 ), text_indent: px( 0 ), text_color_hover: C.white } } ),
	] );

const templates = {
	header: {
		title: 'Header',
		type: 'header',
		conditions: [ [ 'include', 'general' ] ],
		content: [
			container( { content_width: 'boxed', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'space-between', flex_gap: gap( 32 ), flex_wrap: 'nowrap', padding: box( 16, 24 ), padding_mobile: box( 10, 20 ), background_background: 'classic', background_color: C.white, border_border: 'solid', border_width: box( 0, 0, 1, 0 ), border_color: C.line }, [
				heading( 'Loop', { tag: 'p', color: C.ink, size: px( 26 ), weight: 700, more: { link: link( page( 'home' ) ), typography_letter_spacing: px( -0.6 ), _flex_size: 'none' } } ),
				container( { content_width: 'full', width: percent( 10 ), width_mobile: percent( 10 ), flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'flex-end', flex_gap: gap( 16 ), flex_wrap: 'nowrap', padding: box( 0 ), _flex_size: 'grow' }, [
					widget( 'nav-menu', { menu: menu( 'primary' ), layout: 'horizontal', align_items: 'end', pointer: 'none', dropdown: 'tablet', full_width: 'stretch', text_align: 'aside', toggle: 'burger', toggle_align: 'right', menu_typography_typography: 'custom', menu_typography_font_family: SANS, menu_typography_font_size: px( 16 ), menu_typography_font_weight: '500', color_menu_item: C.ink, color_menu_item_hover: C.rose, color_menu_item_active: C.rose, padding_horizontal_menu_item: px( 14 ), color_dropdown_item: C.ink, background_color_dropdown_item: C.white, color_dropdown_item_hover: C.white, background_color_dropdown_item_hover: C.ink, toggle_color: C.ink, toggle_background_color: C.mist, toggle_size: px( 30 ), _flex_size: 'grow' } ),
					button( 'Start free', page( 'pricing' ), { more: { size: 'sm', hide_mobile: 'hidden-mobile', hide_tablet: 'hidden-tablet' } } ),
				] ),
			] ),
		],
	},
	footer: {
		title: 'Footer',
		type: 'footer',
		conditions: [ [ 'include', 'general' ] ],
		content: [
			b.section( { background: C.ink, top: 80, bottom: 32, spacing: 48 }, [
				row( { spacing: 48, align: 'flex-start', tablet: 'row', more: { flex_wrap_tablet: 'wrap' } }, [
					column( { width: 40, spacing: 14, more: { width_tablet: percent( 100 ) } }, [ heading( 'Loop', { tag: 'p', color: C.white, size: px( 28 ), weight: 700 } ), text( '<p>Customer feedback, sorted. For product teams who would rather read their customers than guess.</p>', { color: C.haze } ) ] ),
					footLinks( 'Product', [ [ 'Features', page( 'features' ) ], [ 'Pricing', page( 'pricing' ) ], [ 'Integrations', page( 'integrations' ) ], [ 'Customers', page( 'customers' ) ] ] ),
					footLinks( 'Company', [ [ 'About', page( 'about' ) ], [ 'Blog', page( 'blog' ) ], [ 'Book a demo', page( 'contact' ) ] ] ),
					footLinks( 'Legal', [ [ 'Privacy', page( 'privacy' ) ], [ 'Terms', page( 'terms' ) ], [ EMAIL, `mailto:${ EMAIL }` ] ] ),
				] ),
				container( { content_width: 'full', flex_direction: 'column', padding: box( 24, 0, 0, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: '#262D42' }, [ fact( '© Loop. A fictional product, made for the Open Frame SaaS starter site.', { color: C.haze, size: 14, weight: 400 } ) ] ),
			] ),
		],
	},
	archive: {
		title: 'Blog',
		type: 'archive',
		// The page that lists the posts. Elementor Pro has no title of its own for it, so the heading is written here.
		conditions: [ [ 'include', 'archive', 'post_archive' ] ],
		content: [ pageHero( 'Blog', 'Notes on listening to customers', 'What we learn building Loop, and what our customers teach us.' ), section( { top: 0, bottom: 112, spacing: 0 }, [ postList() ] ), tryIt() ],
	},
	'archive-terms': {
		title: 'Categories and other archives',
		type: 'archive',
		conditions: [ [ 'include', 'archive' ] ],
		content: [
			section( { top: 96, bottom: 72, spacing: 16 }, [ column( { spacing: 16, align: 'center' }, [ pill( 'Blog', { align: 'center' } ), widget( 'theme-archive-title', { __dynamic__: { title: dynamic( 'archive-title' ) }, header_size: 'h1', align: 'center' } ) ] ) ] ),
			section( { top: 0, bottom: 112, spacing: 0 }, [ postList() ] ),
			tryIt(),
		],
	},
	single: {
		title: 'Blog article',
		type: 'single-post',
		conditions: [ [ 'include', 'singular', 'post' ] ],
		content: [
			section( { top: 96, bottom: 48, spacing: 20 }, [
				column( { width: 70, spacing: 18, align: 'center', more: { _flex_align_self: 'center', width_tablet: percent( 100 ) } }, [
					widget( 'post-info', { view: 'inline', align: 'center', icon_list: [ { _id: 'terms', type: 'terms', taxonomy: 'category', show_icon: 'none' }, { _id: 'date', type: 'date', show_icon: 'none' } ], text_color: C.rose, icon_typography_typography: 'custom', icon_typography_font_family: SANS, icon_typography_font_size: px( 15 ), icon_typography_font_weight: '700', space_between: px( 18 ) } ),
					widget( 'theme-post-title', { __dynamic__: { title: dynamic( 'post-title' ) }, header_size: 'h1', align: 'center', typography_typography: 'custom', typography_font_size: fluid( 'clamp(2rem, 1.3rem + 3vw, 3.5rem)' ) } ),
				] ),
			] ),
			section( { top: 0, bottom: 56, spacing: 0 }, [ widget( 'theme-post-featured-image', { __dynamic__: { image: dynamic( 'post-featured-image' ) }, image_size: 'full', image_border_radius: box( 28 ) } ) ] ),
			section( { top: 0, bottom: 112, spacing: 48 }, [
				column( { width: 62, more: { _flex_align_self: 'center', width_tablet: percent( 100 ) } }, [ widget( 'theme-post-content', { text_color: C.text } ) ] ),
				column( { width: 62, more: { _flex_align_self: 'center', width_tablet: percent( 100 ), padding: box( 28, 0, 0, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.line } }, [ widget( 'post-navigation', { show_label: 'yes', prev_label: 'Previous', next_label: 'Next', show_arrow: '', show_title: 'yes', label_color: C.text, text_color: C.ink, hover_color: C.rose } ) ] ),
			] ),
			tryIt(),
		],
	},
	'not-found': {
		title: 'Page not found',
		type: 'error-404',
		conditions: [ [ 'include', 'singular', 'not_found404' ] ],
		content: [
			section( { top: 144, bottom: 144, spacing: 0 }, [
				column( { width: 62, spacing: 20, align: 'center', more: { _flex_align_self: 'center' } }, [
					pill( 'Error 404', { align: 'center' } ),
					heading( 'We could not sort this one', { tag: 'h1', align: 'center' } ),
					text( '<p>The page you asked for does not exist, or has moved. These two will get you back on track.</p>', { align: 'center', size: px( 19 ) } ),
					row( { spacing: 14, justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content_mobile: 'center', flex_align_items_mobile: 'center' } }, [ button( 'Back to the home page', page( 'home' ) ), button( 'See the features', page( 'features' ), { more: ghost } ) ] ),
				] ),
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
		{ _id: 'accent', title: 'Accent', color: C.pink },
	],
	custom_colors: [
		{ _id: 'oforange', title: 'Orange', color: C.orange },
		{ _id: 'ofrose', title: 'Rose (text)', color: C.rose },
		{ _id: 'ofmist', title: 'Mist', color: C.mist },
		{ _id: 'ofline', title: 'Line', color: C.line },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: DISPLAY, typography_font_weight: '600' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '500' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '600' },
	],
	container_width: px( 1200 ),
	body_background_background: 'classic',
	body_background_color: C.white,
	body_color: C.text,
	...sansType( 'body', { fontSize: px( 17 ), weight: 400, lineHeight: 1.65 } ),
	link_normal_color: C.rose,
	link_hover_color: C.ink,
	h1_color: C.ink,
	...displayType( 'h1', { fontSize: fluid( 'clamp(2.25rem, 1.3rem + 4.2vw, 4.25rem)' ), weight: 600, lineHeight: 1.08, spacing: -0.035 } ),
	h2_color: C.ink,
	...displayType( 'h2', { fontSize: fluid( 'clamp(1.75rem, 1.3rem + 2vw, 2.75rem)' ), weight: 600, lineHeight: 1.14, spacing: -0.03 } ),
	h3_color: C.ink,
	...displayType( 'h3', { fontSize: fluid( 'clamp(1.1875rem, 1.1rem + 0.4vw, 1.375rem)' ), weight: 600, lineHeight: 1.3, spacing: -0.015 } ),
	h4_color: C.ink,
	...sansType( 'h4', { fontSize: px( 17 ), weight: 700, lineHeight: 1.4 } ),
	...sansType( 'button', { fontSize: px( 16 ), weight: 600, lineHeight: 1.2 } ),
	button_text_color: C.white,
	button_background_color: C.ink,
	button_hover_text_color: C.white,
	button_hover_background_color: C.rose,
	button_border_radius: box( 12 ),
	button_padding: box( 15, 24 ),
};

const themeMods = {
	open_frame_follow_elementor: true,
	open_frame_color_primary: C.ink.toLowerCase(),
	open_frame_color_primary_hover: C.rose.toLowerCase(),
	open_frame_color_heading: C.ink.toLowerCase(),
	open_frame_color_text: C.text.toLowerCase(),
	open_frame_color_link: C.rose.toLowerCase(),
	open_frame_color_link_hover: C.ink.toLowerCase(),
	open_frame_color_accent: C.pink.toLowerCase(),
	open_frame_color_border: C.line.toLowerCase(),
	open_frame_color_bg: C.white.toLowerCase(),
	open_frame_container_width: 1200,
	open_frame_single_layout: 'no-sidebar',
	open_frame_page_layout: 'no-sidebar',
};

const licence = 'CC0-1.0. Original artwork generated for this starter site (tools/sites/saas-art.mjs).';
const mediaIndex = [
	{ uid: 'app-dashboard', file: 'app-dashboard.jpg', alt: 'The Loop dashboard: this week\'s feedback, a chart and the top themes' },
	{ uid: 'app-inbox', file: 'app-inbox.jpg', alt: 'The Loop inbox: a list of customer messages, each with a topic' },
	{ uid: 'app-trends', file: 'app-trends.jpg', alt: 'The Trends screen: a rising chart and five themes as circles' },
	{ uid: 'app-roadmap', file: 'app-roadmap.jpg', alt: 'The Roadmap screen: three columns of cards with request counts' },
	{ uid: 'integrations', file: 'integrations.jpg', alt: 'Six integration tiles: Mailbox, Chatly, Desk, Sheets, Tracker and Stores' },
	{ uid: 'customer-1', file: 'customer-1.jpg', alt: 'Northpost' },
	{ uid: 'customer-2', file: 'customer-2.jpg', alt: 'Driftline' },
	{ uid: 'customer-3', file: 'customer-3.jpg', alt: 'Fable & Co' },
	{ uid: 'team', file: 'team.jpg', alt: 'Four members of the Loop team' },
	// Elementor Pro links these pictures to their articles, so each needs a name.
	...posts.map( ( post ) => ( { uid: post.image, file: post.image + '.jpg', alt: `Cover of the article “${ post.title }”` } ) ),
].map( ( entry ) => ( { ...entry, licence } ) );

const fonts = [
	{ family: DISPLAY, weight: '100 800', style: 'normal', file: 'sora-latin.woff2', licence: 'OFL-1.1. Copyright 2019 The Sora Project Authors.' },
	{ family: SANS, weight: '100 900', style: 'normal', file: 'dm-sans-latin.woff2', licence: 'OFL-1.1. Copyright 2014 The DM Sans Project Authors.' },
];

const used = writeSite( {
	site: SITE,
	out: OUT,
	pages,
	templates,
	posts,
	kit,
	themeMods,
	options: { show_on_front: 'page', page_on_front: page( 'home' ), page_for_posts: page( 'blog' ) },
	menus: [ { uid: 'primary', name: 'Primary', location: 'primary', items: [ [ 'Features', 'features' ], [ 'Pricing', 'pricing' ], [ 'Integrations', 'integrations' ], [ 'Customers', 'customers' ], [ 'Blog', 'blog' ], [ 'Book a demo', 'contact' ] ].map( ( [ title, name ] ) => ( { title, url: page( name ) } ) ) } ],
	media: mediaIndex,
	fonts,
	catalog: {
		summary: 'A crisp site for a software product: features, a feature page, pricing tables, integrations, customer stories, a demo form, legal pages and a blog. Header, footer and blog are Theme Builder templates.',
		colors: [ C.ink.toLowerCase(), C.pink.toLowerCase(), C.orange.toLowerCase() ],
		pages: [ 'Home', 'Features', 'Feature Details', 'Pricing', 'Integrations', 'Customers', 'About', 'Blog', 'Single Post', 'Book a Demo', 'Privacy', 'Terms', '404' ],
		screenshots: [ { title: 'Features', file: 'features.png' }, { title: 'Pricing', file: 'pricing.png' }, { title: 'Book a demo', file: 'demo.png' } ],
		requires: { importer: '0.5.0' },
	},
} );

console.log( `SaaS: ${ Object.keys( pages ).length } pages, ${ Object.keys( templates ).length } templates, ${ posts.length } posts. Widgets: ${ used.join( ', ' ) }` );
