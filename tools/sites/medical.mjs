#!/usr/bin/env node
/**
 * The Medical starter site ("Linden Clinic", family medicine and specialists), written as data.
 *
 *   node tools/sites/medical.mjs
 *
 * Writes starter-sites/medical/{site.json, site/, content/, media/index.json,
 * fonts/index.json}. The images come from tools/sites/medical-art.mjs. See
 * brief.md in the site folder for the design decisions this file implements.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blocks, box, builders, em, fluid, gap, icon, ids, kitTypography, link, page, percent, px, writeSite } from './kit.mjs';

const SITE = 'medical';
const OUT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites', SITE );

/* -------------------------------------------------------------------------
   Design tokens (see brief.md)
   ---------------------------------------------------------------------- */
const C = {
	teal: '#0B6B69',
	tealDark: '#085352',
	deep: '#0A3F42',
	ink: '#0F2B2D',
	text: '#3E5557',
	mist: '#E8F4F1',
	aqua: '#BFE5DE',
	sand: '#F6EFE6',
	white: '#FFFFFF',
	line: '#D5E6E1',
	haze: '#CFE6E1', // Text on the deep bands.
};
const FONT = 'Plus Jakarta Sans';
const PHONE = '+1 (555) 010-0191';
const TEL = 'tel:+15550100191';
const EMAIL = 'care@example.com';
const DISCLAIMER = 'This article is general information and not personal medical advice. If you are worried about your health, please make an appointment.';

const b = builders( ids() );
const { row, column, grid, text, button, list, counter, container, widget } = b;

/* -------------------------------------------------------------------------
   Components of this design
   ---------------------------------------------------------------------- */
const section = ( options, elements ) => b.section( { top: 104, ...options }, elements );
const softShadow = { box_shadow_box_shadow_type: 'yes', box_shadow_box_shadow: { horizontal: 0, vertical: 18, blur: 44, spread: 0, color: 'rgba(10,63,66,0.10)' } };
/** The shape pictures have in this design: one large corner, three small ones. */
const leaf = ( large = 120 ) => ( { unit: 'px', top: String( large ), right: '24', bottom: '24', left: '24', isLinked: false } );

const heading = ( title, options = {} ) => b.heading( title, options );

/** Small uppercase label above a heading. */
const label = ( title, { color = C.teal, align } = {} ) =>
	b.heading( title, { tag: 'p', color, align, size: px( 13 ), weight: 700, more: { typography_text_transform: 'uppercase', typography_letter_spacing: px( 1.6 ), typography_line_height: em( 1.4 ) } } );

const fact = ( title, { color = C.ink, size = 17, weight = 600, align, more = {} } = {} ) =>
	b.heading( title, { tag: 'p', color, align, size: px( size ), weight, more: { typography_line_height: em( 1.45 ), ...more } } );

const intro = ( name, title, lead, { tag = 'h2', align, width = 60, dark = false } = {} ) =>
	column( { width, spacing: 14, ...( align === 'center' ? { align: 'center', more: { _flex_align_self: 'center' } } : {} ) }, [
		label( name, { align, color: dark ? C.aqua : C.teal } ),
		heading( title, { tag, align, ...( dark ? { color: C.white } : {} ) } ),
		...( lead ? [ text( `<p>${ lead }</p>`, { align, size: px( 19 ), ...( dark ? { color: C.haze } : {} ) } ) ] : [] ),
	] );

/** A white card with a soft shadow. */
const card = ( elements, { padding = 30, spacing = 14, background = C.white, more = {} } = {} ) =>
	container( { content_width: 'full', flex_direction: 'column', flex_gap: gap( spacing ), padding: box( padding ), padding_mobile: box( 24 ), background_background: 'classic', background_color: background, border_radius: box( 20 ), ...softShadow, ...more }, elements );

const outline = { background_color: 'transparent', button_text_color: C.teal, border_border: 'solid', border_width: box( 1.5 ), border_color: C.teal, hover_color: C.white, button_background_hover_color: C.teal, button_hover_border_color: C.teal };
const onDeep = { background_color: C.white, button_text_color: C.deep, hover_color: C.deep, button_background_hover_color: C.aqua };
const ghostOnDeep = { background_color: 'transparent', button_text_color: C.white, border_border: 'solid', border_width: box( 1.5 ), border_color: C.haze, hover_color: C.deep, button_background_hover_color: C.white, button_hover_border_color: C.white };

const arrow = ( title, url ) =>
	button( title, url, { more: { background_color: 'transparent', button_background_hover_color: 'transparent', button_text_color: C.teal, hover_color: C.deep, selected_icon: icon( 'arrow-right' ), icon_align: 'row-reverse', icon_indent: px( 8 ), text_padding: box( 0 ), _flex_size: 'none' } } );

const image = ( uid, { radius = leaf(), more = {} } = {} ) => b.image( uid, { more: { image_border_radius: radius, ...more } } );

/** An icon in a tinted circle, a title and a sentence: Elementor's Icon Box widget. */
/** No link of its own: Elementor would also link the bare icon, a link without a name. Cards add a text link instead. */
const iconBox = ( name, title, body, { tag = 'h3', position = 'block-start' } = {} ) =>
	widget( 'icon-box', {
		selected_icon: icon( name ),
		view: 'stacked',
		shape: 'circle',
		title_text: title,
		description_text: body,
		title_size: tag,
		position,
		text_align: 'start',
		primary_color: C.mist,
		secondary_color: C.teal,
		icon_size: px( 24 ),
		icon_padding: px( 16 ),
		icon_space: px( 18 ),
		title_bottom_space: px( 8 ),
		title_color: C.ink,
		description_color: C.text,
		title_typography_typography: 'custom',
		title_typography_font_size: px( 20 ),
		title_typography_font_weight: '700',
		title_typography_line_height: em( 1.3 ),
		description_typography_typography: 'custom',
		description_typography_font_size: px( 16 ),
		description_typography_line_height: em( 1.6 ),
	} );

