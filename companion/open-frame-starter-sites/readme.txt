=== Open Frame Starter Sites ===

Contributors: mostafijemon
Tags: starter sites, elementor, templates, demo, open frame
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Browse the starter website library for the Open Frame theme, see what each design needs and get your site ready for it.

== Description ==

Open Frame Starter Sites adds a screen under **Appearance > Starter Sites** where you can look through complete website designs made for the [Open Frame](https://github.com/Mostafijemon24/Open-Frame-Theme) theme.

For every design you can see:

* a preview and the list of pages it contains;
* whether it works with the free version of Elementor or needs Elementor Pro;
* which parts you will edit with Elementor and which are set in the Customizer;
* what your site still needs: the WordPress and PHP versions, the theme, and the required plugins.

Required plugins that are available on WordPress.org can be installed and activated from the same screen with one button. Elementor Pro is a commercial plugin sold by Elementor; this plugin tells you when a design needs it and links to it, but never installs it.

**This is an early version.** The designs are marked "Coming soon", and importing a design into your site is not part of version 0.1.0 yet. It will arrive in a later version.

The plugin needs the Open Frame theme (or a child theme of it) to be active.

== External services ==

This plugin connects to the Open Frame starter site library, a service run by the author of the plugin, to download the list of available designs and their preview images.

* **What it is used for:** showing the designs on the Starter Sites screen. Without it there is nothing to show.
* **When requests are made:** when an administrator opens the Starter Sites screen and the saved list is older than 12 hours, and when they click "Check for new designs". Preview images are loaded by the administrator's browser while the screen is open. Nothing is requested on the public side of your site.
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

Importing is not part of this version. The screen already shows what each design will need, so you can prepare your site.

= The list does not load. =

Your server has to be able to make outgoing HTTPS requests. If the library cannot be reached, the list saved earlier is shown. Click "Check for new designs" to try again.

= Does the plugin change my site? =

Only when you click a button that says it will: "Install and activate", "Activate" or "Update" next to a required plugin. Browsing changes nothing.

= What does the plugin store? =

A copy of the list of designs (the option `ofss_catalog`). It is removed when you delete the plugin.

== Changelog ==

= 0.1.0 =
* First version: the Starter Sites screen with search and filters, design details, requirement checks, and installation of required plugins from WordPress.org.
