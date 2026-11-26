# Project Status — Open Frame Starter Sites

Last updated: 2026-11-26

Architecture: [docs/dev/STARTER-SITES-ARCHITECTURE.md](docs/dev/STARTER-SITES-ARCHITECTURE.md) · Test reports: [docs/dev/TESTING.md](docs/dev/TESTING.md)

## Current state

**Three of the ten designs exist.** Business ("Halden Advisory"), Portfolio ("Juno Vale") and Restaurant ("Ember & Rye") are each imported, checked at nine screen widths, opened in the Elementor editor and rolled back by the automated tests. All three need only the free version of Elementor, and they share no layout, typeface or color: one is white and blue, one is paper and serif, one is dark and centered. What is still missing before a user can do the same: the library is not deployed (blocked on a Cloudflare token), and seven designs are still to be made.

| Phase | Status |
| --- | --- |
| 1. Inspect the repository | Done |
| 2. Architecture and roadmap | Done, approved 2026-11-26 |
| 3. Core theme and design system | Done (theme 1.1.0) |
| 4. Starter Sites dashboard | Done |
| 5. Cloud API and package delivery | Built and tested locally. **Deployment blocked** (see "Needed from the owner") |
| 6. Import engine | **Core done and tested.** Some planned parts are not built yet, listed below |
| 7a. Business starter site | **Done** (plugin 0.3.0, design version 1.0.0) |
| 7b. Nine further starter sites | **In progress: 2 of 9 done** (Portfolio and Restaurant, plugin 0.4.0). Next: Education, Medical, then the five Pro-tier designs |
| 8. Package, validate, publish | Not started |
| 9. QA | Not started |
| 10. Documentation and release | Not started |

## Decisions (owner, 2026-11-26)

1. **Distribution: free.** Theme for WordPress.org, free companion plugin, free library. The licence gate stays in the design but is switched off.
2. **Elementor: two tiers.** Five starter sites work with Elementor free (Business, Portfolio, Restaurant, Education, Medical) and five require Elementor Pro (Agency, SaaS, E-commerce, Real Estate, Magazine).
3. **Images: implementer's choice.** Original generated images by default, CC0 photographs where better, every file's licence recorded. Confirmed per site at the start of Phase 7.
4. **Library address:** `api.buildbetters.com` (catalog, manifests) and `cdn.buildbetters.com` (packages, media, previews), on the owner's Cloudflare account.
5. Open: the free forms plugin for the five free-tier sites. Business ships without a form (see "Known issues").

## Completed

### Phase 3: theme 1.1.0

- Replaceable locations (`header`, `footer`, `single`, `archive`, `404`) through the `open_frame_do_location` and `open_frame_has_location` filters.
- Elementor: Theme Builder locations, full-width layout for pages built with Elementor, `main` landmark in the Full Width template, "Hide Title" support, optional "Use Elementor global colors and fonts" setting.
- WooCommerce: theme support, layout, and a stylesheet for shop, product, cart, checkout and account pages.
- **Verified with Elementor Pro 4.0.4** (supplied by the owner): header, footer, single post, archive and 404 templates from the Theme Builder replace the theme templates. The theme now uses Elementor Pro's public `elementor_location_exits()` function for its check.

### Phase 4: plugin 0.1.0 (`companion/open-frame-starter-sites`)

- **Starter Sites screen** under Appearance: grid of designs with previews, search, category filter and Free/Pro filter, details dialog, "Check for new designs".
- **Design details:** summary, pages, where each part is edited (Elementor or Customizer), and a requirement list for WordPress, PHP, the theme, the server and plugins.
- **Requirements that resolve themselves:** required plugins from WordPress.org are installed and activated with one button; installed plugins are activated; Elementor Pro is detected and linked to, never installed.
- **Catalog client:** HTTPS only, the library's own hosts only, every field validated and rebuilt, saved copy for 12 hours, ETag revalidation, three attempts on temporary failures, last good list shown when the library is down.
- **REST API** (`open-frame-starter-sites/v1`): `GET /sites`, `GET /sites/{id}`, `POST /requirements`, `GET /history`, all limited to administrators.
- **History and versions:** store, route and screen section for past imports, and "Imported" / "Update available" badges. They have no writer until the importer exists, so the screen shows them only when there is data.
- **Mock library** (`tests/fixtures/cloud`): the ten planned sites as catalog data with placeholder previews, and a server that can be told to fail in nine ways.
- **Catalog schema:** `schemas/catalog.schema.json`.
- Tooling: plugin coding-standard config, `bin/build-plugin-zip.sh`, Plugin Check runner, PHP checks, browser checks, CI steps, translation template, readme with the external-service disclosure.