/** The top of an inner page: a mist band with label, title and one sentence. */
const pageHero = ( name, title, lead, extra = [] ) =>
	section( { background: C.mist, top: 88, bottom: 80, spacing: 0 }, [ column( { width: 68, spacing: 16 }, [ label( name ), heading( title, { tag: 'h1' } ), ...( lead ? [ text( `<p>${ lead }</p>`, { size: px( 20 ) } ) ] : [] ), ...extra ] ) ] );

/** The closing band, shared by most pages. */
const bookBand = () =>
	section( { background: C.deep, top: 88, spacing: 0 }, [
		row( { spacing: 40, align: 'center', justify: 'space-between' }, [
			column( { width: 60, spacing: 12 }, [ heading( 'Need to see someone this week?', { color: C.white } ), text( '<p>Most patients are seen within three working days. Urgent appointments are kept free every morning.</p>', { color: C.haze, size: px( 19 ) } ) ] ),
			row( { spacing: 14, align: 'center', more: { width: percent( 36 ), width_mobile: percent( 100 ), flex_justify_content: 'flex-end', flex_justify_content_mobile: 'flex-start', flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Book an appointment', page( 'appointment' ), { more: onDeep } ), button( 'Call us', TEL, { more: ghostOnDeep } ) ] ),
		] ),
	] );

/** Two things on one line with a hairline below: opening hours, clinic days. */
const line = ( left, right ) =>
	container( { content_width: 'full', flex_direction: 'row', flex_direction_mobile: 'row', flex_justify_content: 'space-between', flex_align_items: 'baseline', flex_gap: gap( 16 ), flex_wrap: 'nowrap', padding: box( 12, 0 ), border_border: 'solid', border_width: box( 0, 0, 1, 0 ), border_color: C.line }, [ fact( left, { weight: 500, size: 16, color: C.text } ), fact( right, { size: 16, more: { _flex_size: 'none' } } ) ] );

const hoursCard = ( title = 'Opening hours' ) =>
	card( [ heading( title, { tag: 'h2', size: px( 22 ) } ), column( { spacing: 0 }, [ line( 'Monday to Friday', '7:30 to 19:00' ), line( 'Saturday', '9:00 to 13:00' ), line( 'Sunday and holidays', 'Closed' ) ] ), text( '<p>Outside these hours, the recorded message on our telephone gives the number of the doctor on call.</p>', { size: px( 15 ) } ) ], { spacing: 16 } );

/* -------------------------------------------------------------------------
   Content
   ---------------------------------------------------------------------- */
const departments = [
	[ 'stethoscope', 'Family medicine', 'Your first stop for most things: check-ups, long-term conditions, vaccinations and referrals.' ],
	[ 'heartbeat', 'Cardiology', 'Blood pressure, rhythm and heart health, with ECG and ultrasound in the building.' ],
	[ 'baby', 'Paediatrics', 'From the first week to the eighteenth birthday. Well-child visits and same-day sick appointments.' ],
	[ 'bone', 'Orthopaedics', 'Joints, backs and sports injuries, working closely with our physiotherapists.' ],
	[ 'eye', 'Eye care', 'Sight tests, diabetic screening and minor procedures, without a hospital visit.' ],
	[ 'vial', 'Laboratory', 'Blood and urine tests taken on site. Most results are with your doctor the next morning.' ],
];

const doctors = [
	{ uid: 'doctor-1', name: 'Dr Amara Okafor', role: 'Cardiology', line: 'Heart rhythm and blood pressure. With the clinic since 2014.' },
	{ uid: 'doctor-2', name: 'Dr Daniel Mbeki', role: 'Family medicine', line: 'Long-term conditions and men\'s health. Speaks English and French.' },
	{ uid: 'doctor-3', name: 'Dr Hanna Lindqvist', role: 'Paediatrics', line: 'Newborns to teenagers. Runs the Saturday children\'s clinic.' },
	{ uid: 'doctor-4', name: 'Dr Peter Varga', role: 'Orthopaedics', line: 'Knees, shoulders and backs. Thirty years in practice.' },
];

const posts = [
	{
		name: 'heart-numbers',
		title: 'Five numbers worth knowing about your heart',
		excerpt: 'Blood pressure, resting pulse, cholesterol, blood sugar and waist size. What each one tells us, and when it is worth having them checked.',
		image: 'note-1',
		category: 'Heart health',
		days: 7,
		content: [
			blocks.paragraph( 'Most heart problems give years of warning, in numbers that are easy to measure. Five of them cover most of what we look at in a routine check.' ),
			blocks.list( [ 'Blood pressure', 'Resting pulse', 'Cholesterol', 'Blood sugar', 'Waist measurement' ] ),
			blocks.heading( 'Why the trend matters more than one reading' ),
			blocks.paragraph( 'A single high reading on a busy morning tells us little. Three readings over a few weeks tell us a great deal. That is why we may ask you to measure at home, or to come back.' ),
			blocks.heading( 'When to have them checked' ),
			blocks.paragraph( `If you are over forty and have not had these measured in the last three years, a check is sensible. It takes twenty minutes and one blood sample. You can <a href="${ page( 'appointment' ) }">book it like any other appointment</a>.` ),
			blocks.paragraph( `<em>${ DISCLAIMER }</em>` ),
		],
	},
	{
		name: 'sleep-first',
		title: 'Why sleep is the first thing we ask about',
		excerpt: 'Tiredness, low mood, headaches and raised blood pressure often share one cause. A few questions about your nights can save a lot of tests.',
		image: 'note-2',
		category: 'Everyday health',
		days: 21,
		content: [
			blocks.paragraph( 'Tiredness, low mood, headaches and raised blood pressure often share one cause. Before we order tests, we ask how you sleep, because the answer changes what we look for.' ),
			blocks.heading( 'Three questions we will ask' ),
			blocks.list( [ 'How long does it take you to fall asleep?', 'How often do you wake in the night?', 'Do you feel rested when you get up?' ] ),
			blocks.heading( 'What usually helps first' ),
			blocks.paragraph( 'Regular hours, less screen light in the last hour of the evening and less caffeine after midday help more people than tablets do. If they do not help within a few weeks, that is worth a conversation.' ),
			blocks.paragraph( `<em>${ DISCLAIMER }</em>` ),
		],
	},
	{
		name: 'winter-vaccinations',
		title: 'Getting ready for winter: who is offered which vaccination',
		excerpt: 'Vaccination clinics run every Tuesday and Thursday afternoon from October. Who is invited, what to bring and how long it takes.',
		image: 'note-3',
		category: 'Clinic news',
		days: 36,
		content: [
			blocks.paragraph( 'From October, vaccination clinics run every Tuesday and Thursday afternoon. You do not need to see a doctor first; a nurse will go through a short list of questions with you.' ),
			blocks.heading( 'Who is invited' ),
			blocks.paragraph( 'Invitations follow the national recommendations for the season, which change from year to year. If you are not sure whether you are included, ask at reception or call us.' ),
			blocks.heading( 'What to bring' ),
			blocks.list( [ 'Your vaccination record, if you have one', 'Your insurance card', 'A short-sleeved top' ] ),
			blocks.paragraph( `Allow twenty minutes, including the wait afterwards. <a href="${ page( 'appointment' ) }">Appointments can be made by telephone</a>.` ),
			blocks.paragraph( `<em>${ DISCLAIMER }</em>` ),
		],
	},
];

const doctorCard = ( person, tag = 'h3' ) =>
	card( [
		image( person.uid, { radius: leaf( 80 ), more: { link_to: 'custom', link: link( page( 'doctor' ) ) } } ),
		column( { spacing: 6, more: { padding: box( 4, 8, 8, 8 ) } }, [ label( person.role ), heading( person.name, { tag, size: px( 21 ), more: { link: link( page( 'doctor' ) ) } } ), text( `<p>${ person.line }</p>`, { size: px( 15 ) } ) ] ),
	], { padding: 14, spacing: 14 } );

/* -------------------------------------------------------------------------
   Pages
   ---------------------------------------------------------------------- */
const pages = {};

pages.home = {
	title: 'Home',
	front_page: true,
	content: [
		section( { background: C.mist, top: 80, bottom: 88, spacing: 0 }, [
			row( { spacing: 64, align: 'center', tablet: 'column' }, [
				column( { width: 54, spacing: 22, more: { width_tablet: percent( 100 ) } }, [
					label( 'Family medicine and specialists' ),
					heading( 'Unhurried care, close to home', { tag: 'h1' } ),
					text( '<p>Linden Clinic is a group practice of twenty-four doctors and nurses. We give appointments the time they need, and you see the same doctor whenever we can arrange it.</p>', { size: px( 20 ) } ),
					row( { spacing: 14, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Book an appointment', page( 'appointment' ) ), button( 'Our departments', page( 'departments' ), { more: outline } ) ] ),
					list( [ 'Appointments within three working days', 'Open on Saturday mornings', 'All major insurers accepted' ], { color: C.ink, iconColor: C.teal, iconName: 'check-circle' } ),
				] ),
				column( { width: 46, more: { width_tablet: percent( 100 ) } }, [ image( 'hero', { radius: leaf( 160 ) } ) ] ),
			] ),
		] ),

		section( { top: 64, bottom: 0, spacing: 0 }, [
			grid( { columns: 3, spacing: 28 }, [
				card( [ iconBox( 'calendar-check', 'Book an appointment', 'By telephone, by email or at the desk. Urgent slots are kept free every morning.', { tag: 'h2' } ), arrow( 'How to book', page( 'appointment' ) ) ], { spacing: 18 } ),
				card( [ iconBox( 'user-md', 'Find a doctor', 'Twenty-four doctors and nurses in six departments. See who is in on which day.', { tag: 'h2' } ), arrow( 'Meet our doctors', page( 'doctors' ) ) ], { spacing: 18 } ),
				card( [ iconBox( 'clock', 'Opening hours', 'Monday to Friday 7:30 to 19:00, Saturday 9:00 to 13:00. On call outside these hours.', { tag: 'h2' } ), arrow( 'Find us', page( 'contact' ) ) ], { spacing: 18 } ),
			] ),
		] ),

		section( { spacing: 48 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'Departments', 'Six departments under one roof', 'Most of what a family needs, without being sent across town.' ), arrow( 'All departments', page( 'departments' ) ) ] ),
			grid( { columns: 3, spacing: 28 }, departments.map( ( [ name, title, body ] ) => card( [ iconBox( name, title, body ), arrow( `About ${ title.toLowerCase() }`, page( 'department' ) ) ], { spacing: 18 } ) ) ),
		] ),

		section( { background: C.sand, spacing: 0 }, [
			row( { spacing: 72, align: 'center', tablet: 'column' }, [
				column( { width: 48, more: { width_tablet: percent( 100 ) } }, [ image( 'reception' ) ] ),
				column( { width: 52, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					label( 'About the clinic' ),
					heading( 'A practice that knows its patients' ),
					text( '<p>We have looked after families in Lindenhof since 2008. Records are shared between our doctors, so you do not have to tell your story twice, and a nurse you know answers the telephone.</p>' ),
					list( [ 'Twenty-minute appointments as standard', 'One named doctor for every patient', 'Laboratory and ECG in the building' ], { color: C.ink, iconColor: C.teal, iconName: 'check-circle' } ),
					arrow( 'More about us', page( 'about' ) ),
				] ),
			] ),
		] ),

		section( { background: C.deep, top: 80, spacing: 0 }, [
			grid( { columns: 4, tablet: 2, spacing: 32, more: { grid_columns_grid_mobile: { unit: 'fr', size: 2, sizes: [] } } }, [
				[ 24, 'doctors and nurses' ],
				[ 6, 'departments' ],
				[ 18, 'years in Lindenhof' ],
				[ 96, 'of patients would recommend us', { suffix: '%' } ],
			].map( ( [ number, title, extra = {} ] ) => counter( number, title, { color: C.white, titleColor: C.haze, ...extra } ) ) ),
		] ),

		section( { spacing: 48 }, [
			row( { align: 'flex-end', justify: 'space-between', spacing: 32 }, [ intro( 'Our doctors', 'The people you will see' ), arrow( 'All doctors', page( 'doctors' ) ) ] ),
			grid( { columns: 4, tablet: 2, spacing: 24 }, doctors.map( ( person ) => doctorCard( person ) ) ),
		] ),

		section( { background: C.mist, top: 96, spacing: 0 }, [
			column( { width: 76, spacing: 22, align: 'center', more: { _flex_align_self: 'center' } }, [
				heading( '“Dr Mbeki has looked after three generations of my family. He still asks about my mother by name.”', { tag: 'p', align: 'center', size: fluid( 'clamp(1.375rem, 1.1rem + 1.4vw, 2.125rem)' ), weight: 600, more: { typography_line_height: em( 1.35 ) } } ),
				fact( 'Elena R., patient since 2011', { color: C.text, size: 16, weight: 500, align: 'center' } ),
			] ),
		] ),

		bookBand(),
	],
};

pages.about = {
	title: 'About',
	content: [
		pageHero( 'About', 'A group practice that has kept the manners of a small one', 'Linden Clinic opened in 2008 with four doctors. There are twenty-four of us now, and the rule has not changed: enough time for every patient.' ),
		section( { spacing: 0 }, [
			row( { spacing: 72, align: 'center', tablet: 'column' }, [
				column( { width: 52, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					heading( 'How we work' ),
					text( '<p>Every patient has a named doctor, and we do what we can to keep it that way. Appointments are twenty minutes long, twice the usual length, because most problems are not solved in ten.</p><p>Our doctors meet every week to discuss difficult cases together. If you need a specialist we do not have, we arrange the referral and follow it up.</p>' ),
					arrow( 'Meet our doctors', page( 'doctors' ) ),
				] ),
				column( { width: 48, more: { width_tablet: percent( 100 ) } }, [ image( 'building' ) ] ),
			] ),
		] ),
		section( { background: C.mist, spacing: 48 }, [
			intro( 'What we promise', 'Three things you can hold us to' ),
			grid( { columns: 3, spacing: 28 }, [
				[ 'clock', 'Time', 'Twenty minutes for an ordinary appointment, forty for a first visit. We run to time, and we tell you when we do not.' ],
				[ 'comments', 'Plain words', 'We explain what we think, what we do not know yet, and what happens next. You leave with it in writing.' ],
				[ 'user-friends', 'Continuity', 'The same doctor, the same nurse at the desk, the same record. You should not have to start again each time.' ],
			].map( ( [ name, title, body ] ) => card( [ iconBox( name, title, body ) ] ) ) ),
		] ),
		section( { spacing: 0 }, [ row( { spacing: 72, align: 'center', tablet: 'column' }, [ column( { width: 48, more: { width_tablet: percent( 100 ) } }, [ image( 'family' ) ] ), column( { width: 52, spacing: 20, more: { width_tablet: percent( 100 ) } }, [ label( 'Our patients' ), heading( 'From the first week to the ninetieth year' ), text( '<p>About nine thousand people are registered with us. Many are families we have known since the clinic opened: the babies we weighed in 2008 now come in on their own.</p>' ), button( 'Become a patient', page( 'appointment' ), { more: outline } ) ] ) ] ) ] ),
		bookBand(),
	],
};

pages.departments = {
	title: 'Departments',
	content: [
		pageHero( 'Departments', 'Six departments, one record, one front door', 'Start with family medicine unless you already know which department you need. We will point you the right way.' ),
		section( { spacing: 0 }, [ grid( { columns: 3, spacing: 28 }, departments.map( ( [ name, title, body ] ) => card( [ iconBox( name, title, body, { tag: 'h2' } ), arrow( `About ${ title.toLowerCase() }`, page( 'department' ) ) ], { spacing: 18 } ) ) ) ] ),
		section( { top: 0, spacing: 0 }, [
			card( [ row( { spacing: 40, align: 'center', justify: 'space-between' }, [ column( { width: 64, spacing: 10 }, [ heading( 'Not sure where to go?', { size: fluid( 'clamp(1.5rem, 1.3rem + 1vw, 2rem)' ) } ), text( '<p>Call the desk. A nurse will ask a few questions and book you with the right person.</p>' ) ] ), button( `Call ${ PHONE }`, TEL, { more: { _flex_size: 'none' } } ) ] ) ], { background: C.sand, padding: 44, more: { box_shadow_box_shadow_type: '' } } ),
		] ),
		bookBand(),
	],
};

pages.department = {
	title: 'Cardiology',
	content: [
		pageHero( 'Department', 'Cardiology', 'Blood pressure, heart rhythm and prevention, for adults of every age. Most tests are done here, on the day of your appointment.' ),
		section( { spacing: 0 }, [
			row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
				column( { width: 60, spacing: 48, more: { width_tablet: percent( 100 ) } }, [
					column( { spacing: 16 }, [ heading( 'What we look after' ), list( [ 'High blood pressure', 'Palpitations and irregular rhythm', 'Chest pain that needs investigating', 'Cholesterol and prevention', 'Check-ups before starting sport', 'Follow-up after a hospital stay' ], { color: C.ink, iconColor: C.teal, iconName: 'check-circle' } ) ] ),
					image( 'cardio' ),
					column( { spacing: 20 }, [
						heading( 'Tests we do in the building' ),
						grid( { columns: 2, tablet: 2, spacing: 24 }, [
							[ 'heartbeat', 'ECG', 'A ten-minute recording of the heart\'s rhythm, read by the doctor straight away.' ],
							[ 'wave-square', '24-hour monitoring', 'A small recorder worn at home for a day, for symptoms that come and go.' ],
							[ 'desktop', 'Heart ultrasound', 'A painless scan that shows how the heart and its valves are working.' ],
							[ 'running', 'Exercise test', 'An ECG on a treadmill, to see how the heart copes with effort.' ],
						].map( ( [ name, title, body ] ) => card( [ iconBox( name, title, body ) ] ) ) ),
					] ),
				] ),
				column( { width: 40, spacing: 28, more: { width_tablet: percent( 100 ) } }, [
					card( [ heading( 'Cardiology clinics', { tag: 'h2', size: px( 22 ) } ), column( { spacing: 0 }, [ line( 'Monday', '8:00 to 16:00' ), line( 'Wednesday', '8:00 to 18:30' ), line( 'Friday', '8:00 to 13:00' ) ] ), button( 'Book an appointment', page( 'appointment' ), { more: { align: 'justify' } } ) ], { spacing: 18 } ),
					card( [ label( 'Your cardiologist' ), row( { spacing: 18, align: 'center', more: { flex_direction_mobile: 'row', flex_align_items_mobile: 'center', flex_wrap: 'nowrap' } }, [ container( { content_width: 'full', width: px( 96 ), padding: box( 0 ), _flex_size: 'none' }, [ image( 'doctor-1', { radius: leaf( 40 ) } ) ] ), column( { spacing: 4 }, [ heading( 'Dr Amara Okafor', { tag: 'h2', size: px( 20 ), more: { link: link( page( 'doctor' ) ) } } ), fact( 'With the clinic since 2014', { color: C.text, size: 15, weight: 500 } ) ] ) ] ), arrow( 'View profile', page( 'doctor' ) ) ], { spacing: 16 } ),
					card( [ heading( 'Do I need a referral?', { tag: 'h2', size: px( 20 ) } ), text( '<p>Not from us. If your insurer asks for one, your family doctor here can write it at the same visit.</p>', { size: px( 16 ) } ) ], { background: C.sand, more: { box_shadow_box_shadow_type: '' } } ),
				] ),
			] ),
		] ),
		bookBand(),
	],
};

