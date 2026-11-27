=== Open Frame Starter Sites ===

Contributors: mostafijemon
Tags: starter sites, elementor, templates, demo, open frame
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.6.1
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

**The library holds ten designs.** Business, Portfolio, Restaurant, Education and Medical work with the free version of Elementor. Creative Agency, SaaS, Real Estate, Magazine and Shop need Elementor Pro; Shop also needs WooCommerce. Texts, names and prices in the designs are samples to replace with your own. The photographs are in the public domain or under CC0 and may stay on your site.

A design never contains program code. It is data: texts, pictures, fonts and Elementor settings. The list of designs is digitally signed, every download is checked against it, and the plugin refuses a package that contains script.

The plugin needs the Open Frame theme (or a child theme of it) to be active.

= Documentation =

The user guide with screenshots: https://github.com/Mostafijemon24/Open-Frame-Theme/blob/main/docs/STARTER-SITES.md

Support and update policy: https://github.com/Mostafijemon24/Open-Frame-Theme/blob/main/docs/SUPPORT.md

== External services ==

This plugin connects to the Open Frame starter site library, a service run by the author of the plugin, to download the list of available designs and their preview images.

* **What it is used for:** showing the designs on the Starter Sites screen and downloading the design you choose to import. Without it there is nothing to show or import.
* **When requests are made:** when an administrator opens the Starter Sites screen and the saved list is older than 12 hours, when they click "Check for new designs", and when they import a design (its package and images are downloaded). Preview images are loaded by the administrator's browser while the screen is open. Nothing is requested on the public side of your site.
* **What is sent:** the request itself, which like any web request includes the IP address of your server (for the list) or of your browser (for the images), and the name and version of this plugin. No information about your site, its address, its content or its users is sent.
* **Where it goes:** `api.buildbetters.com` (the list) and `cdn.buildbetters.com` (images), both served through Cloudflare. Cloudflare's privacy policy: https://www.cloudflare.com/privacypolicy/ and terms: https://www.cloudflare.com/website-terms/

When you choose to install a required plugin, WordPress downloads it from WordPress.org with its own installer, exactly as it does under Plugins > Add New. WordPress.org's privacy policy: https://wordpress.org/about/privacy/

== Installation ==

1. Install and activate the Open Frame theme.
2. Upload the plugin under Plugins > Add Plugin > Upload Plugin and activate it.
3. Go to Appearance > Starter Sites.
4. Open a design with "View details". Install what it needs with the buttons in the list, then click "Import this design".

There is no account to create and no key to enter.

== Frequently Asked Questions ==

= Do I need Elementor Pro? =

Only for the designs marked "Needs Elementor Pro". The others work with the free version of Elementor. You can show only one kind with the "Elementor version" filter.

= Why can't I import a design? =

A design can be imported when everything under "What it needs" has a green tick. The screen shows what is missing, and installs Elementor and WooCommerce for you. Elementor Pro has to be bought from Elementor and installed by you.

= Can I use the texts and pictures of a design on my site? =

Yes. The texts are samples for you to replace: the companies, people and prices in them are invented. The photographs are in the public domain or under the CC0 licence, so you may keep them, also on a commercial site.

= I imported a design and changed its pages. What happens if I import it again? =

The pages of that design are put back the way they came from the library, so your changes to them are overwritten. Pages you created yourself are not touched. Import a design again only when you want a fresh copy.

= Can I remove the plugin after importing? =

For the designs made with free Elementor, keep it active: the plugin shows their header, footer and "page not found" page, and serves their fonts. For the designs made with Elementor Pro only the fonts depend on it.

= What does an import change, and can I undo it? =

It adds pages, images and a menu, sets the home page, and changes Elementor's Site Settings (colors and fonts), some theme settings and the header. It deletes nothing. "Roll back this import" removes what the import added and restores the earlier home page and settings. Only the most recent import can be rolled back, and changes you made to the imported pages are lost when you do. For a site with visitors, make a backup first.

= Are the header and footer editable? =

Yes. A design's header, footer and "page not found" page are stored as Site Parts (Appearance > Site Parts) and edited with Elementor, also with its free version. If you use Elementor Pro's Theme Builder, its templates take priority.

= The list does not load. =

Your server has to be able to make outgoing HTTPS requests. If the library cannot be reached, the list saved earlier is shown. Click "Check for new designs" to try again.

= Does the plugin change my site? =

Only when you click a button that says it will: "Install and activate", "Activate" or "Update" next to a required plugin, or "Start the import" after confirming what will change. Browsing changes nothing.

