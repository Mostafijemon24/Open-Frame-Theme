# Manual QA checklist

The automated checks run in three browser engines on one machine. They cannot hold a phone, hear a screen reader, or see a page the way a person does. This list is what a person has to do before a release, and what to look for. Each line takes a minute or two; the whole list about two hours.

Write the result next to each line: **OK**, or what was wrong, with the device and browser. Results go into `docs/dev/TESTING.md` under the release they belong to.

## What you need

- A WordPress site you can throw away afterwards (a staging site at your host is ideal), with the Open Frame theme and the Open Frame Starter Sites plugin installed from their ZIP files.
- An iPhone or iPad (Safari), an Android phone (Chrome), a Mac with Safari, and a computer with Firefox. If one is missing, say so in the results instead of skipping silently.
- For the five designs marked "Needs Elementor Pro": Elementor Pro with an active licence on that site.

## 1. Installing and importing (15 minutes)

- [ ] The theme ZIP installs and activates without a warning.
- [ ] The plugin ZIP installs and activates without a warning. **Appearance > Starter Sites** appears.
- [ ] The screen shows ten designs, each with a picture. Search, the category filter and the Free / Pro filter each narrow the list.
- [ ] Open **Business**. The list "What it needs" offers to install or activate Elementor. Press the button; the line turns green without leaving the page.
- [ ] **Import this design** asks for confirmation first, then shows a progress bar with named steps, then "Imported" with the number of pages and images.
- [ ] **View your site** opens the new home page.
- [ ] **Roll back this import**, confirm: the site is as it was before (your old home page, no leftover pages or images under Pages and Media).
- [ ] Close the browser tab in the middle of an import. Open the screen again: a notice offers to continue or roll back, and both work.

## 2. Each design on a phone (5 minutes per design)

Import the design, then open the site on an iPhone and on an Android phone.

- [ ] The home page has no sideways scrolling, and no text is cut off or overlapping.
- [ ] The menu button opens the menu; every entry can be tapped; the menu closes again.
- [ ] Pictures are sharp, not stretched, and show what the text beside them is about.
- [ ] Buttons and links are easy to hit with a thumb, and none leads to "Page not found".
- [ ] Text is comfortable to read without zooming.
- [ ] Turn the phone sideways: the page still fits.
- [ ] Open two inner pages and one article the same way.

Designs: Business, Portfolio, Restaurant, Education, Medical, Creative Agency, SaaS, Real Estate, Magazine, Shop.

## 3. Each design in Safari and Firefox on a computer (2 minutes per design)

- [ ] The home page looks the same as in Chrome: same typefaces, same spacing, pictures in place.
- [ ] Narrow the window slowly to phone width: the layout changes in steps and never breaks.
- [ ] The typefaces are the design's own, not a system fallback (compare a heading with the preview picture on the Starter Sites screen).

## 4. Editing with Elementor (10 minutes, one free and one Pro design)

- [ ] **Edit with Elementor** on the home page: the page appears in the editor as on the site. Change a heading and a picture, press Update, and see the change on the site.
- [ ] Free design: the header and the footer are under **Appearance > Site Parts** and open in Elementor.
- [ ] Pro design: the header, footer, single post and archive are under **Templates > Theme Builder** and open there.
- [ ] **Site Settings > Global Colors**: change the primary color. Buttons and headings change on every page, including the blog.

## 5. Forms and the store (Pro designs, 10 minutes)

- [ ] Send the contact form of one Pro design. The message arrives by email. (If it does not, the site's mail setup is the first thing to check.)
- [ ] Shop: add a product to the basket from the home page and from the product page; the basket in the header counts it; the basket and checkout pages open and match the design. Set up a test payment method and place one order.

## 6. Keyboard and screen reader (15 minutes, one design)

- [ ] With the Tab key only: the first stop is "Skip to content"; every link and button can be reached; the place you are is always visibly marked; the menu on a narrow window can be opened, walked through and closed with the keyboard.
- [ ] With VoiceOver (Mac or iPhone) or NVDA (Windows): the page is announced with one main heading; pictures are described sensibly; the menu button says whether the menu is open.
- [ ] The Starter Sites screen itself: the dialog of a design can be opened, operated and closed with the keyboard, and focus returns to the design you opened.

## 7. A real host (once per release)

- [ ] On an ordinary shared hosting plan (not a developer machine): import the largest design (Real Estate, 18 pictures). It finishes; if the connection drops, "Continue the import" picks it up.
- [ ] On a site that already has pages, posts and a menu: after the import your own content is still there; after the rollback your own home page and menu are back.

## Checked by machine, no need to repeat

Every page of every design at nine widths from 360 to 1920 pixels (overflow, pictures loading, one main heading, text size, typefaces loaded, no request to another site), every internal link, the automated accessibility rules of axe-core, the Elementor editor opening the home page, header and footer, import and rollback, and the same again in Firefox and in WebKit, the engine of Safari. The reports are in `docs/dev/TESTING.md`.
