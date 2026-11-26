/**
 * Tests of the library tools: building, signing, checksums, package rules and
 * the contract with the JSON Schemas the plugin also follows.
 *
 *   cd tools && npm install && npm test
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import { buildLibrary, generateKeyPair, imageSize, loadSources, openEnvelope, sha256, signDocument, validateSite, verifyLibrary, zip } from '../lib.mjs';

const ROOT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../..' );
const API = 'https://api.example.test/v1';
const CDN = 'https://cdn.example.test/v1';
const GENERATED = '2026-11-26T00:00:00Z';

const key = generateKeyPair();
const otherKey = generateKeyPair();
const publicKeys = { [ key.keyId ]: key.publicKey };

const readJson = ( file ) => JSON.parse( fs.readFileSync( file, 'utf8' ) );
const schema = ( name ) => readJson( path.join( ROOT, 'schemas', name ) );
// "uri" is the only format the schemas use; a stricter check than Ajv's default is not needed here.
const ajv = new Ajv( { allErrors: true, formats: { uri: ( value ) => /^https:\/\/[^\s]+$/.test( value ) } } );

/** Check data against one of the shared schemas; each schema is compiled once. */
const compiled = {};
const matches = ( name, data ) => {
	compiled[ name ] ??= ajv.compile( schema( name ) );
	const ok = compiled[ name ]( data );
	return ok || assert.fail( `${ name }: ${ JSON.stringify( compiled[ name ].errors ) }` );
};

/** A temporary folder that is removed when the test ends. */
function temp( t, prefix ) {
	const dir = fs.mkdtempSync( path.join( os.tmpdir(), prefix ) );
	t.after( () => fs.rmSync( dir, { recursive: true, force: true } ) );
	return dir;
}

/** Sources with the reference site and one coming-soon site, ready to be changed by a test. */
function sources( t ) {
	const dir = temp( t, 'ofss-src-' );
	fs.copyFileSync( path.join( ROOT, 'starter-sites/categories.json' ), path.join( dir, 'categories.json' ) );
	fs.cpSync( path.join( ROOT, 'tests/fixtures/sites/reference' ), path.join( dir, 'reference' ), { recursive: true } );
	fs.cpSync( path.join( ROOT, 'starter-sites/agency' ), path.join( dir, 'agency' ), { recursive: true } );
	return dir;
}

const build = ( t, src, privateKeys = [ key.privateKey ] ) => {
	const out = temp( t, 'ofss-out-' );
	const result = buildLibrary( { sources: src, out, apiUrl: API, cdnUrl: CDN, privateKeys, generated: GENERATED } );
	return { out, result };
};

/** Change a JSON file of the sources. */
const edit = ( src, file, change ) => {
	const full = path.join( src, file );
	const data = readJson( full );
	const replaced = change( data );
	fs.writeFileSync( full, JSON.stringify( replaced === undefined ? data : replaced ) );
};

/** The build must fail, and say why in words that contain `expected`. */
const refuses = ( t, src, expected ) => {
	assert.throws( () => build( t, src ), ( error ) => {
		assert.match( error.message, expected );
		return true;
	} );
};

