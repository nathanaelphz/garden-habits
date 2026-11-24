---
name: Garden
description: A habit tracker where every habit is a plant and the garden is the scoreboard.
colors:
  forest-ground: "#0e1712"
  forest-surface: "#16231b"
  forest-surface-2: "#1b2a21"
  forest-raised: "#22342a"
  hairline: "rgba(238, 234, 223, 0.1)"
  hairline-strong: "rgba(238, 234, 223, 0.18)"
  bone-ink: "#eeeadf"
  sage-soft: "#a9b5a6"
  sage-faint: "#8a9889"
  amber: "#f2b13c"
  amber-hover: "#ffc24f"
  amber-ink: "#1c1305"
  amber-soft: "rgba(242, 177, 60, 0.14)"
  amber-line: "rgba(242, 177, 60, 0.38)"
  water: "#8cc4e6"
  water-soft: "rgba(140, 196, 230, 0.13)"
  water-line: "rgba(140, 196, 230, 0.36)"
  straw: "#d6b56e"
  straw-soft: "rgba(214, 181, 110, 0.13)"
  straw-line: "rgba(214, 181, 110, 0.4)"
  rust: "#e8957a"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, Geist, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  stat:
    fontFamily: "Bricolage Grotesque Variable, Geist, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  cal-day: "11px"
  ctl: "14px"
  species: "18px"
  card: "20px"
  scene: "24px"
  pill: "999px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.amber-hover}"
    textColor: "{colors.amber-ink}"
  button-secondary:
    backgroundColor: "{colors.forest-surface}"
    textColor: "{colors.bone-ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-water:
    backgroundColor: "{colors.water-soft}"
    textColor: "{colors.water}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.sage-soft}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  water-toggle:
    backgroundColor: "{colors.water-soft}"
    textColor: "{colors.water}"
    rounded: "{rounded.pill}"
    size: "52px"
  water-toggle-done:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.pill}"
    size: "52px"
  chip:
    backgroundColor: "{colors.forest-surface}"
    textColor: "{colors.bone-ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "36px"
  chip-water:
    backgroundColor: "{colors.water-soft}"
    textColor: "{colors.water}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.forest-surface}"
    textColor: "{colors.bone-ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  habit-row:
    backgroundColor: "{colors.forest-surface}"
    textColor: "{colors.bone-ink}"
    rounded: "{rounded.card}"
    padding: "10px 10px 10px 12px"
  input:
    backgroundColor: "{colors.forest-ground}"
    textColor: "{colors.bone-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.ctl}"
    padding: "0 16px"
    height: "52px"
  choice-selected:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.pill}"
    height: "44px"
  nav-tab-active:
    textColor: "{colors.amber}"
    typography: "{typography.label}"
  nav-sidebar-active:
    backgroundColor: "{colors.forest-surface}"
    textColor: "{colors.bone-ink}"
    rounded: "{rounded.ctl}"
    height: "44px"
    width: "240px"
---

# Design System: Garden

## Overview

**Creative North Star: "The Living Scoreboard"**

Garden is a dark forest bed at night with the habits growing in it. The ground is a deep green-black, the surfaces are slightly lifted bands of the same forest, and the text is bone rather than white. A streak is never a flame counter or a progress ring: it is a plant, drawn parametrically, whose size is the streak. The illustration carries the colour and the life; the interface around it stays quiet, rounded and low-contrast so the plants and the one warm accent read first.

Density is calm and single-column on a phone (560px reading column), opening to a 1080px wide page only for the garden scene and the stats grid. Every state the garden can be in (watered, thirsty, dry, rest, saved by rain) is told in words as well as tone, so the colour system is a second channel, never the only one. Motion is short and physical: a press shrinks to 0.97, a watered plant grows in over 620ms, and everything collapses to near-instant under reduced motion.

**Key Characteristics:**
- Dark forest ground with tonal surfaces, bone ink, sage secondary text.
- One warm accent (amber) for action and for kept streaks; status tones are reserved, not decorative.
- Pill-shaped controls, 20px cards, round plots for plants.
- Bricolage Grotesque for screen titles, section heads and big numerals; Geist for everything else.
- A layered SVG garden scene whose sky follows the user's local hour.
- State always spelled out in words beside its colour and icon.

