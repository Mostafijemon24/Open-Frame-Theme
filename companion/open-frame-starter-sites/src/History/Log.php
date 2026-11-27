<?php
/**
 * Record of past imports.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\History;

defined( 'ABSPATH' ) || exit;

/**
 * Keeps the most recent import reports in one option.
 */
class Log {

	const OPTION = 'ofss_history';
	const LIMIT  = 20;

	/**
	 * Past runs, newest first.
	 *
	 * @return array[] Each with id, site, name, version, result, started, finished, counts, warnings and error.
	 */
	public function all() {
		$entries = get_option( self::OPTION, array() );
		$clean   = array();

		foreach ( is_array( $entries ) ? $entries : array() as $entry ) {
			if ( ! is_array( $entry ) || empty( $entry['id'] ) || empty( $entry['site'] ) ) {
				continue;
			}
			$clean[] = array(
				'id'       => sanitize_key( $entry['id'] ),
				'site'     => sanitize_key( $entry['site'] ),
				'name'     => sanitize_text_field( $entry['name'] ?? $entry['site'] ),
				'version'  => sanitize_text_field( $entry['version'] ?? '' ),
				'result'   => in_array( $entry['result'] ?? '', array( 'success', 'failed', 'rolled_back' ), true ) ? $entry['result'] : 'failed',
				'started'  => (int) ( $entry['started'] ?? 0 ),
				'finished' => (int) ( $entry['finished'] ?? 0 ),
				'counts'   => array_map( 'intval', (array) ( $entry['counts'] ?? array() ) ),
				'warnings' => array_map( 'sanitize_text_field', (array) ( $entry['warnings'] ?? array() ) ),
				'error'    => sanitize_text_field( $entry['error'] ?? '' ),
			);
		}

		return $clean;
	}

	/**
	 * Whether anything has been recorded.
	 *
	 * @return bool
	 */
	public function has_entries() {
		return array() !== $this->all();
	}

	/**
	 * Add a run to the top of the list and drop the oldest beyond the limit.
	 *
	 * @param array $entry Run report.
	 * @return void
	 */
	public function add( array $entry ) {
		$entries = $this->all();
		array_unshift( $entries, $entry );
		update_option( self::OPTION, array_slice( $entries, 0, self::LIMIT ), false );
	}
}
