# SaaS: design brief

A starter site for a software product sold by subscription. Shown as the fictional feedback tool "Loop". **A design of the Pro tier: it needs Elementor Pro.**

## Character

Crisp and quick to read. A white page, a near-black for words and buttons, and one warm gradient (pink to orange) kept for the places that matter: the glow behind the hero, the closing band, the small pills above headings. The product itself is the illustration: every picture is a screen of the app. It differs from Agency, the other Pro design, in every respect: light instead of dark, centered instead of ranged left, rounded instead of square, quiet instead of loud.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| White | `#FFFFFF` | The page and cards |
| Mist | `#F5F6FA` | Alternating bands, quiet cards |
| Ink | `#0E1320` | Headings, buttons, the hero, the footer. On white: 18.5:1 |
| Text | `#4A5165` | Body copy. On white: 7.9:1; on mist: 7.3:1 |
| Pink to orange | `#FF4D8D` to `#FF8A3D` | The gradient. Only ever a background, with ink text on it: 5.9:1 at the pink end, 7.9:1 at the orange end |
| Rose | `#C81E5B` | The pink made dark enough for text: links, pills, check marks. On white: 5.5:1; on mist: 5.1:1 |
| Haze | `#B6BCCB` | Body copy on ink. 9.8:1 |

Type: **Sora** (variable, 100 to 800) for headings at weight 600 with tight tracking, **DM Sans** (variable) for everything else. Both are open-licence fonts that come with the design and are served by the site itself.

Shape: 20px radius on cards, 28px on large pictures and the closing band, 12px on buttons, full pills for labels. Hairline borders; one soft shadow, on the demo form. Site width 1200px.

In Elementor's Site Settings: Primary and Secondary are ink, Text is body, Accent is the pink. Plain buttons point at the Primary color.

## What Elementor Pro does here

| Part | How it is built |
| --- | --- |
| Header, footer | Theme Builder templates; the header uses Pro's Nav Menu widget |
| Blog, categories, an article, "page not found" | Four more Theme Builder templates |
| Pricing | Three Price Table widgets, the middle one marked "Popular" |
| Book a demo | The Form widget, which sends an email to the site administrator |
| Home page blog teaser | The Posts widget |

## Layout grammar

- Section openers are **centered**: a pill, a heading, at most two lines.
- The hero is ink with a soft glow, and the app's dashboard rises out of its lower edge.
- **Feature cards** are tinted (pink, peach, lilac) with a screen of the app on top.
- Text beside a screen, alternating sides, on the feature page and the customer stories.
- Figures as four plain numbers; testimonials as three dark cards on an ink band.
- Every page closes with the gradient band: one sentence, two buttons.
- Legal pages have a list of their sections beside the text, linking to each heading.

## Pictures

Two kinds, on purpose. The **screens of the product** (dashboard, inbox, trends, roadmap, integration tiles) are drawn by `tools/sites/saas-art.mjs`: the product is invented, so only a drawing can show it. **Everything else is a photograph** from Wikimedia Commons, recorded there as CC0 and listed in `CREDITS.md`: the three customers are pictured by their own world (a parcel being packed, surfboards on a beach rack, a wall of books), the About page shows the studio's long table, and the three articles have desks and notebooks as covers.

## On a phone

- The menu becomes Elementor Pro's burger; "Start free" stays in the hero and the closing band.
- Feature cards, price tables and testimonials stack into one column.
- Text and screen pairs stack with the text first.
- The list of sections on legal pages moves above the text.

## What is not in it, and what to know

- **No sign-up and no payment.** "Start a free trial" leads to the pricing page and from there to the demo form. A real product links these buttons to its own application.
- **The legal pages are sample text**, and say so. They are not a privacy policy or terms anyone can use.
- **The form sends email through WordPress**; whether it arrives depends on the site's mail setup.
- The same Elementor Pro remark as for Agency: its Posts widgets mark each article as a list item, which the automated checker flags.
- The fonts are Latin subsets (Western European languages).
