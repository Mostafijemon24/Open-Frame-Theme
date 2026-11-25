<?php
/**
 * Title: Latest posts grid
 * Slug: open-frame/latest-posts
 * Categories: open-frame, posts
 * Keywords: blog, news, posts, grid
 * Description: A section heading followed by the three most recent posts.
 *
 * @package Open_Frame
 */

?>
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|70","bottom":"var:preset|spacing|70"}}},"backgroundColor":"surface","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-surface-background-color has-background" style="padding-top:var(--wp--preset--spacing--70);padding-bottom:var(--wp--preset--spacing--70)"><!-- wp:paragraph {"align":"center","className":"is-style-open-frame-eyebrow"} -->
<p class="has-text-align-center is-style-open-frame-eyebrow"><?php esc_html_e( 'From the blog', 'open-frame' ); ?></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"center"} -->
<h2 class="wp-block-heading has-text-align-center"><?php esc_html_e( 'Latest stories', 'open-frame' ); ?></h2>
<!-- /wp:heading -->

<!-- wp:latest-posts {"postsToShow":3,"displayPostContent":true,"excerptLength":18,"displayPostDate":true,"postLayout":"grid","displayFeaturedImage":true,"featuredImageSizeSlug":"open-frame-card","addLinkToFeaturedImage":true,"align":"wide"} /--></div>
<!-- /wp:group -->
