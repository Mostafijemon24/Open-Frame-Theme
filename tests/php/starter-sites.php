<?php
/**
 * Checks of the companion plugin's PHP: configuration, catalog validation,
 * caching, requirement checks, REST permissions and the history store.
 *
 *   php tests/env/run.php <wordpress-dir> tests/php/starter-sites.php
 *
 * Plain assertions instead of a test framework: every check prints one line,
 * and the script exits with 1 when any of them fails. HTTP is replaced with
 * canned answers, so nothing here needs the network.
 *
 * @package Open_Frame
 */

// phpcs:disable -- Command-line test, never loaded by WordPress.
use OpenFrame\StarterSites\Cloud\Catalog;
use OpenFrame\StarterSites\Cloud\CatalogValidator;
use OpenFrame\StarterSites\Cloud\Client;
use OpenFrame\StarterSites\Config;
use OpenFrame\StarterSites\History\Log;
use OpenFrame\StarterSites\Requirements\Checker;

if ( ! class_exists( Config::class ) ) {
	echo "The Open Frame Starter Sites plugin is not active.\n";
	exit( 1 );
}

$ofss_failed = 0;
$ofss_passed = 0;

function ofss_check( $label, $condition ) {
	global $ofss_failed, $ofss_passed;
	if ( $condition ) {
		++$ofss_passed;
		echo "  ok    $label\n";
	} else {
		++$ofss_failed;
		echo "  FAIL  $label\n";
	}
}

function ofss_section( $title ) {
	echo "\n$title\n";
}