### Phase 5: the library (not yet deployed)

- **Sources:** `starter-sites/` holds the ten planned sites (catalog data and placeholder previews). It is the single source; the mock library used by the tests is built from it.
- **Tools** (`tools/library.mjs`): `keygen`, `public`, `build`, `verify`, `publish`. Deterministic package ZIPs, SHA-256 for every file, an Ed25519-signed catalog, and rules that stop a bad package or catalog entry from being built.
- **Schemas:** catalog, signed envelope and manifest.
- **Worker** (`cloud/worker`): read-only API over an R2 bucket for both host names, with caching headers, ETags and readable errors.
- **Plugin:** the catalog is used only with a valid signature from a known key; a manifest only when it is the exact file the signed catalog names. `Config::PUBLIC_KEYS` is empty until the production key exists, so the plugin accepts nothing from the real library yet.
- **Workflows:** a CI job for the tools and the Worker; a manual "Publish library" workflow (not yet run).
- **Manual:** [docs/dev/LIBRARY.md](docs/dev/LIBRARY.md).

### Phase 6: the import engine (plugin 0.2.0)

- **Import in small steps** (`src/Import/Runner.php`): check the site, save current settings, download and verify the package, import images one at a time, create pages, create and activate the design's Site Settings, give each page its Elementor content, create the menu, apply theme settings and the home page, finish. Each request does what fits in a time budget and saves its position, so a slow server or a closed browser leaves a run that can be continued.
- **Verified downloads** (`Package.php`): library hosts only, size and SHA-256 checked for the package, every file inside it and every image; the ZIP is read in memory and never extracted.
- **References** (`TokenResolver.php`): `ofss://media/…` and `ofss://page/…` become the imported attachment and page.
- **Rollback** (`Rollback.php`): removes what the run created (tagged with its ID) and restores the settings it changed. Also works on an unfinished run.
- **Site Parts** (`SiteParts.php`): header, footer and 404 as Elementor documents rendered through the theme's location filters; Elementor Pro's Theme Builder has priority.
- **Elementor adapter** (`Elementor/Adapter.php`): the only file that calls Elementor.
- **Screen:** "Import this design" with a confirmation of what will change, a progress bar with named steps, a report with links, "Roll back this import" with a second confirmation, and a banner for an import that did not finish.
- **REST:** `POST /imports`, `POST /imports/{id}/advance`, `POST /imports/{id}/rollback`, `GET /imports/current`.

**Planned for Phase 6 and still not built:**

- Site logo, post grid and search widgets (the menu widget was built in Phase 7a, fonts of a design in Phase 7b).
- Sidebar widgets and WooCommerce products in a package; Theme Builder templates for the Pro-tier designs.
- A WP-CLI command, and a "replace the previous starter site" mode.
- Continuing past a single image that cannot be downloaded (today the import stops and can be retried or rolled back).

Each is built with the first design that needs it, rather than against invented content.

### Phase 7a: the Business design (plugin 0.3.0)

- **The design** (`starter-sites/business`, brief in `brief.md`): the fictional advisory firm "Halden". Home, About, Services, a service page, Projects, a case study, Team, Pricing, Contact, the blog page "Insights" with three articles, plus header, footer and a "page not found" page. One typeface (Hanken Grotesk, served by the theme), one brand color, fluid heading sizes, numbered service cards, white and tinted bands.
- **Free Elementor only:** containers, grid and seven classic widgets (heading, text editor, button, image, icon list, counter, divider) plus the plugin's menu widget. No custom CSS, so every part can be edited in the editor.
- **Global styles:** headings and plain buttons point at Elementor's global colors; the theme follows the same globals, so one change in Site Settings restyles pages and blog together.
- **Images:** fifteen original abstract pictures drawn by a script (`tools/sites/business-art.mjs`), CC0, about 540 KB in total, each under 100 KB. Four real preview pictures replace the "coming soon" placeholders.
- **Written as a generator** (`tools/sites/business.mjs` on the shared builders in `tools/sites/kit.mjs`), which writes the JSON that is packaged. The next designs reuse the builders, not the layout.
- **Importer additions the design needed:** blog posts with categories and featured images (removed again by a rollback); the "Navigation Menu (Open Frame)" Elementor widget, so a free-tier header shows the WordPress menu with the theme's mobile menu; links to a design's home page now point at the site address instead of `/home/`.
- **Theme additions (still 1.1.0, unreleased):** the theme's two typefaces are registered with Elementor, so choosing them causes no request to Google Fonts; theme parts (site title, menu, post titles, footer links) keep their look when Elementor's Site Settings style links and headings; a "Show the title of the posts page" option; a contrast fix for the "Previous / Next" labels under a post.
- **Found by the new tests and fixed:** the wordmark linked to `/home/` (a redirect); the Services page jumped from heading level 1 to 3; the "Previous / Next" labels under an article had a contrast of 4.4:1 on the design's background; the blog page had no visible title.

