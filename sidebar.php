<?php
/**
 * The sidebar containing the main widget area.
 *
 * @package Open_Frame
 */

if ( ! open_frame_has_sidebar() ) {
	return;
}

?>
<aside id="secondary" class="widget-area of-sidebar" aria-label="<?php esc_attr_e( 'Sidebar', 'open-frame' ); ?>">
	<?php dynamic_sidebar( open_frame_get_sidebar_id() ); ?>
</aside>
