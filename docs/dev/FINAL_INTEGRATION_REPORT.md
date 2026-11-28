# Final Integration Report

Open Frame (theme) and Open Frame Starter Sites (plugin) · 28 November 2026

## সংক্ষেপে (বাংলায়)

- **আপনার Theme এবং Plugin দুটোই একই GitHub repository-তে আছে** (`Mostafijemon24/Open-Frame-Theme`)। Plugin-টি `companion/open-frame-starter-sites` ফোল্ডারে। আলাদা কোনো plugin repository নেই, তাই আলাদা করে "sync" করার কিছু ছিল না। কিছুই নতুন করে বানানো হয়নি।
- **Theme 1.2.0:** Theme এখন Plugin-টিকে "Recommended" হিসেবে দেখাতে পারে (TGMPA + একটি notice: Install → Activate → Open)। কিন্তু Plugin এখনো WordPress.org-এ নেই, তাই তার official slug জানা নেই। সেই কারণে এই সুবিধাটি এখন **বন্ধ অবস্থায়** আছে: `functions.php`-এর একটি লাইনে slug বসালেই চালু হবে।
- **Plugin 1.0.1:** WordPress.org-এ জমা দেওয়ার জন্য প্রস্তুত। একটি স্বাধীন security ও guideline review-তে যা পাওয়া গিয়েছিল, তা ঠিক করা হয়েছে।
- **পরীক্ষা:** সব automated test পাস করেছে। Production cloud library থেকে পাঁচটি free design পরিষ্কার site-এ import হয়েছে। Elementor Pro-র পাঁচটি design এখানে পরীক্ষা করা যায়নি।
- **যা আমি করতে পারিনি, করা সম্ভবও নয়:** WordPress.org-এ জমা দেওয়া ও অনুমোদন। এগুলো আপনার WordPress.org account থেকে করতে হবে। আসল Plugin-টি আসল WordPress.org থেকে install হওয়াও অনুমোদনের আগে পরীক্ষা করা সম্ভব নয়।
- **আপনার করণীয়** নিচে "What you need to do next" অংশে ধাপে ধাপে লেখা আছে।

## 1. In one paragraph

Nothing was rebuilt. The theme now recommends the plugin the way WordPress.org asks themes to: as an optional plugin from the WordPress.org Plugin Directory, through TGM Plugin Activation, with one dismissible notice that offers to install, activate or open it. Because the plugin is not in the directory yet, its slug there does not exist, so the recommendation ships **switched off** behind a placeholder; one line switches it on after approval. The plugin was reviewed against the directory's guidelines and what the review found is fixed. Both packages are built and checked. Submitting them, and the approval, are yours.

## 2. What was already there

**One repository, not two.** `Mostafijemon24/Open-Frame-Theme` holds both products: the theme at the root and the plugin in `companion/open-frame-starter-sites/`. Your account has no separate repository for the plugin. (It has another theme, `NexusForge-Theme`; it was not part of this session and was not touched.)

| At the start | |
| --- | --- |
| Remote | `https://github.com/Mostafijemon24/Open-Frame-Theme` |
| Branches | `main` and one working branch, both at the same commit |
| Last commit before this work | "Note that the repository was created anew and the releases published again", 27 November 2026 |
| Uncommitted changes | None |
| History | 60 commits; untouched. Nothing was rewritten, force-pushed or deleted |

### Audit before any change

| | Theme | Plugin |
| --- | --- | --- |
| Name | Open Frame | Open Frame Starter Sites |
| Slug / folder | `open-frame` | `open-frame-starter-sites` (its folder; **not yet a WordPress.org slug**) |
| Text domain | `open-frame` | `open-frame-starter-sites` |
| Version at the start | 1.1.0 (released on GitHub) | 1.0.0 (released on GitHub) |
| Main file | `style.css`, `functions.php` | `open-frame-starter-sites.php` |
| Needs | WordPress 6.4, PHP 7.4 | WordPress 6.4, PHP 7.4, the Open Frame theme |
| Licence | GPL-2.0-or-later | GPL-2.0-or-later |
| Admin interface | The Customizer only | Appearance → Starter Sites |
| Onboarding, plugin recommendation, TGMPA | **None** | Not applicable |
| Elementor | Optional; supported, with Elementor Pro's Theme Builder | Every design is made with it. Five designs work with free Elementor, five need Elementor Pro, one of those also WooCommerce |
| Cloud | None; no remote requests | A signed list of ten designs from `api.buildbetters.com`, files from `cdn.buildbetters.com` (your Cloudflare account) |
| Import engine | Not applicable | Step by step, resumable, with rollback |
| On WordPress.org | **No** ("Theme not found") | **No** ("Plugin not found.") — both asked of the WordPress.org API on 28 November 2026 |

