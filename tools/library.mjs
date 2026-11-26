#!/usr/bin/env node
/**
 * Command line for the starter site library.
 *
 *   node tools/library.mjs keygen  --out <private-key-file>
 *   node tools/library.mjs public  [--key <file>]            prints the key ID and public key of a signing key
 *   node tools/library.mjs build   --out dist/library --api <url> --cdn <url> [--key <file>] [--sources starter-sites]
 *   node tools/library.mjs verify  --out dist/library --api <url> --cdn <url> --public <key-id>=<base64>
 *   node tools/library.mjs publish --out dist/library --bucket <name> [--live <url>] [--local <folder>] [--dry-run]
 *   node tools/library.mjs plan    --out dist/library --live <url>                 what publish --live would do
 *   node tools/library.mjs check-live --api <url> --public <key-id>=<base64>       downloads and checks what is live
 *   node tools/library.mjs licences [--check] [--sources starter-sites]
 *
 * publish --live <url> (the address the library is served from, ending in /v1)
 * first compares what was built with what is live: files that are already
 * there are skipped, and a published version whose content changed stops the
 * upload before it starts. --local <folder> writes to wrangler's simulated
 * bucket in that folder instead of Cloudflare (for a rehearsal). The wrangler
 * command can be replaced with the WRANGLER environment variable.
 *
 * The signing key is read from --key, or from the OFSS_SIGNING_KEY environment
 * variable (the PEM text itself). It is never written anywhere by these tools.
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildLibrary, explainConflicts, generateKeyPair, keyId, licenceOverview, planPublish, pool, publicKeyOf, uploadOrder, verifyLibrary, verifyLive } from './lib.mjs';

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

	case 'public': {
		const raw = publicKeyOf( signingKey() );
		console.log( `${ keyId( raw ) }=${ raw.toString( 'base64' ) }` );
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
		const dry = Boolean( options[ 'dry-run' ] );
		const wrangler = ( process.env.WRANGLER || 'npx --yes wrangler@4' ).split( ' ' );
		const where = options.local && options.local !== true ? [ '--local', '--persist-to', options.local ] : [ '--remote' ];

		let files = uploadOrder( out );
		if ( options.live && options.live !== true ) {
			let plan;
			try {
				plan = await planPublish( out, options.live );
			} catch ( error ) {
				console.error( error.message );
				process.exit( 1 );
			}
			if ( plan.conflicts.length ) {
				console.error( 'Nothing was uploaded:\n  ' + explainConflicts( plan.conflicts ).join( '\n  ' ) );
				process.exit( 1 );
			}
			console.error( `${ plan.upload.length } files to upload, ${ plan.skip.length } already published and unchanged.` );
			files = plan.upload;
		}

		const command = ( file ) => {
			const type = CONTENT_TYPES[ path.extname( file ) ] || 'application/octet-stream';
			// Versioned files never change; the catalog is the only file that does.
			const cache = file === 'v1/catalog.json' ? 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400' : 'public, max-age=31536000, immutable';
			return [ ...wrangler, 'r2', 'object', 'put', `${ bucket }/${ file }`, '--file', path.join( out, file ), '--content-type', type, '--cache-control', cache, ...where ];
		};
		const put = async ( file ) => {
			if ( dry ) {
				console.log( command( file ).join( ' ' ) );
				return;
			}
			const [ program, ...args ] = command( file );
			for ( let attempt = 1; ; attempt++ ) {
				try {
					await promisify( execFile )( program, args, { maxBuffer: 16 * 1024 * 1024 } );
					console.log( `uploaded ${ file }` );
					return;
				} catch ( error ) {
					if ( attempt === 3 ) {
						console.error( `${ file } could not be uploaded:\n${ error.stderr || error.message }\nThe catalog was not replaced, so the library that is live is unchanged. Run the same command again.` );
						process.exit( 1 );
					}
				}
			}
		};

		// The catalog goes last and alone: until it is replaced, nothing points at the new files.
		await pool( files.slice( 0, -1 ), dry ? 1 : 4, put );
		await put( files.at( -1 ) );
		break;
	}

	case 'plan': {
		// What "publish --live" would do, without uploading.
		try {
			const plan = await planPublish( need( 'out' ), need( 'live' ) );
			console.log( `${ plan.upload.length } files to upload, ${ plan.skip.length } already published and unchanged, ${ plan.conflicts.length } in conflict.` );
			if ( plan.conflicts.length ) {
				console.error( explainConflicts( plan.conflicts ).join( '\n' ) );
				process.exit( 1 );
			}
		} catch ( error ) {
			console.error( error.message );
			process.exit( 1 );
		}
		break;
	}

	case 'check-live': {
		const keys = Object.fromEntries( [].concat( need( 'public' ) ).map( ( pair ) => pair.split( /=(.*)/s ).slice( 0, 2 ) ) );
		const result = await verifyLive( need( 'api' ), keys );
		if ( result.problems.length ) {
			console.error( 'The library that is live is not intact:\n  ' + result.problems.join( '\n  ' ) );
			process.exit( 1 );
		}
		console.log( `Live: catalog of ${ result.generated } with ${ result.sites } designs; signature valid, ${ result.files } files downloaded and every checksum valid.` );
		break;
	}

	case 'licences': {
		const sources = options.sources || 'starter-sites';
		const file = path.join( sources, 'LICENSES.md' );
		const page = licenceOverview( sources );
		if ( options.check ) {
			if ( ! fs.existsSync( file ) || fs.readFileSync( file, 'utf8' ) !== page ) {
				console.error( `${ file } is out of date. Run: node tools/library.mjs licences` );
				process.exit( 1 );
			}
			console.log( `${ file } is up to date.` );
		} else {
			fs.writeFileSync( file, page );
			console.log( `Wrote ${ file }.` );
		}
		break;
	}

	default:
		console.error( 'Usage: node tools/library.mjs keygen|public|build|verify|plan|publish|check-live|licences [options]. See the top of this file.' );
		process.exit( 2 );
}
