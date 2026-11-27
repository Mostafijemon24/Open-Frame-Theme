#!/usr/bin/env node
/**
 * The Magazine starter site ("Common Ground", a magazine of places, food and craft),
 * written as data. A design of the Pro tier: its masthead, footer, story lists and
 * article layout are Elementor Pro Theme Builder templates.
 *
 *   node tools/sites/magazine.mjs
 *
 * Writes starter-sites/magazine/{site.json, site/, content/, media/index.json,
 * fonts/index.json}. The pictures are photographs, chosen in photo-sources.json and
 * prepared by tools/sites/photos.mjs. The nine stories were written after the
 * photographs were chosen, each about what its picture shows. See brief.md.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks, box, builders, dynamic, em, fluid, gap, ids, kitTypography, link, menu, noRatio, page, percent, photoIndex, px, writeSite } from './kit.mjs';

const SITE = 'magazine';
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', SITE );

/* -------------------------------------------------------------------------
   Design tokens (see brief.md)
   ---------------------------------------------------------------------- */
const C = {
	white: '#FFFFFF',
	paper: '#F5F2EB',
	ink: '#111111',
	text: '#3D3D3D',
	grey: '#5E5E5E',
	red: '#B5121B',
	rule: '#D8D4CA',
	onInk: '#D6D2C8',
};
const SERIF = 'Literata';
const SANS = 'Public Sans';
const EMAIL = 'letters@example.com';

const b = builders( ids() );
const { row, column, grid, text, container, widget } = b;
const post = ( name ) => `ofss://post/${ name }`;
const category = ( slug ) => `ofss://category/${ slug }`;

/* -------------------------------------------------------------------------
   Components of this design
   ---------------------------------------------------------------------- */
const section = ( options, elements ) => b.section( { top: 72, bottom: 72, ...options }, elements );
const sans = { typography_typography: 'custom', typography_font_family: SANS };
const heading = ( title, options = {} ) => b.heading( title, options );

const fact = ( title, { color = C.text, size = 15, weight = 500, align, more = {} } = {} ) =>
	b.heading( title, { tag: 'p', color, align, more: { ...sans, typography_font_size: px( size ), typography_font_weight: String( weight ), typography_line_height: em( 1.5 ), ...more } } );

/** The small red word above a headline: the section of the magazine. */
const kicker = ( title, { color = C.red, align, url } = {} ) => fact( title, { color, size: 13, weight: 800, align, more: { typography_text_transform: 'uppercase', typography_letter_spacing: px( 2.2 ), ...( url ? { link: link( url ) } : {} ) } } );

const button = ( title, url, options = {} ) => b.button( title, url, options );
const outline = { background_color: 'transparent', button_text_color: C.ink, border_border: 'solid', border_width: box( 1.5 ), border_color: C.ink, hover_color: C.white, button_background_hover_color: C.ink };
const arrow = ( title, url, { color = C.ink } = {} ) => fact( `${ title } →`, { color, size: 14, weight: 700, more: { link: link( url ), _flex_size: 'none' } } );

const image = ( uid, { url, more = {} } = {} ) => b.image( uid, { radius: 0, more: { ...( url ? { link_to: 'custom', link: link( url ) } : {} ), ...more } } );

/** A thick black rule with a title under it: how the magazine opens a block. */
const banner = ( title, url, tag = 'h2' ) =>
	container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'baseline', flex_justify_content: 'space-between', flex_gap: gap( 16 ), padding: box( 14, 0, 0, 0 ), border_border: 'solid', border_width: box( 3, 0, 0, 0 ), border_color: C.ink }, [
		heading( title, { tag, size: fluid( 'clamp(1.5rem, 1.25rem + 1.1vw, 2rem)' ) } ),
		...( url ? [ arrow( 'All stories', url ) ] : [] ),
	] );

/** The name of a section under a thick rule, with a line about it and a way to all of its stories. */
const ruledTitle = ( name, line, url ) =>
	container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'baseline', flex_justify_content: 'space-between', flex_gap: gap( 16 ), padding: box( 14, 0, 0, 0 ), border_border: 'solid', border_width: box( 3, 0, 0, 0 ), border_color: C.ink }, [
		row( { spacing: 16, align: 'baseline', more: { flex_direction_mobile: 'column', flex_gap_mobile: gap( 2 ) } }, [ heading( name, { tag: 'h2', size: fluid( 'clamp(1.5rem, 1.25rem + 1.1vw, 2rem)' ) } ), fact( line, { color: C.grey } ) ] ),
		arrow( 'All', url ),
	] );

