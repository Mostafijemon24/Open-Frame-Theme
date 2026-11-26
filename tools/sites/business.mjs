#!/usr/bin/env node
/**
 * The Business starter site ("Halden Advisory"), written as data.
 *
 *   node tools/sites/business.mjs
 *
 * Writes starter-sites/business/{site.json, site/, content/, media/index.json}.
 * The images come from tools/sites/business-art.mjs. See brief.md in the site
 * folder for the design decisions this file implements.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { box, builders, em, fluid, gap, icon, ids, link, page, percent, px, widgetsOf, writeJson } from './kit.mjs';

const SITE = 'business';
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', SITE );

/* -------------------------------------------------------------------------
   Design tokens (see brief.md)
   ---------------------------------------------------------------------- */
const C = {
	brand: '#2456E6',
	brandDark: '#1A3FB4',
	ink: '#0B1F3A',
	text: '#46546A',
	accent: '#F2A93B',
	tint: '#F3F6FB',
	line: '#DCE3EE',
	white: '#FFFFFF',
	mist: '#B7C4D8', // Text on the dark band.
	haze: '#DCE6FF', // Text on the brand band.
};
const FONT = 'Hanken Grotesk';

const b = builders( ids() );
const { row, column, grid, heading, text, button, image, list, counter, container, widget } = b;

/** Sections are white unless they say otherwise; the theme's page background is the tint, used by the blog. */
const section = ( options, elements ) => b.section( { background: C.white, ...options }, elements );

/* -------------------------------------------------------------------------
   Components of this design
   ---------------------------------------------------------------------- */

/** Small uppercase label above a heading. */
const eyebrow = ( label, color = C.brand ) =>
	heading( label, { tag: 'p', color, size: px( 13 ), weight: 700, more: { typography_text_transform: 'uppercase', typography_letter_spacing: px( 1.4 ) } } );

/** Eyebrow, heading and optional lead, as one block. */
const intro = ( label, title, lead, { tag = 'h2', align, dark = false, width = 62 } = {} ) =>
	column( { width, spacing: 16, ...( align === 'center' ? { align: 'center', more: { align_self: 'center' } } : {} ) }, [
		eyebrow( label, dark ? C.accent : C.brand ),
		heading( title, { tag, align, ...( dark ? { color: C.white } : {} ) } ),
		...( lead ? [ text( `<p>${ lead }</p>`, { align, size: px( 19 ), ...( dark ? { color: C.mist } : {} ) } ) ] : [] ),
	] );

const outline = { background_color: 'transparent', button_text_color: C.ink, border_border: 'solid', border_width: box( 1.5 ), border_color: C.line, hover_color: C.brand, button_background_hover_color: C.tint, button_hover_border_color: C.brand };
const onDark = { background_color: C.white, button_text_color: C.ink, hover_color: C.ink, button_background_hover_color: C.accent };

/** A white card with a hairline border. */
const card = ( elements, { spacing = 14, padding = 32, more = {} } = {} ) =>
	container(
		{
			content_width: 'full',
			flex_direction: 'column',
			flex_gap: gap( spacing ),
			padding: box( padding ),
			padding_mobile: box( 24 ),
			background_background: 'classic',
			background_color: C.white,
			border_border: 'solid',
			border_width: box( 1 ),
			border_color: C.line,
			border_radius: box( 16 ),
			...more,
		},
		elements
	);

