# Project Status — Open Frame Starter Sites

Last updated: 2026-11-27

Architecture: [docs/dev/STARTER-SITES-ARCHITECTURE.md](docs/dev/STARTER-SITES-ARCHITECTURE.md) · Test reports: [docs/dev/TESTING.md](docs/dev/TESTING.md) · Release checklist: [docs/dev/RELEASE.md](docs/dev/RELEASE.md)

## Current state

**All ten designs exist, each illustrated with real photographs.** On 2026-11-26 the owner asked for real photographs instead of drawn pictures, words written for the business shown, and a record of source and licence for every picture, and approved the Real Estate design as the benchmark. The seven designs made before that were then redone, and Magazine and Shop were made that way from the start.

Business, Portfolio, Restaurant, Education and Medical (free), Agency, SaaS, Real Estate, Magazine and Shop (Elementor Pro; Shop also needs WooCommerce) are each imported, checked at nine screen widths, opened in the Elementor editor and rolled back by the automated tests. They share no layout, typeface or color.

**The library is packaged and its publication is rehearsed, but nothing is on Cloudflare yet.** In Phase 8 the ten designs were built into the library as it will be published (227 files, 28 MB), the publication was run against the real Worker code on one machine, and each design was imported from that library into a WordPress site with nothing in it, through the Starter Sites screen. What is still missing before a user can do the same is the deployment itself, which is blocked on a Cloudflare token.

| Phase | Status |
| --- | --- |
| 1. Inspect the repository | Done |
| 2. Architecture and roadmap | Done, approved 2026-11-26 |
| 3. Core theme and design system | Done (theme 1.1.0) |
| 4. Starter Sites dashboard | Done |
| 5. Cloud API and package delivery | Built and tested locally. **Deployment blocked** (see "Needed from the owner") |
| 6. Import engine | **Core done and tested.** Some planned parts are not built yet, listed below |
| 7a. Business starter site | **Done** (plugin 0.3.0, design version 1.0.0) |
| 7b. Nine further starter sites | **Done** (plugin 0.6.0). Free: Portfolio, Restaurant, Education, Medical. Pro: Agency, SaaS, Real Estate, Magazine, Shop |
| 7c. Photographs and matching words for every design | **Done.** The owner approved the Real Estate benchmark on 2026-11-26; Business, Education, Portfolio, Medical, Restaurant, SaaS and Agency were then redone, and Magazine was made that way from the start. Only the five screens of SaaS's invented product are still drawn |
| 8. Package, validate, publish | **Packaged, validated and rehearsed locally. Publication to Cloudflare blocked** (same token as Phase 5). Live demo sites not built |
| 9. QA | **Automated part done** (plugin 0.6.1): three browser engines, three PHP versions, the oldest supported versions, performance, a security review. Open issues are listed with their severity in the test report. **The manual checklist is not done** |
| 10. Documentation and release | **Documents, packages and release tooling done. Nothing released, and the checklist is not signed off.** The theme is ready and waits for the owner; the plugin cannot be released before the library is online ([docs/dev/RELEASE.md](docs/dev/RELEASE.md)) |

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
- **Categories:** `ofss://term/<slug>` becomes the number of a category of the design's posts (for widgets that list posts of one category) and `ofss://category/<slug>` the address of its archive. Needed by the Magazine design.
- **Tests:** a "Reference Shop" fixture; twelve importer checks that run when WooCommerce is active in the test site (CI runs the importer checks a second time with it); six new library tool checks.
- **Not built:** variable products, attributes, stock, tax and shipping settings, and Elementor Pro's shop templates. The store pages are WooCommerce's, styled by the theme.

### Phase 7b, part 8: the Magazine design

- **The design** (`starter-sites/magazine`, brief in `brief.md`): the fictional quarterly "Common Ground". A front page, three sections (Places, Table, Craft), nine stories, a writer's page, About, Subscribe, Contact and a page of all stories. Six Theme Builder templates, Literata with Public Sans, black rules on white with one red.
- **Photographs first:** fourteen CC0 photographs were chosen, then each story was written about what its photograph shows. No story names a real place.
- **A front page that follows the posts:** four Posts widgets show the newest stories of each section, and a story shown once is not shown again. The sections are bound to categories by name (`ofss://term/places`), which the importer turns into numbers.
- **Found by the tests and fixed:** dates and section names were set smaller than 13px; stories had no subheading; a section page said "Category: Table" where the magazine says "Table".

