# Restaurant: design brief

A starter site for a restaurant, café or bar that takes bookings by telephone and wants its menu read. Shown as the fictional wood-fired kitchen "Ember & Rye". Built for the free version of Elementor.

## Character

Evening. The page is nearly black, lit the way the room is: warm, low, from a few points. Type is a tall, thin serif that looks like a menu card, with tracked capitals for everything small. Compositions are centered, as a menu is. It shares nothing with the two designs before it: they are light, left-aligned and built from rows; this one is dark, symmetrical and built around pictures.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| Night | `#141210` | The page |
| Char | `#1E1A17` | Alternating bands, the hours box, the footer, blog cards |
| Forest | `#1C2A23` | One band per page at most: the quotation, the set menu |
| Cream | `#F2E8D9` | Headings. On night: 15.4:1 |
| Bone | `#CDC2B2` | Body copy. On night: 10.6:1; on char: 9.8:1 |
| Ember | `#E39A4A` | Buttons, labels, prices, links. On night: 8.0:1; on char: 7.4:1; night on ember (button text): 8.0:1 |
| Line | `#3A332C` | Hairlines |

Type: **Cormorant Garamond** (variable, 300 to 700, upright and italic) for headings and dish names, **Jost** (variable) for text, labels and buttons. Both are open-licence fonts that come with the design and are served by the site itself. One word of a main heading is set in italic with `<em>`. Labels and buttons are uppercase with wide letter-spacing.

Shape: square corners everywhere. Buttons are solid ember or a thin cream outline. Site width 1200px.

In Elementor's Site Settings: Primary and Accent are ember, Secondary is cream (headings), Text is bone, and the page background is set to night. The theme's own templates (the journal and its articles) take the same dark colors from the theme settings the import applies.

## Layout grammar

- Section openers are **centered**: a tracked label, a short ember rule, the title, at most two lines of text.
- **Pictured bands**: a full-width picture under a 70% dark veil with centered text on top (the home page hero and the reservations band). Text on them is cream, never ember, so it stays readable over the brightest part of the picture: 6.4:1 at worst.
- **Leader rows**: name, dotted line, price. Used for every dish and for the opening hours. Dishes sit in two columns, one on tablets and phones.
- Text and picture alternate left and right; pictures are never cropped into circles or cards.
- Three-column "ruled" blocks (a hairline, a title, a sentence) for practical information.

## Header and footer

Header: two lines on a desktop. First the opening hours on the left, the name in the centre and a "Reserve" button on the right; under them the menu, centered, in tracked capitals. On a phone only the name and the theme's menu button remain, on one line. Footer: the name, large and centered, three centered columns (visit, hours, reservations), the menu again as one line, small print.

## Photographs

Sixteen photographs from Wikimedia Commons, all recorded there as CC0, listed with their sources in `CREDITS.md`. `photo-sources.json` says which is used where; `tools/sites/photos.mjs fetch restaurant` prepares them.

All are dark and warm, lit by fire, candles or bar lamps, so they sit in the night-coloured page without a frame: logs burning in a hearth under the headline, the brick oven, a dim dining room, a long laid table, the bar, four plated dishes, a loaf, a cocktail, a cook's hands at the board and the host behind the bar.

The four pictured dishes are named after what their photographs show (cured trout with fennel, a flatbread from the oven, beef with rosemary and a soft egg, a warm sponge pudding); the rest of the menu is text.

## On a phone

- Everything is one column; centered text stays centered.
- Dish names keep their dotted line and price on one line, with the description below.
- The gallery's three columns stack into one.
- Pairs of buttons sit side by side when they fit and wrap, centered, when they do not.

## What is not in it

- **No online booking and no form.** Reservations are by telephone and email, which the pages say plainly. A booking plugin or a form can be added to the Reservations page.
- **No map.** An embedded map would load from another company's servers on every visit. The contact page gives the address and directions in words.
- Prices are plain numbers without a currency sign, as on many printed menus. Add yours.
- The fonts are Latin subsets (Western European languages).
