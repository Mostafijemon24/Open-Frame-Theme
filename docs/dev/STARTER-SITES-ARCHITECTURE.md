# Open Frame Starter Sites — Technical Architecture and Roadmap

Status: **approved on 26 November 2026.** Phase 3 (theme foundation, theme 1.1.0), Phase 4 (the Starter Sites screen), Phase 5 (library tools, Worker and signatures; not yet deployed) the core of Phase 6 (import, resume and rollback), Phase 7a (the Business design) and the first three designs of Phase 7b (Portfolio, Restaurant and Education; plugin 0.4.0) are implemented; see `PROJECT_STATUS.md` for progress. Sections 2, 4, 5, 7 and 11 were updated with the owner's decisions and with what the phases found.
Scope: a cloud-delivered library of 10 complete, Elementor-editable starter websites for the Open Frame theme.

Contents

0. [Repository findings](#0-repository-findings)
1. [Project architecture](#1-project-architecture)
2. [Complete folder structure](#2-complete-folder-structure)
3. [Database and data flow design](#3-database-and-data-flow-design)
4. [Cloud infrastructure architecture](#4-cloud-infrastructure-architecture)
5. [Elementor integration strategy](#5-elementor-integration-strategy)
6. [Starter site package specification](#6-starter-site-package-specification)
7. [Import engine workflow](#7-import-engine-workflow)
8. [Security and performance strategy](#8-security-and-performance-strategy)
9. [Testing strategy](#9-testing-strategy)
10. [Phased implementation roadmap](#10-phased-implementation-roadmap)
11. [Decisions needed, assumptions and risks](#11-decisions-needed-assumptions-and-risks)

---

## 0. Repository findings

What exists today (inspected at commit `a2af51f`, 106 tracked files):

| Area | Finding |
| --- | --- |
| Product | **Open Frame 1.0.1**, a finished, released classic theme (PHP templates plus `theme.json`). GPL-2.0-or-later. Requires WordPress 6.4, PHP 7.4. |
| Positioning | Prepared for WordPress.org. `readme.txt` promises "needs no plugin … makes no remote requests". |
| Design system | Tokens as CSS custom properties (`--of-*`) in `style.css :root` (1,438 lines). The Customizer overrides them through inline CSS (`inc/customizer/dynamic-css.php`). `open_frame_defaults()` / `open_frame_get_mod()` are the single read path for 39 settings. |
| Header and footer | Rendered by PHP functions called directly from `header.php` and `footer.php` (`open_frame_site_branding()`, `open_frame_primary_nav()`, `open_frame_footer_widgets()`, …). **There are no action hooks around them**, so nothing can replace the header or footer today. |
| Page templates | `page-templates/full-width.php` (card, container width) and `page-templates/landing.php` (blank canvas for blocks). The default `page.php` wraps content in a container and a card. |
| Elementor | **No integration of any kind.** No theme locations, no page-builder-aware layout, no compatibility CSS. |
| WooCommerce | **No support declared**, no styles. |
| Admin UI | None. The theme adds no admin screens. |
| Tooling | `phpcs.xml.dist` (WordPress + PHPCompatibilityWP), `bin/build-zip.sh` driven by `.distignore`, a GitHub Actions release workflow that reads the version from `style.css`. No Composer or npm manifests, no automated tests in the repository (the 1,995 checks in `docs/dev/TESTING.md` were run from scripts that are not committed). |
| Naming | Text domain `open-frame`, prefix `open_frame_`, constants `OPEN_FRAME_*`, classes `Open_Frame_*`, CSS `of-` / `--of-*`. |

Consequences for this project:

1. The theme is in good shape and must not be rewritten. The work is **additive**: a few integration seams in the theme, and everything else outside it.
2. An importer, a cloud client and a templates dashboard cannot live in the theme. WordPress.org does not allow demo importers or other "plugin territory" features in themes, and the theme's "no remote requests" promise would be broken. They belong in a companion plugin.
3. The theme needs three seams before any starter site can work: replaceable header and footer, an Elementor-aware page layout, and (for site 05) WooCommerce support.

---

## 1. Project architecture

Three products with one-way dependencies. Each can be released on its own schedule.

```
┌──────────────────────────────┐      ┌─────────────────────────────────────┐
│ 1. Open Frame (theme)        │      │ 3. Open Frame Cloud                 │
│    presentation only         │      │    Cloudflare Worker + R2 + CDN     │
│    tokens, templates,        │      │    signed catalog, versioned        │
│    Customizer, Elementor and │      │    packages, media, previews        │
│    WooCommerce seams         │      └──────────────────▲──────────────────┘
└──────────────▲───────────────┘                         │ HTTPS, read-only,
               │ hooks and filters only                  │ no secrets on the client
┌──────────────┴─────────────────────────────────────────┴──────────────────┐
│ 2. Open Frame Starter Sites (companion plugin)                            │
│    dashboard · cloud client · requirements · import engine · rollback     │
│    site parts (header/footer/404 built in Elementor) · small widget pack  │
│    ── talks to Elementor only through one adapter class ──                │
└───────────────────────────────────────────────────────────────────────────┘
```

| Layer | Owns | Must never |
| --- | --- | --- |
| **Theme** `open-frame` | Markup, design tokens, Customizer, templates for blog, single, archive, search, 404, WooCommerce styling, hooks that let others replace the header and footer | Make remote requests, import content, register post types, depend on Elementor being active |
| **Plugin** `open-frame-starter-sites` | Admin dashboard, catalog client, requirement checks, plugin installs, the import engine, rollback, history, the Site Parts post type, a small Elementor widget pack, WP-CLI commands | Hold site designs in its ZIP, execute downloaded code, contain API secrets, call Elementor outside the adapter |
| **Cloud** | Catalog, site manifests, packages, media, previews, signatures, optional licence gate | Trust the client, serve mutable files at versioned URLs |
| **Starter site sources** `starter-sites/` | The 10 designs as data: tokens, Elementor documents, content, media index | Contain PHP, JavaScript or absolute authoring URLs |

Rules that hold the separation:

- The theme works exactly as today without the plugin and without Elementor. The plugin works only with Open Frame (or a child theme) active and says so clearly otherwise.
- Elementor is a **required dependency of importing a site**, not of the theme or of activating the plugin.
- Adding site number 11 is a cloud publish. It needs no theme or plugin release, as long as the package format version is unchanged.
- The package format carries a `format` integer. The plugin declares the range it understands; the catalog marks newer packages as "update the plugin to import this site".

Supported platform (carried over from the theme; Elementor range pinned in Phase 3):

| Component | Range |
| --- | --- |
| WordPress | 6.4 to current |
| PHP | 7.4 to current (CI: 7.4, 8.1, 8.3, latest) |
| Elementor (free) | current stable and the two previous minor releases, recorded in `compat.json`. Verified in Phase 3: current is 4.4.2, which itself requires WordPress 6.8 and PHP 7.4 |
| Elementor Pro | required by the five "Pro" starter sites, optional everywhere else |
| WooCommerce | current stable and one previous minor; required by site 05 only. Current is 11.3.1, which requires WordPress 7.0 |

The theme keeps its WordPress 6.4 minimum. Importing a starter site needs whatever Elementor needs (WordPress 6.8 today); the requirement check reports this before anything is downloaded.

---

## 2. Complete folder structure

Monorepo. **The theme stays at the repository root** so the existing release workflow, `bin/build-zip.sh` and the WordPress.org packaging keep working unchanged. Everything new sits in top-level folders that are added to `.distignore`.

```
/                                         ← theme root (unchanged location)
├── style.css, theme.json, functions.php, header.php, footer.php, …   (existing)
├── inc/
│   ├── (existing files)
│   ├── hooks.php                         DONE open_frame_do_location / open_frame_has_location filters
│   ├── admin/welcome.php                 LATER one dismissible notice that recommends the plugin
│   │                                           (added once the plugin is available on WordPress.org)
│   └── integrations/
│       ├── elementor.php                 DONE theme-builder locations, builder-page layout, global-styles bridge
│       └── woocommerce.php               DONE theme support, wrappers, store stylesheet
├── template-parts/
│   ├── content-builder.php               DONE full-width layout for pages built with a page builder
│   ├── header/site-header.php            DONE current header markup, moved out of header.php
│   └── footer/site-footer.php            DONE current footer markup, moved out of footer.php
├── assets/css/
│   └── woocommerce.css                   DONE loaded while WooCommerce is active
├── tests/env, tests/e2e                  DONE disposable test site and browser checks
├── composer.json                         DONE coding-standard tooling
│
├── companion/open-frame-starter-sites/   ← PLUGIN (own ZIP, own version)
│   ├── open-frame-starter-sites.php      header, constants, autoloader, bootstrap
│   ├── uninstall.php                     removes options and transients (never content)
│   ├── readme.txt                        discloses the external service
│   ├── compat.json                       supported Elementor / WooCommerce versions
│   ├── src/
│   │   ├── Plugin.php                    service wiring
│   │   ├── Admin/                        Page.php, Assets.php, Notices.php
│   │   ├── Rest/                         SitesController, ImportsController, RequirementsController
│   │   ├── Cloud/                        Client, CatalogCache, Downloader, Signature, HostPolicy
│   │   ├── Package/                      Reader (zip, in memory), Validator (schema), Manifest
│   │   ├── Requirements/                 Checker, PluginInstaller
│   │   ├── Import/
│   │   │   ├── Runner.php                step state machine with a time budget
│   │   │   ├── State.php, Lock.php, Snapshot.php, Report.php
│   │   │   └── Steps/                    Preflight, Download, Verify, Fonts, Media, Terms,
│   │   │                                 Content, Kit, Documents, SiteParts, Menus, Widgets,
│   │   │                                 ThemeMods, Options, WooCommerce, Finalize, Validate
│   │   ├── Elementor/                    Adapter (the only class that calls Elementor),
│   │   │                                 TokenResolver (ids and URLs), ElementWalker
│   │   ├── SiteParts/                    PostType, Conditions, Renderer
│   │   ├── Widgets/                      NavMenu, SiteLogo, Posts, SearchForm, Copyright
│   │   ├── Fonts/                        LocalFonts (uploads + @font-face + Elementor font group)
│   │   ├── Rollback/                     Rollback.php
│   │   ├── History/                      Log.php
│   │   └── CLI/                          Command.php (wp open-frame sites …)
│   ├── assets/admin/                     dashboard app source (@wordpress/element, wp-components)
│   ├── build/                            compiled admin assets (generated)
│   ├── schemas/                          → symlink or copy of /schemas at build time
│   ├── languages/
│   └── tests/                            phpunit (unit, integration)
│
├── cloud/                                ← CLOUDFLARE
│   ├── worker/src/index.ts               routes, headers, errors, optional licence gate
│   ├── worker/test/                      vitest + workers pool
│   ├── wrangler.toml                     bindings only, no secrets
│   └── README.md                         account setup, domains, tokens
│
├── starter-sites/                        ← DESIGN SOURCES (data only)
│   ├── _shared/                          brief template, licence list
│   ├── business/
│   │   ├── site.json                     identity, pages, requirements, import plan
│   │   ├── design-tokens.json            single source for kit.json and theme-mods.json
│   │   ├── brief.md                      visual direction, type pairing, layout grammar
│   │   ├── content/                      pages/, posts/, site-parts/, products/
│   │   ├── site/                         menus.json, widgets.json, terms.json, options.json
│   │   ├── media/index.json              uid, file, dimensions, alt, licence
│   │   ├── media/files/                  the images themselves (see the note below)
│   │   └── preview/                      thumbnail.webp, full-page previews
│   └── agency/ saas/ portfolio/ shop/ restaurant/ real-estate/ education/ medical/ magazine/
│
├── schemas/                              JSON Schema shared by plugin, worker and tools
│   ├── catalog.schema.json, manifest.schema.json, page.schema.json, media-index.schema.json
│
├── tools/                                Node scripts (no runtime role)
│   ├── build-package.mjs                 sources → versioned package + hashes
│   ├── validate-package.mjs              schema, forbidden content, budgets
│   ├── sign-catalog.mjs                  Ed25519 signature
│   ├── publish.mjs                       upload to R2, catalog last
│   └── exporter/                         dev-only WP plugin: export an authoring site to sources
│
├── tests/
│   ├── e2e/                              Playwright: dashboard, imports, responsive, editor, a11y
│   ├── fixtures/                         malicious zips, broken manifests, mock cloud
│   └── env/                              wp-env / Playground configuration, version matrix
│
├── .github/workflows/
│   ├── release.yml                       (existing) theme
│   ├── ci.yml                            NEW  lint, unit, integration, e2e matrix
│   ├── release-plugin.yml                NEW  plugin ZIP
│   └── publish-sites.yml                 NEW  build, validate, sign, upload
│
├── docs/dev/STARTER-SITES-ARCHITECTURE.md   this document
└── PROJECT_STATUS.md                     living status file
```

**Changed in Phase 7a.** The plan was to keep media binaries out of Git and in a private R2 prefix. The Business design showed that this is not needed for generated artwork: its fifteen images are drawn by a script (`tools/sites/business-art.mjs`), weigh about 540 KB together and are committed under `media/files/`, so a build needs nothing but the repository. The budget is 1 MB of media per site in Git. A design that needs photographs beyond that goes back to the original plan (hashes in Git, originals in R2).

Also from Phase 7a: a design is written as a generator (`tools/sites/<site>.mjs`, with shared builders in `tools/sites/kit.mjs`) that writes the JSON under `starter-sites/<site>/`. The JSON is committed and is what gets packaged; the generator exists so that a design is described once and consistently. There is no `design-tokens.json`: the generator holds the tokens and writes both `site/kit.json` and `site/theme-mods.json` from them.

---

## 3. Database and data flow design

### 3.1 Storage on the user's site

No custom tables. Everything uses core storage, so uninstalling is clean and backups cover it.

| Store | Key | Content | Autoload |
| --- | --- | --- | --- |
| Option | `ofss_settings` | User preferences; licence key only if a commercial tier is added | no |
| Option | `ofss_active_site` | `{slug, version, run_id, imported_at}` | no |
| Option | `ofss_import_state` | Current run: site, version, step, cursor inside the step, counters, heartbeat, selected options | no |
| Option | `ofss_snapshot_{run}` | Values of every setting the run changes, captured **before** the change | no |
| Option | `ofss_history` | Last 20 runs: result, per-step outcome, counts, warnings, error | no |
| Transient | `ofss_catalog` | Verified catalog, ETag, fetched-at (12 h, refresh on demand) | n/a |
| Transient | `ofss_lock` | Import lock with owner and expiry | n/a |
| Post meta | `_ofss_site`, `_ofss_uid`, `_ofss_run`, `_ofss_hash` | On every imported post, page, site part, menu item, product and attachment | n/a |
| Post meta | `_ofss_source_hash` | On attachments: SHA-256 of the source file, used to reuse media | n/a |
| Term meta | `_ofss_site`, `_ofss_uid`, `_ofss_run` | On imported terms and menus | n/a |
| Post type | `of_site_part` | Header, footer and 404 documents edited in Elementor (see 5.3) | n/a |
| Uploads | `uploads/open-frame/fonts/{site}/` | Font files of the imported site | n/a |

`_ofss_uid` is the stable identity of an object inside a package (for example `business:page:home`). It is what makes imports idempotent, re-imports safe and rollback exact. `_ofss_hash` is the hash of the content as imported, so a re-import can tell "untouched" from "edited by the user".

Snapshot contents: `show_on_front`, `page_on_front`, `page_for_posts`, `permalink_structure`, `elementor_active_kit`, `theme_mods_open-frame`, `nav_menu_locations`, `sidebars_widgets` and the affected `widget_*` options, plus WooCommerce page options when site 05 is imported.

### 3.2 Catalog flow

```
Dashboard (browser)
   │  GET /wp-json/open-frame-starter-sites/v1/sites      nonce + capability
   ▼
Plugin ── cached and still fresh? ── yes ──► respond
   │ no
   ▼
Cloud  GET /v1/catalog.json  (If-None-Match)  +  /v1/catalog.json.sig
   │  verify Ed25519 signature with the public key shipped in the plugin
   │  validate against catalog.schema.json
   ▼
store transient ──► annotate each site with local compatibility ──► respond
```

The browser never calls the cloud API. It loads only preview images from the CDN and opens the live demo in a new tab. If the cloud is unreachable, the last verified catalog is shown with a "showing saved list" notice.

### 3.3 Import flow

The import is a **resumable state machine driven by the client**: one REST call starts a run, then the dashboard calls `advance` repeatedly. Each call does as much work as fits in a time budget (the lower of 20 seconds and half of `max_execution_time`), saves state and returns progress. This survives shared-hosting timeouts without depending on WP-Cron, and the same runner is driven synchronously by WP-CLI for tests.

```
POST /imports {site, options, confirmed}
   → lock → preflight → snapshot → state saved → {run_id}

loop  POST /imports/{run}/advance
   → run the current step until budget is spent → save cursor → {step, percent, message}

done  → report stored in history → lock released
error → state kept → dashboard offers Retry step · Roll back · Copy report
```

### 3.4 Plugin REST API

Namespace `open-frame-starter-sites/v1`. Every route requires a valid REST nonce and the `ofss_manage` capability (mapped to `manage_options`; plugin installation additionally needs `install_plugins`).

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/sites` | Catalog with local compatibility; `?refresh=1` bypasses the cache |
| GET | `/sites/{slug}` | Full manifest, page list, requirement check, "what will change" summary |
| POST | `/requirements` | Install or activate one required plugin from WordPress.org |
| POST | `/imports` | Start a run |
| POST | `/imports/{run}/advance` | Execute the next unit of work |
| GET | `/imports/{run}` | Current state (used to resume after a reload) |
| POST | `/imports/{run}/rollback` | Remove what the run created and restore the snapshot |
| GET | `/history` | Past runs and reports |

---

## 4. Cloud infrastructure architecture

Cloudflare R2 for storage, one Worker for the API, Cloudflare's CDN in front of both. Free of egress fees, global, and small enough to operate alone.

```
GitHub Actions (publish-sites.yml)
   build → validate → hash → sign → upload versioned files → upload catalog last → purge catalog
                         │
                         ▼
R2 bucket  open-frame-sites
   catalog/catalog.json, catalog.json.sig
   sites/{slug}/{version}/manifest.json
   sites/{slug}/{version}/package.zip            (JSON only, small)
   sites/{slug}/{version}/media/{sha256}.{ext}   (content-addressed)
   sites/{slug}/{version}/fonts/{sha256}.woff2
   previews/{slug}/thumbnail.webp, home.webp, pages/*.webp
                         │
          ┌──────────────┴───────────────┐
          ▼                              ▼
Worker  api.<domain>               CDN  cdn.<domain>  (R2 custom domain)
  GET /v1/catalog.json[.sig]         immutable versioned files, previews
  GET /v1/sites/{slug}/{version}/…
  JSON errors, ETag, rate limit,
  (optional) licence check
```

| Topic | Design |
| --- | --- |
| Versioning | Every site version is published under its own path and never modified. `Cache-Control: public, max-age=31536000, immutable`. The catalog is the only mutable object (`max-age=300, s-maxage=3600, stale-while-revalidate=86400`, ETag). |
| Atomic publish | Files first, catalog last. A half-finished publish is invisible to clients. Rolling back a bad site is re-publishing the previous catalog. |
| Integrity chain | Signed catalog → SHA-256 of each site manifest → SHA-256 and byte size of the package and of every media and font file. One Ed25519 signature protects the whole tree. Verified with `sodium_crypto_sign_verify_detached` (bundled with PHP 7.2+, polyfilled by WordPress). **As built in Phase 5:** the signature is not a separate file. `catalog.json` is an envelope holding the catalog as text plus its signatures (`schemas/envelope.schema.json`), so a catalog and its signature are published in one atomic write and can never be out of step. The envelope takes several signatures, which is how a key is replaced. |
| Keys | The signing key is a GitHub Actions secret used only by the publish workflow. The plugin ships the **public** key (`Config::PUBLIC_KEYS`, any number of them, so keys can be rotated). Nothing secret is in the theme, the plugin or `wrangler.toml`. Until a production key exists the list is empty and the plugin accepts nothing from the real library. |
| Why per-file media | The ZIP contains only JSON. Images and fonts are fetched one at a time by hash. An interrupted import resumes at the next file, files already on the site are reused, and no host has to unpack a 40 MB archive in one request. |
| Errors | The Worker returns `{code, message, retryable}` with correct status codes. The client retries retryable failures three times with backoff (1 s, 3 s, 9 s) and then stops with a readable message. |
| Abuse | Cloudflare rate limiting per IP on the API; everything served is public and cacheable, so there is nothing to steal on the free tier. |
| Commercial tier (optional, later) | The Worker checks `Authorization: Bearer <licence>` against KV or D1 and answers with a short-lived signed URL for premium packages. The plugin stores the licence key in `ofss_settings`. The free flow is unchanged, so this can be added without redesign. |
| Configuration | The API base URL is a plugin constant that can be overridden with `OFSS_API_BASE` in `wp-config.php` for staging and tests. Only HTTPS and only allow-listed hosts are accepted. |
| Environments | `staging` and `production` Workers and buckets. CI imports from staging before a catalog is promoted. |

**As built in Phase 5:** one Worker serves both host names (it is simpler to run than a Worker plus a public bucket domain, and can be split later without changing any address). The working manual is [LIBRARY.md](LIBRARY.md).

Addresses: the library will be served from `api.buildbetters.com` (catalog and manifests) and `cdn.buildbetters.com` (packages, media, previews); both are the plugin's defaults and its only allowed hosts. What is still needed from the owner for Phase 5: a Cloudflare **API token** limited to Workers and R2 for that account, entered through the secure credential form (not a password, and never in chat or in the repository), stored as a GitHub secret for the publish workflow. Until then development runs against the local mock in `tests/fixtures/cloud`, which answers like the real API and can be told to fail in specific ways.

---

## 5. Elementor integration strategy

### 5.1 Principles

- Elementor is the page builder. The theme is the foundation and the integration layer. Nothing of Elementor is forked, copied or re-implemented.
- Pages are built from Elementor's **own** containers and widgets. A starter site may use a third-party or custom widget only when the manifest lists it and the importer has verified it is registered.
- Layout is expressed with Elementor's controls (flex and grid containers, responsive values, global colors and fonts), not with custom CSS that the editor cannot see. Custom CSS is limited to things Elementor has no control for, lives in the theme's `elementor.css`, and never positions or sizes widgets.
- Every claim of "editable in Elementor" is tested by opening the page in the editor (section 9).

### 5.2 Changes in the theme

| Change | Why |
| --- | --- |
| **Done in 1.1.0.** Five replaceable locations (`header`, `footer`, `single`, `archive`, `404`) behind two filters, `open_frame_do_location` and `open_frame_has_location`; header and footer markup moved to `template-parts/header|footer/` | Lets Elementor Pro, or the plugin's Site Parts, replace the header, footer and content templates. Output is identical when nothing hooks in (verified against 1.0.1). |
| Register Elementor Pro theme locations (`elementor/theme/register_locations`, all core locations) and call `elementor_theme_do_location()` for header, footer, single, archive and 404 before falling back to the theme templates | Full Theme Builder support when Pro is present. |
| Elementor-aware default page layout: when a page is built with Elementor, drop the page card, title and content padding and let sections span the full width | Today `page.php` boxes the content. Imported pages are also assigned Elementor's Full Width template explicitly, so this is the safety net for pages the user creates. |
| Keep Elementor's `Canvas` and `Full Width` templates working (they are provided by Elementor; the theme only has to stay out of the way, which is verified by test) | Requirement: both modes supported. |
| No separate Elementor stylesheet | Phase 3 found that the theme's element styles do not leak into Elementor widgets, so no fixes were needed; the bridge is one inline rule. |
| **Token bridge**: when the Customizer option "Follow Elementor global colors and fonts" is on, the theme's `--of-*` tokens resolve from Elementor's kit variables with the Customizer values as fallback | Blog, single post, search, comments and WooCommerce views then follow the same palette and type the user edits in Elementor Site Settings. Imports turn it on. |
| Align container width and breakpoints with the kit (Elementor defaults: mobile up to 767 px, tablet up to 1024 px) | One layout grid for theme templates and Elementor pages. |
| Audit global element styles (`a`, `button`, headings, form fields) so they do not override Elementor widgets | The theme already protects block and plugin buttons; the same is verified for Elementor. |
| **Done in 1.1.0.** WooCommerce support and stylesheet | Site 05. The stylesheet loads on every view while WooCommerce is active, because products can sit on any page. |

Facts established in Phase 3 that later phases rely on:

- Elementor's Canvas and Full Width templates work with the theme as they are. The theme adds the `main` landmark to Full Width.
- Elementor prints its global (kit) styles only on pages it built. The bridge therefore enqueues the kit stylesheet on theme templates too, which also loads Elementor's base stylesheet there (about 7 KB compressed). On starter sites this costs nothing extra, because their header and footer are Elementor documents on every page.
- In Elementor 4.4 the new "atomic" elements are switched on by default but still marked beta, while containers and the classic widgets are stable. **Starter sites are built with containers and classic widgets**; atomic elements are revisited when Elementor marks them stable.
- The convention the bridge expects from every starter kit: global color Primary = brand color (buttons, links), Secondary = headings, Text = body text, Accent = highlights; global font Primary = headings, Text = body.

### 5.3 What is editable, with and without Elementor Pro

**Decision: two tiers.** Five starter sites need only Elementor free; five require Elementor Pro and use its Theme Builder, forms and WooCommerce builder. Every site is marked "Free" or "Requires Elementor Pro" in the dashboard, and a Pro site cannot be imported until Elementor Pro is active. The plugin never installs or bundles Elementor Pro.

| Tier | Sites | Header, footer, 404 | Blog and single post | Forms |
| --- | --- | --- | --- | --- |
| **Free** | Business, Portfolio, Restaurant, Education, Medical | Site Parts (companion plugin), editable in Elementor | Theme templates, styled through the bridge | A free forms plugin |
| **Pro** | Agency, SaaS, E-commerce, Real Estate, Magazine | Theme Builder templates | Theme Builder templates, editable in Elementor | Elementor Pro Form widget |

The split puts the sites that gain most from Theme Builder in the Pro tier: the magazine (archive and article templates), the store (product and shop templates) and the two with the most dynamic layouts. The table below describes what each tier can edit.

| Part of a site | Elementor free + companion plugin | With Elementor Pro |
| --- | --- | --- |
| All content pages (home, about, services, …) | Editable in Elementor | Same |
| Header, footer | Editable in Elementor as **Site Parts** (`of_site_part`, rendered through the theme hooks) | Theme Builder templates take priority if the user creates them |
| 404 page | Editable in Elementor as a Site Part | Theme Builder 404 takes priority |
| Navigation menu | The "Navigation Menu (Open Frame)" widget of the companion plugin (`of-nav-menu`): it prints the theme's primary menu, with the theme's mobile menu and keyboard support, and has Elementor controls for alignment, typography and colors | Pro's Nav Menu widget can replace it |
| Site logo, post grid, search form | Planned widgets, not built yet. Business uses a heading for its wordmark and the theme's blog templates | Pro widgets can replace them |
| Blog index, archives, search results, single post | Theme templates. Styled by the Customizer and the token bridge. **Not editable in Elementor.** | Editable by creating Theme Builder templates |
| Contact, booking and appointment forms | A free forms plugin, declared as a requirement (decision in section 11) | Pro Form widget can replace it |
| WooCommerce shop, product, cart, checkout | WooCommerce templates styled by the theme. **Not editable in Elementor.** | Editable with Pro's WooCommerce builder |
| Global colors, fonts, buttons, layout width | Elementor Site Settings (a kit created by the import) | Same |

Resolution order for the header (footer and 404 work the same way):
Elementor Pro Theme Builder template → Site Part with matching display condition → theme header from the Customizer.

The dashboard shows this table per site as plain statements ("Header and footer: editable in Elementor", "Single post layout: set in the Customizer"), so nothing is promised that the user's setup cannot do.

### 5.4 Isolation from Elementor's internals

All calls into Elementor go through `Elementor\Adapter`: is it active and which version, are containers enabled, which widget types are registered, create and switch a kit, create a document and save its elements and settings, render a document for display, regenerate CSS, clear caches. The adapter is the only file that needs attention when Elementor changes, and it is covered by integration tests against every version in `compat.json`. One exception, by necessity: the plugin's own Elementor widgets (`src/Widgets`) extend Elementor's widget class and use its control API, the same public API every widget add-on uses.

Documents are stored exactly as Elementor stores them (`_elementor_data`, `_elementor_edit_mode`, `_elementor_template_type`, `_elementor_version`, `_elementor_page_settings`, `_wp_page_template`), written through Elementor's document API rather than raw meta writes, so Elementor runs its own import hooks and migrations.

The import never overwrites the user's active kit. It creates a new kit for the site and switches `elementor_active_kit`; rollback switches back.

### 5.5 Fonts

**As built (Phases 7a and 7b):** a design may use the two typefaces that ship with the theme (Hanken Grotesk and JetBrains Mono), which the theme registers with Elementor as the group "Open Frame (bundled)"; Business does. Or it brings its own, as Portfolio does: `fonts/index.json` lists each file with family, weight range, style and licence; the build publishes the files by hash; the importer's `fonts` step downloads and verifies them, stores them under `uploads/open-frame-fonts/<sha256>.woff2` and records them in the option `ofss_fonts` with the run that brought them. `Fonts\Fonts` prints the `@font-face` rules (`font-display: swap`) and lists the families in Elementor under "Starter site fonts", so Elementor requests nothing from Google Fonts. Not built: `unicode-range` (several subsets of one family) and preloading.

Each site has its own type pairing. Fonts are open-licence variable WOFF2 files delivered by the cloud, stored in the site's uploads folder, declared with `@font-face` and registered as an Elementor font group so they appear in every typography control. Imported sites therefore make **no** requests to Google Fonts. Fluid type uses `clamp()` in kit typography (Elementor custom units), with explicit tablet and mobile values where a clamp is not enough.

### 5.6 Authoring the ten sites

Sites are authored as data (`starter-sites/{slug}`), imported into a real WordPress with the pinned Elementor version, opened in the editor, screenshotted at nine widths and corrected until they pass. In practice (Phase 7a) the data is written by a generator script per design, `tools/sites/{slug}.mjs`; the exporter plugin that would write editor changes back to the sources is not built. A site is not "done" from JSON alone; it is done when the imported result passes section 9.

The ten sites and their page sets:

| # | Site | Pages (all include 404) | Extra requirement |
| --- | --- | --- | --- |
| 01 | Business / Corporate | Home, About, Services, Service Details, Projects, Project Details, Team, Pricing, Blog, Single Post, Contact | forms |
| 02 | Creative Agency | Home, Studio, Services, Service Details, Work, Case Study, Careers, Journal, Single Post, Contact | forms |
| 03 | SaaS / Technology | Home, Features, Feature Details, Pricing, Integrations, Customers, About, Blog, Single Post, Contact / Demo, Privacy, Terms | forms |
| 04 | Portfolio / Personal Brand | Home, About, Work, Project Details, Services, Service Details, Resume, Notes, Single Post, Contact | forms |
| 05 | E-commerce | Home, Shop, Product, Cart, Checkout, My Account, About, Lookbook, Shipping and Returns, Journal, Single Post, Contact | WooCommerce, forms |
| 06 | Restaurant / Cafe | Home, Our Story, Menu, Reservations, Private Events, Gallery, Journal, Single Post, Contact and Location | forms |
| 07 | Real Estate | Home, Listings, Property Details, Agents, Agent Profile, Services, Service Details, About, Blog, Single Post, Contact | forms |
| 08 | Education / Academy | Home, Courses, Course Details, Instructors, Admissions and Fees, Events, About, Blog, Single Post, Contact | forms |
| 09 | Medical / Healthcare | Home, About, Departments, Service Details, Doctors, Doctor Profile, Book an Appointment, Patient Information, Blog, Single Post, Contact | forms |
| 10 | Blog / Magazine | Front page, Category, Single Article, Author, About, Subscribe, Contact | forms |

Scope stated honestly: property listings (07), courses (08) and doctor profiles (09) are ordinary Elementor pages in version 1, not managed listings with search and filtering. A listings or LMS integration is a later, separate feature.

Each site gets its own `brief.md` and `design-tokens.json` before any page is built: palette with contrast ratios, type pairing and scale, spacing scale, radius and elevation, header and footer pattern, grid and section rhythm, image direction, and a mobile layout strategy written per section (what stacks, what is reordered, what is dropped). Two sites may not share a header pattern, a hero composition or a card style.

---

## 6. Starter site package specification

Format version `1`. A package is a small ZIP of JSON, plus media and fonts addressed by hash.

```
{slug}-{version}.zip
├── manifest.json
├── site/
│   ├── kit.json            Elementor Site Settings: colors, typography, layout, buttons, form fields
│   ├── theme-mods.json     Open Frame Customizer values (allow-listed keys)
│   ├── options.json        allow-listed options, references by uid
│   ├── menus.json          menus, items, locations
│   ├── widgets.json        sidebar and footer widgets
│   └── terms.json          categories, tags, product categories
├── content/
│   ├── pages/{uid}.json        post fields, meta, template, Elementor document
│   ├── site-parts/{uid}.json   header, footer, 404 + display conditions
│   ├── posts/{uid}.json        blog posts (block content)
│   └── products/{uid}.json     WooCommerce products (site 05)
├── media/index.json        uid, sha256, bytes, mime, width, height, alt, licence
├── fonts/index.json        family, weight range, sha256, licence
└── LICENSES.md
```

`manifest.json` (abridged):

```json
{
  "format": 1,
  "id": "business",
  "name": "Business",
  "version": "1.0.0",
  "category": "business",
  "tags": ["corporate", "services"],
  "preview": { "thumbnail": "…/thumbnail.webp", "demo_url": "https://…" },
  "requires": {
    "wordpress": "6.4", "php": "7.4",
    "theme": { "slug": "open-frame", "version": "1.1.0" },
    "importer": "1.0.0",
    "plugins": [
      { "slug": "elementor", "name": "Elementor", "version": "x.y", "required": true, "source": "wordpress.org" },
      { "slug": "…forms…", "name": "…", "version": "…", "required": true, "source": "wordpress.org" }
    ],
    "elementor": { "features": ["container"], "widgets": ["heading", "image", "button", "of-nav-menu"] }
  },
  "editable": { "pages": "elementor", "header": "elementor", "footer": "elementor", "404": "elementor", "blog": "theme", "single": "theme" },
  "pages": [ { "uid": "business:page:home", "title": "Home", "front_page": true } ],
  "import_order": ["fonts", "media", "terms", "content", "kit", "documents", "site-parts", "menus", "widgets", "theme-mods", "options"],
  "files": { "site/kit.json": { "sha256": "…", "bytes": 1234 } },
  "package": { "sha256": "…", "bytes": 123456 }
}
```

Rules enforced by `tools/validate-package.mjs` at build time and again by the plugin before anything is written:

| Rule | Detail |
| --- | --- |
| File types | ZIP entries: `.json`, `.md` only. Media: `jpg`, `png`, `webp`, `avif`, `gif`. Fonts: `woff2`. No PHP, JavaScript, HTML or SVG. |
| References | No numeric WordPress IDs and no authoring URLs. Images are `ofss://media/{uid}`, links are `ofss://page/{uid}`, menus `ofss://menu/{uid}`, terms `ofss://term/{uid}`. The importer resolves them to local IDs and URLs; an unresolved token fails validation. |
| External URLs | Only hosts on an allow-list (for example map embeds and social profile placeholders). Everything else is rejected. |
| Elementor content | Every widget type must be listed in `requires.elementor.widgets`. HTML widgets containing `<script>`, event-handler attributes or `javascript:` URLs are rejected. |
| Settings | `theme-mods.json` and `options.json` may contain only allow-listed keys. `siteurl`, `home`, `admin_email`, user data, roles and active plugins can never be set by a package. |
| Budgets | Package ZIP under 2 MB. Any image under 400 KB, hero images under 250 KB, total media per site under 25 MB. Every image has width, height, alt text and a licence entry. |
| Versioning | Semantic versions. A published version is immutable. |

Why JSON and not WXR: WordPress has no built-in WXR importer, WXR has no stable identity for re-imports and no notion of rollback, and Elementor data inside WXR needs URL and ID rewriting anyway. The Elementor part of each page file is the same structure Elementor itself exports (`content`, `page_settings`, `version`, `type`), so nothing new is invented on the page-builder side.

---

## 7. Import engine workflow

| Step (brief) | What happens | On failure |
| --- | --- | --- |
| A. Select | Dashboard grid, filters, search | n/a |
| B. Preview | Details panel: screenshots per page, live demo link, page list, what is editable where | n/a |
| C. Compatibility | WordPress, PHP, theme and importer versions; active theme is Open Frame or a child; `ZipArchive`, sodium, memory limit, writable uploads, outbound HTTPS | Blocking items listed with the fix; import button disabled |
| D. Plugins | Checklist: installed, active, version in range. One-click install and activate from WordPress.org through core's upgrader. Elementor Pro is never installed, only detected. | Per-plugin error; manual install link |
| E. Confirm | "What will change" summary: pages added, homepage switch, menu locations, Elementor kit, Customizer values. Choice of **Add to my site** (default, deletes nothing) or **Replace the previous starter site**. If the site has existing content, a backup reminder with an explicit checkbox. | n/a |
| F. Download | Manifest, then package, streamed to a temporary file outside the web root when possible; size checked against the manifest; three retries with backoff | Retry or cancel; nothing written to the site yet |
| G. Verify | Signature chain, SHA-256, schema, package rules of section 6. The ZIP is read in memory entry by entry; nothing is extracted to a public folder. | Stop: "The download is damaged or was altered" |
| — Snapshot | Settings listed in 3.1 are saved | Stop before any change |
| H. Media and fonts | One file per unit of work: reuse by `_ofss_source_hash`, otherwise download, verify hash, MIME and dimensions, sideload, set alt text | Retry the file; after three failures continue and report the missing image as a warning |
| I. Content and Elementor | Terms, posts and pages (as drafts until finalised), Elementor kit, documents with tokens resolved, site parts, menus, widgets | Stop at the failing object; state kept |
| J. Global settings | Kit activated, Customizer values, token bridge on | Stop; snapshot restorable |
| K. Homepage and permalinks | `show_on_front`, front page, posts page. Permalinks are changed only if they are "Plain" and the user left the option ticked; rewrite rules flushed. | Warning, not a failure |
| L. Regenerate | Elementor CSS regenerated, Elementor cache cleared, pages published | Warning with a "Regenerate" link |
| M. Caches | Object cache for touched keys; `ofss_import_complete` action so cache plugins can purge. Third-party page caches are not force-cleared silently. | Warning |
| N. Validate | Front page exists and is published, every imported document has valid Elementor data and no unresolved token, menus are assigned, kit is active, a loopback request to the home page answers 200 | Listed in the report as warnings or errors |
| O. Report | Counts per type, warnings, errors with the step and a plain-language fix, buttons: View site, Edit home in Elementor, Customize, Roll back. Stored in history; copyable for support. | n/a |

Guarantees:

- **Only the selected site** is downloaded and imported.
- **Idempotent.** Every object is looked up by `_ofss_uid` before it is created. Importing the same site twice creates no duplicate pages, menus, terms or media.
- **User data is preserved.** The engine only ever updates or deletes objects carrying its own `_ofss_*` meta. In "Replace" mode, objects from the previous starter site that the user has edited (`_ofss_hash` no longer matches) are listed and kept unless the user chooses otherwise. Content the importer did not create is never touched.
- **Rollback.** Delete everything tagged with the run ID (attachments only if no other content references them), restore the snapshot, switch back to the previous kit, regenerate CSS. Rollback is available after success as well as after failure.
- **Interruption.** A lock with a heartbeat prevents parallel runs. If the browser closes or a request dies, the next visit shows "An import was interrupted" with Resume and Roll back. A stale lock expires after two minutes.
- **Full backups are out of scope.** The plugin snapshots the settings it changes and can remove what it created. It does not back up the database or files; it detects common backup plugins and recommends making a backup first.

Admin experience (Appearance → Starter Sites): template grid with category filters and search, details and preview panel, requirement checklist, a single stepper for the import with a named current step and percentage, history tab, "update available" badge when the catalog has a newer version of the imported site, and error messages that say what happened, at which step and what to do next. Built with the components WordPress already ships (`wp.element`, `wp.components`), fully keyboard-operable, loaded only on this screen.

Built in Phase 4 (plugin 0.1.0): everything in that list except the import stepper, which belongs to Phase 6. Until then no import button is shown; designs carry a "Coming soon" badge that comes from the catalog (`status`), and the history section appears only once there is history. The screen is written **without a build step**: `assets/admin/app.js` is plain JavaScript against the WordPress packages, so the file in the ZIP is the source, there is no toolchain to maintain and WordPress.org reviewers read what runs. The request that installs a plugin names a site and a plugin slug only; the server decides the action from the plugin's status and refuses any plugin the verified catalog does not list for that site.

---

## 8. Security and performance strategy

### 8.1 Security

| Threat | Control |
| --- | --- |
| Unauthorised use of the importer | Capability check and REST nonce on every route; multisite respects per-site capability and network-level plugin install rules |
| CSRF | REST nonce (`X-WP-Nonce`); no state change over GET |
| Tampered or spoofed package (compromised bucket, DNS, CDN, MITM) | Ed25519-signed catalog and SHA-256 chain down to every file; HTTPS with certificate verification on; unsigned or mismatching data is discarded |
| SSRF and open redirects | Hosts restricted to the configured API and CDN hosts; HTTPS only; `wp_safe_remote_get` with `reject_unsafe_urls`; redirects limited and re-validated |
| ZIP path traversal, zip bombs | Package is read in memory; entry names with `..`, absolute paths, backslashes or drive letters are rejected, as are symlinks; limits on entry count, per-entry size and total uncompressed size |
| Remote code execution | Packages contain no executable file types; nothing downloaded is ever included, evaluated or written with an executable extension; media is checked by extension, MIME sniffing and image parsing before it enters the media library |
| Stored XSS through content | Widget-type allow-list, script and handler checks, option and theme-mod key allow-lists, values sanitised by the same sanitizers the Customizer uses |
| Privilege escalation through options | Packages cannot set arbitrary options; the allow-list is in code, not in the package |
| Secrets | None in the theme or plugin. Signing key and Cloudflare token exist only as CI secrets. An optional licence key is stored server-side and never exposed to scripts. |
| Information leaks | Temporary files in a non-guessable folder with an index guard, removed at the end of every run; logs contain no secrets |
| Supply chain | Plugin has no runtime Composer or npm dependencies; build-time dependencies are locked; published packages are immutable |
| Standards | WordPress Coding Standards, escaping on output, sanitising on input, prepared queries (no custom SQL is planned), Plugin Check and Theme Check in CI |

### 8.2 Performance

| Area | Strategy |
| --- | --- |
| Theme | No new front-end cost without Elementor or WooCommerce. `elementor.css` and `woocommerce.css` are enqueued conditionally. No new JavaScript on the front end. |
| Plugin, front end | Nothing is loaded unless a Site Part or one of the plugin's widgets is on the page; widget assets are registered through Elementor's dependency system so they load only where used. |
| Plugin, admin | Dashboard assets load only on the Starter Sites screen. Catalog cached for 12 hours with ETag revalidation. |
| Import | Time-budgeted steps, one media file per unit, streaming downloads, no large arrays held in memory, media reuse by hash. |
| Images | WebP (AVIF where it is clearly smaller), explicit dimensions on every image to prevent layout shift, responsive sizes generated by WordPress, lazy loading for everything below the fold, the hero image not lazy-loaded. |
| Fonts | Local variable WOFF2, `font-display: swap`, one or two families per site, the primary text face preloaded. |
| Elementor pages | Shallow container nesting, global styles instead of per-widget overrides, no motion effects on first-screen content, no widget that pulls a large script for a small effect. |
| Budgets, enforced in CI | Largest Contentful Paint under 2.5 s, Cumulative Layout Shift under 0.1, home page transfer under 1.2 MB, Lighthouse mobile performance of at least 85 on every starter home page, no horizontal overflow at any tested width. |
| Cloud | Immutable versioned assets cached at the edge for a year; a single small mutable catalog. |

---

## 9. Testing strategy

Nothing is reported as passing unless it was executed, and results are recorded in `docs/dev/TESTING.md` with the versions used.

| Level | Tooling | Covers |
| --- | --- | --- |
| Static | PHPCS (WordPress, PHPCompatibilityWP 7.4+), PHPStan with WordPress stubs, ESLint, `php -l`, Theme Check, Plugin Check, JSON Schema validation of all package sources | Every commit |
| Unit (PHP) | PHPUnit | Package validator, in-memory ZIP reader (traversal, bomb, symlink fixtures), signature verification, token resolver, element walker, state machine, lock, snapshot, requirement checker |
| Unit (cloud) | Vitest with the Workers pool | Routes, headers, ETag, error shapes, licence gate when present |
| Contract | Shared JSON Schemas | The Worker's output and the plugin's expectations are validated against the same schemas |
| Integration | WordPress test environment driven by WP-CLI (`wp open-frame sites import …`) | For each site: fresh install, existing content, import twice (no duplicates), replace mode, rollback, missing plugin, wrong versions, corrupted download, bad signature, cloud 500 and timeout (mock server), interruption at every step followed by resume and by rollback |
| End to end | Playwright | Dashboard flow as a user; every page of every site at 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 px: HTTP 200, no horizontal overflow, no console errors, all images loaded, one `h1`, landmarks, working mobile navigation; screenshot comparison |
| Elementor editor | Playwright | Every imported page, header, footer and 404 opens in the editor without errors; a heading and an image are changed, saved and verified on the front end; global color change propagates; Canvas and Full Width templates render |
| WooCommerce | Playwright | Site 05: shop, product, add to cart, cart, checkout form rendering |
| Accessibility | axe-core in Playwright, keyboard walkthrough scripts, contrast checks from the tokens | WCAG 2.1 AA on every page; focus visible; menus and dialogs operable by keyboard |
| Performance | Lighthouse CI | Budgets of section 8.2 |
| Matrix | CI | PHP 7.4, 8.1, 8.3 and latest × WordPress 6.4 and latest × Elementor versions in `compat.json` |
| Manual | Checklist | Safari and Firefox, real phones, a screen reader, a low-memory shared host |

Environment note: resolved in Phase 3. The development environment `open-frame-theme` allows `wordpress.org`, `downloads.wordpress.org` and `api.wordpress.org`, and `tests/env/setup.sh` builds a complete test site from them. The same script runs in GitHub Actions (`.github/workflows/ci.yml`).

---

## 10. Phased implementation roadmap

Each phase ends with: code review, the relevant tests executed, defects fixed, `PROJECT_STATUS.md` updated, and a short report of what is done and what is not. The next phase starts only after approval.

| Phase | Goal | Main deliverables | Exit criteria |
| --- | --- | --- | --- |
| **1. Inspect** | Understand the repository | Section 0 | Done |
| **2. Architecture** | This document | Architecture, roadmap, `PROJECT_STATUS.md` | Done, approved |
| **3. Core theme and design system** | Make the theme a correct Elementor and WooCommerce foundation without changing its default output | Header and footer hooks, template parts, Elementor locations and layout rules, token bridge, `elementor.css`, WooCommerce support, plugin recommendation notice, Composer and npm tooling, CI skeleton, working test environment; theme 1.1.0 | Existing behaviour unchanged with Elementor off (regression suite); Canvas, Full Width and default templates correct with Elementor on; PHPCS and Theme Check clean |
| **4. Dashboard** | The Starter Sites screen, working against a mock catalog | Plugin skeleton, REST routes for catalog and requirements, grid, filters, search, details and preview, requirement checklist with real plugin install, history view, empty and error states | Keyboard-operable; no fake buttons (anything not yet wired is not shown); Plugin Check clean |
| **5. Cloud API and delivery** | Real catalog and packages | JSON Schemas, build, validate, sign and publish tools, Worker, R2 layout, staging and production, client with cache, retries and signature verification | Contract tests pass; publish is atomic and repeatable; tampered catalog and package are rejected in tests |
| **6. Import engine** | Safe, resumable, reversible import | Runner, steps, lock, snapshot, rollback, Elementor adapter, token resolver, Site Parts, widget pack, local fonts, report, WP-CLI command | A small reference package passes every integration scenario of section 9, including interruption and rollback |
| **7a. Business site** | The first complete site, used to prove the whole chain | Brief, tokens, 12 pages, header, footer, 404, content, media | Imports in one click on a fresh and on an existing site; every page passes responsive, editor, accessibility and performance tests |
| **7b. Nine more sites** | Agency, SaaS, Portfolio, E-commerce, Restaurant, Real Estate, Education, Medical, Magazine | One brief and one complete package each, built and validated one at a time | Same criteria per site; a design review confirms no two sites share a header, hero or card pattern |
| **8. Package and publish** | Production catalog | Previews, thumbnails, live demo sites, licences file, versioned publish to production | Each site imported from production on a clean install |
| **9. QA** | Full matrix | Automated matrix, manual checklist, fixes | All suites executed and recorded; open issues listed with severity |
| **10. Release** | Shippable products | Theme ZIP, plugin ZIP, user guide with screenshots, developer docs, changelogs, installation guide, support and update policy | Release checklist signed off |

Sequencing notes:

- Phases 4 and 5 can overlap, because the dashboard is developed against the same schemas the cloud will serve.
- Phase 7 is by far the largest: roughly 110 designed pages plus 30 site parts. Building the Business site first, alone, is what keeps the other nine from repeating its mistakes.
- The theme release (1.1.0) at the end of Phase 3 is independently useful and can ship before anything else exists.

---

## 11. Decisions needed, assumptions and risks

### Decisions for the owner

| # | Decision | Recommendation | Why it matters now |
| --- | --- | --- | --- |
| 1 | **Distribution model** | **Decided: free.** Theme on WordPress.org, free plugin, free library. The licence gate stays in the design, switched off | Decides whether the cloud needs licence checks and where the plugin can be listed |
| 2 | **Elementor baseline** | **Decided: two tiers**, five sites for Elementor free and five that require Elementor Pro (section 5.3) | Decides the Site Parts and widget-pack work, and what "editable" means per site |
| 3 | **Imagery** | **Decided: left to the implementer.** Original generated images as the default, CC0 photographs where a real photograph is clearly better, every file's licence recorded. Confirmed per site at the start of Phase 7 | "Premium" quality depends on it more than on anything else, and licences must be clean for redistribution |
| 4 | **Cloudflare account and domain** for `api.` and `cdn.` | **Decided: at Phase 5.** A mock API is used until then | Only the owner can create it |
| 5 | **Forms plugin** for the five free-tier sites | Open; chosen during Phase 7a | Appears in those sites' requirements |

### Assumptions

- The product name stays "Open Frame"; the plugin is "Open Frame Starter Sites" (`open-frame-starter-sites`, prefix `ofss_`).
- Minimum versions stay at WordPress 6.4 and PHP 7.4.
- The repository stays a monorepo with the theme at the root.
- Listings, courses and doctor directories are static Elementor pages in version 1.
- Elementor's version, its page templates, kit variables, font filters and document `save()` call were verified against Elementor 4.4.2 in Phase 3. The remaining document and kit calls the importer needs are verified in Phase 6, inside the adapter (5.4).
- The theme's Theme Builder integration was verified against Elementor Pro 4.0.4, supplied by the owner, without an activated licence. Features that Elementor unlocks only after licence activation could not be exercised; if the Pro-tier sites need any of them, Phases 7 and 9 need an activated licence or the owner tests those sites. Elementor Pro is never committed to this repository or bundled with the plugin.

### Risks

| Risk | Mitigation |
| --- | --- |
| Elementor changes internal APIs or its document format | Single adapter, version matrix in CI, `compat.json` gate in the importer |
| Volume and quality of design work (110+ pages) | One site at a time, written brief first, automated visual and editor checks, explicit design review between sites |
| Elementor JSON generated outside the editor is subtly invalid | Every page is imported and opened in the real editor by automated tests; exporter round-trip for hand corrections |
| Shared hosting limits (timeouts, memory, missing extensions) | Time-budgeted steps, per-file media, preflight checks with clear messages |
| WordPress.org review of the plugin | Remote data only, never remote code; external service disclosed in the readme; no upsell nags |
| Free tier cannot edit blog and shop templates in Elementor | Stated per site in the dashboard; theme templates styled through the token bridge; Pro path supported |
| Image licensing | Licence recorded per file; build fails without it |