/** Canned HTTP answers, in order; the last one repeats. Counts the requests. */
$GLOBALS['ofss_http']  = array();
$GLOBALS['ofss_calls'] = array();
add_filter(
	'pre_http_request',
	function ( $pre, $args, $url ) {
		if ( false === strpos( $url, '/catalog.json' ) ) {
			return $pre;
		}
		$GLOBALS['ofss_calls'][] = $args['headers'];
		$answer                  = count( $GLOBALS['ofss_http'] ) > 1 ? array_shift( $GLOBALS['ofss_http'] ) : $GLOBALS['ofss_http'][0];
		if ( is_wp_error( $answer ) ) {
			return $answer;
		}
		return array(
			'headers'  => new \WpOrg\Requests\Utility\CaseInsensitiveDictionary( $answer['headers'] ?? array() ),
			'body'     => $answer['body'] ?? '',
			'response' => array(
				'code'    => $answer['code'],
				'message' => '',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	},
	10,
	3
);

function ofss_answers( ...$answers ) {
	$GLOBALS['ofss_http']  = $answers;
	$GLOBALS['ofss_calls'] = array();
}

$config    = new Config();
$base      = $config->api_base();
$validator = new CatalogValidator( $config );
$raw       = json_decode( str_replace( '{{BASE}}', $base, file_get_contents( dirname( __DIR__ ) . '/fixtures/cloud/v1/catalog.json' ) ), true );
$good_site = $raw['sites'][0];

/* ---------------------------------------------------------------------- */
ofss_section( 'Configuration' );

ofss_check( 'the test site uses the mock library from wp-config.php', 0 === strpos( $base, 'http://localhost:' ) );
ofss_check( 'the default library is HTTPS', 0 === strpos( Config::DEFAULT_API_BASE, 'https://' ) );
ofss_check( 'an image on the library host is allowed', $config->is_allowed_url( $base . '/previews/x/thumbnail.png' ) );
ofss_check( 'an image on another host is refused', ! $config->is_allowed_url( 'https://evil.example/thumbnail.png' ) );
ofss_check( 'the same host on another port is refused', ! $config->is_allowed_url( 'http://localhost:1/thumbnail.png' ) );
ofss_check( 'plain HTTP on a public host is refused', ! $config->is_allowed_url( 'http://api.buildbetters.com/x.png' ) );
ofss_check( 'a javascript: address is refused', ! $config->is_allowed_url( 'javascript:alert(1)' ) && ! $config->is_https_url( 'javascript:alert(1)' ) );
ofss_check( 'a file: address is refused', ! $config->is_allowed_url( 'file:///etc/passwd' ) );
ofss_check( 'something that is not a string is refused', ! $config->is_allowed_url( array( 'x' ) ) && ! $config->is_allowed_url( null ) );

/* ---------------------------------------------------------------------- */
ofss_section( 'Catalog validation' );

$catalog = $validator->validate( $raw );
ofss_check( 'the mock catalog is accepted', ! is_wp_error( $catalog ) && 10 === count( $catalog['sites'] ) && 0 === $catalog['skipped'] );
ofss_check( 'five sites are free and five need Elementor Pro', 5 === count( array_filter( $catalog['sites'], fn( $s ) => 'free' === $s['tier'] ) ) );
ofss_check( 'every Pro site lists Elementor Pro as an external plugin', array() === array_filter( $catalog['sites'], fn( $s ) => 'pro' === $s['tier'] && ! array_filter( $s['requires']['plugins'], fn( $p ) => 'elementor-pro' === $p['slug'] && 'external' === $p['source'] ) ) );

foreach ( array( null, 'text', array(), array( 'format' => 1 ), array( 'format' => '1', 'sites' => array() ), array( 'format' => 0, 'sites' => array() ), array( 'format' => 1, 'sites' => 'none' ) ) as $index => $broken ) {
	$result = $validator->validate( $broken );
	ofss_check( "a broken catalog is refused (#$index)", is_wp_error( $result ) && 'ofss_invalid_catalog' === $result->get_error_code() );
}

$newer = $validator->validate( array( 'format' => 99, 'sites' => array() ) );
ofss_check( 'a catalog in a newer format asks for a plugin update', is_wp_error( $newer ) && 'ofss_newer_catalog' === $newer->get_error_code() );

$rejections = array(
	'an ID that is not a slug'                 => function ( &$s ) { $s['id'] = '../etc'; },
	'an ID with capitals'                      => function ( &$s ) { $s['id'] = 'Business'; },
	'no name'                                  => function ( &$s ) { unset( $s['name'] ); },
	'an unknown tier'                          => function ( &$s ) { $s['tier'] = 'gold'; },
	'an unknown status'                        => function ( &$s ) { $s['status'] = 'live'; },
	'a version that is not a version'          => function ( &$s ) { $s['version'] = '1.0-beta; rm'; },
	'a thumbnail on a foreign host'            => function ( &$s ) { $s['preview']['thumbnail'] = 'https://evil.example/t.png'; },
	'a thumbnail that is a javascript: link'   => function ( &$s ) { $s['preview']['thumbnail'] = 'javascript:alert(1)'; },
	'no requirements'                          => function ( &$s ) { unset( $s['requires'] ); },
	'a WordPress requirement that is not a version' => function ( &$s ) { $s['requires']['wordpress'] = 'latest'; },
	'a plugin file outside its folder'         => function ( &$s ) { $s['requires']['plugins'][0]['file'] = '../../wp-config.php'; },
	'a plugin file in another plugin\'s folder' => function ( &$s ) { $s['requires']['plugins'][0]['file'] = 'akismet/akismet.php'; },
	'a plugin from an unknown source'          => function ( &$s ) { $s['requires']['plugins'][0]['source'] = 'https://evil.example/plugin.zip'; },
	'a plugin slug with a slash'               => function ( &$s ) { $s['requires']['plugins'][0]['slug'] = 'a/b'; },
	'"available" without a manifest'           => function ( &$s ) { $s['status'] = 'available'; },
	'"available" with a manifest on a foreign host' => function ( &$s ) { $s['status'] = 'available'; $s['manifest'] = array( 'url' => 'https://evil.example/m.json', 'sha256' => str_repeat( 'a', 64 ) ); },
	'"available" with a checksum that is not SHA-256' => function ( &$s ) use ( $base ) { $s['status'] = 'available'; $s['manifest'] = array( 'url' => "$base/m.json", 'sha256' => 'abc' ); },
);
foreach ( $rejections as $label => $mutate ) {
	$site = $good_site;
	$mutate( $site );
	$result = $validator->validate( array( 'format' => 1, 'sites' => array( $site ) ) );
	ofss_check( "a site with $label is left out", ! is_wp_error( $result ) && 0 === count( $result['sites'] ) && 1 === $result['skipped'] );
}

$result = $validator->validate( array( 'format' => 1, 'sites' => array( $good_site, $good_site, 'nonsense', 42 ) ) );
ofss_check( 'duplicates and non-objects are left out, the good site stays', 1 === count( $result['sites'] ) && 3 === $result['skipped'] );

$site                        = $good_site;
$site['name']                = 'Business <script>alert(1)</script>';
$site['summary']             = '<img src=x onerror=alert(1)> Summary';
$site['secret']              = 'should not survive';
$site['preview']['demo_url'] = 'http://insecure.example/demo';
$site['editable']['header']  = 'magic';
$site['pages'][]             = array( 'not', 'a', 'string' );
$site['requires']['plugins'][0]['url'] = 'javascript:alert(1)';
$clean                       = $validator->validate( array( 'format' => 1, 'sites' => array( $site ) ) )['sites'][0];
ofss_check( 'markup in a name is removed', false === strpos( $clean['name'], '<' ) && false === strpos( $clean['summary'], '<' ) );
ofss_check( 'unknown fields do not survive', ! isset( $clean['secret'] ) );
ofss_check( 'an insecure demo link is dropped', '' === $clean['preview']['demo_url'] );
ofss_check( 'an unknown "editable" value is dropped', ! isset( $clean['editable']['header'] ) && 'elementor' === $clean['editable']['pages'] );
ofss_check( 'non-text page names are dropped', count( $clean['pages'] ) === count( $good_site['pages'] ) );
ofss_check( 'a javascript: plugin link is dropped', '' === $clean['requires']['plugins'][0]['url'] );

$site             = $good_site;
$site['status']   = 'available';
$site['manifest'] = array( 'url' => "$base/sites/business/1.0.0/manifest.json", 'sha256' => str_repeat( 'a', 64 ) );
$available_site   = $validator->validate( array( 'format' => 1, 'sites' => array( $site ) ) )['sites'][0];
ofss_check( 'an available site with a proper manifest is accepted', 'available' === $available_site['status'] && 64 === strlen( $available_site['manifest']['sha256'] ) );

/* ---------------------------------------------------------------------- */
ofss_section( 'Catalog download and caching' );

$body  = wp_json_encode( $raw );
$store = new Catalog( new Client( $config ), $config );

delete_option( Catalog::OPTION );
ofss_answers( array( 'code' => 200, 'body' => $body, 'headers' => array( 'etag' => '"v1"' ) ) );
$first = $store->get();
ofss_check( 'the first request downloads the catalog', ! is_wp_error( $first ) && 10 === count( $first['catalog']['sites'] ) && 1 === count( $GLOBALS['ofss_calls'] ) && false === $first['stale'] );

$store->get();
ofss_check( 'a fresh copy is used without asking the library again', 1 === count( $GLOBALS['ofss_calls'] ) );
ofss_check( 'the saved copy is not autoloaded', 'off' === ( $GLOBALS['wpdb']->get_var( $GLOBALS['wpdb']->prepare( "SELECT autoload FROM {$GLOBALS['wpdb']->options} WHERE option_name = %s", Catalog::OPTION ) ) ) || 'no' === ( $GLOBALS['wpdb']->get_var( $GLOBALS['wpdb']->prepare( "SELECT autoload FROM {$GLOBALS['wpdb']->options} WHERE option_name = %s", Catalog::OPTION ) ) ) );

ofss_answers( array( 'code' => 304 ) );
$again = $store->get( true );
ofss_check( 'a refresh sends the saved ETag', '"v1"' === ( $GLOBALS['ofss_calls'][0]['If-None-Match'] ?? '' ) );
ofss_check( '"not modified" keeps the saved copy', ! is_wp_error( $again ) && 10 === count( $again['catalog']['sites'] ) && false === $again['stale'] );

ofss_answers( array( 'code' => 503 ) );
$stale = $store->get( true );
ofss_check( 'a failing library is tried three times', 3 === count( $GLOBALS['ofss_calls'] ) );
ofss_check( 'the saved copy is shown as stale when the library fails', ! is_wp_error( $stale ) && true === $stale['stale'] && is_wp_error( $stale['error'] ) && 10 === count( $stale['catalog']['sites'] ) );

ofss_answers( array( 'code' => 503 ), array( 'code' => 200, 'body' => $body, 'headers' => array( 'etag' => '"v2"' ) ) );
$recovered = $store->get( true );
ofss_check( 'a temporary failure is retried and recovers', ! is_wp_error( $recovered ) && false === $recovered['stale'] && 2 === count( $GLOBALS['ofss_calls'] ) );

ofss_answers( array( 'code' => 404 ) );
$store->get( true );
ofss_check( 'a "not found" answer is not retried', 1 === count( $GLOBALS['ofss_calls'] ) );

ofss_answers( new WP_Error( 'http_request_failed', 'cURL error 6: Could not resolve host' ) );
$store->get( true );
ofss_check( 'a connection failure is tried three times', 3 === count( $GLOBALS['ofss_calls'] ) );

ofss_answers( array( 'code' => 200, 'body' => '<html>not json</html>' ) );
$garbage = $store->get( true );
ofss_check( 'an unreadable answer keeps the saved copy', ! is_wp_error( $garbage ) && true === $garbage['stale'] );

delete_option( Catalog::OPTION );
ofss_answers( array( 'code' => 503 ) );
$none = $store->get();
ofss_check( 'without a saved copy a failing library is an error', is_wp_error( $none ) && 'ofss_server_error' === $none->get_error_code() );
ofss_check( 'the error is written for a person', false === stripos( $none->get_error_message(), 'curl' ) && strlen( $none->get_error_message() ) > 20 );

ofss_answers( array( 'code' => 200, 'body' => '{"format":1,"sites":"x"}' ) );
ofss_check( 'a wrong-shaped answer is an error and is not saved', is_wp_error( $store->get() ) && false === get_option( Catalog::OPTION ) );

$seen_agent = '';
$agent_spy  = function ( $pre, $args ) use ( &$seen_agent ) {
	$seen_agent = $args['user-agent'];
	return $pre;
};
add_filter( 'pre_http_request', $agent_spy, 5, 2 );
ofss_answers( array( 'code' => 200, 'body' => $body, 'headers' => array( 'etag' => '"v3"' ) ) );
$store->get();
remove_filter( 'pre_http_request', $agent_spy, 5 );
ofss_check( 'requests name the plugin and do not include the site address', 0 === strpos( $seen_agent, 'OpenFrameStarterSites/' ) && false === strpos( $seen_agent, 'localhost' ) && false === strpos( $seen_agent, 'http' ) );

ofss_check( 'a site can be found by ID', 'business' === $store->find( 'business' )['id'] );
$missing = $store->find( 'no-such-site' );
ofss_check( 'an unknown site is a 404', is_wp_error( $missing ) && 404 === $missing->get_error_data()['status'] );

/* ---------------------------------------------------------------------- */
ofss_section( 'Requirement checks' );

$checker  = new Checker();
$business = $store->find( 'business' );
$check    = $checker->check( $business );
ofss_check( 'a site that is not out yet is "coming soon"', 'coming_soon' === $check['state'] && false === $check['ready'] );
ofss_check( 'the plugin version is not checked for a site that is not out yet', array() === array_filter( $check['environment'], fn( $i ) => in_array( $i['id'], array( 'importer', 'format' ), true ) ) );
ofss_check( 'WordPress, PHP and the theme pass on the test site', array() === array_filter( $check['environment'], fn( $i ) => ! $i['ok'] ) );

$elementor = array_values( array_filter( $check['plugins'], fn( $p ) => 'elementor' === $p['slug'] ) )[0];
ofss_check( 'an active plugin is reported as active, with nothing to do', is_plugin_active( 'elementor/elementor.php' ) ? ( 'active' === $elementor['status'] && '' === $elementor['action'] ) : true );

$site                          = $available_site;
$site['requires']['importer']  = '99.0.0';
ofss_check( 'a site that needs a newer plugin says "update the plugin"', 'update_plugin' === $checker->check( $site )['state'] );

$site                         = $available_site;
$site['requires']['importer'] = '0.1.0';
$site['requires']['format']   = 99;
ofss_check( 'a package in a newer format says "update the plugin"', 'update_plugin' === $checker->check( $site )['state'] );

$site                          = $available_site;
$site['requires']['importer']  = '0.1.0';
$site['requires']['wordpress'] = '99.0';
ofss_check( 'a WordPress version that is too old is "incompatible"', 'incompatible' === $checker->check( $site )['state'] );

$site                         = $available_site;
$site['requires']['importer'] = '0.1.0';
$site['requires']['php']      = '99.0';
ofss_check( 'a PHP version that is too old is "incompatible"', 'incompatible' === $checker->check( $site )['state'] );

$site                         = $available_site;
$site['requires']['importer'] = '0.1.0';
$site['requires']['theme']    = '99.0.0';
ofss_check( 'a theme that is too old is "incompatible"', 'incompatible' === $checker->check( $site )['state'] );

$site                         = $available_site;
$site['requires']['importer'] = '0.1.0';
$site['requires']['plugins']  = array(
	array( 'slug' => 'ofss-missing-plugin', 'name' => 'Missing', 'file' => 'ofss-missing-plugin/ofss-missing-plugin.php', 'version' => '', 'source' => 'wordpress.org', 'required' => true, 'url' => '' ),
);
$result = $checker->check( $site );
ofss_check( 'a missing WordPress.org plugin can be installed', 'needs_plugins' === $result['state'] && 'missing' === $result['plugins'][0]['status'] && 'install' === $result['plugins'][0]['action'] && true === $result['plugins'][0]['allowed'] );

$site['requires']['plugins'][0]['required'] = false;
ofss_check( 'an optional plugin does not hold a site back', 'ready' === $checker->check( $site )['state'] );

$site['requires']['plugins'] = array(
	array( 'slug' => 'elementor-pro', 'name' => 'Elementor Pro', 'file' => 'elementor-pro/elementor-pro.php', 'version' => '', 'source' => 'external', 'required' => true, 'url' => 'https://elementor.com/pro/' ),
);
if ( ! is_plugin_active( 'elementor-pro/elementor-pro.php' ) ) {
	$result = $checker->check( $site );
	ofss_check( 'a site that needs Elementor Pro says so', 'needs_pro' === $result['state'] );
	ofss_check( 'Elementor Pro is never offered for installation', ! in_array( $result['plugins'][0]['action'], array( 'install', 'update' ), true ) );
}

$site['requires']['plugins'] = array(
	array( 'slug' => 'elementor', 'name' => 'Elementor', 'file' => 'elementor/elementor.php', 'version' => '99.0', 'source' => 'wordpress.org', 'required' => true, 'url' => '' ),
);
if ( is_plugin_active( 'elementor/elementor.php' ) ) {
	$result = $checker->check( $site );
	ofss_check( 'a plugin that is too old can be updated', 'outdated' === $result['plugins'][0]['status'] && 'update' === $result['plugins'][0]['action'] );
}

$subscriber = wp_insert_user( array( 'user_login' => 'ofss_subscriber_' . wp_rand(), 'user_pass' => wp_generate_password(), 'role' => 'subscriber' ) );
wp_set_current_user( $subscriber );
$site['requires']['plugins'][0]['slug'] = 'ofss-missing-plugin';
$site['requires']['plugins'][0]['file'] = 'ofss-missing-plugin/ofss-missing-plugin.php';
ofss_check( 'a user who cannot install plugins is not offered the button', false === $checker->check( $site )['plugins'][0]['allowed'] );

/* ---------------------------------------------------------------------- */
ofss_section( 'REST routes' );

do_action( 'rest_api_init' );
$routes = rest_get_server()->get_routes();
ofss_check( 'the four routes are registered', isset( $routes['/open-frame-starter-sites/v1/sites'], $routes['/open-frame-starter-sites/v1/sites/(?P<id>[a-z0-9-]+)'], $routes['/open-frame-starter-sites/v1/requirements'], $routes['/open-frame-starter-sites/v1/history'] ) );

$get = function ( $route, $method = 'GET', $params = array() ) {
	$request = new WP_REST_Request( $method, '/open-frame-starter-sites/v1' . $route );
	foreach ( $params as $key => $value ) {
		$request->set_param( $key, $value );
	}
	return rest_do_request( $request );
};

foreach ( array( '/sites', '/sites/business', '/history' ) as $route ) {
	ofss_check( "a subscriber is refused: GET $route", 403 === $get( $route )->get_status() );
}
ofss_check( 'a subscriber is refused: POST /requirements', 403 === $get( '/requirements', 'POST', array( 'site' => 'business', 'plugin' => 'elementor' ) )->get_status() );

wp_set_current_user( 0 );
ofss_check( 'a visitor is refused', 401 === $get( '/sites' )->get_status() && 401 === $get( '/requirements', 'POST', array( 'site' => 'business', 'plugin' => 'elementor' ) )->get_status() );

wp_set_current_user( 1 );
$response = $get( '/sites' );
$data     = $response->get_data();
ofss_check( 'an administrator gets the catalog', 200 === $response->get_status() && 10 === count( $data['sites'] ) && isset( $data['categories'], $data['fetched_at'] ) && false === $data['stale'] );
ofss_check( 'the list does not expose where packages live', ! isset( $data['sites'][0]['manifest'] ) );
ofss_check( 'every site in the list has a state', array() === array_filter( $data['sites'], fn( $s ) => ! in_array( $s['state'], array( 'coming_soon', 'update_plugin', 'incompatible', 'needs_pro', 'needs_plugins', 'ready' ), true ) ) );

$response = $get( '/sites/business' );
ofss_check( 'one site comes with its requirements', 200 === $response->get_status() && isset( $response->get_data()['requirements']['environment'], $response->get_data()['requirements']['plugins'] ) && ! isset( $response->get_data()['manifest'] ) );
ofss_check( 'an unknown site is a 404', 404 === $get( '/sites/no-such-site' )->get_status() );

ofss_check( 'a plugin that the site does not list cannot be installed', 400 === $get( '/requirements', 'POST', array( 'site' => 'business', 'plugin' => 'akismet' ) )->get_status() );
ofss_check( 'a plugin of an unknown site cannot be installed', 404 === $get( '/requirements', 'POST', array( 'site' => 'no-such-site', 'plugin' => 'elementor' ) )->get_status() );
ofss_check( 'a site name with odd characters is refused', 400 === $get( '/requirements', 'POST', array( 'site' => '../x', 'plugin' => 'elementor' ) )->get_status() );
if ( ! file_exists( WP_PLUGIN_DIR . '/elementor-pro/elementor-pro.php' ) ) {
	ofss_check( 'Elementor Pro cannot be installed through the plugin', 400 === $get( '/requirements', 'POST', array( 'site' => 'agency', 'plugin' => 'elementor-pro' ) )->get_status() );
}
if ( is_plugin_active( 'elementor/elementor.php' ) ) {
	$response = $get( '/requirements', 'POST', array( 'site' => 'business', 'plugin' => 'elementor' ) );
	ofss_check( 'asking for a plugin that is already active changes nothing and succeeds', 200 === $response->get_status() && isset( $response->get_data()['requirements'] ) );
}

delete_option( Catalog::OPTION );
ofss_answers( array( 'code' => 503 ) );
$response = $get( '/sites' );
ofss_check( 'a library that is down, with no saved copy, is a 503 with a message', 503 === $response->get_status() && strlen( $response->get_data()['message'] ) > 20 );
ofss_answers( array( 'code' => 200, 'body' => $body, 'headers' => array( 'etag' => '"v4"' ) ) );
$get( '/sites' );

/* ---------------------------------------------------------------------- */
ofss_section( 'History and imported state' );

$log = new Log();
delete_option( Log::OPTION );
ofss_check( 'no history at first', array() === $log->all() && false === $log->has_entries() );
for ( $i = 1; $i <= 25; $i++ ) {
	$log->add( array( 'id' => "run$i", 'site' => 'business', 'name' => 'Business <b>x</b>', 'version' => '1.0.0', 'result' => 25 === $i ? 'exploded' : 'success', 'started' => 1000 + $i, 'finished' => 1100 + $i ) );
}
$entries = $log->all();
ofss_check( 'only the newest twenty runs are kept', 20 === count( $entries ) && 'run25' === $entries[0]['id'] && 'run6' === $entries[19]['id'] );
ofss_check( 'history is cleaned on the way out', false === strpos( $entries[0]['name'], '<' ) && 'failed' === $entries[0]['result'] );
ofss_check( 'the history route returns the runs', 20 === count( $get( '/history' )->get_data()['entries'] ) );
delete_option( Log::OPTION );

update_option( 'ofss_active_site', array( 'slug' => 'business', 'version' => '0.9.0' ), false );
$sites = array_column( $get( '/sites' )->get_data()['sites'], null, 'id' );
ofss_check( 'an older imported version shows that an update is available', true === $sites['business']['update_available'] && '0.9.0' === $sites['business']['imported_version'] && false === $sites['agency']['update_available'] );
update_option( 'ofss_active_site', array( 'slug' => 'business', 'version' => '1.0.0' ), false );
$sites = array_column( $get( '/sites' )->get_data()['sites'], null, 'id' );
ofss_check( 'the current imported version shows no update', false === $sites['business']['update_available'] && '1.0.0' === $sites['business']['imported_version'] );
delete_option( 'ofss_active_site' );

/* ---------------------------------------------------------------------- */
require_once ABSPATH . 'wp-admin/includes/user.php';
wp_delete_user( $subscriber );
delete_option( Catalog::OPTION );

echo "\n$ofss_passed passed, $ofss_failed failed.\n";
exit( $ofss_failed > 0 ? 1 : 0 );
