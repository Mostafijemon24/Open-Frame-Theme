# Project Status — Open Frame Starter Sites

Last updated: 2026-11-26

Architecture: [docs/dev/STARTER-SITES-ARCHITECTURE.md](docs/dev/STARTER-SITES-ARCHITECTURE.md) · Test reports: [docs/dev/TESTING.md](docs/dev/TESTING.md)

## Current state

**Eight of the ten designs exist, and the owner has changed the standard for their pictures.** On 2026-11-26 the owner asked for real photographs instead of drawn pictures, words written for the business shown, and a record of source and licence for every picture. Real Estate is the first design made that way and is offered as the benchmark; the seven earlier designs still use drawn pictures and are waiting for the owner's decision on the benchmark before they are redone (see "Needed from the owner").

Business, Portfolio, Restaurant, Education and Medical (free), Agency, SaaS and Real Estate (Pro), are each imported, checked at nine screen widths, opened in the Elementor editor and rolled back by the automated tests. They share no layout, typeface or color. What is still missing before a user can do the same: the library is not deployed (blocked on a Cloudflare token), and two Pro designs are still to be made (Shop, Magazine).

| Phase | Status |
| --- | --- |
| 1. Inspect the repository | Done |
| 2. Architecture and roadmap | Done, approved 2026-11-26 |
| 3. Core theme and design system | Done (theme 1.1.0) |
| 4. Starter Sites dashboard | Done |
| 5. Cloud API and package delivery | Built and tested locally. **Deployment blocked** (see "Needed from the owner") |
| 6. Import engine | **Core done and tested.** Some planned parts are not built yet, listed below |
| 7a. Business starter site | **Done** (plugin 0.3.0, design version 1.0.0) |
| 7b. Nine further starter sites | **In progress: 7 of 9 done.** The free tier is complete (Portfolio, Restaurant, Education, Medical); of the Pro tier, Agency, SaaS and Real Estate are done (plugin 0.5.0). Next: Magazine, and Shop, which needs WooCommerce products in a package |
| 7c. Photographs and matching words for every design | **In progress.** The owner approved the Real Estate benchmark on 2026-11-26. Redone so far: Business, Education. Still with drawn pictures: Portfolio, Restaurant, Medical, Agency, SaaS |
| 8. Package, validate, publish | Not started |
| 9. QA | Not started |
| 10. Documentation and release | Not started |

## Decisions (owner, 2026-11-26)

1. **Distribution: free.** Theme for WordPress.org, free companion plugin, free library. The licence gate stays in the design but is switched off.
2. **Elementor: two tiers.** Five starter sites work with Elementor free (Business, Portfolio, Restaurant, Education, Medical) and five require Elementor Pro (Agency, SaaS, E-commerce, Real Estate, Magazine).
3. **Images: real photographs (changed by the owner on 2026-11-26).** The first decision left the choice to the implementer, who drew the pictures. The owner now asks for real photographs chosen for each section, no illustrations in place of photographs, words written for the business shown, nothing invented presented as fact, and source, photographer and licence recorded for every picture. How this is done is in the architecture document, section 5.7.
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
- Sidebar widgets and WooCommerce products in a package.
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

### Phase 7b, part 3: the Education design

- **The design** (`starter-sites/education`, brief in `brief.md`): the fictional "Tandem Academy", evening courses for adults. Home, Courses, a course page with syllabus, fee and instructor, Instructors, Admissions and Fees, Events, About, Contact, the blog page "News" with three articles, plus header, footer and a "page not found" page.
- **Its own look:** a stack of rounded color panels on a cream page, sticker-like cards with a dark outline and a hard shadow, chips, circular portraits, a floating pill-shaped header; Bricolage Grotesque with Figtree; violet, yellow and coral.
- **Images:** sixteen original flat illustrations (a hero, six course tiles, the building, a group, four portraits, news covers), drawn by `tools/sites/education-art.mjs`. CC0, about 500 KB.
- **Decided against Elementor's accordion widget.** It was tried for the questions on the Admissions page; axe-core reports ARIA attributes on its titles that do not fit their role, whichever title element is chosen. The questions are plain cards instead.

