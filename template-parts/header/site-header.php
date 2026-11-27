<?php
/**
 * The site header built from the Customizer settings.
 *
 * @package Open_Frame
 * @since   1.1.0
 */

?>
<header id="masthead" class="<?php echo esc_attr( implode( ' ', open_frame_header_classes() ) ); ?>">
	<div class="of-container site-header-inner">
		<?php
		open_frame_site_branding();
		open_frame_primary_nav();
		open_frame_header_search();
		?>
	</div>
</header>
