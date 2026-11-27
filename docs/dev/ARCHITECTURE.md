# Open Frame — Architecture

Branding is centralized: text domain `open-frame`, function and hook prefix `open_frame_`, constants `OPEN_FRAME_*`, class prefix `Open_Frame_`, CSS custom properties `--of-*` and CSS class prefix `of-`.

## Classic theme with `theme.json` (hybrid)

The product is built around a **Customizer** with header and footer builders, so Open Frame is a **classic PHP-template theme**. It also ships `theme.json`, which gives the block editor the same palette, font families, font sizes, spacing scale and element styles as the frontend, and registers the bundled fonts (`fontFace`) so WordPress prints their `@font-face` rules on the frontend and in the editor.

## Single source of truth: design tokens

`style.css :root` defines every token as a CSS custom property. Components consume tokens instead of hard-coded values. The Customizer writes **overrides** at runtime:

- `inc/customizer/customizer.php` — `open_frame_defaults()` holds every default; `open_frame_get_mod()` is the only reader, so the Customizer controls, the dynamic CSS and the templates always agree.
- `inc/customizer/dynamic-css.php` — prints an inline `:root{…}` block attached to `open-frame-style`. Only values that differ from the stylesheet defaults are printed (header and footer colors are always printed so those controls stay truthful). Tints and the focus ring are derived from the primary color.
- `assets/js/customize-preview.js` — mirrors the same variables over `postMessage` for instant preview.
- `inc/blocks.php` — `wp_theme_json_data_theme` filter keeps the block palette in step with the Customizer colors.

## File map

```
functions.php                 Constants + include loader (open_frame_require)
inc/
  hooks.php                   Replaceable locations: open_frame_do_location(), open_frame_has_location()
  setup.php                   Theme supports, menus, widget areas, image sizes, $content_width
  enqueue.php                 Parent/child styles, navigation script, no-js → js flag
  template-tags.php           Pluggable output helpers (meta, footer, thumbnail, comment)
  template-functions.php      Layout resolution, body classes, pingback, excerpts, grid classes
  class-open-frame-walker-nav-menu.php   Adds a labelled toggle button to parent menu items
  customizer/
    sanitize.php              Sanitizers and color helpers
    customizer.php            Defaults, font choices, panel/sections/controls, preview script
    dynamic-css.php           Theme mods → inline CSS variables
  header-builder.php          Header section, header classes, branding/nav/search output
  footer-builder.php          Footer section, widget columns, copyright bar
  blocks.php                  Block styles, pattern category, palette sync
  integrations/
    elementor.php             Theme Builder locations, builder-page layout, global-styles bridge
    woocommerce.php           Theme support, layout wrappers, store stylesheet
page-templates/               full-width.php, landing.php
template-parts/               content, -single, -page, -search, -none, -builder
  header/site-header.php      Header markup (was in header.php)
  footer/site-footer.php      Footer markup (was in footer.php)
patterns/                     Auto-registered block patterns
theme.json                    Palette, fonts (fontFace), sizes, spacing, layout, element styles
assets/css/editor.css         Editor styles (plain selectors; WordPress scopes them)
assets/css/woocommerce.css    Store styles, enqueued only while WooCommerce is active
assets/js/navigation.js       Mobile menu, submenu toggles, Escape/outside/focus-out, sticky state
assets/fonts/                 Variable WOFF2 fonts + OFL license texts
```

## Layout resolution

`open_frame_get_layout()` returns the configured layout for the view (page, single post, blog/archive/search, 404) and passes it through the `open_frame_layout` filter. `open_frame_get_effective_layout()` then downgrades a sidebar layout to `no-sidebar` when the relevant widget area is empty. Body classes and the wrapper classes use the effective layout, so CSS never has to guess.

- `no-sidebar` → `.of-primary` is centered at `--of-content-width`.
- `full-width` → `.of-primary` fills the container.
- Landing Page template → no container at all; `.of-canvas .entry-content > *` sizes each block (content width, container width for `alignwide`, edge to edge for `alignfull`).

## Header