/** A list of stories (Elementor Pro's Posts widget), newest first. */
const stories = ( { count = 3, columns = 3, term, excerpt = true, tag = 'h3', lead = false, fresh = false } = {} ) =>
	widget( 'posts', {
		classic_thumbnail_size_size: 'medium_large', classic_columns: String( columns ), classic_columns_tablet: String( Math.min( columns, 2 ) ), classic_columns_mobile: '1',
		classic_posts_per_page: count,
		classic_show_excerpt: excerpt ? 'yes' : '', classic_excerpt_length: 18,
		classic_meta_data: [ 'date' ], classic_show_read_more: '', classic_title_tag: tag,
		// No "Image Ratio": with one, Elementor Pro first shows each picture above an empty box of that ratio and
		// only fits it in once its script has run, and the page jumps. The pictures are all 16:9, so the rows are even without it.
		...noRatio( 'classic' ),
		...( lead ? { classic_title_typography_typography: 'custom', classic_title_typography_font_family: SERIF, classic_title_typography_font_weight: '700', classic_title_typography_font_size: fluid( 'clamp(2rem, 1.4rem + 2.6vw, 3.25rem)' ), classic_title_typography_line_height: em( 1.08 ), classic_excerpt_typography_typography: 'custom', classic_excerpt_typography_font_family: SANS, classic_excerpt_typography_font_size: px( 19 ), classic_excerpt_length: 40 } : {} ),
		classic_title_color: C.ink, classic_excerpt_color: C.text, classic_meta_color: C.grey,
		classic_meta_typography_typography: 'custom', classic_meta_typography_font_family: SANS, classic_meta_typography_font_size: px( 13 ),
		classic_row_gap: px( 44 ), classic_column_gap: px( 32 ),
		posts_post_type: 'post', posts_orderby: 'post_date', posts_order: 'desc',
		// A story that an earlier list on the page has shown is not shown again.
		...( fresh ? { posts_avoid_duplicates: 'yes' } : {} ),
		// The number of the category is not known until the design is imported.
		...( term ? { posts_include: [ 'terms' ], posts_include_term_ids: [ `ofss://term/${ term }` ] } : {} ),
		pagination_type: '',
	} );

const pageHero = ( name, title, lead ) =>
	section( { top: 64, bottom: 40, spacing: 0 }, [
		column( { width: 72, spacing: 14 }, [ kicker( name ), heading( title, { tag: 'h1' } ), ...( lead ? [ text( `<p>${ lead }</p>`, { size: px( 20 ) } ) ] : [] ) ] ),
	] );

/** The band that asks for a subscription, on most pages. */
const subscribeBand = () =>
	section( { background: C.paper, spacing: 0 }, [
		row( { spacing: 48, align: 'center', justify: 'space-between' }, [
			column( { width: 60, spacing: 10 }, [ kicker( 'Four issues a year' ), heading( 'Printed slowly, read slowly' ), text( '<p>Common Ground comes out with the seasons: nine stories, no advertising, on paper worth keeping. A year costs less than a dinner.</p>', { size: px( 18 ) } ) ] ),
			button( 'Subscribe', page( 'subscribe' ), { more: { _flex_size: 'none' } } ),
		] ),
	] );

/** A form (Elementor Pro). */
const form = ( name, fields, buttonText, subject, success ) =>
	widget( 'form', {
		form_name: name,
		form_fields: fields.map( ( [ id, type, label, width = '100', required = true ] ) => ( { _id: id, custom_id: id, field_type: type, field_label: label, placeholder: '', width, ...( required ? { required: 'true' } : {} ), ...( type === 'textarea' ? { rows: 5 } : {} ) } ) ),
		show_labels: 'true', mark_required: 'yes',
		button_text: buttonText, button_width: '100',
		submit_actions: [ 'email' ], email_subject: subject, success_message: success,
		label_color: C.ink, field_text_color: C.ink, field_background_color: C.white, field_border_color: '#8C8C8C', field_border_width: box( 1 ), field_border_radius: box( 0 ),
		button_background_color: C.ink, button_text_color: C.white, button_background_hover_color: C.red, button_hover_color: C.white, button_border_radius: box( 0 ),
		row_gap: px( 16 ), column_gap: px( 16 ),
	} );

/* -------------------------------------------------------------------------
   Content: three writers, nine stories. Each story is about what its photograph shows.
   ---------------------------------------------------------------------- */
const writers = {
	marta: { uid: 'author-1', name: 'Marta Lind', beat: 'Places', bio: 'Writes about places at the edge of the map and the people who stay there. Travels by ferry when there is one.' },
	elias: { uid: 'author-2', name: 'Elias Okoro', beat: 'Craft', bio: 'Trained as a cabinetmaker before he wrote a word. Visits one workshop for every issue and sweeps up before he leaves.' },
	tomas: { uid: 'author-3', name: 'Tomás Rey', beat: 'Table', bio: 'Cooked in other people\'s kitchens for ten years. Now writes about food that takes time, and bread above all.' },
};

const story = ( name, title, section_, writer, days, image_, excerpt, paragraphs, quote, sub ) => ( {
	name, title, excerpt, image: image_, category: section_, days,
	content: [
		blocks.paragraph( `<strong>Words by ${ writers[ writer ].name }</strong>` ),
		blocks.paragraph( paragraphs[ 0 ] ),
		blocks.paragraph( paragraphs[ 1 ] ),
		blocks.quote( quote ),
		blocks.heading( sub ),
		blocks.paragraph( paragraphs[ 2 ] ),
		blocks.paragraph( `This story is from the winter issue. <a href="${ page( 'subscribe' ) }">Subscribe</a> to read the next one on paper.` ),
	],
} );

