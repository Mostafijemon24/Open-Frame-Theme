<?php
/**
 * Navigation menu widget for Elementor.
 *
 * @package OpenFrame\StarterSites
 */

namespace OpenFrame\StarterSites\Widgets;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Widget_Base;

defined( 'ABSPATH' ) || exit;

/**
 * Shows the menu of the theme's Primary location inside an Elementor layout.
 *
 * The free version of Elementor has no menu widget, and a header built in
 * Elementor needs one. The widget prints the theme's own navigation, so the
 * dropdowns, the mobile menu, the keyboard handling and the mega menu behave
 * exactly as in the theme header; Elementor adds the colors and typography.
 */
class NavMenu extends Widget_Base {

	/**
	 * Widget name.
	 *
	 * @return string
	 */
	public function get_name() {
		return 'of-nav-menu';
	}

	/**
	 * Widget title.
	 *
	 * @return string
	 */
	public function get_title() {
		return __( 'Navigation Menu (Open Frame)', 'open-frame-starter-sites' );
	}

	/**
	 * Widget icon.
	 *
	 * @return string
	 */
	public function get_icon() {
		return 'eicon-nav-menu';
	}

	/**
	 * Widget categories.
	 *
	 * @return string[]
	 */
	public function get_categories() {
		return array( 'general' );
	}

	/**
	 * Search keywords.
	 *
	 * @return string[]
	 */
	public function get_keywords() {
		return array( 'menu', 'nav', 'navigation', 'header' );
	}

	/**
	 * Register the controls.
	 *
	 * @return void
	 */
	protected function register_controls() {
		$this->start_controls_section(
			'section_menu',
			array( 'label' => __( 'Menu', 'open-frame-starter-sites' ) )
		);

		$this->add_control(
			'menu_notice',
			array(
				'type'            => Controls_Manager::RAW_HTML,
				'raw'             => sprintf(
					/* translators: %s: link to the Menus screen. */
					esc_html__( 'Shows the menu assigned to the "Primary Menu" location. Change its items under %s.', 'open-frame-starter-sites' ),
					'<a href="' . esc_url( admin_url( 'nav-menus.php' ) ) . '" target="_blank" rel="noopener noreferrer">' . esc_html__( 'Appearance > Menus', 'open-frame-starter-sites' ) . '</a>'
				),
				'content_classes' => 'elementor-descriptor',
			)
		);

		$this->add_responsive_control(
			'align',
			array(
				'label'     => __( 'Alignment', 'open-frame-starter-sites' ),
				'type'      => Controls_Manager::CHOOSE,
				'options'   => array(
					'flex-start' => array(
						'title' => __( 'Start', 'open-frame-starter-sites' ),
						'icon'  => 'eicon-h-align-left',
					),
					'center'     => array(
						'title' => __( 'Center', 'open-frame-starter-sites' ),
						'icon'  => 'eicon-h-align-center',
					),
					'flex-end'   => array(
						'title' => __( 'End', 'open-frame-starter-sites' ),
						'icon'  => 'eicon-h-align-right',
					),
				),
				'selectors' => array(
					'{{WRAPPER}} .main-navigation' => 'display: flex; justify-content: {{VALUE}};',
				),
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_style',
			array(
				'label' => __( 'Menu', 'open-frame-starter-sites' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			array(
				'name'     => 'typography',
				'selector' => '{{WRAPPER}} .main-navigation a',
			)
		);

		$this->add_control(
			'color',
			array(
				'label'     => __( 'Text Color', 'open-frame-starter-sites' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .main-navigation > ul > li > a, {{WRAPPER}} .main-navigation > ul > li > .of-submenu-toggle' => 'color: {{VALUE}};',
				),
			)
		);

		$this->add_control(
			'color_active',
			array(
				'label'     => __( 'Hover and Current Color', 'open-frame-starter-sites' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .main-navigation > ul > li > a:hover, {{WRAPPER}} .main-navigation > ul > li > a:focus-visible, {{WRAPPER}} .main-navigation > ul > li.current-menu-item > a, {{WRAPPER}} .main-navigation > ul > li.current_page_item > a' => 'color: {{VALUE}};',
				),
			)
		);

		$this->end_controls_section();
	}

	/**
	 * Print the menu.
	 *
	 * @return void
	 */
	protected function render() {
		if ( function_exists( 'open_frame_primary_nav' ) ) {
			open_frame_primary_nav();
			return;
		}

		// Another theme is active: a plain menu, without the Open Frame behaviour.
		wp_nav_menu(
			array(
				'theme_location' => 'primary',
				'container'      => 'nav',
				'fallback_cb'    => false,
			)
		);
	}
}