test( 'the ten sites build into a signed catalog that matches the schema', ( t ) => {
	const { out, result } = build( t, path.join( ROOT, 'starter-sites' ) );
	assert.equal( result.sites, 10 );
	assert.ok( result.packages >= 2, 'Business and Portfolio have a package' );

	const envelope = readJson( path.join( out, 'v1/catalog.json' ) );
	matches( 'envelope.schema.json', envelope );

	const catalog = openEnvelope( envelope, publicKeys );
	matches( 'catalog.schema.json', catalog );
	assert.deepEqual( catalog.sites.map( ( site ) => site.id ), [ 'business', 'agency', 'saas', 'portfolio', 'shop', 'restaurant', 'real-estate', 'education', 'medical', 'magazine' ] );
	assert.equal( catalog.sites.filter( ( site ) => site.tier === 'free' ).length, 5 );
	const available = catalog.sites.filter( ( site ) => site.status === 'available' ).map( ( site ) => site.id );
	assert.ok( available.includes( 'business' ) && available.includes( 'portfolio' ) );
	assert.ok( catalog.sites.every( ( site ) => ( site.status === 'available' ) === Boolean( site.manifest ) ) );

	const business = readJson( path.join( out, 'v1/sites/business/1.0.0/manifest.json' ) );
	matches( 'manifest.schema.json', business );
	assert.equal( business.pages.length, 10 );
	assert.equal( business.pages.filter( ( item ) => item.front_page ).length, 1 );
	assert.equal( business.media.length, 15 );
	assert.ok( business.media.every( ( item ) => item.bytes < 100 * 1024 ), 'every image is under 100 KB' );
	assert.ok( business.requires.elementor.widgets.includes( 'of-nav-menu' ) );
	assert.ok( business.package.bytes < 200 * 1024, 'the package is small' );
	assert.equal( catalog.sites[ 0 ].preview.screenshots.length, 3 );

	// Every finished design stays within the same budgets.
	for ( const site of catalog.sites.filter( ( item ) => item.status === 'available' ) ) {
		const manifest = readJson( path.join( out, `v1/sites/${ site.id }/${ site.version }/manifest.json` ) );
		matches( 'manifest.schema.json', manifest );
		assert.equal( manifest.pages.filter( ( item ) => item.front_page ).length, 1, `${ site.id }: one front page` );
		assert.ok( manifest.media.every( ( item ) => item.bytes <= 100 * 1024 ), `${ site.id }: no image over 100 KB` );
		assert.ok( manifest.media.reduce( ( sum, item ) => sum + item.bytes, 0 ) < 1024 * 1024, `${ site.id }: under 1 MB of images` );
		assert.ok( manifest.fonts.reduce( ( sum, item ) => sum + item.bytes, 0 ) < 200 * 1024, `${ site.id }: under 200 KB of fonts` );
		assert.ok( manifest.package.bytes < 200 * 1024, `${ site.id }: a small package` );
		assert.ok( site.preview.screenshots.length >= 3, `${ site.id }: preview pictures` );
	}

	const portfolio = readJson( path.join( out, 'v1/sites/portfolio/1.0.0/manifest.json' ) );
	assert.deepEqual( portfolio.fonts.map( ( font ) => `${ font.family } ${ font.style } ${ font.weight }` ), [ 'Fraunces normal 100 900', 'Fraunces italic 100 900', 'Instrument Sans normal 400 700' ] );
	assert.ok( portfolio.fonts.every( ( font ) => /^OFL-1\.1/.test( font.licence ) && font.url.startsWith( CDN + '/sites/portfolio/1.0.0/fonts/' ) ) );
	assert.ok( catalog.sites.every( ( site ) => site.preview.thumbnail.startsWith( CDN + '/previews/' ) ) );
	assert.deepEqual( verifyLibrary( out, publicKeys, { apiUrl: API, cdnUrl: CDN } ), [] );

	// The tools read sources only; unknown source fields (such as preview colours) do not leak into the catalog.
	assert.ok( catalog.sites.every( ( site ) => ! ( 'colors' in site ) && ! ( 'dir' in site ) && ! ( 'order' in site ) ) );
} );