const posts = [
	story( 'two-houses-at-the-end-of-the-road', 'Two houses at the end of the road', 'Places', 'marta', 1, 'places-1',
		'A yellow house and a red cabin under turf roofs, the last buildings before the bay. A winter week with the people who keep them warm.',
		[ 'The road stops being a road about a kilometre before the houses. After that it is two tracks in the snow, and then the shore: a yellow house, a red cabin, turf on both roofs, and a bay the colour of old glass.',
			'Nobody lives here all year any more. The family comes in February to check the roofs and in June to cut the grass that grows on them. In between, the stove is laid ready, with matches on the shelf, for whoever needs it.',
			'On the third day the cloud lifted for an hour and the mountains across the water turned out to have been there all along. We drank coffee on the step and said very little.' ],
		'A house you leave unlocked is a house that belongs to the weather, and to whoever the weather sends.', 'The third day' ),
	story( 'a-summer-village-that-empties-in-october', 'A summer village that empties in October', 'Places', 'marta', 9, 'places-2',
		'Fifteen huts with shingle roofs on a high pasture, built for herders and their cows. From May to September it is a village; after that, only wind.',
		[ 'From the path the huts look scattered at random across the pasture. They are not. Each stands where one family has grazed its cows for longer than the valley has kept records.',
			'The roofs come down almost to the grass, so that the wind slides over them. Inside there is one room, a bed above the animals, and a window the size of a book.',
			'In the first week of October the cows walk down in a line, and the doors are tied shut with cord. The mist that was rising over the ridge when we arrived had settled by the time we left.' ],
		'You do not own a hut up here. You look after it until your daughter does.', 'October' ),
	story( 'the-street-that-paints-itself-white', 'The street that paints itself white', 'Places', 'marta', 17, 'places-3',
		'A cobbled lane of wooden houses, every one of them white. Why a whole quarter agreed on a colour, and what it costs to keep it.',
		[ 'The lane bends twice between the harbour and the church, and there is not a wall on it that is not white. Clapboard, window frames, the bench outside number nine: white.',
			'White was once the expensive paint, and the merchants used it to say so. Now it is simply the rule. A house here is repainted every seven years, and the street does it together, in one dry week in June.',
			'The red roofs are the only colour, apart from the flower pots, which the rule does not mention and which the street takes as permission.' ],
		'If one of us painted his house blue, we would bring him coffee and a brush the next morning.', 'What the rule leaves out' ),
	story( 'one-loaf-three-days', 'One loaf, three days', 'Table', 'tomas', 4, 'table-1',
		'A round loaf with a cross cut into the crust, carried to the table in a linen cloth. How to make it, and why it should not be eaten on the day it is baked.',
		[ 'The loaf in the picture is a day old, which is when it is at its best. The crust has stopped crackling and started to taste of something.',
			'There are four things in it: flour, water, salt and a starter that needs feeding like a quiet pet. The cross on top is not decoration. It is where the loaf opens, so that it does not open somewhere else.',
			'Day one, leave it alone. Day two, eat it with butter. Day three, toast it, or tear it into soup. There is no day four in this house.' ],
		'Bread is the only thing I make that is better for being ignored.', 'Three days' ),
	story( 'the-lime-sellers-scale', 'The lime seller’s scale', 'Table', 'tomas', 12, 'table-2',
		'A worn wooden table, a red balance scale with iron weights, and a hill of limes. A morning at a stall that has never needed a price list.',
		[ 'He cuts one lime before he sells you any, and holds the halves up to the light. If the flesh is pale, he puts the heap aside and starts another.',
			'The scale is older than he is. The pan is steel, the weights are iron, and the red paint has been renewed so often that the edges have gone soft.',
			'Nothing is written down. The price is whatever the scale says, and the scale, he says, has never been wrong in his favour.' ],
		'A good lime is heavy for its size. Everything else is talk.', 'No price list' ),
	story( 'in-praise-of-the-slow-first-cup', 'In praise of the slow first cup', 'Table', 'tomas', 20, 'table-3',
		'A steel pot on the stove, a striped mug, yesterday’s newspaper. The case for making the first coffee of the day the slowest thing you do.',
		[ 'The pot takes six minutes. It cannot be hurried, and it tells you when it is done by the sound it makes, which is the whole of its user interface.',
			'I pour into the same striped mug every morning, at the table, with the newspaper open at whatever page it was left on. The news is a day old by then, and the better for it.',
			'There will be faster coffees later. This one is not for waking up. It is for being awake, briefly, before anything is asked of you.' ],
		'Six minutes is not long to wait for the only quiet part of the day.', 'Later coffees' ),
	story( 'forty-pots-before-lunch', 'Forty pots before lunch', 'Craft', 'elias', 6, 'craft-1',
		'Two hands, a wheel and a lump of dark clay. A potter who throws the same small pot forty times a morning explains why it is never the same pot.',
		[ 'The wheel is turned by foot, and he does not look at it. He looks at the wall, or at me, while his hands close round the clay and a pot comes up between them.',
			'Each one takes about ninety seconds. He cuts it free with a thread, sets it on the board with the others, and reaches for the next lump without wiping his hands.',
			'I asked how he knows when the wall is thin enough. He held out a hand, grey to the wrist, and said that it knows; he only lends it the arm.' ],
		'The first ten are practice. The last ten are tired. The good pots are in the middle.', 'How thin is thin enough' ),
	story( 'the-bench-by-the-window', 'The bench by the window', 'Craft', 'elias', 14, 'craft-2',
		'Files, hammers, two vises and a rail of tongs across a many-paned window. A craftsman on working where the light is, and keeping every tool in reach.',
		[ 'The bench runs the length of the window because the window is the lamp. In winter he starts at nine and stops at three, and no amount of electric light has changed that.',
			'Every tool hangs where his hand expects it. The tongs are on the rail, the files lie in a row by size, and the two vises are bolted where two different jobs can wait for each other.',
			'He was looking at a small part in his fingers when I came in, and he was still looking at it when I left. Some of the work, he said, is deciding whether a thing is finished.' ],
		'A tidy bench is not a virtue. It is how you find the hammer.', 'Finished, or not' ),
	story( 'a-band-of-red-in-grey-cloth', 'A band of red in grey cloth', 'Craft', 'elias', 23, 'craft-3',
		'Fine grey threads on a wooden loom, and across them a band of red, orange, green and white. A weaver on patterns that are counted, not drawn.',
		[ 'The warp is grey and so fine that from the door the loom looks empty. Come closer and there are several hundred threads, each one passed through its own eye by hand.',
			'The band of colour is not painted or printed. It is counted: so many threads up, so many down, a different count for every row. She keeps the pattern in her head and a tally on a slip of paper.',
			'A hand\'s width of cloth is a good day. The band in the picture took four of them, and she undid the second day entirely because one diamond leaned.' ],
		'You cannot hide a mistake in weaving. You can only go back to it.', 'A hand’s width a day' ),
];