/** The numbered service card: a number, a title, a line of text and a link. */
const serviceCard = ( number, title, body, url, tag = 'h3' ) =>
	card( [
		heading( number, { tag: 'p', color: C.brand, size: px( 14 ), weight: 700, more: { typography_letter_spacing: px( 1 ) } } ),
		heading( title, { tag, ...( tag === 'h3' ? {} : { size: fluid( 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)' ) } ) } ),
		text( `<p>${ body }</p>` ),
		button( 'Learn more', url, { more: { ...outline, size: 'sm' } } ),
	] );

/** The top of an inner page: label, title and lead on the tinted band. */
const pageHero = ( label, title, lead ) =>
	section( { background: C.tint, top: 96, bottom: 88, spacing: 0 }, [ intro( label, title, lead, { tag: 'h1', width: 66 } ) ] );

/** The closing call to action, shared by every page. */
const callToAction = ( title = 'Have a decision that cannot wait?', lead = 'Tell us where you are stuck. You will hear from a partner within one working day.' ) =>
	section( { background: C.brand, top: 88, spacing: 32 }, [
		row( { align: 'center', justify: 'space-between', spacing: 40 }, [
			column( { width: 64, spacing: 12 }, [ heading( title, { tag: 'h2', color: C.white } ), text( `<p>${ lead }</p>`, { color: C.haze, size: px( 18 ) } ) ] ),
			column( { width: 30, align: 'flex-end', more: { flex_align_items_mobile: 'flex-start' } }, [ button( 'Start a conversation', page( 'contact' ), { more: { ...onDark, size: 'md' } } ) ] ),
		] ),
	] );

/** A band of four figures. */
const figures = ( items, { dark = true } = {} ) =>
	section( { background: dark ? C.ink : C.white, top: 80, spacing: 0 }, [
		grid( { columns: 4, tablet: 2, spacing: 32 }, items.map( ( [ number, title, extra = {} ] ) => counter( number, title, { color: dark ? C.white : C.ink, titleColor: dark ? C.mist : C.text, ...extra } ) ) ),
	] );

/** Questions and answers, as plain headings and text: readable without JavaScript, editable as ordinary widgets. */
const questions = ( items ) =>
	column( { spacing: 0 }, items.flatMap( ( [ question, answer ], index ) => [
		...( index ? [ b.divider( C.line ) ] : [] ),
		column( { spacing: 8, more: { padding: box( 20, 0, 20, 0 ) } }, [ heading( question, { tag: 'h3', size: px( 19 ) } ), text( `<p>${ answer }</p>` ) ] ),
	] ) );

/* -------------------------------------------------------------------------
   Content
   ---------------------------------------------------------------------- */
const services = [
	[ 'Strategy', 'Where to play, and what to stop doing. A plan your leadership team wrote with us, not one handed to them.' ],
	[ 'Operations', 'Shorter lead times and fewer handoffs. We map the work as it really happens, then remove what does not earn its place.' ],
	[ 'Finance', 'Forecasts people believe, pricing that reflects cost to serve, and a monthly close that takes days instead of weeks.' ],
	[ 'People and organisation', 'Roles, decision rights and incentives that match the strategy, so good people stop working around the structure.' ],
	[ 'Technology', 'Vendor-neutral advice on what to build, buy or retire, with a delivery plan sized to the team you actually have.' ],
	[ 'Growth', 'Which customers to win next, through which channels, at what price. Tested in the market before it reaches the budget.' ],
];

const projects = [
	{ uid: 'project-harbor', name: 'Harbor Freight Lines', sector: 'Logistics', result: 'Delivery lead time cut from nine days to four', text: 'A regional carrier was losing contracts to faster rivals. We rebuilt dispatch around three hubs instead of seven.' },
	{ uid: 'project-alder', name: 'Alder Health Group', sector: 'Healthcare', result: 'Waiting list down 38% in two quarters', text: 'Twelve clinics, twelve ways of booking. One shared schedule freed more capacity than two new sites would have.' },
	{ uid: 'project-kestrel', name: 'Kestrel Components', sector: 'Manufacturing', result: 'Margin up 4.2 points without a price rise', text: 'A cost-to-serve model showed a third of the catalogue lost money. The range was cut and the plant got quieter.' },
	{ uid: 'project-lumen', name: 'Lumen Mutual', sector: 'Financial services', result: 'Month-end close from fourteen days to five', text: 'Finance spent half the month reconciling. We removed 60 manual journals and gave the team its evenings back.' },
];

const team = [
	{ uid: 'team-1', name: 'Marit Halden', role: 'Founding partner, strategy', bio: 'Twenty years advising owner-led companies. Previously ran corporate development at a listed industrial group.' },
	{ uid: 'team-2', name: 'Tomas Okafor', role: 'Partner, operations', bio: 'Trained as a production engineer. Has redesigned plants, warehouses and one very busy hospital laundry.' },
	{ uid: 'team-3', name: 'Ines Carvalho', role: 'Partner, finance', bio: 'Former group controller. Believes a forecast is only useful if the sales team recognises its own numbers in it.' },
	{ uid: 'team-4', name: 'Daniel Reyes', role: 'Principal, technology', bio: 'Fifteen years delivering systems, long enough to prefer the boring option that the team can run on Monday.' },
];

const posts = [
	{ name: 'cost-to-serve', title: 'Your best customer may be your least profitable', excerpt: 'Revenue hides what it costs to serve an account. A simple model, built in a week, usually changes who gets the attention.', image: 'post-1', category: 'Finance', days: 6 },
	{ name: 'strategy-on-a-page', title: 'If the strategy does not fit on a page, nobody will use it', excerpt: 'Long documents are where decisions go to be postponed. What to keep, what to cut, and how to tell them apart.', image: 'post-2', category: 'Strategy', days: 19 },
	{ name: 'meeting-audit', title: 'Cancel a third of your recurring meetings and see what breaks', excerpt: 'Most standing meetings outlive the problem they were created for. A two-week experiment that costs nothing.', image: 'post-3', category: 'Operations', days: 33 },
];

/* -------------------------------------------------------------------------
   Pages
   ---------------------------------------------------------------------- */
const pages = {};

pages.home = {
	title: 'Home',
	front_page: true,
	content: [
		section( { top: 88, bottom: 96, spacing: 0 }, [
			row( { align: 'center', spacing: 64, tablet: 'column' }, [
				column( { width: 52, spacing: 24, more: { width_tablet: percent( 100 ) } }, [
					eyebrow( 'Independent advisory for mid-sized companies' ),
					heading( 'Clear decisions for companies that have outgrown guesswork', { tag: 'h1' } ),
					text( '<p>Halden helps leadership teams choose a direction, fix the operations behind it and prove it in the numbers. Senior people, plain language, work you can check.</p>', { size: px( 19 ) } ),
					row( { spacing: 12, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap' } }, [ button( 'Start a conversation', page( 'contact' ) ), button( 'See our work', page( 'projects' ), { more: outline } ) ] ),
				] ),
				column( { width: 48, more: { width_tablet: percent( 100 ) } }, [ image( 'hero', { radius: 20 } ) ] ),
			] ),
		] ),

		section( { top: 0, bottom: 72, spacing: 20 }, [
			b.divider( C.line ),
			row( { align: 'center', spacing: 32, justify: 'space-between' }, [
				heading( 'Trusted by teams in logistics, healthcare, manufacturing and finance', { tag: 'p', color: C.text, size: px( 15 ), weight: 500 } ),
				heading( 'Harbor · Alder · Kestrel · Lumen · Northgate', { tag: 'p', color: C.ink, size: px( 17 ), weight: 700, more: { typography_letter_spacing: px( 0.4 ) } } ),
			] ),
		] ),

		section( { background: C.tint, spacing: 48 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [
				intro( 'What we do', 'Six practices, one team in the room', 'Most problems cross departments. So do we: the people who shape the plan stay to see it work.', { width: 60 } ),
				button( 'All services', page( 'services' ), { more: outline } ),
			] ),
			grid( { columns: 3 }, services.slice( 0, 3 ).map( ( [ title, body ], index ) => serviceCard( '0' + ( index + 1 ), title, body, page( 'service-details' ) ) ) ),
		] ),

		section( { spacing: 0 }, [
			row( { align: 'center', spacing: 72, tablet: 'column' }, [
				column( { width: 46, more: { width_tablet: percent( 100 ) } }, [ image( 'about', { radius: 20 } ) ] ),
				column( { width: 54, spacing: 22, more: { width_tablet: percent( 100 ) } }, [
					eyebrow( 'How we work' ),
					heading( 'Small teams, senior people, no slide factories' ),
					text( '<p>You work with the partners you met in the first meeting. We spend our time on your floor and in your data, and we write things down in a way your team can use after we leave.</p>' ),
					list( [ 'A fixed scope and a fixed fee, agreed before we start', 'Weekly working sessions with the people who do the work', 'Results measured against numbers you already report' ], { color: C.ink, iconColor: C.brand } ),
					button( 'About Halden', page( 'about' ), { more: outline } ),
				] ),
			] ),
		] ),

		figures( [ [ 140, 'engagements completed', { suffix: '+' } ], [ 12, 'years in practice' ], [ 92, 'of clients return', { suffix: '%' } ], [ 4, 'partners, all hands-on' ] ] ),

		section( { spacing: 48 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'Selected work', 'Results our clients put their name to', null, { width: 60 } ), button( 'All projects', page( 'projects' ), { more: outline } ) ] ),
			grid( { columns: 2, spacing: 32 }, projects.slice( 0, 2 ).map( ( project ) =>
				column( { spacing: 16 }, [
					image( project.uid, { radius: 16 } ),
					eyebrow( project.sector ),
					heading( project.result, { tag: 'h3' } ),
					text( `<p>${ project.text }</p>` ),
					button( 'Read the case', page( 'project-details' ), { more: { ...outline, size: 'sm', align: 'left' } } ),
				] )
			) ),
		] ),

		section( { background: C.tint, top: 96, spacing: 0 }, [
			column( { width: 78, spacing: 24, more: { align_self: 'center' } }, [
				heading( '“They told us which half of our plan to drop. It was the half we were most proud of, and they were right.”', { tag: 'p', color: C.ink, size: fluid( 'clamp(1.5rem, 1.1rem + 1.6vw, 2.125rem)' ), weight: 600, align: 'center', more: { typography_line_height: em( 1.3 ) } } ),
				text( '<p><strong>Priya Nair</strong>, Chief Executive, Kestrel Components</p>', { align: 'center' } ),
			] ),
		] ),

		callToAction(),
	],
};

pages.about = {
	title: 'About',
	content: [
		pageHero( 'About Halden', 'An advisory firm small enough to care how it turns out', 'Founded in 2014 by four people who were tired of handing over reports and never hearing what happened next.' ),
		section( { spacing: 0 }, [
			row( { align: 'center', spacing: 72, tablet: 'column' }, [
				column( { width: 54, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					heading( 'We stay until it works' ),
					text( '<p>Halden began with a simple rule: nobody sells work they will not do themselves. Twelve years on, the firm is still owned by its partners, still takes on fewer than fifteen clients a year, and still measures itself by what changed after the engagement ended.</p><p>Our clients are companies with fifty to two thousand people. Large enough for problems to cross departments, small enough that a decision made on Tuesday can be felt by Friday.</p>' ),
				] ),
				column( { width: 46, more: { width_tablet: percent( 100 ) } }, [ image( 'approach', { radius: 20 } ) ] ),
			] ),
		] ),
		section( { background: C.tint, spacing: 48 }, [
			intro( 'What we hold to', 'Four habits that shape every engagement' ),
			grid( { columns: 4, tablet: 2 }, [
				[ 'Say it plainly', 'If a recommendation needs jargon to sound convincing, it is not ready.' ],
				[ 'Show the working', 'Every number can be traced to your own data. You keep the models.' ],
				[ 'Fewer, better', 'We would rather finish three changes than start ten.' ],
				[ 'Leave it stronger', 'Your team should need us less at the end than at the start.' ],
			].map( ( [ title, body ] ) => card( [ heading( title, { tag: 'h3', size: px( 20 ) } ), text( `<p>${ body }</p>` ) ], { padding: 28 } ) ) ),
		] ),
		figures( [ [ 12, 'years in practice' ], [ 15, 'clients a year, at most' ], [ 31, 'people across two offices' ], [ 100, 'partner-owned', { suffix: '%' } ] ], { dark: false } ),
		section( { background: C.tint, spacing: 40 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'The partners', 'The people you will actually work with', null, { width: 60 } ), button( 'Meet the team', page( 'team' ), { more: outline } ) ] ),
			grid( { columns: 4, tablet: 2 }, team.map( ( person ) => column( { spacing: 12 }, [ image( person.uid, { radius: 16 } ), heading( person.name, { tag: 'h3', size: px( 19 ) } ), text( `<p>${ person.role }</p>`, { size: px( 15 ) } ) ] ) ) ),
		] ),
		callToAction( 'Want to know if we are the right fit?', 'A first conversation costs nothing and usually tells both sides what they need to know.' ),
	],
};

