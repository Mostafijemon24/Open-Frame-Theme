<?php
/**
 * Template part for a page whose content is laid out by a page builder.
 *
 * The content spans the full width of the window, without the page card. The
 * title stays in the container, so a page builder's own "hide title" setting
 * keeps working (the title uses the standard `h1.entry-title` selector).
 *
 * @package Open_Frame
 * @since   1.1.0
 */

?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry-builder' ); ?>>
	<header class="entry-header of-container">
		<?php the_title( '<h1 class="entry-title">', '</h1>' ); ?>
	</header>

	<div class="entry-content">
		<?php
		the_content();

		wp_link_pages(
			array(
				'before' => '<div class="page-links of-container">' . esc_html__( 'Pages:', 'open-frame' ),
				'after'  => '</div>',
			)
		);
		?>
	</div>
</article>
