#!/usr/bin/env node
/**
 * The Shop starter site ("Sill & Shelf", homeware and plants), written as data.
 * A design of the Pro tier with a WooCommerce store: its header, footer, journal
 * and "page not found" layouts are Elementor Pro Theme Builder templates, and it
 * brings eight products.
 *
 *   node tools/sites/shop.mjs
 *
 * Writes starter-sites/shop/{site.json, site/, content/, media/index.json,
 * fonts/index.json}. The pictures are photographs, chosen in photo-sources.json and
 * prepared by tools/sites/photos.mjs; each product is named and described after
 * its photograph. The shop, product, cart, checkout and account pages are
 * WooCommerce's own, styled by the theme. See brief.md.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks, box, builders, dynamic, em, fluid, gap, ids, kitTypography, link, media, menu, page, percent, photoIndex, px, writeSite } from './kit.mjs';

const SITE = 'shop';
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', SITE );

/* -------------------------------------------------------------------------
   Design tokens (see brief.md)
   ---------------------------------------------------------------------- */
const C = {
	page: '#FBF8F3',
	sand: '#F0E8DB',
	sage: '#DCE3D3',
	white: '#FFFFFF',
	ink: '#23201C',
	text: '#5A534B',
	clay: '#9A4526',
	clayDark: '#7C361C',
	line: '#E3DACB',
	onInk: '#CFC8BC',
};
const DISPLAY = 'Outfit';
const SANS = 'Work Sans';
const EMAIL = 'hello@example.com';
const store = ( name ) => `ofss://store/${ name }`;
const product = ( name ) => `ofss://product/${ name }`;

const b = builders( ids() );
const { row, column, grid, text, container, widget } = b;

/* -------------------------------------------------------------------------
   Components of this design
   ---------------------------------------------------------------------- */
const section = ( options, elements ) => b.section( { top: 96, bottom: 96, ...options }, elements );
const sans = { typography_typography: 'custom', typography_font_family: SANS };
const heading = ( title, options = {} ) => b.heading( title, options );

const fact = ( title, { color = C.text, size = 16, weight = 400, align, more = {} } = {} ) =>
	b.heading( title, { tag: 'p', color, align, more: { ...sans, typography_font_size: px( size ), typography_font_weight: String( weight ), typography_line_height: em( 1.55 ), ...more } } );

/** A small word in clay above a heading. */
const label = ( title, { color = C.clay, align } = {} ) => fact( title, { color, size: 14, weight: 600, align, more: { typography_letter_spacing: px( 0.6 ) } } );

const intro = ( name, title, lead, { tag = 'h2', align, width = 56 } = {} ) =>
	column( { width, spacing: 12, ...( align === 'center' ? { align: 'center', more: { _flex_align_self: 'center' } } : {} ) }, [
		label( name, { align } ),
		heading( title, { tag, align } ),
		...( lead ? [ text( `<p>${ lead }</p>`, { align, size: px( 18 ) } ) ] : [] ),
	] );

/** Plain buttons are clay pills, from the Primary color of Site Settings. */
const button = ( title, url, options = {} ) => b.button( title, url, options );
const quiet = { background_color: 'transparent', button_text_color: C.ink, border_border: 'solid', border_width: box( 1.5 ), border_color: C.ink, hover_color: C.page, button_background_hover_color: C.ink, button_hover_border_color: C.ink };
const textLink = ( title, url ) => fact( title, { color: C.ink, weight: 600, more: { link: link( url ), typography_text_decoration: 'underline', _flex_size: 'none' } } );

const image = ( uid, { radius = 18, url, more = {} } = {} ) => b.image( uid, { radius, more: { ...( url ? { link_to: 'custom', link: link( url ) } : {} ), ...more } } );

const pageHero = ( name, title, lead ) => section( { background: C.sand, top: 80, bottom: 72, spacing: 0 }, [ intro( name, title, lead, { tag: 'h1', width: 64 } ) ] );

/** The three promises of the shop, under most pages. */
const promises = () =>
	section( { top: 56, bottom: 56, spacing: 0, more: { border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.line } }, [
		grid( { columns: 3, spacing: 32 }, [
			[ 'Sent within two working days', 'In boxes we reuse, with paper instead of plastic.' ],
			[ 'Thirty days to change your mind', 'Send it back as it came and we return what you paid.' ],
			[ 'Made in small batches', 'When a thing is gone, the next batch is a few weeks away.' ],
		].map( ( [ title, body ] ) => column( { spacing: 6 }, [ heading( title, { tag: 'h3', size: px( 19 ) } ), text( `<p>${ body }</p>`, { size: px( 16 ) } ) ] ) ) ),
	] );