test( 'a site with content becomes a package whose manifest matches the schema and every checksum', ( t ) => {
	const { out, result } = build( t, sources( t ) );
	assert.equal( result.sites, 2 );
	assert.equal( result.packages, 1 );

	const catalog = openEnvelope( readJson( path.join( out, 'v1/catalog.json' ) ), publicKeys );
	matches( 'catalog.schema.json', catalog );

	const reference = catalog.sites.find( ( site ) => site.id === 'reference' );
	assert.equal( reference.manifest.url, API + '/sites/reference/1.0.0/manifest.json' );

	const manifestBody = fs.readFileSync( path.join( out, 'v1/sites/reference/1.0.0/manifest.json' ) );
	assert.equal( sha256( manifestBody ), reference.manifest.sha256 );
	const manifest = JSON.parse( manifestBody );
	matches( 'manifest.schema.json', manifest );

	assert.deepEqual( manifest.pages, [ { uid: 'reference:pages:about', title: 'About' }, { uid: 'reference:pages:home', title: 'Home', front_page: true } ] );
	assert.deepEqual( manifest.requires.elementor.widgets, [ 'button', 'heading', 'image', 'text-editor' ] );
	assert.equal( manifest.media.length, 1 );
	assert.deepEqual( { width: manifest.media[ 0 ].width, height: manifest.media[ 0 ].height, mime: manifest.media[ 0 ].mime }, { width: 320, height: 200, mime: 'image/png' } );
	assert.ok( fs.existsSync( path.join( out, 'v1/sites/reference/1.0.0/media', manifest.media[ 0 ].sha256 + '.png' ) ), 'media is stored under its hash' );

	assert.deepEqual( verifyLibrary( out, publicKeys, { apiUrl: API, cdnUrl: CDN } ), [] );
} );

test( 'the package is a real ZIP that holds JSON and nothing else', ( t ) => {
	const { out } = build( t, sources( t ) );
	const archive = path.join( out, 'v1/sites/reference/1.0.0/package.zip' );
	const manifest = readJson( path.join( out, 'v1/sites/reference/1.0.0/manifest.json' ) );

	execFileSync( 'unzip', [ '-tqq', archive ] ); // Throws when the archive is damaged.
	const listed = execFileSync( 'unzip', [ '-Z1', archive ], { encoding: 'utf8' } ).trim().split( '\n' ).sort();
	assert.deepEqual( listed, Object.keys( manifest.files ).sort() );
	assert.ok( listed.every( ( name ) => /\.(json|md)$/.test( name ) ) );
	assert.ok( ! listed.some( ( name ) => name.includes( 'media/files' ) ), 'binaries are not in the ZIP' );

	const extracted = temp( t, 'ofss-zip-' );
	execFileSync( 'unzip', [ '-qq', archive, '-d', extracted ] );
	for ( const [ name, info ] of Object.entries( manifest.files ) ) {
		assert.equal( sha256( fs.readFileSync( path.join( extracted, name ) ) ), info.sha256, name );
	}
} );

test( 'building twice gives byte-identical files', ( t ) => {
	const src = sources( t );
	const first = build( t, src ).out;
	const second = build( t, src ).out;
	for ( const file of [ 'v1/catalog.json', 'v1/sites/reference/1.0.0/package.zip', 'v1/sites/reference/1.0.0/manifest.json' ] ) {
		assert.ok( fs.readFileSync( path.join( first, file ) ).equals( fs.readFileSync( path.join( second, file ) ) ), file );
	}
} );

test( 'a catalog that was changed, or signed by someone else, is refused', ( t ) => {
	const { out } = build( t, sources( t ) );
	const file = path.join( out, 'v1/catalog.json' );
	const envelope = readJson( file );

	assert.throws( () => openEnvelope( { ...envelope, signed: envelope.signed.replace( 'Reference', 'Tampered' ) }, publicKeys ), /No valid signature/ );
	assert.throws( () => openEnvelope( envelope, { [ otherKey.keyId ]: otherKey.publicKey } ), /No valid signature/, 'unknown key' );
	assert.throws( () => openEnvelope( envelope, { [ key.keyId ]: otherKey.publicKey } ), /No valid signature/, 'a key ID that points at another key' );
	assert.throws( () => openEnvelope( { ...envelope, signatures: [] }, publicKeys ), /No valid signature/ );
	assert.throws( () => openEnvelope( { ...envelope, signatures: [ { ...envelope.signatures[ 0 ], alg: 'none' } ] }, publicKeys ), /No valid signature/ );
	assert.throws( () => openEnvelope( JSON.parse( envelope.signed ), publicKeys ), /Not a signed envelope/, 'a bare catalog without a signature' );

	// An attacker who re-signs a changed catalog with their own key gets nowhere.
	const forged = signDocument( { ...JSON.parse( envelope.signed ), sites: [] }, [ otherKey.privateKey ] );
	assert.throws( () => openEnvelope( forged, publicKeys ), /No valid signature/ );
	fs.writeFileSync( file, JSON.stringify( forged ) );
	assert.match( verifyLibrary( out, publicKeys, { apiUrl: API, cdnUrl: CDN } )[ 0 ], /catalog\.json: No valid signature/ );
} );