### Phase 7c: photographs for the seven earlier designs

- **How it was done:** for each design the photographs were chosen from contact sheets (by helper agents working to one written brief, then checked by eye), fetched with their licences re-read, and the texts were rewritten to match: clients, dishes, courses and people are described as their pictures show them.
- **What changed in the texts,** for example: Business's logistics client is a container terminal; Portfolio's skincare client is a pottery; Restaurant's four pictured dishes are renamed; Agency's Volt is an electricity company; every footer says the content is a sample, and every quote says it is a sample quote.
- **Medical shows its doctors without portraits,** because the free photographs of clinicians are of real, named hospital staff.
- **SaaS keeps five drawings:** the screens of its invented product.
- **No photograph is used in two designs.** Six duplicates between the helpers' choices were found and replaced.

### Phase 7b, part 9: the Shop design

- **The design** (`starter-sites/shop`, brief in `brief.md`): the fictional shop "Sill & Shelf". Home, Lookbook, About, Shipping and Returns, a journal with three articles, Contact, and WooCommerce's shop, product, basket, checkout and account pages. Outfit with Work Sans; a soft white page with sand, sage and one terracotta.
- **Eight products** come with the design, each named and described after its photograph; four are featured on the home page through Elementor Pro's Products widget. The header has Pro's Menu Cart.
- **WooCommerce's own pages are styled by the theme,** not built as Elementor templates. The design's colors and typefaces reach them through the theme's "follow Elementor" option.
- **Found by the tests and fixed in the importer:** a link from an article to a product was empty, because the product did not exist yet when the article was created; a PHP warning for products in the step that builds pages.

### Phase 8: package, validate, publish (as far as it goes without Cloudflare)

- **A published version cannot change any more.** `publish --live` downloads what is live and compares it with the build before uploading: unchanged files are skipped, and a design that changed while its version number stayed the same stops the publication before the first upload. Until now this was a rule in the manual only, although those files are cached for a year.
- **Preview pictures carry their checksum in their name,** for the same reason: a replaced picture would otherwise not reach anyone who had seen the old one.
- **The live library can be checked** (`check-live`): the catalog and every file it leads to are downloaded, and the signature and each checksum are verified, the way a user's site reads them. `plan` shows what a publication would upload, skip or refuse.
- **The workflow** creates the bucket if it is missing, publishes with the comparison, and ends with the live check. Uploads run four at a time and are retried; the catalog is still replaced last.
- **A rehearsal without Cloudflare** (`tests/library/rehearsal.sh`): the real Worker with a simulated bucket, a publication, a second publication, an attempt to change a published version, then a clean WordPress installed from the theme and plugin ZIPs, on which every design is imported from the Starter Sites screen, visited link by link, and rolled back. CI runs it for the five free designs on every push.
- **One licence overview for the library** (`starter-sites/LICENSES.md`): 142 photographs, 5 drawn pictures and the fonts of every design, written from the designs' own records and tested against them.
- **The build refuses an icon Elementor does not have.** Found by the rehearsal: Business's contact page named its address icon after Font Awesome 6, so the row had no icon. Corrected.
- **Not built: live demo sites.** They need a host that runs WordPress (and a licensed Elementor Pro for five of them). No design has a demo address; the screen shows the demo link only when one exists.
- **Not done: the production signing key and the publication itself.** Both wait for the Cloudflare token.

### Phase 9: QA (plugin 0.6.1)