/* -------------------------------------------------------------------------
   Pages
   ---------------------------------------------------------------------- */
const pages = {};
const cover = posts[ 0 ];

pages.home = {
	title: 'Front Page',
	front_page: true,
	content: [
		// The cover story with the two other stories of its section beside it, as on a front page.
		// All lists show the newest stories of a section, so the page follows what is published.
		section( { top: 40, bottom: 56, spacing: 0 }, [
			row( { spacing: 48, align: 'flex-start', tablet: 'column' }, [
				column( { width: 64, spacing: 14, more: { width_tablet: percent( 100 ) } }, [ kicker( 'Cover story · Places', { url: category( 'places' ) } ), stories( { count: 1, columns: 1, term: 'places', tag: 'h1', lead: true } ) ] ),
				column( { width: 36, spacing: 20, more: { width_tablet: percent( 100 ) } }, [ ruledTitle( 'Places', 'Where we went', category( 'places' ) ), stories( { count: 2, columns: 1, term: 'places', excerpt: false, tag: 'h2', fresh: true } ) ] ),
			] ),
		] ),
		...[ [ 'Table', 'table', 'What we ate' ], [ 'Craft', 'craft', 'Who we watched at work' ] ].map( ( [ name, slug, line ], index ) =>
			section( { top: index ? 72 : 0, spacing: 32, ...( index ? {} : { background: C.paper, top: 72 } ) }, [ ruledTitle( name, line, category( slug ) ), stories( { count: 3, term: slug } ) ] ) ),
		subscribeBand(),
	],
};

pages.about = {
	title: 'About',
	content: [
		pageHero( 'About', 'A magazine about places, food and people who make things', 'Common Ground is written by three people and printed four times a year. This is how it is made, and who makes it.' ),
		section( { top: 0, bottom: 56, spacing: 0 }, [ image( 'about' ) ] ),
		section( { top: 0, spacing: 0 }, [
			row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
				column( { width: 36, spacing: 12, more: { width_tablet: percent( 100 ) } }, [ kicker( 'How it is made' ), heading( 'Every page is read aloud before it is printed' ) ] ),
				column( { width: 64, more: { width_tablet: percent( 100 ) } }, [ text( '<p>We go to one place, one kitchen and one workshop for each issue, and we stay longer than is sensible. Nothing is written from a press release, and nobody we write about pays to be in the magazine.</p><p>When the stories are set, we spread the proofs over the big table and mark them by hand, as in the picture above. A sentence that cannot be read aloud without stumbling is rewritten.</p><p>There is no advertising. The magazine is paid for by the people who read it, which is the only arrangement we have found that lets us write what we saw.</p>', { size: px( 18 ) } ) ] ),
			] ),
		] ),
		section( { top: 0, spacing: 36 }, [
			banner( 'The writers' ),
			grid( { columns: 3, spacing: 40 }, Object.values( writers ).map( ( writer, index ) => column( { spacing: 12 }, [
				container( { content_width: 'full', width: px( 140 ), padding: box( 0 ) }, [ image( writer.uid, { more: { image_border_radius: box( 200 ), ...( index === 0 ? { link_to: 'custom', link: link( page( 'author' ) ) } : {} ) } } ) ] ),
				kicker( writer.beat ),
				heading( writer.name, { tag: 'h3', more: index === 0 ? { link: link( page( 'author' ) ) } : {} } ),
				text( `<p>${ writer.bio }</p>` ),
			] ) ) ),
		] ),
		subscribeBand(),
	],
};