### Phase 7b, part 4: the Medical design (the free tier is complete)

- **The design** (`starter-sites/medical`, brief in `brief.md`): the fictional "Linden Clinic", a group practice. Home, About, Departments, a department page, Doctors, a doctor's profile, Book an Appointment, Patient Information, Contact, the blog page "Health Notes" with three articles, plus header, footer and a "page not found" page.
- **Its own look:** a pale green page with white cards and soft, blurred shadows, icons in tinted circles, pictures with one large corner, a narrow bar with hours and telephone number above the header; Plus Jakarta Sans throughout; teal with a warm sand band.
- **Uses two more of Elementor's free widgets:** Icon Box and Icon.
- **Written for the subject:** the three things a patient looks for (how to book, who they will see, opening hours) come directly under the hero; an emergency notice has its own card; the sample texts make no medical claims and every article ends with a line saying it is not personal advice.
- **Images:** thirteen original illustrations (a hero, four doctors, the building, the reception, a consulting room, a family, a heart, covers), drawn by `tools/sites/medical-art.mjs`. CC0, about 360 KB.
- **Found by the tests and fixed:** every page was wider than the screen because a block inside the header had no width (an Elementor container is as wide as its parent unless told otherwise); icon boxes with a link also linked the bare icon, a link without a name, so cards now carry a named text link instead.

### Phase 7b, groundwork for the Pro tier (plugin 0.5.0)

- **Theme Builder templates in a package.** A design of the Pro tier can bring templates for Elementor Pro's Theme Builder (`content/templates/*.json`): header, footer, single post, single page, archive, search results and "page not found", each with the conditions that say where it is used. The importer creates them through Elementor Pro, gives them their content and conditions, and tags them; a rollback deletes them and rebuilds Elementor Pro's list of conditions. All of it goes through `Elementor/Adapter.php`.
- **Rules in the library build:** only a Pro design may contain templates, the type must be a known one, and a template must say where it is used.
- **Checked without a licence:** with Elementor Pro 4.0.4 installed and not activated, its widgets (menu, posts, form, post title and content and so on) and template types are registered, so the Pro designs can be built and tested here. What only works with an activated licence is still unknown (see "Needed from the owner").
- **A test fixture** (`tests/fixtures/sites/reference-pro`): one page, a header template, a single-post template and a post. The importer checks for it run when Elementor Pro is active in the test site and are skipped, with a message, when it is not (as in CI).

### Phase 7b, part 5: the Agency design, the first of the Pro tier

- **The design** (`starter-sites/agency`, brief in `brief.md`): the fictional creative studio "Parallel". Home, Studio, Services, a service page, Work, a case study, Careers, Contact, and the blog page "Journal" with three articles.
- **Built on Elementor Pro:** header, footer, the journal, category archives, the article layout and "page not found" are six Theme Builder templates. It uses Pro's Nav Menu, Animated Headline, Posts, Archive Posts, Post Title, Post Info, Featured Image, Post Content, Post Navigation and Form widgets. The contact page has a real form that sends an email.
- **Its own look:** black, off-white and acid green in hard full-width bands, a very wide display typeface (Unbounded) with Inter, 2px rules instead of boxes, large square case covers with outlined tags.
- **Images:** fifteen original graphics (six case covers, a wall of them, the studio, four portraits, three journal covers), drawn by `tools/sites/agency-art.mjs`. CC0, about 560 KB.
- **Importer:** menus are now created before the pages are built, and a page can refer to a menu of the design (`ofss://menu/primary`), which Elementor Pro's Nav Menu widget needs.
- **Shared browser checks know both tiers:** for a Pro design they look for Theme Builder templates and Elementor Pro's menu and post lists instead of site parts and the theme's. They are skipped, with a message, when Elementor Pro is not installed (as in CI).
- **Theme (still 1.1.0, unreleased):** links inside a post shown by an Elementor Pro template are underlined, as in the theme's own templates.
- **Found by the tests and fixed:** the posts page had no `h1` (Elementor Pro has no title for it, so it has its own template with a written one); title and picture widgets showed placeholders until given their dynamic tag; pictures that link to an article had no name; links in an article could only be told apart by color; the menu button was 33px and is now 45px.
- **One finding that cannot be fixed here:** Elementor Pro's Posts widgets give each article the role "listitem", which axe-core's best-practice rule "aria-allowed-role" rejects. The check is switched off for Pro designs, for that rule only, and the brief says so.

