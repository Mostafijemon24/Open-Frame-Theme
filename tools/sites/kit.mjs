/**
 * Small helpers for writing a starter site as data.
 *
 * A site generator (for example business.mjs) describes pages with these
 * functions and writes plain JSON into starter-sites/<site>/. The JSON is what
 * gets packaged and imported; the generator only exists so that a design is
 * written once, consistently, instead of by hand in forty files.
 *
 * Everything here produces Elementor's own format: flexbox and grid
 * containers and the classic widgets, with Elementor's setting names. Nothing
 * is positioned with custom CSS, so every part stays editable in the editor.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Element IDs are short hex strings; a counter keeps the output stable between runs. */
export function ids( seed = 0 ) {
	let counter = seed;
	return () => ( ++counter ).toString( 16 ).padStart( 7, '0' );
}

export const px = ( size ) => ( { unit: 'px', size, sizes: [] } );
export const em = ( size ) => ( { unit: 'em', size, sizes: [] } );
export const percent = ( size ) => ( { unit: '%', size, sizes: [] } );
/** A fluid size such as clamp(2rem, 1rem + 3vw, 4rem). */
export const fluid = ( value ) => ( { unit: 'custom', size: value, sizes: [] } );
export const fr = ( size ) => ( { unit: 'fr', size, sizes: [] } );

export const box = ( top, right = top, bottom = top, left = right ) => ( { unit: 'px', top: String( top ), right: String( right ), bottom: String( bottom ), left: String( left ), isLinked: top === right && top === bottom && top === left } );
export const gap = ( size, row = size ) => ( { unit: 'px', size, column: String( size ), row: String( row ), isLinked: size === row } );

export const icon = ( name ) => ( { value: 'fas fa-' + name, library: 'fa-solid' } );
export const media = ( uid ) => ( { id: `ofss://media/${ uid }`, url: `ofss://media/${ uid }` } );
export const page = ( name ) => `ofss://page/${ name }`;
export const link = ( url ) => ( { url, is_external: '', nofollow: '', custom_attributes: '' } );

/**
 * The element builders of a site, sharing one ID counter.
 *
 * @param {Function} id ID generator from ids().
 */
