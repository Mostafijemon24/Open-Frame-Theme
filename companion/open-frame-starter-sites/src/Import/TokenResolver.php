<?php
/**
 * Turns references inside a package into things that exist on this site.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Import;

defined( 'ABSPATH' ) || exit;

/**
 * A package never contains WordPress IDs or addresses. It says
 * `ofss://media/hero` or `ofss://page/about`, and this class replaces those
 * with the attachment and the page that were just imported.
 */
class TokenResolver {

	/**
	 * Attachment IDs by media uid.
	 *
	 * @var array<string,int>
	 */
	private $media;

	/**
	 * Post IDs by "<kind>/<name>", for example "page/about".
	 *
	 * @var array<string,int>
	 */
	private $posts;

	/**
	 * The page that becomes the front page, as "page/<name>", or an empty string.
	 *
	 * @var string
	 */
	private $front;

	/**
	 * Menu slugs by the name of the menu inside the package.
	 *
	 * @var array<string,string>
	 */
	private $menus;

	/**
	 * References that pointed at nothing.
	 *
	 * @var string[]
	 */
	public $unresolved = array();

	/**
	 * Constructor.
	 *
	 * @param array<string,int>    $media Attachment IDs by media uid.
	 * @param array<string,int>    $posts Post IDs by "<kind>/<name>".
	 * @param string               $front The page that becomes the front page, as "page/<name>".
	 * @param array<string,string> $menus Menu slugs by the name of the menu inside the package.
	 */
	public function __construct( array $media, array $posts, $front = '', array $menus = array() ) {
		$this->media = $media;
		$this->posts = $posts;
		$this->front = (string) $front;
		$this->menus = $menus;
	}

	/**
	 * Resolve every reference in a value.
	 *
	 * @param mixed $value Value from a package.
	 * @return mixed
	 */
	public function resolve( $value ) {
		if ( is_array( $value ) ) {
			// Elementor keeps an image as { id, url }: the ID has to become a number.
			if ( isset( $value['id'] ) && is_string( $value['id'] ) && preg_match( '#^ofss://media/([a-z0-9-]+)$#', $value['id'], $match ) ) {
				$value['id'] = $this->media[ $match[1] ] ?? '';
			}

			foreach ( $value as $key => $item ) {
				$value[ $key ] = $this->resolve( $item );
			}

			return $value;
		}

		if ( ! is_string( $value ) || false === strpos( $value, 'ofss://' ) ) {
			return $value;
		}

		return preg_replace_callback(
			'#ofss://(media|page|post|site-part|product|menu)/([a-z0-9-]+)#',
			function ( $found ) {
				$url = $this->url( $found[1], $found[2] );
				if ( '' === $url ) {
					$this->unresolved[] = $found[0];
				}
				return $url;
			},
			$value
		);
	}

	/**
	 * The ID a single reference stands for, or 0.
	 *
	 * @param mixed $reference A reference such as "ofss://page/home".
	 * @return int
	 */
	public function id( $reference ) {
		if ( ! is_string( $reference ) || ! preg_match( '#^ofss://(media|page|post|site-part|product)/([a-z0-9-]+)$#', $reference, $match ) ) {
			return 0;
		}

		return 'media' === $match[1] ? (int) ( $this->media[ $match[2] ] ?? 0 ) : (int) ( $this->posts[ $match[1] . '/' . $match[2] ] ?? 0 );
	}

	/**
	 * Address of an imported object.
	 *
	 * @param string $kind Kind of object.
	 * @param string $name Name inside the package.
	 * @return string
	 */
	private function url( $kind, $name ) {
		if ( 'media' === $kind ) {
			return isset( $this->media[ $name ] ) ? (string) wp_get_attachment_url( $this->media[ $name ] ) : '';
		}

		if ( 'menu' === $kind ) {
			return (string) ( $this->menus[ $name ] ?? '' );
		}

		$id = $this->posts[ $kind . '/' . $name ] ?? 0;
		if ( $id && $kind . '/' . $name === $this->front ) {
			// It is not the front page yet while links are written, so its own address would be /<slug>/.
			return home_url( '/' );
		}

		return $id ? (string) get_permalink( $id ) : '';
	}
}