/** A form (Elementor Pro). */
const form = ( name, fields, buttonText, subject, success ) =>
	widget( 'form', {
		form_name: name,
		form_fields: fields.map( ( [ id, type, title, width = '100', required = true ] ) => ( { _id: id, custom_id: id, field_type: type, field_label: title, placeholder: '', width, ...( required ? { required: 'true' } : {} ), ...( type === 'textarea' ? { rows: 5 } : {} ) } ) ),
		show_labels: 'true', mark_required: 'yes',
		button_text: buttonText, button_width: '100',
		submit_actions: [ 'email' ], email_subject: subject, success_message: success,
		label_color: C.ink, field_text_color: C.ink, field_background_color: C.white, field_border_color: '#A69C8E', field_border_width: box( 1 ), field_border_radius: box( 12 ),
		button_background_color: C.clay, button_text_color: C.white, button_background_hover_color: C.clayDark, button_hover_color: C.white, button_border_radius: box( 999 ),
		row_gap: px( 16 ), column_gap: px( 16 ),
	} );

/* -------------------------------------------------------------------------
   Content. Every product is named and described after its photograph.
   ---------------------------------------------------------------------- */
const products = [
	{ name: 'clay-mug', title: 'Clay mug', price: '18', image: 'product-1', category: 'Ceramics', featured: true, excerpt: 'A terracotta-coloured mug with a square handle, glazed inside and out. Holds 300 ml.', content: '<p>Thrown in small batches and glazed in one warm colour, somewhere between brick and rust. The handle is square, so two fingers fit without touching the cup.</p><p>Dishwasher safe. The slate coaster in the picture is not included.</p>' },
	{ name: 'echeveria-in-concrete', title: 'Echeveria in a concrete pot', price: '24', image: 'product-2', category: 'Plants', featured: true, excerpt: 'A green echeveria in a rough cast-concrete pot. Asks for a bright sill and water every other week.', content: '<p>A rosette-shaped succulent, about twelve centimetres across, in a pot we cast ourselves. The concrete is left rough on the outside and sealed inside.</p><p>Sent in a box with a paper collar, so it arrives the right way up.</p>' },
	{ name: 'white-stoneware-jug', title: 'White stoneware jug', price: '32', image: 'product-3', category: 'Ceramics', featured: true, excerpt: 'A tall white jug with a pulled handle. For water at the table, or for a bunch of tulips.', content: '<p>Stoneware, glazed white with a soft sheen. One litre to the shoulder, and narrow enough at the neck to hold a small bunch of flowers upright.</p><p>The tulips in the picture are not included.</p>' },
	{ name: 'oak-serving-board', title: 'Oak serving board', price: '38', image: 'product-4', category: 'Kitchen', featured: true, excerpt: 'A board cut from one piece of oak, with a handle and a hanging hole. For bread, cheese or a bowl of fruit.', content: '<p>Forty centimetres long, cut from a single piece and oiled twice. The marks of the saw are left on one face on purpose.</p><p>Wipe it clean and oil it now and then. The small bowl in the picture is not included.</p>' },
	{ name: 'leather-pocket-notebook', title: 'Leather pocket notebook', price: '22', image: 'product-5', category: 'Paper', excerpt: 'A pocket notebook in tan leather with plain pages. It darkens where you hold it.', content: '<p>Ninety-six plain pages in a soft leather cover, stitched down the spine. Small enough for a coat pocket.</p><p>The pen and the clip in the picture are not included.</p>' },
	{ name: 'willow-basket', title: 'Willow basket', price: '28', image: 'product-6', category: 'Storage', excerpt: 'Hand-woven baskets in five shapes, from a bread basket to a deep round one. The price is for the small round basket.', content: '<p>Woven from unpeeled and peeled willow, which gives the two colours. No two are the same; the picture shows five from one week.</p><p>Tell us in the order note which shape you would like, and we will send the nearest we have.</p>' },
	{ name: 'black-floor-lamp', title: 'Black floor lamp', price: '120', image: 'product-7', category: 'Lighting', excerpt: 'A slim black floor lamp with a round shade that tilts. For reading, beside a chair.', content: '<p>A steel stem, 150 centimetres tall, with a shade that turns and tilts on a single joint. Matt black, with a black cloth cable and a switch you can find with your foot.</p><p>Takes a standard screw bulb, which is not included.</p>' },
	{ name: 'shell-chair-with-oak-legs', title: 'Shell chair with oak legs', price: '95', sale: '79', image: 'product-8', category: 'Furniture', excerpt: 'A white moulded seat on four oak legs. Light enough to carry with one hand.', content: '<p>A moulded shell in matt white on a base of oiled oak and black steel. It is a familiar shape made by a workshop we know, not a named original.</p><p>The woven basket and the blanket in the picture are not included.</p>' },
];

