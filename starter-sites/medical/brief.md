# Medical: design brief

A starter site for a clinic, group practice, dentist or therapist. Shown as the fictional "Linden Clinic". Built for the free version of Elementor.

## Character

Calm and clear. A patient arrives worried and in a hurry, so the site answers three questions before anything else: how do I book, who will I see, when are you open. Soft colors, soft shadows, plain sentences, and nothing that moves. It differs from the four designs before it in every surface: a pale green page instead of white, paper, black or cream; white cards with blurred shadows instead of hairlines or hard outlines; icons in circles; pictures with one large corner.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| Mist | `#E8F4F1` | The page and page headers |
| White | `#FFFFFF` | Cards and the header |
| Teal | `#0B6B69` | Buttons, links, labels, icons. White on it: 6.3:1; on mist: 5.6:1; on sand: 5.5:1 |
| Deep | `#0A3F42` | The top bar, the figures band, the closing band. White on it: 11.7:1 |
| Ink | `#0F2B2D` | Headings and the footer. On white: 15.0:1; on mist: 13.3:1 |
| Text | `#3E5557` | Body copy. On white: 8.0:1; on mist: 7.1:1; on sand: 7.0:1 |
| Sand | `#F6EFE6` | One warm band per page, and quiet side notes |
| Aqua | `#BFE5DE` | Picture backgrounds, hover states |

Type: **Plus Jakarta Sans** (variable, 200 to 800) for everything: 700 for headings with slightly tight tracking, 400 for text at 17px with generous line height. An open-licence font that comes with the design and is served by the site itself.

Shape: cards have a 20px radius and a soft, blurred shadow; buttons 12px; pictures have one 120px corner and three of 24px. Site width 1200px.

In Elementor's Site Settings: Primary is teal, Secondary is ink (headings), Text is body, Accent is aqua. Plain buttons point at the Primary color.

## Layout grammar

- **Three doors first.** Directly under the home page hero: book an appointment, find a doctor, opening hours.
- **Icon cards** (Elementor's Icon Box widget in a white card): departments, promises, tests, patient information. Every card that leads somewhere has a text link with a name; the icon itself is never a link.
- **Line rows**: two things on a line with a hairline below, for opening hours, clinic days and training.
- Two-column inner pages: content on the left, practical cards (hours, your doctor, what to bring) on the right.
- A deep band with four figures; a deep closing band with "Book an appointment" and "Call us" on most pages.
- An emergency notice, in its own tinted card, on the appointments page and in the footer text.

## Header and footer

Header: a narrow deep bar with the opening hours and the telephone number (the number is a link, and stays on phones), then a white bar with the name and its mark, the menu and a "Book an appointment" button. On tablets and phones the button is hidden and the theme's menu button appears. Footer: ink, the name and one sentence, three link lists, and small print that says the site gives no medical advice.

## Photographs

Nine photographs from Wikimedia Commons, each recorded there as public domain or CC0, listed with their sources in `CREDITS.md`: staged pictures from the US National Cancer Institute, pictures of a modern rural hospital from the US Department of Agriculture, and three still lifes. `photo-sources.json` says which is used where; `tools/sites/photos.mjs fetch medical` prepares them.

| Where | What the photograph shows |
| --- | --- |
| Home, hero | A doctor taking a patient's blood pressure |
| Home, About, Contact | The reception desk; the building from its drive |
| About | Three women of different ages cooking together: the patients |
| Cardiology | A stethoscope on a form |
| A doctor's profile | An examination room |
| Articles | A stethoscope beside a laptop, a made bed, a vaccination |

**Doctors have no portraits.** Each is shown by name, specialty and a round mark. Suitable free pictures of clinicians are almost all of real, named hospital staff, and putting an invented doctor's name under a real person's face would mislead; a clinic that uses the design adds photographs of its own doctors.

## On a phone

- The telephone number stays in the top bar, one tap away.
- Grids become one column; doctors stay two by two on tablets.
- Side cards move under the content they belong to.
- Pairs of buttons sit side by side when they fit and wrap when they do not.

## What is not in it

- **No online booking and no form.** Appointments are by telephone, email or at the desk, and the page says why. A booking plugin can be added there.
- **No medical claims.** The sample texts describe how a practice works, not what is good for a patient, and every article ends with a line saying it is not personal advice. A real clinic must have its own texts checked.
- Doctors and departments are ordinary pages, not a directory with search.
- The font is a Latin subset (Western European languages).