test( 'a changed package, manifest or image is detected by its checksum', ( t ) => {
	const src = sources( t );
	const base = 'v1/sites/reference/1.0.0';
	const check = ( out ) => verifyLibrary( out, publicKeys, { apiUrl: API, cdnUrl: CDN } );

	let out = build( t, src ).out;
	fs.appendFileSync( path.join( out, base, 'package.zip' ), 'x' );
	assert.match( check( out ).join( '\n' ), /package\.zip: does not match its checksum/ );

	out = build( t, src ).out;
	const manifestFile = path.join( out, base, 'manifest.json' );
	fs.writeFileSync( manifestFile, fs.readFileSync( manifestFile, 'utf8' ).replace( '"Reference"', '"Changed"' ) );
	assert.match( check( out ).join( '\n' ), /manifest\.json: does not match its checksum/ );

	out = build( t, src ).out;
	const media = path.join( out, base, 'media' );
	fs.writeFileSync( path.join( media, fs.readdirSync( media )[ 0 ] ), 'not the image' );
	assert.match( check( out ).join( '\n' ), /media\/[a-f0-9]{64}\.png: does not match its checksum/ );

	out = build( t, src ).out;
	fs.rmSync( path.join( out, base, 'package.zip' ) );
	assert.match( check( out ).join( '\n' ), /package\.zip: missing/ );
} );

test( 'while a key is being replaced, a catalog signed with both keys opens with either', ( t ) => {
	const { out } = build( t, sources( t ), [ key.privateKey, otherKey.privateKey ] );
	const envelope = readJson( path.join( out, 'v1/catalog.json' ) );
	assert.equal( envelope.signatures.length, 2 );
	matches( 'envelope.schema.json', envelope );
	assert.equal( openEnvelope( envelope, publicKeys ).sites.length, 2 );
	assert.equal( openEnvelope( envelope, { [ otherKey.keyId ]: otherKey.publicKey } ).sites.length, 2 );
} );