const posts = [
	{
		name: 'keeping-a-succulent-alive',
		title: 'Keeping a succulent alive, honestly',
		excerpt: 'Most of them die of kindness. How much light, how little water, and what to do when the leaves go soft.',
		image: 'journal-1', category: 'Plants', days: 5,
		content: [
			blocks.paragraph( 'Most house plants that die are watered to death. A succulent stores its water in its leaves, and the kindest thing you can do is forget about it for a fortnight.' ),
			blocks.heading( 'Three rules' ),
			blocks.list( [ 'The brightest sill you have', 'Water when the soil is dry all the way down, not before', 'A pot with a hole in the bottom, or very little water' ] ),
			blocks.heading( 'When the leaves go soft' ),
			blocks.paragraph( 'Soft, pale leaves mean too much water. Wrinkled leaves mean too little. Both can be put right if you notice within a week or two.' ),
			blocks.paragraph( `The <a href="${ product( 'echeveria-in-concrete' ) }">echeveria in a concrete pot</a> is a forgiving one to start with.` ),
		],
	},
	{
		name: 'laying-a-table-for-six',
		title: 'Laying a table for six without buying anything',
		excerpt: 'A runner, something green down the middle, and plates that do not match. A table that looks cared for, from what is in the cupboard.',
		image: 'journal-2', category: 'Table', days: 16,
		content: [
			blocks.paragraph( 'A table looks cared for when one thing runs down the middle of it. A cloth runner will do, or a row of whatever is green in the garden.' ),
			blocks.heading( 'What goes on it' ),
			blocks.list( [ 'A runner, or a folded tablecloth', 'Greenery, laid flat rather than in a vase', 'Plates of two sizes, which need not match' ] ),
			blocks.quote( 'Nobody remembers the plates. They remember that someone thought about the table.' ),
			blocks.heading( 'What to leave off' ),
			blocks.paragraph( 'Tall flowers, which people cannot see over, and anything that has to be explained.' ),
		],
	},
	{
		name: 'things-that-last',
		title: 'How to tell a thing that will last',
		excerpt: 'Weight, joints and whether it can be mended. Three questions to ask of a board, a basket or a chair before you buy it.',
		image: 'journal-3', category: 'Buying well', days: 30,
		content: [
			blocks.paragraph( 'The bread board in the picture is twenty years old and has been oiled perhaps ten times. It has lasted because it was one piece of wood to begin with.' ),
			blocks.heading( 'Three questions' ),
			blocks.list( [ 'Is it heavier than it looks?', 'Can you see how it is joined?', 'If it broke, could someone mend it?' ] ),
			blocks.heading( 'What we do about it' ),
			blocks.paragraph( `We sell very little, and we use all of it ourselves first. The <a href="${ product( 'oak-serving-board' ) }">oak serving board</a> has been through a year of our own kitchen.` ),
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
		// A room across the whole screen, with the words on a card that sits in it.
		container( { content_width: 'boxed', flex_direction: 'column', flex_justify_content: 'flex-end', min_height: { unit: 'px', size: 620, sizes: [] }, min_height_mobile: { unit: 'px', size: 520, sizes: [] }, padding: box( 48, 24 ), padding_mobile: box( 20 ), background_background: 'classic', background_image: media( 'hero' ), background_position: 'center center', background_size: 'cover', background_repeat: 'no-repeat' }, [
			container( { content_width: 'full', width: px( 520 ), width_mobile: percent( 100 ), flex_direction: 'column', flex_gap: gap( 16 ), padding: box( 40 ), padding_mobile: box( 24 ), background_background: 'classic', background_color: C.page, border_radius: box( 24 ) }, [
				label( 'Homeware and plants' ),
				heading( 'Useful things for a quiet room', { tag: 'h1' } ),
				text( '<p>Sill &amp; Shelf is a small shop for pots, plants and the plain objects a home is made of. Everything is used by us before it is sold by us.</p>', { size: px( 18 ) } ),
				row( { spacing: 12, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Shop everything', store( 'shop' ) ), button( 'The lookbook', page( 'lookbook' ), { more: quiet } ) ] ),
			] ),
		] ),

		section( { spacing: 40 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'This season', 'Four things we would not be without' ), textLink( 'All products', store( 'shop' ) ) ] ),
			widget( 'woocommerce-products', { columns: 4, columns_tablet: 2, columns_mobile: 2, rows: 1, paginate: '', query_post_type: 'featured', query_orderby: 'date', query_order: 'desc', column_gap: px( 28 ), row_gap: px( 36 ), image_border_radius: box( 18 ), title_color: C.ink, price_color: C.text, button_text_color: C.clay } ),
		] ),

		section( { background: C.sage, spacing: 0 }, [
			row( { spacing: 72, align: 'center', tablet: 'column' }, [
				column( { width: 46, more: { width_tablet: percent( 100 ) } }, [ image( 'about' ) ] ),
				column( { width: 54, spacing: 16, more: { width_tablet: percent( 100 ) } }, [
					label( 'Where it comes from' ),
					heading( 'Thrown, cast and woven by people we can telephone' ),
					text( '<p>The mugs and jugs come off one wheel. The pots are cast in a shed behind the shop, and the baskets are woven two valleys away. We know everyone who makes what we sell, and we can tell you about them.</p>' ),
					button( 'About the shop', page( 'about' ), { more: quiet } ),
				] ),
			] ),
		] ),

		section( { spacing: 40 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'Lookbook', 'How it looks at home' ), textLink( 'See the lookbook', page( 'lookbook' ) ) ] ),
			grid( { columns: 4, tablet: 2, spacing: 24, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, [ 'lookbook-1', 'lookbook-2', 'lookbook-3', 'lookbook-4' ].map( ( uid ) => image( uid, { url: page( 'lookbook' ) } ) ) ),
		] ),

		section( { background: C.sand, spacing: 40 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'Journal', 'Notes on plants, tables and buying well' ), textLink( 'All notes', page( 'journal' ) ) ] ),
			widget( 'posts', { classic_columns: '3', classic_columns_tablet: '2', classic_columns_mobile: '1', classic_posts_per_page: 3, classic_show_excerpt: 'yes', classic_excerpt_length: 18, classic_meta_data: [ 'date' ], classic_show_read_more: '', classic_title_tag: 'h3', classic_item_ratio: { unit: 'px', size: 0.62, sizes: [] }, classic_img_border_radius: box( 18 ), classic_title_color: C.ink, classic_excerpt_color: C.text, classic_meta_color: C.text, classic_row_gap: px( 40 ), classic_column_gap: px( 28 ), pagination_type: '' } ),
		] ),

		promises(),
	],
};