pages.doctors = {
	title: 'Doctors',
	content: [
		pageHero( 'Doctors', 'The people you will see', 'Four of our twenty-four. Each has a profile with their clinic days, so you can ask for them by name.' ),
		section( { spacing: 0 }, [ grid( { columns: 4, tablet: 2, spacing: 24 }, doctors.map( ( person ) => doctorCard( person, 'h2' ) ) ) ] ),
		section( { background: C.mist, spacing: 48 }, [
			intro( 'The wider team', 'Not only doctors' ),
			grid( { columns: 3, spacing: 28 }, [
				[ 'user-nurse', 'Nurses', 'Eight nurses run the vaccination, wound and diabetes clinics, and answer the telephone in the morning.' ],
				[ 'walking', 'Physiotherapists', 'Three physiotherapists share a gym on the second floor with the orthopaedic department.' ],
				[ 'headset', 'Reception', 'Five people at the desk who know the appointment book better than anyone.' ],
			].map( ( [ name, title, body ] ) => card( [ iconBox( name, title, body ) ] ) ) ),
		] ),
		bookBand(),
	],
};

pages.doctor = {
	title: 'Dr Amara Okafor',
	slug: 'dr-amara-okafor',
	content: [
		section( { background: C.mist, top: 80, bottom: 80, spacing: 0 }, [
			row( { spacing: 64, align: 'center', tablet: 'column' }, [
				column( { width: 36, more: { width_tablet: percent( 60 ), width_mobile: percent( 100 ) } }, [ image( 'doctor-1', { radius: leaf( 140 ) } ) ] ),
				column( { width: 64, spacing: 18, more: { width_tablet: percent( 100 ) } }, [
					label( 'Cardiology' ),
					heading( 'Dr Amara Okafor', { tag: 'h1' } ),
					text( '<p>Consultant cardiologist. Heart rhythm, blood pressure and prevention.</p>', { size: px( 20 ) } ),
					grid( { columns: 3, tablet: 3, spacing: 24 }, [ [ 'Clinic days', 'Monday, Wednesday, Friday' ], [ 'Languages', 'English, Igbo, German' ], [ 'With us since', '2014' ] ].map( ( [ name, value ] ) => column( { spacing: 4 }, [ label( name, { color: C.text } ), fact( value ) ] ) ) ),
					row( { spacing: 14, align: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_align_items_mobile: 'center' } }, [ button( 'Book with Dr Okafor', page( 'appointment' ) ), button( 'About cardiology', page( 'department' ), { more: outline } ) ] ),
				] ),
			] ),
		] ),
		section( { spacing: 0 }, [
			row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
				column( { width: 60, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					heading( 'About Dr Okafor' ),
					text( '<p>Dr Okafor trained in Lagos and Heidelberg and worked for eight years in a university hospital before joining the clinic. She set up our cardiology department and still runs it.</p><p>She has a particular interest in blood pressure that is hard to control, and in helping people return to exercise after a heart problem. Patients describe her as someone who draws diagrams.</p>' ),
					heading( 'Areas of interest', { tag: 'h3' } ),
					list( [ 'Resistant high blood pressure', 'Atrial fibrillation', 'Cardiac rehabilitation', 'Heart health in pregnancy' ], { color: C.ink, iconColor: C.teal, iconName: 'check-circle' } ),
				] ),
				column( { width: 40, spacing: 28, more: { width_tablet: percent( 100 ) } }, [
					card( [ heading( 'Training', { tag: 'h2', size: px( 22 ) } ), column( { spacing: 0 }, [ line( 'Medical degree, Lagos', '2001' ), line( 'Specialist in cardiology, Heidelberg', '2009' ), line( 'Fellow, European Society of Cardiology', '2016' ) ] ) ], { spacing: 16 } ),
					card( [ heading( 'Before your first visit', { tag: 'h2', size: px( 20 ) } ), text( '<p>Please bring a list of your medicines and any earlier heart tests. Allow forty minutes.</p>', { size: px( 16 ) } ) ], { background: C.sand, more: { box_shadow_box_shadow_type: '' } } ),
				] ),
			] ),
		] ),
		bookBand(),
	],
};