pages.author = {
	title: 'Marta Lind',
	slug: 'marta-lind',
	content: [
		section( { top: 64, bottom: 56, spacing: 0 }, [
			row( { spacing: 48, align: 'center', more: { flex_direction_mobile: 'column', flex_align_items_mobile: 'flex-start' } }, [
				container( { content_width: 'full', width: px( 200 ), width_mobile: px( 140 ), padding: box( 0 ), _flex_size: 'none' }, [ image( 'author-1', { more: { image_border_radius: box( 200 ) } } ) ] ),
				column( { spacing: 12 }, [ kicker( 'Writer · Places' ), heading( 'Marta Lind', { tag: 'h1' } ), text( `<p>${ writers.marta.bio } She has written the Places pages of Common Ground since the first issue.</p>`, { size: px( 19 ) } ), fact( `Write to her at ${ EMAIL }`, { color: C.grey, more: { link: link( `mailto:${ EMAIL }` ) } } ) ] ),
			] ),
		] ),
		section( { top: 0, spacing: 32 }, [ banner( 'Stories by Marta Lind' ), stories( { count: 3, term: 'places', tag: 'h3' } ) ] ),
		subscribeBand(),
	],
};

pages.subscribe = {
	title: 'Subscribe',
	content: [
		pageHero( 'Subscribe', 'Four issues a year, through your letterbox', 'One price, no renewals by surprise. We write to you before the year is up and ask whether you would like another.' ),
		section( { top: 0, spacing: 0 }, [
			row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
				column( { width: 50, spacing: 28, more: { width_tablet: percent( 100 ) } }, [
					image( 'subscribe' ),
					grid( { columns: 3, tablet: 3, spacing: 24, more: { grid_columns_grid_mobile: { unit: 'fr', size: 1, sizes: [] } } }, [ [ '4', 'issues a year' ], [ '9', 'stories in each' ], [ '0', 'advertisements' ] ].map( ( [ number, label ] ) => container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 2 ), padding: box( 14, 0, 0, 0 ), border_border: 'solid', border_width: box( 3, 0, 0, 0 ), border_color: C.ink }, [ heading( number, { tag: 'p', size: px( 40 ) } ), fact( label, { color: C.grey } ) ] ) ) ),
				] ),
				column( { width: 50, spacing: 18, more: { width_tablet: percent( 100 ) } }, [
					heading( 'Start with the next issue', { tag: 'h2' } ),
					text( '<p>Leave your name and address. We reply with the price for your country and how to pay; nothing is charged from this form.</p>' ),
					form( 'Subscribe', [ [ 'name', 'text', 'Your name' ], [ 'email', 'email', 'Email' ], [ 'address', 'textarea', 'Postal address' ] ], 'Ask for a subscription', 'A new subscriber', 'Thank you. We will write to you within two working days.' ),
				] ),
			] ),
		] ),
	],
};

pages.contact = {
	title: 'Contact',
	content: [
		pageHero( 'Contact', 'Letters, corrections and places we should go', 'We read everything and answer most of it. Corrections are printed in the next issue, on the same page as the mistake.' ),
		section( { top: 0, spacing: 0 }, [
			row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
				column( { width: 56, spacing: 18, more: { width_tablet: percent( 100 ) } }, [ heading( 'Write to the editors', { tag: 'h2' } ), form( 'Contact', [ [ 'name', 'text', 'Your name', '50' ], [ 'email', 'email', 'Email', '50' ], [ 'message', 'textarea', 'Your letter' ] ], 'Send', 'A letter to the editors', 'Thank you. Your letter has reached us.' ) ] ),
				column( { width: 44, spacing: 0, more: { width_tablet: percent( 100 ) } }, [ [ 'Letters', EMAIL, `mailto:${ EMAIL }` ], [ 'Subscriptions', 'See the subscription page', page( 'subscribe' ) ], [ 'By post', 'Common Ground, 4 Printers’ Yard', null ] ].map( ( [ name, value, url ] ) =>
					container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( 4 ), padding: box( 18, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: C.rule }, [ kicker( name ), heading( value, { tag: 'p', size: px( 21 ), more: url ? { link: link( url ) } : {} } ) ] ) ) ),
			] ),
		] ),
	],
};

// The page that lists every story: shown by the archive template.
pages.stories = { title: 'All Stories', slug: 'stories', plain: true };

