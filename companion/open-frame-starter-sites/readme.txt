=== Open Frame Starter Sites ===

Contributors: mostafijemon
Tags: starter sites, elementor, templates, demo, open frame
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.3.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Import complete starter websites for the Open Frame theme with one click, see what each design needs, and undo an import if you change your mind.

== Description ==

Open Frame Starter Sites adds a screen under **Appearance > Starter Sites** where you can look through complete website designs made for the [Open Frame](https://github.com/Mostafijemon24/Open-Frame-Theme) theme.

For every design you can see:

* a preview and the list of pages it contains;
* whether it works with the free version of Elementor or needs Elementor Pro;
* which parts you will edit with Elementor and which are set in the Customizer;
* what your site still needs: the WordPress and PHP versions, the theme, and the required plugins.

Required plugins that are available on WordPress.org can be installed and activated from the same screen with one button. Elementor Pro is a commercial plugin sold by Elementor; this plugin tells you when a design needs it and links to it, but never installs it.

A design that is available can be imported from the same screen. The import adds the design's pages, images, menu, header and site-wide colors and fonts, and makes its home page your home page. Nothing you already have is deleted. Every import can be undone with "Roll back this import", which removes what was added and restores the settings that were changed. If the browser is closed while an import runs, the screen offers to continue it or roll it back.

**This is an early version.** The designs in the library are still marked "Coming soon"; they become importable as they are published.

The plugin needs the Open Frame theme (or a child theme of it) to be active.

== External services ==

This plugin connects to the Open Frame starter site library, a service run by the author of the plugin, to download the list of available designs and their preview images.

* **What it is used for:** showing the designs on the Starter Sites screen and downloading the design you choose to import. Without it there is nothing to show or import.
* **When requests are made:** when an administrator opens the Starter Sites screen and the saved list is older than 12 hours, when they click "Check for new designs", and when they import a design (its package and images are downloaded). Preview images are loaded by the administrator's browser while the screen is open. Nothing is requested on the public side of your site.
* **What is sent:** the request itself, which like any web request includes the IP address of your server (for the list) or of your browser (for the images), and the name and version of this plugin. No information about your site, its address, its content or its users is sent.
* **Where it goes:** `api.buildbetters.com` (the list) and `cdn.buildbetters.com` (images), both served through Cloudflare. Cloudflare's privacy policy: https://www.cloudflare.com/privacypolicy/ and terms: https://www.cloudflare.com/website-terms/

When you choose to install a required plugin, WordPress downloads it from WordPress.org with its own installer, exactly as it does under Plugins > Add New. WordPress.org's privacy policy: https://wordpress.org/about/privacy/

== Installation ==

1. Install and activate the Open Frame theme.
2. Upload the plugin under Plugins > Add New > Upload Plugin and activate it.
3. Go to Appearance > Starter Sites.

== Frequently Asked Questions ==

= Do I need Elementor Pro? =

Only for the designs marked "Needs Elementor Pro". The others work with the free version of Elementor. You can show only one kind with the "Elementor version" filter.

= Why can't I import a design? =

A design can be imported when it is no longer marked "Coming soon" and everything under "What it needs" is met. The screen shows what is missing.

= What does an import change, and can I undo it? =

It adds pages, images and a menu, sets the home page, and changes Elementor's Site Settings (colors and fonts), some theme settings and the header. It deletes nothing. "Roll back this import" removes what the import added and restores the earlier home page and settings. Only the most recent import can be rolled back, and changes you made to the imported pages are lost when you do. For a site with visitors, make a backup first.

= Are the header and footer editable? =

Yes. A design's header, footer and "page not found" page are stored as Site Parts (Appearance > Site Parts) and edited with Elementor, also with its free version. If you use Elementor Pro's Theme Builder, its templates take priority.

= The list does not load. =

Your server has to be able to make outgoing HTTPS requests. If the library cannot be reached, the list saved earlier is shown. Click "Check for new designs" to try again.

= Does the plugin change my site? =

Only when you click a button that says it will: "Install and activate", "Activate" or "Update" next to a required plugin, or "Start the import" after confirming what will change. Browsing changes nothing.

= What does the plugin store? =

A copy of the list of designs, the record of the last import and a short import history (options starting with `ofss_`). They are removed when you delete the plugin. Imported pages and images are your content and stay.

== Changelog ==

= 0.3.0 =
* New: Business, the first complete design. Ten pages, three articles, a header, a footer and a "page not found" page, built with the free version of Elementor.
* New: designs can include blog posts with their categories and featured images. Rolling back removes them again.
* New: a "Navigation Menu (Open Frame)" widget for Elementor, so a header made with free Elementor shows your WordPress menu, including the mobile menu of the theme.
* Fix: links to the home page of a design point at your site address instead of at /home/.

= 0.2.0 =
* New: one-click import of an available design, in small steps that survive slow servers and a closed browser.
* New: "Roll back this import" removes what an import added and restores the settings it changed.
* New: Site Parts. A design's header, footer and "page not found" page are edited with Elementor, including its free version.
* New: the list of designs is only used when it carries a valid signature of the library, and every download is checked against its checksum.

= 0.1.0 =
* First version: the Starter Sites screen with search and filters, design details, requirement checks, and installation of required plugins from WordPress.org.