### Phase 7b, part 6: the SaaS design

- **The design** (`starter-sites/saas`, brief in `brief.md`): the fictional feedback tool "Loop". Home, Features, a feature page, Pricing, Integrations, Customers, About, Book a Demo, Privacy, Terms, and the blog with three articles.
- **Built on Elementor Pro:** six Theme Builder templates (header, footer, blog, archives, article, "page not found"), three Price Table widgets, a demo form, the Nav Menu and Posts widgets.
- **Its own look:** a white page, near-black type and buttons, one pink-to-orange gradient used only as a background, centered openers, rounded tinted cards; Sora with DM Sans. Every picture is a screen of the invented product, drawn in HTML.
- **Images:** twelve original pictures (four app screens, integration tiles, customer covers, a team, blog covers), drawn by `tools/sites/saas-art.mjs`. CC0, about 500 KB.
- **Theme (still 1.1.0, unreleased):** links in Elementor's Text Editor widget are underlined, so a link in a paragraph is not marked by color alone.
- **Found by the tests and fixed:** a grey line of text failed contrast on phones, where it is smaller; a link in the legal text could only be told apart by color; twelve sections had no space below them; the preview picture was larger than the library accepts until reduced to 256 colors.

### Phase 7b, part 7: the Real Estate design, and the photography standard

- **The owner's request:** real photographs in place of drawn pictures, chosen section by section; words that fit the business and the picture; no invented facts presented as real; a record of source and licence per picture; one benchmark design first.
- **What could be reached from here:** Pexels, Pixabay and StockSnap refuse automated visitors, Unsplash asks them to pass a check, and Openverse had used up its allowance for anonymous requests. Wikimedia Commons answers through its public API and holds many thousands of professional photographs that Unsplash released as CC0 before 2017. Those are used.
- **Licence rule:** only photographs that Commons records as CC0 or public domain. They may be redistributed and changed without conditions, which also keeps the way open for WordPress.org, where pictures under the present Unsplash, Pexels or Pixabay licences are not accepted inside a theme.
- **The tool** (`tools/sites/photos.mjs`): `search` lists candidates and draws a numbered contact sheet to choose from; `fetch` reads a design's `photo-sources.json`, checks each licence again, crops around a focal point to the exact shape the layout needs, writes WebP, and records source page, photographer, licence, original size and date in `photos.json` and in a readable `CREDITS.md` that travels with the design.
- **The design** (`starter-sites/real-estate`, brief in `brief.md`): the fictional agency "Hartwell & Rowe". Home, Homes for Sale, a property with a viewing form, Agents, an agent's profile, Services, Selling, About, Contact, and market notes with three articles. Six Theme Builder templates, Newsreader with Manrope, forest green on cream.
- **Pictures first, words second:** the eighteen photographs were chosen before the texts were finished. Each home is named and described after its photograph, the people after their portraits, each article has a cover that shows its subject.
- **Sample content is marked:** the footer says the agency, homes, prices and figures are examples; the client quote says it is a sample.
- **Budgets:** a design with photographs may carry 360 KB per picture and 4 MB in total (here 3.1 MB); drawn designs keep 100 KB and 1 MB. The library tests also check that every photograph has a record with a free licence.

### Phase 7b, groundwork for the store (plugin 0.6.0)

