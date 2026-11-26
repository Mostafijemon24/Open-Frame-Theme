# Business: design brief

A starter site for service companies, shown as the fictional advisory firm "Halden". Built for the free version of Elementor.

## Character

Confident and plain. A firm that sells judgement should look like it has some: one typeface, one brand color, a lot of white, and numbers where other sites put adjectives. Nothing decorative that a client would have to explain.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| Brand | `#2456E6` | Buttons, links, labels, the closing band. White on it: 5.9:1 |
| Ink | `#0B1F3A` | Headings, the figures band, the footer. On white: 16.5:1 |
| Text | `#46546A` | Body copy. On white: 7.7:1; on the tint: 7.1:1 |
| Accent | `#F2A93B` | One highlight per composition, never for text on white |
| Tint | `#F3F6FB` | Alternating sections, page heroes, the blog background |
| Line | `#DCE3EE` | Card borders and dividers |

Type: Hanken Grotesk for everything, served from the theme (no request to a font service). Headings 700 with slightly tight tracking; body 17px at 1.65. Heading sizes are fluid (`clamp()`), set once in Site Settings.

Shape: 16px radius on cards and images, 10px on buttons, hairline borders instead of shadows. Site width 1200px.

In Elementor's Site Settings the four global colors follow the theme's convention: Primary = brand, Secondary = headings, Text = body, Accent = highlight. Headings and plain buttons point at the globals, so changing one color there restyles the whole site, including the blog.

## Layout grammar

- A section is a full-width band with content held to 1200px: 112px of space above and below on desktop, about 78px on tablets, 56px on phones.
- White and tint bands alternate. The ink band is reserved for figures, the brand band for the closing call to action.
- Section openers are a small uppercase label, a heading and at most two lines of lead text, left-aligned, never wider than about two thirds of the row.
- Cards are white with a hairline border. Services are numbered (01 to 06) rather than given icons.
- Inner pages open with the same tinted hero: label, title, one sentence.

## Header and footer

Header: wordmark left, the menu right, one button. On phones the button is hidden and the theme's menu button takes its place. Footer: ink, wordmark and one sentence, three link columns, a single line of small print.

## Images

Abstract geometric artwork in the palette (panels, bars, arcs, tiles), drawn by `tools/sites/business-art.mjs`. Original, CC0, about 540 KB for all fifteen. Team portraits are monogram tiles. A real company replaces them with its own photographs; nothing in the layout depends on the artwork.

## On a phone

- Rows stack; images follow the text they illustrate, except in the hero, where the artwork comes after the buttons.
- Grids of three or four become two on tablets and one on phones.
- Buttons that sit at the end of a row on desktop move under the text and align left.
- The figures band becomes a single column of large numbers.

## What is not in it

No contact form: the contact page gives an email address, a phone number and a "write to us" button. Elementor's free version has no form widget, and the design does not depend on a particular forms plugin. Add the one you use.