/* -------------------------------------------------------------------------
   Theme Builder templates (Elementor Pro)
   ---------------------------------------------------------------------- */
// The name of the section alone ("Table"), without the word "Category" WordPress puts before it.
const sectionName = `[elementor-tag id="" name="archive-title" settings="${ encodeURIComponent( JSON.stringify( { include_context: '' } ) ) }"]`;

const storyList = () =>
	widget( 'archive-posts', { archive_classic_thumbnail_size_size: 'medium_large', archive_classic_columns: '3', archive_classic_columns_tablet: '2', archive_classic_columns_mobile: '1', archive_classic_show_excerpt: 'yes', archive_classic_excerpt_length: 18, archive_classic_meta_data: [ 'date' ], archive_classic_show_read_more: '', archive_classic_title_tag: 'h2', ...noRatio( 'archive_classic' ), archive_classic_title_color: C.ink, archive_classic_excerpt_color: C.text, archive_classic_meta_color: C.grey, archive_classic_meta_typography_typography: 'custom', archive_classic_meta_typography_font_family: SANS, archive_classic_meta_typography_font_size: px( 13 ), archive_classic_row_gap: px( 52 ), archive_classic_column_gap: px( 32 ), pagination_type: 'numbers', nothing_found_message: 'Nothing here yet.' } );

const wordmark = ( size, color = C.ink ) => heading( 'Common Ground', { tag: 'p', color, align: 'center', size, weight: 700, more: { link: link( page( 'home' ) ), typography_letter_spacing: px( -0.5 ), typography_line_height: em( 1 ) } } );

