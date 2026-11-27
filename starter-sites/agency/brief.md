# Agency: design brief

A starter site for a studio or agency that sells its thinking and shows its work. Shown as the fictional creative studio "Parallel". **A design of the Pro tier: it needs Elementor Pro.**

## Character

Loud and sure of itself. Black, off-white and one acid green; a very wide display typeface set large; full-width bands that change color hard, with no cards, no shadows and no rounded pictures. Where the free designs are polite, this one argues.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| Ink | `#0D0D0D` | Dark bands, the header and footer, headings. On paper: 17.5:1 |
| Paper | `#F5F3EE` | Light bands. On ink: 17.5:1 |
| Lime | `#C8F53C` | Buttons, labels on ink, the closing band. On ink: 15.4:1; ink on lime: 15.4:1 |
| Text | `#3A3A38` | Body copy on paper. 10.3:1 |
| Ash | `#A9A9A3` | Body copy on ink. 8.2:1 |
| Violet | `#4A3AE8` | One band per page at most (the quotation); link hover. White on it: 6.9:1 |

Type: **Unbounded** (variable, 200 to 900) for headings at weight 700 with tight tracking, **Inter** (variable) for everything else. Both are open-licence fonts that come with the design and are served by the site itself.

Shape: square pictures, pill buttons, pill outlines for tags, 2px rules instead of boxes. Site width 1280px.

In Elementor's Site Settings: Primary and Secondary are ink, Text is body, Accent is lime. Plain buttons use Elementor's default, the Accent color.

## What Elementor Pro does here

| Part | How it is built |
| --- | --- |
| Header | A Theme Builder template with Elementor Pro's Nav Menu widget (horizontal on desktops, a burger with a dropdown on tablets and phones) |
| Footer | A Theme Builder template |
| Journal (the posts page) | An archive template with the Archive Posts widget and a written title |
| Categories and other archives | A second archive template with a dynamic title |
| An article | A single-post template: Post Info, Post Title, Featured Image, Post Content, Post Navigation |
| "Page not found" | A 404 template |
| Home page hero | The Animated Headline widget: the last word rotates |
| Home page journal teaser | The Posts widget |
| Contact | The Form widget, which sends an email to the site administrator |

All of them can be changed in Theme Builder and the editor. Without Elementor Pro the design cannot be imported; the plugin says so before anything is changed.

## Layout grammar

- Full-width bands: ink, paper, lime, and violet once. Every inner page opens with an ink band holding a lime label, a very large title and one sentence.
- **Ruled blocks**: a 2px line, a number or label, a title, a sentence. Services, process, figures, roles, contact details.
- Case studies are large square-cornered covers in a two-column grid, each with a title, a year and outlined tags.
- Every page closes with the same lime band: a very large question and one button.
- The footer repeats the name at a size that fills the width.

## Photographs

Fifteen photographs from Wikimedia Commons, all recorded there as CC0, listed with their sources in `CREDITS.md`. `photo-sources.json` says which is used where; `tools/sites/photos.mjs fetch agency` prepares them.

An agency's own work cannot be shown in a starter site, so each client is pictured by its world, in one strong color against black or white: a violet lightning bolt for the electricity company, a camera drone, stage lights over a crowd, a lime-green tent under stars, a black shell chair, red cinema seats. The studio is a dark loft with a factory window, the reel a photographic studio; four portraits stand for the team.

The clients are described to match their pictures: Volt is an electricity company because its picture is a storm.

## On a phone

- The menu becomes Elementor Pro's burger; the "Start a project" button in the header is hidden and remains in the hero and the closing band.
- Grids of four become two, then one; case covers stack.
- Form fields that sit side by side on a desktop stack.

## What is not in it, and what to know

- **The form sends email through WordPress.** Whether that email arrives depends on the site's mail setup, as with every form. Nothing is stored unless Elementor Pro's submissions feature is on.
- **One known accessibility remark:** Elementor Pro's Posts widgets give each article the role "listitem", which the automated checker flags as a best-practice issue. It is in Elementor Pro's markup and cannot be changed from a design.
- The headline animation moves. Whether Elementor Pro stops it for visitors who ask their system for reduced motion was not checked.
- The fonts are Latin subsets (Western European languages).
