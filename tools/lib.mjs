/**
 * Builds the Open Frame starter site library from the sources in starter-sites/.
 *
 * Output (one tree, uploaded as it is):
 *
 *   v1/catalog.json                              signed list of sites
 *   v1/previews/<site>/<file>                    preview images
 *   v1/sites/<site>/<version>/manifest.json      what a package contains, with hashes
 *   v1/sites/<site>/<version>/package.zip        JSON only
 *   v1/sites/<site>/<version>/media/<sha256>.<ext>
 *   v1/sites/<site>/<version>/fonts/<sha256>.woff2
 *
 * Integrity chain: the catalog is signed (Ed25519); it holds the SHA-256 of
 * every manifest; a manifest holds the SHA-256 and size of the package and of
 * every media and font file. Nothing here needs a network connection.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export const FORMAT = 1;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const VERSION = /^\d+(?:\.\d+){0,3}$/;

/** External hosts a package may link to (embeds and placeholder profiles). */
export const LINK_HOSTS = [ 'www.google.com', 'maps.google.com', 'www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com', 'example.com' ];

/** Theme and WordPress settings a package may set. Anything else is refused. */
export const OPTION_KEYS = [ 'show_on_front', 'page_on_front', 'page_for_posts', 'posts_per_page', 'permalink_structure' ];
export const THEME_MOD_PREFIX = 'open_frame_';

export const LIMITS = { packageBytes: 2 * 1024 * 1024, imageBytes: 400 * 1024, previewBytes: 400 * 1024, mediaBytes: 25 * 1024 * 1024 };

/** Kinds of Elementor Pro Theme Builder template a design may bring. */
const TEMPLATE_TYPES = [ 'header', 'footer', 'single-post', 'single-page', 'archive', 'search-results', 'error-404' ];

const MEDIA_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif' };

export const sha256 = ( data ) => crypto.createHash( 'sha256' ).update( data ).digest( 'hex' );

const readJson = ( file ) => JSON.parse( fs.readFileSync( file, 'utf8' ) );
const json = ( value ) => JSON.stringify( value, null, '\t' ) + '\n';

/* -------------------------------------------------------------------------
   Signing
   ---------------------------------------------------------------------- */

/** A new Ed25519 key pair. The private key is PEM; the public key is the raw 32 bytes in base64. */
export function generateKeyPair() {
	const { publicKey, privateKey } = crypto.generateKeyPairSync( 'ed25519' );
	const raw = publicKey.export( { type: 'spki', format: 'der' } ).subarray( -32 );
	return { privateKey: privateKey.export( { type: 'pkcs8', format: 'pem' } ), publicKey: raw.toString( 'base64' ), keyId: keyId( raw ) };
}

/** Short name of a public key: the first 8 hex characters of its SHA-256. */
export const keyId = ( rawPublicKey ) => sha256( rawPublicKey ).slice( 0, 8 );

/** Raw public key (32 bytes) that belongs to a private key in PEM. */
export function publicKeyOf( privateKeyPem ) {
	return crypto.createPublicKey( crypto.createPrivateKey( privateKeyPem ) ).export( { type: 'spki', format: 'der' } ).subarray( -32 );
}

/**
 * Wrap a document in a signed envelope.
 *
 * The document travels as a string, and the signature covers exactly those
 * bytes, so there is one file to publish and nothing to canonicalize.
 */
export function signDocument( document, privateKeyPems ) {
	const signed = JSON.stringify( document );
	const signatures = [].concat( privateKeyPems ).map( ( pem ) => ( {
		alg: 'ed25519',
		key: keyId( publicKeyOf( pem ) ),
		sig: crypto.sign( null, Buffer.from( signed ), crypto.createPrivateKey( pem ) ).toString( 'base64' ),
	} ) );
	return { signed, signatures };
}