export function builders( id ) {
	const widget = ( widgetType, settings ) => ( { id: id(), elType: 'widget', widgetType, settings, elements: [] } );
	const container = ( settings, elements ) => ( { id: id(), elType: 'container', settings, elements } );

	return {
		widget,
		container,

		/** A full-width band with its content held to the site width. */
		section( { background, top = 112, bottom = top, spacing = 56, more = {} }, elements ) {
			return container(
				{
					content_width: 'boxed',
					flex_direction: 'column',
					flex_gap: gap( spacing ),
					flex_gap_mobile: gap( Math.min( spacing, 32 ) ),
					padding: box( top, 24, bottom, 24 ),
					padding_tablet: box( Math.round( top * 0.7 ), 24, Math.round( bottom * 0.7 ), 24 ),
					padding_mobile: box( Math.min( top, 56 ), 20, Math.min( bottom, 56 ), 20 ),
					...( background ? { background_background: 'classic', background_color: background } : {} ),
					...more,
				},
				elements
			);
		},

		/** Children side by side, stacked on phones. */
		row( { spacing = 56, align = 'stretch', justify, tablet = 'row', more = {} }, elements ) {
			return container(
				{
					content_width: 'full',
					flex_direction: 'row',
					flex_direction_tablet: tablet,
					flex_direction_mobile: 'column',
					flex_align_items: align,
					// Stacked on a phone, children take the full width instead of keeping the desktop alignment.
					flex_align_items_mobile: 'stretch',
					...( justify ? { flex_justify_content: justify } : {} ),
					flex_gap: gap( spacing ),
					flex_gap_mobile: gap( Math.min( spacing, 32 ) ),
					padding: box( 0 ),
					...more,
				},
				elements
			);
		},

		/** One column of a row. `width` is its share on tablets and up, in percent. */
		column( { width, spacing = 20, justify, align, more = {} }, elements ) {
			return container(
				{
					content_width: 'full',
					flex_direction: 'column',
					flex_gap: gap( spacing ),
					...( justify ? { flex_justify_content: justify } : {} ),
					...( align ? { flex_align_items: align } : {} ),
					...( width ? { width: percent( width ), width_mobile: percent( 100 ) } : {} ),
					padding: box( 0 ),
					...more,
				},
				elements
			);
		},

		/** A grid that goes from `columns` to two columns on tablets and one on phones. */
		grid( { columns, tablet = Math.min( columns, 2 ), spacing = 24, more = {} }, elements ) {
			return container(
				{
					container_type: 'grid',
					content_width: 'full',
					grid_columns_grid: fr( columns ),
					grid_columns_grid_tablet: fr( tablet ),
					grid_columns_grid_mobile: fr( 1 ),
					grid_rows_grid: fr( 1 ),
					grid_gaps: gap( spacing ),
					padding: box( 0 ),
					...more,
				},
				elements
			);
		},

		heading( title, { tag = 'h2', color, align, size, weight, more = {} } = {} ) {
			return widget( 'heading', {
				title,
				header_size: tag,
				// Without a color of its own a heading follows the global heading color,
				// so changing that one global in Site Settings restyles the site.
				...( color ? { title_color: color } : { __globals__: { title_color: 'globals/colors?id=secondary' } } ),
				...( align ? { align } : {} ),
				...( size || weight ? { typography_typography: 'custom' } : {} ),
				...( size ? { typography_font_size: size } : {} ),
				...( weight ? { typography_font_weight: String( weight ) } : {} ),
				...more,
			} );
		},

		text( html, { color, align, size, more = {} } = {} ) {
			return widget( 'text-editor', {
				editor: html,
				...( color ? { text_color: color } : {} ),
				...( align ? { align } : {} ),
				...( size ? { typography_typography: 'custom', typography_font_size: size } : {} ),
				...more,
			} );
		},

		button( text, url, { more = {}, kit = false } = {} ) {
			// A plain button uses the global brand color; a styled one carries its own;
			// with `kit` it is left to the button style of Site Settings.
			const globals = kit || more.background_color ? {} : { __globals__: { background_color: 'globals/colors?id=primary' } };
			return widget( 'button', { text, link: link( url ), ...globals, ...more } );
		},

		image( uid, { radius = 16, more = {} } = {} ) {
			return widget( 'image', { image: media( uid ), image_size: 'full', image_border_radius: box( radius ), ...more } );
		},

		list( items, { iconName = 'check', color, iconColor, more = {} } = {} ) {
			return widget( 'icon-list', {
				icon_list: items.map( ( item ) => ( { _id: id(), text: typeof item === 'string' ? item : item.text, selected_icon: icon( ( typeof item === 'object' && item.icon ) || iconName ), ...( typeof item === 'object' && item.url ? { link: link( item.url ) } : {} ) } ) ),
				space_between: px( 12 ),
				icon_size: px( 16 ),
				text_indent: px( 12 ),
				...( color ? { text_color: color } : {} ),
				...( iconColor ? { icon_color: iconColor } : {} ),
				...more,
			} );
		},

		counter( number, title, { suffix = '', prefix = '', color, titleColor, weight = 700 } = {} ) {
			return widget( 'counter', {
				starting_number: 0,
				ending_number: number,
				prefix,
				suffix,
				title,
				duration: 1200,
				...( color ? { number_color: color } : {} ),
				...( titleColor ? { title_color: titleColor } : {} ),
				typography_number_typography: 'custom',
				typography_number_font_size: fluid( 'clamp(2.25rem, 1.6rem + 2.4vw, 3.5rem)' ),
				typography_number_font_weight: String( weight ),
				typography_title_typography: 'custom',
				typography_title_font_size: px( 15 ),
				typography_title_font_weight: '500',
			} );
		},

		divider( color ) {
			return widget( 'divider', { color, weight: px( 1 ), gap: px( 2 ) } );
		},
	};
}