### Phase 7b, part 1: the Portfolio design (plugin 0.4.0)

- **The design** (`starter-sites/portfolio`, brief in `brief.md`): the fictional independent designer "Juno Vale". Home, About, Work, a case study, Services, a service page, Resume, Contact, the blog page "Notes" with three articles, plus header, footer and a "page not found" page.
- **Nothing in common with Business:** a paper-colored page instead of white, a serif display typeface (Fraunces, with italic emphasis) with Instrument Sans for text, rust and ink instead of blue, ruled rows instead of cards, a staggered two-column grid of work, pill buttons, arrow links, and a footer built around one very large line.
- **Fonts of a design** (`src/Fonts/Fonts.php`, new import step): a design can bring font files. They are downloaded from the library with the same size and checksum checks as images, checked to be WOFF2, stored in `uploads/open-frame-fonts`, declared with `@font-face` from the site's own address and listed in Elementor under "Starter site fonts". A rollback removes them; so does deleting the plugin. Portfolio brings three files, 112 KB together.
- **Images:** fifteen original pictures of invented projects (coffee bags, app screens, posters, book covers, bottles), a portrait and note covers, drawn by `tools/sites/portfolio-art.mjs`. CC0, about 760 KB.
- **Shared tooling for the next designs:** `writeSite()` and block helpers in `tools/sites/kit.mjs`, drawing helpers in `tools/sites/art.mjs`, and one browser test harness for every design (`tests/e2e/design-checks.js`); a design's own test file is now a description of the design.
- **Theme additions (still 1.1.0, unreleased), both found by looking at Portfolio's blog:** with "Use Elementor global colors and fonts" on, the theme's neutral greys (quotes, tables, form fields, small print) now take the tint of the design's text color instead of staying blue-grey; headings written in the block editor keep the theme's reading sizes, so a subheading in an article is no longer larger than the article's title.
- **Tests no longer depend on which designs are finished:** the mock library and the PHP checks use a made-up design "Upcoming" where they need one that is not out yet.

### Phase 7b, part 2: the Restaurant design

- **The design** (`starter-sites/restaurant`, brief in `brief.md`): the fictional wood-fired kitchen "Ember & Rye". Home, Menu, Our Story, Reservations, Private Events, Gallery, Contact and Location, the blog page "Journal" with three articles, plus header, footer and a "page not found" page.
- **The first dark design.** A nearly black page with cream headings and one ember accent, Cormorant Garamond with Jost, centered compositions, pictures under a dark veil with text on top, a two-line centered header, and a full menu with prices set as name, dotted line, price.
- **Honest about what it cannot do:** no online booking, no form and no map. Reservations are by telephone and email, and the pages say so; a map would load from another company's servers on every visit.
- **Images:** sixteen original illustrations (a table from above, dishes, the room, the oven, the bar, portraits, patterns), drawn by `tools/sites/restaurant-art.mjs`. CC0, about 750 KB.
- **Theme (still 1.1.0, unreleased):** the tints the theme derives when it follows Elementor are now mixed into the surface color instead of white, so the blog, quotes, tables and form fields are right on a dark design too.
- **Found while building it, and fixed in Business as well:** blocks meant to be centered were only centering their text, because the setting that centers a block inside its section has a different name in Elementor (`_flex_align_self`). Business's quotation and "page not found" page are now truly centered.

## Verified (executed 2026-11-26)

