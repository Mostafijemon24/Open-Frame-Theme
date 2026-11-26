#!/usr/bin/env node
/**
 * Command line for the starter site library.
 *
 *   node tools/library.mjs keygen  --out <private-key-file>
 *   node tools/library.mjs build   --out dist/library --api <url> --cdn <url> [--key <file>] [--sources starter-sites]
 *   node tools/library.mjs verify  --out dist/library --api <url> --cdn <url> --public <key-id>=<base64>
 *   node tools/library.mjs publish --out dist/library --bucket <name> [--dry-run]
 *
 * The signing key is read from --key, or from the OFSS_SIGNING_KEY environment
 * variable (the PEM text itself). It is never written anywhere by these tools.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { buildLibrary, generateKeyPair, keyId, publicKeyOf, verifyLibrary } from './lib.mjs';

const [ command, ...rest ] = process.argv.slice( 2 );
const options = {};
for ( let index = 0; index < rest.length; index++ ) {
	if ( rest[ index ].startsWith( '--' ) ) {
		const name = rest[ index ].slice( 2 );
		const value = rest[ index + 1 ] && ! rest[ index + 1 ].startsWith( '--' ) ? rest[ ++index ] : true;
		options[ name ] = name in options ? [].concat( options[ name ], value ) : value;
	}
}

const need = ( name ) => {
	if ( ! options[ name ] || options[ name ] === true ) {
		console.error( `Missing --${ name }` );
		process.exit( 2 );
	}
	return options[ name ];
};

const signingKey = () => {
	const pem = options.key ? fs.readFileSync( options.key, 'utf8' ) : process.env.OFSS_SIGNING_KEY;
	if ( ! pem ) {
		console.error( 'No signing key: pass --key <file> or set OFSS_SIGNING_KEY.' );
		process.exit( 2 );
	}
	return pem;
};

/** Files of a built library in upload order: everything versioned first, the catalog last. */
const uploadOrder = ( out ) => {
	const walk = ( dir ) => fs.readdirSync( dir, { withFileTypes: true } ).flatMap( ( entry ) => ( entry.isDirectory() ? walk( path.join( dir, entry.name ) ) : [ path.join( dir, entry.name ) ] ) );
	const files = walk( path.join( out, 'v1' ) ).map( ( file ) => path.relative( out, file ).split( path.sep ).join( '/' ) ).sort();
	return [ ...files.filter( ( file ) => file !== 'v1/catalog.json' ), 'v1/catalog.json' ];
};

const CONTENT_TYPES = { '.json': 'application/json', '.zip': 'application/zip', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.avif': 'image/avif', '.gif': 'image/gif', '.woff2': 'font/woff2' };

switch ( command ) {
	case 'keygen': {
		const file = need( 'out' );
		if ( fs.existsSync( file ) ) {
			console.error( `${ file } already exists. A signing key is never overwritten.` );
			process.exit( 1 );
		}
		const pair = generateKeyPair();
		fs.writeFileSync( file, pair.privateKey, { mode: 0o600 } );
		console.log( `Private key written to ${ file } (keep it secret, keep a copy).` );
		console.log( `Key ID:     ${ pair.keyId }` );
		console.log( `Public key: ${ pair.publicKey }` );
		break;
	}

	case 'build': {
		const pem = signingKey();
		try {
			const result = buildLibrary( {
				sources: options.sources || 'starter-sites',
				out: need( 'out' ),
				apiUrl: need( 'api' ).replace( /\/$/, '' ),
				cdnUrl: need( 'cdn' ).replace( /\/$/, '' ),
				privateKeys: [ pem ],
				generated: options.generated === true ? undefined : options.generated,
			} );
			console.log( `Built ${ result.sites } sites (${ result.packages } with a package), ${ result.files.length } files, signed with key ${ keyId( publicKeyOf( pem ) ) }.` );
		} catch ( error ) {
			console.error( error.message );
			process.exit( 1 );
		}
		break;
	}

	case 'verify': {
		const keys = Object.fromEntries( [].concat( need( 'public' ) ).map( ( pair ) => pair.split( /=(.*)/s ).slice( 0, 2 ) ) );
		const problems = verifyLibrary( need( 'out' ), keys, { apiUrl: need( 'api' ).replace( /\/$/, '' ), cdnUrl: need( 'cdn' ).replace( /\/$/, '' ) } );
		if ( problems.length ) {
			console.error( 'The library is not intact:\n  ' + problems.join( '\n  ' ) );
			process.exit( 1 );
		}
		console.log( 'Signature and every checksum are valid.' );
		break;
	}

	case 'publish': {
		const out = need( 'out' );
		const bucket = need( 'bucket' );
		for ( const file of uploadOrder( out ) ) {
			const type = CONTENT_TYPES[ path.extname( file ) ] || 'application/octet-stream';
			// Versioned files never change; the catalog is the only file that does.
			const cache = file === 'v1/catalog.json' ? 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400' : 'public, max-age=31536000, immutable';
			const args = [ 'wrangler', 'r2', 'object', 'put', `${ bucket }/${ file }`, '--file', path.join( out, file ), '--content-type', type, '--cache-control', cache, '--remote' ];
			if ( options[ 'dry-run' ] ) {
				console.log( 'npx ' + args.join( ' ' ) );
			} else {
				execFileSync( 'npx', args, { stdio: 'inherit' } );
			}
		}
		break;
	}

	default:
		console.error( 'Usage: node tools/library.mjs keygen|build|verify|publish [options]. See the top of this file.' );
		process.exit( 2 );
}
