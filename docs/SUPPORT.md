# Support and Update Policy

This page says what you can expect from the Open Frame theme, the Open Frame Starter Sites plugin and the library of starter sites: where to get help, what is supported, how updates reach you, and what happens when something has to end.

Open Frame is free software under the GNU GPL, version 2 or later. It is maintained by its author, Mostafij Emon, as an open-source project. There is no paid tier and no paid support.

## Where to get help

| You want to | Go to |
| --- | --- |
| Learn how something works | The [theme guide](README.md), the [Starter Sites guide](STARTER-SITES.md), the [installation guide](INSTALL.md) |
| Report a bug or ask a question | <https://github.com/Mostafijemon24/Open-Frame-Theme/issues> |
| Report a security problem | See [Security](#security) below. Please do not open a public issue |

### A report that can be answered quickly

Please include:

1. what you did, step by step, and what happened instead of what you expected;
2. the versions of Open Frame, Open Frame Starter Sites, WordPress and PHP (**Tools → Site Health → Info**);
3. the versions of Elementor, Elementor Pro and WooCommerce, if the problem involves them;
4. for an import: the name of the design, and the line from **Appearance → Starter Sites → Import history**;
5. a screenshot, and the exact words of any error message.

Do not post passwords, licence keys or other secrets.

Reports are read and answered as time allows. There is no guaranteed response time.

## What is supported

| Supported | Not supported |
| --- | --- |
| The current version of the theme and of the plugin | Older versions. The first answer to a report about an old version is "please update" |
| The versions of WordPress and PHP named under "Requirements" in each guide, up to the WordPress version named as "Tested up to" | Versions of WordPress or PHP below the requirements |
| The ten starter sites as imported, on the versions of Elementor, Elementor Pro and WooCommerce they name | Problems inside Elementor, Elementor Pro or WooCommerce themselves. Those go to their makers. Elementor Pro's support comes with its licence |
| Use on a single site, with the block editor or Elementor | Changes you made to the files of the theme or plugin. Use a child theme and the documented hooks |
| | Conflicts caused by another plugin or by custom code, beyond pointing out where the conflict is |
| | Building or customizing a site for you; hosting, email delivery and server setup |

Not yet checked, and therefore without a promise: WordPress Multisite, right-to-left languages in the starter sites (the theme itself supports them), and servers with less than 128 MB of PHP memory.

## Versions

Theme and plugin use version numbers of the form **major.minor.patch**, each product on its own.

| Part | Changes when | What it means for your site |
| --- | --- | --- |
| **Patch** (1.1.0 → 1.1.1) | A bug or security problem is fixed | Safe to install at once. Nothing looks or works differently, apart from the fix |
| **Minor** (1.1.0 → 1.2.0) | Something is added | Existing settings and content keep working. New options start switched off or with the old behaviour |
| **Major** (1.x → 2.0.0) | Something had to change in a way that is not compatible | The release notes say what to check, and how to carry your settings over |

Versions of the plugin before 1.0.0 were development versions and were not published. The promise above applies from 1.0.0, its first public release.

**Starter sites** have version numbers of their own (for example Business 1.0.0). A published version of a design is never changed afterwards; a correction gets a new number. Your site is not touched when a design is updated: a new version only arrives if you import the design again (see [History and updates of a design](STARTER-SITES.md#13-history-and-updates-of-a-design)).

## How updates reach you

**Today:** new versions are published as releases at <https://github.com/Mostafijemon24/Open-Frame-Theme/releases>, each with its ZIP files, checksums and a list of changes. WordPress does not announce these by itself. To be told, open the repository on GitHub and choose **Watch → Custom → Releases**. You install an update by uploading the new ZIP file ([Updating](INSTALL.md#updating)).

**After acceptance on WordPress.org:** theme and plugin have been prepared for the WordPress.org directories. From the moment they are listed there, updates appear in your dashboard under **Dashboard → Updates** like those of any other theme or plugin, and nothing has to be downloaded by hand. This page will say so when it is the case.

The theme and the plugin contain no update mechanism of their own, and never contact a server to look for updates.

**The list of starter sites** is the one thing that updates by itself: the plugin fetches it from the library at most every twelve hours while an administrator has the Starter Sites screen open.

## What an update never does

- It never deletes or changes your pages, posts, products or pictures.
- It never changes your settings without the release notes saying so.
- It never adds tracking, advertising, or a request to another server on the public side of your site.
- The plugin never downloads or runs program code from the library. A starter site is data: texts, pictures, fonts and Elementor settings. The list of designs is digitally signed, and every file is checked against it.

## Compatibility

- **WordPress:** each release is tested with the current WordPress version and with the oldest one it supports. When a new WordPress version appears, the theme and plugin are tested with it and "Tested up to" is raised, with a patch release if anything needs fixing.
- **PHP:** 7.4 is the oldest supported version. It will be raised only in a minor or major release, announced in the release notes of the version before.
- **Elementor, Elementor Pro, WooCommerce:** each starter site names the oldest version it works with, and the Starter Sites screen checks it before an import. New major versions of these plugins are tested when they appear. If one of them breaks a design, the design gets a corrected version.
- **Browsers:** the current versions of Chrome, Edge, Firefox and Safari.

## Security

If you find a security problem, please report it privately: on the repository's page choose **Security → Report a vulnerability**. If that is not available to you, open an issue that says only "security report, please contact me", without details.

You get an answer as soon as the report has been read. A confirmed problem is fixed in a patch release, and the release notes credit you unless you prefer otherwise. Please give a reasonable time for the fix before you publish details.

## The library service

The list of starter sites, their preview pictures and their packages are served from `api.buildbetters.com` and `cdn.buildbetters.com`, run by the author through Cloudflare.

- **If the service cannot be reached**, the Starter Sites screen shows the list it saved last, and says that the library could not be reached. Importing needs the service. **Sites that were already built keep working without it**: an imported design lives entirely on your own site, with its pages, pictures and fonts.
- **If the service ever has to end**, this will be announced on the releases page at least 90 days before, and the packages of all designs will stay available for download from the repository.
- The source of every design is in the repository, in the folder `starter-sites`, together with the tools that build the library. Anyone can build the library themselves; what a self-hosted library needs is described in the [developer reference](dev/PLUGIN.md#running-your-own-library).

### Terms of use

- The library is run by the author of the theme and the plugin, Mostafij Emon. It is free to use with the Open Frame Starter Sites plugin, without an account, a key or a payment.
- It is provided as it is, without a guarantee that it is always reachable. What happens when it is not is said above.
- Please use it through the plugin, or at a similar pace: the list of designs is saved for twelve hours, and a design is downloaded when someone imports it. Requests that load the service far beyond that may be slowed down or refused.
- What you download you may use on your own sites and on your clients' sites, also commercially. The texts of a design are samples under the GPL, version 2 or later, like the plugin. The photographs are in the public domain or under CC0, and the typefaces under the SIL Open Font License; the file `CREDITS.md` of each design in the repository names the source of every picture.
- These terms can change. A change that takes something away is announced on the releases page at least 90 days before.

### Privacy

- **What the service receives** is what every web request contains: the IP address of the server or browser that asks, the time, the address of the file asked for, and the name and version of the plugin. It receives nothing about your site: not its address, its content, its users or its visitors. The preview pictures are requested by your browser without a referrer.
- **What is kept:** the service's own program stores nothing about a request and sets no cookie. It runs on Cloudflare's network, and Cloudflare processes each request in order to deliver it, as described in [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/). From Cloudflare the author sees statistics that name no one, such as the number of requests per day and per country.
- **What it is used for:** delivering the files, and keeping the service running. Nothing is sold, shared for advertising or combined with other data.
- **No account, no tracking, no licence check.**
- Questions about this go to the author through the [issue tracker](https://github.com/Mostafijemon24/Open-Frame-Theme/issues), or privately through the security reporting form named above.

The same is said from the point of view of your site under [Privacy in the Starter Sites guide](STARTER-SITES.md#14-privacy).

## If the project ends

Open Frame is free software. Whatever happens to the project, you keep the right to use, study, change and share the versions you have. If maintenance ever stops, this will be said clearly at the top of the repository's front page, and the last versions stay available there.

## Licences

- Theme and plugin: GNU General Public License, version 2 or later.
- Bundled fonts: SIL Open Font License 1.1.
- Starter sites: texts and layouts under the GPL, version 2 or later. Photographs are in the public domain or under CC0; every source is listed in [`starter-sites/LICENSES.md`](../starter-sites/LICENSES.md).
- Elementor Pro is a commercial product of Elementor Ltd. and is not part of this project. Elementor and WooCommerce are separate free plugins from WordPress.org.
