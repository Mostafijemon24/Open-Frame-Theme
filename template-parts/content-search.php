<?php
/**
 * Template part for displaying a search result.
 *
 * @package Open_Frame
 */

?>
<article id="post-<?php the_ID(); ?>" <?php post_class( 'entry-card entry-search' ); ?>>
	<div class="entry-card-body">
		<header class="entry-header">
			<?php
			the_title( sprintf( '<h2 class="entry-title"><a href="%s" rel="bookmark">', esc_url( get_permalink() ) ), '</a></h2>' );
			open_frame_entry_meta();
			?>
		</header>

		<div class="entry-summary">
			<?php the_excerpt(); ?>
		</div>

		<footer class="entry-footer">
			<a class="read-more" href="<?php the_permalink(); ?>">
				<?php esc_html_e( 'Read more', 'open-frame' ); ?>
				<span class="screen-reader-text"><?php the_title(); ?></span>
				<span aria-hidden="true">&rarr;</span>
			</a>
		</footer>
	</div>
</article>