test( 'packages that break the rules are not built', async ( t ) => {
	const page = 'reference/content/pages/home.json';
	const cases = {
		'a PHP file in the content': [ ( src ) => fs.writeFileSync( path.join( src, 'reference/content/pages/evil.php' ), '<?php' ), /only \.json and \.md files/ ],
		'a JavaScript file in the site settings': [ ( src ) => fs.writeFileSync( path.join( src, 'reference/site/run.js' ), 'x' ), /only \.json and \.md files/ ],
		'a file that is not valid JSON': [ ( src ) => fs.writeFileSync( path.join( src, 'reference/site/kit.json' ), '{ nope' ), /kit\.json: not valid JSON/ ],
		'a link to the site it was authored on': [ ( src ) => edit( src, page, ( data ) => void ( data.elementor.content[ 0 ].elements[ 3 ].settings.link.url = 'https://author.example.org/about/' ) ), /link to "author\.example\.org" is not allowed/ ],
		'an image by address instead of by reference': [ ( src ) => edit( src, page, ( data ) => void ( data.elementor.content[ 0 ].elements[ 1 ].settings.image.url = 'https://author.example.org/wp-content/uploads/hero.png' ) ), /is not allowed; use ofss:\/\/ references/ ],
		'a plain-HTTP link, even to an allowed host': [ ( src ) => edit( src, page, ( data ) => void ( data.elementor.content[ 0 ].elements[ 3 ].settings.link.url = 'http://www.youtube.com/watch' ) ), /is not allowed/ ],
		'a script tag': [ ( src ) => edit( src, page, ( data ) => void ( data.elementor.content[ 0 ].elements[ 2 ].settings.editor = '<p>Hi</p><script>alert(1)</script>' ) ), /script is not allowed/ ],
		'an event handler attribute': [ ( src ) => edit( src, page, ( data ) => void ( data.elementor.content[ 0 ].elements[ 2 ].settings.editor = '<p onclick="x()">Hi</p>' ) ), /script is not allowed/ ],
		'a javascript: link': [ ( src ) => edit( src, page, ( data ) => void ( data.elementor.content[ 0 ].elements[ 3 ].settings.link.url = 'javascript:alert(1)' ) ), /script is not allowed/ ],
		'a reference to an image that is not in the package': [ ( src ) => edit( src, page, ( data ) => void ( data.elementor.content[ 0 ].elements[ 1 ].settings.image.url = 'ofss://media/missing' ) ), /ofss:\/\/media\/missing does not exist/ ],
		'a reference to a page that is not in the package': [ ( src ) => edit( src, page, ( data ) => void ( data.elementor.content[ 0 ].elements[ 3 ].settings.link.url = 'ofss://page/pricing' ) ), /ofss:\/\/page\/pricing does not exist/ ],
		'a widget that the site does not declare': [ ( src ) => edit( src, page, ( data ) => void ( data.elementor.content[ 0 ].elements[ 0 ].widgetType = 'html' ) ), /widget "html" is used but not listed/ ],
		'a WordPress option outside the allow-list': [ ( src ) => edit( src, 'reference/site/options.json', ( data ) => void ( data.admin_email = 'attacker@example.com' ) ), /"admin_email" may not be set by a package/ ],
		'a site address': [ ( src ) => edit( src, 'reference/site/options.json', ( data ) => void ( data.siteurl = 'ofss://page/home' ) ), /"siteurl" may not be set by a package/ ],
		'a theme setting that is not Open Frame\'s': [ ( src ) => edit( src, 'reference/site/theme-mods.json', ( data ) => void ( data.custom_css = 'body{}' ) ), /"custom_css" is not a theme setting of Open Frame/ ],
		'a uid that does not match the file': [ ( src ) => edit( src, page, ( data ) => void ( data.uid = 'other:pages:home' ) ), /uid must be "reference:pages:home"/ ],
		'two front pages': [ ( src ) => edit( src, 'reference/content/pages/about.json', ( data ) => void ( data.front_page = true ) ), /exactly one page must be the front page/ ],
		'no front page': [ ( src ) => edit( src, page, ( data ) => void delete data.front_page ), /exactly one page must be the front page/ ],
		'an image without a licence': [ ( src ) => edit( src, 'reference/media/index.json', ( data ) => void delete data[ 0 ].licence ), /a licence is required/ ],
		'an image without alt text': [ ( src ) => edit( src, 'reference/media/index.json', ( data ) => void delete data[ 0 ].alt ), /alt text is required/ ],
		'an image that is listed but missing': [ ( src ) => fs.rmSync( path.join( src, 'reference/media/files/hero.png' ) ), /file missing or of a type that is not allowed/ ],
		'an SVG image': [ ( src ) => { fs.writeFileSync( path.join( src, 'reference/media/files/logo.svg' ), '<svg/>' ); edit( src, 'reference/media/index.json', ( data ) => void ( data[ 0 ].file = 'logo.svg' ) ); }, /of a type that is not allowed/ ],
		'an image path that leaves the media folder': [ ( src ) => edit( src, 'reference/media/index.json', ( data ) => void ( data[ 0 ].file = '../../site.json' ) ), /file missing or of a type that is not allowed/ ],
		'an image over 400 KB': [ ( src ) => fs.appendFileSync( path.join( src, 'reference/media/files/hero.png' ), Buffer.alloc( 410 * 1024 ) ), /larger than 400 KB/ ],
		'something that is not an image': [ ( src ) => fs.writeFileSync( path.join( src, 'reference/media/files/hero.png' ), 'GIF89a but not really' ), /could not be read/ ],
	};

	for ( const [ name, [ breakIt, message ] ] of Object.entries( cases ) ) {
		await t.test( name, ( t2 ) => {
			const src = sources( t2 );
			breakIt( src );
			refuses( t2, src, message );
		} );
	}
} );