- **Products in a package:** `content/products/<name>.json` becomes a simple WooCommerce product with its name, address, short and long description, price, sale price, picture, gallery, categories and "featured" mark. A design with products must require WooCommerce, which the Starter Sites screen installs from WordPress.org like Elementor.
- **Links into the store:** `ofss://store/shop`, `/cart`, `/checkout` and `/account` become the addresses of WooCommerce's own pages; `ofss://product/<name>` the address of a product.
- **Rollback** removes the products and the product categories the import created.
- **Tests:** a "Reference Shop" fixture; twelve importer checks that run when WooCommerce is active in the test site (CI runs the importer checks a second time with it); six new library tool checks.
- **Not built:** variable products, attributes, stock, tax and shipping settings, and Elementor Pro's shop templates. The store pages are WooCommerce's, styled by the theme.

## Verified (executed 2026-11-26)

- PHPCS: theme 42 files and plugin 26 files, 0 errors, 0 warnings. (CI found three comment-alignment errors in the plugin in the Agency and SaaS commits, which the local check had missed; corrected in the Real Estate commit.)
- Theme Check on the packaged theme: 0 required, 0 warnings.
- Plugin Check 2.2.0 on the packaged plugin: no errors, no warnings.
- Plugin PHP checks: all pass (138 with Elementor Pro in the test site, 139 on a fresh site without it).
- Import engine checks: 80 of 80 pass without Elementor Pro and WooCommerce, 92 of 92 with Elementor Pro (twelve checks for Theme Builder templates) and 92 of 92 with WooCommerce (twelve checks for products), including a rollback that is compared field by field with the site before the import, interruptions at every one of the 18 points of an import, and the fonts of a design.
- Browser checks: 127 of 127 pass with Elementor Pro in the test site (94 without it, where the Agency, SaaS and Real Estate files are skipped). 11 for each of the eight designs (import, every address at nine widths, menu, links, blog, 404, axe-core, typefaces, global styles, editor, rollback), 18 theme integrations including Elementor Pro, 21 Starter Sites screen including a real plugin installation from WordPress.org, forged catalogs, an import with editing and rollback, and axe-core accessibility scans.
- Library tools: 59 of 59 pass. Worker: 10 of 10 pass.
- Environment: WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2, Elementor Pro 4.0.4, WooCommerce 11.3.1.

## Not verified

- Elementor Pro with an activated licence (it was run without one), and building templates by hand in the Theme Builder screen.
- **Anything on Cloudflare.** The Worker, the R2 bucket, the two host names and the "Publish library" workflow have not run. Nothing is deployed at `api.buildbetters.com`. Whether `buildbetters.com` is a zone on the owner's Cloudflare account could not be checked either.
- Multisite, servers that need FTP details to install plugins, and updating an outdated plugin through the screen.
- PHP 7.4 at runtime (syntax is checked on 7.4 in CI), WordPress 6.4 with the new code, Safari, Firefox, real devices, screen readers.

## Known issues and limitations