pages.services = {
	title: 'Services',
	content: [
		pageHero( 'Services', 'Advice across the business, from one team', 'Engagements usually start in one practice and finish in three. That is why ours share an office, a method and a client list.' ),
		section( { spacing: 0 }, [ grid( { columns: 3 }, services.map( ( [ title, body ], index ) => serviceCard( '0' + ( index + 1 ), title, body, page( 'service-details' ), 'h2' ) ) ) ] ),
		section( { background: C.tint, spacing: 48 }, [
			intro( 'How an engagement runs', 'Four stages, each with something you can hold' ),
			grid( { columns: 4, tablet: 2 }, [
				[ 'Week 1 to 2', 'Diagnose', 'Interviews, site visits and your own data. You receive a short paper on what is really going on.' ],
				[ 'Week 3 to 5', 'Decide', 'Options with costs and consequences. Your leadership team chooses in a working session.' ],
				[ 'Week 6 to 12', 'Deliver', 'We work alongside your team on the first changes, where plans usually meet reality.' ],
				[ 'After', 'Sustain', 'A quarterly review for a year, included in the fee, to check that results have held.' ],
			].map( ( [ when, title, body ] ) => column( { spacing: 10, more: { padding: box( 0, 0, 0, 20 ), border_border: 'solid', border_width: box( 0, 0, 0, 2 ), border_color: C.brand } }, [ eyebrow( when ), heading( title, { tag: 'h3', size: px( 22 ) } ), text( `<p>${ body }</p>` ) ] ) ) ),
		] ),
		callToAction(),
	],
};

