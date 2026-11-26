# Open Frame — Test Reports

- [Package and publish](#package-and-publish--test-report): Phase 8, a rehearsal with the real Worker; nothing is on Cloudflare yet
- [All ten designs with photographs](#all-ten-designs-with-photographs--test-report): Phase 7b complete, Phase 7c
- [Products of a store](#products-of-a-store--test-report): plugin 0.6.0, groundwork for the Shop design
- [Real Estate and the photography standard](#the-real-estate-starter-site-and-the-photography-standard--test-report): Phase 7b, part 7; the first design with real photographs
- [SaaS starter site](#the-saas-starter-site--test-report): Phase 7b, part 6
- [Agency starter site](#the-agency-starter-site--test-report): Phase 7b, part 5; the first design for Elementor Pro
- [Theme Builder templates in a package](#theme-builder-templates--test-report): groundwork for the Pro tier
- [Medical starter site](#the-medical-starter-site--test-report): Phase 7b, part 4; the free tier is complete
- [Education starter site](#the-education-starter-site--test-report): Phase 7b, part 3
- [Restaurant starter site](#the-restaurant-starter-site--test-report): Phase 7b, part 2, the first dark design
- [Portfolio starter site and fonts of a design](#the-portfolio-starter-site--test-report): Phase 7b, part 1
- [Business starter site](#the-business-starter-site--test-report): Phase 7a, the first real design
- [Import engine](#the-import-engine--test-report): Phase 6, importing, resuming and rolling back
- [Library tools, Worker and signatures](#the-library--test-report): Phase 5, without a live deployment
- [Starter Sites plugin 0.1.0](#open-frame-starter-sites-010--test-report): the companion plugin's dashboard
- [Version 1.1.0](#open-frame-110--test-report): Elementor, WooCommerce and replaceable locations
- [Version 1.0.1](#open-frame-101--test-report): the full theme

# Package and publish — Test Report

Phase 8. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2, Elementor Pro 4.0.4 (installed, not activated with a licence), WooCommerce 11.3.1 and wrangler 4, in Chromium.

**Nothing was published to Cloudflare.** The credential saved for `api.cloudflare.com` is still rejected by Cloudflare ("Invalid format for Authorization header"), so no bucket, Worker or domain exists. What could be done without Cloudflare was done: the publication was rehearsed on one machine with the real Worker code and a simulated bucket, and every design was imported from that library on a clean WordPress site.

| Suite | Result |
| --- | --- |
| Rehearsal: publication (`tests/library/rehearsal.sh`, steps 1 to 4) | **Passed.** 227 files uploaded; live library downloaded and every checksum valid; second publication: 1 file to upload, 226 unchanged; a changed Business 1.0.0 refused and the live catalog untouched |
| Rehearsal: import on a clean site (step 6) | **10 of 10 designs** imported from the Starter Sites screen, every reachable page visited, rolled back, site equal to before |
| Library tools | **66 of 66 passed** (60 before; new: preview names, publish plan, live check, licence overview, two icon rules) |
| Worker | **10 of 10 passed** |
| Plugin PHP checks | **138 of 138 passed** |
| Import engine | **83 of 83** plain, **96 of 96** with WooCommerce, **95 of 95** with Elementor Pro |
| All browser checks together | **149 of 149 passed**, run again because the library the test site reads is built by the changed tools |
| PHPCS, theme and plugin (`composer lint`) | **Exit code 0** |
| Theme Check, Plugin Check | Not run on this machine in this phase (neither the theme nor the plugin changed). Both passed in CI run 38 on GitHub, together with every other job |
| Build with the production addresses | 10 designs, 227 files, 28 MB; signature and every checksum valid; `publish --dry-run` lists 227 uploads with the catalog last. `plan` against `api.buildbetters.com` stops with "Could not ask … Nothing was uploaded", as it should while nothing is there |

**In CI.** The new job "Library rehearsal" ran on GitHub for the first time with this change and passed in under six minutes: the same script, with the five designs for free Elementor (Elementor Pro is not available there).

**What the rehearsal does.** It builds the theme and plugin ZIPs; builds and signs the library with a key made for the rehearsal; starts `cloud/worker` under `wrangler dev` with an empty simulated R2 bucket; uploads with the same `publish` command the workflow uses; downloads everything again through the Worker and checks it; publishes again; and tries to publish a Business whose home page changed while its version stayed 1.0.0. Then it installs WordPress with nothing in it (one sample page, one sample post, the permalinks WordPress chooses on a working host), installs the theme and the plugin **from the ZIPs**, and for each design restores that clean state and does what a new user does: opens Appearance > Starter Sites, opens the design, presses "Activate" for each plugin the design needs, imports, and rolls back.

| Design | Plugins the screen activated | Import | Pages visited | Pictures seen | Rolled back cleanly |
| --- | --- | --- | --- | --- | --- |
| Business | Elementor | 10 pages, 15 images, 1 menu, 10 s | 19 | 32 | yes |
| Creative Agency | Elementor, Elementor Pro | 9 pages, 15 images, 1 menu, 11 s | 20 | 35 | yes |
| SaaS | Elementor, Elementor Pro | 11 pages, 12 images, 1 menu, 8 s | 22 | 30 | yes |
| Portfolio | Elementor | 9 pages, 15 images, 1 menu, 11 s | 17 | 33 | yes |
| Shop | Elementor, Elementor Pro, WooCommerce | 6 pages, 17 images, 1 menu, 14 s | 37 | 66 | yes |
| Restaurant | Elementor | 8 pages, 16 images, 1 menu, 10 s | 17 | 36 | yes |
| Real Estate | Elementor, Elementor Pro | 10 pages, 18 images, 1 menu, 12 s | 22 | 41 | yes |
| Education | Elementor | 9 pages, 16 images, 1 menu, 9 s | 17 | 37 | yes |
| Medical | Elementor | 10 pages, 9 images, 1 menu, 8 s | 19 | 20 | yes |
| Magazine | Elementor, Elementor Pro | 6 pages, 14 images, 1 menu, 9 s | 30 | 54 | yes |

On every visited page: HTTP 200, every picture loads, exactly one main heading, no script error, no leftover `ofss://` reference, and no request to another site except the two WordPress itself makes on a site without content of its own (the avatar of the sample comment, `secure.gravatar.com`, and the emoji picture of WooCommerce's product gallery, `s.w.org`). After the rollback: no post or term marked by the import, the same number of attachments and menus, the same home page setting and theme settings as before the import.

**Found by the rehearsal, and fixed.**

| Where | What |
| --- | --- |
| Business, contact page | The address row had no icon (after the correction all four rows of the list show theirs, and Elementor logs nothing). The design named it `location-dot`, a Font Awesome 6 name; Elementor carries Font Awesome 5 and silently leaves an unknown icon out. Elementor wrote a PHP warning, which the browser checks did not count because it is not from the theme or the plugin. Now `map-marker-alt`, and the build refuses any icon Elementor does not have (`tools/icons.json`) |
| Publishing | Preview pictures were served with a one-year cache under a name that never changed, so a replaced picture would not have reached anyone who had seen the old one. Their names now contain their checksum |
| Publishing | Nothing stopped a design from being changed without a new version number, although its files are cached for a year and the catalog names their checksums: sites with the old copy would have refused the import. `publish --live` now refuses it |
| Rehearsal script | My first version waited for the wrong row when two plugins had to be activated one after the other, and started the Worker in a way that kept the script from ending. Both corrected before the run reported here |

**Not checked, because it needs Cloudflare.**

- The real R2 bucket, the two host names, DNS, HTTPS certificates and the edge cache, including how long a replaced catalog takes to be the one served.
- The "Publish library" workflow in GitHub Actions; its steps were run by hand here, with wrangler in local mode.
- An import from `api.buildbetters.com`. The roadmap's exit criterion for this phase, "each site imported from production on a clean install", is met against a local Worker, not against production.
- wrangler's simulated bucket is not R2: it behaved the same for everything used here (put, get, ETag, conditional requests), but it is a simulation.

**Not done in this phase.**

- **Live demo sites.** They need a host that runs WordPress, and a licensed Elementor Pro for five of them. No design has a demo address, and the screen shows the "Open the live demo" link only when one exists.
- **The production signing key.** It is generated at the first real publication, when its private half can be stored as a GitHub secret straight away.
- Other permalink settings (plain, or a custom structure), multisite, and a site that already has content were not part of the rehearsal; the import engine checks cover an existing site.

# All ten designs with photographs — Test Report

Phase 7b complete and Phase 7c, plugin 0.6.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2, Elementor Pro 4.0.4 (installed, not activated with a licence) and WooCommerce 11.3.1, in Chromium.

| Suite | Result |
| --- | --- |
| All browser checks together | **149 of 149 passed** (11 for each of the ten designs, 18 theme integrations, 21 Starter Sites screen) |
| Import engine | **83 of 83** without Elementor Pro and WooCommerce, **96 of 96** with WooCommerce (13 checks for products), **95 of 95** with Elementor Pro (12 checks for Theme Builder templates) |
| Plugin PHP checks | **138 of 138 passed** |
| Library tools, Worker | **60 of 60** and **10 of 10 passed** |
| PHPCS, theme and plugin | Both commands end with **exit code 0** |
| Theme Check, Plugin Check 2.2.0 | Theme Check: **0 required, 0 warnings** (1 recommended, 1 info, as before). Plugin Check: **no errors found** |

**What the browser checks cover.** Eleven checks for each of the ten designs (import, every address at nine widths, menu, links, journal or blog, "page not found", axe-core, typefaces, global styles, the Elementor editor, rollback), plus the 18 theme integrations and the 21 checks of the Starter Sites screen. Each design was also run on its own after its pictures were changed; those runs are named in the commit of each design.

**What changed in the checks.**

- A design with a store switches WooCommerce on for its checks and off afterwards.
- A link that only opens a panel (the basket in the header, marked `aria-expanded`) is not followed as a link.
- A design may mix drawn product screens with photographs: the library tests ask for a record with a free licence for every picture that is not original artwork.
- Footers are recognised by "Sample content", which every footer now says.

**Found by the checks while the designs were redone, and fixed.**

| Where | What |
| --- | --- |
| Importer | A link from an article to a product stayed empty, because the product was created after the article. Links are now filled in once everything exists |
| Importer | A PHP warning for products in the step that builds Elementor pages |
| Magazine | Dates and section names under 13px; stories without a subheading; "Category: Table" where the magazine says "Table" |
| Education | A preview picture taken from an address that does not exist (a "page not found" page); retaken |
| Portfolio | One photograph over the size budget |
| Library tests | Failed for SaaS after it was pushed, because five of its pictures are drawings; corrected in the next commit |
| Six pictures | The same photograph chosen for two designs; one of each pair replaced |

**Photographs.** 142 photographs in ten designs, every one recorded on Wikimedia Commons as CC0 or public domain when it was fetched; the record of each (source page, photographer, licence, date) is in the design's `photos.json` and `CREDITS.md`. They were chosen from contact sheets and looked at again as crops, at the size and shape their place needs.

**Not checked.**

- Whether the people who released the photographs had the right to, and whether the people shown agreed; no releases exist.
- The owner has seen preview pictures of every design but has approved only Real Estate.
- Ordering in the Shop: no payment or shipping is set up, so nothing beyond the basket was tried.
- Elementor Pro with a licence; Safari, Firefox, real phones; screen readers.

# Products of a store — Test Report

Plugin 0.6.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2 and WooCommerce 11.3.1.

| Suite | Result |
| --- | --- |
| Import engine with WooCommerce active, `tests/php/importer.php` | **92 of 92 passed** (the 80 as before and 12 for products) |
| Import engine without WooCommerce | **80 of 80 passed**; the product checks are skipped with a message |
| Plugin PHP checks | **138 of 138 passed** |
| Library tools | **59 of 59 passed** (6 new) |
| Starter Sites screen, `tests/e2e/starter-sites.test.js` | **21 of 21 passed** |
| PHPCS, plugin | **exit code 0** |

The twelve product checks import the "Reference Shop" fixture and look at the two products through WooCommerce's own functions: type and status, name, address, regular and sale price, picture and gallery, the "featured" mark, the shared category, a link from one product's description to the other, links from a page to the shop and to a product, the tags that let a rollback find them; then the plugin's rollback, after which neither products nor category exist and the test site matches its state before the import.

**Not run for this change:** the browser checks of the eight designs (their code path is unchanged apart from two shared patterns; they run again with the next design), Theme Check and Plugin Check.

# The Real Estate starter site and the photography standard — Test Report

Phase 7b, part 7, plugin 0.5.0, design version 1.0.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2 and Elementor Pro 4.0.4 (installed, not activated with a licence), in Chromium.

| Suite | Result |
| --- | --- |
| Real Estate, `tests/e2e/real-estate.test.js` | **11 of 11 passed** |
| All browser checks together | **127 of 127 passed** (11 for each of the eight designs, 18 theme integrations, 21 Starter Sites screen) |
| Import engine, plugin PHP checks, library tools | **80 of 80** without Elementor Pro and **92 of 92** with it, **138 of 138, 53 of 53 passed** |
| PHPCS | Theme 42 files, plugin 26 files: **0 errors, 0 warnings**, after a correction (see below) |
| Theme Check, Plugin Check 2.2.0 | Theme Check: **0 required, 0 warnings** (1 recommended, 1 info, as before). Plugin Check: **no errors found** |

The eleven checks are the shared ones in their Pro form (see the Agency report), on twelve addresses (ten pages, an article, an address that does not exist) at the nine widths: 108 page views. Headings in Newsreader, text in Manrope, both from the site's own address; no request to another host, so no photograph is loaded from where it was found. axe-core on all twelve addresses at 390 and 1440 px: no violations, with the one rule switched off for Pro designs that the Agency report explains.

**Correction to the Agency and SaaS reports.** Both said PHPCS found nothing in the plugin. That was wrong: CI reported three comment-alignment errors in `src/Import/TokenResolver.php`, introduced with the Agency commit, and both CI runs failed on them. The local check had been read through a pipe, which hid its exit code. The three lines are corrected, both PHPCS commands now end with exit code 0 when run on their own, and the other suites of those two reports are unaffected.

**Photographs.** Which sources could be used was tested, not assumed:

| Source | What happened from the test environment |
| --- | --- |
| Pexels (site), Pixabay, StockSnap | Refused with 403: they do not serve automated visitors |
| Pexels API | Answers, and asks for a key (401). No key was available |
| Unsplash (site) | Sends automated visitors to a check that was not worked around |
| Openverse API | Throttled: its allowance for anonymous requests from this address was used up |
| Wikimedia Commons API | Works, with pauses when it asks for fewer requests |

All eighteen photographs therefore come from Wikimedia Commons. For each one, `photos.mjs fetch` read the licence from Commons on the day of the build and got "CC0"; anything else would have stopped it. The library tests now check that every photograph of such a design has a record with a source page on Commons, a photographer and a free licence, and hold it to a budget of 360 KB per picture and 4 MB per design (Real Estate: 3.1 MB; the largest picture 348 KB).

**Checked by eye**, on screenshots at 1440 and 390 px: every home in a list is whole and recognisable in its crop; the three portraits keep the face in the upper half; no subject is cut off on a phone.

**Not checked:** the photographs on Commons were taken at face value as to who took them and that the person who released them had the right to; no model or property releases exist for them. Pictures were judged by one reviewer, not by the owner yet.

# The SaaS starter site — Test Report

Phase 7b, part 6, plugin 0.5.0, design version 1.0.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2 and Elementor Pro 4.0.4 (installed, not activated with a licence), in Chromium.

| Suite | Result |
| --- | --- |
| SaaS, `tests/e2e/saas.test.js` | **11 of 11 passed** |
| All browser checks together | **116 of 116 passed** (11 for each of the seven designs, 18 theme integrations, 21 Starter Sites screen) |
| Import engine, plugin PHP checks, library tools | **80 of 80** (import engine without Elementor Pro; its 92 checks with Pro were last run for the Agency report and no PHP has changed since), **138 of 138, 53 of 53 passed** |
| PHPCS (no PHP changed since the Agency report) | Theme 42 files, plugin 26 files: **0 errors, 0 warnings** |
| Theme Check, Plugin Check 2.2.0 | Theme Check: **0 required, 0 warnings** (1 recommended, 1 info, as before). Plugin Check: **no errors found** |

The eleven checks are the shared ones in their Pro form (see the Agency report), on thirteen addresses (eleven pages, an article, an address that does not exist) at the nine widths: 117 page views. Headings in Sora, text in DM Sans, both from the site's own address; no request to another host. axe-core on all thirteen addresses at 390 and 1440 px: no violations, with the one rule switched off for Pro designs that the Agency report explains.

**Contrast, measured:** headings on white 18.5:1; text 7.9:1 on white and 7.3:1 on the tinted bands; rose (links, pills, check marks) 5.5:1 on white and 5.1:1 on the tinted bands; ink on the gradient 5.9:1 at its pink end and 7.9:1 at its orange end; text on the ink bands 9.8:1.

**Found by the tests and fixed:**

1. axe-core, color contrast, only at 390 px: a grey line of company names is large text on a desktop and small text on a phone, where 3.2:1 is not enough. It is darker now (5.0:1).
2. axe-core, "Links must be distinguishable without relying on color": a link in a paragraph of the privacy page. The theme now underlines links in Elementor's Text Editor widget.
3. Twelve sections had no space below them.
4. The preview picture was 681 KB, over the library's 400 KB limit, because of the gradient. It is a 256-color PNG of 119 KB now, and the preview tool warns about this.

## Not covered

As for Agency: a licensed Elementor Pro, sending the form, and CI (which has no Elementor Pro). The Price Table widgets were checked for layout, text and accessibility; their "Popular" ribbon is Elementor Pro's.

# The Agency starter site — Test Report

Phase 7b, part 5, plugin 0.5.0, design version 1.0.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2 and **Elementor Pro 4.0.4, installed and not activated with a licence**, in Chromium.

| Suite | Result |
| --- | --- |
| Agency, `tests/e2e/agency.test.js` | **11 of 11 passed** |
| All browser checks together | **105 of 105 passed** (11 for each of the six designs, 18 theme integrations, 21 Starter Sites screen) |
| Import engine | **92 of 92** with Elementor Pro active, **80 of 80** without |
| Plugin PHP checks, library tools | **138 of 138, 53 of 53 passed** |
| PHPCS | Theme 42 files, plugin 26 files: **0 errors, 0 warnings** |
| Theme Check on the packaged theme | **0 required, 0 warnings** (59 checks) |
| Plugin Check 2.2.0 on the packaged plugin | **No errors, no warnings** |

The shared checks were extended for the Pro tier (`pro: true` in a design's test file). The same eleven questions are asked; where the answer lives is different:

| Question | Free design | Pro design |
| --- | --- | --- |
| Header and footer of the design, not the theme's | Site parts | Theme Builder templates (`.elementor-location-header`, `.elementor-location-footer`) |
| Menu on a phone | The theme's menu button and list | Elementor Pro's burger and dropdown: opens, lists the six items, stays on screen, closes, marks the current page |
| Blog | The theme's templates | The archive template: every article with its title and picture, three columns |
| An article | The theme's template | The single-post template: title as `h1`, text, subheadings smaller than the title |
| Editor | Home page and two site parts | Home page, header template and footer template |

Eleven addresses (nine pages, an article, an address that does not exist) at the nine widths: 99 page views, with the usual assertions. Headings in Unbounded, text in Inter, both from the site's own address; no request to another host. A category archive was looked at separately and shows "Category: Process" as its title.

**Accessibility.** axe-core on all eleven addresses at 390 and 1440 px: no violations, **with one rule switched off for Pro designs**: "aria-allowed-role". Elementor Pro's Posts and Archive Posts widgets give each `article` the role "listitem"; that is in Elementor Pro's markup and a design cannot change it. Everything else the scan found was fixed (see below).

**Contrast, measured:** ink and paper 17.5:1 either way; lime on ink and ink on lime 15.4:1; text on paper 10.3:1; text on ink 8.2:1; white on the violet band 6.9:1.

**Found by the tests and fixed:**

1. The posts page had no `h1`: Elementor Pro's archive title is empty there. It now has its own template with a written title; categories and other archives use a second template with the dynamic title.
2. Post Title, Archive Title and Featured Image showed their placeholders ("Add Your Heading Text Here"): saved outside the editor, they need their dynamic tag spelled out.
3. axe-core, "Links must have discernible text": the pictures that link to an article had empty alternative text. They now name the article.
4. axe-core, "Links must be distinguishable without relying on color": links in an article. The theme now underlines links inside Elementor Pro's Post Content widget.
5. The menu button was 33 by 33 px; it is 45 by 45 now.

## Not covered

- **A licensed Elementor Pro.** Not available here.
- **Sending the form.** The form is rendered and checked by axe-core; no message was submitted, because the test site has no mail server.
- **CI.** There is no Elementor Pro in CI, so this file is skipped there with a message.
- Otherwise as for the free designs: real devices, other browsers, a person in the editor, a screen reader.

# Theme Builder templates — Test Report

Plugin 0.5.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2 and Elementor Pro 4.0.4 (installed, **not activated with a licence**).

| Suite | Result |
| --- | --- |
| Import engine with Elementor Pro active | **92 of 92 passed** (twelve new) |
| Import engine without Elementor Pro | **80 of 80 passed**; the twelve are skipped with a message |
| Plugin PHP checks | **138 of 138 passed** |
| Library tools | **53 of 53 passed** (four new) |
| All browser checks together (free designs, to see that nothing broke) | **94 of 94 passed** |
| PHPCS | Theme 42 files, plugin 26 files: **0 errors, 0 warnings** |
| Theme Check on the packaged theme | **0 required, 0 warnings** (59 checks) |
| Plugin Check 2.2.0 on the packaged plugin | **No errors, no warnings** |

| Area | What is asserted |
| --- | --- |
| Import | A Pro design with a header template, a single-post template, a page and a post finishes without warnings; each template is a published entry of Elementor's library with its type and content, tagged with the run |
| Conditions | Elementor Pro's own list shows the header for the whole site and the single template for posts |
| Twice | A second import reuses both templates; the header appears once in the conditions |
| Rollback | The templates are deleted, Elementor Pro's conditions are empty again, and the site fingerprint equals the one before the import |
| Library build | A Pro design with templates builds and its templates are in the package; a template in a free design, of an unknown type, or without conditions stops the build with a message |

## Not covered

- **How the templates look to a visitor.** That is checked with the first real Pro design, in the browser.
- **Elementor Pro with an activated licence.** Nothing here needed one, but a licensed site may behave differently in ways that cannot be seen from here.
- CI has no Elementor Pro, so these twelve checks only run where it is installed.

# The Medical starter site — Test Report

Phase 7b, part 4, plugin 0.4.0, design version 1.0.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6 and Elementor 4.4.2 (free version only), in Chromium. With this design, all five free-tier designs exist.

| Suite | Result |
| --- | --- |
| Medical, `tests/e2e/medical.test.js` | **11 of 11 passed** |
| All browser checks together | **94 of 94 passed** (11 each for the five designs, 18 theme integrations, 21 Starter Sites screen) |
| Import engine, plugin PHP checks, library tools | **80 of 80, 138 of 138, 49 of 49 passed** |
| PHPCS (no PHP changed since the Restaurant report) | Theme 42 files, plugin 26 files: **0 errors, 0 warnings** |
| Theme Check on the packaged theme | **0 required, 0 warnings** (59 checks) |
| Plugin Check 2.2.0 on the packaged plugin | **No errors, no warnings** |

The eleven checks are the shared ones, on twelve addresses (ten pages, an article, an address that does not exist) at the nine widths: 108 page views. Headings and text in Plus Jakarta Sans, from the site's own address. axe-core on all twelve addresses at 390 and 1440 px: no violations.

**Contrast, measured:** headings 15.0:1 on white and 13.3:1 on the page; text 8.0:1 on white, 7.1:1 on the page, 7.0:1 on the sand band; teal (links, labels, outline buttons) 6.3:1 on white, 5.6:1 on the page, 5.5:1 on sand; white on teal buttons 6.3:1; text on the deep bands 8.9:1 and on the footer 11.4:1; the emergency notice 12.7:1.

**Found by the tests and fixed:**

1. Every page was 181px wider than a 1440px screen and 47px wider than a phone: the block holding the name in the header had no width, and an Elementor container without one takes the full width of its parent.
2. axe-core: "Links must have discernible text" on ten pages. The mark in the header was a link with no text, and Elementor's Icon Box, given a link, also links its bare icon. The mark is no longer a link (the name next to it is), and cards carry a named text link ("About cardiology", "How to book") instead of a linked icon box.

## Not covered

As for the other designs. In addition: **the texts were not reviewed by a medical professional.** They describe how a practice works and avoid advice, but that is the judgement of a designer, not of a doctor.

# The Education starter site — Test Report

Phase 7b, part 3, plugin 0.4.0, design version 1.0.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6 and Elementor 4.4.2 (free version only), in Chromium.

| Suite | Result |
| --- | --- |
| Education, `tests/e2e/education.test.js` | **11 of 11 passed** |
| All browser checks together | **83 of 83 passed** (11 each for Education, Restaurant, Portfolio and Business, 18 theme integrations, 21 Starter Sites screen) |
| Import engine, plugin PHP checks, library tools | **80 of 80, 138 of 138, 49 of 49 passed** |
| PHPCS (no PHP changed since the Restaurant report) | Theme 42 files, plugin 26 files: **0 errors, 0 warnings** |
| Theme Check on the packaged theme | **0 required, 0 warnings** (59 checks) |
| Plugin Check 2.2.0 on the packaged plugin | **No errors, no warnings** |

The eleven checks are the shared ones, on eleven addresses (nine pages, an article, an address that does not exist) at the nine widths: 99 page views. Headings in Bricolage Grotesque, text in Figtree, both from the site's own address. axe-core on all eleven addresses at 390 and 1440 px: no violations.

**Contrast, measured:** headings on the page 14.9:1; text 9.0:1 on the page and at least 7.3:1 on every pastel panel; links and buttons (iris) 6.5:1 on the page, at least 5.3:1 on the pastels, white on iris 6.7:1; navy on the yellow hero 10.5:1 and on the coral panel 6.0:1; text on the navy panels 10.1:1.

**Found and fixed while building it:**

1. Elementor's accordion widget, tried for the questions on the Admissions page, fails axe-core ("Elements must only use supported ARIA attributes") with a heading and with a plain element as its title. It was replaced by plain question cards.
2. The Events page went from heading level 1 to level 3.
3. Arrow links inherited the outline and hard shadow that Site Settings give every button; they now switch both off explicitly.
4. The check marks of a list were missing (an icon name from a newer icon set).

## Not covered

As for the other designs.

# The Restaurant starter site — Test Report

Phase 7b, part 2, plugin 0.4.0, design version 1.0.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6 and Elementor 4.4.2 (free version only), in Chromium.

| Suite | Result |
| --- | --- |
| Restaurant, `tests/e2e/restaurant.test.js` | **11 of 11 passed** |
| All browser checks together | **72 of 72 passed** (11 each for Restaurant, Portfolio and Business, 18 theme integrations, 21 Starter Sites screen) |
| Import engine, plugin PHP checks, library tools | **80 of 80, 138 of 138, 49 of 49 passed** |
| PHPCS | Theme 42 files, plugin 26 files: **0 errors, 0 warnings** |
| Theme Check on the packaged theme | **0 required, 0 warnings** (59 checks) |
| Plugin Check 2.2.0 on the packaged plugin | **No errors, no warnings** |

The eleven checks are the shared ones described under Portfolio and Business, on ten addresses (eight pages, an article, an address that does not exist) at the nine widths: 90 page views. Headings in Cormorant Garamond, text in Jost, both from the site's own address. axe-core on all ten addresses at 390 and 1440 px: no violations.

**What is new to check on a dark design, and how it was checked:**

| Question | Answer |
| --- | --- |
| Do the theme's own templates turn dark too? | Yes. The journal and its articles use the design's page and card colors; the shared check compares the color of blog titles and text with the design's (cream and bone), and axe-core finds no contrast violation on the journal, an article or the comment form |
| Is text on pictures readable? | axe-core cannot measure text over an image. Calculated by hand for the brightest part of each picture under the 70% veil: cream text 6.4:1 over a plate, 7.4:1 over a lamp. Labels on pictures are cream for that reason, not ember |
| Contrast elsewhere, measured | Headings on the page 15.4:1; text 10.6:1 on the page and 9.8:1 on bands; ember 8.0:1 on the page and 7.4:1 on bands; button text on ember 8.0:1 |

**Found and fixed while building it:**

1. Blocks meant to be centered only had centered text (wrong setting name). Fixed here and in Business.
2. The theme mixed its tints into white, which would have given light boxes on a dark page (theme fix).
3. Four sections had no space below them.
4. A test compared the word "Ember" with the page after the rollback and found it inside "November". The test now looks for the full name.

## Not covered

As for the other designs. In addition: the gallery's pictures open in Elementor's lightbox when clicked; the links were checked to lead to the image files, the lightbox itself was not exercised.

# The Portfolio starter site — Test Report

Phase 7b, part 1, plugin 0.4.0, design version 1.0.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6 and Elementor 4.4.2 (free version only), in Chromium. Covers the Portfolio design and the new ability of a design to bring its own fonts.

| Suite | Result |
| --- | --- |
| Portfolio, `tests/e2e/portfolio.test.js` | **11 of 11 passed** |
| Business, `tests/e2e/business.test.js` (now on the shared checks, one check more) | **11 of 11 passed** |
| All browser checks together | **61 of 61 passed** (11 Portfolio, 11 Business, 18 theme integrations, 21 Starter Sites screen) |
| Import engine, `tests/php/importer.php` | **80 of 80 passed** (eight new, for fonts) |
| Plugin PHP checks, `tests/php/starter-sites.php` | **138 of 138 passed** |
| Library tools | **49 of 49 passed**, now with budget checks for every finished design |
| PHPCS | Theme 42 files, plugin 26 files: **0 errors, 0 warnings** |
| Theme Check on the packaged theme | **0 required, 0 warnings** (59 checks) |
| Plugin Check 2.2.0 on the packaged plugin | **No errors, no warnings** |

**One set of checks for every design.** `tests/e2e/design-checks.js` holds what the Business report below lists (import, every address at nine widths, menu, links, blog, "page not found", axe-core, global styles, editor, rollback). A design's own test file only describes the design. Two checks were added for all designs:

| Added | What is asserted |
| --- | --- |
| Typefaces | Every font file a page requests comes from the site's own address and answers 200; for a design with its own fonts they come from `uploads/open-frame-fonts`; the page has no link to Google Fonts; on every address at every width, the heading and body typefaces are actually loaded (`document.fonts.check`), not replaced by a fallback; after the rollback the font file answers 404 |
| Reading sizes | In an article, a subheading is smaller than the article's title |

**Portfolio itself:** 11 addresses (nine pages, an article, an address that does not exist) at the nine widths, 99 page views, with the same assertions as Business: status, no overflow, one `h1` and one `main`, the design's header and footer, every image loaded and with an `alt` attribute, no unresolved reference, no running text under 13 px, no script error, no request to another host. Headings in Fraunces, text in Instrument Sans. axe-core on all eleven addresses at 390 and 1440 px: no violations.

**Fonts in the import engine** (`tests/php/importer.php`, with a real 11 KB font in the reference package):

| Area | What is asserted |
| --- | --- |
| Stored | One file in `uploads/open-frame-fonts`, named by its hash and byte-identical to the library's; recorded with the run that brought it |
| Declared | The exact `@font-face` rule, with the site's own address; Elementor lists the family in the group "Starter site fonts" |
| Hostile data | A stored entry whose family tries to break out of the stylesheet, or whose file name points outside the folder, is ignored |
| Rollback | File, folder, option and rule are gone; the site fingerprint (now also counting posts, categories, fonts and font files) equals the one before the import |
| Twice | A second import stores nothing twice; rolling it back leaves the first import's font in place |
| Interruptions | A complete import is now 19 units of work; stopped at each of the 18 points and rolled back, or continued, the result is the same as before |
| Damaged | A font with a wrong checksum and a font on a foreign host each stop the import and leave no trace |

**Contrast, measured:** headings on paper 15.3:1; text on paper 8.4:1 and on sand 7.4:1; rust on paper 5.6:1 and on sand 5.0:1; white on rust 6.4:1; text on the rust band 5.2:1; text on the footer 8.1:1.

**Weight:** fifteen images, about 760 KB together, none over 100 KB; three font files, 112 KB together.

**What the tests and the review found, all fixed:**

1. The Work page went from heading level 1 to level 3 (axe-core).
2. In an article, subheadings were larger than the title, because Site Settings sizes applied to post content (theme fix, with a new check).
3. Quotes, form fields and small print in the blog stayed blue-grey on a warm design (theme fix: neutrals follow the text color).
4. A label was squeezed onto two lines next to a wide sibling.
5. Several sections had no space below them (a default in the shared builder).

## Not covered

The same as for Business: real devices, Safari and Firefox, a person using the editor, a screen reader, a slow connection, and the live library. In addition: **non-Latin text** (the fonts are Latin subsets) was not looked at.

# The Business starter site — Test Report

Phase 7a, plugin 0.3.0, design version 1.0.0. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6 and Elementor 4.4.2 (free version only; Elementor Pro switched off), in Chromium. The design is built into the mock library from `starter-sites/business`, imported through the plugin's own importer, looked at as a visitor who is not logged in, and rolled back.

| Suite | Result |
| --- | --- |
| Business, `tests/e2e/business.test.js` | **10 of 10 passed** |
| All browser checks together | **49 of 49 passed** (10 Business, 18 theme integrations, 21 Starter Sites screen) |
| Import engine, `tests/php/importer.php` | **72 of 72 passed** (one new: links to the front page) |
| Plugin PHP checks, `tests/php/starter-sites.php` | **138 of 138 passed** |
| Library tools | **49 of 49 passed**; the Business package is built, signed and verified in them |
| PHPCS | Theme 42 files, plugin 25 files: **0 errors, 0 warnings** |
| Theme Check on the packaged theme | **0 required, 0 warnings** (59 checks) |
| Plugin Check 2.2.0 on the packaged plugin | **No errors, no warnings** |

| Area | What is asserted |
| --- | --- |
| Import | The run finishes as "done" without warnings: 10 pages, 3 articles, 15 images, 1 menu; every page and all three site parts exist |
| Every page at every width | 12 addresses (ten pages, an article, an address that does not exist) at 360, 375, 390, 430, 768, 1024, 1280, 1440 and 1920 px: 108 page views. On each: the expected status; nothing wider than the screen; exactly one `h1` and one `main`, with the skip link's target; the header and footer of the design and not the theme's; every image loaded after scrolling the whole page; every image has an `alt` attribute; no `ofss://` reference left; headings and body in Hanken Grotesk; no running text under 13 px; no script error; **no request to any other host** |
| Menu | On a phone: the menu button is visible and at least 44 by 44 px, the menu starts closed, opens with `aria-expanded="true"`, lists the six items, stays on the screen, closes with Escape, and marks the current page after a click. On a desktop: a row without the button; the first Tab stop is the skip link |
| Links | Every link on the twelve addresses has a real target. Links inside the site (more than fifteen different ones) all answer 200 without a redirect; in-page links have their target; the only links that leave the site are `mailto:` and `tel:` |
| Blog | The posts page has a visible title, shows the three articles in three columns on a desktop, each with its picture and category; an article opens with its text and subheadings |
| "Page not found" | Status 404, the design's own page with one heading, and its button leads home |
| Accessibility | axe-core (WCAG 2.0 and 2.1, A and AA, and best practices) on all twelve addresses at 390 and 1440 px: no violations |
| Global styles | Elementor's four global colors carry the design's palette; a button and a heading on the home page have those colors; the theme's blog titles and text follow the same globals |
| Editor | The home page, the header and the footer open in the Elementor editor with their content in the editable area, no unknown widget and no editor error |
| Rollback | The theme header and the earlier home page are back, the design's pages and article categories answer 404, no imported object is left, and neither the theme nor the plugin logged a PHP error or notice during the whole run |

**Contrast, measured** (WCAG 2.1 formula): white on the brand blue 5.9:1; headings on white 16.5:1; body text on white 7.7:1 and on the tinted bands 7.1:1; text on the dark bands 9.4:1; text on the blue closing band 4.7:1.

**Weight:** the package (all pages, site parts, articles and settings) is under 200 KB; the fifteen images are about 540 KB together, none over 100 KB.

**What the tests found, all fixed before this report:**

1. The wordmark in the header linked to `/home/`, which redirects. Links to a design's front page are now written as the site address.
2. The Services page went from heading level 1 straight to level 3.
3. The "Previous" and "Next" labels under an article had a contrast of 4.4:1 on the design's tinted background (theme fix).
4. The blog page had no visible title (new theme option, switched on by the design).
5. Earlier, while building: Elementor's Site Settings restyled the theme's menu, site title and post titles; the theme now keeps its own look for those parts.

## Not covered

- **Real devices and other browsers.** Chromium only, at set window widths. No iPhone, Android phone, Safari or Firefox.
- **A human reading the editor.** The editor is opened and checked for errors and unknown widgets; nobody dragged widgets around in it.
- **A screen reader.** axe-core finds what can be found automatically, which is a part of accessibility, not all of it.
- **A slow connection.** Nothing was measured with Lighthouse or under throttling.
- **The live library.** The package came from the local mock library, signed with a throw-away key.
- The design has no contact form (see `PROJECT_STATUS.md`).

# The import engine — Test Report

Phase 6, plugin 0.2.0: importing a design, resuming an interrupted import and rolling back. Executed on 26 November 2026 on WordPress 7.1.5, PHP 8.3.6 and Elementor 4.4.2, against the reference package (two pages, one image, a header, a menu, colors and theme settings) served by the mock library. The real designs do not exist yet, so nothing larger was imported.

| Suite | Result |
| --- | --- |
| Import engine, `tests/php/importer.php` | **71 of 71 passed** |
| Browser checks of the Starter Sites screen | **21 of 21 passed**, two of them new: import, edit and roll back from the screen; continue or roll back an interrupted import |
| Plugin Check 2.2.0 on the packaged plugin | **No errors, no warnings** (it first reported one error and one warning; both were fixed) |
| PHPCS, plugin, 24 files | **0 errors, 0 warnings** |

| Area | What is asserted |
| --- | --- |
| A complete import | Both pages published under their addresses; the home page is the front page; Elementor's Full Width template; valid Elementor data with every reference resolved (the image by attachment ID and address, links by the imported page's address); page settings kept; the image in the media library with its alt text and byte-identical to the library's file; everything tagged with site, identity and run; a new kit active with the design's colors while the old kit still exists; theme settings in the right types; the menu in the theme's location with both pages; the header as a site part that the theme renders inside a `header` element; history and "active site" recorded; working folder removed; lock released |
| Rolling back | The site is **exactly** as before: number of pages, attachments, site parts, kits, menus and menu items, front page, active kit, theme settings, recorded site and working folders all compared with the state before the import. Rolling back twice changes nothing |
| Importing twice | No page, image, site part, menu or menu item is duplicated; the same pages are used; the image is reused, not downloaded again; rolling back the second import keeps what the first created |
| Interruptions | A complete import takes 17 units of work. Stopped after each of the 16 possible points and rolled back, the site is always exactly as before. Stopped after each of those points and continued in a new request, the import always completes with the same result |
| Locking | A run being worked on in another window is not worked on twice and cannot be rolled back at that moment; a lock left by a request that died expires; a second import cannot start while one is unfinished |
| Damaged downloads | Eight cases each stop the import with a clear message and leave no trace after rollback: package with a wrong checksum, a wrong size, on a foreign host, with an unlisted file, lacking a listed file, with a changed page inside; image with a wrong checksum, on a foreign host |
| Not ready | Missing Elementor widgets (named in the message), Elementor without containers, a design that needs a newer plugin, a design that is not out yet, an unknown design and a library that is down all stop before anything changes |
| REST | Subscriber 403 and visitor 401 on every import route; an unconfirmed import is refused; unknown run 404; a second start is 409; an import driven entirely over REST completes and rolls back; the answer exposes neither the manifest nor local paths |
| In the browser | Nothing starts until the user ticks the confirmation; the report shows "2 pages, 1 image, 1 menu"; a visitor sees the design's home page and header at 360, 768 and 1440 px without overflow, the image loads with its alt text, the link to About works, a site part has no page of its own (404); the imported page and the imported header open in the Elementor editor; the card shows "Imported" and the history lists the run; "Roll back" asks a second time and then restores the earlier home page and theme header; an interrupted import shows a banner with its progress and can be continued or rolled back; confirmation and report pass the axe-core scan |

Found and fixed while testing: Elementor stops any request that deletes a kit with a confirmation screen (the rollback now trashes the unused kit first and refreshes Elementor's cached document); deleting a menu made WordPress rewrite the theme's menu locations after the settings had been restored (settings are now restored last); Elementor's `elementor_previous_kit` option was not part of the snapshot.

Not covered: a design larger than the reference package; real server time limits and low memory; Elementor Pro templates in a package; multisite. Not built yet, although planned for this phase: see `PROJECT_STATUS.md`.

# The library — Test Report

Phase 5: the tools that build and sign the library, the Worker that serves it, and the plugin's verification of signatures and manifests. Executed on 26 November 2026. **Nothing was deployed to Cloudflare**; everything ran locally, against a library built by the real tools and served by the mock.

| Suite | Result |
| --- | --- |
| Library tools, `tools/test/library.test.mjs` | **49 of 49 passed** |
| Worker, `cloud/worker/test/worker.test.mjs` | **10 of 10 passed** |
| Plugin PHP checks (below, now including signatures and manifests) | **all passed**: 138 with Elementor Pro in the test site, 139 without |
| Browser checks of the Starter Sites screen | **19 of 19 passed**, one of them new: unsigned, altered and foreign-key catalogs |

| Area | What is asserted |
| --- | --- |
| Build | The ten planned sites build into a catalog that matches `catalog.schema.json` inside an envelope that matches `envelope.schema.json`; a site with content becomes a package whose manifest matches `manifest.schema.json`; source-only fields do not leak into the catalog |
| Package file | A real ZIP (checked with `unzip`), JSON and Markdown only, binaries outside it under their checksum; building twice gives byte-identical files |
| Signature | A changed catalog, an unknown key, a key ID pointing at another key, no signatures, algorithm "none", a bare catalog and a catalog re-signed by an attacker are all refused; with two signatures either key opens it |
| Checksums | A changed package, manifest or image, and a missing package, are each detected |
| Package rules | 25 kinds of bad package are refused with a message naming the file: PHP or JavaScript files, invalid JSON, links to the authoring site, plain HTTP, script tags, event handlers, `javascript:` links, references to missing images or pages, undeclared widgets, options and theme settings outside the allow-list, wrong identities, zero or two front pages, images without licence or alt text, missing, SVG, oversized or fake images, paths that leave the media folder |
| Catalog rules | 10 kinds of bad entry are refused: wrong id, tier or category, Pro without Elementor Pro, free with it, Elementor Pro "from WordPress.org", plugin file outside its folder, missing or wrong-sized preview, "available" without content. One bad site stops the whole build |
| Publishing | Dry run: every versioned file first and marked immutable, the catalog last with a short cache life |
| Command line | `keygen` writes a key only its owner can read and never overwrites one; `build`, `verify` and `public` work together; a wrong public key fails verification |
| Worker | Catalog with a short cache life, versioned files immutable with correct types, ETag and "not modified", HEAD, readable 404 and 503, only GET and HEAD; paths outside `/v1/`, odd paths and unknown file types never reach storage |
| Plugin: signatures | The library built by the tools is accepted; 13 kinds of forged or malformed envelope are refused; without a public key nothing is accepted; a forged catalog never replaces a saved one |
| Plugin: manifests | Accepted only when identical to the file the signed catalog names; 10 kinds of manifest that pass the checksum but point elsewhere or list unsafe files are refused; a foreign address is never requested |

Not covered: the deployed Worker, R2 and the custom domains, the publish workflow in GitHub Actions, and Cloudflare's own caching. They need a working Cloudflare API token.

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

`tests/php/starter-sites.php`, **all checks passed**: 138 on the site with Elementor Pro installed, 139 on a fresh site without it (a few checks depend on whether Elementor Pro is present). HTTP is replaced with canned answers.

| Area | What is asserted |
| --- | --- |
| Configuration | Default library is HTTPS; images and packages only from the library's own hosts; plain HTTP, other ports, `javascript:` and `file:` addresses refused |
| Catalog validation | The mock catalog passes; seven kinds of broken catalog are refused; a newer format asks for a plugin update; seventeen kinds of bad site entry are left out one by one (bad IDs, unknown tier or status, images on foreign hosts, plugin files outside their folder, unknown plugin sources, "available" without a proper manifest); duplicates dropped; markup removed from text; unknown fields do not survive |
| Download and caching | First request downloads; a fresh copy is reused without a request; refresh sends the ETag and honours "not modified"; temporary failures are tried three times and recover; "not found" is not retried; a failing library shows the saved copy as stale; without a saved copy it is an error written for a person; a bad answer is never saved; requests carry the plugin name and no site address |
| Requirement checks | Coming soon, update the plugin, incompatible (WordPress, PHP, theme), needs plugins, needs Elementor Pro, ready; optional plugins do not block; Elementor Pro is never offered for installation; a user without the capability gets no button |
| REST | Four routes registered; subscriber 403 and visitor 401 on every route; catalog and site details for an administrator; package addresses not exposed; unknown site 404; a plugin the site does not list cannot be installed; Elementor Pro cannot be installed; library down without a saved copy is a 503 with a message |
| History and imported state | Twenty newest runs kept, cleaned on output; "update available" and "imported" follow the recorded version |

## Browser checks

`tests/e2e/starter-sites.test.js`, 21 tests, **21 passed.**

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

Requirements: PHP with the `sqlite3`, `sodium` and `zip` extensions, Composer, Node.js 20 or newer, Playwright with Chromium and axe-core (`npm install` in `tests/`), and network access to `wordpress.org`, `api.wordpress.org` and `downloads.wordpress.org`. The Plugin Check step also needs WP-CLI.

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
php tests/env/run.php "${OFT_DIR:-${TMPDIR:-/tmp}/open-frame-wp-test}/wordpress" tests/php/importer.php
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