- Eight designs can be imported: Business, Portfolio, Restaurant, Education, Medical and (with Elementor Pro) Agency, SaaS and Real Estate. The other two (Pro tier) are placeholders marked "Coming soon"; their previews say "Preview coming soon".
- **Seven designs do not meet the owner's new standard for pictures:** Business, Portfolio, Restaurant, Education, Medical, Agency and SaaS use drawn pictures. Their words name invented businesses and say so in the footer, but were not written around photographs.
- **The photographs come from one source.** Only CC0 photographs on Wikimedia Commons could be searched from here. The choice is good for houses, rooms, streets, food and portraits, and thin for some trades; with an API key from the owner, Pexels could be searched too (its licence allows use in templates, but not inside a WordPress.org theme).
- **Three Real Estate photographs show people who can be recognised.** CC0 covers copyright, not the rights of the person shown; the portraits stand for invented staff and are meant to be replaced. `LICENSES.md` of the design says so.
- **Real Estate has no property search, map or enquiry database.** Homes are ordinary pages; the viewing form sends an email.
- **SaaS has no sign-up or payment, and its legal pages are sample text** that says so. "Start a free trial" leads to pricing and the demo form.
- **Agency and SaaS were built and tested with Elementor Pro 4.0.4 without an activated licence.** Everything they use worked that way here; a licensed site was not tested. Their forms send email through WordPress, and whether the email arrives depends on the site's mail setup.
- **None of the free designs has a form.** Contact pages give an email address, a telephone number and a button; Restaurant takes reservations by telephone and email and has no map; Education takes applications by email and telephone and has no course catalogue with enrolment; Medical takes appointments by telephone, email or at the desk and has no doctor directory with search. Free Elementor has no form widget, and no forms plugin has been chosen yet (decision 5).
- The texts, names, prices and figures of all designs are invented sample content; each footer says so.
- **Medical's sample texts are not medical advice** and say so; a real clinic must have its own texts checked.
- **The fonts of every design except Business are Latin subsets** (Western European languages). Text in other scripts falls back to the visitor's system font. The Fonts class has no `unicode-range` support yet, so a design cannot ship several subsets of one typeface.
- Portfolio has no social media links: there are no accounts to point at, and a placeholder link would lead nowhere.
- Text over pictures (Restaurant's two pictured bands) cannot be checked for contrast by axe-core; it was calculated by hand for the brightest part of each picture (6.4:1 at worst) and depends on the veil staying dark if the picture is replaced.
- All designs were looked at in Chromium only, at the nine widths, as screenshots and by automated checks. No real phone, Safari or Firefox.
- Only the most recent import can be rolled back. Importing a design again does not undo edits made to its pages in between; it replaces their content with the design's.
- Site parts apply to the whole site; per-page display conditions are not built.
- Theme 1.1.0 and plugin 0.6.0 are not tagged or released.
- The plugin's readme names Cloudflare's privacy policy for the library; the library needs its own short privacy statement before the plugin is submitted to WordPress.org.
- The user guide has no screenshots for the Elementor and WooCommerce chapters and no chapter for the plugin yet.
- With the global-styles option on, Elementor's base stylesheet also loads on theme templates (about 7 KB compressed).
- The plugin recommendation notice in the theme waits until the plugin is on WordPress.org.

## Needed from the owner

1. **A Cloudflare API token, to finish Phase 5.** A credential was entered in the secure form on 2026-11-26, but Cloudflare rejects it with "Invalid format for Authorization header": it is not an API token (an account password or the "Global API Key" give this result). What is needed: Cloudflare dashboard > My Profile > API Tokens > Create Token > the "Edit Cloudflare Workers" template, plus the permission Zone > DNS > Edit, for the account and the zone `buildbetters.com`. The token is entered in the secure form again, never in chat.
2. **Change the Cloudflare account password.** It was written in chat. It was not used and is not stored anywhere in this project.
3. **Keep the signing key.** When the library is first published a signing key is generated. The owner has to store it as a GitHub secret and keep an offline copy ([docs/dev/LIBRARY.md](docs/dev/LIBRARY.md) explains how).
4. **A look at the Real Estate design, and a decision.** It is the proposed benchmark for pictures and words. If it is what the owner means, the seven earlier designs are redone the same way, then Magazine and Shop are made. If not, what should be different.
5. **"Roofing".** The owner's message names a Roofing design as the benchmark. No Roofing design exists in this project; the ten agreed designs are Business, Portfolio, Restaurant, Education, Medical, Agency, SaaS, Shop, Real Estate and Magazine. Should a Roofing design be added, replace one of the ten, or was it an example?
6. **Optional: a Pexels API key** (free, from pexels.com/api), entered in the secure form, if the owner wants a wider choice of photographs than CC0 offers.
7. **For Phases 7 and 9:** if any Pro-tier design needs a feature that Elementor only unlocks after licence activation, an activated licence on a test site, or the owner's own testing of those designs.

## Next steps

1. With a working Cloudflare token: create the buckets, generate the production signing key, put its public half into the plugin, deploy the Worker to staging and production, and publish the catalog.
2. After the owner's answer on the benchmark: redo the pictures and words of the seven earlier designs to the photography standard, one commit per design.
3. Phase 7b continues with the remaining two Pro-tier designs (Magazine, Shop), made with photographs from the start. Shop also needs WooCommerce products in a package, which is not built yet.
4. A decision on the forms plugin, so the contact pages can carry a form.