pages.appointment = {
	title: 'Book an Appointment',
	slug: 'appointments',
	content: [
		pageHero( 'Appointments', 'Book an appointment', 'By telephone, by email or at the desk. We do not use an online form: a person takes your booking and can answer your questions.' ),
		section( { spacing: 0 }, [
			grid( { columns: 3, spacing: 28 }, [
				card( [ iconBox( 'phone-alt', 'By telephone', 'The quickest way. Lines are open from 7:30 on weekdays; mornings are the busiest.', { tag: 'h2' } ), button( PHONE, TEL, { more: { align: 'justify' } } ) ], { spacing: 20 } ),
				card( [ iconBox( 'envelope', 'By email', 'For appointments that are not urgent. Tell us your name, date of birth and what it is about.', { tag: 'h2' } ), button( 'Write to us', `mailto:${ EMAIL }?subject=Appointment`, { more: { ...outline, align: 'justify' } } ) ], { spacing: 20 } ),
				card( [ iconBox( 'hospital-user', 'At the desk', 'Linden Clinic, 8 Linden Avenue. The desk is staffed whenever the clinic is open.', { tag: 'h2' } ), button( 'How to find us', page( 'contact' ), { more: { ...outline, align: 'justify' } } ) ], { spacing: 20 } ),
			] ),
		] ),
		section( { top: 0, spacing: 0 }, [
			card( [ row( { spacing: 24, align: 'center', more: { flex_wrap: 'nowrap' } }, [ container( { content_width: 'full', width: px( 64 ), padding: box( 0 ), _flex_size: 'none' }, [ widget( 'icon', { selected_icon: icon( 'exclamation-triangle' ), primary_color: '#B4432B', size: px( 40 ) } ) ] ), column( { spacing: 6 }, [ heading( 'In an emergency', { tag: 'h2', size: px( 22 ) } ), text( '<p>If you think a life is in danger, do not wait for an appointment. Call your local emergency number straight away.</p>', { color: C.ink } ) ] ) ] ) ], { background: '#FBE9E3', padding: 32, more: { box_shadow_box_shadow_type: '' } } ),
		] ),
		section( { background: C.mist, spacing: 0 }, [
			row( { spacing: 64, align: 'flex-start', tablet: 'column' }, [
				column( { width: 56, spacing: 20, more: { width_tablet: percent( 100 ) } }, [
					label( 'Your first visit' ),
					heading( 'What to bring, and what to expect' ),
					list( [ 'Your insurance card and an identity document', 'A list of the medicines you take', 'Letters or results from other doctors, if you have them', 'For children: the vaccination booklet' ], { color: C.ink, iconColor: C.teal, iconName: 'check-circle' } ),
					text( '<p>A first appointment lasts forty minutes. Please arrive ten minutes early to register. If you cannot come, tell us by 16:00 the day before, so that someone else can have the time.</p>' ),
				] ),
				column( { width: 44, more: { width_tablet: percent( 100 ) } }, [ hoursCard() ] ),
			] ),
		] ),
	],
};