pages[ 'service-details' ] = {
	title: 'Strategy',
	slug: 'strategy',
	content: [
		pageHero( 'Services · Strategy', 'A strategy your team wrote and will actually follow', 'Not a document for the board pack. A small number of choices, the reasons for them, and what stops as a result.' ),
		section( { spacing: 0 }, [
			row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
				column( { width: 62, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					heading( 'What the work looks like' ),
					text( '<p>We start with the questions your team argues about: which customers matter most, where the next growth comes from, what you are prepared to be bad at. Then we find the evidence, usually in data you already hold.</p><p>The output is short. One page of choices, a plan for the first two quarters, and a list of the projects that are being stopped to make room.</p>' ),
					heading( 'When it is the right time', { tag: 'h3' } ),
					list( [ 'Growth has slowed and nobody agrees why', 'A new owner, investor or chief executive needs a shared plan', 'The portfolio has grown faster than the ability to manage it', 'A competitor has changed the economics of your market' ], { color: C.ink, iconColor: C.brand } ),
					heading( 'Questions we are asked', { tag: 'h3' } ),
					questions( [
						[ 'How long does it take?', 'Eight to ten weeks from the first interview to an agreed plan. Longer than that and the business has moved on.' ],
						[ 'Who needs to be involved?', 'Your leadership team for half a day a week. We do the legwork between sessions.' ],
						[ 'What if we disagree with the findings?', 'Then we go back to the evidence together. Every claim we make can be traced to a source you can inspect.' ],
					] ),
				] ),
				column( { width: 38, more: { width_tablet: percent( 100 ) } }, [
					card( [
						heading( 'What you receive', { tag: 'h3', size: px( 20 ) } ),
						list( [ 'A one-page strategy', 'A two-quarter delivery plan', 'The financial model behind it', 'A list of what stops', 'Four quarterly reviews' ], { color: C.ink, iconColor: C.brand } ),
						b.divider( C.line ),
						text( '<p><strong>Fixed fee</strong>, agreed before we start. Typical engagements run from eight to ten weeks.</p>', { size: px( 15 ) } ),
						button( 'Discuss your situation', page( 'contact' ), { more: { align: 'justify' } } ),
					], { spacing: 18, more: { background_color: C.tint, border_color: C.tint } } ),
				] ),
			] ),
		] ),
		callToAction(),
	],
};

pages.projects = {
	title: 'Projects',
	content: [
		pageHero( 'Projects', 'Work we are allowed to talk about', 'Four engagements, described with the numbers our clients agreed to publish.' ),
		section( { spacing: 0 }, [
			grid( { columns: 2, spacing: 40 }, projects.map( ( project ) =>
				column( { spacing: 16 }, [
					image( project.uid, { radius: 16 } ),
					eyebrow( project.sector ),
					heading( project.name, { tag: 'h2', size: px( 26 ) } ),
					text( `<p><strong>${ project.result }.</strong> ${ project.text }</p>` ),
					button( 'Read the case', page( 'project-details' ), { more: { ...outline, size: 'sm', align: 'left' } } ),
				] )
			) ),
		] ),
		callToAction( 'Facing something similar?', 'The details differ, the pattern rarely does. Tell us what you are seeing.' ),
	],
};