**Compatibility between the two:** no conflict. The plugin already checked for the theme and refused to import without it; the theme did not know the plugin. The only thing missing was the theme's side: the recommendation.

**The plugin is a real product, not an installer of other plugins.** Its substance is the import: the signed catalog, the verified download, the pages, pictures, fonts, menus and Site Settings it creates, and the rollback. It never downloads or runs code: a design is data, the ZIP is read in memory and never extracted, and script in a page is refused.

## 3. What I changed

### Theme 1.2.0: the recommendation

| File | Change |
| --- | --- |
| `functions.php` | Two constants: the plugin's slug (the placeholder `REPLACE_WITH_ACTUAL_APPROVED_WORDPRESS_ORG_SLUG`) and its name. Loads the two files below. Version 1.2.0 |
| `inc/tgmpa/class-tgm-plugin-activation.php` | **New.** TGM Plugin Activation 2.6.1, the release, with the theme's text domain. Loaded on admin screens only, and only when the slug is set |
| `inc/integrations/starter-sites.php` | **New.** Where the plugin stands on the site, and its registration: `required => false`, no forced activation or deactivation, no `source`, `is_automatic => false` |
| `inc/integrations/starter-sites-notice.php` | **New.** The notice and its dismissal |
| `assets/js/admin-starter-notice.js`, `assets/css/admin-starter-notice.css` | **New.** Install in place, show errors, remember a dismissal |
| `style.css`, `readme.txt`, `languages/open-frame.pot`, `phpcs.xml.dist`, `.distignore` | Version, changelog, two answers in the FAQ, the library's credit and licence, 102 new translatable strings, tooling |

