<?php
/**
 * The header for the theme.
 *
 * @package Open_Frame
 */

?>
<!doctype html>
<html <?php language_attributes(); ?> class="no-js">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#main"><?php esc_html_e( 'Skip to content', 'open-frame' ); ?></a>

	<header id="masthead" class="<?php echo esc_attr( implode( ' ', open_frame_header_classes() ) ); ?>">
		<div class="of-container site-header-inner">
			<?php
			open_frame_site_branding();
			open_frame_primary_nav();
			open_frame_header_search();
			?>
		</div>
	</header>

	<div id="content" class="site-content">
