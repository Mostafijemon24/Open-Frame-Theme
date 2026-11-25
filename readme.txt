=== Open Frame ===

Contributors: mostafijemon
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Tags: blog, portfolio, news, one-column, two-columns, left-sidebar, right-sidebar, grid-layout, custom-background, custom-colors, custom-logo, custom-menu, editor-style, featured-images, footer-widgets, full-width-template, theme-options, threaded-comments, translation-ready, rtl-language-support, sticky-post, block-patterns, block-styles, wide-blocks

A lightweight, accessibility-minded multipurpose theme with a token-driven design system, header and footer builders, and a Landing Page template.

== Description ==

Open Frame is a lightweight, accessibility-minded multipurpose theme for business sites, blogs and portfolios. A token-driven design system keeps colors, typography and spacing consistent, and everything is controlled from the Customizer.

The theme is fully functional on its own: it needs no plugin, bundles its fonts locally and makes no remote requests.

= Features =

* Token-driven design system (color, typography, spacing, radius, elevation) built on CSS custom properties.
* Customizer options for global colors, fonts, font size, line height, heading weight, container and content widths, and section spacing. Every option has a visible effect and most preview instantly.
* Header builder: five layouts, background and text colors, sticky and transparent modes, optional search form, and an option to hide the site title when the logo contains it.
* Footer builder: one to four responsive widget columns (empty columns are skipped), footer colors and custom copyright text.
* Accessible, keyboard-friendly navigation with dropdowns, a mobile menu and an optional multi-column mega menu (add the CSS class `of-mega` to a top-level menu item).
* Right sidebar, left sidebar, no sidebar and full-width layouts, set separately for the blog, single posts and pages.
* Blog listing as a list or a grid with two to four columns.
* Page templates: Full Width, and Landing Page (a blank canvas with no title, card or sidebar).
* Six block patterns (two heroes, feature cards, latest posts, call to action, complete landing page) and five block styles.
* Block editor support through theme.json: shared color palette that follows the Customizer colors, font sizes, spacing scale and editor styles.
* Translation-ready, RTL-friendly through logical CSS properties, reduced-motion aware, and usable without JavaScript.
* Child-theme friendly.

== Installation ==

1. In your WordPress dashboard go to Appearance > Themes > Add Theme.
2. Search for "Open Frame" and click Install, or choose Upload Theme and select the theme ZIP file.
3. Click Activate.
4. Go to Appearance > Customize > Open Frame Options to choose colors, fonts, the header layout and the footer columns.
5. Go to Appearance > Menus to create a menu and assign it to the Primary Menu location.

== Frequently Asked Questions ==

= Does Open Frame require a plugin? =

No. Every feature is part of the theme.

= Does Open Frame make remote requests? =

No. The fonts are bundled with the theme and served from your own site. The theme contains no tracking and calls no external service.

= How do I build a home page? =

Create a page, choose the "Landing Page" template in the page settings, then open the block inserter, switch to Patterns, choose the "Open Frame" category and insert the "Landing page" pattern. Set the page as your homepage under Settings > Reading.

= How do I create a mega menu? =

In Appearance > Menus, open "Screen Options" (top right) and enable "CSS Classes". Add the class `of-mega` to a top-level menu item that has sub-items. Its direct sub-items become column headings, and the items nested below them are listed as links in each column. Items without the class keep the standard dropdown. On small screens the mega menu becomes a collapsible list.

= Why is there no sidebar on my pages? =

Pages use the "No sidebar" layout by default. Change it under Customize > Open Frame Options > Layout > Default page layout. A sidebar is only shown when its widget area contains widgets.

= The transparent header option does not seem to do anything. =

It applies to the front page only. To make the header float over the content, the front page must use the Landing Page template.

= Where is the documentation? =

The full documentation, with screenshots, is available at https://github.com/Mostafijemon24/Open-Frame-Theme/tree/main/docs

== Changelog ==