test( 'catalog entries that break the rules are not built', async ( t ) => {
	const site = 'reference/site.json';
	const cases = {
		'an id that differs from the folder': [ ( src ) => edit( src, site, ( data ) => void ( data.id = 'other' ) ), /must match its folder/ ],
		'an unknown tier': [ ( src ) => edit( src, site, ( data ) => void ( data.tier = 'gold' ) ), /tier must be free or pro/ ],
		'an unknown category': [ ( src ) => edit( src, site, ( data ) => void ( data.category = 'nope' ) ), /unknown category/ ],
		'a pro site without Elementor Pro': [ ( src ) => edit( src, site, ( data ) => void ( data.tier = 'pro' ) ), /a pro site must require Elementor Pro/ ],
		'a free site that lists Elementor Pro': [ ( src ) => edit( src, site, ( data ) => void data.requires.plugins.push( { slug: 'elementor-pro', name: 'Elementor Pro', file: 'elementor-pro/elementor-pro.php', source: 'external' } ) ), /a free site must not list Elementor Pro/ ],
		'Elementor Pro offered from WordPress.org': [ ( src ) => edit( src, 'agency/site.json', ( data ) => void ( data.requires.plugins[ 1 ].source = 'wordpress.org' ) ), /must require Elementor Pro as an external plugin/ ],
		'a plugin file outside its folder': [ ( src ) => edit( src, site, ( data ) => void ( data.requires.plugins[ 0 ].file = '../wp-config.php' ) ), /file must be inside its own folder/ ],
		'no preview image': [ ( src ) => fs.rmSync( path.join( src, 'reference/preview/thumbnail.png' ) ), /thumbnail\.png is missing/ ],
		'a preview of the wrong size': [ ( src ) => fs.copyFileSync( path.join( src, 'reference/media/files/hero.png' ), path.join( src, 'reference/preview/thumbnail.png' ) ), /must be 1200 x 900/ ],
		'"available" without content': [ ( src ) => edit( src, 'agency/site.json', ( data ) => void ( data.status = 'available' ) ), /an available site needs a content folder/ ],
	};

	for ( const [ name, [ breakIt, message ] ] of Object.entries( cases ) ) {
		await t.test( name, ( t2 ) => {
			const src = sources( t2 );
			breakIt( src );
			refuses( t2, src, message );
		} );
	}

	await t.test( 'when one site is wrong nothing is written to the catalog', ( t2 ) => {
		const src = sources( t2 );
		edit( src, site, ( data ) => void ( data.tier = 'gold' ) );
		const out = temp( t2, 'ofss-out-' );
		assert.throws( () => buildLibrary( { sources: src, out, apiUrl: API, cdnUrl: CDN, privateKeys: [ key.privateKey ], generated: GENERATED } ) );
		assert.ok( ! fs.existsSync( path.join( out, 'v1/catalog.json' ) ) );
	} );
} );

test( 'every planned site passes validation on its own', () => {
	const { categories, sites } = loadSources( path.join( ROOT, 'starter-sites' ) );
	assert.equal( sites.length, 10 );
	for ( const site of sites ) {
		assert.deepEqual( validateSite( site, categories ), [], site.id );
	}
} );