pages.patients = {
	title: 'Patient Information',
	slug: 'patient-information',
	content: [
		pageHero( 'Patient information', 'What you may need to know between appointments', 'Prescriptions, results, fees and your rights. If the answer is not here, the desk will know.' ),
		section( { spacing: 0 }, [
			grid( { columns: 2, tablet: 2, spacing: 28 }, [
				[ 'file-invoice', 'Insurance and fees', 'We work with all major insurers and bill them directly. Services your insurance does not cover are listed at the desk, with their prices, before you agree to them.' ],
				[ 'prescription-bottle-alt', 'Repeat prescriptions', 'Ask by telephone or email at least two working days before you run out. Prescriptions are sent to the pharmacy you name, or kept at the desk.' ],
				[ 'vials', 'Test results', 'Your doctor calls you about any result that needs action. Normal results are sent by post or given at your next visit, as you prefer.' ],
				[ 'folder-open', 'Your records', 'You may see your record and have a copy at any time. We share it with other doctors only with your agreement.' ],
				[ 'wheelchair', 'Access', 'Step-free entrance, a lift to all floors and an accessible toilet on each. Tell us if you need an interpreter or more time.' ],
				[ 'comment-dots', 'Feedback and complaints', 'Tell the practice manager, in person or in writing. Every complaint gets a written answer within ten working days.' ],
			].map( ( [ name, title, body ] ) => card( [ iconBox( name, title, body, { tag: 'h2', position: 'inline-start' } ) ] ) ) ),
		] ),
		bookBand(),
	],
};