= 1.0.0 =
* New: Landing Page template, a blank canvas for block-built pages where default, wide and full-width blocks use the content width, the container width and the full window.
* New: six block patterns (Hero, Hero with illustration, Feature cards, Latest posts grid, Call to action, Landing page) and the Card (Group) and Eyebrow (Paragraph) block styles.
* New: Hanken Grotesk and JetBrains Mono are now bundled as local variable fonts and registered through theme.json. Previously the fonts were only referenced by name, so the "Hanken Grotesk" choice fell back to the system font.
* New: "Header text color", "Show site title and tagline" and "Footer heading and link color" Customizer options, so dark headers and light footers stay readable.
* New: the block editor color palette follows the Customizer Global Colors.
* Fix: the "Default page layout" option showed "No sidebar" in the Customizer while pages actually rendered with a sidebar. Every setting now reads its default from one place.
* Fix: the "Content width" option had no effect. It now sets the width of the No sidebar layout, the Landing Page blocks and the block editor content size.
* Fix: "No sidebar" and "Full width" layouts rendered identically. No sidebar now centers the content at the content width; Full width uses the container.
* Fix: the "Transparent header on front page" option had no effect. It now removes the header background, floats the header over the first block on the Landing Page template, and turns solid on scroll when combined with the sticky header.
* Fix: the sticky header was hidden behind the admin toolbar for logged-in users.
* Fix: the body and heading font options did not update the Customizer preview until the page was reloaded.
* Fix: the "Heading weight" option only changed some heading levels. It now applies to all headings.
* Fix: a submenu opened with its arrow button could not be closed again while focus stayed inside the menu. Submenus now open on hover or from the button only, close on Escape (returning focus to the button), on outside click and when focus leaves.
* Fix: on small screens a long site title or tagline pushed the menu button onto a second row.
* Fix: full-width blocks overlapped the sidebar in sidebar layouts. They now stretch to the edges of the content card.
* Fix: embedded iframes lost their height because of a global `height: auto` rule.
* Fix: headings added with blocks were invisible in the dark footer and oversized in the sidebar.
* Fix: the footer left empty space when fewer widget areas were in use than the selected number of columns.
* Fix: the unused "Secondary Menu" location was removed. Assigning a menu to it displayed nothing.
* Fix: search results were unstyled. They now use the same cards as the blog.
* Fix: the "Featured" badge appeared on sticky posts in archives where they are not sticky.
* Fix: single posts of custom post types ended with an empty bordered footer.
* Fix: the parent stylesheet was not loaded when a child theme was active.
* Fix: editor styles were not applied reliably because the selectors were written for the editor wrapper. They are now plain selectors that WordPress scopes itself.
* Change: Customizer colors and numbers are printed only when they differ from the stylesheet defaults, and the base font size is output in rem so the visitor's browser setting is respected.
* Change: hover tints and the focus ring are derived from the chosen primary color.
* Change: the default body text color is #334155, matching the editor palette. Headings keep #0f172a.
* Change: the mega menu panel spans the header container, and the menu remains usable without JavaScript.
* Change: page templates moved from `templates/` to `page-templates/`.
* Accessibility: the skip link targets the main content, submenu buttons name their parent item ("Submenu for Services"), the menu button is at least 44 px, and comment moderation text meets AA contrast.
* i18n: regenerated languages/open-frame.pot (167 strings).
* Tested with WordPress 6.4 and 7.1, PHP 8.3; PHPCompatibilityWP reports no issues for PHP 7.4+.

= 0.6.0 =
* Fix: on mobile and tablet the menu toggle follows the saved Customizer header layout instead of always sitting on the left.
* Change: the expanded mobile menu opens as a full-width panel anchored below the header bar.

= 0.5.0 =
* Fix: floated images and trailing thumbnails no longer stick out below the content card.
* Fix: paginated-content links clear trailing floats and are styled as pagination.

= 0.4.0 =
* New: native multi-column mega menu, enabled per item with the `of-mega` CSS class.
* Fix: uneven vertical alignment of parent menu items; long mobile menus wrapping into a second column.

= 0.3.0 =
* Fix: the generic button style overrode navigation controls; nested submenus now expand inline.

= 0.2.0 =
* Fix: full-width blocks bleed edge to edge without horizontal overflow; added the translation template.

= 0.1.0 =
* Initial foundation: design system, Customizer, header and footer builders, navigation, core templates, theme.json.

== Copyright ==

Open Frame WordPress Theme, (C) 2026 Mostafij Emon
Open Frame is distributed under the terms of the GNU GPL.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

Open Frame bundles the following third-party resources:

Hanken Grotesk (variable font)
Copyright 2021 The Hanken Grotesk Project Authors (https://github.com/marcologous/hanken-grotesk)
License: SIL Open Font License, Version 1.1 — https://openfontlicense.org/open-font-license-official-text/
Source: https://fonts.google.com/specimen/Hanken+Grotesk
Files: assets/fonts/hanken-grotesk-*.woff2 (license text in assets/fonts/hanken-grotesk-OFL.txt)

JetBrains Mono (variable font)
Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono)
License: SIL Open Font License, Version 1.1 — https://openfontlicense.org/open-font-license-official-text/
Source: https://fonts.google.com/specimen/JetBrains+Mono
Files: assets/fonts/jetbrains-mono-*.woff2 (license text in assets/fonts/jetbrains-mono-OFL.txt)

Images

The hero illustration (assets/images/hero-illustration.svg) and everything shown in screenshot.png are original works created by the theme author for Open Frame and are released under the GNU General Public License v2 or later. No third-party images are included.
