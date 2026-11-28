<?php
/**
 * A last look at Elementor content before it is stored.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Import;

defined( 'ABSPATH' ) || exit;

/**
 * Refuses Elementor content that could run code on the site.
 *
 * The tools that build the library refuse the same things, and the package is
 * covered by the signature of the catalog. This check is the second lock on
 * the same door: an administrator's import is saved without the filters
 * WordPress applies to other users, so nothing that carries script may reach
 * that point, whatever happened further up.
 */
class ContentGuard {

	/**
	 * Kinds of element a design is built from.
	 */
	const ELEMENTS = array( 'container', 'widget', 'section', 'column' );

	/**
	 * Widgets that hold code or pull in whatever the site has under a name:
	 * raw HTML, shortcodes, a sidebar. WordPress widgets inside Elementor
	 * ("wp-widget-…") are refused as a group.
	 */
	const BLOCKED_WIDGETS = array( 'html', 'shortcode', 'sidebar' );

	/**
	 * Settings that carry CSS or HTML attributes written by hand.
	 */
	const BLOCKED_SETTINGS = array( 'custom_css', '_attributes', 'custom_attributes' );

	/**
	 * Markup and addresses that run script, load another document or restyle the page.
	 */
	const SCRIPT = '/<\s*(script|iframe|object|embed|style|link|meta|base|form|svg|math)\b|javascript:|vbscript:|data:text\/html|[\s\/"\'`]on[a-z]+\s*=/i';

	/**
	 * Addresses that run script, looked for once more with the spaces and control
	 * characters removed that a browser ignores inside them.
	 */
	const SCHEME = '/(?:javascript|vbscript):|data:text\/html/i';

	/**
	 * Elementor's dynamic tag that runs a shortcode: the "shortcode" widget by another door.
	 */
	const DYNAMIC_SHORTCODE = '/\[elementor-tag\b[^\]]*\bname=["\']?shortcode\b/i';

	/**
	 * What is wrong with the content of one document; empty when it can be stored.
	 *
	 * @param array $elements Elementor element tree.
	 * @param array $settings Page settings of the document.
	 * @return string[] Short descriptions, in the words of the package (not translated: they name what a developer has to look for).
	 */
	public function problems( array $elements, array $settings = array() ) {
		$problems = array();
		$this->walk( $elements, $problems );
		$this->scan( $settings, $problems );

		return array_values( array_unique( $problems ) );
	}

	/**
	 * Check a list of elements and everything below them.
	 *
	 * @param array    $elements Elements.
	 * @param string[] $problems Collected problems.
	 * @return void
	 */
	private function walk( array $elements, array &$problems ) {
		foreach ( $elements as $element ) {
			if ( ! is_array( $element ) ) {
				$problems[] = 'an element that is not an element';
				continue;
			}

			$type = (string) ( $element['elType'] ?? '' );
			if ( ! in_array( $type, self::ELEMENTS, true ) ) {
				$problems[] = 'element type "' . $this->name( $type ) . '"';
			}

			if ( 'widget' === $type ) {
				$widget = (string) ( $element['widgetType'] ?? '' );
				if ( ! preg_match( '/^[a-z0-9][a-z0-9_-]*$/', $widget ) || in_array( $widget, self::BLOCKED_WIDGETS, true ) || 0 === strpos( $widget, 'wp-widget-' ) ) {
					$problems[] = 'widget "' . $this->name( $widget ) . '"';
				}
			}

			if ( isset( $element['settings'] ) ) {
				$this->scan( $element['settings'], $problems );
			}
			if ( isset( $element['elements'] ) && is_array( $element['elements'] ) ) {
				$this->walk( $element['elements'], $problems );
			}
		}
	}

	/**
	 * Check every setting of an element, however deep it is nested.
	 *
	 * @param mixed    $value    Settings, or part of them.
	 * @param string[] $problems Collected problems.
	 * @return void
	 */
	private function scan( $value, array &$problems ) {
		if ( is_string( $value ) ) {
			if ( $this->carries_script( $value ) ) {
				$problems[] = 'script or embedded markup in a text';
			}
			return;
		}
		if ( ! is_array( $value ) ) {
			return;
		}

		foreach ( $value as $key => $item ) {
			if ( in_array( $key, self::BLOCKED_SETTINGS, true ) && '' !== $item && array() !== $item && null !== $item ) {
				$problems[] = 'the setting "' . $key . '"';
				continue;
			}
			$this->scan( $item, $problems );
		}
	}

	/**
	 * Whether a text carries script, in any of the spellings a browser accepts.
	 *
	 * The text is checked as written, with its character references resolved
	 * ("&#x6a;avascript:"), and, where it holds a dynamic tag, with the tag's
	 * URL-encoded settings decoded.
	 *
	 * @param string $value Text.
	 * @return bool
	 */
	private function carries_script( $value ) {
		$readings = array( $value, html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );

		if ( false !== strpos( $value, '[elementor-tag' ) ) {
			if ( preg_match( self::DYNAMIC_SHORTCODE, $value ) ) {
				return true;
			}
			$readings[] = rawurldecode( $value );
			$readings[] = html_entity_decode( rawurldecode( $value ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		}

		foreach ( array_unique( $readings ) as $reading ) {
			if ( preg_match( self::SCRIPT, $reading ) || preg_match( self::SCHEME, (string) preg_replace( '/[\x00-\x20]+/', '', $reading ) ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * A name from the package, made safe to show.
	 *
	 * @param string $name Name.
	 * @return string
	 */
	private function name( $name ) {
		return substr( preg_replace( '/[^A-Za-z0-9_-]/', '?', $name ), 0, 40 );
	}
}
