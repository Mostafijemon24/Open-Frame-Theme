/**
 * Open Frame starter site library: the public API.
 *
 * A read-only front for the R2 bucket that tools/library.mjs publishes to.
 * It serves both hosts of the library:
 *
 *   api.<domain>/v1/catalog.json                      the signed catalog (changes)
 *   api.<domain>/v1/sites/<site>/<version>/manifest.json
 *   cdn.<domain>/v1/sites/<site>/<version>/…          package, media, fonts (never change)
 *   cdn.<domain>/v1/previews/<site>/…                 preview images
 *
 * Nothing here is secret and nothing is written: integrity comes from the
 * signature on the catalog and the checksums it leads to, not from this code.
 */

const TYPES = {
	json: 'application/json; charset=utf-8',
	zip: 'application/zip',
	png: 'image/png',
	webp: 'image/webp',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	avif: 'image/avif',
	gif: 'image/gif',
	woff2: 'font/woff2',
};

/** The catalog is the only file that changes; everything else is published once under a versioned path. */
const CACHE_CATALOG = 'public, max-age=300, s-maxage=300, stale-while-revalidate=86400';
const CACHE_IMMUTABLE = 'public, max-age=31536000, immutable';

const BASE_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'no-referrer',
};

/** A JSON error the plugin can act on. */
function problem( status, code, message, retryable = false ) {
	return new Response( JSON.stringify( { code, message, retryable } ), {
		status,
		headers: { ...BASE_HEADERS, 'Content-Type': TYPES.json, 'Cache-Control': 'no-store' },
	} );
}

export default {
	async fetch( request, env ) {
		if ( request.method !== 'GET' && request.method !== 'HEAD' ) {
			return new Response( null, { status: 405, headers: { ...BASE_HEADERS, Allow: 'GET, HEAD' } } );
		}

		const { pathname } = new URL( request.url );

		if ( pathname === '/' ) {
			return new Response( JSON.stringify( { service: 'Open Frame starter site library', catalog: '/v1/catalog.json' } ), {
				headers: { ...BASE_HEADERS, 'Content-Type': TYPES.json, 'Cache-Control': 'public, max-age=3600' },
			} );
		}

		// Only plain paths below /v1/ with a known file type are ever looked up.
		const match = pathname.match( /^\/(v1\/[A-Za-z0-9._\/-]+\.([a-z0-9]+))$/ );
		if ( ! match || pathname.includes( '..' ) || pathname.includes( '//' ) || ! TYPES[ match[ 2 ] ] ) {
			return problem( 404, 'not_found', 'Not found.' );
		}
		const key = match[ 1 ];

		let object;
		try {
			object = await env.LIBRARY.get( key, { onlyIf: request.headers } );
		} catch ( error ) {
			return problem( 503, 'unavailable', 'The library is temporarily unavailable.', true );
		}

		if ( object === null ) {
			return problem( 404, 'not_found', 'Not found.' );
		}

		const headers = {
			...BASE_HEADERS,
			'Content-Type': TYPES[ match[ 2 ] ],
			'Cache-Control': key === 'v1/catalog.json' ? CACHE_CATALOG : CACHE_IMMUTABLE,
			ETag: object.httpEtag,
		};

		// With a matching If-None-Match, R2 returns the object without a body.
		if ( ! ( 'body' in object ) || object.body === undefined ) {
			return new Response( null, { status: 304, headers } );
		}

		headers[ 'Content-Length' ] = String( object.size );
		return new Response( request.method === 'HEAD' ? null : object.body, { headers } );
	},
};