pages.contact = {
	title: 'Contact',
	content: [
		pageHero( 'Contact', 'Linden Clinic, 8 Linden Avenue', 'Ten minutes on foot from Lindenhof station. Bus 12 and 31 stop at the door.' ),
		section( { spacing: 0 }, [
			row( { spacing: 48, align: 'flex-start', tablet: 'column' }, [
				column( { width: 56, spacing: 28, more: { width_tablet: percent( 100 ) } }, [
					grid( { columns: 2, tablet: 2, spacing: 24 }, [
						card( [ iconBox( 'phone-alt', 'Telephone', 'Appointments and questions, from 7:30 on weekdays.', { tag: 'h2' } ), fact( PHONE, { size: 19, more: { link: link( TEL ) } } ) ] ),
						card( [ iconBox( 'envelope', 'Email', 'For anything that can wait a working day.', { tag: 'h2' } ), fact( EMAIL, { size: 19, more: { link: link( `mailto:${ EMAIL }` ) } } ) ] ),
					] ),
					image( 'building' ),
				] ),
				column( { width: 44, spacing: 28, more: { width_tablet: percent( 100 ) } }, [
					hoursCard(),
					card( [ heading( 'Getting here', { tag: 'h2', size: px( 22 ) } ), list( [ { text: 'Bus 12 and 31, stop “Linden Avenue”', icon: 'bus' }, { text: 'Parking behind the building, two hours free', icon: 'parking' }, { text: 'Step-free entrance and a lift', icon: 'wheelchair' } ], { color: C.ink, iconColor: C.teal } ) ], { background: C.sand, more: { box_shadow_box_shadow_type: '' } } ),
				] ),
			] ),
		] ),
		bookBand(),
	],
};

// The posts page: listed by the theme's blog template, so it has no Elementor content.
pages.notes = { title: 'Health Notes', slug: 'health-notes', plain: true };

/* -------------------------------------------------------------------------
   Header, footer and "page not found"
   ---------------------------------------------------------------------- */
const footLinks = ( title, items ) =>
	column( { width: 20, spacing: 14, more: { width_tablet: percent( 30 ) } }, [
		fact( title, { color: C.white, size: 16, weight: 700 } ),
		list( items.map( ( [ name, url ] ) => ( { text: name, url } ) ), { color: C.haze, more: { view: 'traditional', icon_size: px( 0 ), text_indent: px( 0 ), text_color_hover: C.white } } ),
	] );

