# Open Frame — Test Reports

- [Starter Sites plugin 0.1.0](#open-frame-starter-sites-010--test-report): the companion plugin's dashboard
- [Version 1.1.0](#open-frame-110--test-report): Elementor, WooCommerce and replaceable locations
- [Version 1.0.1](#open-frame-101--test-report): the full theme

# Open Frame Starter Sites 0.1.0 — Test Report

The companion plugin (`companion/open-frame-starter-sites`) as of Phase 4: the Starter Sites screen, the catalog client, requirement checks and plugin installation. Importing is not part of this version. Everything listed was executed on 26 November 2026 against a mock of the library (`tests/fixtures/cloud`); the real library does not exist yet.

## Environment

WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2, Elementor Pro 4.0.4 (no licence activated), SQLite, headless Chromium. Plugin installation downloaded a real plugin from WordPress.org.

## Static analysis

| Check | Result |
| --- | --- |
| PHPCS, `WordPress` ruleset (file-name rule off, classes are loaded by namespace) and `PHPCompatibilityWP` 7.4+, 15 files | **0 errors, 0 warnings** |
| Plugin Check 2.2.0 (the checks WordPress.org applies) on the packaged ZIP | **No errors, no warnings** |
| Package | `dist/open-frame-starter-sites.zip`, 36 KB, no build step: the JavaScript in the package is the source |
| Translation template | 122 strings, PHP and JavaScript, generated with WP-CLI |

## PHP checks

`tests/php/starter-sites.php`, **all checks passed**: 99 on the site with Elementor Pro installed, 100 on a fresh site without it (a few checks depend on whether Elementor Pro is present). HTTP is replaced with canned answers.

| Area | What is asserted |
| --- | --- |
| Configuration | Default library is HTTPS; images and packages only from the library's own hosts; plain HTTP, other ports, `javascript:` and `file:` addresses refused |
| Catalog validation | The mock catalog passes; seven kinds of broken catalog are refused; a newer format asks for a plugin update; seventeen kinds of bad site entry are left out one by one (bad IDs, unknown tier or status, images on foreign hosts, plugin files outside their folder, unknown plugin sources, "available" without a proper manifest); duplicates dropped; markup removed from text; unknown fields do not survive |
| Download and caching | First request downloads; a fresh copy is reused without a request; refresh sends the ETag and honours "not modified"; temporary failures are tried three times and recover; "not found" is not retried; a failing library shows the saved copy as stale; without a saved copy it is an error written for a person; a bad answer is never saved; requests carry the plugin name and no site address |
| Requirement checks | Coming soon, update the plugin, incompatible (WordPress, PHP, theme), needs plugins, needs Elementor Pro, ready; optional plugins do not block; Elementor Pro is never offered for installation; a user without the capability gets no button |
| REST | Four routes registered; subscriber 403 and visitor 401 on every route; catalog and site details for an administrator; package addresses not exposed; unknown site 404; a plugin the site does not list cannot be installed; Elementor Pro cannot be installed; library down without a saved copy is a 503 with a message |
| History and imported state | Twenty newest runs kept, cleaned on output; "update available" and "imported" follow the recorded version |

## Browser checks

`tests/e2e/starter-sites.test.js`, 18 tests, **18 passed.**

| Area | What is asserted |
| --- | --- |
| List | Ten designs in order, every preview loads, five free and five Pro, all "Coming soon", no import button, no history section without history, no console errors |
| Responsive | No horizontal scrolling and the details dialog inside the window at 360, 390, 782, 1024, 1440 and 1920 px |
| Search and filters | Search in names, summaries, tags and categories, every word must match; category and Elementor-version filters combine; empty state with a way back; the number left is announced to screen readers |
| Keyboard | Enter opens the details, focus moves in and stays in, Escape closes, focus returns to the button; the preview image is a mouse shortcut and not a second tab stop |
| Details | Requirement rows with versions, pages, and where each part is edited (a free design says the blog is set in the Customizer, a Pro design says Elementor) |
| Elementor Pro | Never an install button. Not installed: a link to Elementor that opens safely in a new tab. Installed but inactive: "Activate" works and the row turns active |
| Plugin installation | A required plugin is downloaded from WordPress.org, installed and activated; the button shows progress and cannot be pressed twice; the result is announced; the administrator is not redirected away |
| Library problems | Down with nothing saved: an explanation and "Try again", which recovers. Down with a saved list: the list stays, marked as saved earlier. Not JSON, wrong shape, 404 and a newer format each give their own message |
| Hostile catalog | Entries with a foreign image host, a plugin file outside its folder or a missing manifest are not listed; a script in a name is removed and does not run |
| Versions | A design that is out but needs a newer plugin says so; "Update available" and "Imported" badges; the history table |
| Caching | Reloading the screen and opening details make no request to the library; "Check for new designs" makes exactly one |
| Other theme active | A notice with a link to Themes, and the theme requirement fails with instructions |
| Accessibility | axe-core (WCAG 2.1 A and AA, best practices) finds nothing on the list, in the details dialog and in the empty state |
| Footprint | No script or style of the plugin outside its own screen; menu entry and Plugins-list link present; with the plugin off, no menu entry and no REST route |
| PHP error log | Nothing from the plugin or the theme |

## Not covered

- The real library (Phase 5) and importing (Phase 6).
- Multisite, and servers that ask for FTP details to install plugins (the code handles both with a message; neither was run).
- Updating an outdated plugin through the screen (the status and button are checked, the update itself was not run).
- Screen readers, Safari and Firefox.

# Open Frame 1.1.0 — Test Report

Version 1.1.0 adds the Elementor and WooCommerce integrations and the replaceable locations. This report covers what was added and confirms the rest is unchanged. Everything listed was executed on 26 November 2026; anything not executed is listed under "Not covered".

## Environment

| Item | Value |
| --- | --- |
| WordPress | 7.1.5 |
| PHP | 8.3.6, `WP_DEBUG`, `WP_DEBUG_LOG` and `SCRIPT_DEBUG` on |
| Elementor | 4.4.2 (free) |
| WooCommerce | 11.3.1 |
| Database | SQLite (SQLite Database Integration 3.1.3) |
| Browser | Headless Chromium via Playwright |
| Widths | 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920 px |

## Static analysis

| Check | Result |
| --- | --- |
| PHPCS, `WordPress` ruleset and `PHPCompatibilityWP` (`testVersion 7.4-`), WPCS 3.4.1, 42 files | **0 errors, 0 warnings** |
| Theme Check plugin 20260901 (59 checks) on the packaged ZIP | **0 required, 0 warnings**, 1 recommended (`custom-header`, intentionally not used), 1 info |
| Package contents | 74 files, 404 KB; no tests, tooling or documentation |
| Translation template | 154 gettext strings in the code, all present in `languages/open-frame.pot` (3 new) |

## Unchanged behaviour

With Elementor and WooCommerce deactivated, nine views (blog index, page, post, sample page, search with and without results, 404, category archive, author archive) were rendered by 1.0.1 and by 1.1.0 and compared. The markup is **identical on all nine**; the only difference is indentation inside the header and footer, which moved to template parts.

The 1,995-check suite of the 1.0.1 report was not run again: its scripts are not in the repository.

## Automated browser tests

`tests/e2e/integrations.test.js`, 18 tests, **18 passed, 0 failed** (one of them needs Elementor Pro in the test site and is skipped without it).

| Area | What is asserted |
| --- | --- |
| Theme alone | Five views at two widths: status, no console errors, no horizontal overflow, theme header and footer, one `main` landmark, skip-link target, store stylesheet not loaded, no integration body classes. The Elementor section is hidden in the Customizer |
| Replaceable locations | A plugin replaces the header and footer: theme markup absent, order header → content → footer, sticky and transparent header classes dropped. A plugin replaces `single`, `archive` and `404` on five views: output inside `main#main`, one landmark, theme template skipped. `elementor_theme_do_location()` is honoured, 404 pages use the `single` location, and a location that was not offered falls back to the theme |
| Elementor, default template | At all nine widths: section starts at the window edge and spans it, no overflow, no console errors; no page card; title present; one `main` landmark |
| Elementor, Hide Title | Title hidden, first section directly under the header (no leftover spacing) |
| Elementor, Full Width and Canvas | At all nine widths: full-width sections, no overflow; Full Width keeps header, footer and the skip-link target; Canvas has neither header nor footer and starts at the top |
| Elementor widgets | Button background, button text color, heading color and link decoration are Elementor's, not the theme's |
| Elementor, pages left alone | A page with a sidebar layout keeps the sidebar; a page not built with Elementor keeps its card |
| Elementor editor | The editor opens the default, Full Width and Canvas pages: preview loads, content is inside the editable area, sections are full width in the preview, no editor error dialog, no script errors |
| Elementor Pro Theme Builder | Run against Elementor Pro 4.0.4. Header, footer, single post, archive and 404 templates with display conditions replace the theme templates; the content sits inside `main#main`; one landmark; the sticky-header class is dropped; a page without a matching template keeps the theme template; Canvas has no header or footer; removing the templates restores the theme |
| Global styles bridge | Off by default. When on: links use the Primary color, headings the Secondary color, body text the Text color, fonts follow the Primary and Text fonts with the theme font as fallback. No effect when Elementor is deactivated. The option is registered and visible in the Customizer |
| WooCommerce | Shop, product, cart, checkout and account at all nine widths: status 200, no console errors, no overflow, one `main` landmark, full-width layout, store stylesheet loaded. Shop: no blog sidebar, at least three products per row on desktop with equal card heights, two per row at 360 px, buttons in the primary color. Product: add to cart works, gallery beside the summary on desktop and above it on phones. Cart and checkout blocks stay inside the page card; the checkout button uses the primary color |
| Together | Seven views at three widths with both plugins active: status, console, overflow |
| PHP error log | No notice, warning or error from the theme during the run |

## Not covered

- **Elementor Pro with an activated licence.** The Theme Builder integration was run against Elementor Pro 4.0.4 without activating a licence, with templates created through Elementor's own API. Building templates by hand in the Theme Builder screen was not exercised.
- PHP 7.4 and other PHP versions at runtime (compatibility is checked statically), and WordPress 6.4 with the new code.
- Safari, Firefox, real devices and screen readers.
- Placing an order end to end, and WooCommerce's classic (shortcode) cart and checkout.

## Running the tests

Requirements: PHP with the `sqlite3` and `zip` extensions, Composer, Node.js 20 or newer, Playwright with Chromium and axe-core (`npm install` in `tests/`), and network access to `wordpress.org`, `api.wordpress.org` and `downloads.wordpress.org`. The Plugin Check step also needs WP-CLI.

```bash
composer install
```

```bash
composer lint
```

```bash
bash tests/env/setup.sh
```

```bash
php tests/env/run.php "${OFT_DIR:-${TMPDIR:-/tmp}/open-frame-wp-test}/wordpress" tests/php/starter-sites.php
```

```bash
node --test --test-concurrency=1 tests/e2e/*.test.js
```

```bash
bash tests/env/theme-check.sh
```

```bash
OFT_WP_CLI=/path/to/wp-cli.phar bash tests/env/plugin-check.sh
```

The browser test files share one site, so they run one at a time (`--test-concurrency=1`). `setup.sh` builds a disposable site outside the repository (`$TMPDIR/open-frame-wp-test`, or `OFT_DIR`), installs WordPress, Elementor, WooCommerce and Theme Check, links the working copy in as the theme, links the companion plugin in, creates the test pages and products, and starts PHP's built-in server on port 8890 (`OFT_PORT`) plus a mock of the starter site library on port 8891 (`OFT_CLOUD_PORT`, see `tests/fixtures/cloud`). Set `OFT_ELEMENTOR_PRO_ZIP` to the path of an Elementor Pro ZIP you are licensed to use to include the Theme Builder test. Pin versions with `OFT_WP`, `OFT_ELEMENTOR` and `OFT_WOOCOMMERCE`. `bash tests/env/setup.sh stop` stops the server.

# Open Frame 1.0.1 — Test Report

Everything below was run against the packaged theme (`dist/open-frame.zip`) or the source tree it is built from. "Automated" means a scripted headless-Chromium (Playwright) check that asserts on the rendered page: computed styles, element positions, ARIA state and console output. The final run totalled 1,995 checks with no failures.

An independent code review was carried out before release; its twelve findings were fixed and each has a regression check in the last suite below.

## Environment

| Item | Value |
| --- | --- |
| WordPress | 7.1.5 (main test site), 6.4.15 (minimum-version site) |
| PHP | 8.3.6, `WP_DEBUG` and `WP_DEBUG_LOG` on, `SCRIPT_DEBUG` on |
| Database | SQLite (WordPress SQLite Database Integration) |
| Content | Official Theme Unit Test data (57 posts, 22 pages, menus, comments) plus a separate demo site |
| Browser | Headless Chromium via Playwright |
| Widths | 320, 390, 768, 1024, 1280, 1440, 1920 px |

Not covered by this run, and worth a manual pass before or during review: real assistive technology (screen readers), Safari and Firefox, and PHP 7.4 at runtime (compatibility is checked statically, see below).

## Static analysis

| Check | Result |
| --- | --- |
| Theme Check plugin (59 checks) on the packaged theme | **PASS** — 0 required, 0 warnings, 1 recommended (`custom-header` is intentionally not used), 1 info |
| PHPCS, `WordPress` ruleset (Core, Extra, Docs) | **0 errors, 0 warnings** |
| PHPCS, `PHPCompatibilityWP`, `testVersion 7.4-` | **0 errors, 0 warnings** |
| `php -l` on every PHP file | Clean |
| `wp_get_theme()->errors()` | None |
| Package contents | 52 files, 391 KB; no hidden, development or documentation files |
| Remote requests made by the theme | None (every request the theme triggers is same-origin) |
| Translation template | All 168 gettext calls present in `languages/open-frame.pot`, plus theme, template and pattern header strings |

## Automated browser tests

| Suite | Checks | Result |
| --- | --- | --- |
| **Pages.** Every public URL of the unit-test site (95 URLs: posts, pages, archives, search, 404, attachment) at two to six widths: HTTP status, no horizontal overflow, no JavaScript errors, no unexpected external requests, `main` landmark and skip link, one `h1` | 1,524 | Pass |
| **Layouts and header.** Right, left, none and full-width layouts; empty-sidebar fallback; page, post and blog settings; 404; page templates; wide and full blocks next to a sidebar; Landing Page block widths on desktop and phone; iframe height; five header layouts with and without search at four widths; no-menu fallback; hidden title; header colors; sticky header with and without the admin toolbar; transparent header scope | 202 | Pass |
| **Navigation, settings and footer.** Hover, toggle button, keyboard (Tab, Enter, Escape, focus return), outside click, focus-out, nested submenus, mega menu, mobile menu at three widths, no-JavaScript fallback; every color, font, size and width setting reaches the page; derived tints; out-of-range and malicious values are clamped or ignored; blog options; boxed layout; footer columns, colors and copyright sanitizing; search escaping; edit links; skip link; RTL | 133 | Pass |
| **Customizer screen and block editor.** 39 controls registered; live preview of colors, fonts, numbers, header and footer colors; refresh settings; conditional control; six patterns pass block validation; five block styles; both page templates offered; bundled font and editor styles applied in the editor canvas; no console errors | 23 | Pass |
| **Landing Page with transparent and sticky header** (overlay, solid on scroll, mobile panel) and the demo home page | 19 | Pass |
| **Round trips.** Customizer publish (values saved, numbers clamped, booleans, HTML sanitized, rendered on the frontend); comment form and moderation notice; threaded reply; password-protected post; focus outline | 17 | Pass |
| **WordPress 6.4.15.** Ten views at two widths, font loading, menus, landing patterns | 34 | Pass |
| **Review regressions.** Dropdowns stay inside the viewport at three widths and in RTL; block presets, button color and constrained widths on both WordPress versions; Latest Posts excerpt length; plugin and block buttons keep their own styles; body text color on excerpts, labels and pagination; Landing Page floats in LTR and RTL; reply form placement; mobile menu closes after use; touch at desktop width; wide blocks with and without a sidebar; hidden site title on focus; outline buttons | 43 | Pass |
| **Child theme.** Parent stylesheet, then child stylesheet; child rules win | manual | Pass |

PHP error log after the full run: **0 notices, warnings or errors** from the theme.

## Color contrast (default palette, WCAG 2.1)

| Pair | Ratio |
| --- | --- |
| Body text `#334155` on white / on page background | 10.35 / 9.90 |
| Headings `#0f172a` on white | 17.85 |
| Muted text `#64748b` on white / on page background | 4.76 / 4.55 |
| Links and primary `#3f4cd6` on white | 6.53 |
| Primary on the hover tint `#e8eafc` | 5.47 |
| White on primary button / on hover | 6.53 / 9.04 |
| Footer text `#cbd5e1` on `#0f172a` | 12.02 |

All text pairs meet AA (4.5:1). The disabled-button style is exempt.

## Reproducing

1. Install WordPress, activate the theme and import the [Theme Unit Test data](https://github.com/WPTT/theme-unit-test).
2. Run `phpcs` in the theme folder (ruleset: `phpcs.xml.dist`).
3. Install the [Theme Check](https://wordpress.org/plugins/theme-check/) plugin and run it under **Appearance → Theme Check**.
4. Build the package with `bash bin/build-zip.sh` and install `dist/open-frame.zip` on a clean site.
