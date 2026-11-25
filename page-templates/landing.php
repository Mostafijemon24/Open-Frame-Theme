<?php
/**
 * Template Name: Landing Page
 * Template Post Type: page
 *
 * A blank canvas for block-built pages: no page title, no content card and no
 * sidebar. Blocks are centered at the content width, "Wide" blocks use the
 * container width and "Full width" blocks span the whole viewport.
 *
 * @package Open_Frame
 */

get_header();
?>
<main id="main" class="site-main of-canvas">
	<?php
	while ( have_posts() ) :
		the_post();
		?>
		<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry-canvas' ); ?>>
			<div class="entry-content">
				<?php
				the_content();

				wp_link_pages(
					array(
						'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'open-frame' ),
						'after'  => '</div>',
					)
				);
				?>
			</div>
		</article>
		<?php
	endwhile;
	?>
</main>
<?php
get_footer();