const parts = {
	header: {
		title: 'Header',
		location: 'header',
		content: [
			// A narrow bar with the hours and the telephone number, above the main bar.
			container( { content_width: 'boxed', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'space-between', flex_justify_content_mobile: 'center', flex_gap: gap( 24 ), padding: box( 9, 24 ), padding_mobile: box( 8, 20 ), background_background: 'classic', background_color: C.deep }, [
				fact( 'Monday to Friday 7:30 to 19:00, Saturday 9:00 to 13:00', { color: C.haze, size: 14, weight: 500, more: { hide_mobile: 'hidden-mobile' } } ),
				fact( `Appointments: ${ PHONE }`, { color: C.white, size: 14, weight: 600, more: { link: link( TEL ) } } ),
			] ),
			container(
				{ content_width: 'boxed', flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'space-between', flex_gap: gap( 32 ), flex_wrap: 'nowrap', padding: box( 16, 24 ), padding_mobile: box( 10, 20 ), background_background: 'classic', background_color: C.white, border_border: 'solid', border_width: box( 0, 0, 1, 0 ), border_color: C.line },
				[
					// The name with its mark. A container is as wide as its parent unless told otherwise, so it gets a width.
					container( { content_width: 'full', width: px( 196 ), width_mobile: px( 190 ), flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_gap: gap( 10 ), flex_wrap: 'nowrap', padding: box( 0 ), _flex_size: 'none' }, [
						widget( 'icon', { selected_icon: icon( 'plus' ), view: 'stacked', shape: 'circle', primary_color: C.teal, secondary_color: C.white, size: px( 14 ), icon_padding: px( 9 ), _flex_size: 'none' } ),
						heading( 'Linden Clinic', { tag: 'p', color: C.ink, size: px( 22 ), weight: 700, more: { link: link( page( 'home' ) ), typography_letter_spacing: px( -0.3 ), _flex_size: 'none' } } ),
					] ),
					container( { content_width: 'full', width: percent( 10 ), width_mobile: percent( 10 ), flex_direction: 'row', flex_direction_mobile: 'row', flex_align_items: 'center', flex_justify_content: 'flex-end', flex_gap: gap( 20 ), flex_wrap: 'nowrap', padding: box( 0 ), _flex_size: 'grow' }, [
						widget( 'of-nav-menu', { align: 'flex-end', color: C.ink, color_active: C.teal, typography_typography: 'custom', typography_font_size: px( 16 ), typography_font_weight: '600', _flex_size: 'grow' } ),
						button( 'Book an appointment', page( 'appointment' ), { more: { size: 'sm', hide_mobile: 'hidden-mobile', hide_tablet: 'hidden-tablet' } } ),
					] ),
				]
			),
		],
	},
	footer: {
		title: 'Footer',
		location: 'footer',
		content: [
			b.section( { background: C.ink, top: 80, bottom: 32, spacing: 48 }, [
				row( { spacing: 48, align: 'flex-start', tablet: 'row', more: { flex_wrap_tablet: 'wrap' } }, [
					column( { width: 40, spacing: 14, more: { width_tablet: percent( 100 ) } }, [
						heading( 'Linden Clinic', { tag: 'p', color: C.white, size: px( 24 ), weight: 700 } ),
						text( '<p>Family medicine and specialists in Lindenhof since 2008. In an emergency, call your local emergency number.</p>', { color: C.haze } ),
					] ),
					footLinks( 'Clinic', [ [ 'Departments', page( 'departments' ) ], [ 'Doctors', page( 'doctors' ) ], [ 'About', page( 'about' ) ], [ 'Health notes', page( 'notes' ) ] ] ),
					footLinks( 'Patients', [ [ 'Book an appointment', page( 'appointment' ) ], [ 'Patient information', page( 'patients' ) ], [ 'Contact', page( 'contact' ) ] ] ),
					footLinks( 'Reach us', [ [ PHONE, TEL ], [ EMAIL, `mailto:${ EMAIL }` ] ] ),
				] ),
				container( { content_width: 'full', flex_direction: 'column', padding: box( 24, 0, 0, 0 ), border_border: 'solid', border_width: box( 1, 0, 0, 0 ), border_color: '#27474A' }, [ fact( '© Linden Clinic. A fictional practice, made for the Open Frame Medical starter site. Nothing on this site is medical advice.', { color: C.haze, size: 14, weight: 400 } ) ] ),
			] ),
		],
	},
	'not-found': {
		title: 'Page not found',
		location: '404',
		content: [
			section( { background: C.mist, top: 128, bottom: 128, spacing: 0 }, [
				column( { width: 62, spacing: 18, align: 'center', more: { _flex_align_self: 'center' } }, [
					label( 'Error 404', { align: 'center' } ),
					heading( 'We could not find that page', { tag: 'h1', align: 'center' } ),
					text( '<p>It may have moved. If you were looking for an appointment or our opening hours, these will take you there.</p>', { align: 'center', size: px( 19 ) } ),
					row( { spacing: 14, justify: 'center', more: { flex_direction_mobile: 'row', flex_wrap: 'wrap', flex_justify_content_mobile: 'center', flex_align_items_mobile: 'center' } }, [ button( 'Back to the home page', page( 'home' ) ), button( 'Book an appointment', page( 'appointment' ), { more: outline } ) ] ),
				] ),
			] ),
		],
	},
};

/* -------------------------------------------------------------------------
   Site Settings, theme settings, menus, media and fonts
   ---------------------------------------------------------------------- */
const type = ( prefix, options ) => kitTypography( prefix, { family: FONT, ...options } );

