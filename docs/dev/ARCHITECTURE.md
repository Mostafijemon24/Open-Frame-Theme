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
page-templates/               full-width.php, landing.php
template-parts/               content, -single, -page, -search, -none
patterns/                     Auto-registered block patterns
theme.json                    Palette, fonts (fontFace), sizes, spacing, layout, element styles
assets/css/editor.css         Editor styles (plain selectors; WordPress scopes them)
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