`open_frame_header_classes()` builds the header classes. Layout variants are pure CSS on `.header-layout-*`. The transparent header on a Landing Page overlays the content by placing header and content in the same CSS grid cell, so no header height is hard-coded and `position: sticky` keeps working.

## Navigation

Markup comes from `wp_nav_menu()` plus the walker's toggle buttons. Dropdowns open on hover (desktop) or from the toggle button (`.submenu-open`), never from `:focus-within` when JavaScript is available, so `aria-expanded` always matches what is visible. `html.no-js` rules provide a fully expanded fallback.

## Fallbacks (usable with zero configuration)

- No menu assigned → administrators see an "Add a menu" link; visitors see no empty navigation.
- No widgets → sidebars and footer columns are skipped, content is centered.
- No copyright text → `© {year} {site name}. All rights reserved.`
- No logo → site title and tagline.
- Missing or invalid options → defaults from `open_frame_defaults()`; numbers are clamped, unknown choices are replaced.

## Replaceable locations

`inc/hooks.php` defines five locations: `header`, `footer`, `single`, `archive` and `404`. Every template asks before it prints:

```php
if ( ! open_frame_do_location( 'header' ) ) {
	get_template_part( 'template-parts/header/site-header' );
}
```

- `open_frame_do_location( $location )` runs the `open_frame_do_location` filter. A callback prints its markup and returns true. For the three content locations the output is buffered and wrapped in `<main id="main">`, so the skip link always has a target and there is exactly one `main` landmark.
- `open_frame_has_location( $location )` runs the `open_frame_has_location` filter and prints nothing. It exists because body classes are computed before the header is rendered: the sticky and transparent header classes are dropped when the theme header will not be printed.

The theme has no knowledge of who answers. Elementor Pro is wired in by `inc/integrations/elementor.php`; any other plugin can use the same two filters.

## Elementor

Loaded always, active only when Elementor is. Nothing here changes the output of a site without Elementor.

| Concern | How it is handled |
| --- | --- |
| Theme Builder (Pro) | `elementor/theme/register_locations` registers all core locations. `open_frame_do_location` calls `elementor_theme_do_location()`; the theme's `404` location maps to Theme Builder's `single`. `open_frame_has_location` asks the Theme Builder conditions manager, behind `method_exists()` guards. |
| Canvas and Full Width templates | Provided by Elementor through `template_include`; the theme does not interfere. For Full Width the theme prints `<main id="main">` on Elementor's `header-footer/before_content` and `after_content` actions. |
| Default template | `open_frame_is_builder_page()` is true for a page on the default template, without a sidebar, that Elementor reports as built with Elementor (or that is open in the editor preview). `page.php` then uses `template-parts/content-builder.php`: no card, full width, title in the container. The title keeps the `h1.entry-title` selector, so Elementor's "Hide Title" works, and its spacing is on the heading itself so nothing remains when it is hidden. |
| Global styles bridge | Theme mod `open_frame_follow_elementor` (off by default). When on, the body gets `of-follow-elementor`, Elementor's kit stylesheet is enqueued on every view (Elementor itself only loads it on pages it built) and an inline rule redefines the theme tokens on `body` from Elementor's `--e-global-*` variables, each with the Customizer value as fallback. Hover and tint colors are derived with `color-mix()`. |
| Widgets | The theme's element styles are scoped so that they do not override Elementor widgets; the browser checks assert this for buttons, headings and links. |

Not covered by tests: behaviour with a real Elementor Pro licence. The Theme Builder path is tested against a test double that defines `elementor_theme_do_location()` (`tests/env/mu-plugin.php`).

## WooCommerce

`inc/integrations/woocommerce.php` declares `woocommerce` support (and the three gallery features), replaces WooCommerce's content wrappers with the theme's container, layout and `main` landmark, removes the WooCommerce sidebar, and filters `open_frame_layout` to `full-width` on every store view (the shop is an archive and would otherwise take the blog layout).

`assets/css/woocommerce.css` is enqueued on every view while WooCommerce is active, because products can be placed on any page. It keeps WooCommerce's own stylesheets and applies the design tokens on top: buttons, prices, badges, notices, tabs, pagination, account navigation, and a CSS grid for product lists in place of the float layout.