pages[ 'project-details' ] = {
	title: 'Harbor Freight Lines',
	slug: 'harbor-freight-lines',
	content: [
		pageHero( 'Projects · Logistics', 'Harbor Freight Lines: from nine days to four', 'A regional carrier was losing contracts to faster rivals. The answer was fewer hubs, not more trucks.' ),
		section( { top: 72, bottom: 0, spacing: 32 }, [
			image( 'project-harbor', { radius: 20 } ),
			grid( { columns: 4, tablet: 2, spacing: 24 }, [ [ 'Client', 'Harbor Freight Lines' ], [ 'Sector', 'Regional logistics' ], [ 'Duration', '14 weeks' ], [ 'Practices', 'Operations, finance' ] ].map( ( [ label, value ] ) => column( { spacing: 4 }, [ eyebrow( label, C.text ), heading( value, { tag: 'p', color: C.ink, size: px( 18 ), weight: 600 } ) ] ) ) ),
		] ),
		section( { spacing: 0 }, [
			grid( { columns: 3, spacing: 40 }, [
				[ 'The challenge', 'Seven depots, each planning its own routes. Parcels crossed the region twice before delivery, and customers had noticed.' ],
				[ 'What we did', 'Modelled a year of consignments, then tested a three-hub network with the dispatchers who would run it. The pilot ran on one corridor for a month.' ],
				[ 'What changed', 'Lead time fell from nine days to four. Two major contracts were renewed, and fuel cost per parcel dropped by 17%.' ],
			].map( ( [ title, body ] ) => column( { spacing: 12 }, [ heading( title, { tag: 'h2', size: px( 24 ) } ), text( `<p>${ body }</p>` ) ] ) ) ),
		] ),
		figures( [ [ 4, 'days average lead time, from 9' ], [ 17, 'lower fuel cost per parcel', { suffix: '%' } ], [ 3, 'hubs instead of seven depots' ], [ 2, 'major contracts renewed' ] ] ),
		section( { background: C.tint, top: 88, spacing: 0 }, [
			column( { width: 78, spacing: 20, more: { align_self: 'center' } }, [
				heading( '“The plan came from our own dispatchers. Halden made sure we listened to them.”', { tag: 'p', color: C.ink, size: fluid( 'clamp(1.4rem, 1.1rem + 1.4vw, 2rem)' ), weight: 600, align: 'center', more: { typography_line_height: em( 1.3 ) } } ),
				text( '<p><strong>Jonas Weber</strong>, Operations Director, Harbor Freight Lines</p>', { align: 'center' } ),
			] ),
		] ),
		callToAction( 'Facing something similar?', 'The details differ, the pattern rarely does. Tell us what you are seeing.' ),
	],
};

pages.team = {
	title: 'Team',
	content: [
		pageHero( 'Team', 'The people in the room', 'Four partners lead every engagement personally. Behind them, a team of analysts and specialists who have worked together for years.' ),
		section( { spacing: 0 }, [
			grid( { columns: 2, spacing: 40 }, team.map( ( person ) =>
				row( { spacing: 24, align: 'flex-start' }, [
					column( { width: 38 }, [ image( person.uid, { radius: 16 } ) ] ),
					column( { width: 62, spacing: 8 }, [ heading( person.name, { tag: 'h2', size: px( 24 ) } ), eyebrow( person.role ), text( `<p>${ person.bio }</p>` ) ] ),
				] )
			) ),
		] ),
		section( { background: C.tint, spacing: 0 }, [
			row( { align: 'center', justify: 'space-between', spacing: 40 }, [
				column( { width: 64, spacing: 12 }, [ heading( 'Join us' ), text( '<p>We hire a few people each year: analysts at the start of their careers and experienced specialists who want fewer clients and deeper work. If that sounds like you, write to us.</p>' ) ] ),
				button( 'careers@example.com', 'mailto:careers@example.com', { more: outline } ),
			] ),
		] ),
		callToAction(),
	],
};

const plan = ( name, price, period, lead, features, featured = false ) =>
	card(
		[
			heading( name, { tag: 'h2', size: px( 22 ), ...( featured ? { color: C.white } : {} ) } ),
			text( `<p>${ lead }</p>`, featured ? { color: C.mist } : {} ),
			heading( price, { tag: 'p', color: featured ? C.white : C.ink, size: fluid( 'clamp(2.25rem, 1.8rem + 1.8vw, 3rem)' ), weight: 700, more: { typography_line_height: em( 1 ) } } ),
			text( `<p>${ period }</p>`, { size: px( 15 ), ...( featured ? { color: C.mist } : {} ) } ),
			b.divider( featured ? '#2A4266' : C.line ),
			list( features, { color: featured ? C.white : C.ink, iconColor: featured ? C.accent : C.brand } ),
			button( 'Talk to us', page( 'contact' ), { more: { align: 'justify', ...( featured ? onDark : outline ) } } ),
		],
		{ spacing: 16, more: featured ? { background_color: C.ink, border_color: C.ink } : {} }
	);