= What does the plugin store? =

A copy of the list of designs, the record of the last import, a short import history and the list of fonts a design brought (options starting with `ofss_`), plus those font files in `wp-content/uploads/open-frame-fonts`. All of this is removed when you delete the plugin. Imported pages and images are your content and stay.

== Screenshots ==

1. The Starter Sites screen: ten designs, with search and filters by category and Elementor version.
2. The details of a design: preview pictures, what it needs with one-click installation, its pages, and where each part is edited.
3. The confirmation before an import says what will be added and what will change.
4. A finished import, with links to the site and the editor and the button to roll it back.
5. The home page of the Business design, edited with Elementor.

== Changelog ==

= 0.6.1 =
* Fixed: on the designs for free Elementor, the styles of the header and the footer were loaded at the end of the page. The header appeared unstyled for a moment and the page jumped. They are now loaded in the head.
* Security: the plugin checks the pages of a design again before storing them, and refuses raw HTML and shortcode widgets, script, embedded frames, style blocks and hand-written CSS or attributes, even in a package that is correctly signed.
* Security: a list of designs that is older than the one the site already has is not accepted, even with a valid signature.
* Security: values of a design's Site Settings are reduced to what a color, a font name or a size can contain.
* Fixed: when a plugin a design needs cannot be installed because its current version needs a newer WordPress or PHP, the screen says so instead of "The package could not be installed".
* Changed: an import reports back every few seconds, so the progress bar moves on a fast server too instead of waiting at 0% and jumping to the end.
* Fixed: the confirmation before an import named a number of pages that counted a design's post layout and "not found" page as pages.
* Changed: the smaller sizes of a design's pictures are saved at the quality of the picture itself, which makes pages lighter.
* Changed: removing the plugin also removes what an unfinished import left in the uploads folder.
* Changed: the designs need Elementor 4.0.3 or newer. Elementor 4.0.0 to 4.0.2 with Elementor Pro load a font from Google on every page.

= 0.6.0 =
* New: Shop, the tenth complete design: a small WooCommerce store with eight products, a lookbook, shipping and returns, a journal and a contact form. It needs Elementor Pro and WooCommerce.
* New: Magazine, the ninth complete design and the fourth for Elementor Pro: a front page that follows the newest stories of each section, a ruled masthead, a calm article layout, writers, and subscription and contact forms.
* New: a design can bring products for a WooCommerce store, with prices, pictures and categories, and link to the shop, cart, checkout and account pages. A rollback removes the products and their categories.
* Fixed: a link in an article or a product to something the import creates later is now filled in.
* New: a page of a design can list the posts of one of the design's categories, and link to a category.
* New: designs are illustrated with photographs; the source and licence of each one come with the design.

= 0.5.0 =
* New: Agency, the sixth complete design and the first for Elementor Pro: case studies, services, careers, a journal and a contact form, with header, footer and blog as Theme Builder templates.
* New: SaaS, the seventh complete design and the second for Elementor Pro: features, pricing tables, integrations, customer stories, a demo form, legal pages and a blog.
* New: Real Estate, the eighth complete design and the third for Elementor Pro: homes for sale, a property page with a viewing form, agents, services and market notes. It is the first design illustrated with photographs; the source and licence of each one come with the design.
* New: a page of a design can show one of the design's menus (needed by Elementor Pro's Nav Menu widget).
* New: designs for Elementor Pro can bring Theme Builder templates (header, footer, single post, archive, search results, "page not found"), each with the place it is used. A rollback removes them and their display conditions.

= 0.4.0 =
* New: Portfolio, the second complete design: a personal site with large serif type, a staggered grid of work, a case study, services, a resume and notes. Built with the free version of Elementor.
* New: Restaurant, the third complete design and the first dark one: a full menu with prices, reservations by telephone and email, private events, a gallery and a journal. Built with the free version of Elementor.
* New: Education, the fourth complete design: courses, a course page with syllabus and fee, instructors, admissions and fees, events and news, in bright panels and sticker-like cards. Built with the free version of Elementor.
* New: Medical, the fifth complete design: departments, doctors with profiles, how to book, patient information and health notes, in a calm layout of white cards on pale green. Built with the free version of Elementor. All five free designs are now complete.
* New: a design can bring its own fonts. The font files are stored in your uploads folder, served by your own site and offered in Elementor's font list under "Starter site fonts". No font service is contacted. Rolling back an import removes them; deleting the plugin removes them too.

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