const looks = [
	[ 'lookbook-1', 'The shelf by the door', 'A snake plant asks for almost nothing, which makes it right for a hallway. The black cat is our own and not for sale.', [ 'Echeveria in a concrete pot', 'echeveria-in-concrete' ] ],
	[ 'lookbook-2', 'Breakfast, late', 'Fruit on a plain plate, juice in whatever glasses are clean. A board in the middle keeps the bread off the cloth.', [ 'Oak serving board', 'oak-serving-board' ] ],
	[ 'lookbook-3', 'The chair by the window', 'One cushion, one lamp, and the curtains left to do the rest.', [ 'Black floor lamp', 'black-floor-lamp' ] ],
	[ 'lookbook-4', 'The kitchen sill', 'Two small trees in white pots, turned a quarter each week so they grow straight.', [ 'White stoneware jug', 'white-stoneware-jug' ] ],
];

pages.lookbook = {
	title: 'Lookbook',
	content: [
		pageHero( 'Lookbook', 'Four corners of a home', 'Not a catalogue. Four places where a few plain things earn their keep.' ),
		section( { spacing: 0 }, [
			grid( { columns: 2, tablet: 2, spacing: 48, more: { grid_gaps: { unit: 'px', size: 48, column: '48', row: '72', isLinked: false } } }, looks.map( ( [ uid, title, body, [ name, slug ] ] ) => column( { spacing: 14 }, [
				image( uid ),
				heading( title, { tag: 'h2', size: fluid( 'clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem)' ) } ),
				text( `<p>${ body }</p>` ),
				textLink( `In the picture or near it: ${ name }`, product( slug ) ),
			] ) ) ),
		] ),
		promises(),
	],
};

