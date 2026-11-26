<?php
/**
 * Fonts that came with an imported design.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Fonts;

defined( 'ABSPATH' ) || exit;

/**
 * Keeps a design's font files on the site and makes them usable.
 *
 * The files are stored in the uploads folder and served from the site itself,
 * so a visitor's browser never asks a font service for them. Each family is
 * declared with `@font-face` and offered in Elementor's font list.
 */
class Fonts {

	/**
	 * Option that lists the stored fonts.
	 */
	const OPTION = 'ofss_fonts';

	/**
	 * Folder inside the uploads folder.
	 */
	const FOLDER = 'open-frame-fonts';

	/**
	 * Group the fonts appear under in Elementor.
	 */
	const GROUP = 'ofss';

	/**
	 * Hook into WordPress and Elementor.
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'wp_enqueue_scripts', array( $this, 'styles' ), 5 );
		add_action( 'elementor/editor/after_enqueue_styles', array( $this, 'styles' ) );
		add_filter( 'elementor/fonts/groups', array( $this, 'groups' ) );
		add_filter( 'elementor/fonts/additional_fonts', array( $this, 'families' ) );
	}

	/**
	 * The stored fonts.
	 *
	 * @return array[] Each with `family`, `weight`, `style`, `file` and `run`.
	 */
	public function all() {
		$fonts = get_option( self::OPTION, array() );

		return is_array( $fonts ) ? array_values( array_filter( $fonts, array( $this, 'is_valid' ) ) ) : array();
	}

	/**
	 * Where the font files are kept.
	 *
	 * @return array{dir:string,url:string}
	 */
	public function location() {
		$uploads = wp_get_upload_dir();

		return array(
			'dir' => trailingslashit( $uploads['basedir'] ) . self::FOLDER,
			'url' => set_url_scheme( trailingslashit( $uploads['baseurl'] ) . self::FOLDER ),
		);
	}

	/**
	 * Whether a font file is already stored.
	 *
	 * @param string $sha256 Hash of the file.
	 * @return bool
	 */
	public function has( $sha256 ) {
		foreach ( $this->all() as $font ) {
			if ( $font['file'] === $sha256 . '.woff2' && is_file( $this->location()['dir'] . '/' . $font['file'] ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Record a font file that was just stored.
	 *
	 * @param array  $item   `family`, `weight`, `style` and `sha256` from the verified manifest.
	 * @param string $run_id The import that brought it.
	 * @return void
	 */
	public function add( array $item, $run_id ) {
		$fonts = $this->all();
		if ( in_array( $item['sha256'] . '.woff2', wp_list_pluck( $fonts, 'file' ), true ) ) {
			return;
		}

		$fonts[] = array(
			'family' => $this->clean_family( $item['family'] ),
			'weight' => (string) $item['weight'],
			'style'  => (string) $item['style'],
			'file'   => $item['sha256'] . '.woff2',
			'run'    => (string) $run_id,
		);

		update_option( self::OPTION, array_values( array_filter( $fonts, array( $this, 'is_valid' ) ) ), true );
	}

	/**
	 * Remove the fonts an import brought, files included.
	 *
	 * @param string $run_id The import.
	 * @return void
	 */
	public function remove_run( $run_id ) {
		$keep = array();
		$drop = array();
		foreach ( $this->all() as $font ) {
			if ( $font['run'] === (string) $run_id ) {
				$drop[] = $font['file'];
			} else {
				$keep[] = $font;
			}
		}

		$this->delete_files( array_diff( $drop, wp_list_pluck( $keep, 'file' ) ) );

		if ( $keep ) {
			update_option( self::OPTION, $keep, true );
		} else {
			delete_option( self::OPTION );
		}
	}

	/**
	 * Remove every stored font. Used when the plugin is deleted.
	 *
	 * @return void
	 */
	public function remove_all() {
		$this->delete_files( wp_list_pluck( $this->all(), 'file' ) );
		delete_option( self::OPTION );
	}

	/**
	 * The `@font-face` rules for the stored fonts.
	 *
	 * @return string
	 */
	public function css() {
		$url = $this->location()['url'];
		$css = '';
		foreach ( $this->all() as $font ) {
			$css .= sprintf(
				'@font-face{font-family:"%1$s";font-style:%2$s;font-weight:%3$s;font-display:swap;src:url("%4$s") format("woff2");}',
				$font['family'],
				$font['style'],
				$font['weight'],
				esc_url_raw( $url . '/' . $font['file'] )
			);
		}

		return $css;
	}

	/**
	 * Print the rules on the site and in the Elementor editor.
	 *
	 * @return void
	 */
	public function styles() {
		$css = $this->css();
		if ( '' === $css ) {
			return;
		}

		wp_register_style( 'ofss-fonts', false, array(), OFSS_VERSION );
		wp_enqueue_style( 'ofss-fonts' );
		wp_add_inline_style( 'ofss-fonts', $css );
	}

	/**
	 * Add the group to Elementor's font list.
	 *
	 * @param array<string,string> $groups Font groups.
	 * @return array<string,string>
	 */
	public function groups( $groups ) {
		if ( $this->all() ) {
			$groups[ self::GROUP ] = __( 'Starter site fonts', 'open-frame-starter-sites' );
		}

		return $groups;
	}

	/**
	 * Add the families to Elementor's font list.
	 *
	 * Elementor may know a family of the same name as a Google font; listing
	 * it here makes Elementor use the local files and request nothing.
	 *
	 * @param array<string,string> $fonts Font name => group.
	 * @return array<string,string>
	 */
	public function families( $fonts ) {
		foreach ( $this->all() as $font ) {
			$fonts[ $font['family'] ] = self::GROUP;
		}

		return $fonts;
	}

	/**
	 * Whether a stored entry is safe to print.
	 *
	 * @param mixed $font Entry.
	 * @return bool
	 */
	private function is_valid( $font ) {
		return is_array( $font )
			&& isset( $font['family'], $font['weight'], $font['style'], $font['file'], $font['run'] )
			&& is_string( $font['family'] ) && '' !== $font['family'] && $font['family'] === $this->clean_family( $font['family'] )
			&& is_string( $font['weight'] ) && 1 === preg_match( '/^[1-9]00( [1-9]00)?$/', $font['weight'] )
			&& in_array( $font['style'], array( 'normal', 'italic' ), true )
			&& is_string( $font['file'] ) && 1 === preg_match( '/^[a-f0-9]{64}\.woff2$/', $font['file'] );
	}

	/**
	 * A family name reduced to letters, digits and spaces.
	 *
	 * @param mixed $family Name.
	 * @return string
	 */
	private function clean_family( $family ) {
		return trim( (string) preg_replace( '/[^A-Za-z0-9 ]+/', '', (string) $family ) );
	}

	/**
	 * Delete font files, and the folder once it is empty.
	 *
	 * @param string[] $files File names.
	 * @return void
	 */
	private function delete_files( array $files ) {
		$dir = $this->location()['dir'];
		foreach ( $files as $file ) {
			if ( 1 === preg_match( '/^[a-f0-9]{64}\.woff2$/', $file ) ) {
				wp_delete_file( $dir . '/' . $file );
			}
		}

		if ( is_dir( $dir ) && ! glob( $dir . '/*' ) ) {
			rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- An empty folder this class created.
		}
	}
}
