# Open Frame Starter Sites — Developer Reference

For people who extend the plugin, integrate with it, run their own library, or work on its code. It describes the plugin as it is in version 1.0.0.

Related documents: the design of the whole system and the reasons behind it are in [STARTER-SITES-ARCHITECTURE.md](STARTER-SITES-ARCHITECTURE.md); building, signing and publishing the library in [LIBRARY.md](LIBRARY.md); the tests and their results in [TESTING.md](TESTING.md); releasing in [RELEASE.md](RELEASE.md). The theme's hooks are in [chapter 23 of the theme guide](../README.md#23-child-themes-and-developer-reference).

## At a glance

| | |
| --- | --- |
| Folder | `companion/open-frame-starter-sites` |
| Namespace | `OpenFrame\StarterSites`, PSR-4 under `src/`, loaded by the plugin's own autoloader (no Composer at run time) |
| Text domain | `open-frame-starter-sites`, template in `languages/open-frame-starter-sites.pot` |
| Prefixes | Options, transients, hooks and error codes `ofss_`; post and term meta `_ofss_`; post type `ofss_site_part` |
| Requires | WordPress 6.4, PHP 7.4, the Open Frame theme as the active (parent) theme |
| JavaScript | One file, `assets/admin/app.js`, written against `wp.element`, `wp.components`, `wp.apiFetch` and `wp.i18n`. No build step |
| Custom tables | None |
| Front end | Nothing is loaded for visitors except, where a design uses them: the styles of Site Parts, and the `@font-face` rules of the design's fonts |

### Where things are

| Path | What it holds |
| --- | --- |
| `src/Plugin.php` | Wires everything together on `plugins_loaded` |
| `src/Config.php` | Library address, public keys, allowed hosts, capability |
| `src/Admin/Page.php` | The screen under Appearance and its script data |
| `src/Cloud/` | HTTP client, catalog (fetch, verify, validate, cache), manifests, Ed25519 signature check |
| `src/Requirements/` | What a design needs against what the site has; installing plugins from WordPress.org |
| `src/Import/Runner.php` | The import as a resumable sequence of steps |
| `src/Import/Rollback.php` | Undoing a run |
| `src/Import/Package.php` | Downloading and opening a package |
| `src/Import/ContentGuard.php` | Refuses Elementor content that could run code |
| `src/Import/TokenResolver.php` | Replaces references such as `ofss://media/hero` and `ofss://page/about` with IDs and addresses of this site |
| `src/Elementor/Adapter.php` | The only file that calls Elementor's PHP API |
| `src/SiteParts/` | Header, footer and 404 as editable documents for free Elementor |
| `src/Fonts/` | Fonts of imported designs: storage, `@font-face`, Elementor's font list |
| `src/Widgets/NavMenu.php` | The "Navigation Menu (Open Frame)" widget for Elementor |
| `src/Rest/` | REST controllers |
| `src/History/Log.php` | The last twenty runs |
| `uninstall.php` | Removes the plugin's own data |

## Hooks