pages.about = {
	title: 'About',
	content: [
		pageHero( 'About', 'A shop the size of a living room', 'Two people, one wheel, and a short list of things we would buy again ourselves.' ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'center', tablet: 'column' }, [
				column( { width: 50, spacing: 16, more: { width_tablet: percent( 100 ) } }, [ heading( 'We sell what we use' ), text( '<p>Sill &amp; Shelf began as a table at a Saturday market, with a dozen pots and the plants that were in them. The pots sold; people asked what else we had.</p><p>What we have is still a short list. Every object in the shop has been through a season in our own home first, and anything that chipped, wobbled or bored us was left out.</p>' ) ] ),
				column( { width: 50, more: { width_tablet: percent( 100 ) } }, [ image( 'about' ) ] ),
			] ),
		] ),
		section( { background: C.sage, spacing: 40 }, [
			intro( 'How we work', 'Three habits' ),
			grid( { columns: 3, spacing: 32 }, [
				[ 'Small batches', 'A kiln holds forty mugs. When they are gone, the next forty are three weeks away, and we say so.' ],
				[ 'Named makers', 'We can tell you who made anything we sell, and we pay them before we are paid.' ],
				[ 'Plain packing', 'Reused boxes, paper and string. If a thing arrives broken, we send another and do not ask for the pieces.' ],
			].map( ( [ title, body ] ) => container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 8 ), padding: box( 28 ), background_background: 'classic', background_color: C.page, border_radius: box( 18 ) }, [ heading( title, { tag: 'h3' } ), text( `<p>${ body }</p>` ) ] ) ) ),
		] ),
		promises(),
	],
};

pages.shipping = {
	title: 'Shipping and Returns',
	slug: 'shipping-and-returns',
	content: [
		pageHero( 'Shipping and returns', 'How it reaches you, and how it comes back', 'Sample terms for a starter site: replace them with the terms of your own shop.' ),
		section( { spacing: 0 }, [
			column( { width: 72, spacing: 0 }, [
				[ 'When will my order be sent?', 'Within two working days. Plants are sent on Mondays and Tuesdays only, so that they do not spend a weekend in a depot.' ],
				[ 'What does delivery cost?', 'A flat price per order, shown in the basket before you pay. Orders over a certain amount are sent free.' ],
				[ 'Can I send something back?', 'Yes, within thirty days, in the state it arrived in. Write to us first and we will send a label.' ],
				[ 'What about plants?', 'Plants cannot be returned, but if one arrives damaged, send a photograph within three days and we will replace it.' ],
				[ 'Something arrived broken', 'Send a photograph of the box and the object. We send a replacement the same week and do not ask for the pieces.' ],
			].map( ( [ question, answer ] ) => container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 8 ), padding: box( 28, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.line }, [ heading( question, { tag: 'h2', size: px( 22 ) } ), text( `<p>${ answer }</p>` ) ] ) ) ),
		] ),
		promises(),
	],
};

pages.contact = {
	title: 'Contact',
	content: [
		pageHero( 'Contact', 'Ask us before you buy, or after', 'About a size, a plant that looks unwell, or an order. One of the two of us answers, usually the same day.' ),
		section( { spacing: 0 }, [
			row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
				column( { width: 56, spacing: 18, more: { width_tablet: percent( 100 ) } }, [ heading( 'Write to us', { tag: 'h2' } ), form( 'Contact', [ [ 'name', 'text', 'Your name', '50' ], [ 'email', 'email', 'Email', '50' ], [ 'order', 'text', 'Order number, if you have one', '100', false ], [ 'message', 'textarea', 'Your question' ] ], 'Send', 'A question from the shop', 'Thank you. We will answer within one working day.' ) ] ),
				column( { width: 44, spacing: 16, more: { width_tablet: percent( 100 ) } }, [
					container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 6 ), padding: box( 28 ), background_background: 'classic', background_color: C.sand, border_radius: box( 18 ) }, [ label( 'Email' ), heading( EMAIL, { tag: 'p', size: px( 22 ), more: { link: link( `mailto:${ EMAIL }` ) } } ) ] ),
					container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 6 ), padding: box( 28 ), background_background: 'classic', background_color: C.sand, border_radius: box( 18 ) }, [ label( 'Orders' ), text( `<p>Delivery and returns are explained on the <a href="${ page( 'shipping' ) }">shipping and returns</a> page. Your own orders are in <a href="${ store( 'account' ) }">your account</a>.</p>` ) ] ),
				] ),
			] ),
		] ),
	],
};

// The posts page: shown by the archive template.
pages.journal = { title: 'Journal', plain: true };

/* -------------------------------------------------------------------------
   Theme Builder templates (Elementor Pro)
   ---------------------------------------------------------------------- */
const postList = () =>
	widget( 'archive-posts', { archive_classic_columns: '3', archive_classic_columns_tablet: '2', archive_classic_columns_mobile: '1', archive_classic_show_excerpt: 'yes', archive_classic_excerpt_length: 18, archive_classic_meta_data: [ 'date' ], archive_classic_show_read_more: '', archive_classic_title_tag: 'h2', archive_classic_item_ratio: { unit: 'px', size: 0.62, sizes: [] }, archive_classic_img_border_radius: box( 18 ), archive_classic_title_color: C.ink, archive_classic_excerpt_color: C.text, archive_classic_meta_color: C.text, archive_classic_row_gap: px( 48 ), archive_classic_column_gap: px( 28 ), pagination_type: 'numbers', nothing_found_message: 'Nothing here yet.' } );

