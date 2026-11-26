<?php
/**
 * A stand-in for the starter site library, for tests.
 *
 *   OFT_CLOUD_STATE=<folder> php -S localhost:8891 tests/fixtures/cloud/router.php
 *
 * It serves a library built by tools/library.mjs (in <folder>/library) and
 * signs the catalog with the development key (<folder>/dev.key), exactly as
 * the real library does. What the catalog request answers is decided by a
 * "mode" file (<folder>/cloud-mode), so tests can make the library misbehave:
 *
 *   ok             the ten planned sites
 *   soon           the same, plus a made-up design that is not out yet ("Upcoming")
 *   available      the same plus "Reference", a site that has a package
 *   newer-importer the same, but "Reference" needs a newer version of the plugin
 *   install        the same plus a site that requires a small plugin from WordPress.org
 *   partial        the same plus entries that must be rejected
 *   down           HTTP 503
 *   missing        HTTP 404
 *   garbage        HTTP 200 with a body that is not JSON
 *   wrong-shape    a correctly signed document that is not a catalog
 *   newer          a correctly signed catalog in a format this plugin does not know yet
 *   unsigned       the catalog without its signature envelope
 *   bad-signature  the catalog changed after it was signed
 *   foreign-key    the catalog signed with a key the plugin does not know
 *
 * @package Open_Frame
 */

// phpcs:disable -- Test helper, never part of the theme or the plugin.
$state = getenv( 'OFT_CLOUD_STATE' ) ?: sys_get_temp_dir();
$tree  = "$state/library";
$mode  = is_readable( "$state/cloud-mode" ) ? trim( file_get_contents( "$state/cloud-mode" ) ) : 'ok';
$path  = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
$base  = 'http://' . $_SERVER['HTTP_HOST'] . '/v1';

$types = array(
	'json'  => 'application/json',
	'zip'   => 'application/zip',
	'png'   => 'image/png',
	'webp'  => 'image/webp',
	'jpg'   => 'image/jpeg',
	'woff2' => 'font/woff2',
);

if ( '/v1/catalog.json' !== $path ) {
	$file = realpath( $tree . $path );
	$type = $types[ pathinfo( $path, PATHINFO_EXTENSION ) ] ?? null;
	if ( $file && $type && 0 === strpos( $file, realpath( $tree ) . '/v1/' ) && is_file( $file ) ) {
		header( 'Content-Type: ' . $type );
		header( 'Cache-Control: public, max-age=31536000, immutable' );
		readfile( $file );
		return true;
	}
	http_response_code( 404 );
	header( 'Content-Type: application/json' );
	echo '{"code":"not_found","message":"Not found","retryable":false}';
	return true;
}

file_put_contents( "$state/cloud-requests", (int) @file_get_contents( "$state/cloud-requests" ) + 1 );
header( 'Content-Type: application/json' );

if ( 'down' === $mode ) {
	http_response_code( 503 );
	echo '{"code":"unavailable","message":"Unavailable","retryable":true}';
	return true;
}
if ( 'missing' === $mode ) {
	http_response_code( 404 );
	echo '{"code":"not_found","message":"Not found","retryable":false}';
	return true;
}
if ( 'garbage' === $mode ) {
	echo '<html><body>Not what you asked for</body></html>';
	return true;
}

