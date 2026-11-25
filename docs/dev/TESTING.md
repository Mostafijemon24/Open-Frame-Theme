# Open Frame 1.0.0 — Test Report

Everything below was run against the packaged theme (`dist/open-frame.zip`) or the source tree it is built from. "Automated" means a scripted headless-Chromium (Playwright) check that asserts on the rendered page: computed styles, element positions, ARIA state and console output.

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
| Package contents | 52 files, 388 KB; no hidden, development or documentation files |
| Remote requests made by the theme | None (every request the theme triggers is same-origin) |
| Translation template | All 166 gettext calls present in `languages/open-frame.pot`, plus theme, template and pattern header strings |

## Automated browser tests

| Suite | Checks | Result |
| --- | --- | --- |
| **Pages.** Every public URL of the unit-test site (93 URLs: posts, pages, archives, search, 404, attachment) at two to six widths: HTTP status, no horizontal overflow, no JavaScript errors, no unexpected external requests, `main` landmark and skip link, one `h1` | 1,500 | Pass |
| **Layouts and header.** Right, left, none and full-width layouts; empty-sidebar fallback; page, post and blog settings; 404; page templates; wide and full blocks next to a sidebar; Landing Page block widths on desktop and phone; iframe height; five header layouts with and without search at four widths; no-menu fallback; hidden title; header colors; sticky header with and without the admin toolbar; transparent header scope | 202 | Pass |
| **Navigation, settings and footer.** Hover, toggle button, keyboard (Tab, Enter, Escape, focus return), outside click, focus-out, nested submenus, mega menu, mobile menu at three widths, no-JavaScript fallback; every color, font, size and width setting reaches the page; derived tints; out-of-range and malicious values are clamped or ignored; blog options; boxed layout; footer columns, colors and copyright sanitizing; search escaping; edit links; skip link; RTL | 132 | Pass |
| **Customizer screen and block editor.** 39 controls registered; live preview of colors, fonts, numbers, header and footer colors; refresh settings; conditional control; six patterns pass block validation; five block styles; both page templates offered; bundled font and editor styles applied in the editor canvas; no console errors | 23 | Pass |
| **Landing Page with transparent and sticky header** (overlay, solid on scroll, mobile panel) and the demo home page | 19 | Pass |
| **Round trips.** Customizer publish (values saved, numbers clamped, booleans, HTML sanitized, rendered on the frontend); comment form and moderation notice; threaded reply; password-protected post; focus outline | 17 | Pass |
| **WordPress 6.4.15.** Ten views at two widths, font loading, menus, landing patterns | 34 | Pass |
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
