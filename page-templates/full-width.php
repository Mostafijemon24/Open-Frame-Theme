<?php
/**
 * Template Name: Full Width
 * Template Post Type: page
 *
 * The standard page card, stretched to the container width with no sidebar.
 *
 * @package Open_Frame
 */

get_header();
?>
<div class="of-container of-content-area">
	<div class="<?php echo esc_attr( open_frame_layout_classes() ); ?>">
		<main id="main" class="site-main of-primary">
			<?php
			while ( have_posts() ) :
				the_post();
				get_template_part( 'template-parts/content', 'page' );

				if ( comments_open() || get_comments_number() ) {
					comments_template();
				}
			endwhile;
			?>
		</main>
	</div>
</div>
<?php
get_footer();
