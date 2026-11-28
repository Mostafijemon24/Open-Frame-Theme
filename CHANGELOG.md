# Changelog

What changed in each version of the Open Frame theme, of the Open Frame Starter Sites plugin, and of the starter sites. The newest version comes first in each part.

This file is put together by `node bin/build-docs.js` from the `== Changelog ==` sections of the two `readme.txt` files, which are what WordPress reads, and from the version of each starter site. Do not edit it by hand.

How version numbers are chosen, and what each kind of update means for a site, is in the [support and update policy](docs/SUPPORT.md#versions).

## Open Frame (theme)

### 1.2.0

- New: the theme can recommend its optional companion plugin, Open Frame Starter Sites, which adds complete websites made with Elementor. One notice on the Dashboard, Themes and Plugins screens offers the step that fits the site: install the plugin, activate it, or open it. The notice can be dismissed, for good, by each user.
- New: Appearance > Recommended Plugins, a screen provided by the bundled TGM Plugin Activation library, lists the plugin while it is not installed or not active.
- The plugin is recommended, never required. It is installed from the WordPress.org Plugin Directory by WordPress's own installer, and only when you click; it is not activated until you click again. No plugin file is bundled with the theme, and the theme does not redirect you after activation.
- The recommendation is switched on by naming the plugin's WordPress.org slug in functions.php. In this version the slug is still a placeholder, because the plugin is waiting for its review at WordPress.org: no notice and no installer screen are shown, and the installer library is not loaded.
- The theme still needs no plugin and makes no remote requests of its own.

### 1.1.0

- New: Elementor support. A page built with Elementor on the default template now spans the full width of the window instead of sitting inside the page card. Elementor's "Canvas" and "Full Width" templates are supported, and "Full Width" keeps the main landmark the skip link points to.
- New: Elementor Pro Theme Builder support. Header, footer, single, archive and 404 templates created in the Theme Builder replace the theme's templates.
- New: "Use Elementor global colors and fonts" option (Customize > Open Frame Options > Elementor). When on, the blog, posts, search and other theme templates follow Elementor's Site Settings. The section only appears while Elementor is active.
- New: WooCommerce support. The shop, product, cart, checkout and account pages use the theme's colors, buttons, cards and layout; product grids adapt from two columns on phones to the number of columns set in WooCommerce.
- New: "Show the title of the posts page" option (Customize > Open Frame Options > Layout), for a blog that is not the front page. Off by default; the title stays available to screen readers either way.
- New: the fonts that ship with the theme (Hanken Grotesk and JetBrains Mono) can be chosen in Elementor, and are served from your own site when they are.
- Fix: with a darker page background, the "Previous" and "Next" labels under a post no longer fall below the WCAG AA contrast ratio.
- New for developers: `open_frame_do_location` and `open_frame_has_location` filters let a plugin replace the header, footer, single, archive or 404 output; `open_frame_is_builder_page` marks a page as laid out by a page builder.
- Change: the header and footer markup moved to `template-parts/header/site-header.php` and `template-parts/footer/site-footer.php`, so child themes can override them. The output is unchanged.
- The theme still needs no plugin and makes no remote requests. Nothing changes on sites that do not use Elementor or WooCommerce.

### 1.0.1

- Change: the Author URI in the theme header now points to the author's GitHub profile (https://github.com/Mostafijemon24). No functional changes.

### 1.0.0

- New: Landing Page template, a blank canvas for block-built pages where default, wide and full-width blocks use the content width, the container width and the full window.
- New: six block patterns (Hero, Hero with illustration, Feature cards, Latest posts grid, Call to action, Landing page) and the Card (Group) and Eyebrow (Paragraph) block styles.
- New: Hanken Grotesk and JetBrains Mono are now bundled as local variable fonts and registered through theme.json. Previously the fonts were only referenced by name, so the "Hanken Grotesk" choice fell back to the system font.
- New: "Header text color", "Show site title and tagline" and "Footer heading and link color" Customizer options, so dark headers and light footers stay readable.
- New: the block editor color palette and content widths follow the Customizer settings.
- Fix: the "Default page layout" option showed "No sidebar" in the Customizer while pages actually rendered with a sidebar. Every setting now reads its default from one place.
- Fix: the "Content width" option had no effect. It now sets the width of the No sidebar layout, the Landing Page blocks and the block editor content size.
- Fix: "No sidebar" and "Full width" layouts rendered identically. No sidebar now centers the content at the content width; Full width uses the container.
- Fix: the "Transparent header on front page" option had no effect. It now removes the header background, floats the header over the first block on the Landing Page template, and turns solid on scroll when combined with the sticky header.
- Fix: the sticky header was hidden behind the admin toolbar for logged-in users.
- Fix: the body and heading font options did not update the Customizer preview until the page was reloaded.
- Fix: the "Heading weight" option only changed some heading levels. It now applies to all headings.
- Fix: a submenu opened with its arrow button could not be closed again while focus stayed inside the menu. Submenus now open on hover or from the button only, close on Escape (returning focus to the button), on outside click and when focus leaves.
- Fix: on small screens a long site title or tagline pushed the menu button onto a second row.
- Fix: full-width blocks overlapped the sidebar in sidebar layouts. They now stretch to the edges of the content card.
- Fix: embedded iframes lost their height because of a global `height: auto` rule.
- Fix: headings added with blocks were invisible in the dark footer and oversized in the sidebar.
- Fix: the footer left empty space when fewer widget areas were in use than the selected number of columns.
- Fix: the unused "Secondary Menu" location was removed. Assigning a menu to it displayed nothing.
- Fix: search results were unstyled. They now use the same cards as the blog.
- Fix: the "Featured" badge appeared on sticky posts in archives where they are not sticky.
- Fix: single posts of custom post types ended with an empty bordered footer.
- Fix: the parent stylesheet was not loaded when a child theme was active.
- Fix: editor styles were not applied reliably because the selectors were written for the editor wrapper. They are now plain selectors that WordPress scopes itself.
- Fix: a dropdown at the edge of the screen could run outside the viewport. It now opens toward the other side.
- Fix: the mobile menu stayed open after following a link to a section of the same page, and submenus could get stuck open on touch screens at desktop widths.
- Fix: "Wide width" blocks had no effect inside the content card. They now grow to the container width when there is no sidebar.
- Fix: the comment reply form opened below the whole thread instead of under the comment being answered.
- Fix: the excerpt length option overrode the Latest Posts block's own excerpt length.
- Fix: a menu location with an empty menu displayed a menu button with nothing to open.
- Fix: the generic button style no longer overrides buttons that belong to WordPress blocks or plugins.
- Change: Customizer colors and numbers are printed only when they differ from the stylesheet defaults, and the base font size is output in rem so the visitor's browser setting is respected.
- Change: hover tints and the focus ring are derived from the chosen primary color.
- Change: the default body text color is #334155, matching the editor palette. Headings keep #0f172a.
- Change: the mega menu panel spans the header container, and the menu remains usable without JavaScript.
- Change: page templates moved from `templates/` to `page-templates/`.
- Accessibility: the skip link targets the main content, submenu buttons name their parent item ("Submenu for Services"), the menu button is at least 44 px, and comment moderation text meets AA contrast.
- i18n: regenerated languages/open-frame.pot (168 strings).
- Tested with WordPress 6.4 and 7.1, PHP 8.3; PHPCompatibilityWP reports no issues for PHP 7.4+.

### 0.6.0

- Fix: on mobile and tablet the menu toggle follows the saved Customizer header layout instead of always sitting on the left.
- Change: the expanded mobile menu opens as a full-width panel anchored below the header bar.

### 0.5.0

- Fix: floated images and trailing thumbnails no longer stick out below the content card.
- Fix: paginated-content links clear trailing floats and are styled as pagination.

### 0.4.0

- New: native multi-column mega menu, enabled per item with the `of-mega` CSS class.
- Fix: uneven vertical alignment of parent menu items; long mobile menus wrapping into a second column.

### 0.3.0

- Fix: the generic button style overrode navigation controls; nested submenus now expand inline.

### 0.2.0

- Fix: full-width blocks bleed edge to edge without horizontal overflow; added the translation template.

### 0.1.0

- Initial foundation: design system, Customizer, header and footer builders, navigation, core templates, theme.json.

## Open Frame Starter Sites (plugin)

### 1.0.1

- New: when Elementor is not active, the Starter Sites screen says so above the designs and explains where to install it.
- Security: the check that refuses script in a design also recognizes it when it is written with character references, without a space before an event handler, inside a dynamic tag or as a form or inline SVG, and it is repeated on each page just before the page is stored.
- Security: updating a plugin a design needs, which ends with that plugin active, now also asks for the right to activate plugins.
- Privacy: preview pictures are requested without a referrer, so the library does not learn the address of your site from your browser either.
- Changed: the post type of the Site Parts is now named `ofss_site_part`. Site parts made by version 1.0.0 are renamed once, automatically, and stay out of the XML sitemap.
- Fixed: rolling back an import after switching to a child theme restored the theme settings to the wrong theme.
- Fixed: on PHP 7.4.0 to 7.4.2 a design's package could not be opened.
- The description of the library service now names its terms of use and privacy policy.

### 1.0.0

- The first public release. The versions below were development versions and were not published.
- New: the library of designs is online, with ten designs, and the plugin carries the key its list of designs is signed with. A list signed with any other key is refused.
- Changed: an import reports back every few seconds, so the progress bar moves on a fast server too instead of waiting at 0% and jumping to the end.
- Fixed: the confirmation before an import named a number of pages that counted a design's post layout and "not found" page as pages.

### 0.6.1

- Fixed: on the designs for free Elementor, the styles of the header and the footer were loaded at the end of the page. The header appeared unstyled for a moment and the page jumped. They are now loaded in the head.
- Security: the plugin checks the pages of a design again before storing them, and refuses raw HTML and shortcode widgets, script, embedded frames, style blocks and hand-written CSS or attributes, even in a package that is correctly signed.
- Security: a list of designs that is older than the one the site already has is not accepted, even with a valid signature.
- Security: values of a design's Site Settings are reduced to what a color, a font name or a size can contain.
- Fixed: when a plugin a design needs cannot be installed because its current version needs a newer WordPress or PHP, the screen says so instead of "The package could not be installed".
- Changed: the smaller sizes of a design's pictures are saved at the quality of the picture itself, which makes pages lighter.
- Changed: removing the plugin also removes what an unfinished import left in the uploads folder.
- Changed: the designs need Elementor 4.0.3 or newer. Elementor 4.0.0 to 4.0.2 with Elementor Pro load a font from Google on every page.

### 0.6.0

- New: Shop, the tenth complete design: a small WooCommerce store with eight products, a lookbook, shipping and returns, a journal and a contact form. It needs Elementor Pro and WooCommerce.
- New: Magazine, the ninth complete design and the fourth for Elementor Pro: a front page that follows the newest stories of each section, a ruled masthead, a calm article layout, writers, and subscription and contact forms.
- New: a design can bring products for a WooCommerce store, with prices, pictures and categories, and link to the shop, cart, checkout and account pages. A rollback removes the products and their categories.
- Fixed: a link in an article or a product to something the import creates later is now filled in.
- New: a page of a design can list the posts of one of the design's categories, and link to a category.
- New: designs are illustrated with photographs; the source and licence of each one come with the design.

### 0.5.0

- New: Agency, the sixth complete design and the first for Elementor Pro: case studies, services, careers, a journal and a contact form, with header, footer and blog as Theme Builder templates.
- New: SaaS, the seventh complete design and the second for Elementor Pro: features, pricing tables, integrations, customer stories, a demo form, legal pages and a blog.
- New: Real Estate, the eighth complete design and the third for Elementor Pro: homes for sale, a property page with a viewing form, agents, services and market notes. It is the first design illustrated with photographs; the source and licence of each one come with the design.
- New: a page of a design can show one of the design's menus (needed by Elementor Pro's Nav Menu widget).
- New: designs for Elementor Pro can bring Theme Builder templates (header, footer, single post, archive, search results, "page not found"), each with the place it is used. A rollback removes them and their display conditions.