The plugin has three hooks. They are part of its public interface and follow the [version promise](../SUPPORT.md#versions).

### `ofss_capability` (filter)

The capability needed to see the Starter Sites screen and to call its REST routes. Default `manage_options`.

```php
add_filter( 'ofss_capability', function () {
	return 'edit_theme_options';
} );
```

Installing, activating and updating plugins from the screen additionally needs WordPress's own `install_plugins`, `activate_plugins` and `update_plugins`. The filter does not change that.

### `ofss_asset_hosts` (filter)

The hosts that may serve preview pictures, packages, media and fonts. An address from the catalog that points anywhere else is refused.

```php
/**
 * @param string[] $hosts    Host names, with ":port" when it is not the default port.
 * @param string   $api_base Address of the library API.
 */
add_filter( 'ofss_asset_hosts', function ( $hosts, $api_base ) {
	$hosts[] = 'downloads.example.com';
	return $hosts;
}, 10, 2 );
```

With the default library the hosts are `api.buildbetters.com` and `cdn.buildbetters.com`. With another library (see below) the default is the host of that library.

### `ofss_import_complete` (action)

Fires once when an import has finished, after everything is stored. Use it to empty a page cache, rebuild an index, or record the event.

```php
/**
 * @param string $site  ID of the design, for example "business".
 * @param array  $state The finished run: id, site, name, version, counts, warnings, created.
 */
add_action( 'ofss_import_complete', function ( $site, $state ) {
	if ( function_exists( 'my_cache_purge_all' ) ) {
		my_cache_purge_all();
	}
}, 10, 2 );
```

Treat `$state` as read-only information. Its keys other than those named above are internal and may change.

There is no hook that changes what is imported. A design is verified against the signed catalog, and a filter that altered it would make that check meaningless.

## Constants

Both belong in `wp-config.php`.

| Constant | Type | Effect |
| --- | --- | --- |
| `OFSS_API_BASE` | string | Address of the library API, without a trailing slash. Replaces `https://api.buildbetters.com/v1`. Must be `https://`. `http://` is accepted only for `localhost` or `127.0.0.1` on a site whose environment type is `local` or `development`. Any other value is ignored |
| `OFSS_PUBLIC_KEYS` | array, key ID => public key in base64 | The keys a catalog may be signed with. **Honoured only when** `OFSS_API_BASE` points away from the default library **and** `wp_get_environment_type()` is `local` or `development`. On a live site the keys that ship with the plugin cannot be replaced |

The second rule is deliberate: whoever can define a constant on a production site should not thereby be able to make it trust another signer.

## Running your own library

The sources of the ten designs are in `starter-sites/`, and `tools/library.mjs` builds, signs, verifies and publishes a library from them. [LIBRARY.md](LIBRARY.md) describes each command.

**On a development site**

```bash
node tools/library.mjs keygen --out dev.key
node tools/library.mjs build --out build/library --api http://localhost:8891/v1 --cdn http://localhost:8891/v1 --key dev.key
node tools/library.mjs public --key dev.key          # prints the key ID and the public key
```

Serve `build/library` on that port, then in `wp-config.php`:

```php
define( 'WP_ENVIRONMENT_TYPE', 'local' );
define( 'OFSS_API_BASE', 'http://localhost:8891/v1' );
define( 'OFSS_PUBLIC_KEYS', array( '<key id>' => '<public key>' ) );
```

`tests/env/setup.sh` does all of this for you and installs WordPress, the theme and the plugin beside it.

**On a live site** a library of your own needs a build of the plugin that carries your public key: put it into `Config::PUBLIC_KEYS`, set `Config::DEFAULT_API_BASE` and `Config::DEFAULT_ASSET_HOSTS` (or define `OFSS_API_BASE`), and distribute that build under another name and slug. The GPL allows it.

## REST API

Namespace `open-frame-starter-sites/v1`. Every route needs a logged-in user with the capability from `ofss_capability` and a valid REST nonce (`X-WP-Nonce`), as for any WordPress REST route used from the dashboard. Nothing is available to visitors.

| Method | Route | Purpose | Parameters |
| --- | --- | --- | --- |
| GET | `/sites` | The catalog, with what this site still needs for each design | `refresh` (boolean): fetch from the library now |
| GET | `/sites/{id}` | One design: pages, requirements with their state, where each part is edited | |
| POST | `/requirements` | Install, activate or update one plugin a design requires | `site` (design ID), `plugin` (slug). Only plugins the design names, and only from WordPress.org |
| POST | `/imports` | Start an import | `site` (design ID), `confirmed` (boolean, must be `true`) |
| GET | `/imports/current` | The current or most recent run | |
| POST | `/imports/{run}/advance` | Do the next few seconds of work and report | |
| POST | `/imports/{run}/rollback` | Undo the run | |
| GET | `/history` | The last twenty runs | |

A run is a twelve-character ID. `advance` returns the run with `status` (`running`, `done`, `failed`, `rolled_back`), `percent`, `label`, `counts`, `warnings` and `error`; the screen calls it until the status is no longer `running`. Errors are `WP_Error` objects with a code starting with `ofss_`, a message written for the user, and an HTTP status.

The routes exist for the plugin's own screen. They are stable enough to script against in tests, but they are not a public API with a compatibility promise.

## How an import runs

`Runner::STEPS`, in order: `preflight`, `snapshot`, `download`, `media`, `fonts`, `content`, `kit`, `menus`, `documents`, `settings`, `finalize`.

- The browser drives it: each `advance` request works for about four seconds (less where `max_execution_time` is small), saves the run and answers. Nothing depends on WP-Cron or on one long request.
- Every object a run creates is recorded in the run and marked with meta. Rollback deletes exactly those objects and writes back the values saved in the `snapshot` step.
- Objects are found again by their `_ofss_uid` before anything is created, so importing a design twice creates nothing twice.
- `download` verifies the package against the manifest, the manifest against the catalog, and the catalog against its signature. `ContentGuard` then checks every Elementor document in the package before anything is created.
- A transient lock keeps two windows from running the same import at once. It expires by itself after a request that died.

## What the plugin stores

| Kind | Name | Content |
| --- | --- | --- |
| Option | `ofss_catalog` | The verified list of designs and when it was fetched |
| Option | `ofss_import_state` | The current or most recent run |
| Option | `ofss_snapshot_{run}` | The settings a run changed, as they were before. Deleted when the next import starts |
| Option | `ofss_active_site` | The design that was imported last, with its version |
| Option | `ofss_history` | The last twenty runs |
| Option | `ofss_fonts` | The fonts imported designs brought |
| Transient | `ofss_import_lock` | The lock described above |
| Post meta | `_ofss_site`, `_ofss_uid`, `_ofss_run`, `_ofss_hash` | On every imported page, post, product, attachment, menu item, Site Part and template |
| Post meta | `_ofss_source_hash` | On attachments: the SHA-256 of the source file, so that a picture is not downloaded twice |
| Post meta | `_ofss_location` | On a Site Part: `header`, `footer` or `404` |
| Term meta | `_ofss_site`, `_ofss_uid`, `_ofss_run` | On imported categories and menus |
| Post type | `ofss_site_part` | Site Parts |
| Files | `wp-content/uploads/open-frame-fonts/` | Font files, named by their SHA-256 |
| Files | `wp-content/uploads/open-frame-starter-sites/` | Working folder of a run that is in progress; removed when it ends |

`uninstall.php` removes the options, the transient, the font files and the working folder. It leaves posts, terms, attachments and their meta: they are the user's content.

Settings of WordPress, the theme and Elementor that an import changes, and a rollback restores: `show_on_front`, `page_on_front`, `page_for_posts`, the theme mods of the active theme, the menu locations, and Elementor's active kit.

## Site Parts and the theme

For designs made with free Elementor, the header, footer and 404 page are posts of the type `ofss_site_part`, edited in Elementor. The plugin shows them through two filters of the theme (since Open Frame 1.1.0):

- `open_frame_has_location` — whether something replaces a location (`header`, `footer`, `single`, `archive`, `404`);
- `open_frame_do_location` — prints the replacement and returns `true`.

Elementor Pro's Theme Builder uses the same two filters through the theme, and takes priority when both have something for a location. Your own code can use them the same way.

## Translating

All strings of the screen and of the import are translatable, in PHP and in JavaScript. To regenerate the template after changing strings:

```bash
cd companion/open-frame-starter-sites
wp i18n make-pot . languages/open-frame-starter-sites.pot --slug=open-frame-starter-sites --domain=open-frame-starter-sites
```

Translations of the JavaScript are loaded with `wp_set_script_translations()`; create them with `wp i18n make-json`. The texts of the starter sites themselves are content in English, and are not translated by the plugin.

## Working on the plugin

```bash
bash tests/env/setup.sh                      # WordPress with SQLite, the theme, the plugin and a signed test library
( cd tests && npm install )
( cd tests && npm run test:php )             # the plugin's PHP checks and the import engine
( cd tests && npm test )                     # browser checks; OFT_BROWSER=firefox or webkit for the other engines
composer lint                                # WordPress coding standards for theme and plugin
bash bin/build-plugin-zip.sh                 # dist/open-frame-starter-sites.zip
bash tests/library/rehearsal.sh              # the whole way: build, publish to a local Worker, import all ten
```

[TESTING.md](TESTING.md) says what each of these covers. Rules that the checks enforce and reviews expect:

- Nothing from the library is ever executed. No `eval`, no `include` of a downloaded file, no unserializing of downloaded data.
- Every address from the catalog is checked against `ofss_asset_hosts` before it is requested.
- Every REST route checks the capability; every write is preceded by an explicit action of the user on the screen.
- Only the `Elementor\Adapter` class may call Elementor's API, so that a change in Elementor is repaired in one place.
- User-facing sentences say what happened and what to do, without internal terms.
- No secret belongs in the plugin: it holds public keys only. The private signing key never enters the repository.