pages.pricing = {
	title: 'Pricing',
	content: [
		pageHero( 'Pricing', 'Fixed fees, agreed before we start', 'No day rates and no surprises. You know the price, the scope and the measure of success on the first page of the proposal.' ),
		section( { spacing: 0 }, [
			grid( { columns: 3, spacing: 24, more: { grid_align_items: 'stretch' } }, [
				plan( 'Diagnostic', '$18,000', 'Two weeks', 'A clear view of what is really going on, before you commit to more.', [ 'Interviews and site visits', 'Analysis of your own data', 'A short findings paper', 'A working session with your team' ] ),
				plan( 'Engagement', '$65,000', 'Typical, eight to twelve weeks', 'From diagnosis to the first changes in place, with one partner throughout.', [ 'Everything in Diagnostic', 'Options with costs and consequences', 'Delivery alongside your team', 'Four quarterly reviews', 'All models and materials are yours' ], true ),
				plan( 'Retained', '$9,500', 'Per month, three-month minimum', 'A partner on call for leadership teams in the middle of a change.', [ 'Two working days a month', 'Board and investor preparation', 'Access to all four practices', 'Cancel with one month of notice' ] ),
			] ),
		] ),
		section( { background: C.tint, spacing: 32 }, [
			intro( 'Good to know', 'Questions about fees' ),
			questions( [
				[ 'What if the scope changes?', 'We stop and agree the change in writing before any further work. You will never receive an invoice you did not expect.' ],
				[ 'Do you charge expenses?', 'Travel outside your region is charged at cost, with receipts. Everything else is included.' ],
				[ 'Is any part of the fee tied to results?', 'It can be. Up to a fifth of an engagement fee can depend on a measure we agree at the start.' ],
			] ),
		] ),
		callToAction(),
	],
};

pages.contact = {
	title: 'Contact',
	content: [
		pageHero( 'Contact', 'Tell us where you are stuck', 'A partner reads every message and replies within one working day.' ),
		section( { spacing: 0 }, [
			row( { spacing: 56, align: 'flex-start', tablet: 'column' }, [
				column( { width: 54, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					heading( 'Reach us directly' ),
					text( '<p>The quickest way to start is an email with a few lines about your company and the decision in front of you. If you prefer to talk, call the office and ask for any partner.</p>' ),
					list( [ { text: 'hello@example.com', icon: 'envelope', url: 'mailto:hello@example.com' }, { text: '+1 (555) 010-0142', icon: 'phone', url: 'tel:+15550100142' }, { text: '48 Quay Street, Floor 6, Portside', icon: 'location-dot' }, { text: 'Monday to Friday, 8:30 to 18:00', icon: 'clock' } ], { color: C.ink, iconColor: C.brand, more: { space_between: px( 16 ) } } ),
				] ),
				column( { width: 46, more: { width_tablet: percent( 100 ) } }, [
					card( [
						heading( 'What happens next', { tag: 'h2', size: px( 22 ) } ),
						list( [ 'A partner replies within one working day', 'A 30-minute call, with no preparation needed', 'If we can help, a two-page proposal with a fixed fee', 'If we cannot, we will say so and suggest who can' ], { color: C.ink, iconColor: C.brand } ),
						button( 'Write to us', 'mailto:hello@example.com', { more: { align: 'justify' } } ),
					], { spacing: 18, more: { background_color: C.tint, border_color: C.tint } } ),
				] ),
			] ),
		] ),
		section( { top: 0, spacing: 0 }, [ image( 'office', { radius: 20 } ) ] ),
	],
};

// The posts page: listed by the theme's blog template, so it has no Elementor content.
pages.insights = { title: 'Insights', plain: true };

/* -------------------------------------------------------------------------
   Header, footer and "page not found"
   ---------------------------------------------------------------------- */