## Colors

A night-forest palette: green-black grounds, warm bone text, and four tightly scoped status hues.

### Primary
- **Lantern Amber** (`amber`): the single action and achievement colour. Primary buttons, the watered (pressed) state of the water toggle, the active tab, selected choices and species, switch-on, meters, done days on the calendar, the streak numeral, text selection and the focus ring. Hover lifts to `amber-hover`; text on amber is always `amber-ink`. `amber-line` outlines a row that was watered today.

### Secondary
- **Rain Sky** (`water`): water and rain. The water toggle at rest (soft fill, blue droplet), the rain-day chip and "Use a rain day" button, rain-covered days on the calendar, and the rain meter. Always used as a soft fill (`water-soft`) with a `water-line` border, except the calendar cell, which is solid.

### Tertiary
- **Dry Straw** (`straw`): thirsty. One scheduled day missed, streak at risk. Text tone, `straw-line` card and row borders, and a straw-tinted plot behind a wilting plant.
- **Fallen Rust** (`rust`): dry or lost. Streak gone, plant replanted. Text tone, row and card borders at 40% opacity, and form error text and invalid-input borders.

### Neutral
- **Forest Ground** (`forest-ground`): page background, browser chrome, and the inside of inputs (fields sit *below* the surface, not on it).
- **Forest Surface** (`forest-surface`): cards, habit rows, secondary buttons, chips, the active sidebar item.
- **Forest Surface 2 / Raised** (`forest-surface-2`, `forest-raised`): the two stops of the radial gradient inside a plant's round plot.
- **Hairline / Hairline Strong** (`hairline`, `hairline-strong`): bone at 10% and 18%; every border and divider. Strong is for inputs, secondary buttons and unselected choices.
- **Bone Ink** (`bone-ink`): primary text and icons.
- **Sage Soft** (`sage-soft`): meta lines, labels, field labels, quiet buttons.
- **Sage Faint** (`sage-faint`): hints, placeholders, inactive tabs, locked items.

### Named Rules
**The One Lantern Rule.** Amber means "do this" or "you kept it". Nothing decorative in the interface is amber; if an element is amber it is either the next action or a kept streak.

**The Reserved Weather Rule.** Blue, straw and rust are states, not accents. Blue appears only where water or rain is involved; straw only on thirsty habits; rust only on dry/lost habits and form errors. This rule governs interface chrome. The garden scene and the plant illustrations have their own palette (blue skies, red tulips, violet lavender, pink cactus bloom) and are exempt.

**The Said-Twice Rule.** A status colour never appears without the word for it ("Thirsty · 6 day streak at risk", "Dry · streak lost", "saved by a rain day") and, in rows, an icon. Colour is the second channel.

## Typography

**Display Font:** Bricolage Grotesque Variable (with Geist, system-ui)
**Body Font:** Geist (with system-ui)

**Character:** Bricolage brings a slightly wonky, hand-cut warmth to the few words that name a screen or count a streak; Geist keeps every working line plain and even. The pairing reads like a seed packet: a characterful title over a tidy label.

### Hierarchy
- **Display** (700, 1.875rem rising to 2.25rem at ≥960px, 1.1, −0.025em, Bricolage): one per screen, the screen title ("Good morning, Nathanael", habit name).
- **Headline** (650, 1.5rem, 1.15, −0.02em, Bricolage): section heads within a screen ("Today").
- **Stat** (700, 2.5rem, 1, −0.03em, tabular numerals, Bricolage): streak, best streak and check-in counts; the Today scene's "2 of 5" uses it at 28px.
- **Title** (600, 1.25rem, 1.25, −0.01em, Geist): card headings such as the growth and rescue cards.
- **Body** (400, 1rem, 1.5, Geist): running text; habit names in rows are body at 600.
- **Meta** (400, 0.875rem, Geist, sage-soft): the state line under a habit, captions, hints.
- **Label** (500, 0.8125rem, Geist, sage-soft): weekday initials, unlock progress, small counts. Sentence case, no tracking.