const kit = {
	// The convention the theme's "Use Elementor global colors and fonts" option expects:
	// Primary = brand, Secondary = headings, Text = body, Accent = highlight.
	system_colors: [
		{ _id: 'primary', title: 'Primary', color: C.teal },
		{ _id: 'secondary', title: 'Secondary', color: C.ink },
		{ _id: 'text', title: 'Text', color: C.text },
		{ _id: 'accent', title: 'Accent', color: C.aqua },
	],
	custom_colors: [
		{ _id: 'ofdeep', title: 'Deep', color: C.deep },
		{ _id: 'ofmist', title: 'Mist', color: C.mist },
		{ _id: 'ofsand', title: 'Sand', color: C.sand },
		{ _id: 'ofline', title: 'Line', color: C.line },
	],
	system_typography: [
		{ _id: 'primary', title: 'Primary', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '700' },
		{ _id: 'secondary', title: 'Secondary', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '600' },
		{ _id: 'text', title: 'Text', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '400' },
		{ _id: 'accent', title: 'Accent', typography_typography: 'custom', typography_font_family: FONT, typography_font_weight: '600' },
	],
	container_width: px( 1200 ),
	body_color: C.text,
	...type( 'body', { fontSize: px( 17 ), weight: 400, lineHeight: 1.7 } ),
	link_normal_color: C.teal,
	link_hover_color: C.tealDark,
	h1_color: C.ink,
	...type( 'h1', { fontSize: fluid( 'clamp(2.125rem, 1.3rem + 3.6vw, 3.75rem)' ), weight: 700, lineHeight: 1.1, spacing: -0.025 } ),
	h2_color: C.ink,
	...type( 'h2', { fontSize: fluid( 'clamp(1.75rem, 1.3rem + 1.8vw, 2.625rem)' ), weight: 700, lineHeight: 1.15, spacing: -0.02 } ),
	h3_color: C.ink,
	...type( 'h3', { fontSize: fluid( 'clamp(1.25rem, 1.15rem + 0.4vw, 1.4375rem)' ), weight: 700, lineHeight: 1.3, spacing: -0.01 } ),
	h4_color: C.ink,
	...type( 'h4', { fontSize: px( 18 ), weight: 700, lineHeight: 1.35 } ),
	...type( 'button', { fontSize: px( 16 ), weight: 600, lineHeight: 1.2 } ),
	button_text_color: C.white,
	button_background_color: C.teal,
	button_hover_text_color: C.white,
	button_hover_background_color: C.deep,
	button_border_radius: box( 12 ),
	button_padding: box( 15, 24 ),
};

const themeMods = {
	open_frame_follow_elementor: true,
	open_frame_color_primary: C.teal.toLowerCase(),
	open_frame_color_primary_hover: C.tealDark.toLowerCase(),
	open_frame_color_heading: C.ink.toLowerCase(),
	open_frame_color_text: C.text.toLowerCase(),
	open_frame_color_link: C.teal.toLowerCase(),
	open_frame_color_link_hover: C.tealDark.toLowerCase(),
	open_frame_color_accent: C.aqua.toLowerCase(),
	open_frame_color_border: C.line.toLowerCase(),
	open_frame_color_bg: C.mist.toLowerCase(),
	open_frame_container_width: 1200,
	open_frame_blog_style: 'grid',
	open_frame_blog_columns: 3,
	open_frame_blog_title: true,
	open_frame_blog_layout: 'full-width',
	open_frame_single_layout: 'no-sidebar',
	open_frame_page_layout: 'no-sidebar',
};

const licence = 'CC0-1.0. Original artwork generated for this starter site (tools/sites/medical-art.mjs).';
const mediaIndex = [
	{ uid: 'hero', file: 'hero.jpg', alt: 'Illustration of a doctor in a white coat with a stethoscope' },
	...doctors.map( ( person ) => ( { uid: person.uid, file: person.uid + '.jpg', alt: `Illustrated portrait of ${ person.name }` } ) ),
	{ uid: 'building', file: 'building.jpg', alt: 'The clinic building, with a cross above the door' },
	{ uid: 'reception', file: 'reception.jpg', alt: 'The reception desk and waiting area' },
	{ uid: 'room', file: 'room.jpg', alt: 'A consulting room with an examination couch and a monitor' },
	{ uid: 'family', file: 'family.jpg', alt: 'Three patients of different ages' },
	{ uid: 'cardio', file: 'cardio.jpg', alt: 'A heart with a heartbeat line across it' },
	...posts.map( ( post ) => ( { uid: post.image, file: post.image + '.jpg', alt: '' } ) ),
].map( ( entry ) => ( { ...entry, licence } ) );

const fonts = [ { family: FONT, weight: '200 800', style: 'normal', file: 'plus-jakarta-sans-latin.woff2', licence: 'OFL-1.1. Copyright 2020 The Plus Jakarta Sans Project Authors.' } ];

const used = writeSite( {
	site: SITE,
	out: OUT,
	pages,
	parts,
	posts,
	kit,
	themeMods,
	options: { show_on_front: 'page', page_on_front: page( 'home' ), page_for_posts: page( 'notes' ) },
	menus: [ { uid: 'primary', name: 'Primary', location: 'primary', items: [ [ 'Departments', 'departments' ], [ 'Doctors', 'doctors' ], [ 'Patients', 'patients' ], [ 'About', 'about' ], [ 'Health Notes', 'notes' ], [ 'Contact', 'contact' ] ].map( ( [ title, name ] ) => ( { title, url: page( name ) } ) ) } ],
	media: mediaIndex,
	fonts,
	catalog: {
		summary: 'A calm, clear site for a clinic or practice: departments, a department page, doctors with profiles, how to book, patient information and health notes.',
		colors: [ C.teal.toLowerCase(), C.aqua.toLowerCase(), C.white.toLowerCase() ],
		pages: [ 'Home', 'About', 'Departments', 'Department Details', 'Doctors', 'Doctor Profile', 'Book an Appointment', 'Patient Information', 'Health Notes (blog)', 'Single Post', 'Contact', '404' ],
		screenshots: [ { title: 'Departments', file: 'departments.png' }, { title: 'Doctor profile', file: 'doctor.png' }, { title: 'Appointments', file: 'appointments.png' } ],
		requires: { importer: '0.4.0' },
	},
} );

console.log( `Medical: ${ Object.keys( pages ).length } pages, ${ Object.keys( parts ).length } site parts, ${ posts.length } posts. Widgets: ${ used.join( ', ' ) }` );
