# Release Checklist

What has to be true before a version of the Open Frame theme or of the Open Frame Starter Sites plugin is published, who confirms it, and how the release is made.

A line is **signed off** when the person named has confirmed it, with the date. The automated checks are confirmed by their output, which is recorded in [TESTING.md](TESTING.md). Everything that needs a person, an account or a decision is confirmed by the owner. Nobody else signs for the owner.

## Status on 28 November 2026

Prepared on the branch `claude/quirky-hawking-lhqgg4`, **not released and not merged**:

| Product | Version | State |
| --- | --- | --- |
| **Open Frame** (theme) | 1.2.0 | Recommends the Starter Sites plugin through TGM Plugin Activation and one notice. **The plugin's WordPress.org slug is a placeholder**, so this version recommends nothing yet. How it works and what switches it on: [INTEGRATION.md](INTEGRATION.md) |
| **Open Frame Starter Sites** (plugin) | 1.0.1 | What an independent review for WordPress.org found is fixed: the check for script in a design is stricter, the post type has a four-letter prefix, the readme names the library's terms and privacy policy. **Owner, 28 November 2026:** the library's terms of use and privacy policy are read and agreed, and `mostafijemon` is the WordPress.org user name. Ready to be submitted once the branch is merged |

Checklists for both submissions are in [INTEGRATION.md](INTEGRATION.md); what was tested is in [TESTING.md](TESTING.md); the summary for the owner is [FINAL_INTEGRATION_REPORT.md](../../FINAL_INTEGRATION_REPORT.md).

## Status on 27 November 2026

On 27 November 2026 the owner created the repository anew at the same address, and the history was pushed to it again. The three releases (theme 1.0.1 and 1.1.0, plugin 1.0.0) were published again from the same commits, and the packages of theme 1.1.0 and plugin 1.0.0 were compared with the first ones: identical, file for file. The pull request numbers and CI run numbers named in these documents are those of the earlier repository and lead nowhere now.

| Product | Version | State |
| --- | --- | --- |
| **Open Frame** (theme) | 1.1.0 | **Released on 27 November 2026** on the owner's word, from `main` after pull request 1 was merged with CI green: <https://github.com/Mostafijemon24/Open-Frame-Theme/releases/tag/v1.1.0>. The package was downloaded from the release page afterwards: its checksum matches, it holds the same 74 entries as the build that was tested, and nothing that does not belong in it. Not yet submitted to WordPress.org (C9) |
| **Open Frame Starter Sites** (plugin) | 1.0.0 | **Released on 27 November 2026** on the owner's word, from `main` after pull request 2 was merged with CI green: <https://github.com/Mostafijemon24/Open-Frame-Theme/releases/tag/starter-sites-v1.0.0>. The package downloaded from the release page has a matching checksum and holds, file for file, the build that was tested. **The manual checks (C1) had not been done or recorded when it was released**; the owner had first made them a condition and then asked for the release. Not yet submitted to WordPress.org (C9) |
| **Starter site library** | ten designs, each 1.0.0 | **Published on 27 November 2026** at `api.buildbetters.com` and `cdn.buildbetters.com`, signed with the production key (ID `135200d7`), checked live, and all ten designs imported from it on a clean site with the packaged plugin |

**Both products are released.** The theme's part of the checklist is signed off. The plugin was released on the owner's word with one point of the checklist open: the manual checks (C1). What they find goes into a patch release. Also open: C2 (the pasted password), C9 (the submissions to WordPress.org) and C10.

## A. What a release consists of