### Named Rules
**The Packet Title Rule.** Bricolage is for titles, section heads and numerals only. Body text, buttons, rows, labels and navigation are Geist.

**The Plain Label Rule.** Labels are sentence case at normal tracking. No uppercase, letter-spaced tags.

## Layout

Mobile first. A single column, max 560px, centred, with 16px side gutters and 24px gaps between blocks (`s5`); sections inside a page step by 12px (`s3`). Wide pages (garden, stats) widen to 1080px and lay their secondary content out on an auto-fit grid (min 320px columns). Spacing follows the 4/8/12/16/24/32/48 scale; nothing off-scale except row padding (10px/12px) and calendar gaps (5px).

Navigation is a fixed 72px bottom tab bar on phones (five tabs: Today, Garden, Stats, Seeds, You), translucent forest with a 16px blur and a hairline top border, padded for the safe area. At ≥960px it becomes a 240px left sidebar with the Garden wordmark on top and a sixth item, Rain days; the display size steps up to 2.25rem and the page top padding to 48px.

The garden scene swaps composition rather than scaling: a narrow scene below 700px and a wide one above. The Today strip is a fixed 176px scene; the full garden is 460px on phones and min(62vh, 520px) on wide screens.

**The Thumb Rule.** Every touch target is at least 44px (buttons 48px, the water toggle 52px, inputs 52px, rows 56px+).

## Elevation & Depth

Depth is mostly tonal: ground, then a lifted forest surface, then hairline borders. Cards carry one soft shadow made of an inset 1px top highlight (bone at 5%) and a long, low, dark drop. Translucent glass (blur over forest) is used only for things that float over content: the tab bar and chips laid over the scene. The scene's label area fades to forest with a gradient scrim so text over the sky stays legible.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 1px 0 rgba(238, 234, 223, 0.05) inset, 0 10px 28px -12px rgba(2, 8, 5, 0.6)`): on every card. Rows and controls stay flat.
- **Today ring** (`box-shadow: 0 0 0 2px #eeeadf inset`): marks today in the month calendar.

### Named Rules
**The Soft Night Rule.** Shadows are diffuse and dark-on-dark. Nothing has a hard, offset or coloured shadow.

## Shapes

Soft and organic. Every control is a pill (999px): buttons, chips, choices, the water toggle, the switch. Containers are generously rounded: cards and habit rows at 20px, the scene at 24px, species tiles at 18px, inputs and sidebar items at 14px, calendar days at 11px. Plants sit in perfect circles (round plots with a radial forest gradient), cropped so a sprout fills the plot as well as a bloom. Borders are always 1px hairlines; selection on a species tile thickens to 2px amber. Missed calendar days use a dashed border, the only dashed line in the system.

## Components

### Buttons
Tactile pills that press in.
- **Shape:** pill (999px), 48px tall, 24px side padding; small size 44px / 16px at 0.875rem.
- **Primary:** amber fill, amber-ink text, Geist 600. Hover brightens to amber-hover.
- **Secondary:** forest surface with a strong hairline; hover raises the border to sage.
- **Water:** soft blue fill, blue text and border, for rain-day actions only. Hover deepens the fill.
- **Quiet:** transparent, sage text, hover to bone.
- **Press / Disabled:** all buttons scale to 0.97 over 90ms; disabled is 50% opacity.
- **Icon button:** 44px circle, surface fill, hairline border (back links).
- **Text link:** amber, 600, 44px tall hit area, underline on hover.

### Water Toggle (signature)
The one-tap check-in. A 52px circle at the right end of every habit row. At rest it is soft blue with a droplet; pressed (`aria-pressed`) it fills solid amber with an amber-ink check. It flips optimistically on tap (70% opacity while pending), presses to 0.94, and its label says "Water {habit}" or "Undo {habit} for today".

