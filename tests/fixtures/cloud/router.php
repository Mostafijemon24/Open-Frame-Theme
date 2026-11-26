<?php
/**
 * A stand-in for the starter site library, for tests.
 *
 *   php -S localhost:8891 tests/fixtures/cloud/router.php
 *
 * Serves v1/catalog.json and the preview images. What the catalog request
 * answers is decided by a "mode" file, so tests can make the library fail:
 *
 *   ok            the catalog
 *   down          HTTP 503
 *   missing       HTTP 404
 *   garbage       HTTP 200 with a body that is not JSON
 *   wrong-shape   valid JSON that is not a catalog
 *   newer         a catalog in a format this plugin does not know yet
 *   partial       the catalog plus three entries that must be rejected
 *   install       the catalog plus a site that requires a small plugin from WordPress.org
 *   available     the catalog with the first site marked as available
 *
 * The mode file and a request counter live in the folder named by the
 * OFT_CLOUD_STATE environment variable.
 *
 * @package Open_Frame
 */

// phpcs:disable -- Test helper, never part of the theme or the plugin.
$state = getenv( 'OFT_CLOUD_STATE' ) ?: sys_get_temp_dir();
$mode  = is_readable( "$state/cloud-mode" ) ? trim( file_get_contents( "$state/cloud-mode" ) ) : 'ok';
$path  = parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH );
$base  = 'http://' . $_SERVER['HTTP_HOST'] . '/v1';

if ( preg_match( '#^/v1/previews/([a-z0-9-]+)/([a-z0-9-]+\.png)$#', $path, $m ) ) {
	$file = __DIR__ . "/v1/previews/{$m[1]}/{$m[2]}";
	if ( is_readable( $file ) ) {
		header( 'Content-Type: image/png' );
		header( 'Cache-Control: public, max-age=31536000, immutable' );
		readfile( $file );
		return true;
	}
}

if ( '/v1/catalog.json' !== $path ) {
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
if ( 'wrong-shape' === $mode ) {
	echo '{"hello":"world","sites":"none"}';
	return true;
}

$catalog = json_decode( str_replace( '{{BASE}}', $base, file_get_contents( __DIR__ . '/v1/catalog.json' ) ), true );

if ( 'newer' === $mode ) {
	$catalog['format'] = 99;
}

if ( 'available' === $mode ) {
	$catalog['sites'][0]['status']   = 'available';
	$catalog['sites'][0]['manifest'] = array(
		'url'    => "$base/sites/business/1.0.0/manifest.json",
		'sha256' => str_repeat( 'a', 64 ),
	);
}

if ( 'install' === $mode ) {
	$site                        = $catalog['sites'][0];
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
	$good = $catalog['sites'][0];

	// A preview image on a host the plugin must not trust.
	$foreign                         = $good;
	$foreign['id']                   = 'foreign-image';
	$foreign['preview']['thumbnail'] = 'https://evil.example/thumbnail.png';

	// A plugin whose file is outside its own folder.
	$traversal                                 = $good;
	$traversal['id']                           = 'bad-plugin-file';
	$traversal['requires']['plugins'][0]['file'] = '../../wp-config.php';

	// "Available" without saying where the package is.
	$no_manifest           = $good;
	$no_manifest['id']     = 'no-manifest';
	$no_manifest['status'] = 'available';

	// Markup in a name is text, not HTML.
	$catalog['sites'][1]['name'] = 'Agency <script>alert(1)</script>';

	array_push( $catalog['sites'], $foreign, $traversal, $no_manifest, 'not even an object' );
}

$body = json_encode( $catalog );
$etag = '"' . md5( $body ) . '"';
header( 'ETag: ' . $etag );
header( 'Cache-Control: public, max-age=300' );

if ( isset( $_SERVER['HTTP_IF_NONE_MATCH'] ) && $_SERVER['HTTP_IF_NONE_MATCH'] === $etag ) {
	http_response_code( 304 );
	return true;
}

echo $body;
return true;
