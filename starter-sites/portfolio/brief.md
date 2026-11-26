# Portfolio: design brief

A starter site for one person who sells their own work: a designer, illustrator, photographer, writer or consultant. Shown as the fictional designer "Juno Vale". Built for the free version of Elementor.

## Character

Editorial and warm. The site should read like a well-set page in a magazine: large serif type, a paper-coloured background, generous space, and the work as the only loud thing on the page. Nothing here looks like the Business design: there are no cards, no icons, no blue.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| Paper | `#F4EFE7` | The page |
| Sand | `#E9E1D4` | Alternating bands and the two info boxes |
| Ink | `#1C1917` | Headings and the footer. On paper: 15.3:1 |
| Text | `#4A443D` | Body copy. On paper: 8.4:1; on sand: 7.4:1 |
| Rust | `#A8390B` | Buttons, links, numbers, the quotation band. On paper: 5.6:1; on sand: 5.0:1; white on it: 6.4:1 |
| Line | `#D6CBBB` | Hairlines |

Type: **Fraunces** (variable, weights 100 to 900, upright and italic) for headings and figures, **Instrument Sans** (variable, 400 to 700) for text, labels and buttons. Both are open-licence fonts that come with the design and are served by the site itself. Headings are light (weight 400) and large; one or two words of a main heading are set in italic by wrapping them in `<em>`. Sizes are fluid (`clamp()`), set once in Site Settings.

Shape: 6px radius on images and boxes, pill-shaped buttons, hairlines instead of cards and shadows. Site width 1240px.

In Elementor's Site Settings: Primary and Accent are rust, Secondary is ink (headings), Text is body. Plain buttons use Elementor's own default, the Accent color, and the button style of Site Settings.

## Layout grammar

- A section has 112px of space above and below on desktop, about 78px on tablets, 56px on phones. Bands are paper by default; sand, rust and ink are used once each per page at most.
- Lists are **ruled rows**, not cards: a hairline, a small rust number, a serif title, a sentence. Services, process steps, resume entries and questions all use it.
- Work is shown in a **staggered two-column grid**: the second column starts 140px lower, and covers alternate between portrait (4:5) and landscape (4:3).
- Labels are small uppercase sans; captions and facts are sans; everything else is serif.
- Text links are underlined with an arrow, not boxed.

## Header and footer

Header: the name in serif on the left, the menu on the right, no button, no border. On phones the theme's menu button takes the place of the menu. Footer: an ink band with a very large "Let's talk." that links to the contact page, the email address, two short link lists and one line of small print.

## Images

Fifteen original pictures drawn by `tools/sites/portfolio-art.mjs`: invented projects shown as flat studio shots (coffee bags, app screens, posters, book covers, bottles), an illustrated portrait, a desk, and three typographic covers for the notes. CC0, about 760 KB together. A real person replaces them with their own work; the covers keep their proportions when replaced with photographs of the same shape.

## On a phone

- The staggered grid becomes one column, in reading order; the offset disappears.
- Ruled rows stack: number above title above text.
- The hero buttons move under the introduction and align left.
- The footer's large line scales down with the screen and the link lists stack.

## What is not in it

- No contact form: the contact page gives the email address, a telephone number and a "Write an email" button (see the Business brief for the reason).
- No social media links: the design has no accounts to point at, and a placeholder link would be a dead end. Add an icon list to the footer for your own.
- The fonts are Latin subsets (Western European languages). Other scripts fall back to the visitor's system font.
