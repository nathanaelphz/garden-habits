---
version: 1
slug: "src-app"
primary_target: "src/app"
related_targets: []
---

# Garden app (Operate)

Scope: every authenticated app screen (Today, Garden, Habit, New habit, Stats, Seeds, Rain days, Settings) plus the public shared garden. Mode: Operate. Single user on a phone browser, daily check-ins, streak-driven (PRODUCT.md).

## Direction contract

THESIS: The garden is the scoreboard. Each habit is a living plant whose size is its current streak; the category default (a checklist with a flame counter and a progress ring) is refused.

OWN-WORLD: Dark forest ground #0E1712, raised forest surfaces, bone ink #EEEADF, sage-tinted secondary text. Amber #F2B13C is the single action colour (water, primary button, streak). Sky blue #8CC4E6 only for rain-day state. Straw #D6B56E marks thirsty (one missed day, streak at risk); rust #E8957A marks dry (streak lost). State is always carried by words too, never colour alone. Parametric botanical SVG plants, a layered garden scene whose sky follows the local hour. Pill buttons, 20px cards, Bricolage Grotesque for screen titles only, Geist for everything else.

STORY: Open, see which plants are at risk, water each with one tap, watch it grow or recover, protect a streak with a rain day, browse what can be unlocked.

FIRST VIEWPORT: Today: screen title and date line, the garden strip (scene, 176px) with "n of m watered", then the habit list; each row = plant in a round plot, name, streak/stage line, 48px water button on the right. Thirsty rows rise to the top with their rescue action.

FORM: approved design canvas, pinned. seed roll skipped: the form was already fixed by the user picking "Both (Recommended)" (app UI canvas + landing) and the approved canvas https://claude.ai/artifact/6VoWiS7f44prNc914KB2jn; their later ask "for all the design UI thing, can you use the plugins inside and make design" asked for the plugins to carry it, not for a new form.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
