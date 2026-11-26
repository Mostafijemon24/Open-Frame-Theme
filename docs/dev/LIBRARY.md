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
v1/previews/<site>/thumbnail.png                1200 x 900
v1/sites/<site>/<version>/manifest.json         what the version consists of, with checksums
v1/sites/<site>/<version>/package.zip           JSON only: pages, settings, menus
v1/sites/<site>/<version>/media/<sha256>.<ext>  images, named by their checksum
v1/sites/<site>/<version>/fonts/<sha256>.woff2
```

A version of a site is published once and never modified. A change is a new version.

## Why a user can trust what arrives

1. `catalog.json` is an envelope: the catalog as text, plus an Ed25519 signature over exactly that text. The plugin carries the public key and refuses a catalog without a valid signature, including a "newer" one from the right server.
2. The catalog names each manifest by its SHA-256. The plugin refuses a manifest that does not match.
3. The manifest names the package and every image and font by SHA-256 and size.

So the server, the storage and the connection can all be wrong without the plugin installing anything the signing key did not approve. The signing key is the one thing to protect.

On top of that, the tools refuse to build a package that contains anything but JSON and Markdown, links to the site it was authored on, script, references that do not resolve, settings outside a short allow-list, images without a licence, or files over the size budget. The plugin repeats the checks that matter on its side.

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

One-time setup on Cloudflare: create the R2 buckets `open-frame-library` and `open-frame-library-staging`. In the repository, add the secrets `CLOUDFLARE_API_TOKEN` (a token limited to Workers and R2), `CLOUDFLARE_ACCOUNT_ID` and `OFSS_SIGNING_KEY`, and the variable `LIBRARY_STAGING_URL`.

Then run the **Publish library** workflow from the Actions tab and choose staging or production. It tests the tools and the Worker, builds and signs, verifies the result with the public key, deploys the Worker and uploads the files, the catalog last. For production it also checks that the plugin knows the key.

By hand, the same steps are:

```bash
node tools/library.mjs build --out dist/library --api https://api.buildbetters.com/v1 --cdn https://cdn.buildbetters.com/v1 --key library-signing.key
```

```bash
node tools/library.mjs verify --out dist/library --api https://api.buildbetters.com/v1 --cdn https://cdn.buildbetters.com/v1 --public "<key id>=<public key>"
```

```bash
node tools/library.mjs publish --out dist/library --bucket open-frame-library --dry-run
```

Remove `--dry-run` to upload. Taking a bad catalog back is publishing the previous one again; the versioned files it pointed to are still there.

## Adding or changing a design

1. Edit or add `starter-sites/<site>/`. While a design has no content, `status` is `coming_soon`. A design is written as a generator, `tools/sites/<site>.mjs`, which writes the pages, site parts, posts, Site Settings and theme settings as JSON into that folder (`node tools/sites/business.mjs`; `business-art.mjs` draws its images, `previews.mjs` captures the preview pictures from a site that has it imported). Shared builders are in `tools/sites/kit.mjs` and `tools/sites/art.mjs`. Font files of a design go into `fonts/files/` with their licence in `LICENSES.md`. Commit the generator and its output together, and add a test file like `tests/e2e/portfolio.test.js` that describes the design to the shared checks.
2. When its content is ready, set `status` to `available`, list the Elementor widgets it uses under `requires.elementor.widgets`, and raise `version` for every later change.
3. Run the tools tests and a build; the build explains what is wrong, file by file.
4. Publish to staging, import it on a test site, then publish to production.

No plugin or theme release is needed for a new design, as long as the format number stays the same.

## Testing without Cloudflare

`tests/env/setup.sh` builds the library from `starter-sites/` plus the small reference package in `tests/fixtures/sites/reference`, signs it with a throw-away key, and serves it on port 8891 through `tests/fixtures/cloud/router.php`. The test site's `wp-config.php` points the plugin at it and supplies that key. The router can be told to misbehave (`cloud-mode` file): down, not JSON, wrong shape, unsigned, altered after signing, signed with a foreign key, and others.

```bash
cd tools && npm install && npm test
```

```bash
node --test cloud/worker/test/*.test.mjs
```