- **Three browser engines.** The browser checks can run in Firefox and in WebKit, the engine of Safari, as well as in Chromium (`OFT_BROWSER`).
- **Three PHP versions and the oldest supported versions.** The plugin and import engine checks run on PHP 7.4, 8.1 and 8.3. Every design was imported on a clean site with PHP 7.4, WordPress 6.8, Elementor 4.0.3 and WooCommerce 10.0.0, and with PHP 8.1 and the newest versions. On WordPress 6.4 the theme works and the plugin's screen says what the designs need.
- **Two more kinds of site:** plain permalinks, and a site that already has pages, a post, a menu and a static front page.
- **Found and fixed, front end:** the stylesheets of a free design's header and footer were loaded at the end of the page, so the header appeared unstyled and the page jumped; lists of articles in the Pro designs used 300-pixel pictures in spaces up to 750 pixels wide, and jumped after loading; hero backgrounds were downloaded at full width on phones; WordPress re-saved the smaller picture sizes at a higher quality than the pictures have.
- **Found and fixed, compatibility:** Elementor 4.0.0 to 4.0.2 with Elementor Pro load a font from Google on every page, so the designs now need Elementor 4.0.3; on WordPress 6.8 the screen could not install WooCommerce (its current version needs WordPress 7.0) and did not say why.
- **Security review** by a second reviewer: nothing of high or critical severity. The plugin now checks a design's pages again before storing them (no raw HTML or shortcode widgets, script, frames, style blocks, hand-written CSS or attributes), refuses a catalog older than the one it has, and cleans the values of a design's Site Settings. Removing the plugin also removes what an unfinished import left.
- **Performance measured** with Lighthouse (mobile, slow 4G): eight of ten home pages score 85 or more, all stay under 0.1 layout shift and under 1.2 MB. The 2.5-second target for the largest paint is met by none in that simulation.
- **A manual checklist** for what a machine cannot check: [docs/dev/QA-CHECKLIST.md](docs/dev/QA-CHECKLIST.md).

### Phase 10: documentation and release (as far as it goes without a release)

- **User guide for the plugin**, [docs/STARTER-SITES.md](docs/STARTER-SITES.md): 17 chapters from installing to removing, with 11 screenshots, 9 of them with numbered markers explained in a table. Its statements were checked against the code and the designs' sources.
- **Theme guide**: the Elementor and WooCommerce chapters have pictures now, and a section that leads to the starter sites.
- **Installation guide**, [docs/INSTALL.md](docs/INSTALL.md): what to download, installing, checking a download against its checksum, updating, removing, and what the usual error messages mean.
- **Support and update policy**, [docs/SUPPORT.md](docs/SUPPORT.md): where to get help, what is and is not supported, how version numbers are chosen, how updates reach a site today and after WordPress.org, security reports, what happens if the library or the project ends. It makes promises in the owner's name and waits for the owner's agreement.
- **Developer reference for the plugin**, [docs/dev/PLUGIN.md](docs/dev/PLUGIN.md): the three hooks, the two constants, the REST routes, what is stored, how an import runs, how to run a library of one's own.
- **Changelogs**: [CHANGELOG.md](CHANGELOG.md) gathers the two `readme.txt` changelogs and the versions of the designs; it is generated, so it cannot drift.
- **All four guides as HTML pages** (`docs/*.html`) with links between them, built by `bin/build-docs.js`.
- **Screenshots by script**: `bin/docs-shots.js` takes every picture of the plugin guide from a running test site and draws the markers, so the pictures can be retaken when the screen changes.
- **Release tooling**: `bin/release-package.sh` checks that version numbers agree and a changelog entry exists, builds the ZIP with its checksum and the text of the release page, and refuses a package with development files in it. The Release workflow publishes the theme and the plugin separately (`v1.1.0`, `starter-sites-v0.6.1`). The script refuses to release the plugin while it has no public key of the library.
- **Release checklist**, [docs/dev/RELEASE.md](docs/dev/RELEASE.md): what is done, what the machine confirmed, the ten points only the owner can confirm, the order of the steps that unblock the plugin, how a release is made, and what to expect from WordPress.org.
- **CI**: a new job builds the guides and compares them with what is committed, checks every link and picture, and packages both products.
- **The plugin's readme** describes the ten designs instead of "an early version", answers four more questions and lists its screenshots; five unmarked screenshots for its WordPress.org page are in `.wordpress-org/`.
- **Found while taking the screenshots, and fixed (plugin 0.6.1, unreleased):** the confirmation before an import named a wrong number of pages (12 for Business, which has 10); on a fast server the progress bar stood at 0% for ten seconds and jumped to the end.

