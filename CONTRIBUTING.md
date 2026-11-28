# Contributing to Open Frame

Thank you for taking the time. This repository holds two products, released separately:

| Product | Where | Text domain |
| --- | --- | --- |
| **Open Frame**, the theme | the repository root | `open-frame` |
| **Open Frame Starter Sites**, the plugin | `companion/open-frame-starter-sites/` | `open-frame-starter-sites` |

The ten starter sites are in `starter-sites/`, the tools that build their library in `tools/`, and the service that delivers it in `cloud/worker/`.

## Reporting a problem

Open an [issue](https://github.com/Mostafijemon24/Open-Frame-Theme/issues) and say what you did, what you expected and what happened, with the versions of WordPress, PHP, the theme and the plugin. A screenshot helps. What is supported, and for how long, is in the [support and update policy](docs/SUPPORT.md).

**Security problems are reported privately**, not in an issue: see [SECURITY.md](SECURITY.md).

## Proposing a change

1. For anything larger than a fix, open an issue first, so the idea can be discussed before you write it.
2. Fork the repository and make a branch from `main`.
3. Keep a pull request to one subject, and say in it what changed and how you checked it.

### Setting up

You need PHP 7.4 or newer with the `sqlite3`, `sodium` and `zip` extensions, Composer and Node.js 20 or newer.

```bash
composer install
```

```bash
bash tests/env/setup.sh
```

The second command builds a disposable WordPress site with the theme and the plugin linked into it. [docs/dev/TESTING.md](docs/dev/TESTING.md) describes the test suites and [docs/dev/ARCHITECTURE.md](docs/dev/ARCHITECTURE.md) how the theme is put together.

### Before you open a pull request

```bash
composer lint
```

```bash
node bin/build-docs.js
```

```bash
node bin/check-docs.js
```

Run the test suites that cover what you changed. Continuous integration runs all of them on every push: coding standards, PHP syntax on 7.4, 8.1 and 8.3, the library tools, the guides and packages, a rehearsal of publishing and importing, the browser checks, Theme Check and Plugin Check.

### What a change has to respect

- **WordPress Coding Standards**, PHP 7.4 and WordPress 6.4 as the oldest supported versions.
- **The theme stays complete on its own.** It needs no plugin, bundles its fonts and makes no remote requests. Plugins it recommends are optional and come from WordPress.org only.
- **The plugin never downloads or runs code.** A starter site is data, and every download is checked against the signed list of designs.
- **Every string is translatable**, with the text domain of the product it belongs to.
- **Accessibility is part of the work**: keyboard use, visible focus, contrast and landmarks are checked by the tests.
- **User-visible changes go into the changelog** of the product's `readme.txt`. `CHANGELOG.md` and the HTML guides are generated from their sources by `node bin/build-docs.js`; do not edit them by hand.

## Licence

Open Frame and Open Frame Starter Sites are licensed under the GNU General Public License, version 2 or later. By contributing you agree that your contribution is licensed the same way. Pictures and fonts added to a starter site must be in the public domain, under CC0 or under the SIL Open Font License, with their source recorded as [starter-sites/LICENSES.md](starter-sites/LICENSES.md) describes.