/** The document inside an envelope, if one of the given public keys (base64, by key ID) signed it. */
export function openEnvelope( envelope, publicKeys ) {
	if ( ! envelope || typeof envelope.signed !== 'string' || ! Array.isArray( envelope.signatures ) ) {
		throw new Error( 'Not a signed envelope.' );
	}
	for ( const signature of envelope.signatures ) {
		const key = publicKeys[ signature.key ];
		if ( ! key || signature.alg !== 'ed25519' ) {
			continue;
		}
		const der = Buffer.concat( [ Buffer.from( '302a300506032b6570032100', 'hex' ), Buffer.from( key, 'base64' ) ] );
		if ( crypto.verify( null, Buffer.from( envelope.signed ), crypto.createPublicKey( { key: der, format: 'der', type: 'spki' } ), Buffer.from( signature.sig, 'base64' ) ) ) {
			return JSON.parse( envelope.signed );
		}
	}
	throw new Error( 'No valid signature from a known key.' );
}

/* -------------------------------------------------------------------------
   ZIP (deterministic: sorted entries, fixed dates, so equal input gives an equal file)
   ---------------------------------------------------------------------- */

export function zip( entries ) {
	const sorted = [ ...entries ].sort( ( a, b ) => ( a.name < b.name ? -1 : 1 ) );
	const local = [];
	const central = [];
	let offset = 0;

	for ( const entry of sorted ) {
		const name = Buffer.from( entry.name, 'utf8' );
		const data = Buffer.from( entry.data );
		const packed = zlib.deflateRawSync( data, { level: 9 } );
		const crc = zlib.crc32( data );

		const header = Buffer.alloc( 30 );
		header.writeUInt32LE( 0x04034b50, 0 );
		header.writeUInt16LE( 20, 4 ); // Version needed.
		header.writeUInt16LE( 0x0800, 6 ); // UTF-8 names.
		header.writeUInt16LE( 8, 8 ); // Deflate.
		header.writeUInt16LE( 0, 10 ); // Time 00:00.
		header.writeUInt16LE( 0x0021, 12 ); // Date 1980-01-01.
		header.writeUInt32LE( crc, 14 );
		header.writeUInt32LE( packed.length, 18 );
		header.writeUInt32LE( data.length, 22 );
		header.writeUInt16LE( name.length, 26 );
		local.push( header, name, packed );

		const record = Buffer.alloc( 46 );
		record.writeUInt32LE( 0x02014b50, 0 );
		record.writeUInt16LE( 20, 4 );
		record.writeUInt16LE( 20, 6 );
		record.writeUInt16LE( 0x0800, 8 );
		record.writeUInt16LE( 8, 10 );
		record.writeUInt16LE( 0, 12 );
		record.writeUInt16LE( 0x0021, 14 );
		record.writeUInt32LE( crc, 16 );
		record.writeUInt32LE( packed.length, 20 );
		record.writeUInt32LE( data.length, 24 );
		record.writeUInt16LE( name.length, 28 );
		record.writeUInt32LE( offset, 42 );
		central.push( record, name );

		offset += 30 + name.length + packed.length;
	}

	const directory = Buffer.concat( central );
	const end = Buffer.alloc( 22 );
	end.writeUInt32LE( 0x06054b50, 0 );
	end.writeUInt16LE( sorted.length, 8 );
	end.writeUInt16LE( sorted.length, 10 );
	end.writeUInt32LE( directory.length, 12 );
	end.writeUInt32LE( offset, 16 );

	return Buffer.concat( [ ...local, directory, end ] );
}

/* -------------------------------------------------------------------------
   Images
   ---------------------------------------------------------------------- */

/** Width and height of a PNG, JPEG or WebP image, read from its header. Null when unknown. */
export function imageSize( data ) {
	if ( data.length > 24 && data.readUInt32BE( 0 ) === 0x89504e47 ) {
		return { width: data.readUInt32BE( 16 ), height: data.readUInt32BE( 20 ) };
	}
	if ( data.length > 30 && data.toString( 'ascii', 0, 4 ) === 'RIFF' && data.toString( 'ascii', 8, 12 ) === 'WEBP' ) {
		const kind = data.toString( 'ascii', 12, 16 );
		if ( kind === 'VP8X' ) {
			return { width: 1 + data.readUIntLE( 24, 3 ), height: 1 + data.readUIntLE( 27, 3 ) };
		}
		if ( kind === 'VP8 ' ) {
			return { width: data.readUInt16LE( 26 ) & 0x3fff, height: data.readUInt16LE( 28 ) & 0x3fff };
		}
		if ( kind === 'VP8L' ) {
			const bits = data.readUInt32LE( 21 );
			return { width: 1 + ( bits & 0x3fff ), height: 1 + ( ( bits >> 14 ) & 0x3fff ) };
		}
	}
	if ( data.length > 4 && data.readUInt16BE( 0 ) === 0xffd8 ) {
		let at = 2;
		while ( at + 9 < data.length && data[ at ] === 0xff ) {
			const marker = data[ at + 1 ];
			if ( marker >= 0xc0 && marker <= 0xcf && ! [ 0xc4, 0xc8, 0xcc ].includes( marker ) ) {
				return { width: data.readUInt16BE( at + 7 ), height: data.readUInt16BE( at + 5 ) };
			}
			at += 2 + data.readUInt16BE( at + 2 );
		}
	}
	return null;
}