## Verified (executed 2026-11-27, unless a line says otherwise)

After the Phase 10 changes to the plugin:

- Plugin PHP checks **145 of 145** on PHP 7.4, 8.1 and 8.3. Import engine on PHP 8.3 **102**, **115** with WooCommerce, **114** with Elementor Pro, all passing; plain on PHP 7.4 and 8.1 **102 of 102**.
- Browser checks in Chromium: **149 of 149**.
- Library tools 74 of 74. PHPCS exit code 0. Theme Check: 0 required, 0 warnings. Plugin Check: no errors found.
- Release packaging: theme package built and its checksum verified; the plugin refused for want of the library's public key, as intended, and a trial package built and verified. Links and pictures of the guides: 522 checked, 0 broken.

From Phase 9, before those changes, not repeated (Firefox, WebKit, the version matrix, Lighthouse):


- Browser checks, all 149: Chromium **149 of 149**; Firefox 155 **149 of 149** (second complete run; the first found five faults in the checks themselves, none in the product); WebKit 26.6 **149 of 149** (second complete run; the first found faults in the checks and one internal error of WebKit itself). Two checks were added for every page: styles loaded in the head, no picture stretched beyond its file.
- Every design imported from the Starter Sites screen on a clean site, visited link by link and rolled back: **10 of 10** on PHP 8.3 with the newest versions, **10 of 10** on PHP 8.1, **10 of 10** on PHP 7.4 with WordPress 6.8, Elementor 4.0.3 and WooCommerce 10.0.0; **3 of 3** on a site with plain permalinks and existing content.
- Plugin PHP checks: **145 of 145** on each of PHP 7.4, 8.1 and 8.3. Import engine: **102**, **115** with WooCommerce and **114** with Elementor Pro, all passing, on each of the three.
- Library tools: 74 of 74. Worker: 10 of 10.
- PHPCS (`composer lint`): exit code 0. Theme Check: 0 required, 0 warnings. Plugin Check on plugin 0.6.1: no errors found.
- Lighthouse, mobile: Business 92, Portfolio 82, Restaurant 87, Education 92, Medical 92, Creative Agency 92, SaaS 93, Real Estate 81, Magazine 87, Shop 87.

From Phase 8 (2026-11-26), not repeated:


- **Rehearsal of the publication:** 227 files uploaded to the simulated bucket through wrangler; the library served by the Worker was downloaded again and every checksum was valid; a second publication had 1 file to upload (the catalog) and 226 unchanged; a changed Business 1.0.0 was refused and the live catalog stayed as it was.
- **Rehearsal of the import:** 10 of 10 designs imported on a clean WordPress site from the Starter Sites screen, which activated Elementor, Elementor Pro and WooCommerce where a design needs them; 17 to 37 pages visited per design with every picture loading, no script error and no leftover reference; every import rolled back, and the site compared with what it was before.
- The library built with the production addresses: signature and every checksum valid.


## Not verified

- **The release itself.** No tag, no GitHub release, no submission to WordPress.org. The Release workflow has not run since it was changed; its checking and packaging were run as a script.
- **The guides, by anyone but their author.** Nobody has yet followed them as a first-time user.
- **Everything on the manual checklist:** a real phone, Safari on a Mac, a screen reader, Elementor Pro with an activated licence, an order in the Shop, an import on an ordinary shared host.
- **Anything on Cloudflare.** The real R2 bucket, the two host names, DNS, the edge cache and the "Publish library" workflow have not run; the Worker has only run on this machine with a simulated bucket. The exit criterion of Phase 8, "each site imported from production on a clean install", is met against a local Worker only.
- Right-to-left languages, multisite, servers that need FTP details to install plugins, updating an outdated plugin through the screen, a hard memory limit of 128 MB.
- WebKit on Linux is the engine of Safari, not Safari: fonts, scrolling and form controls of macOS and iOS are not covered by it.

