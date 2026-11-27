# The starter site library

How the designs get from this repository to a user's WordPress site, and how to publish them. The architecture is in [STARTER-SITES-ARCHITECTURE.md](STARTER-SITES-ARCHITECTURE.md); this page is the working manual.

## What is where

| Part | Location | Role |
| --- | --- | --- |
| Sources | `starter-sites/<site>/` | One folder per design: `site.json` (catalog entry), `preview/`, and, once the design exists, `content/`, `site/`, `media/`, `fonts/` |
| Tools | `tools/library.mjs` | Build, check, sign and upload the library. Plain Node.js, no dependencies at run time |
| Schemas | `schemas/` | The shape of the catalog, its signed envelope and a site manifest. The tools and the plugin both follow them |
| API | `cloud/worker/` | A Cloudflare Worker that serves the files from an R2 bucket, read-only |
| Client | `companion/open-frame-starter-sites/src/Cloud/` | Downloads the catalog, verifies its signature, validates every field |

Addresses: `https://api.buildbetters.com/v1/catalog.json` for the catalog and manifests, `https://cdn.buildbetters.com/v1/…` for packages, media and previews. Both names point at the same Worker.

## What is published

```
v1/catalog.json                                 the signed list of designs (the only file that ever changes)
v1/previews/<site>/thumbnail.<hash>.png         1200 x 900; the name contains the picture's checksum
v1/previews/<site>/<name>.<hash>.png            further preview pictures
v1/sites/<site>/<version>/manifest.json         what the version consists of, with checksums
v1/sites/<site>/<version>/package.zip           JSON only: pages, settings, menus
v1/sites/<site>/<version>/media/<sha256>.<ext>  images, named by their checksum
v1/sites/<site>/<version>/fonts/<sha256>.woff2
```

A version of a site is published once and never modified. A change is a new version. This is enforced: before anything is uploaded, `publish --live` downloads what is already there and compares it, and a design whose content changed while its version number stayed the same stops the publication ("business 1.0.0 is already published with different content").

Everything except the catalog is served with a cache lifetime of one year. That is why a preview picture carries its checksum in its name: a new picture gets a new address, and the catalog, which is cached for five minutes, points to it.

## Why a user can trust what arrives

1. `catalog.json` is an envelope: the catalog as text, plus an Ed25519 signature over exactly that text. The plugin carries the public key and refuses a catalog without a valid signature, including a "newer" one from the right server.
2. The catalog names each manifest by its SHA-256. The plugin refuses a manifest that does not match.
3. The manifest names the package and every image and font by SHA-256 and size.

So the server, the storage and the connection can all be wrong without the plugin installing anything the signing key did not approve. The signing key is the one thing to protect.

On top of that, the tools refuse to build a package that contains anything but JSON and Markdown, links to the site it was authored on, script, embedded frames or style blocks, raw HTML or shortcode widgets, hand-written CSS or attributes, icons Elementor does not have, references that do not resolve, settings outside a short allow-list, images without a licence, or files over the size budget. The plugin repeats the checks that matter on its side: it refuses the same content before it creates anything, and it refuses a catalog older than the one it already has.

## The signing key

```bash
node tools/library.mjs keygen --out library-signing.key
```

This prints a key ID and a public key and writes the private key to the file. Then:

1. Put the key ID and public key into `Config::PUBLIC_KEYS` in the plugin (`'<key id>' => '<public key>'`) and release the plugin.
2. Store the contents of the file as the repository secret `OFSS_SIGNING_KEY`.
3. Keep a second copy of the file somewhere safe and offline. If it is lost, no new catalog can be published until a plugin release introduces a new key. If it leaks, whoever has it can sign a catalog, so replace it.
4. Delete the file from the machine it was generated on. It must never be committed.

Replacing a key: add the new public key to the plugin next to the old one and release; sign with both keys for a while (the envelope takes several signatures); then drop the old key from the plugin.

**Until a key is in `Config::PUBLIC_KEYS`, the plugin accepts no catalog from the real library.** That is intended: it fails closed.

## Publishing

In the repository, add the secrets `CLOUDFLARE_API_TOKEN` (a token limited to Workers and R2), `CLOUDFLARE_ACCOUNT_ID` and `OFSS_SIGNING_KEY`, and the variable `LIBRARY_STAGING_URL`. The R2 buckets `open-frame-library` and `open-frame-library-staging` are created by the workflow if they do not exist.

Then run the **Publish library** workflow from the Actions tab and choose staging or production. In this order it:

1. tests the tools and the Worker;
2. builds and signs the library, and verifies the result with the public key;
3. for production, checks that the plugin knows the key;
4. creates the bucket if needed and deploys the Worker;
5. compares the build with what is live, uploads only what is new, and replaces the catalog last;
6. downloads the live catalog and every file it leads to, and checks the signature and each checksum (`check-live`).

If step 5 finds a published version with different content, nothing is uploaded. If an upload fails half-way, the catalog has not been replaced, so users still see the previous library; running the workflow again continues where it stopped.

By hand, the same steps are:

```bash
node tools/library.mjs build --out dist/library --api https://api.buildbetters.com/v1 --cdn https://cdn.buildbetters.com/v1 --key library-signing.key
```

```bash
node tools/library.mjs verify --out dist/library --api https://api.buildbetters.com/v1 --cdn https://cdn.buildbetters.com/v1 --public "<key id>=<public key>"
```

```bash
node tools/library.mjs plan --out dist/library --live https://api.buildbetters.com/v1
```

```bash
node tools/library.mjs publish --out dist/library --bucket open-frame-library --live https://api.buildbetters.com/v1
```

```bash
node tools/library.mjs check-live --api https://api.buildbetters.com/v1 --public "<key id>=<public key>"
```

`plan` says how many files would be uploaded, skipped or refused, and uploads nothing. `publish --dry-run` prints the upload commands instead of running them. Without `--live`, `publish` uploads every file and compares nothing; use that only for a bucket that is known to be empty. Taking a bad catalog back is publishing the previous one again; the versioned files it pointed to are still there.

## Rehearsing a publication without Cloudflare

```bash
bash tests/library/rehearsal.sh
```

This does everything a publication does, on one machine: it builds the theme and plugin ZIPs, builds and signs the library with a key made for the rehearsal, starts the Worker with wrangler's simulated R2 bucket, publishes into it with the same `publish` command, publishes a second time (only the catalog may be uploaded), tries to publish a changed Business 1.0.0 (must be refused, and the live catalog must stay as it was), and checks what is live file by file. Then it installs WordPress with nothing in it, installs the theme and the plugin from the ZIPs, and for every design: opens Appearance > Starter Sites, lets the screen activate the plugins the design needs, imports the design, follows every link from the home page as a visitor (status, pictures, script errors, leftover references, requests to other sites), rolls the import back and compares the site with what it was before. Before each design the database and the uploads folder are put back to the clean state.

The result is printed and written to `report.json` in the rehearsal folder, with a picture of each home page under `shots/`. Elementor Pro cannot be downloaded: without `OFT_ELEMENTOR_PRO_ZIP` the five Pro designs are skipped and the report says so. CI runs the rehearsal that way on every push. What a rehearsal cannot show is Cloudflare itself: the real bucket, the custom domains, DNS and the edge cache.

The same script is the acceptance test for staging and production once they exist: `tests/env/setup.sh` accepts `OFT_LIBRARY_BASE` and `OFT_LIBRARY_KEY`, so a clean site can be pointed at any library and `node tests/library/import-all.js` run against it.

## Licences

`starter-sites/LICENSES.md` is the overview of the whole library: for each design the number of photographs and drawn pictures, their licences, and the fonts in its package. It is written from the designs' own records by `node tools/library.mjs licences`, and the tools tests fail when it is out of date. Each design's own `LICENSES.md` and `CREDITS.md` travel inside its package.

## Adding or changing a design

1. Edit or add `starter-sites/<site>/`. While a design has no content, `status` is `coming_soon`. A design is written as a generator, `tools/sites/<site>.mjs`, which writes the pages, site parts, posts, Site Settings and theme settings as JSON into that folder (`node tools/sites/business.mjs`; `previews.mjs` captures the preview pictures from a site that has it imported). Shared builders are in `tools/sites/kit.mjs`. The pictures of a design are photographs, listed in `photo-sources.json` and prepared by `tools/sites/photos.mjs` (`search "<words>"` to find candidates on Wikimedia Commons, `fetch <site>` to check licences, crop and write `media/files/`, `photos.json` and `CREDITS.md`); only CC0 and public-domain photographs are accepted, and the rules are in the architecture document, section 5.7. Only SaaS still has an art script (`saas-art.mjs`, with `art.mjs`), for the screens of its invented product. A store's products are written by the same generator into `content/products/`. Font files of a design go into `fonts/files/` with their licence in `LICENSES.md`. Commit the generator and its output together, and add a test file like `tests/e2e/portfolio.test.js` that describes the design to the shared checks.
2. When its content is ready, set `status` to `available`, list the Elementor widgets it uses under `requires.elementor.widgets`, and raise `version` for every later change.
3. Run `node tools/library.mjs licences`, the tools tests and a build; the build explains what is wrong, file by file.
4. Run the rehearsal (`bash tests/library/rehearsal.sh <site>`), publish to staging, import it on a test site, then publish to production.

A design that is already published is changed by raising its `version`; the publication refuses anything else.

No plugin or theme release is needed for a new design, as long as the format number stays the same.

## Testing without Cloudflare

`tests/env/setup.sh` builds the library from `starter-sites/` plus the small reference package in `tests/fixtures/sites/reference`, signs it with a throw-away key, and serves it on port 8891 through `tests/fixtures/cloud/router.php`. The test site's `wp-config.php` points the plugin at it and supplies that key. The router can be told to misbehave (`cloud-mode` file): down, not JSON, wrong shape, unsigned, altered after signing, signed with a foreign key, and others.

```bash
cd tools && npm install && npm test
```

```bash
node --test cloud/worker/test/*.test.mjs
```
