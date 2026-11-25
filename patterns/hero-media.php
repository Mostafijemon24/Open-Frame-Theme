<?php
/**
 * Title: Hero with illustration
 * Slug: open-frame/hero-media
 * Categories: open-frame, banner, featured
 * Keywords: hero, header, intro, image, columns
 * Description: A two-column hero with a headline, buttons and an illustration.
 *
 * @package Open_Frame
 */

?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80"}}},"backgroundColor":"surface","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-surface-background-color has-background" style="padding-top:var(--wp--preset--spacing--80);padding-bottom:var(--wp--preset--spacing--80)"><!-- wp:columns {"verticalAlignment":"center","align":"wide","style":{"spacing":{"blockGap":{"left":"var:preset|spacing|60"}}}} -->
<div class="wp-block-columns alignwide are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center","width":"52%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:52%"><!-- wp:paragraph {"className":"is-style-open-frame-eyebrow"} -->
<p class="is-style-open-frame-eyebrow"><?php esc_html_e( 'Multipurpose WordPress theme', 'open-frame' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":1,"fontSize":"display"} -->
<h1 class="wp-block-heading has-display-font-size"><?php esc_html_e( 'A flexible frame for every kind of website', 'open-frame' ); ?></h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size"><?php esc_html_e( 'Launch a business site, blog or portfolio with a fast, accessible design system you can fully customize, no extra plugins required.', 'open-frame' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'Get started', 'open-frame' ); ?></a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-open-frame-soft"} -->
<div class="wp-block-button is-style-open-frame-soft"><a class="wp-block-button__link wp-element-button" href="#"><?php esc_html_e( 'See the features', 'open-frame' ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center","width":"48%"} -->
<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:48%"><!-- wp:image {"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/images/hero-illustration.svg' ) ); ?>" alt="<?php esc_attr_e( 'Abstract illustration of layered website frames', 'open-frame' ); ?>"/></figure>
<!-- /wp:image --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->
