<?php
/**
 * Checks of the import engine against the mock library: a complete import,
 * importing twice, rolling back, interruptions at every point, damaged
 * downloads and sites that are not ready.
 *
 *   php tests/env/run.php <wordpress-dir> tests/php/importer.php
 *
 * Unlike starter-sites.php this talks to the mock library over HTTP, so the
 * test site has to be running (tests/env/setup.sh). The site is left as it
 * was found.
 *
 * @package Open_Frame
 */

// phpcs:disable -- Command-line test, never loaded by WordPress.
use OpenFrame\StarterSites\Cloud\Catalog;
use OpenFrame\StarterSites\Cloud\Client;
use OpenFrame\StarterSites\Cloud\Manifest;
use OpenFrame\StarterSites\Config;
use OpenFrame\StarterSites\Elementor\Adapter;
use OpenFrame\StarterSites\Fonts\Fonts;
use OpenFrame\StarterSites\History\Log;
use OpenFrame\StarterSites\Import\Package;
use OpenFrame\StarterSites\Import\Rollback;
use OpenFrame\StarterSites\Import\Runner;
use OpenFrame\StarterSites\Requirements\Checker;
use OpenFrame\StarterSites\SiteParts\SiteParts;

if ( ! class_exists( Runner::class ) || ! did_action( 'elementor/loaded' ) ) {
	echo "The Open Frame Starter Sites plugin and Elementor have to be active.\n";
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

/** Tell the mock library how to answer, and forget the saved catalog. */
function ofss_cloud( $mode ) {
	file_put_contents( dirname( OFT_LIBRARY ) . '/cloud-mode', $mode . "\n" );
	delete_option( Catalog::OPTION );
}

$config    = new Config();
$client    = new Client( $config );
$history   = new Log();
$elementor = new Adapter();
$rollback  = new Rollback( $config, $elementor, $history );

function ofss_runner( $adapter = null ) {
	global $config, $client, $history, $elementor;
	return new Runner( $config, new Catalog( $client, $config ), new Checker(), new Manifest( $client, $config ), $adapter ?: $elementor, $history );
}

/** Run a started import to its end, one unit of work per call, as separate requests would. */
function ofss_finish( Runner $runner, array $state, $limit = 200 ) {
	while ( 'running' === $state['status'] && $limit-- > 0 ) {
		$state = $runner->advance( $state['id'], 1 );
		if ( is_wp_error( $state ) ) {
			return $state;
		}
	}
	return $state;
}

/** Everything an import may touch, in one comparable value. */
function ofss_fingerprint() {
	wp_cache_flush();
	$count = function ( $type, $status = 'any' ) {
		return count( get_posts( array( 'post_type' => $type, 'post_status' => $status, 'numberposts' => -1, 'fields' => 'ids', 'suppress_filters' => true ) ) );
	};
	return array(
		'pages'       => $count( 'page', array( 'publish', 'draft' ) ),
		'attachments' => $count( 'attachment', 'inherit' ),
		'site_parts'  => $count( SiteParts::POST_TYPE, array( 'publish', 'draft', 'trash' ) ),
		'kits'        => $count( 'elementor_library', array( 'publish', 'draft', 'trash' ) ),
		'menu_items'  => $count( 'nav_menu_item', array( 'publish', 'draft' ) ),
		'menus'       => count( wp_get_nav_menus() ),
		'front'       => get_option( 'show_on_front' ) . ':' . get_option( 'page_on_front' ),
		'kit'         => (int) get_option( 'elementor_active_kit' ),
		'theme_mods'  => wp_json_encode( get_option( 'theme_mods_' . get_stylesheet() ) ),
		'active_site' => wp_json_encode( get_option( 'ofss_active_site' ) ),
		'uploads'     => count( (array) glob( wp_upload_dir()['basedir'] . '/open-frame-starter-sites/*', GLOB_ONLYDIR ) ),
		'posts'       => $count( 'post', array( 'publish', 'draft' ) ),
		'categories'  => (int) wp_count_terms( array( 'taxonomy' => 'category', 'hide_empty' => false ) ),
		'fonts'       => wp_json_encode( get_option( 'ofss_fonts' ) ),
		'font_files'  => count( (array) glob( wp_upload_dir()['basedir'] . '/open-frame-fonts/*' ) ) + (int) is_dir( wp_upload_dir()['basedir'] . '/open-frame-fonts' ),
	);
}

/** Forget any run, so the next test starts clean. */
function ofss_reset_run() {
	delete_option( Runner::STATE );
	delete_transient( Runner::LOCK );
}

ofss_cloud( 'available' );
ofss_reset_run();
delete_option( Log::OPTION );
$baseline = ofss_fingerprint();
$original = array(
	'show_on_front'          => get_option( 'show_on_front' ),
	'page_on_front'          => get_option( 'page_on_front' ),
	'page_for_posts'         => get_option( 'page_for_posts' ),
	'elementor_active_kit'   => get_option( 'elementor_active_kit' ),
	'elementor_previous_kit' => get_option( 'elementor_previous_kit' ),
	'theme_mods'             => get_option( 'theme_mods_' . get_stylesheet() ),
);

/* ---------------------------------------------------------------------- */
ofss_section( 'A complete import' );

$runner = ofss_runner();
$state  = $runner->start( 'reference' );
ofss_check( 'an import can be started', ! is_wp_error( $state ) && 'running' === $state['status'] && 12 === strlen( $state['id'] ) );

$second = $runner->start( 'reference' );
ofss_check( 'a second import cannot start while one is unfinished', is_wp_error( $second ) && 'ofss_unfinished' === $second->get_error_code() );

$state = ofss_finish( $runner, $state );
ofss_check( 'the import finishes', ! is_wp_error( $state ) && 'done' === $state['status'] && '' === $state['error'] );
ofss_check( 'it reports two pages, one image and one menu, without warnings', array( 'pages' => 2, 'posts' => 0, 'images' => 1, 'reused' => 0, 'menus' => 1 ) === $state['counts'] && array() === $state['warnings'] );

$home  = get_post( $state['posts']['page/home'] );
$about = get_post( $state['posts']['page/about'] );
$image = $state['media']['hero'];
$data  = (string) get_post_meta( $home->ID, '_elementor_data', true );

ofss_check( 'both pages are published under their own addresses', 'publish' === $home->post_status && 'publish' === $about->post_status && 'home' === $home->post_name && 'about' === $about->post_name );
ofss_check( 'the home page is the front page', 'page' === get_option( 'show_on_front' ) && (int) get_option( 'page_on_front' ) === $home->ID );
ofss_check( 'pages use Elementor\'s Full Width template and are marked as built with Elementor', 'elementor_header_footer' === get_post_meta( $home->ID, '_wp_page_template', true ) && 'builder' === get_post_meta( $home->ID, '_elementor_edit_mode', true ) );
ofss_check( 'the Elementor content is valid JSON with the four widgets', is_array( json_decode( $data, true ) ) && 4 === substr_count( $data, '"elType":"widget"' ) );
ofss_check( 'no reference is left unresolved', false === strpos( $data, 'ofss:' ) );
ofss_check( 'the image widget points at the imported attachment, by ID and address', false !== strpos( $data, '"id":' . $image . ',' ) && false !== strpos( $data, wp_json_encode( wp_get_attachment_url( $image ) ) ) );
ofss_check( 'links point at the imported About page', false !== strpos( $data, str_replace( '/', '\\/', get_permalink( $about->ID ) ) ) );
ofss_check( 'the page settings came along (title hidden)', 'yes' === ( get_post_meta( $home->ID, '_elementor_page_settings', true )['hide_title'] ?? '' ) );

ofss_check( 'the image is in the media library with its alt text', 'attachment' === get_post_type( $image ) && 'A dark blue rectangle' === get_post_meta( $image, '_wp_attachment_image_alt', true ) && wp_attachment_is_image( $image ) );
ofss_check( 'the stored image is byte-identical to the one in the library', hash_file( 'sha256', get_attached_file( $image ) ) === get_post_meta( $image, '_ofss_source_hash', true ) );
ofss_check( 'everything created is tagged with the site, its identity and the run', 'reference' === get_post_meta( $home->ID, '_ofss_site', true ) && 'reference:pages:home' === get_post_meta( $home->ID, '_ofss_uid', true ) && $state['id'] === get_post_meta( $image, '_ofss_run', true ) );

// Elementor keeps documents in memory; read the kit as the next request would see it.
$kit      = \Elementor\Plugin::$instance->documents->get( (int) get_option( 'elementor_active_kit' ), false );
$primary  = array_values( array_filter( (array) $kit->get_settings( 'system_colors' ), fn( $c ) => 'primary' === $c['_id'] ) )[0]['color'] ?? '';
ofss_check( 'a new kit is active and carries the design\'s primary color', (int) $kit->get_id() === $state['kit'] && $state['kit'] !== $baseline['kit'] && '#2F6FED' === strtoupper( $primary ) );
ofss_check( 'the kit that was active before still exists', 'publish' === get_post_status( $baseline['kit'] ) );

ofss_check( 'theme settings are applied in the right types', '#2f6fed' === get_theme_mod( 'open_frame_color_primary' ) && true === get_theme_mod( 'open_frame_follow_elementor' ) && 1200 === get_theme_mod( 'open_frame_container_width' ) );

$fonts     = new Fonts();
$font      = $fonts->all()[0] ?? array();
$font_file = $fonts->location()['dir'] . '/' . ( $font['file'] ?? 'none' );
ofss_check( 'the font of the design is stored on the site, byte-identical to the one in the library', 1 === count( $fonts->all() ) && 'Instrument Sans' === $font['family'] && $state['id'] === $font['run'] && is_file( $font_file ) && hash_file( 'sha256', $font_file ) . '.woff2' === $font['file'] );
ofss_check( 'it is declared with @font-face from this site\'s own address', false !== strpos( $fonts->css(), '@font-face{font-family:"Instrument Sans";font-style:normal;font-weight:400 700;font-display:swap;src:url("' . content_url( '/uploads/open-frame-fonts/' . $font['file'] ) . '") format("woff2");}' ) );
ofss_check( 'Elementor lists it as a local font, so it requests nothing from a font service', 'ofss' === ( \Elementor\Fonts::get_fonts()['Instrument Sans'] ?? '' ) && isset( \Elementor\Fonts::get_font_groups()['ofss'] ) );
update_option( Fonts::OPTION, array_merge( $fonts->all(), array( array( 'family' => 'x";}body{display:none}', 'weight' => '400', 'style' => 'normal', 'file' => str_repeat( 'a', 64 ) . '.woff2', 'run' => 'x' ), array( 'family' => 'Fine', 'weight' => '400', 'style' => 'normal', 'file' => '../../wp-config.php', 'run' => 'x' ) ) ) );
ofss_check( 'a stored entry that could break out of the stylesheet is ignored', 1 === count( $fonts->all() ) && false === strpos( $fonts->css(), 'display:none' ) && false === strpos( $fonts->css(), 'wp-config' ) );
update_option( Fonts::OPTION, $fonts->all() );

$locations = get_theme_mod( 'nav_menu_locations' );
$items     = wp_get_nav_menu_items( $locations['primary'] ?? 0 );
ofss_check( 'the menu is in the theme\'s primary location with both pages', is_array( $items ) && 2 === count( $items ) && (int) $items[0]->object_id === $home->ID && 'page' === $items[1]->object && (int) $items[1]->object_id === $about->ID );

$part = get_post( $state['posts']['site-part/header'] );
ofss_check( 'the header exists as a site part for the header location', SiteParts::POST_TYPE === $part->post_type && 'header' === get_post_meta( $part->ID, SiteParts::LOCATION_META, true ) && 'builder' === get_post_meta( $part->ID, '_elementor_edit_mode', true ) );
ofss_check( 'the theme is told that the header is taken, the footer is not', true === apply_filters( 'open_frame_has_location', false, 'header' ) && false === apply_filters( 'open_frame_has_location', false, 'footer' ) );

ob_start();
$rendered = apply_filters( 'open_frame_do_location', false, 'header' );
$markup   = ob_get_clean();
ofss_check( 'the site part renders inside a header element', true === $rendered && 0 === strpos( $markup, '<header class="of-site-part of-site-part--header">' ) && false !== strpos( $markup, 'Reference' ) );
ofss_check( 'a link to the front page points at the site address, not at /home/', false !== strpos( $markup, 'href="' . home_url( '/' ) . '"' ) && false === strpos( $markup, '/home/' ) );

ofss_check( 'the import is recorded as the active site and in the history', 'reference' === get_option( 'ofss_active_site' )['slug'] && 'success' === $history->all()[0]['result'] && $state['id'] === $history->all()[0]['id'] );
ofss_check( 'the working folder is gone', $baseline['uploads'] === ofss_fingerprint()['uploads'] && '' === $state['dir'] );
ofss_check( 'the lock is released', false === get_transient( Runner::LOCK ) );

$summary = $runner->summary( $state );
ofss_check( 'the summary for the screen is complete', 100 === $summary['percent'] && 'done' === $summary['status'] && home_url( '/' ) === $summary['links']['view'] && false !== strpos( $summary['links']['edit'], 'post=' . $home->ID . '&action=elementor' ) );

$imported = ofss_fingerprint();

/* ---------------------------------------------------------------------- */
ofss_section( 'Rolling back' );

$state = $rollback->run( $state );
ofss_check( 'the import can be rolled back', ! is_wp_error( $state ) && 'rolled_back' === $state['status'] );
ofss_check( 'the site is exactly as it was before the import', ofss_fingerprint() === $baseline );
ofss_check( 'pages, image file and header are gone', null === get_post( $home->ID ) && null === get_post( $image ) && null === get_post( $part->ID ) && false === apply_filters( 'open_frame_has_location', false, 'header' ) );
ofss_check( 'the font file, its folder and its @font-face rule are gone', ! is_file( $font_file ) && ! is_dir( dirname( $font_file ) ) && '' === $fonts->css() && false === get_option( Fonts::OPTION ) );
ofss_check( 'the history shows the rollback', 'rolled_back' === $history->all()[0]['result'] );
ofss_check( 'rolling back twice changes nothing', 'rolled_back' === $rollback->run( $state )['status'] && ofss_fingerprint() === $baseline );
ofss_check( 'a run that was rolled back cannot be advanced', 'rolled_back' === $runner->advance( $state['id'] )['status'] && ofss_fingerprint() === $baseline );

/* ---------------------------------------------------------------------- */
ofss_section( 'Importing twice' );

$first  = ofss_finish( $runner, $runner->start( 'reference' ) );
$once   = ofss_fingerprint();
$second = ofss_finish( $runner, $runner->start( 'reference' ) );
$twice  = ofss_fingerprint();

ofss_check( 'a second import of the same design finishes', 'done' === $second['status'] );
ofss_check( 'no page, image, site part, menu or menu item is duplicated', array_intersect_key( $once, array_flip( array( 'pages', 'attachments', 'site_parts', 'menus', 'menu_items' ) ) ) === array_intersect_key( $twice, array_flip( array( 'pages', 'attachments', 'site_parts', 'menus', 'menu_items' ) ) ) );
ofss_check( 'the same pages are used again', $first['posts'] === $second['posts'] );
ofss_check( 'the image is reused, not downloaded again', 1 === $second['counts']['reused'] && 0 === $second['counts']['images'] && $first['media'] === $second['media'] );

// Rolling back the second import must not take away what the first one made.
$rollback->run( $second );
$after_second_rollback = ofss_fingerprint();
ofss_check( 'rolling back the second import keeps the pages and image of the first', $after_second_rollback['pages'] === $once['pages'] && $after_second_rollback['attachments'] === $once['attachments'] && null !== get_post( $first['posts']['page/home'] ) );
ofss_check( 'the font is stored once and stays with the first import', $once['fonts'] === $twice['fonts'] && $once['font_files'] === $twice['font_files'] && $after_second_rollback['fonts'] === $once['fonts'] && is_file( $font_file ) );

// Clean up by hand what the first of the two imports created and changed: its
// own rollback data was replaced when the second import started, which is the
// documented limit of rolling back (only the most recent import can be undone).
update_option( 'elementor_active_kit', $original['elementor_active_kit'] );
foreach ( get_posts( array( 'post_type' => array( 'page', 'attachment', 'elementor_library', 'nav_menu_item', SiteParts::POST_TYPE ), 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'meta_key' => '_ofss_site', 'meta_value' => 'reference' ) ) as $id ) {
	if ( 'attachment' === get_post_type( $id ) ) {
		wp_delete_attachment( $id, true );
	} elseif ( 'elementor_library' === get_post_type( $id ) ) {
		$elementor->delete_unused_kit( $id );
	} else {
		wp_delete_post( $id, true );
	}
}
foreach ( wp_get_nav_menus() as $menu ) {
	if ( get_term_meta( $menu->term_id, '_ofss_site', true ) ) {
		wp_delete_nav_menu( $menu->term_id );
	}
}
foreach ( array( 'show_on_front', 'page_on_front', 'page_for_posts', 'elementor_previous_kit' ) as $option ) {
	if ( false === $original[ $option ] ) {
		delete_option( $option );
	} else {
		update_option( $option, $original[ $option ] );
	}
}
if ( is_array( $original['theme_mods'] ) ) {
	update_option( 'theme_mods_' . get_stylesheet(), $original['theme_mods'] );
} else {
	delete_option( 'theme_mods_' . get_stylesheet() );
}
delete_option( 'ofss_active_site' );
delete_option( 'ofss_snapshot_' . $first['id'] );
$fonts->remove_run( $first['id'] );
ofss_reset_run();
ofss_check( 'the test site is clean again', ofss_fingerprint() === $baseline );

/* ---------------------------------------------------------------------- */
ofss_section( 'Interruptions' );

// How many units of work a complete import takes.
$probe = $runner->start( 'reference' );
$units = 0;
while ( 'running' === $probe['status'] ) {
	$probe = $runner->advance( $probe['id'], 1 );
	++$units;
}
$complete = ofss_fingerprint();
$rollback->run( $probe );
ofss_reset_run();
ofss_check( "a complete import takes $units units of work", $units >= 12 && ofss_fingerprint() === $baseline );

$rolled_back_clean = 0;
$resumed_complete  = 0;
for ( $stop = 1; $stop < $units; $stop++ ) {
	// The browser closes after $stop units. The user comes back and rolls back.
	$state = $runner->start( 'reference' );
	for ( $i = 0; $i < $stop; $i++ ) {
		$state = $runner->advance( $state['id'], 1 );
	}
	$rollback->run( $runner->state() );
	ofss_reset_run();
	$rolled_back_clean += (int) ( ofss_fingerprint() === $baseline );

	// The same interruption, but the user continues in a new request.
	$state = $runner->start( 'reference' );
	for ( $i = 0; $i < $stop; $i++ ) {
		$state = $runner->advance( $state['id'], 1 );
	}
	$state = ofss_finish( ofss_runner(), $runner->state() );
	$after = ofss_fingerprint();
	$same  = 'done' === $state['status'];
	foreach ( array( 'pages', 'attachments', 'site_parts', 'kits', 'menus', 'menu_items' ) as $key ) {
		$same = $same && $after[ $key ] === $complete[ $key ];
	}
	$same              = $same && 0 === strpos( $after['front'], 'page:' ) && false === strpos( (string) get_post_meta( $state['posts']['page/home'], '_elementor_data', true ), 'ofss:' );
	$resumed_complete += (int) $same;
	$rollback->run( $state );
	ofss_reset_run();
}
ofss_check( 'stopped after each of the ' . ( $units - 1 ) . ' possible points and rolled back, the site is always as before', $rolled_back_clean === $units - 1 );
ofss_check( 'stopped after each of those points and continued, the import always completes with the same result', $resumed_complete === $units - 1 );
ofss_check( 'after all of that the site is still as it was', ofss_fingerprint() === $baseline );

$state = $runner->start( 'reference' );
set_transient( Runner::LOCK, array( 'expires' => time() + 60 ), 120 );
$busy = $runner->advance( $state['id'], 1 );
ofss_check( 'a run that is being worked on in another window is not worked on twice', is_wp_error( $busy ) && 'ofss_busy' === $busy->get_error_code() );
ofss_check( 'nor can it be rolled back at that moment', is_wp_error( $rollback->run( $runner->state() ) ) );
set_transient( Runner::LOCK, array( 'expires' => time() - 1 ), 120 );
ofss_check( 'a lock left behind by a request that died expires', ! is_wp_error( $runner->advance( $state['id'], 1 ) ) );
ofss_check( 'an unknown run is refused', is_wp_error( $runner->advance( 'aaaaaaaaaaaa' ) ) );
$rollback->run( $runner->state() );
ofss_reset_run();

/* ---------------------------------------------------------------------- */
ofss_section( 'Theme Builder templates (needs Elementor Pro in the test site)' );

if ( ! $elementor->has_theme_builder() ) {
	echo "  --    skipped: Elementor Pro is not active. Run with \"plugin:elementor-pro=on\" to include these checks.\n";
} else {
	ofss_cloud( 'available-pro' );
	delete_option( 'ofss_catalog' );
	$state = ofss_finish( $runner, $runner->start( 'reference-pro' ) );
	ofss_check( 'a design with templates imports', ! is_wp_error( $state ) && 'done' === $state['status'] && array() === $state['warnings'] );

	$header = (int) ( $state['posts']['template/header'] ?? 0 );
	$single = (int) ( $state['posts']['template/single'] ?? 0 );
	ofss_check( 'the header is a published Theme Builder template of the type "header"', 'elementor_library' === get_post_type( $header ) && 'publish' === get_post_status( $header ) && 'header' === get_post_meta( $header, '_elementor_template_type', true ) );
	ofss_check( 'the single post template has its type and its content', 'single-post' === get_post_meta( $single, '_elementor_template_type', true ) && false !== strpos( (string) get_post_meta( $single, '_elementor_data', true ), 'Reference Pro single post' ) );
	ofss_check( 'both are tagged with the run and their identity', $state['id'] === get_post_meta( $header, '_ofss_run', true ) && 'reference-pro:templates:single' === get_post_meta( $single, '_ofss_uid', true ) );

	$manager = \ElementorPro\Modules\ThemeBuilder\Module::instance()->get_conditions_manager();
	ofss_check( 'the header is used on the whole site', array( $header ) === array_keys( $manager->get_cache()->get_by_location( 'header' ) ) && array( 'include/general' ) === $manager->get_cache()->get_by_location( 'header' )[ $header ] );
	ofss_check( 'the single template is used for posts', array( 'include/singular/post' ) === ( $manager->get_cache()->get_by_location( 'single' )[ $single ] ?? array() ) );
	ofss_check( 'the post of the design exists', 'publish' === get_post_status( $state['posts']['post/a-post'] ?? 0 ) );

	$again = ofss_finish( $runner, $runner->start( 'reference-pro' ) );
	ofss_check( 'importing it twice creates no second template', $header === (int) $again['posts']['template/header'] && $single === (int) $again['posts']['template/single'] && array( $header ) === array_keys( $manager->get_cache()->get_by_location( 'header' ) ) );

	// Roll back the second run, then remove what the first one made (see "Importing twice").
	$rollback->run( $again );
	ofss_check( 'rolling back the second import keeps the templates of the first', 'publish' === get_post_status( $header ) );
	foreach ( get_posts( array( 'post_type' => array( 'page', 'post', 'elementor_library' ), 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids', 'meta_key' => '_ofss_site', 'meta_value' => 'reference-pro' ) ) as $id ) {
		if ( 'elementor_library' === get_post_type( $id ) ) {
			if ( $elementor->is_kit( $id ) ) {
				update_option( 'elementor_active_kit', $original['elementor_active_kit'] );
				$elementor->delete_unused_kit( $id );
			} else {
				$elementor->delete_template( $id );
			}
		} else {
			wp_delete_post( $id, true );
		}
	}
	foreach ( get_terms( array( 'taxonomy' => 'category', 'hide_empty' => false, 'fields' => 'ids', 'meta_key' => '_ofss_run', 'meta_value' => $state['id'] ) ) as $term ) {
		wp_delete_term( $term, 'category' );
	}
	foreach ( array( 'show_on_front', 'page_on_front', 'page_for_posts', 'elementor_previous_kit' ) as $option ) {
		if ( false === $original[ $option ] ) {
			delete_option( $option );
		} else {
			update_option( $option, $original[ $option ] );
		}
	}
	if ( is_array( $original['theme_mods'] ) ) {
		update_option( 'theme_mods_' . get_stylesheet(), $original['theme_mods'] );
	} else {
		delete_option( 'theme_mods_' . get_stylesheet() );
	}
	delete_option( 'ofss_active_site' );
	delete_option( 'ofss_snapshot_' . $state['id'] );
	ofss_reset_run();
	ofss_check( 'no template is left in the Theme Builder', array() === $manager->get_cache()->get_by_location( 'header' ) && array() === $manager->get_cache()->get_by_location( 'single' ) );
	if ( ofss_fingerprint() !== $baseline ) {
		echo '        ', wp_json_encode( array_diff_assoc( ofss_fingerprint(), $baseline ) ), ' instead of ', wp_json_encode( array_diff_assoc( $baseline, ofss_fingerprint() ) ), "\n";
	}
	ofss_check( 'the test site is clean again', ofss_fingerprint() === $baseline );

	// A single import, rolled back by the plugin itself.
	$state = ofss_finish( $runner, $runner->start( 'reference-pro' ) );
	$rollback->run( $state );
	ofss_reset_run();
	ofss_check( 'a rollback removes the templates and their conditions', array() === $manager->get_cache()->get_by_location( 'header' ) && array() === $manager->get_cache()->get_by_location( 'single' ) && ofss_fingerprint() === $baseline );
	ofss_cloud( 'available' );
	delete_option( 'ofss_catalog' );
}

/* ---------------------------------------------------------------------- */
ofss_section( 'Damaged or altered downloads' );

$damage = array(
	'a package that does not match its checksum' => function ( &$s ) { $s['manifest']['package']['sha256'] = str_repeat( 'a', 64 ); },
	'a package of another size'                  => function ( &$s ) { $s['manifest']['package']['bytes'] += 1; },
	'a package on a foreign host'                => function ( &$s ) { $s['manifest']['package']['url'] = 'https://evil.example/package.zip'; },
	'a package with a file the manifest does not list' => function ( &$s ) { unset( $s['manifest']['files']['site/menus.json'] ); },
	'a package that lacks a file the manifest lists' => function ( &$s ) { $s['manifest']['files']['content/pages/extra.json'] = array( 'sha256' => str_repeat( 'a', 64 ), 'bytes' => 2 ); },
	'a page inside the package that was changed'  => function ( &$s ) { $s['manifest']['files']['content/pages/home.json']['sha256'] = str_repeat( 'b', 64 ); },
	'an image that does not match its checksum'   => function ( &$s ) { $s['manifest']['media'][0]['sha256'] = str_repeat( 'c', 64 ); },
	'an image on a foreign host'                  => function ( &$s ) { $s['manifest']['media'][0]['url'] = 'https://evil.example/hero.png'; },
	'a font that does not match its checksum'     => function ( &$s ) { $s['manifest']['fonts'][0]['sha256'] = str_repeat( 'd', 64 ); },
	'a font on a foreign host'                    => function ( &$s ) { $s['manifest']['fonts'][0]['url'] = 'https://evil.example/font.woff2'; },
);
foreach ( $damage as $label => $break ) {
	$state = $runner->start( 'reference' );
	$state = $runner->advance( $state['id'], 2 ); // Preflight and snapshot: the verified manifest is now in the run.
	$break( $state );
	$runner->save( $state );
	$state = ofss_finish( $runner, $state );
	$clean = 'failed' === $state['status'] && false !== strpos( $state['error'], 'damaged or was altered' );
	$rollback->run( $state );
	ofss_reset_run();
	ofss_check( "$label stops the import, and rolling back leaves no trace", $clean && ofss_fingerprint() === $baseline );
}

$package = new Package( $config );
ofss_check( 'a file is never fetched from a foreign host', is_wp_error( $package->fetch( array( 'url' => 'https://evil.example/x.zip', 'sha256' => str_repeat( 'a', 64 ), 'bytes' => 1 ), sys_get_temp_dir() . '/ofss-x' ) ) && ! file_exists( sys_get_temp_dir() . '/ofss-x' ) );

/* ---------------------------------------------------------------------- */
ofss_section( 'Sites that are not ready' );

$limited = new class() extends Adapter {
	public function widgets() {
		return array( 'heading', 'text-editor' );
	}
};
$state = ofss_finish( ofss_runner( $limited ), $runner->start( 'reference' ) );
ofss_check( 'missing Elementor widgets stop the import before anything changes, and are named', 'failed' === $state['status'] && false !== strpos( $state['error'], 'button, image' ) && ofss_fingerprint() === $baseline );
ofss_reset_run();

$no_containers = new class() extends Adapter {
	public function has_containers() {
		return false;
	}
};
$state = ofss_finish( ofss_runner( $no_containers ), $runner->start( 'reference' ) );
ofss_check( 'Elementor without containers stops the import with instructions', 'failed' === $state['status'] && false !== strpos( $state['error'], 'Container' ) && ofss_fingerprint() === $baseline );
ofss_reset_run();

ofss_cloud( 'newer-importer' );
$state = ofss_finish( ofss_runner(), ofss_runner()->start( 'reference' ) );
ofss_check( 'a design that needs a newer plugin is not imported', 'failed' === $state['status'] && ofss_fingerprint() === $baseline );
ofss_reset_run();

ofss_cloud( 'soon' );
$state = ofss_finish( ofss_runner(), ofss_runner()->start( 'upcoming' ) );
ofss_check( 'a design that is not out yet is not imported', 'failed' === $state['status'] && ofss_fingerprint() === $baseline );
ofss_reset_run();
ofss_check( 'a design that does not exist cannot be started', is_wp_error( ofss_runner()->start( 'no-such-site' ) ) );

ofss_cloud( 'down' );
$state = ofss_runner()->start( 'reference' );
ofss_check( 'with the library down and nothing saved, an import cannot be started', is_wp_error( $state ) );
ofss_reset_run();
ofss_cloud( 'available' );

/* ---------------------------------------------------------------------- */
ofss_section( 'REST routes' );

// Elementor removes every "rest_api_init" hook when it runs its own internal
// requests, which it did during the imports above. A real site handles each
// request in a new process; this long test has to put the routes back.
add_action( 'rest_api_init', array( OpenFrame\StarterSites\Plugin::class, 'routes' ) );
$GLOBALS['wp_rest_server'] = null;
$call = function ( $route, $method = 'POST', $params = array() ) {
	$request = new WP_REST_Request( $method, '/open-frame-starter-sites/v1' . $route );
	foreach ( $params as $key => $value ) {
		$request->set_param( $key, $value );
	}
	return rest_do_request( $request );
};

$subscriber = wp_insert_user( array( 'user_login' => 'ofss_importer_' . wp_rand(), 'user_pass' => wp_generate_password(), 'role' => 'subscriber' ) );
wp_set_current_user( $subscriber );
ofss_check( 'a subscriber cannot start, advance, roll back or look at an import', 403 === $call( '/imports', 'POST', array( 'site' => 'reference', 'confirmed' => true ) )->get_status() && 403 === $call( '/imports/aaaaaaaaaaaa/advance' )->get_status() && 403 === $call( '/imports/aaaaaaaaaaaa/rollback' )->get_status() && 403 === $call( '/imports/current', 'GET' )->get_status() );
wp_set_current_user( 0 );
ofss_check( 'a visitor cannot either', 401 === $call( '/imports', 'POST', array( 'site' => 'reference', 'confirmed' => true ) )->get_status() );
wp_set_current_user( 1 );

ofss_check( 'an import that was not confirmed is refused', 400 === $call( '/imports', 'POST', array( 'site' => 'reference', 'confirmed' => false ) )->get_status() && null === $call( '/imports/current', 'GET' )->get_data()['run'] );
ofss_check( 'an unknown run is a 404', 404 === $call( '/imports/aaaaaaaaaaaa/advance' )->get_status() && 404 === $call( '/imports/aaaaaaaaaaaa/rollback' )->get_status() );

$response = $call( '/imports', 'POST', array( 'site' => 'reference', 'confirmed' => true ) );
$run      = $response->get_data();
ofss_check( 'a confirmed import starts and reports its first step', 200 === $response->get_status() && 'running' === $run['status'] && 0 === $run['percent'] && 'Checking your site' === $run['label'] );
ofss_check( 'a second one is refused while it runs', 409 === $call( '/imports', 'POST', array( 'site' => 'reference', 'confirmed' => true ) )->get_status() );

$guard = 50;
while ( 'running' === $run['status'] && $guard-- > 0 ) {
	$run = $call( '/imports/' . $run['id'] . '/advance' )->get_data();
}
ofss_check( 'advancing over REST completes the import', 'done' === $run['status'] && 100 === $run['percent'] && 2 === $run['counts']['pages'] && ! empty( $run['links']['edit'] ) );
ofss_check( 'the finished run is what "current" returns', $run['id'] === $call( '/imports/current', 'GET' )->get_data()['run']['id'] );
ofss_check( 'the run summary does not expose the manifest or local paths', ! isset( $run['manifest'], $run['dir'] ) );

$run = $call( '/imports/' . $run['id'] . '/rollback' )->get_data();
ofss_check( 'rolling back over REST restores the site', 'rolled_back' === $run['status'] && ofss_fingerprint() === $baseline );

/* ---------------------------------------------------------------------- */
require_once ABSPATH . 'wp-admin/includes/user.php';
wp_delete_user( $subscriber );
ofss_reset_run();
delete_option( Log::OPTION );
ofss_cloud( 'ok' );

echo "\n$ofss_passed passed, $ofss_failed failed.\n";
exit( $ofss_failed > 0 ? 1 : 0 );