const footLinks = ( title, items ) =>
	column( { width: 18, spacing: 14, more: { width_tablet: percent( 30 ) } }, [
		heading( title, { tag: 'h2', color: C.white, size: px( 15 ), weight: 700 } ),
		list( items.map( ( [ label, url ] ) => ( { text: label, url } ) ), { color: C.mist, more: { view: 'traditional', icon_size: px( 0 ), text_indent: px( 0 ), text_color_hover: C.white } } ),
	] );

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
					padding: box( 16, 24 ),
					padding_mobile: box( 12, 20 ),
					background_background: 'classic',
					background_color: C.white,
					border_border: 'solid',
					border_width: box( 0, 0, 1, 0 ),
					border_color: C.line,
				},
				[
					heading( 'Halden', { tag: 'p', color: C.ink, size: px( 24 ), weight: 800, more: { link: link( page( 'home' ) ), typography_letter_spacing: px( -0.5 ) } } ),
					container( { content_width: 'full', width: percent( 10 ), width_mobile: percent( 10 ), flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'flex-end', flex_gap: gap( 24 ), flex_wrap: 'nowrap', padding: box( 0 ), _flex_size: 'grow' }, [
						widget( 'of-nav-menu', { align: 'flex-end', color: C.ink, color_active: C.brand, typography_typography: 'custom', typography_font_size: px( 16 ), typography_font_weight: '600', _flex_size: 'grow' } ),
						button( 'Get in touch', page( 'contact' ), { more: { size: 'sm', hide_mobile: 'hidden-mobile' } } ),
					] ),
				]
			),
		],
	},
	footer: {
		title: 'Footer',
		location: 'footer',
		content: [
			section( { background: C.ink, top: 80, bottom: 32, spacing: 48 }, [
				row( { spacing: 48, align: 'flex-start', tablet: 'row', more: { flex_wrap_tablet: 'wrap' } }, [
					column( { width: 40, spacing: 16, more: { width_tablet: percent( 100 ) } }, [
						heading( 'Halden', { tag: 'p', color: C.white, size: px( 26 ), weight: 800 } ),
						text( '<p>Independent advisory for mid-sized companies. Strategy, operations and finance, from people who stay until it works.</p>', { color: C.mist } ),
					] ),
					footLinks( 'Company', [ [ 'About', page( 'about' ) ], [ 'Team', page( 'team' ) ], [ 'Projects', page( 'projects' ) ], [ 'Insights', page( 'insights' ) ] ] ),
					footLinks( 'Services', [ [ 'Strategy', page( 'service-details' ) ], [ 'All services', page( 'services' ) ], [ 'Pricing', page( 'pricing' ) ] ] ),
					footLinks( 'Contact', [ [ 'hello@example.com', 'mailto:hello@example.com' ], [ '+1 (555) 010-0142', 'tel:+15550100142' ], [ 'Get in touch', page( 'contact' ) ] ] ),
				] ),
				b.divider( '#23395B' ),
				text( '<p>© Halden Advisory. A fictional company, made for the Open Frame Business starter site.</p>', { color: C.mist, size: px( 14 ) } ),
			] ),
		],
	},
	'not-found': {
		title: 'Page not found',
		location: '404',
		content: [
			section( { background: C.tint, top: 128, spacing: 0 }, [
				column( { width: 60, spacing: 20, align: 'center', more: { align_self: 'center' } }, [
					eyebrow( 'Error 404' ),
					heading( 'This page has moved, or never existed', { tag: 'h1', align: 'center' } ),
					text( '<p>The address may be mistyped, or the page may have been retired. The home page is a good place to start again.</p>', { align: 'center', size: px( 19 ) } ),
					row( { spacing: 12, justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap' } }, [ button( 'Back to the home page', page( 'home' ) ), button( 'Contact us', page( 'contact' ), { more: outline } ) ] ),
				] ),
			] ),
		],
	},
};

/* -------------------------------------------------------------------------
   Write everything
   ---------------------------------------------------------------------- */
for ( const dir of [ 'content', 'site' ] ) {
	fs.rmSync( path.join( OUT, dir ), { recursive: true, force: true } );
}

const used = new Set();

for ( const [ name, def ] of Object.entries( pages ) ) {
	const data = { uid: `${ SITE }:pages:${ name }`, title: def.title, slug: def.slug || name, ...( def.front_page ? { front_page: true } : {} ), template: def.plain ? 'default' : 'elementor_header_footer' };
	if ( ! def.plain ) {
		data.elementor = { version: '4.4.2', type: 'wp-page', page_settings: { hide_title: 'yes' }, content: def.content };
		widgetsOf( def.content, used );
	}
	writeJson( path.join( OUT, 'content/pages', name + '.json' ), data );
}

for ( const [ name, def ] of Object.entries( parts ) ) {
	widgetsOf( def.content, used );
	writeJson( path.join( OUT, 'content/site-parts', name + '.json' ), { uid: `${ SITE }:site-parts:${ name }`, title: def.title, location: def.location, elementor: { version: '4.4.2', type: 'wp-post', page_settings: {}, content: def.content } } );
}

const paragraph = ( html ) => `<!-- wp:paragraph -->\n<p>${ html }</p>\n<!-- /wp:paragraph -->`;
const subheading = ( title ) => `<!-- wp:heading -->\n<h2 class="wp-block-heading">${ title }</h2>\n<!-- /wp:heading -->`;
for ( const post of posts ) {
	writeJson( path.join( OUT, 'content/posts', post.name + '.json' ), {
		uid: `${ SITE }:posts:${ post.name }`,
		title: post.title,
		slug: post.name,
		excerpt: post.excerpt,
		featured: `ofss://media/${ post.image }`,
		categories: [ post.category ],
		days_ago: post.days,
		content: [
			paragraph( post.excerpt ),
			subheading( 'Why it happens' ),
			paragraph( 'Habits form around what is easy to measure. Revenue, headcount and the number of projects under way are all visible on a dashboard; the cost of complexity is not. So it grows, quietly, until someone goes looking for it.' ),
			subheading( 'What to do about it' ),
			paragraph( 'Start small. Pick one product line, one customer segment or one week of the calendar and look at it honestly. The first pass does not need to be precise to be useful: being roughly right about where the effort goes is enough to change the conversation.' ),
			paragraph( `If you would like a second pair of eyes, <a href="${ page( 'contact' ) }">we are happy to talk it through</a>.` ),
		].join( '\n\n' ),
	} );
}

const size = ( rem ) => fluid( rem );
const typography = ( prefix, { fontSize, weight, lineHeight, spacing } ) => ( {
	[ `${ prefix }_typography_typography` ]: 'custom',
	[ `${ prefix }_typography_font_family` ]: FONT,
	...( fontSize ? { [ `${ prefix }_typography_font_size` ]: fontSize } : {} ),
	...( weight ? { [ `${ prefix }_typography_font_weight` ]: String( weight ) } : {} ),
	...( lineHeight ? { [ `${ prefix }_typography_line_height` ]: em( lineHeight ) } : {} ),
	...( spacing ? { [ `${ prefix }_typography_letter_spacing` ]: em( spacing ) } : {} ),
} );

writeJson( path.join( OUT, 'site/kit.json' ), {
	// The convention the theme's "Use Elementor global colors and fonts" option expects:
	// Primary = brand, Secondary = headings, Text = body, Accent = highlight.
	system_colors: [
		{ _id: 'primary', title: 'Primary', color: C.brand },
		{ _id: 'secondary', title: 'Secondary', color: C.ink },
		{ _id: 'text', title: 'Text', color: C.text },
		{ _id: 'accent', title: 'Accent', color: C.accent },
	],
	custom_colors: [
		{ _id: 'oftint', title: 'Tint', color: C.tint },
		{ _id: 'ofline', title: 'Line', color: C.line },
		{ _id: 'ofwhite', title: 'White', color: C.white },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '700' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '600' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '600' },
	],
	container_width: px( 1200 ),
	body_color: C.text,
	...typography( 'body', { fontSize: px( 17 ), weight: 400, lineHeight: 1.65 } ),
	link_normal_color: C.brand,
	link_hover_color: C.brandDark,
	h1_color: C.ink,
	...typography( 'h1', { fontSize: size( 'clamp(2.25rem, 1.35rem + 3.4vw, 3.75rem)' ), weight: 700, lineHeight: 1.08, spacing: -0.02 } ),
	h2_color: C.ink,
	...typography( 'h2', { fontSize: size( 'clamp(1.75rem, 1.3rem + 1.8vw, 2.5rem)' ), weight: 700, lineHeight: 1.15, spacing: -0.015 } ),
	h3_color: C.ink,
	...typography( 'h3', { fontSize: size( 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)' ), weight: 700, lineHeight: 1.25 } ),
	h4_color: C.ink,
	...typography( 'h4', { fontSize: px( 18 ), weight: 700, lineHeight: 1.3 } ),
	...typography( 'button', { fontSize: px( 16 ), weight: 600, lineHeight: 1.2 } ),
	button_text_color: C.white,
	button_background_color: C.brand,
	button_hover_text_color: C.white,
	button_hover_background_color: C.brandDark,
	button_border_radius: box( 10 ),
	button_padding: box( 14, 24 ),
} );

writeJson( path.join( OUT, 'site/theme-mods.json' ), {
	open_frame_follow_elementor: true,
	open_frame_color_primary: C.brand.toLowerCase(),
	open_frame_color_primary_hover: C.brandDark.toLowerCase(),
	open_frame_color_heading: C.ink.toLowerCase(),
	open_frame_color_text: C.text.toLowerCase(),
	open_frame_color_link: C.brand.toLowerCase(),
	open_frame_color_link_hover: C.brandDark.toLowerCase(),
	open_frame_color_accent: C.accent.toLowerCase(),
	open_frame_color_border: C.line.toLowerCase(),
	open_frame_color_bg: C.tint.toLowerCase(),
	open_frame_container_width: 1200,
	open_frame_blog_style: 'grid',
	open_frame_blog_columns: 3,
	open_frame_blog_title: true,
	open_frame_blog_title: true,
	open_frame_blog_layout: 'full-width',
	open_frame_single_layout: 'no-sidebar',
	open_frame_page_layout: 'no-sidebar',
} );

writeJson( path.join( OUT, 'site/options.json' ), { show_on_front: 'page', page_on_front: page( 'home' ), page_for_posts: page( 'insights' ) } );

writeJson( path.join( OUT, 'site/menus.json' ), [
	{
		uid: 'primary',
		name: 'Primary',
		location: 'primary',
		items: [ [ 'About', 'about' ], [ 'Services', 'services' ], [ 'Projects', 'projects' ], [ 'Pricing', 'pricing' ], [ 'Insights', 'insights' ], [ 'Contact', 'contact' ] ].map( ( [ title, name ] ) => ( { title, url: page( name ) } ) ),
	},
] );

const licence = 'CC0-1.0. Original artwork generated for this starter site (tools/sites/business-art.mjs).';
writeJson( path.join( OUT, 'media/index.json' ), [
	{ uid: 'hero', file: 'hero.jpg', alt: 'Abstract composition of blue panels and an amber arc' },
	{ uid: 'about', file: 'about.jpg', alt: 'Abstract composition of stacked bars in navy and blue' },
	{ uid: 'approach', file: 'approach.jpg', alt: 'Abstract composition of concentric arcs' },
	{ uid: 'office', file: 'office.jpg', alt: 'Abstract wide composition of a grid of panels' },
	...projects.map( ( project ) => ( { uid: project.uid, file: project.uid + '.jpg', alt: `Abstract cover image for the ${ project.name } case study` } ) ),
	...team.map( ( person ) => ( { uid: person.uid, file: person.uid + '.jpg', alt: `Monogram portrait placeholder for ${ person.name }` } ) ),
	...posts.map( ( post ) => ( { uid: post.image, file: post.image + '.jpg', alt: '' } ) ),
].map( ( item ) => ( { ...item, licence } ) ) );

// The catalog entry keeps its hand-written fields; the generated ones are refreshed.
const siteFile = path.join( OUT, 'site.json' );
const site = JSON.parse( fs.readFileSync( siteFile, 'utf8' ) );
site.status = 'available';
site.requires.importer = '0.3.0';
site.requires.elementor = { widgets: [ ...used ].sort() };
site.pages = [ 'Home', 'About', 'Services', 'Service Details', 'Projects', 'Project Details', 'Team', 'Pricing', 'Insights (blog)', 'Single Post', 'Contact', '404' ];
writeJson( siteFile, site );

console.log( `Business: ${ Object.keys( pages ).length } pages, ${ Object.keys( parts ).length } site parts, ${ posts.length } posts. Widgets: ${ [ ...used ].sort().join( ', ' ) }` );