- PHPCS: theme 42 files and plugin 26 files, 0 errors, 0 warnings.
- Theme Check on the packaged theme: 0 required, 0 warnings.
- Plugin Check 2.2.0 on the packaged plugin: no errors, no warnings.
- Plugin PHP checks: all pass (138 with Elementor Pro in the test site, 139 on a fresh site without it).
- Import engine checks: 80 of 80 pass, including a rollback that is compared field by field with the site before the import, interruptions at every one of the 18 points of an import, and the fonts of a design.
- Browser checks: 72 of 72 pass. 11 each for the Business, Portfolio and Restaurant designs (import, every address at nine widths, menu, links, blog, 404, axe-core, typefaces, global styles, editor, rollback), 18 theme integrations including Elementor Pro, 21 Starter Sites screen including a real plugin installation from WordPress.org, forged catalogs, an import with editing and rollback, and axe-core accessibility scans.
- Library tools: 49 of 49 pass. Worker: 10 of 10 pass.
- Environment: WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2, Elementor Pro 4.0.4, WooCommerce 11.3.1.

## Not verified

- Elementor Pro with an activated licence (it was run without one), and building templates by hand in the Theme Builder screen.
- **Anything on Cloudflare.** The Worker, the R2 bucket, the two host names and the "Publish library" workflow have not run. Nothing is deployed at `api.buildbetters.com`. Whether `buildbetters.com` is a zone on the owner's Cloudflare account could not be checked either.
- Multisite, servers that need FTP details to install plugins, and updating an outdated plugin through the screen.
- PHP 7.4 at runtime (syntax is checked on 7.4 in CI), WordPress 6.4 with the new code, Safari, Firefox, real devices, screen readers.

## Known issues and limitations

- Three designs, Business, Portfolio and Restaurant, can be imported. The other seven are placeholders marked "Coming soon"; their previews say "Preview coming soon".
- **None of the designs has a form.** Contact pages give an email address, a telephone number and a button; Restaurant takes reservations by telephone and email and has no map. Free Elementor has no form widget, and no forms plugin has been chosen yet (decision 5).
- The texts, names, prices and figures of all designs are invented sample content; each footer says so.
- **The fonts of Portfolio and Restaurant are Latin subsets** (Western European languages). Text in other scripts falls back to the visitor's system font. The Fonts class has no `unicode-range` support yet, so a design cannot ship several subsets of one typeface.
- Portfolio has no social media links: there are no accounts to point at, and a placeholder link would lead nowhere.
- Text over pictures (Restaurant's two pictured bands) cannot be checked for contrast by axe-core; it was calculated by hand for the brightest part of each picture (6.4:1 at worst) and depends on the veil staying dark if the picture is replaced.
- All designs were looked at in Chromium only, at the nine widths, as screenshots and by automated checks. No real phone, Safari or Firefox.
- Only the most recent import can be rolled back. Importing a design again does not undo edits made to its pages in between; it replaces their content with the design's.
- Site parts apply to the whole site; per-page display conditions are not built.
- Theme 1.1.0 and plugin 0.4.0 are not tagged or released.
- The plugin's readme names Cloudflare's privacy policy for the library; the library needs its own short privacy statement before the plugin is submitted to WordPress.org.
- The user guide has no screenshots for the Elementor and WooCommerce chapters and no chapter for the plugin yet.
- With the global-styles option on, Elementor's base stylesheet also loads on theme templates (about 7 KB compressed).
- The plugin recommendation notice in the theme waits until the plugin is on WordPress.org.

## Needed from the owner

1. **A Cloudflare API token, to finish Phase 5.** A credential was entered in the secure form on 2026-11-26, but Cloudflare rejects it with "Invalid format for Authorization header": it is not an API token (an account password or the "Global API Key" give this result). What is needed: Cloudflare dashboard > My Profile > API Tokens > Create Token > the "Edit Cloudflare Workers" template, plus the permission Zone > DNS > Edit, for the account and the zone `buildbetters.com`. The token is entered in the secure form again, never in chat.
2. **Change the Cloudflare account password.** It was written in chat. It was not used and is not stored anywhere in this project.
3. **Keep the signing key.** When the library is first published a signing key is generated. The owner has to store it as a GitHub secret and keep an offline copy ([docs/dev/LIBRARY.md](docs/dev/LIBRARY.md) explains how).
4. **For Phases 7 and 9:** if any Pro-tier design needs a feature that Elementor only unlocks after licence activation, an activated licence on a test site, or the owner's own testing of those designs.

## Next steps

1. With a working Cloudflare token: create the buckets, generate the production signing key, put its public half into the plugin, deploy the Worker to staging and production, and publish the catalog.
2. Phase 7b continues: Education and Medical (free tier), each with its own brief, layout and typeface, then the five Pro-tier designs (Agency, SaaS, Shop, Real Estate, Magazine).
3. A decision on the forms plugin, so the contact pages can carry a form.
