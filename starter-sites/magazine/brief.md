# Magazine: design brief

A starter site for a magazine, a journal or a blog with sections. Shown as the fictional quarterly "Common Ground", about places, food and craft. **A design of the Pro tier: it needs Elementor Pro.**

Made to the photography standard: the fourteen photographs were chosen first, and each of the nine stories was then written about what its photograph shows.

## Character

A printed page on a screen. White paper, black ink, one red for the names of sections, thick and thin black rules instead of boxes, no rounded corners anywhere. The wordmark sits centered in a masthead, as on a newspaper. It is the only design of the ten that is built around lists of posts rather than pages.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| White | `#FFFFFF` | The page |
| Paper | `#F5F2EB` | Every second band, the subscription band |
| Ink | `#111111` | Headlines, rules, buttons, the footer. On white: 18.9:1 |
| Text | `#3D3D3D` | Body copy. On white: 10.9:1; on paper: 9.7:1 |
| Grey | `#5E5E5E` | Dates and small lines. On white: 6.5:1; on paper: 5.8:1 |
| Red | `#B5121B` | Section names, links on hover. On white: 6.8:1; on paper: 6.1:1 |
| On ink | `#D6D2C8` | Small text in the footer: 12.5:1 |

Type: **Literata** (variable, 200 to 900) for headlines at weight 700 and for the text of a story, **Public Sans** (variable) for everything around them; section names are 13px capitals with 2.2px tracking. Both are open-licence fonts that come with the design and are served by the site itself.

In Elementor's Site Settings: Primary and Secondary are ink, Text is body, Accent is red. Buttons are square and black.

## Photographs

Fourteen photographs from Wikimedia Commons, all recorded there as CC0, listed with their sources in `CREDITS.md`. `photo-sources.json` says which is used where; `tools/sites/photos.mjs fetch magazine` prepares them.

| Section | The three stories and their pictures |
| --- | --- |
| Places | Two houses with turf roofs on a winter shore (the cover); herdsmen's huts on a mountain pasture; a lane of white wooden houses |
| Table | A round loaf held in a cloth; a lime seller with a red balance scale; coffee poured from a stovetop pot |
| Craft | A potter's hands at the wheel; a craftsman at a bench under a window; a weaver's hands at a loom |

Three portraits stand for the writers; the About page shows hands marking printed pages, the Subscribe page a reader behind a newspaper. No story names a real place: the photographs do not say where they were taken.

## What Elementor Pro does here

| Part | How it is built |
| --- | --- |
| Masthead, footer | Theme Builder templates; the masthead uses Pro's Nav Menu widget |
| Front page | Four Posts widgets: the newest story of Places as the cover, the next two beside it, then the newest three of Table and of Craft. They follow what is published; a story shown once is not shown again |
| All stories, a section, a story, "page not found" | Four more Theme Builder templates |
| Subscribe, Contact | The Form widget, which sends an email to the site administrator |

The lists of a section are bound to the categories of the design's posts. A package cannot know their numbers in advance, so it names them (`ofss://term/places`) and the importer fills in the numbers.

## Layout grammar

- A block opens with a 3px black rule, the name of the section and a link to all of it.
- Stories stand in three columns: picture (always 16:9), headline, date, two lines of summary.
- A story is one column of 62% width, set in Literata at 19px, under a full-width picture.
- Bands alternate white and paper; there are no cards, shadows or rounded corners.

## Pages

Front Page, a section (category), a story, a writer (Marta Lind), About, Subscribe, Contact, All Stories, and "page not found".

## What is not in it

- No paywall, no payment, no newsletter service: the subscription form sends an email.
- Writers are not WordPress users. Each story names its writer in its first line; the writer's page is an ordinary page that lists the stories of her section.
- No comments are styled by the design; they fall back to the theme's.
