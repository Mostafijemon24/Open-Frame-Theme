#!/usr/bin/env node
/**
 * Finds and prepares the photographs of a starter site.
 *
 * Photographs come from Wikimedia Commons, through its public API, and only
 * files that Commons records as CC0 or public domain are accepted: those may be
 * copied, changed and redistributed without conditions, which is what a design
 * that other people install and edit needs. Every prepared image is written with
 * a record of where it came from (photos.json and CREDITS.md in the site's
 * folder), so a licence can be checked again later.
 *
 *   node tools/sites/photos.mjs search "<words>" [--out <folder>] [--limit 24] [--min 2000] [--tall]
 *       Lists candidates and writes <folder>/sheet.png, a numbered contact sheet
 *       to choose from. Nothing is added to a site.
 *
 *   node tools/sites/photos.mjs fetch <site> [<uid> …]
 *       Reads starter-sites/<site>/photo-sources.json, checks the licence of each
 *       file again, crops it around its focal point, and writes
 *       media/files/<uid>.webp, photos.json and CREDITS.md.
 *
 *   node tools/sites/photos.mjs credits <site>
 *       Writes CREDITS.md again from photos.json, without asking Commons anything.
 *
 * photo-sources.json is a list of
 *   { "uid", "title": "File:… on Commons", "width", "height", "focal": [ x, y ] (0-100),
 *     "alt", "section", "subject" }
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const API = 'https://commons.wikimedia.org/w/api.php';
const AGENT = 'OpenFrameStarterSites/1.0 (photo research for starter sites)';
const ROOT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../starter-sites' );
/** What Commons calls the licences this tool accepts. */
const FREE = /^(cc0|cc-zero|public domain|pdm|pd\b|no restrictions)/i;
const IMAGE_BYTES = 320 * 1024;
/** A photograph at this density shows no compression marks at the sizes a page uses. */
const BYTES_PER_PIXEL = 0.2;

