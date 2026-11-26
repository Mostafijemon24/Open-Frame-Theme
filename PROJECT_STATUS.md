# Project Status — Open Frame Starter Sites

Last updated: 2026-11-26

Architecture: [docs/dev/STARTER-SITES-ARCHITECTURE.md](docs/dev/STARTER-SITES-ARCHITECTURE.md) · Test reports: [docs/dev/TESTING.md](docs/dev/TESTING.md)

## Current state

**Phases 1 to 4 are done.** The theme (1.1.0) works with Elementor, Elementor Pro and WooCommerce. The companion plugin (0.1.0) has a working Starter Sites screen that reads a catalog, checks requirements and installs required plugins. The library itself, importing and the ten designs do not exist yet; the screen runs against a mock library.

| Phase | Status |
| --- | --- |
| 1. Inspect the repository | Done |
| 2. Architecture and roadmap | Done, approved 2026-11-26 |
| 3. Core theme and design system | Done (theme 1.1.0) |
| 4. Starter Sites dashboard | **Done** (plugin 0.1.0) |
| 5. Cloud API and package delivery | Next. Needs a Cloudflare API token from the owner (see "Needed from the owner") |
| 6. Import engine | Not started |
| 7a. Business starter site | Not started |
| 7b. Nine further starter sites | Not started |
| 8. Package, validate, publish | Not started |
| 9. QA | Not started |
| 10. Documentation and release | Not started |

## Decisions (owner, 2026-11-26)

1. **Distribution: free.** Theme for WordPress.org, free companion plugin, free library. The licence gate stays in the design but is switched off.
2. **Elementor: two tiers.** Five starter sites work with Elementor free (Business, Portfolio, Restaurant, Education, Medical) and five require Elementor Pro (Agency, SaaS, E-commerce, Real Estate, Magazine).
3. **Images: implementer's choice.** Original generated images by default, CC0 photographs where better, every file's licence recorded. Confirmed per site at the start of Phase 7.
4. **Library address:** `api.buildbetters.com` (catalog, manifests) and `cdn.buildbetters.com` (packages, media, previews), on the owner's Cloudflare account.
5. Open: the free forms plugin for the five free-tier sites (Phase 7a).

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

## Verified (executed 2026-11-26)

- PHPCS: theme 42 files and plugin 15 files, 0 errors, 0 warnings.
- Theme Check on the packaged theme: 0 required, 0 warnings.
- Plugin Check 2.2.0 on the packaged plugin: no errors, no warnings.
- Plugin PHP checks: 99 of 99 pass.
- Browser checks: 36 of 36 pass (18 theme integrations including Elementor Pro, 18 Starter Sites screen including a real plugin installation from WordPress.org and an axe-core accessibility scan).
- Environment: WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2, Elementor Pro 4.0.4, WooCommerce 11.3.1.

## Not verified

- Elementor Pro with an activated licence (it was run without one), and building templates by hand in the Theme Builder screen.
- The real library: nothing is deployed at `api.buildbetters.com` yet, so the released plugin would show "could not be reached" until Phase 5.
- Multisite, servers that need FTP details to install plugins, and updating an outdated plugin through the screen.
- PHP 7.4 at runtime (syntax is checked on 7.4 in CI), WordPress 6.4 with the new code, Safari, Firefox, real devices, screen readers.

## Known issues and limitations

- Nothing can be imported yet. All ten designs are placeholders marked "Coming soon"; their previews say "Preview coming soon".
- Theme 1.1.0 and plugin 0.1.0 are not tagged or released.
- The plugin's readme names Cloudflare's privacy policy for the library; the library needs its own short privacy statement before the plugin is submitted to WordPress.org.
- The user guide has no screenshots for the Elementor and WooCommerce chapters and no chapter for the plugin yet.
- With the global-styles option on, Elementor's base stylesheet also loads on theme templates (about 7 KB compressed).
- The plugin recommendation notice in the theme waits until the plugin is on WordPress.org.

## Needed from the owner

1. **For Phase 5: a Cloudflare API token**, limited to Workers and R2 on the account that holds `buildbetters.com`. It will be requested through the secure credential form when Phase 5 starts. An account password cannot be used for this and should not be shared.
2. **For Phases 7 and 9:** if any Pro-tier design needs a feature that Elementor only unlocks after licence activation, an activated licence on a test site, or the owner's own testing of those designs.

## Next steps

1. Phase 5: schemas for manifests and packages, build, validate, sign and publish tools, the Worker and R2 layout, signature verification in the plugin.
2. Phase 6: the import engine, then the first real design (Business).