/* -------------------------------------------------------------------------
   Sources
   ---------------------------------------------------------------------- */

/** Read categories and every site folder (folders starting with "_" are skipped). */
export function loadSources( root ) {
	const categories = readJson( path.join( root, 'categories.json' ) );
	const sites = fs
		.readdirSync( root, { withFileTypes: true } )
		.filter( ( entry ) => entry.isDirectory() && ! entry.name.startsWith( '_' ) && fs.existsSync( path.join( root, entry.name, 'site.json' ) ) )
		.map( ( entry ) => ( { dir: path.join( root, entry.name ), folder: entry.name, ...readJson( path.join( root, entry.name, 'site.json' ) ) } ) );
	return { categories, sites };
}

/** Every file below a folder, as paths relative to it, with "/" separators. */
function filesBelow( dir, base = dir ) {
	if ( ! fs.existsSync( dir ) ) {
		return [];
	}
	return fs.readdirSync( dir, { withFileTypes: true } ).flatMap( ( entry ) => {
		const full = path.join( dir, entry.name );
		return entry.isDirectory() ? filesBelow( full, base ) : [ path.relative( base, full ).split( path.sep ).join( '/' ) ];
	} );
}

/** Visit every string in a JSON value. */
function eachString( value, visit, trail = '' ) {
	if ( typeof value === 'string' ) {
		visit( value, trail );
	} else if ( Array.isArray( value ) ) {
		value.forEach( ( item, index ) => eachString( item, visit, `${ trail }[${ index }]` ) );
	} else if ( value && typeof value === 'object' ) {
		Object.entries( value ).forEach( ( [ key, item ] ) => eachString( item, visit, trail ? `${ trail }.${ key }` : key ) );
	}
}

/** Widget types used in an Elementor element tree. */
function widgetsIn( elements, found = new Set() ) {
	for ( const element of Array.isArray( elements ) ? elements : [] ) {
		if ( element && element.elType === 'widget' && typeof element.widgetType === 'string' ) {
			found.add( element.widgetType );
		}
		widgetsIn( element && element.elements, found );
	}
	return found;
}

/* -------------------------------------------------------------------------
   Validation
   ---------------------------------------------------------------------- */