### 0.4.0

- New: Portfolio, the second complete design: a personal site with large serif type, a staggered grid of work, a case study, services, a resume and notes. Built with the free version of Elementor.
- New: Restaurant, the third complete design and the first dark one: a full menu with prices, reservations by telephone and email, private events, a gallery and a journal. Built with the free version of Elementor.
- New: Education, the fourth complete design: courses, a course page with syllabus and fee, instructors, admissions and fees, events and news, in bright panels and sticker-like cards. Built with the free version of Elementor.
- New: Medical, the fifth complete design: departments, doctors with profiles, how to book, patient information and health notes, in a calm layout of white cards on pale green. Built with the free version of Elementor. All five free designs are now complete.
- New: a design can bring its own fonts. The font files are stored in your uploads folder, served by your own site and offered in Elementor's font list under "Starter site fonts". No font service is contacted. Rolling back an import removes them; deleting the plugin removes them too.

### 0.3.0

- New: Business, the first complete design. Ten pages, three articles, a header, a footer and a "page not found" page, built with the free version of Elementor.
- New: designs can include blog posts with their categories and featured images. Rolling back removes them again.
- New: a "Navigation Menu (Open Frame)" widget for Elementor, so a header made with free Elementor shows your WordPress menu, including the mobile menu of the theme.
- Fix: links to the home page of a design point at your site address instead of at /home/.

