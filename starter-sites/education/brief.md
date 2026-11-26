# Education: design brief

A starter site for an academy, training centre, language school or coaching business that sells courses to adults. Shown as the fictional "Tandem Academy". Built for the free version of Elementor.

## Character

Bright, friendly and a little playful, like a good teacher. Big blocks of color with rounded corners, cards that look like stickers (a dark outline and a hard shadow with no blur), chunky headings. It shares nothing with the three designs before it: Business is restrained, Portfolio is editorial, Restaurant is dark; this one is loud on purpose.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| Paper | `#FFFBF2` | The page |
| Navy | `#16224A` | Headings, outlines, hard shadows, dark panels, the footer. On paper: 14.9:1 |
| Text | `#3D4664` | Body copy. On paper: 9.0:1; on every pastel panel: 7.3:1 or more |
| Iris | `#5B3FD6` | Buttons and links. White on it: 6.7:1; on paper: 6.5:1; on the pastels: 5.3:1 or more |
| Sun | `#FFCF4A` | The hero panel, chips, highlights. Navy on it: 10.5:1 |
| Coral | `#FF7A59` | The open-day panel. Navy on it: 6.0:1. Never used for text |
| Sky, mint, peach, lilac | `#DCE9FF` `#CFF0DF` `#FFE1D2` `#E7E0FF` | Panels and course cards |

Type: **Bricolage Grotesque** (variable, 200 to 800) for headings at weight 800 with tight tracking, **Figtree** (variable, 300 to 900) for text, chips and buttons. Both are open-licence fonts that come with the design and are served by the site itself.

Shape: 36px radius on panels, 24px on cards and pictures, full pills for buttons and chips, circles for portraits. Outlines are 2px navy; shadows are solid navy, offset 4 to 10px, never blurred. Site width 1200px.

In Elementor's Site Settings: Primary is iris, Secondary is navy (headings), Text is body, Accent is sun. Buttons point at the Primary color, and their outline and hard shadow are part of the button style in Site Settings, so every button on the site has them.

## Layout grammar

- A page is a **stack of blocks** with 96px between them. There are no full-width bands: everything sits inside the page margin, on paper.
- **Panels**: large rounded blocks of one flat color (the hero, page headers, "how it works", quotations, the open-day call). One color each; never two panels of the same color in a row.
- **Sticker cards**: white or pastel, outlined, with a hard shadow. Courses, figures, events, steps, questions.
- **Chips**: small pills for labels, durations and levels.
- Section openers are a chip, a heading and at most one sentence, left-aligned.
- Events are rows with a navy date badge.

## Header and footer

Header: a floating white pill with an outline and a hard shadow, inside the page margin: name on the left, menu, an "Apply" button. On a phone the pill becomes a rounded bar with the name and the theme's menu button. Footer: a navy block with rounded top corners, the name and one sentence, three link lists with sun-colored titles, small print.

## Photographs

Sixteen photographs from Wikimedia Commons, all recorded there as CC0, listed with their sources in `CREDITS.md`. `photo-sources.json` says which is used where; `tools/sites/photos.mjs fetch education` prepares them.

| Where | What the photograph shows |
| --- | --- |
| Home, hero | An adult learner at a laptop, pen in hand |
| Six courses | The subject itself: code on a screen, a dashboard of charts, wireframes being drawn, a conversation over notes, a photographer at work, a hand writing |
| About, Contact | A bright room with long tables: where the classes meet |
| Instructors, About | People reading and writing together at a table |
| Instructors | Four portraits, shown round |
| News | A bright library for the open day, a learner at her laptop, a man at his new desk |

The photographs keep the warm wood and daylight of the paper-coloured page; the coloured course cards carry the school's palette.

## On a phone

- Panels keep their color and lose some padding; the hero picture moves under the text.
- Grids of three become one column; figures and portraits stay two by two.
- The fee list stacks each course into four short lines.
- Buttons sit side by side when they fit and wrap when they do not.

## What is not in it

- **No application form and no online payment.** Applying is by email or telephone, as the Admissions page says. A form or a booking plugin can be added there.
- **No accordion.** The questions on the Admissions page are plain cards: Elementor's accordion widget gives its titles ARIA attributes that do not match their role, and the design must pass the accessibility checks.
- Courses and events are ordinary pages and rows, not a course catalogue with enrolment. A learning management plugin is a separate decision.
- The fonts are Latin subsets (Western European languages).