/** Problems with a site's catalog entry and preview. An empty list means it can be listed. */
export function validateSite( site, categories ) {
	const problems = [];
	const need = ( condition, message ) => condition || problems.push( message );

	need( SLUG.test( site.id || '' ), 'id must be a slug' );
	need( site.id === site.folder, `id "${ site.id }" must match its folder "${ site.folder }"` );
	need( typeof site.name === 'string' && site.name.length > 0 && site.name.length <= 60, 'name is required (60 characters at most)' );
	need( typeof site.summary === 'string' && site.summary.length <= 300, 'summary must be text of 300 characters at most' );
	need( categories.some( ( category ) => category.slug === site.category ), `unknown category "${ site.category }"` );
	need( [ 'free', 'pro' ].includes( site.tier ), 'tier must be free or pro' );
	need( [ 'available', 'coming_soon' ].includes( site.status ), 'status must be available or coming_soon' );
	need( VERSION.test( site.version || '' ), 'version must look like 1.0.0' );
	need( Array.isArray( site.pages ) && site.pages.length > 0, 'pages are required' );

	const plugins = ( site.requires && site.requires.plugins ) || [];
	need( plugins.some( ( plugin ) => plugin.slug === 'elementor' && plugin.source === 'wordpress.org' ), 'Elementor must be listed as a WordPress.org plugin' );
	const pro = plugins.find( ( plugin ) => plugin.slug === 'elementor-pro' );
	need( site.tier !== 'pro' || ( pro && pro.source === 'external' && pro.required !== false ), 'a pro site must require Elementor Pro as an external plugin' );
	need( site.tier !== 'free' || ! pro, 'a free site must not list Elementor Pro' );
	for ( const plugin of plugins ) {
		need( SLUG.test( plugin.slug || '' ) && typeof plugin.file === 'string' && plugin.file.startsWith( plugin.slug + '/' ) && /^[a-z0-9-]+\/[a-z0-9._-]+\.php$/.test( plugin.file ), `plugin "${ plugin.slug }": file must be inside its own folder` );
		need( [ 'wordpress.org', 'external' ].includes( plugin.source ), `plugin "${ plugin.slug }": unknown source` );
	}

	const thumbnail = path.join( site.dir, 'preview', 'thumbnail.png' );
	if ( ! fs.existsSync( thumbnail ) ) {
		problems.push( 'preview/thumbnail.png is missing' );
	} else {
		const data = fs.readFileSync( thumbnail );
		const size = imageSize( data );
		need( data.length <= LIMITS.previewBytes, 'preview/thumbnail.png is larger than 400 KB' );
		need( size && size.width === 1200 && size.height === 900, 'preview/thumbnail.png must be 1200 x 900' );
	}

	need( site.status !== 'available' || fs.existsSync( path.join( site.dir, 'content' ) ), 'an available site needs a content folder' );

	return problems;
}

/**
 * Collect the package of a site and check it against the rules.
 *
 * @return {{ problems: string[], entries: {name: string, data: Buffer}[], media: object[], fonts: object[], pages: object[], widgets: string[] }}
 */