| Deliverable | Where | State |
| --- | --- | --- |
| Theme ZIP with checksum | `dist/open-frame-1.1.0.zip`, built by `bash bin/release-package.sh theme` | Done. 408 KB |
| Plugin ZIP with checksum | `dist/open-frame-starter-sites-1.0.0.zip`, built by `bash bin/release-package.sh plugin` | Done. 80 KB |
| Theme user guide with screenshots | [docs/README.md](../README.md), 26 chapters, 46 pictures; HTML in `docs/index.html` | Done. Elementor and WooCommerce chapters now have pictures |
| Plugin user guide with screenshots | [docs/STARTER-SITES.md](../STARTER-SITES.md), 17 chapters, 11 pictures; HTML in `docs/starter-sites.html` | Done |
| Installation guide | [docs/INSTALL.md](../INSTALL.md); HTML in `docs/install.html` | Done |
| Support and update policy | [docs/SUPPORT.md](../SUPPORT.md); HTML in `docs/support.html` | Done. Read and agreed by the owner on 27 November 2026 (C7) |
| Developer documentation | Theme: [chapter 23 of the theme guide](../README.md#23-child-themes-and-developer-reference) and [ARCHITECTURE.md](ARCHITECTURE.md). Plugin: [PLUGIN.md](PLUGIN.md), [STARTER-SITES-ARCHITECTURE.md](STARTER-SITES-ARCHITECTURE.md). Library: [LIBRARY.md](LIBRARY.md). Tests: [TESTING.md](TESTING.md) | Done |
| Changelogs | `readme.txt` of the theme and of the plugin (what WordPress reads), gathered with the versions of the designs in [CHANGELOG.md](../../CHANGELOG.md) | Done |
| Pictures for the plugin's page on WordPress.org | `companion/open-frame-starter-sites/.wordpress-org/screenshot-1.png` to `-5.png`, matching `== Screenshots ==` in its readme | Done |
| Banner and icon for the plugin's page on WordPress.org | `.wordpress-org/banner-1544x500.png`, `banner-772x250.png`, `icon-256x256.png`, `icon-128x128.png`, `icon.svg`, drawn by `node bin/wporg-assets.js` | Done, at the owner's request |
| Release workflow | `.github/workflows/release.yml`: one release per product, each with ZIP, checksum and notes taken from the changelog | Written. The packaging script was run on this machine; **the workflow itself has not run** since it was changed, because running it publishes a release |

## B. Checked by machine

Signed off by the output of the checks on 27 November 2026, after the last change to the plugin. Details and earlier runs are in [TESTING.md](TESTING.md).

| # | Check | Result |
| --- | --- | --- |
| B1 | Version numbers agree: `style.css`, `functions.php` and the theme's `readme.txt`; the plugin's main file, `OFSS_VERSION`, its `readme.txt` and its translation template | Pass (checked by `bin/release-package.sh`) |
| B2 | Each `readme.txt` has a changelog entry for its version | Pass |
| B3 | The packages contain no development files, keys, archives or environment files | Pass (checked by `bin/release-package.sh`); file lists read |
| B4 | The checksums match the packages | Pass |
| B5 | WordPress coding standards, theme and plugin (`composer lint`) | Exit code 0 |
| B6 | Plugin checks on PHP 7.4, 8.1 and 8.3 | 145 of 145 on each, again on 1.0.0 |
| B7 | Import engine: plain, with WooCommerce, with Elementor Pro (PHP 8.3); plain on PHP 7.4 and 8.1 | 102, 115 and 114 of their totals; 102 of 102 on each. On 1.0.0: 115 of 115 with WooCommerce on PHP 8.3 |
| B8 | Library tools | 74 of 74 |
| B9 | Browser checks in Chromium: every page of every design at nine widths, import, rollback, editor, accessibility rules | 149 of 149 on 0.6.1 (also in CI on the commit that was merged). On 1.0.0: the 21 checks of the Starter Sites screen on this machine, all of them in CI |
| B10 | Theme Check and Plugin Check on the packages | Theme Check: 0 required, 0 warnings. Plugin Check: no errors found, again on 1.0.0 |
| B11 | Every link and picture in the guides leads somewhere (`bin/check-docs.js`) | 522 checked, 0 broken |
| B12 | Browser checks in Firefox and WebKit, the version matrix, performance and the security review | Done in Phase 9 on plugin 0.6.1. Since then the plugin changed in four small places (the wording of the confirmation, how often an import reports back, the public key, the version number). Not repeated for those |

## C. For the owner to confirm

Signed off where a date is given; the owner said so in the project's conversation on that day.

| # | What | How | Signed off |
| --- | --- | --- | --- |
| C1 | **The manual checks**: real phones, Safari, a screen reader, a real shared host | [QA-CHECKLIST.md](QA-CHECKLIST.md), about two hours. Write the results into TESTING.md | **Open.** Not done before either release. A machine did what it can of them on emulated phones (TESTING.md) |
| C2 | **The Cloudflare password that was pasted into a chat has been changed** | Cloudflare dashboard → My Profile → Authentication | Open |
| C3 | **A Cloudflare token that can publish**: Workers scripts, R2, Workers routes, DNS, account settings and zone | Made from Cloudflare's pre-filled form; the link is in [LIBRARY.md](LIBRARY.md). Saved in the secure credential form, never in a chat or a file | **Done, 27 November 2026, 13:21 UTC.** Checked by using it: bucket, Worker and address created in staging |
| C4 | **The signing key of the library exists and is kept safe**: one copy in a password manager, one offline | Made on 27 November 2026 with `node tools/library.mjs keygen` and handed to the owner as a file, which the owner chose. It never entered the repository | **Owner, 27 November 2026:** the key is stored. The copy on the development machine was deleted the same day; the owner's copy is the only one |
| C5 | **Forms on the five free designs**: stay with email and telephone links, or name a free forms plugin | A decision | **Owner, 27 November 2026:** no forms plugin is needed. The free designs keep their email and telephone links |
| C6 | **Version number of the first public plugin release**: 0.6.1 as it is, or 1.0.0 | A decision | **Owner, 27 November 2026:** 1.0.0, once the library is online and the manual checks (C1) are done. Until then the plugin stays 0.6.1 and is not released |
| C7 | **The support and update policy is the owner's own**: no guaranteed response time, security reports through GitHub's private reporting, 90 days' notice before the library would end | Read [docs/SUPPORT.md](../SUPPORT.md) and change what you do not want to promise. Switch on "Private vulnerability reporting" under the repository's Settings → Security | **Owner, 27 November 2026:** read and agreed. "Private vulnerability reporting" was switched on in the earlier repository; **in the repository created anew it has to be switched on again**, because settings do not carry over |
| C8 | **The work is on the default branch** | The links in the readme files and release notes point at `main` | **Done, 27 November 2026:** pull requests 1 and 2 merged on the owner's word, each with both CI runs green |
| C9 | **WordPress.org**: the owner's account, from which both products are submitted | See part E. The owner's user name there is `mostafijemon`, as both readme files say. Banner, icon and screenshots for the plugin's page are ready | Open (the submissions themselves) |
| C10 | **Known issues are acceptable for a first release** | The list under "Open issues" in TESTING.md: page-speed target missed on phones (81 to 93 of 100), importing a design again overwrites edits, RTL and Multisite untested, Medical has no portraits | Open |

## D. What the plugin needed before it can be released

Done on 27 November 2026, except the last step.

1. **Done.** Staging: Worker deployed, library uploaded, checked live, all ten designs imported from it.
1. **Done.** The production key made (C4) and its public half put into `Config::PUBLIC_KEYS`.
1. **Done.** Production: Worker deployed to `api.` and `cdn.buildbetters.com`, library uploaded, `check-live` valid.
1. **Done.** On a clean WordPress site with the two packages installed from their ZIP files, all ten designs imported from the production library through the screen.
1. **Done, 27 November 2026.** The plugin raised to 1.0.0 (C6) and part B run again for it.
1. **Done, 27 November 2026,** on the owner's word and without the manual checks (C1): the preparation merged into `main` and the plugin released.

The theme can be released on its own at any time. It does not depend on the plugin.

## Making a release

Only after the part of this list that concerns the product is signed off.

1. Raise the version where it is written (theme: `style.css`, `OPEN_FRAME_VERSION` in `functions.php` and `Stable tag` in `readme.txt`; plugin: the header of its main file, `OFSS_VERSION`, `Stable tag` in its `readme.txt`), add the changelog entry, regenerate the plugin's translation template, run `node bin/build-docs.js`, commit.
2. Try the packaging: `bash bin/release-package.sh theme` or `plugin`. It names what is missing.
3. On GitHub: **Actions → Release → Run workflow**, choose the branch and the product. Or push the tag: `v1.1.0` for the theme, `starter-sites-v1.0.0` for the plugin.
4. Open the release page. Download the ZIP, check it against its checksum, and install it on a test site.

A release that turned out wrong is replaced by running the workflow again with "replace" ticked. A version that people may already have installed is not replaced: fix it and release the next patch version.

## E. WordPress.org

Both products were written to the directory's rules: GPL, no bundled plugins, no remote code, the external service declared in the plugin's readme, Theme Check and Plugin Check clean. Submitting is the owner's step, because it is done from the owner's WordPress.org account.

The checklists for both submissions, and the order to make them in, are in [INTEGRATION.md](INTEGRATION.md). From theme 1.2.0 the theme recommends the plugin once the plugin's slug is set in `functions.php`; that slug exists only after the plugin is approved.

**Theme:** upload `open-frame-<version>.zip` at <https://wordpress.org/themes/upload/>. A reviewer answers in the theme's ticket, usually with requests for changes. After approval, later versions are uploaded the same way.

**Plugin:** only after part D. Submit `open-frame-starter-sites-<version>.zip` at <https://wordpress.org/plugins/developers/add/>. After approval the plugin gets a Subversion repository: the contents of the ZIP go into `trunk` and a tag, the files of `.wordpress-org/` into `assets`.

Points a reviewer is likely to raise, and the answers:

- *The plugin downloads content from the author's server.* It downloads data only (texts, pictures, fonts, Elementor settings), never code; the list is signed and every file is checked; the service, what is sent and its privacy terms are declared under "External services" in the readme.
- *The plugin installs other plugins.* Only from WordPress.org, with WordPress's own installer, only when the user clicks the button, and only plugins a design names.
- *Elementor Pro.* It is detected and linked to. It is never installed, bundled or unlocked.
- *Trademarks.* The plugin's name does not start with another product's name; "Elementor" and "WooCommerce" appear only to say what a design needs.

When a product is listed, change "How updates reach you" in [docs/SUPPORT.md](../SUPPORT.md) and the download instructions in [docs/INSTALL.md](../INSTALL.md).

## After a release

- Watch the issue tracker for the first days.
- Add the release to "Status" at the top of this file, with the date and who signed off.
- Start the next version's changelog entry with the first change, not at the end.
