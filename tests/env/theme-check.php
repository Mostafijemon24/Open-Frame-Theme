<?php
/**
 * Runs the Theme Check plugin against the installed "open-frame" theme and
 * prints every message. Run through tests/env/run.php; tests/env/theme-check.sh
 * installs the packaged ZIP first, so the package is what gets checked.
 *
 * @package Open_Frame
 */

// phpcs:disable -- Command-line test helper, never loaded by WordPress.
require_once WP_PLUGIN_DIR . '/theme-check/checkbase.php';
require_once WP_PLUGIN_DIR . '/theme-check/main.php';

$open_frame_theme = wp_get_theme( 'open-frame' );
run_themechecks_against_theme( $open_frame_theme, 'open-frame' );

global $themechecks, $checkcount;
$open_frame_messages = array();
foreach ( $themechecks as $open_frame_check ) {
	if ( $open_frame_check instanceof themecheck ) {
		foreach ( (array) $open_frame_check->getError() as $open_frame_message ) {
			$open_frame_messages[] = trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( $open_frame_message ) ) );
		}
	}
}
$open_frame_messages = array_unique( $open_frame_messages );
rsort( $open_frame_messages );

$open_frame_counts = array(
	'REQUIRED'    => 0,
	'WARNING'     => 0,
	'RECOMMENDED' => 0,
	'INFO'        => 0,
);
foreach ( $open_frame_messages as $open_frame_message ) {
	foreach ( $open_frame_counts as $open_frame_level => $open_frame_count ) {
		if ( 0 === strpos( $open_frame_message, $open_frame_level ) ) {
			++$open_frame_counts[ $open_frame_level ];
		}
	}
	echo $open_frame_message, "\n";
}

printf(
	"\nTheme Check: %s %s, %d checks. Required: %d, warnings: %d, recommended: %d, info: %d.\n",
	$open_frame_theme->get( 'Name' ),
	$open_frame_theme->get( 'Version' ),
	count( $themechecks ),
	$open_frame_counts['REQUIRED'],
	$open_frame_counts['WARNING'],
	$open_frame_counts['RECOMMENDED'],
	$open_frame_counts['INFO']
);

exit( $open_frame_counts['REQUIRED'] + $open_frame_counts['WARNING'] > 0 ? 1 : 0 );
