<?php
/**
 * The footer for the theme.
 *
 * @package Open_Frame
 */

?>
	</div><!-- #content -->

	<?php
	if ( ! open_frame_do_location( 'footer' ) ) {
		get_template_part( 'template-parts/footer/site-footer' );
	}
	?>
</div><!-- #page -->
<?php wp_footer(); ?>
</body>
</html>