const templates = {
	header: {
		title: 'Masthead',
		type: 'header',
		conditions: [ [ 'include', 'general' ] ],
		content: [
			container( { content_width: 'boxed', flex_direction: 'column', flex_gap: gap( 0 ), padding: box( 0, 24 ), padding_mobile: box( 0, 20 ), background_background: 'classic', background_color: C.white }, [
				container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'space-between', padding: box( 10, 0 ), border_border: 'solid', border_width: box( 0, 0, 1, 0 ), border_color: C.rule }, [
					fact( 'Places, food and craft · Four issues a year', { color: C.grey, size: 13 } ),
					fact( 'Subscribe →', { color: C.red, size: 13, weight: 800, more: { link: link( page( 'subscribe' ) ), _flex_size: 'none' } } ),
				] ),
				container( { content_width: 'full', flex_direction: 'column', flex_align_items: 'center', padding: box( 26, 0, 22, 0 ), padding_mobile: box( 18, 0, 14, 0 ) }, [ wordmark( fluid( 'clamp(2.125rem, 1.4rem + 3.4vw, 3.75rem)' ) ) ] ),
				container( { content_width: 'full', flex_direction: 'column', flex_align_items: 'stretch', padding: box( 0 ), border_border: 'solid', border_width: box( 3, 0, 1, 0 ), border_color: C.ink }, [
					widget( 'nav-menu', { menu: menu( 'primary' ), layout: 'horizontal', align_items: 'center', pointer: 'none', dropdown: 'mobile', full_width: 'stretch', text_align: 'center', toggle: 'burger', toggle_align: 'center', menu_typography_typography: 'custom', menu_typography_font_family: SANS, menu_typography_font_size: px( 14 ), menu_typography_font_weight: '700', menu_typography_text_transform: 'uppercase', menu_typography_letter_spacing: px( 1.4 ), color_menu_item: C.ink, color_menu_item_hover: C.red, color_menu_item_active: C.red, padding_horizontal_menu_item: px( 18 ), padding_vertical_menu_item: px( 14 ), color_dropdown_item: C.ink, background_color_dropdown_item: C.white, color_dropdown_item_hover: C.white, background_color_dropdown_item_hover: C.ink, toggle_color: C.ink, toggle_background_color: C.white, toggle_size: px( 30 ) } ),
				] ),
			] ),
		],
	},
	footer: {
		title: 'Footer',
		type: 'footer',
		conditions: [ [ 'include', 'general' ] ],
		content: [
			b.section( { background: C.ink, top: 64, bottom: 28, spacing: 36 }, [
				column( { spacing: 12, align: 'center' }, [ wordmark( px( 34 ), C.white ), fact( 'A magazine of places, food and craft. Printed four times a year.', { color: C.onInk, align: 'center' } ) ] ),
				container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content: 'center', flex_gap: gap( 28, 10 ), padding: box( 18, 0 ), border_border: 'solid', border_width: box( 1, 0, 1, 0 ), border_color: '#3A3A3A' },
					[ [ 'Places', category( 'places' ) ], [ 'Table', category( 'table' ) ], [ 'Craft', category( 'craft' ) ], [ 'All stories', page( 'stories' ) ], [ 'About', page( 'about' ) ], [ 'Subscribe', page( 'subscribe' ) ], [ 'Contact', page( 'contact' ) ] ].map( ( [ name, url ] ) => fact( name, { color: C.white, size: 14, weight: 700, more: { link: link( url ), _flex_size: 'none' } } ) ) ),
				fact( 'Sample content: Common Ground is a fictional magazine made for the Open Frame Magazine starter site. The stories, people and places are invented around the photographs, as examples to replace with your own.', { color: C.onInk, size: 13, weight: 400, align: 'center' } ),
			] ),
		],
	},
	archive: {
		title: 'All stories',
		type: 'archive',
		// The page that lists the posts. Elementor Pro has no title of its own for it, so the heading is written here.
		conditions: [ [ 'include', 'archive', 'post_archive' ] ],
		content: [ pageHero( 'The archive', 'All stories', 'Everything we have printed, newest first.' ), section( { top: 0, spacing: 0 }, [ storyList() ] ), subscribeBand() ],
	},
	'archive-terms': {
		title: 'A section of the magazine',
		type: 'archive',
		conditions: [ [ 'include', 'archive' ] ],
		content: [
			section( { top: 64, bottom: 40, spacing: 12 }, [ kicker( 'Section' ), widget( 'theme-archive-title', { __dynamic__: { title: sectionName }, header_size: 'h1', title_color: C.ink } ) ] ),
			section( { top: 0, spacing: 0 }, [ storyList() ] ),
			subscribeBand(),
		],
	},
	single: {
		title: 'Story',
		type: 'single-post',
		conditions: [ [ 'include', 'singular', 'post' ] ],
		content: [
			section( { top: 56, bottom: 36, spacing: 16 }, [
				column( { width: 70, spacing: 16, align: 'center', more: { _flex_align_self: 'center' } }, [
					widget( 'post-info', { view: 'inline', align: 'center', icon_list: [ { _id: 'terms', type: 'terms', taxonomy: 'category', show_icon: 'none' }, { _id: 'date', type: 'date', show_icon: 'none' } ], text_color: C.red, icon_typography_typography: 'custom', icon_typography_font_family: SANS, icon_typography_font_size: px( 13 ), icon_typography_font_weight: '800', icon_typography_text_transform: 'uppercase', icon_typography_letter_spacing: px( 2.2 ), space_between: px( 18 ) } ),
					widget( 'theme-post-title', { __dynamic__: { title: dynamic( 'post-title' ) }, header_size: 'h1', title_color: C.ink, align: 'center' } ),
					widget( 'theme-post-excerpt', { __dynamic__: { excerpt: dynamic( 'post-excerpt' ) }, text_color: C.text, align: 'center', typography_typography: 'custom', typography_font_family: SERIF, typography_font_size: px( 21 ), typography_line_height: em( 1.5 ) } ),
				] ),
			] ),
			section( { top: 0, bottom: 48, spacing: 0 }, [ widget( 'theme-post-featured-image', { __dynamic__: { image: dynamic( 'post-featured-image' ) }, image_size: 'full' } ) ] ),
			section( { top: 0, spacing: 40 }, [
				column( { width: 62, spacing: 36, more: { _flex_align_self: 'center', width_tablet: percent( 100 ) } }, [
					widget( 'theme-post-content', { text_color: C.text, typography_typography: 'custom', typography_font_family: SERIF, typography_font_size: px( 19 ), typography_line_height: em( 1.75 ) } ),
					container( { content_width: 'full', flex_direction: 'column', padding: box( 20, 0, 0, 0 ), border_border: 'solid', border_width: box( 3, 0, 0, 0 ), border_color: C.ink }, [ widget( 'post-navigation', { show_label: 'yes', prev_label: 'Previous story', next_label: 'Next story', show_arrow: '', show_title: 'yes', label_color: C.grey, text_color: C.ink, hover_color: C.red } ) ] ),
				] ),
			] ),
			subscribeBand(),
		],
	},
	'not-found': {
		title: 'Page not found',
		type: 'error-404',
		conditions: [ [ 'include', 'singular', 'not_found404' ] ],
		content: [
			section( { top: 112, bottom: 112, spacing: 18 }, [
				column( { width: 70, spacing: 18, align: 'center', more: { _flex_align_self: 'center' } }, [
					kicker( 'Error 404', { align: 'center' } ),
					heading( 'This page was never printed', { tag: 'h1', align: 'center' } ),
					text( '<p>The address may be mistyped, or the story may have moved to the archive.</p>', { align: 'center', size: px( 19 ) } ),
					row( { spacing: 14, align: 'center', justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content_mobile: 'center' } }, [ button( 'Back to the front page', page( 'home' ) ), button( 'All stories', page( 'stories' ), { more: outline } ) ] ),
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
		{ _id: 'primary', title: 'Primary', color: C.ink },
		{ _id: 'secondary', title: 'Secondary', color: C.ink },
		{ _id: 'text', title: 'Text', color: C.text },
		{ _id: 'accent', title: 'Accent', color: C.red },
	],
	custom_colors: [
		{ _id: 'ofpaper', title: 'Paper', color: C.paper },
		{ _id: 'ofrule', title: 'Rule', color: C.rule },
		{ _id: 'ofgrey', title: 'Grey', color: C.grey },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: SERIF, typography_font_weight: '700' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '600' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: SANS, typography_font_weight: '700' },
	],
	container_width: px( 1200 ),
	body_background_background: 'classic',
	body_background_color: C.white,
	body_color: C.text,
	...sansType( 'body', { fontSize: px( 17 ), weight: 400, lineHeight: 1.65 } ),
	link_normal_color: C.ink,
	link_hover_color: C.red,
	h1_color: C.ink,
	...serifType( 'h1', { fontSize: fluid( 'clamp(2.125rem, 1.4rem + 3.2vw, 3.75rem)' ), weight: 700, lineHeight: 1.08, spacing: -0.02 } ),
	h2_color: C.ink,
	...serifType( 'h2', { fontSize: fluid( 'clamp(1.625rem, 1.3rem + 1.5vw, 2.375rem)' ), weight: 700, lineHeight: 1.15, spacing: -0.015 } ),
	h3_color: C.ink,
	...serifType( 'h3', { fontSize: fluid( 'clamp(1.25rem, 1.15rem + 0.45vw, 1.5rem)' ), weight: 700, lineHeight: 1.25, spacing: -0.01 } ),
	h4_color: C.ink,
	...sansType( 'h4', { fontSize: px( 16 ), weight: 700, lineHeight: 1.4 } ),
	...sansType( 'button', { fontSize: px( 14 ), weight: 700, lineHeight: 1.2 } ),
	button_text_color: C.white,
	button_background_color: C.ink,
	button_hover_text_color: C.white,
	button_hover_background_color: C.red,
	button_border_radius: box( 0 ),
	button_padding: box( 15, 26 ),
};

const themeMods = {
	open_frame_follow_elementor: true,
	open_frame_color_primary: C.ink.toLowerCase(),
	open_frame_color_primary_hover: C.red.toLowerCase(),
	open_frame_color_heading: C.ink.toLowerCase(),
	open_frame_color_text: C.text.toLowerCase(),
	open_frame_color_link: C.ink.toLowerCase(),
	open_frame_color_link_hover: C.red.toLowerCase(),
	open_frame_color_accent: C.red.toLowerCase(),
	open_frame_color_border: C.rule.toLowerCase(),
	open_frame_color_bg: C.white.toLowerCase(),
	open_frame_container_width: 1200,
	open_frame_single_layout: 'no-sidebar',
	open_frame_page_layout: 'no-sidebar',
};

// The photographs, with where each came from (photos.json, written by tools/sites/photos.mjs).
// Elementor Pro links the covers to their stories, so each is named after its story.
const mediaIndex = photoIndex( OUT, {
	...Object.fromEntries( Object.values( writers ).map( ( writer ) => [ writer.uid, `Portrait of ${ writer.name }` ] ) ),
	...Object.fromEntries( posts.map( ( item ) => [ item.image, `Picture for the story “${ item.title }”` ] ) ),
} );

const fonts = [
	{ family: SERIF, weight: '200 900', style: 'normal', file: 'literata-latin.woff2', licence: 'OFL-1.1. Copyright 2017 The Literata Project Authors.' },
	{ family: SANS, weight: '100 900', style: 'normal', file: 'public-sans-latin.woff2', licence: 'OFL-1.1. Copyright 2015 The Public Sans Project Authors.' },
];

const used = writeSite( {
	site: SITE,
	out: OUT,
	pages,
	templates,
	posts,
	kit,
	themeMods,
	options: { show_on_front: 'page', page_on_front: page( 'home' ), page_for_posts: page( 'stories' ) },
	menus: [ { uid: 'primary', name: 'Primary', location: 'primary', items: [ [ 'Places', category( 'places' ) ], [ 'Table', category( 'table' ) ], [ 'Craft', category( 'craft' ) ], [ 'All stories', page( 'stories' ) ], [ 'About', page( 'about' ) ], [ 'Subscribe', page( 'subscribe' ) ] ].map( ( [ title, url ] ) => ( { title, url } ) ) } ],
	media: mediaIndex,
	fonts,
	catalog: {
		summary: 'An editorial front page for a magazine or blog: a cover story, sections by category, a ruled masthead, a calm article layout, writers, and subscription and contact forms. Masthead, footer, lists and articles are Theme Builder templates.',
		colors: [ C.white.toLowerCase(), C.red.toLowerCase(), C.ink.toLowerCase() ],
		pages: [ 'Front Page', 'Category', 'Single Article', 'Author', 'About', 'Subscribe', 'Contact', 'All Stories', '404' ],
		screenshots: [ { title: 'A story', file: 'story.png' }, { title: 'A section', file: 'section.png' }, { title: 'About', file: 'about.png' } ],
		requires: { importer: '0.6.0' },
	},
} );

console.log( `Magazine: ${ Object.keys( pages ).length } pages, ${ Object.keys( templates ).length } templates, ${ posts.length } posts. Widgets: ${ used.join( ', ' ) }` );