/** Write a JSON file, creating its folder. */
/**
 * The media index entries of a design's photographs, read from the record that
 * tools/sites/photos.mjs wrote (photos.json in the design's folder).
 *
 * @param {string} out    The design's folder.
 * @param {Object} [alts] Alt texts by uid, where the design names what the record only describes
 *                        (a member of staff, a dish on the menu).
 */
export function photoIndex( out, alts = {} ) {
	const file = path.join( out, 'photos.json' );
	return ( fs.existsSync( file ) ? JSON.parse( fs.readFileSync( file, 'utf8' ) ) : [] ).map( ( photo ) => ( {
		uid: photo.uid,
		file: photo.file,
		alt: alts[ photo.uid ] ?? photo.alt,
		licence: `${ photo.licence === 'CC0' ? 'CC0-1.0' : photo.licence }. Photograph by ${ photo.author }, from ${ photo.source }.`,
		author: photo.author,
	} ) );
}

export function writeJson( file, data ) {
	fs.mkdirSync( path.dirname( file ), { recursive: true } );
	fs.writeFileSync( file, JSON.stringify( data, null, '\t' ) + '\n' );
}

/** Elementor Pro's way of saying "fill this in from the current post": a dynamic tag, such as post-title. */
export const dynamic = ( name ) => `[elementor-tag id="" name="${ name }" settings="%7B%7D"]`;

/** A menu of the design, for widgets that ask which menu to show. */
export const menu = ( uid ) => `ofss://menu/${ uid }`;

/** Widget types used in an element tree. */
export function widgetsOf( elements, found = new Set() ) {
	for ( const element of elements || [] ) {
		if ( element.elType === 'widget' ) {
			found.add( element.widgetType );
		}
		widgetsOf( element.elements, found );
	}
	return found;
}

/** Block markup for the body of a blog post. */
export const blocks = {
	paragraph: ( html ) => `<!-- wp:paragraph -->\n<p>${ html }</p>\n<!-- /wp:paragraph -->`,
	heading: ( title ) => `<!-- wp:heading -->\n<h2 class="wp-block-heading">${ title }</h2>\n<!-- /wp:heading -->`,
	quote: ( html ) => `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><!-- wp:paragraph -->\n<p>${ html }</p>\n<!-- /wp:paragraph --></blockquote>\n<!-- /wp:quote -->`,
	list: ( items ) => `<!-- wp:list -->\n<ul class="wp-block-list">${ items.map( ( item ) => `<!-- wp:list-item -->\n<li>${ item }</li>\n<!-- /wp:list-item -->` ).join( '' ) }</ul>\n<!-- /wp:list -->`,
};

/** Typography settings of one element of Elementor's Site Settings (body, h1 … h6, button). */
export const kitTypography = ( prefix, { family, fontSize, weight, lineHeight, spacing, style, transform } ) => ( {
	[ `${ prefix }_typography_typography` ]: 'custom',
	[ `${ prefix }_typography_font_family` ]: family,
	...( fontSize ? { [ `${ prefix }_typography_font_size` ]: fontSize } : {} ),
	...( weight ? { [ `${ prefix }_typography_font_weight` ]: String( weight ) } : {} ),
	...( style ? { [ `${ prefix }_typography_font_style` ]: style } : {} ),
	...( transform ? { [ `${ prefix }_typography_text_transform` ]: transform } : {} ),
	...( lineHeight ? { [ `${ prefix }_typography_line_height` ]: em( lineHeight ) } : {} ),
	...( spacing !== undefined ? { [ `${ prefix }_typography_letter_spacing` ]: em( spacing ) } : {} ),
} );