/** Sign a document the way tools/lib.mjs does. */
function oft_envelope( $document, $secret_key ) {
	$signed = json_encode( $document, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
	$public = sodium_crypto_sign_publickey_from_secretkey( $secret_key );
	return array(
		'signed'     => $signed,
		'signatures' => array(
			array(
				'alg' => 'ed25519',
				'key' => substr( hash( 'sha256', $public ), 0, 8 ),
				'sig' => base64_encode( sodium_crypto_sign_detached( $signed, $secret_key ) ),
			),
		),
	);
}

// The development key: the last 32 bytes of the PKCS#8 file are the seed.
$pem    = file_get_contents( "$state/dev.key" );
$seed   = substr( base64_decode( preg_replace( '/-----[^-]+-----|\s/', '', $pem ) ), -32 );
$secret = sodium_crypto_sign_secretkey( sodium_crypto_sign_seed_keypair( $seed ) );

$built   = json_decode( file_get_contents( "$tree/v1/catalog.json" ), true );
$catalog = json_decode( $built['signed'], true );

// "Reference" is only listed when a test asks for a site that has a package.
$reference = null;
foreach ( $catalog['sites'] as $index => $site ) {
	if ( 'reference' === $site['id'] ) {
		$reference = $site;
		unset( $catalog['sites'][ $index ] );
	}
}
$catalog['sites'] = array_values( $catalog['sites'] );

// A free design that is not out yet. It is made up here, so the tests do not
// depend on which of the real designs happen to be finished.
$plain            = $reference;
$plain['id']      = 'upcoming';
$plain['name']    = 'Upcoming';
$plain['summary'] = 'A design that is announced and cannot be imported yet.';
$plain['status']  = 'coming_soon';
$plain['tags']    = array( 'placeholder' );
$plain['pages']   = array( 'Home', 'About', 'Work', 'Project Details', 'Services', 'Service Details', 'Resume', 'Notes', 'Single Post', 'Contact', '404' );
unset( $plain['manifest'] );

if ( 'wrong-shape' === $mode ) {
	$catalog = array(
		'hello' => 'world',
		'sites' => 'none',
	);
}

if ( 'newer' === $mode ) {
	$catalog['format'] = 99;
}

if ( 'available' === $mode || 'newer-importer' === $mode ) {
	if ( 'newer-importer' === $mode ) {
		$reference['requires']['importer'] = '9.0.0';
	}
	array_unshift( $catalog['sites'], $reference );
}

if ( 'soon' === $mode ) {
	array_unshift( $catalog['sites'], $plain );
}

if ( 'install' === $mode ) {
	$site                        = $plain;
	$site['id']                  = 'install-test';
	$site['name']                = 'Install Test';
	$site['requires']['plugins'] = array(
		array(
			'slug'     => 'hello-dolly',
			'name'     => 'Hello Dolly',
			'file'     => 'hello-dolly/hello.php',
			'source'   => 'wordpress.org',
			'required' => true,
		),
	);
	array_unshift( $catalog['sites'], $site );
}

if ( 'partial' === $mode ) {
	$good = $plain;

	// A preview image on a host the plugin must not trust.
	$foreign                         = $good;
	$foreign['id']                   = 'foreign-image';
	$foreign['preview']['thumbnail'] = 'https://evil.example/thumbnail.png';

	// A plugin whose file is outside its own folder.
	$traversal                                   = $good;
	$traversal['id']                             = 'bad-plugin-file';
	$traversal['requires']['plugins'][0]['file'] = '../../wp-config.php';

	// "Available" without saying where the package is.
	$no_manifest           = $good;
	$no_manifest['id']     = 'no-manifest';
	$no_manifest['status'] = 'available';

	// Markup in a name is text, not HTML.
	$catalog['sites'][1]['name'] = 'Agency <script>alert(1)</script>';

	array_push( $catalog['sites'], $foreign, $traversal, $no_manifest, 'not even an object' );
}

$envelope = oft_envelope( $catalog, $secret );

if ( 'unsigned' === $mode ) {
	$envelope = $catalog;
}
if ( 'bad-signature' === $mode ) {
	$envelope['signed'] = str_replace( 'Business', 'Busyness', $envelope['signed'] );
}
if ( 'foreign-key' === $mode ) {
	$envelope = oft_envelope( $catalog, sodium_crypto_sign_secretkey( sodium_crypto_sign_keypair() ) );
}

$body = json_encode( $envelope );
$etag = '"' . md5( $body ) . '"';
header( 'ETag: ' . $etag );
header( 'Cache-Control: public, max-age=300' );

if ( 'foreign-key' !== $mode && isset( $_SERVER['HTTP_IF_NONE_MATCH'] ) && $_SERVER['HTTP_IF_NONE_MATCH'] === $etag ) {
	http_response_code( 304 );
	return true;
}

echo $body;
return true;
