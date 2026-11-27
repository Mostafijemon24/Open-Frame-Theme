# Real Estate: design brief

A starter site for an estate agency. Shown as the fictional agency "Hartwell & Rowe". **A design of the Pro tier: it needs Elementor Pro.**

This is the first design made to the photography standard: every picture is a real photograph chosen for the section it sits in, and the words of each section were written after the photograph was chosen, so the two say the same thing.

## Character

Established and calm. Deep forest green and warm cream, a bookish serif for headings, thin ruled lines instead of cards, square corners softened by 4px. The photographs carry the page; nothing is drawn. It differs from the other Pro designs in every respect: Agency is dark and loud, SaaS is white and rounded, this one is green, ruled and quiet.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| Cream | `#F7F3EA` | The page |
| Sand | `#E8DFCC` | The closing band, the aside of an article |
| Forest | `#1F3A2E` | The hero, page headers, buttons, dark bands. Cream on it: 11.1:1 |
| Pine | `#16291F` | The footer, button hover |
| Ink | `#16211B` | Headings. On cream: 15.0:1 |
| Text | `#4B5650` | Body copy. On cream: 6.9:1; on sand: 5.8:1 |
| Brass | `#8A6420` | Small labels and icons on light backgrounds. On cream: 4.8:1 |
| Gold | `#DDB96A` | The same accent on forest: 6.6:1 |
| Mist | `#C9D4CC` | Body copy on forest: 8.1:1 |

Type: **Newsreader** (variable, 200 to 800) for headings at weight 500, **Manrope** (variable) for everything else, with small uppercase labels at 13px and 2px tracking. Both are open-licence fonts that come with the design and are served by the site itself.

In Elementor's Site Settings: Primary is forest, Secondary is ink, Text is body, Accent is gold. Plain buttons point at the Primary color.

## Photographs

Eighteen photographs, all from Wikimedia Commons and all recorded there as CC0. `photo-sources.json` says which photograph is used where, at what size and around which focal point; `tools/sites/photos.mjs fetch real-estate` checks each licence again and writes the cropped files, `photos.json` and `CREDITS.md`.

| Where | What the photograph must show | Shape |
| --- | --- | --- |
| Home, hero | A residential street, because the headline is about knowing the street | 4:3, fills half the screen |
| A home in a list | The outside of that one home, whole and recognisable | 4:3 |
| Property details | The same home wide, then its living room and kitchen | 16:9, then two 4:3 |
| Home, "How we work" | A lived-in room, not a show home | 6:5 |
| The people | Head and shoulders, face in the upper half | 3:4 |
| About | The old town the agency works in | 2:1 |
| An article | A picture of what the article is about (house fronts to compare, a hallway to walk through, streets from the air) | 16:9 |

Every file is cropped to its shape before it is packaged, so pictures in a row are the same height without any CSS, and the focal point keeps the subject in view on a phone.

## Words

- Every home is named, priced and described to match its photograph: the house with the garage and the lit door is described as having a garage at street level; no home is given a feature its picture does not show.
- The people are described to match their portraits.
- Nothing is presented as a fact about a real business. The footer says the agency is fictional and that the homes, prices and figures are examples; the client quote on the home page says it is a sample.

## What Elementor Pro does here

| Part | How it is built |
| --- | --- |
| Header, footer | Theme Builder templates; the header uses Pro's Nav Menu widget |
| Market notes (blog), categories, an article, "page not found" | Four more Theme Builder templates |
| Viewing request, contact | The Form widget, which sends an email to the site administrator |
| Home page notes | The Posts widget |

## Layout grammar

- The home page opens as a split screen: words on forest, the street beside them, edge to edge.
- Inner pages open with a forest band: label, heading, one sentence.
- Lists are ruled, not boxed: a hairline above each fact, service or step.
- A home in a list is always photograph, status and area, name, price, then bedrooms, bathrooms and floor area on one line.
- Every page but Contact closes with the sand band that offers a valuation.

## Pages

Home, Homes for Sale, Property Details (12 Orchard Rise), Agents, Agent Profile (Clara Hartwell), Services, Service Details (Selling), About, Market Notes, an article, Contact, and "page not found".
