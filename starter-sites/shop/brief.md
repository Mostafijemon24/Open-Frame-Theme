# Shop: design brief

A starter site for a small online store. Shown as the fictional shop "Sill & Shelf", which sells homeware and plants. **A design of the Pro tier: it needs Elementor Pro and WooCommerce.**

Made to the photography standard: the seventeen photographs were chosen first, and each of the eight products was then named, priced and described after its photograph.

## Character

Warm and uncluttered: a soft white page, sand and sage bands, a terracotta that is used for every button and nothing else, rounded pictures and pill buttons. The photographs are bright and still. It is the only design of the ten that sells something directly.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| Page | `#FBF8F3` | The page, cards on sage |
| Sand | `#F0E8DB` | Page headers, the journal band |
| Sage | `#DCE3D3` | The band about the makers |
| Ink | `#23201C` | Headings, the footer, the notice bar. On page: 15.3:1 |
| Text | `#5A534B` | Body copy. On page: 7.1:1; on sand: 6.2:1; on sage: 5.8:1 |
| Clay | `#9A4526` | Buttons, labels, links. On page: 6.1:1; on sand: 5.3:1; on sage: 4.9:1; white on it: 6.5:1 |
| On ink | `#CFC8BC` | Small text in the footer: 9.8:1 |

Type: **Outfit** (variable) for headings at weight 500, **Work Sans** (variable) for everything else. Both are open-licence fonts that come with the design and are served by the site itself.

In Elementor's Site Settings: Primary and Accent are clay, Secondary is ink, Text is body. Buttons are clay pills. The theme's "follow Elementor's colors and fonts" option carries the same colors and typefaces into WooCommerce's pages.

## Photographs

Seventeen photographs from Wikimedia Commons, all recorded there as CC0, listed with their sources in `CREDITS.md`. `photo-sources.json` says which is used where; `tools/sites/photos.mjs fetch shop` prepares them.

| Where | What the photograph shows |
| --- | --- |
| Eight products (square) | A terracotta mug, a succulent in a concrete pot, a white jug, an oak board, a leather notebook, willow baskets, a black floor lamp, a white shell chair |
| Home, hero | A bright white room with a wire chair: the words sit on a card inside the picture |
| Lookbook (tall) | A shelf with a snake plant, a breakfast table, an armchair by a window, two small trees on a sill |
| About | Hands shaping a pot on a wheel |
| Journal | Potted herbs, a table laid for six, a loaf on a board |

Where a product photograph shows something that is not sold (a coaster, tulips, a bowl of blueberries), the description says so.

## The store

| Part | How it is built |
| --- | --- |
| Products | Eight simple WooCommerce products with prices, pictures and categories, created by the importer; four are marked "featured" |
| Home page | Elementor Pro's Products widget shows the featured four |
| Shop, product, basket, checkout, account | WooCommerce's own pages, styled by the theme with the design's colors and typefaces. They are not Elementor templates |
| Header | A Theme Builder template with Pro's Nav Menu and Menu Cart widgets |
| Footer, journal, an article, "page not found" | Theme Builder templates |
| Contact | The Form widget, which sends an email to the site administrator |

## Pages

Home, Lookbook, About, Shipping and Returns, Journal with three articles, Contact, "page not found", and WooCommerce's Shop, Product, Cart, Checkout and My Account.

## What is not in it

- No payment method, shipping rate or tax rule is set up: those are the shop owner's decisions, made in WooCommerce. Until then nothing can be ordered.
- Simple products only: no sizes or colours to choose, no stock counts.
- The shipping and returns page is sample text and says so.
- On a device without an emoji font, WordPress fetches the magnifier of WooCommerce's product gallery from s.w.org. That is how WordPress and WooCommerce work; the design itself loads nothing from another site.