### Habit Row (signature)
Round plant plot (52px), habit name in Geist 600 with ellipsis, then one meta line with a 15px icon and words: "Bloom · 23 day streak · 7 to mature". Surface fill, 20px radius, hairline border. The border carries the state: amber-line when watered, straw-line when thirsty, rust when dry or restarted; rest-day rows drop the fill to transparent. The meta line takes the matching tone.

### Chips
- **Style:** pill, 36px, surface fill, hairline border, 0.875rem 500.
- **Water chip:** soft blue with blue text at 600, used for the rain-day count (44px when it is a link).
- **Glass chip:** forest at 72% with a 10px blur, for chips placed over the garden scene.

### Cards / Containers
- **Corner Style:** 20px.
- **Background:** forest surface.
- **Shadow Strategy:** Card lift (see Elevation).
- **Border:** hairline; straw-line on rescue cards, rust on lost cards, amber at 45% on the "grew" celebration card.
- **Internal Padding:** 16px.

### Inputs / Fields
- **Style:** 52px tall, forest-ground fill (sunk below the card), strong hairline border, 14px radius, 16px padding. Label above in 0.875rem 600 sage; hint below in sage-faint.
- **Focus:** 2px amber outline at 2px offset, border goes transparent.
- **Error:** rust border, rust error text below, wired with `aria-invalid` and `aria-describedby`.
- **Choices:** weekday and option choices are 44px pills with a strong hairline; checked fills amber. Species picker tiles are 18px-rounded surface cards that take a 2px amber border and amber-soft fill when chosen; locked tiles drop to 55% and say how to unlock.
- **Switch:** 50 × 30 pill, dark forest track, sage knob; on, the track turns amber and the knob amber-ink.

### Navigation
- **Mobile:** fixed bottom bar, five icon-over-label tabs (22px Lucide icons, 11.5px labels), inactive sage-faint, active amber at 600 with a heavier icon stroke.
- **Desktop (≥960px):** 240px left sidebar, Bricolage "Garden" wordmark with an amber sprout, 44px rows with icon and label; the active row gets a forest-surface pill (14px radius), bone text and an amber icon.

### Garden Scene (signature)
A layered SVG: sky gradient by hour (dawn, day, dusk, night with stars), sun or moon glow, far hills, a soil bed, then the plants placed along it, scaled so every species reaches the same height at full bloom. 24px radius, hairline border. Each plant has an invisible tap target linking to its habit, optionally tagged with a name and "12d" / "thirsty" / "dry" pill. Labelled scenes add a bottom scrim for the overlay text.

### Month Calendar
Seven-column grid of 11px-rounded day cells, tabular numerals. Done is solid amber, rain-covered is solid blue with dark ink, missed is a dashed outline, rest and future days are dim text only, today gets a bone inset ring. Each cell has a spoken label ("12: saved by a rain day").

## Do's and Don'ts

### Do:
- **Do** use amber (`#f2b13c`) only for the next action and for kept streaks; text on it is always `#1c1305`.
- **Do** write the state in words next to every status colour: "Thirsty", "Dry", "Rest day", "saved by a rain day".
- **Do** put plants in round plots or the scene; let the drawing carry the colour.
- **Do** keep every control a pill and every container rounded (20px cards, 24px scene, 14px inputs).
- **Do** keep touch targets at 44px or more; the check-in toggle is 52px.
- **Do** use Bricolage only for screen titles, section heads and numerals; everything else is Geist.
- **Do** switch the bottom tab bar to the 240px sidebar at 960px and swap the scene composition at 700px rather than stretching it.

### Don't:
- **Don't** use blue, straw or rust in interface chrome outside their states (water/rain, thirsty, dry/error). The scene and plant illustrations are exempt.
- **Don't** replace the plant with a flame counter, progress ring or checklist tick as the streak's main display.
- **Don't** use uppercase, letter-spaced labels or tags above headings.
- **Don't** add hard, offset or coloured shadows; depth is tonal plus one soft card lift.
- **Don't** use pure white or pure black; text is bone `#eeeadf` on forest `#0e1712`.
