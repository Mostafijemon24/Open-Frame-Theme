<?php
/**
 * Downloading and reading the files of a starter site.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Import;

use OpenFrame\StarterSites\Config;
use WP_Error;
use ZipArchive;

defined( 'ABSPATH' ) || exit;

/**
 * Every file is fetched from the library's own hosts and used only when its
 * size and SHA-256 match what the verified manifest says. The package ZIP is
 * never extracted: entries are read into memory one at a time, and only the
 * entries the manifest lists exist as far as the importer is concerned.
 */
class Package {

	const MAX_ENTRIES = 500;

	/**
	 * Plugin configuration.
	 *
	 * @var Config
	 */
	private $config;

	/**
	 * Constructor.
	 *
	 * @param Config $config Plugin configuration.
	 */
	public function __construct( Config $config ) {
		$this->config = $config;
	}

	/**
	 * Create a private working folder for a run.
	 *
	 * @param string $run_id Run ID.
	 * @return string|WP_Error Path without a trailing slash.
	 */
	public function workspace( $run_id ) {
		$uploads = wp_upload_dir( null, false );
		$dir     = trailingslashit( $uploads['basedir'] ) . 'open-frame-starter-sites/' . $run_id . '-' . strtolower( wp_generate_password( 16, false ) );

		if ( ! empty( $uploads['error'] ) || ! wp_mkdir_p( $dir ) ) {
			return new WP_Error( 'ofss_workspace', __( 'The uploads folder cannot be written to. Ask your hosting company to make wp-content/uploads writable.', 'open-frame-starter-sites' ) );
		}

		// Nothing in here is ever requested over the web; the names cannot be guessed either.
		foreach ( array( $dir, dirname( $dir ) ) as $folder ) {
			if ( ! file_exists( $folder . '/index.php' ) ) {
				file_put_contents( $folder . '/index.php', "<?php\n// Silence is golden.\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- A two-line guard file in the uploads folder.
			}
		}

		return $dir;
	}

	/**
	 * Remove a working folder and everything in it.
	 *
	 * @param string $dir Folder created by workspace().
	 * @return void
	 */
	public function clean( $dir ) {
		if ( ! is_string( $dir ) || '' === $dir || false === strpos( $dir, '/open-frame-starter-sites/' ) || ! is_dir( $dir ) ) {
			return;
		}

		foreach ( (array) glob( $dir . '/*' ) as $file ) {
			if ( is_file( $file ) ) {
				wp_delete_file( $file );
			}
		}
		rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- An empty folder this class created.
	}

	/**
	 * Download a file and accept it only when it is exactly the file expected.
	 *
	 * @param array  $file `url`, `sha256` and `bytes` from the verified manifest.
	 * @param string $dest Where to store it.
	 * @return true|WP_Error
	 */
	public function fetch( array $file, $dest ) {
		$damaged = new WP_Error( 'ofss_damaged_download', __( 'A download for this design is damaged or was altered, so it was not used. Please try again.', 'open-frame-starter-sites' ) );

		if ( ! $this->config->is_allowed_url( $file['url'] ) ) {
			return $damaged;
		}

		$error = $damaged;
		for ( $attempt = 1; $attempt <= 3; $attempt++ ) {
			if ( $attempt > 1 ) {
				usleep( 400000 * $attempt );
			}

			$response = wp_safe_remote_get(
				$file['url'],
				array(
					'timeout'             => 60,
					'redirection'         => 2,
					'stream'              => true,
					'filename'            => $dest,
					// One byte more than expected, so a file that is too long is noticed instead of cut off.
					'limit_response_size' => $file['bytes'] + 1,
					'user-agent'          => 'OpenFrameStarterSites/' . OFSS_VERSION,
				)
			);

			if ( is_wp_error( $response ) ) {
				$error = new WP_Error( 'ofss_unreachable', __( 'A download for this design did not finish. Check your connection and try again.', 'open-frame-starter-sites' ) );
				continue;
			}

			$status = (int) wp_remote_retrieve_response_code( $response );
			if ( 429 === $status || $status >= 500 ) {
				$error = new WP_Error( 'ofss_server_error', __( 'The starter site library is having trouble right now. Please try again in a few minutes.', 'open-frame-starter-sites' ) );
				continue;
			}

			if ( 200 !== $status || ! is_file( $dest ) || filesize( $dest ) !== $file['bytes'] || ! hash_equals( $file['sha256'], (string) hash_file( 'sha256', $dest ) ) ) {
				wp_delete_file( $dest );
				return $damaged;
			}

			return true;
		}

		wp_delete_file( $dest );
		return $error;
	}

	/**
	 * Check that a downloaded package holds exactly the files the manifest lists.
	 *
	 * @param string $zip_path Package file.
	 * @param array  $files    `files` of the manifest: name => sha256, bytes.
	 * @return true|WP_Error
	 */
	public function inspect( $zip_path, array $files ) {
		$damaged = new WP_Error( 'ofss_damaged_download', __( 'The package of this design is damaged or was altered, so it was not used. Please try again.', 'open-frame-starter-sites' ) );

		$zip = new ZipArchive();
		if ( true !== $zip->open( $zip_path, ZipArchive::RDONLY ) ) {
			return $damaged;
		}

		$entries = $zip->count();
		$ok      = count( $files ) === $entries && $entries <= self::MAX_ENTRIES;
		for ( $index = 0; $ok && $index < $entries; $index++ ) {
			$stat = $zip->statIndex( $index );
			$ok   = is_array( $stat ) && isset( $files[ $stat['name'] ] ) && (int) $stat['size'] === $files[ $stat['name'] ]['bytes'];
		}
		$zip->close();

		return $ok ? true : $damaged;
	}

	/**
	 * Read one JSON file of the package.
	 *
	 * @param string $zip_path Package file.
	 * @param string $name     Entry name.
	 * @param array  $files    `files` of the manifest.
	 * @return array|WP_Error Decoded JSON.
	 */
	public function read( $zip_path, $name, array $files ) {
		$damaged = new WP_Error( 'ofss_damaged_download', __( 'The package of this design is damaged or was altered, so it was not used. Please try again.', 'open-frame-starter-sites' ) );

		if ( ! isset( $files[ $name ] ) ) {
			return $damaged;
		}

		$zip = new ZipArchive();
		if ( true !== $zip->open( $zip_path, ZipArchive::RDONLY ) ) {
			return $damaged;
		}
		$body = $zip->getFromName( $name, $files[ $name ]['bytes'] + 1 );
		$zip->close();

		if ( ! is_string( $body ) || ! hash_equals( $files[ $name ]['sha256'], hash( 'sha256', $body ) ) ) {
			return $damaged;
		}

		$data = json_decode( $body, true );

		return is_array( $data ) ? $data : $damaged;
	}
}