test( 'ZIP and image helpers', ( t ) => {
	const dir = temp( t, 'ofss-zip-' );
	const archive = path.join( dir, 'a.zip' );
	fs.writeFileSync( archive, zip( [ { name: 'b/ü.json', data: Buffer.from( '{"x":1}' ) }, { name: 'a.json', data: Buffer.from( '[]' ) }, { name: 'empty.md', data: Buffer.alloc( 0 ) } ] ) );
	assert.deepEqual( execFileSync( 'unzip', [ '-Z1', archive ], { encoding: 'utf8' } ).trim().split( '\n' ), [ 'a.json', 'b/ü.json', 'empty.md' ], 'entries are sorted, names are UTF-8' );
	assert.equal( execFileSync( 'unzip', [ '-p', archive, 'b/ü.json' ], { encoding: 'utf8' } ), '{"x":1}' );

	assert.deepEqual( imageSize( fs.readFileSync( path.join( ROOT, 'starter-sites/business/preview/thumbnail.png' ) ) ), { width: 1200, height: 900 } );
	assert.equal( imageSize( Buffer.from( 'not an image at all, just some text' ) ), null );
} );

test( 'publishing uploads the catalog last', ( t ) => {
	const { out } = build( t, sources( t ) );
	const plan = execFileSync( 'node', [ path.join( ROOT, 'tools/library.mjs' ), 'publish', '--out', out, '--bucket', 'test-bucket', '--dry-run' ], { encoding: 'utf8' } ).trim().split( '\n' );

	assert.ok( plan.length >= 5 );
	assert.match( plan.at( -1 ), /test-bucket\/v1\/catalog\.json .*max-age=300/ );
	assert.ok( plan.slice( 0, -1 ).every( ( line ) => /immutable/.test( line ) && ! /catalog\.json/.test( line ) ), 'everything else is uploaded first and never changes' );
	assert.ok( plan.some( ( line ) => /package\.zip .*application\/zip/.test( line ) ) );
} );

test( 'the command line builds and verifies, and refuses to overwrite a key', ( t ) => {
	const dir = temp( t, 'ofss-cli-' );
	const keyFile = path.join( dir, 'signing.key' );
	const cli = ( ...args ) => execFileSync( 'node', [ path.join( ROOT, 'tools/library.mjs' ), ...args ], { encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'pipe' ] } );

	const made = cli( 'keygen', '--out', keyFile );
	const [ , id ] = made.match( /Key ID:\s+([a-f0-9]{8})/ );
	const [ , publicKey ] = made.match( /Public key:\s+(\S+)/ );
	assert.equal( fs.statSync( keyFile ).mode & 0o777, 0o600, 'the private key is readable by its owner only' );
	assert.throws( () => cli( 'keygen', '--out', keyFile ), /never overwritten/ );

	const out = path.join( dir, 'library' );
	assert.match( cli( 'build', '--sources', path.join( ROOT, 'starter-sites' ), '--out', out, '--api', API, '--cdn', CDN, '--key', keyFile ), /Built 10 sites/ );
	assert.match( cli( 'verify', '--out', out, '--api', API, '--cdn', CDN, '--public', `${ id }=${ publicKey }` ), /every checksum are valid/ );
	assert.throws( () => cli( 'verify', '--out', out, '--api', API, '--cdn', CDN, '--public', `${ otherKey.keyId }=${ otherKey.publicKey }` ), /not intact/ );
	assert.throws( () => execFileSync( 'node', [ path.join( ROOT, 'tools/library.mjs' ), 'build', '--out', out, '--api', API, '--cdn', CDN ], { encoding: 'utf8', stdio: 'pipe', env: { ...process.env, OFSS_SIGNING_KEY: '' } } ), /No signing key/ );
} );