How it behaves is described, with pictures, in [docs/dev/INTEGRATION.md](INTEGRATION.md) and in chapter 2 of the [theme guide](../README.md#the-recommended-plugin-optional).

**A decision I made for you: while the slug is the placeholder, the theme shows nothing.** No notice, no "coming soon". A theme in the WordPress.org directory must only recommend plugins that are in the directory, and a notice about a plugin nobody can install would be noise for users and a likely objection from a reviewer. The status "not available on WordPress.org" (your status E) exists and is tested: it is what the notice says when the slug is set and the directory does not list the plugin or cannot be reached. Say so if you would rather have a visible "coming soon" notice in the meantime.

**Elementor is not added to the theme's recommended plugins.** The theme does not need it, and the plugin already offers it beside each design, on a click.

### Plugin 1.0.1: preparation for WordPress.org

An independent review read every file of the plugin against the directory's guidelines. It found no blocker in the code and seven things worth fixing. What I did with each:

| Found | Done |
| --- | --- |
| The readme named Cloudflare's terms and privacy policy but none for your own library service | "External services" rewritten: who runs the service, what goes to which host, and a link to its terms of use and privacy policy. That text is new and is published in your name ([docs/SUPPORT.md](../SUPPORT.md#the-library-service)). **You read and agreed it on 28 November 2026** |
| The readme said the site's address is never sent, but a browser tells the image server which page asked | Preview pictures are now requested without a referrer, so the sentence is true |
| The check that refuses script in a design could be passed by a correctly signed package, with script written in unusual spellings | The check is stricter (character references, handlers without a space, forms, inline SVG, shortcode dynamic tags) and runs a second time just before each page is stored. All 133 documents of the ten designs still pass it |
| The post type `of_site_part` has a two-letter prefix; reviewers ask for four | Renamed to `ofss_site_part`. Site parts made by 1.0.0 are renamed once, automatically |
| Installation text said "upload the plugin", and did not say where to get the theme | Rewritten for the directory, with the theme's download address and two new FAQ entries |
| "Update" of a required plugin ends with it active but did not ask for the right to activate | It does now |
| A rollback after switching to a child theme restored the theme settings to the wrong theme | Fixed |
| Smaller points | Opening a package no longer fails on PHP 7.4.0 to 7.4.2; site parts stay out of the XML sitemap; a `LICENSE` file is in the package |

Also new, for your Phase 9: **the Starter Sites screen says above the designs when Elementor is not active**, and where to install it. It installs nothing by itself.

Not changed, on purpose: forcing every page through WordPress's HTML filter on import (it could alter the designs and cannot be checked here for the five Elementor Pro designs), and the name of the plugin's menu widget (the published library refers to it).

### Tests and documents

- `tests/e2e/recommendation.test.js`: **new**, 15 browser checks of the notice.
- `tests/env/mu-plugin.php`, `tests/env/state.php`, `tests/e2e/helpers.js`: the test site can answer in the directory's place, so the journey can be rehearsed before the plugin is published.
- `tests/php/importer.php`, `tests/php/starter-sites.php`, `tests/e2e/starter-sites.test.js`: 18 new checks for the plugin's changes.
- Documents: this report, [docs/dev/INTEGRATION.md](INTEGRATION.md) (new, with both submission checklists), [docs/dev/TESTING.md](TESTING.md) (new report at the top), the guides, `CHANGELOG.md`, `README.md`, `PROJECT_STATUS.md`, [docs/dev/RELEASE.md](RELEASE.md).

## 4. What was tested

The full report is in [docs/dev/TESTING.md](TESTING.md#the-theme-recommends-the-plugin--test-report). On WordPress 7.1.5, PHP 8.3.6, Elementor 4.4.2, Chromium:

| Check | Result |
| --- | --- |
| The notice in every status (not installed, inactive, active, dismissed, failed, not in the directory, WordPress.org unreachable, no JavaScript, no permission, placeholder) | **15 of 15** |
| Install → activate → open, three separate clicks, nothing automatic | Pass |
| Plugin PHP checks | **152 of 152** |
| Import engine | **113 of 113**; with WooCommerce **126 of 126** |
| Starter Sites screen in the browser | **22 of 22** |
| Theme integrations in the browser | 17 passed, 1 skipped (needs Elementor Pro) |
| The Business design in the browser, with the Elementor editor | **11 of 11** |
| Coding standards, theme and plugin | Clean |
| **Theme Check** on `open-frame-1.2.0.zip` | **0 required, 0 warnings** |
| **Plugin Check** on `open-frame-starter-sites-1.0.1.zip` | **No errors found** |
| **Import from your production library**, on a clean site built from the two packages | **5 of 5 free designs**, every page and picture looked at, each rolled back |
| CI on GitHub | Starts when this branch is pushed: coding standards, PHP syntax on 7.4, 8.1 and 8.3, the library tools, the guides and packages, a rehearsal of publishing and importing, and every browser check. Its result is on the repository's [Actions page](https://github.com/Mostafijemon24/Open-Frame-Theme/actions), not in this file, which was written before the push |

**What these tests are not:**

- **The real plugin was not installed from the real WordPress.org**, because it is not there. That step was rehearsed: the test site answered in the directory's place and WordPress installed the package built here. A plugin that is in the directory (Hello Dolly) was installed from the real WordPress.org through the same button.
- **The five designs for Elementor Pro were not imported** in this session (no Elementor Pro here). They were, on 27 November, with plugin 1.0.0.
- Only Chromium and PHP 8.3 on this machine. No multisite, no right-to-left language, no real phone, no Safari, no screen reader. The manual checklist is still open.

## 5. Where things stand

| Question | Answer |
| --- | --- |
| Is the plugin ready to be submitted? | **Yes.** On 28 November 2026 you read and agreed the library's terms and privacy text, and confirmed that `mostafijemon` is your WordPress.org user name |
| Is the plugin approved or published? | **No.** Not submitted. Approval is a manual review by WordPress.org and usually takes days to weeks, often with questions |
| What is the plugin's official slug? | **Unknown, pending.** It will probably be `open-frame-starter-sites`, but WordPress.org decides, and I did not put a guess into the code |
| Is the theme integration ready? | **Yes, and switched off.** It was tested with the slug set; it ships with the placeholder |
| Does one-click installation from WordPress.org work today? | **No.** It cannot before the plugin is approved |
| Is the theme ready to be submitted? | **Yes.** The package recommends nothing while the placeholder stands, so it can be submitted before the plugin is approved |

## 6. What you need to do next

In this order. Steps 1 and 2 are done. Only steps 4, 5 and 7 need your WordPress.org account; I cannot do them.

1. ~~Read the library's terms of use and privacy policy~~ **Done, 28 November 2026:** you read the two sections under "The library service" in [docs/SUPPORT.md](../SUPPORT.md#the-library-service) and agreed to them.
2. ~~Confirm your WordPress.org user name~~ **Done, 28 November 2026:** `mostafijemon`, as both readme files say.
3. ~~Put the work on `main`~~ **Done, 28 November 2026**, on your word.
4. **Submit the plugin**: sign in at <https://wordpress.org/plugins/developers/add/> and upload `open-frame-starter-sites-1.0.1.zip`. WordPress.org answers by email.
5. **Submit the theme**: sign in at <https://wordpress.org/themes/upload/> and upload `open-frame-1.2.0.zip`. It can go at the same time as the plugin.
6. **Answer the reviewers.** Send me what they write; I prepare the changes and the replies. Likely questions and their answers are in [docs/dev/RELEASE.md](RELEASE.md#e-wordpressorg). One to expect: the plugin needs a theme that is not in the directory yet.
7. **When the plugin is approved**, WordPress.org sends you its address and an SVN repository. Tell me the slug (the last part of `https://wordpress.org/plugins/<slug>/`). I then put it into `functions.php`, test the real installation from the real directory, and prepare the theme update. Uploading the plugin's files to SVN needs your WordPress.org password; I prepare the folder and the exact commands.
8. **Upload that theme update** to WordPress.org. From then on your goal is reached: a user activates the theme, sees the recommendation, clicks Install, and imports a website.

Still open from before, unchanged: the manual checks on real devices, changing the Cloudflare password that was pasted into a chat, and switching "Private vulnerability reporting" on again in the repository's settings.

## 7. The deliverables you asked for

| | Deliverable | Where |
| --- | --- | --- |
| A, B | Updated theme and plugin | This branch. One repository holds both |
| C | Plugin ZIP for WordPress.org | `open-frame-starter-sites-1.0.1.zip`, sent with this report. Built by `bash bin/release-package.sh plugin` |
| D | Theme ZIP for WordPress.org | `open-frame-1.2.0.zip`, sent with this report. Built by `bash bin/release-package.sh theme` |
| E | Integration documentation | [docs/dev/INTEGRATION.md](INTEGRATION.md) |
| F | Changelogs | [CHANGELOG.md](../../CHANGELOG.md), and the `== Changelog ==` of both readme files |
| G | Commits and branch | Section 8 |
| H | Plugin submission checklist | [docs/dev/INTEGRATION.md](INTEGRATION.md#checklist-submitting-the-plugin) |
| I | Theme submission checklist | [docs/dev/INTEGRATION.md](INTEGRATION.md#checklist-submitting-the-theme) |
| J | Test report | [docs/dev/TESTING.md](TESTING.md#the-theme-recommends-the-plugin--test-report) |
| K | Remaining manual actions | Section 6 |

The ZIP files are not in the repository (it keeps no build results); anyone can rebuild them with the two commands above. Their SHA-256 checksums:

```
d3f75c037e90e2dcbccdee69d1bf0dccf96763440cdc9b74ecaaf73515a4c574  open-frame-1.2.0.zip
f5f04f47352e16e0840f7dfd95dad8c775baea67a10f6b87c97eb221e9a53c06  open-frame-starter-sites-1.0.1.zip
```

Both packages were listed and read: no `.git`, no tests, no tools, no keys, no environment files, no archives inside. The plugin package leaves out its `.wordpress-org/` folder: the banner, icon and screenshots go into the SVN `assets` folder after approval.

## 8. Commits

The work is six commits on top of the last commit of 27 November 2026, now on `main`:

| What |
| --- |
| Plugin: a stricter check for script in a design, and fixes from a review for WordPress.org |
| Plugin 1.0.1: prepared for submission to the WordPress.org Plugin Directory |
| Theme 1.2.0: the Starter Sites plugin as a recommended plugin, through TGM Plugin Activation |
| Theme: one dismissible notice that offers to install, activate or open Starter Sites |
| Guides, integration document, checklists, test report and this report |
| Your two confirmations of 28 November 2026, recorded in the documents |

No credentials, keys or tokens are in any of them. The library's signing key was never on the machine the work was done on.