/**
 * Write a whole starter site to its folder.
 *
 * @param {Object}   design
 * @param {string}   design.site      Folder name under starter-sites/.
 * @param {string}   design.out       That folder.
 * @param {Object}   design.pages     name => { title, slug?, front_page?, plain?, content }.
 * @param {Object}   design.parts     name => { title, location, content }. Site parts, for designs of the free tier.
 * @param {Object}   [design.templates] name => { title, type, conditions, content }. Theme Builder templates, for designs of the Pro tier.
 * @param {Object[]} design.posts     { name, title, excerpt, image, category, days, content }.
 * @param {Object}   design.kit       Elementor Site Settings.
 * @param {Object}   design.themeMods Theme settings.
 * @param {Object}   design.options   Front page and posts page.
 * @param {Object[]} design.menus     Menus.
 * @param {Object[]} design.media     Media index.
 * @param {Object[]} [design.fonts]   Font index.
 * @param {Object}   design.catalog   Fields of site.json to refresh.
 * @return {string[]} The widget types the design uses.
 */
export function writeSite( { site, out, pages, parts = {}, templates = {}, posts = [], kit, themeMods, options, menus, media, fonts, catalog } ) {
	for ( const dir of [ 'content', 'site' ] ) {
		fs.rmSync( path.join( out, dir ), { recursive: true, force: true } );
	}

	const used = new Set();

	for ( const [ name, def ] of Object.entries( pages ) ) {
		const data = { uid: `${ site }:pages:${ name }`, title: def.title, slug: def.slug || name, ...( def.front_page ? { front_page: true } : {} ), template: def.plain ? 'default' : 'elementor_header_footer' };
		if ( ! def.plain ) {
			data.elementor = { version: '4.4.2', type: 'wp-page', page_settings: { hide_title: 'yes' }, content: def.content };
			widgetsOf( def.content, used );
		}
		writeJson( path.join( out, 'content/pages', name + '.json' ), data );
	}

	for ( const [ name, def ] of Object.entries( parts ) ) {
		widgetsOf( def.content, used );
		writeJson( path.join( out, 'content/site-parts', name + '.json' ), { uid: `${ site }:site-parts:${ name }`, title: def.title, location: def.location, elementor: { version: '4.4.2', type: 'wp-post', page_settings: {}, content: def.content } } );
	}

	for ( const [ name, def ] of Object.entries( templates ) ) {
		widgetsOf( def.content, used );
		writeJson( path.join( out, 'content/templates', name + '.json' ), { uid: `${ site }:templates:${ name }`, title: def.title, type: def.type, conditions: def.conditions, elementor: { version: '4.4.2', type: def.type, page_settings: def.settings || {}, content: def.content } } );
	}

	for ( const post of posts ) {
		writeJson( path.join( out, 'content/posts', post.name + '.json' ), {
			uid: `${ site }:posts:${ post.name }`,
			title: post.title,
			slug: post.name,
			excerpt: post.excerpt,
			featured: `ofss://media/${ post.image }`,
			categories: [ post.category ],
			days_ago: post.days,
			content: post.content.join( '\n\n' ),
		} );
	}

	writeJson( path.join( out, 'site/kit.json' ), kit );
	writeJson( path.join( out, 'site/theme-mods.json' ), themeMods );
	writeJson( path.join( out, 'site/options.json' ), options );
	writeJson( path.join( out, 'site/menus.json' ), menus );
	writeJson( path.join( out, 'media/index.json' ), media );
	if ( fonts ) {
		writeJson( path.join( out, 'fonts/index.json' ), fonts );
	}

	// The catalog entry keeps its hand-written fields; the generated ones are refreshed.
	const siteFile = path.join( out, 'site.json' );
	const entry = JSON.parse( fs.readFileSync( siteFile, 'utf8' ) );
	const { requires = {}, ...rest } = catalog;
	Object.assign( entry, rest, { status: 'available' } );
	Object.assign( entry.requires, requires, { elementor: { widgets: [ ...used ].sort() } } );
	writeJson( siteFile, entry );

	return [ ...used ].sort();
}