export function collectPackage( site ) {
	const problems = [];
	const entries = [];
	const documents = {};

	for ( const name of filesBelow( site.dir ).filter( ( file ) => /^(site|content|media|fonts)\//.test( file ) || file === 'LICENSES.md' ) ) {
		const full = path.join( site.dir, name );
		if ( /^media\/files\//.test( name ) || /^fonts\/files\//.test( name ) ) {
			continue; // Binaries travel outside the ZIP, by hash.
		}
		if ( ! /\.(json|md)$/.test( name ) ) {
			problems.push( `${ name }: only .json and .md files may be in a package` );
			continue;
		}
		const data = fs.readFileSync( full );
		if ( name.endsWith( '.json' ) ) {
			try {
				documents[ name ] = JSON.parse( data.toString( 'utf8' ) );
			} catch ( error ) {
				problems.push( `${ name }: not valid JSON` );
				continue;
			}
		}
		entries.push( { name, data } );
	}

	// Media and fonts: every listed file exists, matches its hash and stays within budget.
	const media = [];
	let mediaBytes = 0;
	for ( const item of ( documents[ 'media/index.json' ] || [] ) ) {
		const file = path.join( site.dir, 'media', 'files', String( item.file || '' ) );
		const extension = path.extname( file ).toLowerCase();
		if ( ! SLUG.test( item.uid || '' ) || ! MEDIA_TYPES[ extension ] || path.basename( file ) !== item.file || ! fs.existsSync( file ) ) {
			problems.push( `media "${ item.uid }": file missing or of a type that is not allowed` );
			continue;
		}
		const data = fs.readFileSync( file );
		const size = imageSize( data );
		mediaBytes += data.length;
		if ( data.length > LIMITS.imageBytes ) {
			problems.push( `media "${ item.uid }": larger than 400 KB` );
		}
		if ( ! item.alt && item.alt !== '' ) {
			problems.push( `media "${ item.uid }": alt text is required (use an empty string for decoration)` );
		}
		if ( ! item.licence ) {
			problems.push( `media "${ item.uid }": a licence is required` );
		}
		if ( ! size ) {
			problems.push( `media "${ item.uid }": the image could not be read` );
			continue;
		}
		media.push( { uid: item.uid, sha256: sha256( data ), bytes: data.length, mime: MEDIA_TYPES[ extension ], width: size.width, height: size.height, alt: item.alt || '', licence: item.licence || '', extension, source: file } );
	}
	if ( mediaBytes > LIMITS.mediaBytes ) {
		problems.push( 'media: more than 25 MB in total' );
	}

	const fonts = [];
	for ( const item of ( documents[ 'fonts/index.json' ] || [] ) ) {
		const file = path.join( site.dir, 'fonts', 'files', String( item.file || '' ) );
		if ( ! /^[a-z0-9._-]+\.woff2$/i.test( item.file || '' ) || ! fs.existsSync( file ) || ! item.family || ! item.licence ) {
			problems.push( `font "${ item.family }": a .woff2 file, a family name and a licence are required` );
			continue;
		}
		const data = fs.readFileSync( file );
		fonts.push( { family: item.family, weight: String( item.weight || '400' ), style: item.style || 'normal', sha256: sha256( data ), bytes: data.length, licence: item.licence, source: file } );
	}

	// Pages and site parts.
	const pages = [];
	const widgets = new Set();
	const uids = new Set();
	for ( const [ name, document ] of Object.entries( documents ) ) {
		const match = name.match( /^content\/(pages|posts|site-parts|templates|products)\/([a-z0-9-]+)\.json$/ );
		if ( ! match ) {
			continue;
		}
		const uid = `${ site.id }:${ match[ 1 ] }:${ match[ 2 ] }`;
		if ( document.uid !== uid ) {
			problems.push( `${ name }: uid must be "${ uid }"` );
		}
		uids.add( match[ 1 ] + '/' + match[ 2 ] );
		if ( match[ 1 ] === 'templates' ) {
			if ( ! TEMPLATE_TYPES.includes( document.type ) ) {
				problems.push( `${ name }: type must be one of ${ TEMPLATE_TYPES.join( ', ' ) }` );
			}
			if ( ! Array.isArray( document.conditions ) || ! document.conditions.length || ! document.conditions.every( ( condition ) => Array.isArray( condition ) && [ 'include', 'exclude' ].includes( condition[ 0 ] ) ) ) {
				problems.push( `${ name }: conditions must say where the template is used, for example [ [ "include", "general" ] ]` );
			}
			if ( site.tier !== 'pro' ) {
				problems.push( `${ name }: only a design of the Pro tier may bring Theme Builder templates` );
			}
		}
		if ( match[ 1 ] === 'pages' ) {
			pages.push( { uid, title: String( document.title || '' ), ...( document.front_page ? { front_page: true } : {} ) } );
		}
		widgetsIn( document.elementor && document.elementor.content, widgets );
	}

	// Nothing in a package may point at the place it was authored, run script, or reference something that is not there.
	const mediaUids = new Set( media.map( ( item ) => item.uid ) );
	for ( const [ name, document ] of Object.entries( documents ) ) {
		eachString( document, ( value, trail ) => {
			if ( /<script|javascript:|\son[a-z]+\s*=/i.test( value ) ) {
				problems.push( `${ name } (${ trail }): script is not allowed` );
			}
			for ( const url of value.match( /https?:\/\/[^\s"'<>)]+/g ) || [] ) {
				let host = '';
				try {
					host = new URL( url ).host;
				} catch ( error ) {}
				if ( ! url.startsWith( 'https://' ) || ! LINK_HOSTS.includes( host ) ) {
					problems.push( `${ name } (${ trail }): link to "${ host || url }" is not allowed; use ofss:// references` );
				}
			}
			for ( const [ , kind, uid ] of value.matchAll( /ofss:\/\/(media|page|post|site-part|product|menu|term)\/([a-z0-9-]+)/g ) ) {
				const known = kind === 'media' ? mediaUids.has( uid ) : kind === 'menu' || kind === 'term' ? true : uids.has( { page: 'pages', post: 'posts', 'site-part': 'site-parts', product: 'products' }[ kind ] + '/' + uid );
				if ( ! known ) {
					problems.push( `${ name } (${ trail }): ofss://${ kind }/${ uid } does not exist in this package` );
				}
			}
		} );
	}

	// Settings: allow-listed keys only.
	for ( const key of Object.keys( documents[ 'site/theme-mods.json' ] || {} ) ) {
		if ( ! key.startsWith( THEME_MOD_PREFIX ) ) {
			problems.push( `site/theme-mods.json: "${ key }" is not a theme setting of Open Frame` );
		}
	}
	for ( const key of Object.keys( documents[ 'site/options.json' ] || {} ) ) {
		if ( ! OPTION_KEYS.includes( key ) ) {
			problems.push( `site/options.json: "${ key }" may not be set by a package` );
		}
	}

	if ( pages.filter( ( page ) => page.front_page ).length !== 1 ) {
		problems.push( 'exactly one page must be the front page' );
	}

	const declared = new Set( ( site.requires.elementor && site.requires.elementor.widgets ) || [] );
	for ( const widget of widgets ) {
		if ( ! declared.has( widget ) ) {
			problems.push( `widget "${ widget }" is used but not listed in requires.elementor.widgets` );
		}
	}

	return { problems, entries, media, fonts, pages, widgets: [ ...widgets ].sort() };
}

/* -------------------------------------------------------------------------
   Build
   ---------------------------------------------------------------------- */

/**
 * Build the whole library.
 *
 * @param {Object}   options
 * @param {string}   options.sources     Folder with categories.json and the site folders.
 * @param {string}   options.out         Output folder; "v1" is created inside it.
 * @param {string}   options.apiUrl      Public address of the API, for example https://api.example.com/v1.
 * @param {string}   options.cdnUrl      Public address of the file host, for example https://cdn.example.com/v1.
 * @param {string[]} options.privateKeys Signing keys in PEM.
 * @param {string}   [options.generated] Timestamp to record (defaults to now).
 * @return {{ sites: number, packages: number, files: string[] }}
 */
export function buildLibrary( { sources, out, apiUrl, cdnUrl, privateKeys, generated } ) {
	const { categories, sites } = loadSources( sources );
	const root = path.join( out, 'v1' );
	const problems = [];
	const written = [];

	const write = ( relative, data ) => {
		const file = path.join( root, relative );
		fs.mkdirSync( path.dirname( file ), { recursive: true } );
		fs.writeFileSync( file, data );
		written.push( 'v1/' + relative );
	};

	const ids = new Set();
	const entries = [];
	let packages = 0;

	for ( const site of sites.sort( ( a, b ) => ( a.order ?? 100 ) - ( b.order ?? 100 ) || a.id.localeCompare( b.id ) ) ) {
		const siteProblems = validateSite( site, categories );
		if ( ids.has( site.id ) ) {
			siteProblems.push( 'duplicate id' );
		}
		ids.add( site.id );

		const previews = filesBelow( path.join( site.dir, 'preview' ) ).filter( ( file ) => /^[a-z0-9-]+\.(png|webp)$/.test( file ) );
		const screenshots = ( site.screenshots || [] ).filter( ( shot ) => previews.includes( shot.file ) ).map( ( shot ) => ( { title: shot.title, url: `${ cdnUrl }/previews/${ site.id }/${ shot.file }` } ) );

		const entry = {
			id: site.id,
			name: site.name,
			summary: site.summary,
			category: site.category,
			tags: site.tags || [],
			tier: site.tier,
			status: site.status,
			version: site.version,
			preview: { thumbnail: `${ cdnUrl }/previews/${ site.id }/thumbnail.png`, screenshots, demo_url: site.demo_url || '' },
			pages: site.pages,
			requires: { format: FORMAT, wordpress: site.requires.wordpress, php: site.requires.php, theme: site.requires.theme, importer: site.requires.importer, plugins: site.requires.plugins },
			editable: site.editable || {},
		};

		if ( site.status === 'available' && siteProblems.length === 0 ) {
			const collected = collectPackage( site );
			siteProblems.push( ...collected.problems );

			if ( collected.problems.length === 0 ) {
				const base = `sites/${ site.id }/${ site.version }`;
				const archive = zip( collected.entries );
				if ( archive.length > LIMITS.packageBytes ) {
					siteProblems.push( 'package.zip is larger than 2 MB' );
				}

				const manifest = {
					format: FORMAT,
					id: site.id,
					name: site.name,
					version: site.version,
					requires: { ...entry.requires, elementor: { widgets: collected.widgets } },
					editable: entry.editable,
					pages: collected.pages,
					files: Object.fromEntries( collected.entries.map( ( file ) => [ file.name, { sha256: sha256( file.data ), bytes: file.data.length } ] ) ),
					package: { url: `${ cdnUrl }/${ base }/package.zip`, sha256: sha256( archive ), bytes: archive.length },
					media: collected.media.map( ( { source, extension, ...item } ) => ( { ...item, url: `${ cdnUrl }/${ base }/media/${ item.sha256 }${ extension }` } ) ),
					fonts: collected.fonts.map( ( { source, ...item } ) => ( { ...item, url: `${ cdnUrl }/${ base }/fonts/${ item.sha256 }.woff2` } ) ),
				};
				const manifestBody = json( manifest );

				write( `${ base }/package.zip`, archive );
				write( `${ base }/manifest.json`, manifestBody );
				collected.media.forEach( ( item ) => write( `${ base }/media/${ item.sha256 }${ item.extension }`, fs.readFileSync( item.source ) ) );
				collected.fonts.forEach( ( item ) => write( `${ base }/fonts/${ item.sha256 }.woff2`, fs.readFileSync( item.source ) ) );

				entry.manifest = { url: `${ apiUrl }/${ base }/manifest.json`, sha256: sha256( manifestBody ) };
				packages++;
			}
		}

		if ( siteProblems.length ) {
			problems.push( ...siteProblems.map( ( problem ) => `${ site.folder }: ${ problem }` ) );
			continue;
		}

		previews.forEach( ( file ) => write( `previews/${ site.id }/${ file }`, fs.readFileSync( path.join( site.dir, 'preview', file ) ) ) );
		entries.push( entry );
	}

	if ( problems.length ) {
		const error = new Error( 'The library was not built:\n  ' + problems.join( '\n  ' ) );
		error.problems = problems;
		throw error;
	}

	const catalog = { format: FORMAT, generated: generated || new Date().toISOString().replace( /\.\d+Z$/, 'Z' ), categories, sites: entries };
	write( 'catalog.json', JSON.stringify( signDocument( catalog, privateKeys ) ) + '\n' );

	return { sites: entries.length, packages, files: written };
}

/**
 * Check a built library the way a client would: signature, then every hash.
 *
 * @return {string[]} Problems; empty when the tree is intact.
 */
export function verifyLibrary( out, publicKeys, { apiUrl, cdnUrl } ) {
	const root = path.join( out, 'v1' );
	const problems = [];
	const local = ( url ) => {
		for ( const base of [ apiUrl, cdnUrl ] ) {
			if ( url.startsWith( base + '/' ) ) {
				return path.join( root, url.slice( base.length + 1 ) );
			}
		}
		problems.push( `${ url }: not on the library's hosts` );
		return null;
	};
	const check = ( url, expected, bytes ) => {
		const file = local( url );
		if ( ! file ) {
			return null;
		}
		if ( ! fs.existsSync( file ) ) {
			problems.push( `${ url }: missing` );
			return null;
		}
		const data = fs.readFileSync( file );
		if ( sha256( data ) !== expected || ( bytes !== undefined && data.length !== bytes ) ) {
			problems.push( `${ url }: does not match its checksum` );
			return null;
		}
		return data;
	};

	let catalog;
	try {
		catalog = openEnvelope( readJson( path.join( root, 'catalog.json' ) ), publicKeys );
	} catch ( error ) {
		return [ 'catalog.json: ' + error.message ];
	}

	for ( const site of catalog.sites ) {
		const thumbnail = local( site.preview.thumbnail );
		if ( thumbnail && ! fs.existsSync( thumbnail ) ) {
			problems.push( `${ site.preview.thumbnail }: missing` );
		}
		if ( ! site.manifest ) {
			continue;
		}
		const manifestBody = check( site.manifest.url, site.manifest.sha256 );
		if ( ! manifestBody ) {
			continue;
		}
		const manifest = JSON.parse( manifestBody.toString( 'utf8' ) );
		check( manifest.package.url, manifest.package.sha256, manifest.package.bytes );
		[ ...manifest.media, ...manifest.fonts ].forEach( ( item ) => check( item.url, item.sha256, item.bytes ) );
	}

	return problems;
}