const wordmark = ( size, color = C.ink ) => heading( 'Sill &amp; Shelf', { tag: 'p', color, size: px( size ), weight: 600, more: { link: link( page( 'home' ) ), typography_letter_spacing: px( -0.4 ), _flex_size: 'none' } } );

const templates = {
	header: {
		title: 'Header',
		type: 'header',
		conditions: [ [ 'include', 'general' ] ],
		content: [
			container( { content_width: 'full', flex_direction: 'column', flex_align_items: 'center', padding: box( 8, 16 ), background_background: 'classic', background_color: C.ink }, [ fact( 'Plants are sent on Mondays and Tuesdays · Thirty days to change your mind', { color: C.page, size: 14, align: 'center' } ) ] ),
			container( { content_width: 'boxed', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'space-between', flex_gap: gap( 24 ), flex_wrap: 'nowrap', padding: box( 16, 24 ), padding_mobile: box( 12, 20 ), background_background: 'classic', background_color: C.page, border_border: 'solid', border_width: box( 0, 0, 1, 0 ), border_color: C.line }, [
				wordmark( 26 ),
				container( { content_width: 'full', width: percent( 10 ), width_mobile: percent( 10 ), flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'flex-end', flex_gap: gap( 12 ), flex_wrap: 'nowrap', padding: box( 0 ), _flex_size: 'grow' }, [
					widget( 'nav-menu', { menu: menu( 'primary' ), layout: 'horizontal', align_items: 'end', pointer: 'none', dropdown: 'tablet', full_width: 'stretch', text_align: 'aside', toggle: 'burger', toggle_align: 'right', menu_typography_typography: 'custom', menu_typography_font_family: SANS, menu_typography_font_size: px( 16 ), menu_typography_font_weight: '500', color_menu_item: C.ink, color_menu_item_hover: C.clay, color_menu_item_active: C.clay, padding_horizontal_menu_item: px( 14 ), color_dropdown_item: C.ink, background_color_dropdown_item: C.page, color_dropdown_item_hover: C.page, background_color_dropdown_item_hover: C.ink, toggle_color: C.ink, toggle_background_color: C.sand, toggle_size: px( 30 ), _flex_size: 'grow' } ),
					widget( 'woocommerce-menu-cart', { icon: 'basket-medium', items_indicator: 'bubble', show_subtotal: '', hide_empty_indicator: '', alignment: 'right', toggle_button_text_color: C.ink, toggle_button_icon_color: C.ink, toggle_button_border_width: px( 0 ), toggle_icon_size: px( 22 ), items_indicator_background_color: C.clay, items_indicator_text_color: C.white, _flex_size: 'none' } ),
				] ),
			] ),
		],
	},
	footer: {
		title: 'Footer',
		type: 'footer',
		conditions: [ [ 'include', 'general' ] ],
		content: [
			b.section( { background: C.ink, top: 72, bottom: 28, spacing: 40 }, [
				row( { spacing: 48, align: 'flex-start', tablet: 'row', more: { flex_wrap_tablet: 'wrap' } }, [
					column( { width: 40, spacing: 12, more: { width_tablet: percent( 100 ) } }, [ wordmark( 30, C.page ), text( '<p>Pots, plants and plain objects for the home, sent in reused boxes.</p>', { color: C.onInk } ) ] ),
					...[ [ 'Shop', [ [ 'All products', store( 'shop' ) ], [ 'Your basket', store( 'cart' ) ], [ 'Your account', store( 'account' ) ] ] ], [ 'About', [ [ 'The shop', page( 'about' ) ], [ 'Lookbook', page( 'lookbook' ) ], [ 'Journal', page( 'journal' ) ] ] ], [ 'Help', [ [ 'Shipping and returns', page( 'shipping' ) ], [ 'Contact', page( 'contact' ) ], [ EMAIL, `mailto:${ EMAIL }` ] ] ] ].map( ( [ title, items ] ) =>
						column( { width: 20, spacing: 10, more: { width_tablet: percent( 30 ) } }, [ label( title, { color: C.onInk } ), ...items.map( ( [ name, url ] ) => fact( name, { color: C.page, more: { link: link( url ) } } ) ) ] ) ),
				] ),
				container( { content_width: 'full', flex_direction: 'column', padding: box( 22, 0, 0, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: '#3B362F' }, [ fact( 'Sample content: Sill & Shelf is a fictional shop made for the Open Frame Shop starter site. The products, prices and terms are examples to replace with your own; nothing can really be ordered here.', { color: C.onInk, size: 14 } ) ] ),
			] ),
		],
	},
	archive: {
		title: 'Journal',
		type: 'archive',
		// The page that lists the posts. Elementor Pro has no title of its own for it, so the heading is written here.
		conditions: [ [ 'include', 'archive', 'post_archive' ] ],
		content: [ pageHero( 'Journal', 'Notes on plants, tables and buying well', 'Written by the two of us, when there is something worth saying.' ), section( { spacing: 0 }, [ postList() ] ), promises() ],
	},
	'archive-terms': {
		title: 'Categories and other archives',
		type: 'archive',
		// Only the archives of the journal: the shop's own lists are WooCommerce's.
		conditions: [ [ 'include', 'archive', 'category' ], [ 'include', 'archive', 'post_tag' ], [ 'include', 'archive', 'date' ], [ 'include', 'archive', 'author' ] ],
		content: [
			section( { background: C.sand, top: 80, bottom: 72, spacing: 12 }, [ label( 'Journal' ), widget( 'theme-archive-title', { __dynamic__: { title: dynamic( 'archive-title' ) }, header_size: 'h1', title_color: C.ink } ) ] ),
			section( { spacing: 0 }, [ postList() ] ),
			promises(),
		],
	},
	single: {
		title: 'Article',
		type: 'single-post',
		conditions: [ [ 'include', 'singular', 'post' ] ],
		content: [
			section( { background: C.sand, top: 80, bottom: 64, spacing: 16 }, [
				widget( 'post-info', { view: 'inline', icon_list: [ { _id: 'terms', type: 'terms', taxonomy: 'category', show_icon: 'none' }, { _id: 'date', type: 'date', show_icon: 'none' } ], text_color: C.clay, icon_typography_typography: 'custom', icon_typography_font_family: SANS, icon_typography_font_size: px( 14 ), icon_typography_font_weight: '600', space_between: px( 18 ) } ),
				column( { width: 72 }, [ widget( 'theme-post-title', { __dynamic__: { title: dynamic( 'post-title' ) }, header_size: 'h1', title_color: C.ink } ) ] ),
			] ),
			section( { top: 64, spacing: 40 }, [
				column( { width: 66, spacing: 36, more: { _flex_align_self: 'center', width_tablet: percent( 100 ) } }, [
					widget( 'theme-post-featured-image', { __dynamic__: { image: dynamic( 'post-featured-image' ) }, image_size: 'full', image_border_radius: box( 18 ) } ),
					widget( 'theme-post-content', { text_color: C.text } ),
					container( { content_width: 'full', flex_direction: 'column', padding: box( 24, 0, 0, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.line }, [ widget( 'post-navigation', { show_label: 'yes', prev_label: 'Previous', next_label: 'Next', show_arrow: '', show_title: 'yes', label_color: C.text, text_color: C.ink, hover_color: C.clay } ) ] ),
				] ),
			] ),
			promises(),
		],
	},
	'not-found': {
		title: 'Page not found',
		type: 'error-404',
		conditions: [ [ 'include', 'singular', 'not_found404' ] ],
		content: [
			section( { background: C.sand, top: 128, bottom: 128, spacing: 18 }, [
				label( 'Error 404' ),
				column( { width: 64 }, [ heading( 'This shelf is empty', { tag: 'h1' } ) ] ),
				column( { width: 48 }, [ text( '<p>The page may have been a product that has sold out for good, or the link may be mistyped.</p>', { size: px( 18 ) } ) ] ),
				row( { spacing: 12, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Back to the home page', page( 'home' ) ), button( 'Shop everything', store( 'shop' ), { more: quiet } ) ] ),
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
		{ _id: 'primary', title: 'Primary', color: C.clay },
		{ _id: 'secondary', title: 'Secondary', color: C.ink },
		{ _id: 'text', title: 'Text', color: C.text },
		{ _id: 'accent', title: 'Accent', color: C.clay },
	],
	custom_colors: [
		{ _id: 'ofpage', title: 'Page', color: C.page },
		{ _id: 'ofsand', title: 'Sand', color: C.sand },
		{ _id: 'ofsage', title: 'Sage', color: C.sage },
		{ _id: 'ofline', title: 'Line', color: C.line },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: DISPLAY, typography_font_weight: '500' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '500' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '600' },
	],
	container_width: px( 1200 ),
	body_background_background: 'classic',
	body_background_color: C.page,
	body_color: C.text,
	...sansType( 'body', { fontSize: px( 17 ), weight: 400, lineHeight: 1.65 } ),
	link_normal_color: C.clay,
	link_hover_color: C.clayDark,
	h1_color: C.ink,
	...displayType( 'h1', { fontSize: fluid( 'clamp(2.125rem, 1.5rem + 2.8vw, 3.5rem)' ), weight: 500, lineHeight: 1.1, spacing: -0.02 } ),
	h2_color: C.ink,
	...displayType( 'h2', { fontSize: fluid( 'clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem)' ), weight: 500, lineHeight: 1.15, spacing: -0.015 } ),
	h3_color: C.ink,
	...displayType( 'h3', { fontSize: fluid( 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)' ), weight: 500, lineHeight: 1.25, spacing: -0.01 } ),
	h4_color: C.ink,
	...sansType( 'h4', { fontSize: px( 17 ), weight: 600, lineHeight: 1.4 } ),
	...sansType( 'button', { fontSize: px( 16 ), weight: 600, lineHeight: 1.2 } ),
	button_text_color: C.white,
	button_background_color: C.clay,
	button_hover_text_color: C.white,
	button_hover_background_color: C.clayDark,
	button_border_radius: box( 999 ),
	button_padding: box( 15, 28 ),
};

const themeMods = {
	open_frame_follow_elementor: true,
	open_frame_color_primary: C.clay.toLowerCase(),
	open_frame_color_primary_hover: C.clayDark.toLowerCase(),
	open_frame_color_heading: C.ink.toLowerCase(),
	open_frame_color_text: C.text.toLowerCase(),
	open_frame_color_link: C.clay.toLowerCase(),
	open_frame_color_link_hover: C.clayDark.toLowerCase(),
	open_frame_color_accent: C.clay.toLowerCase(),
	open_frame_color_border: C.line.toLowerCase(),
	open_frame_color_bg: C.page.toLowerCase(),
	open_frame_container_width: 1200,
	open_frame_single_layout: 'no-sidebar',
	open_frame_page_layout: 'no-sidebar',
};

// The photographs, with where each came from (photos.json, written by tools/sites/photos.mjs).
// The hero lies behind the headline, so it is decoration; Elementor Pro links the covers to their articles.
const mediaIndex = photoIndex( OUT, { hero: '', ...Object.fromEntries( posts.map( ( post ) => [ post.image, `Cover of the article “${ post.title }”` ] ) ) } );

const fonts = [
	{ family: DISPLAY, weight: '100 900', style: 'normal', file: 'outfit-latin.woff2', licence: 'OFL-1.1. Copyright 2021 The Outfit Project Authors.' },
	{ family: SANS, weight: '100 900', style: 'normal', file: 'work-sans-latin.woff2', licence: 'OFL-1.1. Copyright 2019 The Work Sans Project Authors.' },
];

const used = writeSite( {
	site: SITE,
	out: OUT,
	pages,
	templates,
	posts,
	products,
	kit,
	themeMods,
	options: { show_on_front: 'page', page_on_front: page( 'home' ), page_for_posts: page( 'journal' ) },
	menus: [ { uid: 'primary', name: 'Primary', location: 'primary', items: [ [ 'Shop', store( 'shop' ) ], [ 'Lookbook', page( 'lookbook' ) ], [ 'About', page( 'about' ) ], [ 'Journal', page( 'journal' ) ], [ 'Shipping', page( 'shipping' ) ], [ 'Contact', page( 'contact' ) ] ].map( ( [ title, url ] ) => ( { title, url } ) ) } ],
	media: mediaIndex,
	fonts,
	catalog: {
		summary: 'A small online store built on WooCommerce: eight products, a home page with a room-wide picture, a lookbook, shipping and returns, a journal and a contact form. Header with basket, footer and journal are Theme Builder templates.',
		colors: [ C.sand.toLowerCase(), C.clay.toLowerCase(), C.ink.toLowerCase() ],
		pages: [ 'Home', 'Shop', 'Product', 'Cart', 'Checkout', 'My Account', 'About', 'Lookbook', 'Shipping and Returns', 'Journal', 'Single Post', 'Contact', '404' ],
		screenshots: [ { title: 'Shop', file: 'store.png' }, { title: 'A product', file: 'product.png' }, { title: 'Lookbook', file: 'lookbook.png' } ],
		// The shop, product, basket, checkout and account pages are WooCommerce's, styled by the theme.
		editable: { 404: 'elementor', shop: 'theme', pages: 'elementor', header: 'elementor', footer: 'elementor', blog: 'elementor', single: 'elementor' },
		requires: { importer: '0.6.0' },
	},
} );

console.log( `Shop: ${ Object.keys( pages ).length } pages, ${ Object.keys( templates ).length } templates, ${ posts.length } posts, ${ products.length } products. Widgets: ${ used.join( ', ' ) }` );
