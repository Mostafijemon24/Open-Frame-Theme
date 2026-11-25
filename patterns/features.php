<?php
/**
 * Title: Feature cards
 * Slug: open-frame/features
 * Categories: open-frame, featured, text
 * Keywords: features, services, cards, columns
 * Description: A section heading followed by three feature cards.
 *
 * @package Open_Frame
 */

?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--70)"><!-- wp:paragraph {"align":"center","className":"is-style-open-frame-eyebrow"} -->
<p class="has-text-align-center is-style-open-frame-eyebrow"><?php esc_html_e( 'Why Open Frame', 'open-frame' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"center"} -->
<h2 class="wp-block-heading has-text-align-center"><?php esc_html_e( 'Everything you need, nothing you don’t', 'open-frame' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"className":"is-style-open-frame-card","layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-open-frame-card"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'Design system', 'open-frame' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Colors, type and spacing flow from one set of design tokens, so a single change updates the whole site.', 'open-frame' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"className":"is-style-open-frame-card","layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-open-frame-card"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'Header and footer builders', 'open-frame' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Pick a header layout, make it sticky or transparent and arrange up to four footer columns from the Customizer.', 'open-frame' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"className":"is-style-open-frame-card","layout":{"type":"constrained"}} -->
<div class="wp-block-group is-style-open-frame-card"><!-- wp:heading {"level":3} -->
<h3 class="wp-block-heading"><?php esc_html_e( 'Accessible by default', 'open-frame' ); ?></h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><?php esc_html_e( 'Keyboard-friendly menus, visible focus states and readable contrast are built in from the start.', 'open-frame' ); ?></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->
