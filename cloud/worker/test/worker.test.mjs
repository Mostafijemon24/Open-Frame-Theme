/**
 * Tests of the library Worker against a stand-in for the R2 bucket.
 *
 *   node --test cloud/worker/test/*.test.mjs
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../src/index.js';

/** The part of the R2 API the Worker uses. */
function bucket( files, { fail = false } = {} ) {
	const lookups = [];
	return {
		lookups,
		async get( key, options ) {
			lookups.push( key );
			if ( fail ) {
				throw new Error( 'R2 is down' );
			}
			if ( ! ( key in files ) ) {
				return null;
			}
			const body = files[ key ];
			const httpEtag = `"etag-${ key.length }-${ body.length }"`;
			if ( options.onlyIf.get( 'if-none-match' ) === httpEtag ) {
				return { httpEtag, size: body.length };
			}
			return { httpEtag, size: body.length, body };
		},
	};
}

const files = {
	'v1/catalog.json': '{"signed":"{}","signatures":[]}',
	'v1/sites/business/1.0.0/manifest.json': '{"id":"business"}',
	'v1/sites/business/1.0.0/package.zip': 'PK-zip-bytes',
	'v1/previews/business/thumbnail.png': 'png-bytes',
	'v1/sites/business/1.0.0/fonts/abc.woff2': 'font-bytes',
	'v1/secret.txt': 'a file type the library never serves',
};

const call = ( path, { method = 'GET', headers = {}, env = { LIBRARY: bucket( files ) } } = {} ) => worker.fetch( new Request( 'https://api.example.test' + path, { method, headers } ), env );

test( 'the catalog is served as JSON with a short cache life', async () => {
	const response = await call( '/v1/catalog.json' );
	assert.equal( response.status, 200 );
	assert.equal( response.headers.get( 'content-type' ), 'application/json; charset=utf-8' );
	assert.match( response.headers.get( 'cache-control' ), /max-age=300/ );
	assert.doesNotMatch( response.headers.get( 'cache-control' ), /immutable/ );
	assert.ok( response.headers.get( 'etag' ) );
	assert.equal( await response.text(), files[ 'v1/catalog.json' ] );
} );

test( 'versioned files are served as immutable, with the right type', async () => {
	for ( const [ path, type ] of [
		[ '/v1/sites/business/1.0.0/manifest.json', 'application/json; charset=utf-8' ],
		[ '/v1/sites/business/1.0.0/package.zip', 'application/zip' ],
		[ '/v1/previews/business/thumbnail.png', 'image/png' ],
		[ '/v1/sites/business/1.0.0/fonts/abc.woff2', 'font/woff2' ],
	] ) {
		const response = await call( path );
		assert.equal( response.status, 200, path );
		assert.equal( response.headers.get( 'content-type' ), type, path );
		assert.equal( response.headers.get( 'cache-control' ), 'public, max-age=31536000, immutable', path );
		assert.equal( response.headers.get( 'x-content-type-options' ), 'nosniff', path );
		assert.equal( response.headers.get( 'access-control-allow-origin' ), '*', path );
	}
} );

test( 'a matching ETag gets "not modified" without a body', async () => {
	const first = await call( '/v1/catalog.json' );
	const second = await call( '/v1/catalog.json', { headers: { 'If-None-Match': first.headers.get( 'etag' ) } } );
	assert.equal( second.status, 304 );
	assert.equal( await second.text(), '' );
	assert.equal( second.headers.get( 'etag' ), first.headers.get( 'etag' ) );
} );

test( 'HEAD answers like GET, without the body', async () => {
	const response = await call( '/v1/catalog.json', { method: 'HEAD' } );
	assert.equal( response.status, 200 );
	assert.equal( response.headers.get( 'content-length' ), String( files[ 'v1/catalog.json' ].length ) );
	assert.equal( await response.text(), '' );
} );

test( 'what is not there is a 404 the plugin can read', async () => {
	const response = await call( '/v1/sites/nope/1.0.0/manifest.json' );
	assert.equal( response.status, 404 );
	assert.deepEqual( await response.json(), { code: 'not_found', message: 'Not found.', retryable: false } );
	assert.equal( response.headers.get( 'cache-control' ), 'no-store' );
} );

test( 'paths outside the library, odd paths and unknown file types never reach the bucket', async () => {
	for ( const path of [ '/v2/catalog.json', '/catalog.json', '/v1/', '/v1', '/v1/../../etc/passwd', '/v1/%2e%2e/catalog.json', '/v1/..%2fcatalog.json', '/v1//catalog.json', '/v1/secret.txt', '/v1/catalog.json.bak', '/v1/catalog', '/v1/a b.json', '/v1/<script>.json', '/.env', '/wp-login.php' ] ) {
		const env = { LIBRARY: bucket( files ) };
		const response = await call( path, { env } );
		assert.equal( response.status, 404, path );
		assert.deepEqual( env.LIBRARY.lookups, [], `${ path } must not be looked up` );
	}
} );

test( 'dot segments are resolved by the URL parser and cannot leave /v1/', async () => {
	// "/v1/../v1/catalog.json" is the same address as "/v1/catalog.json" by the time the Worker sees it.
	const env = { LIBRARY: bucket( files ) };
	const response = await call( '/v1/../v1/catalog.json', { env } );
	assert.equal( response.status, 200 );
	assert.deepEqual( env.LIBRARY.lookups, [ 'v1/catalog.json' ] );
} );

test( 'only GET and HEAD are allowed', async () => {
	for ( const method of [ 'POST', 'PUT', 'DELETE', 'PATCH' ] ) {
		const env = { LIBRARY: bucket( files ) };
		const response = await call( '/v1/catalog.json', { method, env } );
		assert.equal( response.status, 405, method );
		assert.equal( response.headers.get( 'allow' ), 'GET, HEAD' );
		assert.deepEqual( env.LIBRARY.lookups, [] );
	}
} );

test( 'when storage fails the answer says it can be retried', async () => {
	const response = await call( '/v1/catalog.json', { env: { LIBRARY: bucket( files, { fail: true } ) } } );
	assert.equal( response.status, 503 );
	assert.equal( ( await response.json() ).retryable, true );
} );

test( 'the root says what this is', async () => {
	const response = await call( '/' );
	assert.equal( response.status, 200 );
	assert.equal( ( await response.json() ).catalog, '/v1/catalog.json' );
} );