## Known issues and limitations

- All ten designs can be imported. The five Pro designs need Elementor Pro, which the plugin does not install; Shop also needs WooCommerce, which the Starter Sites screen installs from WordPress.org.
- **The photographs come from one source.** Only CC0 and public-domain photographs on Wikimedia Commons could be searched from here; most are pictures Unsplash released as CC0 before 2017. The choice was good for rooms, food, places and objects, thin for healthcare and for teams at work, and its neutral portraits are nearly used up. With a Pexels API key the choice would be wider (never inside the theme: its licence is not accepted there).
- **Photographs of people.** About two dozen pictures across the designs show a person who can be recognised. CC0 covers copyright, not the rights of the person shown; they stand for invented staff and are meant to be replaced. Each design's `LICENSES.md` names them.
- **The pictures were judged by the implementer, not by the owner,** except Real Estate, which the owner approved.
- **Shop sells nothing until its owner sets it up.** No payment method, shipping rate or tax rule comes with the design; products are simple ones without sizes, colours or stock counts; the shipping and returns page is sample text.
- **Shop's store pages are not Elementor templates.** Shop, product, basket, checkout and account are WooCommerce's pages styled by the theme; they cannot be rearranged in Elementor.
- **On a device without an emoji font,** WordPress fetches the magnifier of WooCommerce's product gallery from s.w.org. For that reason the product page is not among the pages the "asks no other site for anything" check visits.
- **Magazine's writers are not WordPress users.** Each story names its writer in its first line; the writer's page is an ordinary page.
- **Medical shows its doctors without portraits.** Free photographs of clinicians are almost all of real, named hospital staff; an invented doctor's name under a real person's face would mislead, so each doctor has a name, a specialty and a round mark, and a clinic adds its own photographs.
- **The pool of free, neutral portraits is small.** Three designs (Real Estate, Business, Education) use it for staff; each portrait is used in one design only, and what is left is mostly fashion photography.
- **Real Estate has no property search, map or enquiry database.** Homes are ordinary pages; the viewing form sends an email.
- **SaaS has no sign-up or payment, and its legal pages are sample text** that says so. "Start a free trial" leads to pricing and the demo form.
- **The five Pro designs were built and tested with Elementor Pro 4.0.4 without an activated licence.** Everything they use worked that way here; a licensed site was not tested. Their forms send email through WordPress, and whether the email arrives depends on the site's mail setup.
- **None of the free designs has a form.** Contact pages give an email address, a telephone number and a button; Restaurant takes reservations by telephone and email and has no map; Education takes applications by email and telephone and has no course catalogue with enrolment; Medical takes appointments by telephone, email or at the desk and has no doctor directory with search. Free Elementor has no form widget, and no forms plugin has been chosen yet (decision 5).
- The texts, names, prices and figures of all designs are invented sample content; each footer says so.
- **Medical's sample texts are not medical advice** and say so; a real clinic must have its own texts checked.
- **The fonts of every design except Business are Latin subsets** (Western European languages). Text in other scripts falls back to the visitor's system font. The Fonts class has no `unicode-range` support yet, so a design cannot ship several subsets of one typeface.
- Portfolio has no social media links: there are no accounts to point at, and a placeholder link would lead nowhere.
- Text over pictures (Restaurant's two pictured bands) cannot be checked for contrast by axe-core; it was calculated by hand for the brightest part of each picture (6.4:1 at worst) and depends on the veil staying dark if the picture is replaced.
- All designs were looked at in Chromium only, at the nine widths, as screenshots and by automated checks. No real phone, Safari or Firefox.
- Only the most recent import can be rolled back. Importing a design again does not undo edits made to its pages in between; it replaces their content with the design's.
- Site parts apply to the whole site; per-page display conditions are not built.
- **No live demo sites.** A user sees four preview pictures of a design before importing, not a working site.
- Theme 1.1.0 and plugin 0.6.0 are not tagged or released.
- The plugin's readme names Cloudflare's privacy policy for the library; the library needs its own short privacy statement before the plugin is submitted to WordPress.org.
- The user guide has no screenshots for the Elementor and WooCommerce chapters and no chapter for the plugin yet.
- With the global-styles option on, Elementor's base stylesheet also loads on theme templates (about 7 KB compressed).
- The plugin recommendation notice in the theme waits until the plugin is on WordPress.org.

## Needed from the owner

1. **One more permission on the Cloudflare token, to finish Phases 5 and 8.** State on 2026-11-27: `buildbetters.com` is now on Cloudflare and active (since 05:13 UTC; its name servers are Cloudflare's), and the token is valid. With it the DNS records of the domain can be read and changed and the account's Workers can be listed. What it cannot do: use R2, the file storage the library is kept in (Cloudflare answers "Authentication error"), or read the account's settings. Needed: a token made from the template "Edit Cloudflare Workers" with "Account Resources" set to the owner's account and "Zone Resources" to `buildbetters.com`, plus the permission Zone > DNS > Edit; that template includes "Workers R2 Storage: Edit". R2 also has to be switched on once in the dashboard (R2 Object Storage); Cloudflare asks for a payment card there, although the library's 28 MB are far inside the free 10 GB. If the owner prefers not to add a card, the library can be served as static files of the Worker instead of from R2; that is a change to the publishing tools, not to the plugin or the designs, and has not been built.
2. **Change the Cloudflare account password.** It was written in chat. It was not used and is not stored anywhere in this project.
3. **Keep the signing key.** When the library is first published a signing key is generated. The owner has to store it as a GitHub secret and keep an offline copy ([docs/dev/LIBRARY.md](docs/dev/LIBRARY.md) explains how).
4. **A look at the nine designs the owner has not seen in full.** Preview pictures were sent for each; the pictures and words of Business, Portfolio, Restaurant, Education, Medical, Agency, SaaS, Magazine and Shop were chosen without the owner. Anything that does not fit can be swapped: one photograph is one line in `photo-sources.json`.
5. **Optional: a Pexels API key** (free, from pexels.com/api), entered in the secure form, if the owner wants a wider choice of photographs than CC0 offers, above all for portraits and healthcare.
6. **Optional: a decision on Medical's doctors.** They are shown without portraits. If the owner has photographs of people who agree to be shown, or prefers stock portraits in plain clothes, they can be added.
7. **A decision on live demos.** A working demo of each design needs a WordPress host (one site with ten sub-sites would do), and an Elementor Pro licence that covers it for the five Pro designs. Without it the designs are shown through their preview pictures only.
8. **The manual checklist** ([docs/dev/QA-CHECKLIST.md](docs/dev/QA-CHECKLIST.md)): about two hours with a throw-away WordPress site, a phone, Safari and Firefox, and Elementor Pro with a licence for the five Pro designs. It is the part of QA only a person can do.
9. **Read and agree to the support and update policy** ([docs/SUPPORT.md](docs/SUPPORT.md)). It says, in the owner's name: no guaranteed response time, security reports through GitHub's private reporting (to be switched on in the repository's settings), and 90 days' notice before the library would ever be switched off. Anything the owner does not want to promise should be changed before a release.
10. **The word to release the theme**, and later the plugin. Nothing is tagged, published or submitted without it. For WordPress.org the owner's account is needed, and for the plugin's page a banner and an icon.

## Next steps

The order is the one in [docs/dev/RELEASE.md](docs/dev/RELEASE.md).

1. **The theme can be released now**, on the owner's word: merge the branch into `main`, run the Release workflow for the theme, and upload the ZIP to WordPress.org. The manual checklist should come first.
2. With a token that may use R2 (or the decision to do without R2): generate the production signing key and put its public half into the plugin, publish to staging, run the import test against staging, then publish to production and repeat it there. That closes Phases 5 and 8 and unblocks the plugin.
3. The manual checklist, and fixes for what it finds.
4. Release the plugin, then submit it to WordPress.org with a banner and an icon.
5. Decisions still open: the forms plugin for the free designs, live demos, Medical's doctors, the version number of the first public plugin release, and the owner's agreement to the support and update policy.