const sleep = ( ms ) => new Promise( ( done ) => setTimeout( done, ms ) );
const plain = ( html ) => String( html || '' ).replace( /<[^>]+>/g, '' ).replace( /&amp;/g, '&' ).replace( /&quot;/g, '"' ).replace( /&#0?39;/g, "'" ).replace( /\s+/g, ' ' ).trim();

/**
 * Commons gives the photographer of a picture that came from Unsplash as name and account
 * name run together ("Naomi Hébert naomish"). Written apart, it reads as a credit.
 */
const tidyAuthor = ( author, title ) => {
	// Sometimes only the address of the photographer's account is given: name the account and the site.
	const account = String( author ).trim().match( /^https?:\/\/(?:www\.)?([a-z0-9-]+)\.[a-z.]+\/(?:.*\/)?([^/]+?)(?:-\d+)?\/?$/i );
	if ( account ) {
		return `${ account[ 2 ] } (on ${ account[ 1 ][ 0 ].toUpperCase() + account[ 1 ].slice( 1 ) })`;
	}
	const words = String( author ).split( ' ' );
	return /\(Unsplash\)/.test( title ) && words.length > 1 && /^[a-z0-9_]+$/.test( words[ words.length - 1 ] ) ? `${ words.slice( 0, -1 ).join( ' ' ) } (@${ words[ words.length - 1 ] } on Unsplash)` : String( author );
};

/** A request that waits and tries again when the server asks for fewer requests. */
async function request( url, tries = 14 ) {
	for ( let attempt = 1; ; attempt++ ) {
		let status = 0;
		let wait = 0;
		try {
			const response = await fetch( url, { headers: { 'User-Agent': AGENT }, signal: AbortSignal.timeout( 90000 ) } );
			if ( response.ok ) {
				return response;
			}
			status = response.status;
			wait = Number( response.headers.get( 'retry-after' ) ) || 0;
		} catch ( error ) {
			status = 599; // No answer in time.
		}
		if ( ( status !== 429 && status < 500 ) || attempt >= tries ) {
			throw new Error( `${ status } for ${ url }` );
		}
		process.stderr.write( `  (${ status }, waiting before try ${ attempt + 1 })\n` );
		await sleep( Math.max( wait, attempt * 3 ) * 1000 );
	}
}

/** The bytes at an address. A download that stalls is given up and started again. */
async function download( url, tries = 4 ) {
	for ( let attempt = 1; ; attempt++ ) {
		let timer;
		try {
			const stalled = new Promise( ( resolve, reject ) => {
				timer = setTimeout( () => reject( new Error( 'stalled' ) ), 120000 );
			} );
			return Buffer.from( await Promise.race( [ request( url ).then( ( response ) => response.arrayBuffer() ), stalled ] ) );
		} catch ( error ) {
			if ( attempt >= tries ) {
				throw error;
			}
			process.stderr.write( `  (${ error.message }, downloading again)\n` );
		} finally {
			clearTimeout( timer );
		}
	}
}

async function api( parameters ) {
	const url = API + '?' + new URLSearchParams( { action: 'query', format: 'json', formatversion: '2', ...parameters } );
	await sleep( 1200 );
	return ( await request( url ) ).json();
}

/** What Commons knows about files: size, addresses, author and licence. */
function describe( page ) {
	const info = page.imageinfo?.[ 0 ];
	if ( ! info ) {
		return null;
	}
	const meta = Object.fromEntries( Object.entries( info.extmetadata || {} ).map( ( [ key, entry ] ) => [ key, plain( entry.value ) ] ) );
	return {
		title: page.title,
		width: info.width,
		height: info.height,
		mime: info.mime,
		original_url: info.url,
		scaled_url: info.thumburl || info.url,
		scaled_width: info.thumbwidth || info.width,
		source_url: info.descriptionurl,
		author: tidyAuthor( meta.Artist || meta.Credit || 'Unknown', page.title ),
		credit: meta.Credit || '',
		licence: meta.LicenseShortName || '',
		licence_url: meta.LicenseUrl || '',
		restrictions: meta.Restrictions || '',
		free: FREE.test( meta.LicenseShortName || '' ),
	};
}

const INFO = { prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|Credit|Restrictions' };

async function search( words, { limit = 24, min = 2000, tall = false } ) {
	// "haslicense:unrestricted" is how Commons names CC0 and public-domain files.
	const query = `${ words } haslicense:unrestricted filetype:bitmap filemime:image/jpeg ${ tall ? 'fileh' : 'filew' }:>${ min }`;
	const data = await api( { generator: 'search', gsrnamespace: '6', gsrlimit: String( limit ), gsrsearch: query, iiurlwidth: '500', ...INFO } );
	return ( data.query?.pages || [] ).sort( ( a, b ) => a.index - b.index ).map( describe ).filter( ( item ) => item && item.free && ( tall ? item.height >= item.width : true ) );
}

async function lookup( titles, width ) {
	const data = await api( { titles: titles.join( '|' ), iiurlwidth: String( width ), ...INFO } );
	return ( data.query?.pages || [] ).map( describe ).filter( Boolean );
}

async function browser() {
	const { chromium } = createRequire( import.meta.url )( 'playwright' );
	return chromium.launch();
}

const dataUrl = ( buffer, mime = 'image/jpeg' ) => `data:${ mime };base64,${ buffer.toString( 'base64' ) }`;

async function commandSearch( words, options ) {
	const out = path.resolve( options.out || 'photo-candidates' );
	fs.mkdirSync( out, { recursive: true } );
	const found = await search( words, options );
	const cells = [];
	for ( const [ index, item ] of found.entries() ) {
		try {
			const bytes = await download( item.scaled_url );
			await sleep( 400 );
			cells.push( `<figure><img src="${ dataUrl( bytes ) }"><figcaption><b>${ index + 1 }</b> ${ item.width }×${ item.height } · ${ item.licence }${ item.restrictions ? ' · ' + item.restrictions : '' }<br>${ item.author.slice( 0, 46 ) }</figcaption></figure>` );
		} catch ( error ) {
			cells.push( `<figure><figcaption><b>${ index + 1 }</b> preview failed</figcaption></figure>` );
		}
		console.log( `${ String( index + 1 ).padStart( 2 ) }  ${ item.width }x${ item.height }  ${ item.licence }  ${ item.title }` );
	}
	fs.writeFileSync( path.join( out, 'candidates.json' ), JSON.stringify( { query: words, found }, null, '\t' ) );
	if ( ! found.length ) {
		console.log( 'Nothing found.' );
		return;
	}
	const chrome = await browser();
	const page = await chrome.newPage( { viewport: { width: 1500, height: 800 } } );
	await page.setContent( `<style>body{margin:12px;font:12px/1.3 system-ui;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;background:#fff}figure{margin:0}img{width:100%;height:190px;object-fit:cover;display:block;background:#eee}b{font-size:15px;color:#b00}</style><title>${ words }</title>${ cells.join( '' ) }` );
	await page.screenshot( { path: path.join( out, 'sheet.png' ), fullPage: true } );
	await chrome.close();
	console.log( `${ found.length } candidates for "${ words }": ${ path.join( out, 'sheet.png' ) }` );
}

/** The record of a design's photographs as a page people can read (CREDITS.md). */
function writeCredits( site ) {
	const home = path.join( ROOT, site );
	const recordFile = path.join( home, 'photos.json' );
	const kept = JSON.parse( fs.readFileSync( recordFile, 'utf8' ) ).map( ( item ) => ( { ...item, author: tidyAuthor( item.author, decodeURIComponent( item.source_url ).replace( /_/g, ' ' ) ) } ) );
	fs.writeFileSync( recordFile, JSON.stringify( kept, null, '\t' ) + '\n' );
	fs.writeFileSync( path.join( home, 'CREDITS.md' ), [
		`# Photographs of the ${ site } starter site`,
		'',
		'Written by `tools/sites/photos.mjs`; do not edit by hand. Every photograph was taken from Wikimedia Commons, which records it as CC0 or public domain: it may be copied, changed and redistributed without conditions. The licence was read from Commons on the date shown. The files here are cropped and compressed copies.',
		'',
		'CC0 and the public domain cover copyright only. Where a photograph shows a person who can be recognised, a trade mark or a private building, the people who use the design remain responsible for how they use that picture; the starter site shows them as examples to be replaced.',
		'',
		'| File | Used for | Photographer | Licence | Source | Checked |',
		'| --- | --- | --- | --- | --- | --- |',
		...kept.map( ( item ) => `| \`media/files/${ item.file }\` | ${ item.section } | ${ item.author } | [${ item.licence }](${ item.licence_url }) | [Commons](${ item.source_url }) | ${ item.checked } |` ),
		'',
	].join( '\n' ) );
}

async function commandFetch( site, only ) {
	const home = path.join( ROOT, site );
	const folder = path.join( home, 'media' );
	const sources = JSON.parse( fs.readFileSync( path.join( home, 'photo-sources.json' ), 'utf8' ) );
	const recordFile = path.join( home, 'photos.json' );
	const records = new Map( ( fs.existsSync( recordFile ) ? JSON.parse( fs.readFileSync( recordFile, 'utf8' ) ) : [] ).map( ( item ) => [ item.uid, item ] ) );
	fs.mkdirSync( path.join( folder, 'files' ), { recursive: true } );

	const chrome = await browser();
	const page = await chrome.newPage();
	let failed = 0;
	for ( const source of sources.filter( ( item ) => ! only.length || only.includes( item.uid ) ) ) {
		// Check the licence again, then ask Commons for a copy just large enough to cover the crop.
		const [ original ] = await lookup( [ source.title ], 500 );
		if ( ! original || ! original.free ) {
			console.error( `${ source.uid }: ${ original ? `licence "${ original.licence }" is not CC0 or public domain` : 'not found on Commons' } (${ source.title })` );
			failed++;
			continue;
		}
		const needed = Math.ceil( Math.max( source.width, source.height * original.width / original.height ) );
		const [ sized ] = needed < original.width ? await lookup( [ source.title ], needed ) : [ original ];
		const info = { ...original, scaled_url: sized.scaled_width >= needed ? sized.scaled_url : original.original_url };
		const bytes = await download( info.scaled_url );
		const [ fx, fy ] = source.focal || [ 50, 50 ];
		const result = await page.evaluate( async ( { src, width, height, fx, fy, budget } ) => {
			const image = new Image();
			image.src = src;
			await image.decode();
			// Cover the frame, keeping the focal point as close to its place as the edges allow.
			const scale = Math.max( width / image.naturalWidth, height / image.naturalHeight );
			const cropWidth = width / scale;
			const cropHeight = height / scale;
			const left = Math.min( Math.max( image.naturalWidth * fx / 100 - cropWidth / 2, 0 ), image.naturalWidth - cropWidth );
			const top = Math.min( Math.max( image.naturalHeight * fy / 100 - cropHeight / 2, 0 ), image.naturalHeight - cropHeight );
			const canvas = document.createElement( 'canvas' );
			canvas.width = width;
			canvas.height = height;
			const context = canvas.getContext( '2d' );
			context.imageSmoothingQuality = 'high';
			context.drawImage( image, left, top, cropWidth, cropHeight, 0, 0, width, height );
			for ( let quality = 0.8; ; quality -= 0.04 ) {
				const url = canvas.toDataURL( 'image/webp', quality );
				if ( url.length * 0.75 <= budget || quality <= 0.64 ) {
					return { url, quality: Math.round( quality * 100 ), scale, natural: [ image.naturalWidth, image.naturalHeight ] };
				}
			}
		}, { src: dataUrl( bytes, info.mime ), width: source.width, height: source.height, fx, fy, budget: Math.min( IMAGE_BYTES, source.width * source.height * BYTES_PER_PIXEL ) } );

		const file = source.uid + '.webp';
		const output = Buffer.from( result.url.split( ',' )[ 1 ], 'base64' );
		fs.writeFileSync( path.join( folder, 'files', file ), output );
		records.set( source.uid, {
			uid: source.uid,
			file,
			section: source.section || '',
			subject: source.subject || '',
			alt: source.alt || '',
			source: 'Wikimedia Commons',
			source_url: info.source_url,
			original_url: info.original_url,
			author: info.author,
			licence: info.licence,
			licence_url: info.licence_url,
			restrictions: info.restrictions,
			original_size: [ info.width, info.height ],
			width: source.width,
			height: source.height,
			focal: [ fx, fy ],
			bytes: output.length,
			checked: new Date().toISOString().slice( 0, 10 ),
		} );
		console.log( `${ source.uid }: ${ source.width }x${ source.height }, ${ Math.round( output.length / 1024 ) } KB at quality ${ result.quality }${ result.scale > 1 ? ' (ENLARGED: the original is too small)' : '' } · ${ info.licence } · ${ info.author.slice( 0, 40 ) }` );
	}
	await chrome.close();
	const order = sources.map( ( item ) => item.uid );
	fs.writeFileSync( recordFile, JSON.stringify( [ ...records.values() ].filter( ( item ) => order.includes( item.uid ) ).sort( ( a, b ) => order.indexOf( a.uid ) - order.indexOf( b.uid ) ), null, '\t' ) + '\n' );
	writeCredits( site );
	if ( failed ) {
		process.exitCode = 1;
	}
}

const [ command, ...rest ] = process.argv.slice( 2 );
const flag = ( name ) => ( rest.includes( '--' + name ) ? rest.splice( rest.indexOf( '--' + name ), 2 )[ 1 ] : undefined );
if ( command === 'search' ) {
	const tall = rest.includes( '--tall' ) && Boolean( rest.splice( rest.indexOf( '--tall' ), 1 ) );
	const options = { out: flag( 'out' ), limit: Number( flag( 'limit' ) || 24 ), min: Number( flag( 'min' ) || 2000 ), tall };
	await commandSearch( rest.join( ' ' ), options );
} else if ( command === 'fetch' && rest.length ) {
	await commandFetch( rest[ 0 ], rest.slice( 1 ) );
} else if ( command === 'credits' && rest.length ) {
	writeCredits( rest[ 0 ] );
} else {
	console.log( 'Usage: photos.mjs search "<words>" [--out <folder>] [--limit 24] [--min 2000] [--tall]\n       photos.mjs fetch <site> [<uid> …]\n       photos.mjs credits <site>' );
	process.exitCode = 1;
}