### 0.2.0

- New: one-click import of an available design, in small steps that survive slow servers and a closed browser.
- New: "Roll back this import" removes what an import added and restores the settings it changed.
- New: Site Parts. A design's header, footer and "page not found" page are edited with Elementor, including its free version.
- New: the list of designs is only used when it carries a valid signature of the library, and every download is checked against its checksum.

### 0.1.0

- First version: the Starter Sites screen with search and filters, design details, requirement checks, and installation of required plugins from WordPress.org.

## Starter sites

A published version of a design is never changed afterwards; a correction gets a new version number.

| Design | Version | Needs |
| --- | --- | --- |
| Business | 1.0.0 | Elementor 4.0.3 |
| Creative Agency | 1.0.0 | Elementor 4.0.3, Elementor Pro 4.0 |
| SaaS | 1.0.0 | Elementor 4.0.3, Elementor Pro 4.0 |
| Portfolio | 1.0.0 | Elementor 4.0.3 |
| Shop | 1.0.0 | Elementor 4.0.3, Elementor Pro 4.0, WooCommerce 10.0 |
| Restaurant | 1.0.0 | Elementor 4.0.3 |
| Real Estate | 1.0.0 | Elementor 4.0.3, Elementor Pro 4.0 |
| Education | 1.0.0 | Elementor 4.0.3 |
| Medical | 1.0.0 | Elementor 4.0.3 |
| Magazine | 1.0.0 | Elementor 4.0.3, Elementor Pro 4.0 |

Version 1.0.0 is the first version of each design.
