# NTS_Drive — Static Portal for the Office-Worker Track

Backend-free static site with five top-level sections behind one shared
"drive" UI shell: **Arcade, Fortune, Academy** (open/live) and **Community,
Store** (locked/planned). This is no longer a strict sequential rollout —
Arcade, Fortune, and Academy are built out in parallel.

## Structure

```
office-game-hub/
├── index.html               NTS_Drive root hub (5 top-level folders)
├── categories.json            Root-level folder metadata
├── styles.css                Shared file-explorer shell (root + all subpages)
├── analytics.js               Shared GA4 loader
├── favicon.svg                 Site favicon (folder + office-worker mark)
├── feedback-widget.js          Fixed bottom-right feedback email link (myer@kakao.com)
├── arcade/                   Live — English content
│   ├── index.html
│   ├── titles.json
│   ├── deck-dash/
│   └── formula-firewall/
├── fortune/                  Live (folder open, content not yet built)
│   ├── index.html
│   └── items.json              Daily Fortune / Tarot Pick / Lucky Numbers — all "In Planning"
├── academy/                  Live — Korean content only
│   ├── index.html
│   ├── items.json
│   └── spreadsheet-master/      Blog-style guide series (Korean, stub for now)
├── community/index.html      Planned — needs a backend, see note below
└── store/index.html          Planned
```

## Design decisions (2026-07-04, v3)

- **Entry point reframed**: `index.html` is now the top-level "NTS_Drive" hub.
  It lists the four roadmap stages as folders, not the arcade titles directly.
  Users pick a stage folder, then land on that stage's own file-explorer view.
- **Brand names**: NTS_Drive (platform hub, name unchanged) → child folders now
  drop the `NTS_` prefix: Arcade / Academy / Store. Breadcrumb updates per page, e.g.
  `NTS_Drive › Arcade`.
- **Roadmap change (2026-07-04)**: the original 4-stage plan (Arcade → SaaS →
  Seminar → Shop) was cut to 3 stages. SaaS was dropped entirely. Seminar was
  repurposed and renamed Academy — instead of talks/workshops, it will host
  bite-sized learning content (starting with English quizzes for office
  workers) and ships as **Live** from day one, even though it has no content
  yet. Shop was renamed Store (naming change only, still Planned).
- **Wording**: the words "game" and "homage" are not used anywhere in the UI.
  Arcade entries are called "titles"; the column that used to say "homage
  target" is now "Style" (a neutral description of the visual reference,
  e.g. "Groupware approval tray").
- **Language**: all UI copy and content is in English for a global audience.
  Korean is only used internally in this README and the knowledge base.
- **Imagery**: no bitmap/SVG icon assets. Every icon-sized visual is an emoji
  (🕹️ 🧰 🎓 🛍️ 🗒️ 📎 etc.), which sidesteps both asset production cost and
  any icon-lookalike trademark risk.
- **Data-driven**: adding a new stage folder means one entry in
  `categories.json`; adding a new arcade title means one entry in
  `arcade/titles.json`. No page code needs to change either way.

## Adding a new arcade title

1. Create `arcade/<id>/` with its own `index.html` / `style.css` / `script.js`.
2. Add one entry to `arcade/titles.json`:

```json
{
  "id": "channel-triage",
  "title": "Inbox Zero Sprint",
  "description": "One-line description",
  "style": "Team messaging channel list",
  "status": "Live",
  "entryPath": "channel-triage/index.html",
  "addedAt": "2026-07-05"
}
```

## Adding a new top-level stage (rare)

Add one entry to `categories.json` with `emoji`, `status` (`Live` or
`Planned`), `path`, and `itemsSource` (or `null` if the folder has no
sub-listing yet).

## Local preview

Opening `index.html` directly in a browser blocks `fetch()` on `file://` due
to CORS. Serve it locally instead:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deployment (any of these, all free)

### Vercel
1. Push this folder to a GitHub repo.
2. vercel.com → New Project → select repo → Framework Preset: "Other" → Deploy.

### Netlify
1. Connect the GitHub repo, or drag-and-drop this folder into Netlify Drop.
2. Leave the build command empty; publish directory = project root.

### GitHub Pages
1. Repo Settings → Pages → Source = `main` branch, root directory.
2. Live at `https://<account>.github.io/<repo>/`.

All three run at $0 with no card on file and no server to manage.

## Analytics (GA4)

Every page loads `analytics.js`, a single shared loader for Google Analytics 4.

**To activate:** open `analytics.js` and replace `G-XXXXXXXXXX` with the real
Measurement ID from Google Analytics (Admin → Data Streams → your stream →
Measurement ID). One edit updates tracking across the whole site.

Custom events already wired up:

| Event | Fired when | Params |
|---|---|---|
| `select_content` | A visitor opens a stage folder from the NTS_Drive hub | `content_type`, `item_id`, `item_name` |
| `play_click` | A visitor clicks Play on an arcade title | `item_id`, `item_name`, `style` |
| `title_engaged` | First "Approve" click inside a title (session start signal) | `item_id` |
| `milestone_reached` | Every 50 actions inside a title (engagement depth) | `item_id`, `count` |

Funnel to watch in GA4 once traffic starts: `select_content` (hub → Arcade) →
`play_click` (Arcade → title) → `title_engaged` (title → actually played).
Drop-off between these three is the first thing worth diagnosing.

## Title 2: Formula Firewall (2026-07-04)

A tower-defense title where the player deploys spreadsheet-formula towers
(`VLOOKUP`, `IFERROR`, `SUMIF`) to stop corrupted-data enemies crossing a
spreadsheet grid. Located at `arcade/formula-firewall/`.

**Trademark fix applied before shipping:** the source file supplied for this
title used the literal string "Microsoft Excel" in its `<title>` and window
chrome, and its accent color (`#217346`) was Excel's actual brand green. Both
were replaced before merging:
- Window chrome now reads "Spreadsheet" (generic), never "Excel" or "Microsoft".
- Accent color changed to the site's own NTS_Drive blue (`#2F5DA8`), not
  Excel's brand green.
- Fonts changed from Microsoft's `Segoe UI` / `Consolas` to the project's
  existing `Pretendard` / `IBM Plex Mono`.
- Function names (`VLOOKUP`, `IFERROR`, `SUMIF`) were kept — these are
  generic spreadsheet-industry terms used identically across Excel, Google
  Sheets, and LibreOffice, not a Microsoft-specific trademark.

**Gameplay features implemented:**
- 3 starting roles — Intern (Easy) / Manager (Normal) / Director (Difficult) —
  each sets a different starting budget and enemy speed/strength multiplier.
- 10 levels. From Level 6 onward, enemies that get near a tower actively
  attack it (damage over time), on top of the usual "leak" damage for
  reaching the end of the row. Both leak damage and enemy attack damage
  scale up with level.
- Autosave after every level cleared; reopening the page resumes the run
  automatically (no difficulty prompt shown when a save exists).
- `Reset` button (next to `Save`) wipes the current run only — Top 10
  records are untouched.
- Local Top 10 leaderboard (name, level, role, score, date). Qualifying
  scores prompt a name-entry modal. Reaching the all-time #1 spot
  auto-downloads a screenshot via html2canvas — no manual click needed.
- In-game `Guide` button explains objective, controls, towers, difficulty,
  the Level 6+ attack mechanic, and the scoring formula, entirely in English.

## Content update (2026-07-05): Deck Dash replaces Endless Approval Stack

`Endless Approval Stack` was removed. Its slot is now **Deck Dash**, an
endless-runner title at `arcade/deck-dash/`.

- Same level structure as Formula Firewall: 3 starting roles (Intern /
  Manager / Director) set lives and scroll speed; 10 levels, each a stretch
  of distance to survive; from **Level 6 onward** a faster "Notification
  Chaser" obstacle appears that costs 2 lives instead of 1.
- Controls: Space/tap to jump over low obstacles, Down Arrow to duck under
  high ones.
- Same save/resume/reset, local Top 10 leaderboard with name entry, and
  automatic screenshot capture on a new all-time #1, all reusing the pattern
  established in Formula Firewall.
- **Trademark note**: background is a generic "slide deck" homage (ribbon,
  slide title bar) in an original teal accent (`#2E7D6B`) — not PowerPoint's
  or Slack's actual brand colors, and neither brand name appears anywhere in
  the UI. The runner character is an entirely original abstract shape (no
  real favicon, mascot, or icon set was copied).

## Academy content update (2026-07-05): removed the "English quizzes" framing

`categories.json`'s Academy description no longer says "starting with English
quizzes" — Academy now also hosts non-English content (starting with a math
puzzle), so the copy was generalized to "Bite-sized learning content for
office workers."

## Site expansion (2026-07-05): Fortune + Community added, Arcade lineup expanded

Following a new master plan, the top-level structure grew from 3 to 5
sections. **This is a parallel-build model now, not a sequential one** — all
"Stage X of Y" copy was removed from the UI since Arcade/Fortune/Academy are
open simultaneously rather than unlocking in order.

- **Fortune** (new): daily fortune, tarot pull, and a for-fun random number
  generator. Folder is Live; all three items are "In Planning" (not built
  yet).
- **Community** (new): a post-and-read board. **This cannot be built as a
  static site** — it needs a backend/database. Candidates: Firebase/Supabase
  free tier, Cloudflare Workers + KV, or an embedded widget (giscus). This
  decision must be made before Community moves past "Planned."
- **Arcade lineup expanded**: added Cat Care, Spot the Difference, Card
  Memory, and Word Search as "In Planning." A fifth idea (originally a
  baccarat-style card game) was redesigned before shipping — see
  Resolutions below.
- **Site-wide additions**: `favicon.svg` (folder + office-worker mark, our
  own original design) and `feedback-widget.js` (a fixed bottom-right
  `mailto:myer@kakao.com` link) were added to every page.

## ⚠ Open items needing a decision before further work

1. **Academy direction conflict**: an earlier plan said Academy should be
   blog-only (no quizzes/games), but `picture-match` and `equation-hunt`
   were already built as quiz games under Academy. Not yet resolved:
   move them to Arcade, delete them, or keep a mixed blog+game Academy.
2. **Academy language policy**: Academy content is now Korean-only (a
   deliberate exception to the site's English-first rule used everywhere
   else). **This needs to be added to the Claude Project's custom
   instructions** (not just this README) so it's respected automatically in
   future sessions. Suggested addition: *"Academy 섹션의 콘텐츠는 한국어로
   작성한다 (사이트의 다른 섹션은 영어 유지)."*
3. **Card probability game legal risk**: a baccarat-style card game risks
   classification as regulated gambling-simulation content under Korea's
   Game Industry Promotion Act, and separately risks violating Google
   AdSense's gambling-content policy (which could jeopardize monetization
   for the whole site, not just this one title). Recommend renaming away
   from "baccarat" and removing any real-casino-game resemblance, or
   dropping the title from the lineup.
4. **"Lucky Numbers" naming**: deliberately not called "로또" and not using
   a 6/45 format, to avoid trading on the official Korean lottery operator's
   (동행복권) branding/format.

## Resolutions (2026-07-05, later same day)

Answers to the open items above:

1. **Academy direction resolved**: Picture Match and Equation Hunt were
   deleted entirely (not moved to Arcade). Academy is now blog-only, Korean
   content, starting with `academy/spreadsheet-master/` (still a content
   stub — no articles written yet).
2. **Card game redesigned, no longer on hold**: replaced the
   baccarat-style concept with **Number Streak** — guess whether the next
   number is higher or lower than the last one, build a streak. No cards,
   suits, or betting language, so the Game Industry Promotion Act /
   AdSense-gambling-policy risk no longer applies. Status is back to
   "In Planning" in `arcade/titles.json`.
3. **"Open" categories confirmed to already work as parallel, not
   sequential**: `categories.json` marking Arcade/Fortune/Academy as `Live`
   is purely a display flag — there is no code-level gate tying one
   section's completion to another unlocking. All three are simultaneously
   reachable by any visitor right now. Since no marketing/link-sharing has
   happened yet, it's safe to leave them `Live` while content is still being
   filled in — nothing changes for real users until the URL is actually
   shared.
4. **Terminology unified to "Soon"**: the root hub's not-yet-live category
   button used to say "Locked"; it now says "Soon", matching the wording
   already used for individual not-ready items inside Arcade/Fortune/Academy
   (those always said "Soon", never "Locked" — only the root hub needed the
   fix).

**Still needs action outside this codebase**: add the Academy
Korean-language policy to the Claude Project's custom instructions (see
suggested wording in the "Open items" section above) — README documents the
decision, but only the Project's own instructions make Claude honor it
automatically in future sessions.

## Deck Dash redesign v2 (2026-07-05): 3-act structure + office-worker character

Per the master plan, Deck Dash was rebuilt around three acts instead of a
single flat 10-level runner:

| Act | Levels | Obstacles |
|---|---|---|
| Word | 1–3 | Word blocks — short ("OK") to long ("STAKEHOLDER") |
| Excel | 4–7 | Numbers (2 → 4 digits), then bar/pie chart shapes |
| PPT | 8–10 | Geometric shapes — circle → triangle → arrow → star |

Difficulty roles (Intern/Manager/Director), the Level 6+ "Notification
Chaser" (2-life hit instead of 1), save/resume/reset, the local Top 10
leaderboard, and automatic screenshot capture on a new #1 are all unchanged
from v1 — only the level content and character changed. Background tint
shifts per act (blue-gray → green → warm amber) as a visual cue that a new
act has started, using an original palette, not any app's brand colors.

**Character redesign**: replaced the abstract blob with an office-worker
figure — navy blazer, white collar, a small necktie, and an ID badge with a
colored stripe, topped with a simple round head and hair. Entirely original
vector shapes drawn in code (no image assets, no real mascot or favicon
referenced).

## Deck Dash v3 (2026-07-05): double jump, fixed obstacle width, richer backgrounds

Three fixes based on playtesting feedback:

- **Bug fix — unjumpable long words**: word obstacle width used to scale
  with word length (`22 + word.length * 9`), so "STAKEHOLDER" produced a
  121px-wide hitbox versus ~30px for shape obstacles — effectively
  unavoidable. Fixed by giving word/number obstacles a **fixed hitbox width**
  (`WORD_OBSTACLE_W = 62`, `NUMBER_OBSTACLE_W = 48`) and auto-shrinking the
  font (`fitFontSize()`) so longer text still displays fully inside the same
  box. Every obstacle is now equally jumpable regardless of text length.
- **Double jump added**: `player.maxJumps = 2`; pressing jump again while
  airborne (and not past the jump limit) triggers a second jump — a small
  motion-line flourish renders on the second jump for feedback. Reference
  for the jump-count pattern: a double-jump runner mechanic the user
  provided (a third-party branded game file) — only the generic
  jumpCount/maxJumps mechanic was reused; none of that file's branding,
  name, or visual design was carried over.
- **Richer, more varied backgrounds**: replaced the flat single-color fill
  (which felt too similar to Formula Firewall's plain white/grid look) with
  a **per-act vertical gradient** plus a **slow parallax decoration layer**
  (non-colliding, purely visual, moves at 0.35× obstacle speed): faint
  document lines for Word, faint cell outlines for Excel, soft floating
  color blobs for PPT (a generic "wallpaper/slide-theme" look — not a
  reproduction of any specific OS or app's actual wallpaper image).

## Deck Dash v4 (2026-07-05): narrative, food pickups, 3-lane obstacles, dynamic chrome color

- **Narrative added**: the difficulty-select screen now shows a dusk skyline
  illustration (office building silhouettes, a setting sun, a clock reading
  6:00) with the tagline "It's 6PM — everyone's rushing the exit." This gives
  the run a reason: you're racing home at quitting time. Purely an inline
  SVG built from scratch — no real building, city skyline, or clock brand is
  referenced.
- **Food pickups**: snacks (🍙🍎☕🍪🍱) float by occasionally. Collecting one
  adds +30 to a running `bonusScore` (now included in the final score
  formula) and restores 1 life if the player isn't already at their role's
  starting max — giving a risk/reward reason to detour toward a pickup.
- **Three obstacle lanes** instead of a flat ground/overhead split:
  - `ground` — clear with a single jump.
  - `head` — must duck; a jump's arc still passes through this band, so
    jumping is unreliable here.
  - `sky` — positioned above a single jump's apex (~147px) but within a
    double jump's reach (~190px+), so the only reliable way to survive it is
    to *not* double jump (stay grounded or duck instead).
  Lane odds shift with level (more `sky` appears as levels progress) so the
  variety ramps up rather than staying flat.
- **Word vs. number now visually distinct**: word obstacles render as a
  white "paper" card with a folded corner (a document metaphor); number
  obstacles render as a two-cell spreadsheet strip with a center divider
  (a cell metaphor). Both keep the act's accent color for their border/text,
  but the *shape* itself now signals what kind of obstacle it is instead of
  relying on color alone.
- **Toolbar color now follows the act**: `applyActChrome()` rewrites the
  `--chrome` / `--chrome-dark` CSS custom properties on act change, so the
  title bar and ribbon shift color (blue-gray → green → amber) instead of
  staying a fixed color for the whole run. A 0.5s CSS transition softens the
  change.

## Deck Dash v5 (2026-07-05): sized up ~1.35x across the board

Character, obstacles, and food pickups were all scaled up roughly 1.35x for
visibility (e.g., `PLAYER_W` 30→40, `PLAYER_H_STAND` 38→51, word obstacle
width 62→84). Jump physics (`GRAVITY`, `JUMP_VELOCITY`) were left unchanged,
but the **head and sky lane offsets were recalculated to match the taller
player** (`laneBox` head offset 90→122, sky offset 190→257) so the existing
"duck avoids head-lane, don't double-jump into sky-lane" logic still holds
correctly at the new scale — this wasn't just a uniform CSS zoom, the
underlying hitbox math was re-derived.

## Deck Dash v6 (2026-07-05): endless mode, live score, Master achievement, duck-hitbox bug fix

- **Bug fix — head-lane obstacles were unavoidable-safe (not a good thing)**:
  after the v5 size-up, the "head" lane obstacles were positioned too high
  (`groundY - 122`) relative to the taller player's standing height (51px),
  so a standing/running player's hitbox never reached them — ducking had
  become pointless because *not* ducking already avoided every head-lane
  obstacle. `laneBox()` is now **bottom-anchored**: the head lane's lower
  edge is fixed at `groundY - 35` (above duck-top at `groundY - 30`, below
  standing-top at `groundY - 51`), so a standing player is reliably hit and
  only ducking avoids it, regardless of the obstacle's own height. The sky
  lane got the same bottom-anchored treatment (`groundY - 185`), re-verified
  against the actual single-jump apex (~160px) so it stays single-jump-safe
  and only a double jump risks it.
- **Endless mode from Level 10**: leveling stops once Level 10 is cleared;
  from then on `currentLevel` stays at 10 (act/theme frozen on PPT) and only
  distance keeps counting. Obstacle spawn gaps are divided by 1.5 (≥1.5×
  more obstacles) and food pickups stop spawning entirely — pure survival
  distance-running.
- **999,999m cap + Master achievement**: reaching this distance ends the run
  immediately with a distinct "You've Become a Master!" screen (English, to
  stay consistent with Arcade's English-only policy) instead of the normal
  win/loss messaging.
- **Live score display**: a `Score` stat now sits next to `Distance` in the
  status panel, recomputed every frame — previously score was only ever
  shown at the end of a run.
- **Leaderboard ranks by score only** (this was already the sort key; no
  logic change) but now also shows each record's final **Distance** as
  context, plus a 🎉 badge next to any entry that reached Master status.

## Title 3: Number Streak (2026-07-05)

A minimal higher-or-lower guessing game at `arcade/number-streak/` — the
safe, redesigned version of the original baccarat-style concept flagged for
legal review. Chosen as the third Arcade title because it was the fastest
of the five "In Planning" candidates to build well: no canvas, no physics,
a single number as the entire game state.

- Guess whether the next random number (1–100) is higher or lower than the
  current one. Correct guesses build a streak; a miss resets the streak and
  costs a life.
- Same conventions as Formula Firewall / Deck Dash: 3 roles (Intern /
  Manager / Director, only lives differ), autosave + resume, local Top 10
  leaderboard with name entry, automatic screenshot on a new all-time #1.
- Deliberately has no cards, suits, or betting language — see the Trademark
  checklist for why.

## Number Streak v2 (2026-07-05): full redesign — rounds, levels, draw option, no lives

Rebuilt from scratch based on playtesting feedback:

- **Removed the Intern/Manager/Director difficulty picker.** It only used to
  vary lives; since lives are gone in this redesign, the role selector had
  no remaining purpose, so the game now starts immediately.
- **Two number boxes**: left shows the current (known) number; right starts
  empty with "Will the next number be higher, lower, or draw?" and reveals
  the drawn number after a guess.
- **Three guess buttons**: Lower / Draw / Higher — "draw" (the next number
  equals the current one) is now a real, guessable outcome, which matters
  more at small ranges (Level 1's 0–5 range makes draws fairly common;
  Level 10's 0–1000 makes them rare).
- **10 rounds per level, shown as a 10-column table** (header 1–10, results
  row shows O for a hit / X for a miss) that resets at the start of each
  new level.
- **Streak multiplier**: 2+ correct in a row multiplies that round's 10
  base points by `1 + 0.1 × (streak − 1)`, capped at **2.0×**, displayed to
  1 decimal place. A miss resets the streak to zero; a new streak starts
  counting from scratch (matches the "round 1+2 hit → 1.1×, round 3 miss,
  round 4+5 hit → new 1.1×" example from feedback).
- **No lives** — instead, each level has a score target
  (`40 + level × 10`) that must be earned within that level's 10 rounds to
  advance; falling short ends the run immediately.
- **Number range grows by level**: 0–5, 0–10, 0–20, 0–50, 0–100, 0–150,
  0–200, 0–300, 0–500, 0–1000 (Levels 1–10). The last five ranges were our
  own extrapolation of the "0–5, 0–10, 0–20, 0–50, 0–100, etc." pattern
  given in feedback — tune `LEVEL_RANGES` in `script.js` if these should be
  different.
- **Toolbar layout fixed**: Save/Reset/Records/Capture were previously
  split across two visually disconnected columns; now a single row.

- **Draw bonus multiplier**: correctly calling a draw pays extra on top of
  any streak multiplier — ×3 at Levels 1–3, ×5 at Levels 4–7, ×10 at Levels
  8–10 (`drawBonusMult()` in `script.js`). This directly compensates for
  draws becoming statistically rarer as the number range widens each level.

## Number Streak v3 (2026-07-05): critical display bug fix + UX polish

**Root-cause bug found**: the "Current" number box was only ever written to
the DOM once, at game start (`render()`). Every subsequent round updated
the internal `currentNumber` variable correctly (so scoring logic was never
actually wrong), but the on-screen box stayed frozen on the very first
round's number forever. Players comparing what they saw on screen against
what the game had actually just compared against were seeing two different
numbers — which read as "a wrong guess got marked correct." Fixed by moving
the DOM update into the post-reveal `setTimeout`, timed to fire exactly when
the result toast disappears (see below) — matching the requested "Current
updates after the toast clears" behavior and eliminating the mismatch.

Other changes:
- **Toast duration**: raised from 2.6s to 3.8s (`REVEAL_MS`), and the
  round-advance delay was changed to match exactly, so the visible result,
  the toast, and the "Current" number update are all synchronized instead
  of the round silently advancing 1.7s before the toast even finished.
- **Removed boundary-based button disabling**: Lower/Higher used to disable
  whenever the current number was already at 0 or the level's max — logical,
  but it read as "buttons randomly stop working." Buttons now only disable
  during the reveal window or after the run ends; guessing an impossible
  direction (e.g. "Lower" when current is 0) is simply always a miss, no
  different from any other wrong guess.
- **Range and target now prominently displayed**: a bold banner above the
  two number boxes shows the level's active range (previously buried in the
  status bar), and an enlarged, boxed banner below the round table shows the
  level's score target vs. points earned so far (previously small muted
  text).
- **Guide expanded** with a full Level → Range → Target → Draw-bonus table
  instead of prose, plus the Guide button's placement (top-right) matches
  the request as-is.

## Title 4: Card Memory (2026-07-05)

An emoji-to-word memory match game at `arcade/card-memory/` — Arcade's 4th
title.

- 5×4 grid, 20 cards (10 emoji + 10 matching English words) — flipping an
  emoji and its word is a match, not emoji-to-emoji.
- 5 stages, each with its own 10-pair theme: Animals (Easy) → Animals
  (Normal) → Flags (Normal) → Flags (Difficult) → Random (Crazy Mode, which
  draws a fresh random 10 out of a 20-item pool every run for replay value).
- 3 roles (Intern/Manager/Director) only change starting lives (5/3/2) — a
  wrong match costs one life.
- Same streak-multiplier formula as Number Streak (1 + 0.1 × (streak − 1),
  capped at 2.0×), plus a **+20 perfect-stage bonus** for clearing a stage
  with zero wrong matches.
- Each stage briefly shows all cards face-up (2s) before flipping them down,
  standard memory-game convenience.
- Same conventions as the rest of Arcade: autosave + resume (mid-stage),
  local Top 10 leaderboard, automatic screenshot on a new all-time #1,
  in-game Guide.
- **Trademark note**: the chrome is a generic "image editor" homage (title
  bar, decorative toolbar icons, a static "Layers" panel, color swatches) —
  not Photoshop, Illustrator, or Paint by name, icon, or color. Accent color
  is an unused-so-far violet (`#6b4fa0`), distinct from every other title's
  palette.

## Card Memory v2 (2026-07-05): larger random pools, preview limited to Stages 1–2, timed turns, hints

- **Random pools for every stage**: Stages 1–4 now draw their 10 pairs from
  a themed pool of 40 items each (Stage 5 stays at 20) instead of a fixed
  10-item list, so the exact set of animals/flags differs most runs —
  matches the same "pick 10 from a bigger pool" pattern Stage 5 already
  used. Pool counts and zero-duplicate-within-pool were verified with a
  Node script before shipping.
- **Preview restricted to Stages 1–2**: Stages 3–5 skip the "see all cards
  first" phase entirely and show a clear notice ("No preview from Stage 3
  onward") the moment such a stage loads.
- **Time-limited turns**: once a first card is flipped, a countdown starts
  for that stage's limit (10s / 8s / 7s / 6s / 5s for Stages 1–5). Timing
  out auto-flips the card back and counts as a miss, same as a wrong match.
- **Two one-time hints per run** (not per stage): "Reveal All" (briefly
  flips every unmatched card face-up) and "Flash Pair" (pulses a border
  around one still-hidden pair without flipping it). Both are usable only
  between turns, and each becomes permanently disabled after one use for
  the whole run.

## Card Memory v3 (2026-07-05): scaled preview per stage, longer reveal hint, responsive layout

- **Preview now applies to every stage, not just 1–2**, with duration
  shrinking each level: 5s / 4s / 3s / 2s / 0s for Stages 1–5. This
  supersedes the earlier "no preview from Stage 3" rule — Stage 5's 0s
  duration produces the same practical effect (no real preview) without a
  special-case notice.
- **Reveal-All hint duration increased** from 1.5s to 4s, giving a genuinely
  useful second look rather than a blink-and-you-miss-it flash.
- **Responsive layout pass**: the Layers panel, decorative toolbar icons,
  and color swatches hide below 640px; the card grid, fonts, buttons, and
  status bar all scale down at 640px and 400px breakpoints; word-type card
  text uses `clamp()` so long words (e.g. "Netherlands") shrink to fit
  automatically at any width instead of overflowing.

## Card Memory v4 (2026-07-05): bigger text, bonus-life cards, matched-card font bug fix

- **Bug fix**: matched cards were rendering emoji at the base 13px font
  size instead of the intended larger size, because `.card.matched` never
  had its own font-size rule (`.card.face-up`'s 28px only applied while a
  card was still in the transient "face-up" state, not once it flipped to
  "matched"). Since matched cards stay visible for the rest of the stage,
  this made most of the board look tiny. Fixed by giving emoji cards a
  much larger size (46px) that applies to both `face-up` and `matched`
  states; word cards now use a bigger `clamp(11px, 3.4vw, 18px)` too.
- **Bonus cards**: each stage secretly flags 1–3 of its 20 cards as bonus.
  Completing a match that includes one restores +1 life (capped at the
  role's starting max) with a pulse animation on the Lives stat and a
  green celebration banner; matching one while already at full lives still
  shows the banner (no double-dip), so the surprise is consistent either
  way. A small star badge appears on a bonus card once it's been revealed.

## Title 5: Paycheck Python (2026-07-05) — Arcade lineup finalized

Arcade's fifth and final title for the "5-title" milestone, at
`arcade/paycheck-python/`. A classic grid-based Snake variant with a
work-avoidance narrative: you're an office worker (the snake) eating money
to grow strong while dodging your job.

**Mechanics:**
- Grid-based movement (18×14 cells), arrow keys/WASD or an on-screen D-pad.
  Colliding with a wall, your own tail, or an obstacle costs one life;
  losing a life respawns a short snake at a safe empty spot in the same
  level (progress toward that level's coin target is kept).
- **3 roles** (Intern/Manager/Director) — lives only (5/3/2), same
  convention as every other Arcade title.
- **3 levels**, each with its own obstacle set and target:
  - **Level 1**: no obstacles, eat 5 coins to advance. 1 bonus coin (💎)
    grants +1 life (capped at the role's max).
  - **Level 2**: 4 static office-equipment obstacles appear. Eat 10 coins
    to advance. 2 bonus coins: one +1 life, one worth 1.5× points.
  - **Level 3**: Level 2's 4 obstacles plus 4 larger "company building"
    obstacles (rendered ~1.5× bigger — visual only; the collision hitbox is
    still a single grid cell, a deliberate simplification to avoid
    multi-cell hitbox geometry). No bonus coins. Instead, an unbroken
    streak of eaten coins adds a compounding score bonus: the Nth coin in a
    streak is worth an extra N% (so a 10-coin streak's next coin pays
    +10%). Hitting a wall or your own tail resets the streak to zero —
    **hitting an obstacle does not reset it**, per explicit design intent.
    Eating **100 coins** in Level 3 triggers a "Payroll Master" ending.
- **Bug avoided before shipping**: bonus coins are spawned exactly once per
  level entry, not on every respawn — an earlier draft would have let
  players farm infinite lives by repeatedly dying and respawning within
  Level 1 to keep re-triggering a fresh bonus-life coin. Fixed by
  separating "reset the snake" from "regenerate items" into two independent
  flags on `setupLevel()`.
- Scores use 1 decimal place (matches Number Streak/Card Memory) so the
  Level 3 combo bonus is visible from the very first streak coin instead of
  rounding away to nothing.
- Same conventions as the rest of Arcade: autosave + resume, local Top 10
  leaderboard, automatic screenshot on a new all-time #1, in-game Guide.
- **Trademark note**: the chrome is an Outlook-style mail client homage
  (title bar, ribbon tabs, a decorative app-switcher rail, a decorative
  folder pane) in an original navy (`#2c3e6b`) — not Outlook's real branding
  or icon set. "Snake" as a game genre is decades-old and not owned by any
  single company; the title itself is "Paycheck Python," not "Snake."

## Arcade lineup finalized (2026-07-05)

Per the master plan, Arcade's roster is now locked at 5 live titles + 1
planned: **Deck Dash, Formula Firewall, Number Streak, Card Memory, Paycheck
Python** (all Live) and **Cat Care** (In Planning). Spot the Difference and
Word Search were dropped from `arcade/titles.json` (neither had been built
— no code was lost).

## Paycheck Python v2 (2026-07-05): countdowns, wider grid, clearer obstacles, ramping speed

- **5-second countdown after picking a role**, 3-second countdown after
  every respawn — the board is visible during the countdown so you can plan
  before the snake moves.
- **Grid width doubled** (18 → 36 columns, rows unchanged at 14) for more
  horizontal play space.
- **Direction pad redesigned**: a single horizontal row of four buttons,
  each showing its icon plus an English label (Up/Down/Left/Right) instead
  of the previous cross-shaped icon-only pad.
- **Obstacles are now plain colored blocks, not emoji** — office-equipment
  obstacles were being confused with the money emoji you're supposed to
  eat. Obstacles use the same color as the title bar/toolbar (`#2c3e6b`,
  darker for Level 3's bigger "building" obstacles) so coins (always emoji)
  and hazards (always solid color) are unambiguous at a glance.
- **A commute-themed intro illustration** was added to the role-select
  screen (dawn sky, office buildings, a clock at 9:00 AM, "Payday's coming —
  clock in.") — the same treatment Deck Dash uses for its 6PM commute-home
  scene, mirrored for a commute-to-work moment instead.
- **Speed now ramps continuously with score** (every 50 points shaves a
  little off the tick interval, floored at 60ms), on top of each level
  already being a bit faster than the last.
- **Respawn keeps your current length** instead of resetting to a short
  starter snake. This required a real fix, not just a config change: the
  original respawn placement only tried to lay the snake out in a single
  straight row, which is impossible once the snake is longer than the grid
  is wide (very possible in Level 3, which can grow past 36). Fixed with a
  fallback that lays a long snake out in a back-and-forth (boustrophedon)
  path across multiple rows when it won't fit in one — verified with a
  Node script confirming every segment stays grid-adjacent for lengths up
  to 100.
- Respawn placement also now searches outward from the horizontal center
  instead of preferring the rightmost fit — the previous version could
  drop the snake right next to the wall it was about to be pointed at,
  causing an instant second collision.

## Paycheck Python v3 (2026-07-05): respawn-facing-obstacle bug fix, speed formula, Speed HUD

- **Bug fix — repeated instant death on respawn**: the respawn placement
  only checked that the snake's *body* cells were clear, never the cell(s)
  directly ahead of the head in its (fixed) travel direction. Since the
  search was deterministic and obstacles don't move within a level, dying
  once near an obstacle could put the very next respawn in the exact same
  spot facing the same obstacle — reads as "keeps dying immediately" even
  though the 3-second countdown technically allowed a manual dodge.
  `placeSnakeSafely()` now rejects any candidate spot whose next 1–2 cells
  ahead are an obstacle (checked for both the single-row and the
  long-snake zigzag placement paths), verified with a Node script against
  a deliberately placed obstacle.
- **Speed formula changed to match the requested rule exactly**: every 50
  points now adds a flat **+10% speed relative to the level's base rate**
  (`tickMs = levelBase / (1 + 0.10 × floor(score / 50))`), replacing the
  previous flat millisecond reduction (which felt inconsistent across
  levels since each level's base speed differs).
- **Speed now shown live** next to Score in the status panel (e.g. "+20%").

## Title 6: 오늘의 고양이 (Cat Care) — 2026-07-06, Korean-only Arcade exception

Arcade's 6th title, at `arcade/cat-care/`. **Entirely in Korean** — an
explicit, one-off exception to the site-wide "Arcade stays English" rule,
per direct instruction. Structurally very different from every other
Arcade title: no lives, no score, no leaderboard — it's a one-day
emotional check-in ritual instead of a competitive game.

- **Real-world time gate**: can only be started when the visitor's actual
  clock reads 08:40–09:20. Outside that window (or on weekends), a warm
  "come back tomorrow" message shows instead — no game state, no bypass.
- **Weekdays only** — Saturday/Sunday show a rest message, no start option.
- **Name entry**: free text (max 8 chars) or a 🎲 "suggest a name" button
  pulling from a 26-name pool. **A name used in the last 7 days can't be
  reused** (tracked in `localStorage`, pruned automatically).
- **Async check-in structure (not always-open-tab)**: on start, the whole
  day's 6–8 care events (food/litter/play) are scheduled up front and
  saved. The visitor can close the tab and come back anytime before 18:00;
  each visit recalculates what happened since the last check (a `setInterval`
  re-render every 15s and a `visibilitychange` listener handle it while the
  tab *is* open, but nothing server-side or push-based is required).
- **30-minute grace window** per event — respond within 30 minutes of it
  "occurring" or it's recorded as missed.
- **Hard-won bug, caught in testing before shipping**: the first scheduling
  algorithm (per-segment jitter) was supposed to guarantee a 40-minute
  minimum gap between events, but a 2000-trial Node simulation showed it
  could produce gaps as low as ~11 minutes. Replaced with a stick-breaking
  algorithm (distribute leftover slack across the gaps, then add the fixed
  40-min minimum on top of each) — a follow-up 3000-trial simulation
  confirmed the minimum gap holds at exactly 40 minutes in every case.
- **Ends at 18:00 sharp** regardless of start time. Final message is
  assembled from an opening + body + closing pool (10 each × 3 tiers = 1,000
  combinations), tier chosen by care success rate (<40% / 40–79% / ≥80%,
  boundaries verified against several rates in Node). All three tiers are
  written so the *person*, not the cat, is always the one being comforted
  or celebrated — no phrasing that could make someone feel guilty for a
  low score.
- **Visual direction**: a soft dusty-rose palette (`#d97a93`), distinct
  from every other title's accent color, homaging a generic paint/canvas
  toolbar (brush/pencil/palette icons, color swatches) without naming or
  copying any specific drawing app — deliberately avoided calling it "그림판"
  on-screen since that's Microsoft Paint's actual Korean product name.

## Cat Care v2 (2026-07-06)

- **Arcade 목록 제목/설명 영어로 환원**: 게임 내부 콘텐츠만 한국어 예외를 유지하고, `titles.json`의 title/description은 사이트 전체 컨벤션(영어)에 맞춤.
- **툴바 아이콘 정리**: 붓(🖌️)/연필(✏️)/팔레트(🎨) 테마에 안 맞던 반창고(🩹) 아이콘을 크레용(🖍️)으로 교체.
- **고양이 대화 기능 추가**: "지금 기분이 어떠세요?" 10개 감정 버튼(기쁨/슬픔/화남/피곤함/불안/심심함/평온/뭉클함/지침/설렘) → 클릭 시 고양이가 말풍선으로 랜덤 응답(감정당 5개, 총 50개). 예정된 케어 이벤트와 무관하게 하루 중 언제든 몇 번이든 사용 가능. 기존 원칙(항상 사람을 위로/응원하는 톤, 자책 유발 문구 없음)을 이 50개 문구에도 동일하게 적용.

## Fortune Title 1: Tarot Pick (2026-07-06) — Korean-only Fortune exception

Fortune's first live piece of content, at `fortune/tarot-pick/`. Same
pattern as Cat Care: the hub listing (title/description in
`fortune/items.json`) stays English, but everything inside the game is
entirely in Korean.

- **Full 78-card deck** (22 Major + 56 Minor Arcana across Wands/Cups/
  Swords/Pentacles), each with an original emoji, Korean keyword, and one
  of 3 energy tiers (positive/neutral/challenging) — verified with Node
  (78 cards, zero duplicate names, energy distribution skews positive
  34/27/17 by design).
- **10 workplace categories**: 오늘의 출근길 운세, 이달의 이직운, 상사와의
  궁합, 이번 달 연봉/보너스운, 오늘 회식/야근운, 오늘의 회의운, 이번 주
  동료운, 올해 승진운, 오늘의 점심 메뉴운, 주말 회복운. Each category has
  5 phrases per energy tier (150 total, verified with Node) — a card's
  drawn energy tier picks which pool to pull the result line from, so the
  content scales as (78 cards) + (10 × 3 × 5 phrases) instead of writing
  78 × 10 fully separate readings.
- **One draw per category per day**, tracked independently per category in
  `localStorage` — drawing "이달의 이직운" doesn't affect the other 9
  categories' availability. Revisiting an already-drawn category re-shows
  the same card/result rather than re-rolling.
- **Shareable result links, no backend required**: a result's state (
  category, card index, phrase index) is encoded directly in the URL
  (`?cat=...&card=...&line=...`). Opening a shared link renders that exact
  card/result in a read-only view — nothing is re-rolled and the viewer's
  own daily-draw state is untouched. Uses `navigator.share()` on mobile,
  clipboard copy as the desktop fallback.
- **No reversed cards in v1** (upright-only), single-card draws only (no
  spreads) — kept deliberately simple for a first release.
- **Trademark note**: card names (The Fool, The Tower, etc.) are centuries-
  old public-domain terms, not reproduced from any specific published deck's
  artwork or copy — all keywords, emoji, and every one of the 150 category
  phrases are original.

## Fortune Title 2: Desk Fortune Cookie (2026-07-06) — Korean-only Fortune exception

Fortune's second live piece of content, at `fortune/desk-fortune/`
(implements the previously-planned "Daily Fortune" slot in `items.json`,
now fully built out). Same Korean-only exception pattern as Cat Care and
Tarot Pick — hub listing stays English, in-game content is entirely Korean.

- **6 non-overlapping time slots covering all 24 hours**: 08:00–08:59
  commute, 09:00–10:59 morning, 11:00–11:59 lunch, 12:00–16:59 afternoon,
  17:00–18:59 leaving, 19:00–07:59 home/night. Verified with a Node
  simulation across every slot boundary — no gaps, no overlaps.
- **10 fortunes / 10 lucky-weapons / 10 survival-tips per slot** (180 lines
  total, all counted with Node before shipping) — cracking the cookie
  picks one of each at random for the current slot.
- **Lunch slot gets an extra recommended-menu card** (visually distinct,
  dashed border) pulled from a **100-item Korean lunch menu pool** (zero
  duplicates, verified with Node).
- **Day-of-week bonus line** appended at the end of every result (7 lines,
  Mon–Sun each with a different mood — Monday-blues-heavy, Friday-hype-
  heavy, weekend "rest over reading" tone).
- **Job selector above the cookie** (10 jobs: 개발자/디자이너/영업직/마케터/
  인사/재무회계/고객상담/생산현장직/프리랜서/공무원), each with a 15-line
  comment pool (150 total) appended regardless of time slot — the cookie
  stays disabled until a job is picked. Selection persists across visits
  via `localStorage`.
- **One crack per time slot per day**: revisiting an already-cracked slot
  shows the same stored result plus one of 6 slot-specific humorous
  "already checked" messages (adapted from the original planning doc's
  reopen-message concept) instead of re-rolling.
- **Shareable result links** (same no-backend URL-param approach as Tarot
  Pick: `?slot=&f=&w=&t=&day=&job=&jl=&m=`) plus a **save-as-image** button
  (`html2canvas`, same pattern used for Arcade's #1-leaderboard captures).

## Fortune Title 3: Lucky Numbers (2026-07-06) — Fortune 3/3 complete

Fortune's third and final planned content, at `fortune/lucky-numbers/`.
Same Korean-only exception pattern as Cat Care/Tarot Pick/Desk Fortune
Cookie.

- **5 unique random numbers (1–99)** plus a **bonus "lucky item"** (20-item
  pool, e.g. "네잎클로버," "노란 우산" — deliberately whimsical, not
  number-based, to keep the whole thing feeling like a game rather than a
  prediction) — zero duplicate pool entries verified.
- **Explicitly not a 6/45 lotto format**, and a disclaimer is shown on both
  the draw screen and the result screen: not affiliated with any lottery
  operator, makes no odds-related claims.
- **One draw per day**, same `localStorage` pattern as the other two
  Fortune titles.
- **Shareable result links** via URL params (`?n=1-2-3-4-5&b=idx`), no
  backend required — same approach as Tarot Pick/Desk Fortune Cookie.

**Fortune's 3-title roadmap goal (Daily Fortune → renamed/shipped as Desk
Fortune Cookie, Tarot Pick, Lucky Numbers) is now fully complete.**

## Formula Firewall v2 (2026-07-06) — major mechanics overhaul

- **Tower Energy system replaces the old "attacks drain overall Integrity"
  rule**: each tower now has its own Energy bar (starts equal to its cost,
  scaled by difficulty — Intern ×1.4, Manager ×1.0, Director ×0.85 to
  offset threats now attacking from Level 3 instead of Level 6). Energy
  damage is cumulative for the whole run, not reset per level. A tower
  whose Energy hits zero explodes and is permanently removed — global
  Integrity only drops when a threat reaches the end of the path.
- **Demolish mode**: new ribbon button toggles a mode where clicking any
  placed tower removes it for a 50% refund of its original cost.
  Destroyed-by-enemy towers get no refund — self-demolishing is the only
  way to recover value, which is the intended risk/reward split.
- **Two new towers**: `=INDEX()` (200 cost, unlocks Level 4, long-range
  precision single-target) and `=QUERY()` (300 cost, unlocks Level 7,
  hits every threat simultaneously within range). Ribbon buttons show a
  `locked` state until their level. Tower icon letters were reassigned
  (V/F/S/X/Q) after catching that IFERROR and INDEX would have collided
  on the same "I" — caught before shipping.
- **Two new threat types from Level 6+**: a slow, heavily-armored
  "Corrupted Cell (#REF!)" tank, and a fast "Bonus Byte" that pays extra
  money on kill and costs nothing if it slips through (spawn odds: 12%
  bonus / 15% tank / rest normal).
- **Fixed a real bug**: minimizing the tab mid-wave and restoring it could
  spawn multiple enemies stacked on top of each other. Root cause: the
  wave's `setInterval` spawn timer kept firing (throttled) while the
  animation loop was suspended in the background tab, so several enemies
  queued up at the same spawn point with zero visual movement between
  them. Fixed with a Page Visibility listener that explicitly pauses both
  the spawn interval and the render loop while hidden and cleanly resumes
  both on return, plus a small random spawn-position jitter as a second
  line of defense against any other stacking case.
- **Tower energy bar visualization**, **destruction effects** (expanding
  ring flash) for both towers and enemies, and a **"Towers Lost" column**
  added to the Top 10 leaderboard.

## Site-wide: whole-row navigation (2026-07-06)

The root hub and Arcade hub already supported clicking anywhere in a row
(not just the "Open"/"Play" button) to navigate. Fortune's and Academy's
hub pages did not — fixed to match, so all four hub-style listing pages
now behave identically.

## Content pruning (2026-07-06)

Cat Care (Arcade) and Lucky Numbers (Fortune) were pulled from their
listings pending a redesign — entries removed from `titles.json` /
`items.json` respectively, files left on disk untouched in case any of
the existing implementation gets reused.

## Academy: 2 more items registered (2026-07-06)

`academy/items.json` now also lists 비즈니스 영어 마스터
(`business-english-master.html`) and AI 사용법 마스터
(`ai-usage-master.html`), both already fully built in earlier sessions —
they just weren't wired into the Academy hub listing yet.

## Site-wide redesign v3 (2026-07-08)

Following design work done in a separate [전략] track (design package:
`nts_drive_design_package.zip` + discussion doc), the whole site's shell
was rebuilt to a new visual system — a shared `styles.css` now drives all
4 hub-style pages (root, Arcade, Fortune, Academy).

- **Design tokens**: Space Grotesk (display) + Inter (body), palette
  `--blue #0071E3 / --coral #FF6F59 / --violet #8B5CF6 / --teal #14B8A6 /
  --amber #F5A524`, ink `#0F1115` on off-white `#FBFBFD`.
- **Root page**: signature 3D "floater" hero (3 tilting folder cards,
  mouse-tracked via `perspective`/`rotateY`/`rotateX`), the blue Arcade
  card doubling as the primary CTA (scroll-into-view on click, plus a
  scroll-linked scale/shadow effect), ambient blurred-blob parallax,
  dynamically-rendered folder grid, a manually-curated "이번 주 BEST"
  strip, and a click-to-open onboarding modal (no auto-trigger).
- **Folder grid stays fully data-driven**: fetches `categories.json`,
  and for each `Live` category also fetches its `itemsSource` JSON to
  compute a live count (verified end-to-end with an actual Node `fetch`
  run against a local server: Arcade → 5, Fortune → 2, Academy → 3,
  Community/Store → "준비중"). Adding/removing a title anywhere on the
  site updates this badge automatically — no hand-editing the homepage.
- **Arcade/Fortune/Academy hub pages**: rebuilt to a shared "file list"
  pattern (breadcrumb, single-column file rows with a folded-corner
  document icon, Live badge), each still reading its own `titles.json` /
  `items.json` and rendering only `status: "Live"` entries — matching
  the design decision to drop "N/M live" progress language entirely.
  Per-title icon colors were hand-mapped (with a neutral gray fallback
  for any future title without an explicit mapping).
- **Arcade's listing order was reordered** in `titles.json` to match the
  design doc's finalized sequence: Formula Firewall → Number Streak →
  Paycheck Python → Card Memory → Deck Dash.
- **Whole-page navigation**: a shared `navigate(url)` pattern (fade+slide
  out via a `.leaving` class, then `location.href`) replaces in-page
  panel switching everywhere — "opening a folder" is a real page load.
- **Mobile**: top nav links and the hamburger are both dropped in favor
  of a fixed bottom GNB (홈/Arcade/Fortune/Academy/더보기) on all 4 pages,
  now wired to the real Arcade/Fortune/Academy pages instead of scroll
  anchors now that those pages exist.
- **Scope note**: this pass only covers the 4 hub/listing-style pages.
  Individual game and content pages (Formula Firewall, Tarot Pick,
  Spreadsheet Master, etc.) keep their existing per-title visual identity
  and were intentionally left untouched.

## Post-launch bug fixes & polish (2026-07-08, v3.1)

Caught from live screenshots after the v3 redesign shipped:

- **Real bug — wrong back-link path**: `academy/business-english-master.html`
  and `academy/ai-usage-master.html` live directly inside `academy/`, but
  their "← 아카데미로 돌아가기" link was `../index.html` (written as if
  they were one level deeper, like `spreadsheet-master/index.html` is) —
  so clicking it landed on the *root* homepage instead of the Academy hub.
  Fixed to `index.html`; verified the resolved URL with `urllib.parse.urljoin`.
- **Real bug — bfcache showed a blank page on browser Back**: the
  fade-out `navigate()` helper adds a `.leaving` class before changing
  `location.href`. If the browser restores the page from its back/forward
  cache, it can restore that exact mid-fade DOM state (opacity 0), which
  looked like "pressing back doesn't bring the page back." Fixed with a
  `pageshow` listener that strips `.leaving` on `event.persisted`, added
  to all 4 hub pages.
- **Hero sizing**: the 3D floater cards' vertical math left almost no
  margin before clipping (worst case exactly 0px on mobile). Increased
  `.stage` height (280→320 desktop, 220→260 mobile) for real breathing room.
- **Folder grid sizing**: Arcade now spans the full row alone
  (`grid-column:1/-1`); Fortune/Academy/Community/Store are all equal
  single-column cards in the row below (previously Community/Store were
  double-width while Fortune/Academy were single, an inconsistent mix).
- **Explicit "← 홈으로" link** added to the Arcade/Fortune/Academy hub
  topbars, alongside the existing brand-click affordance.
- **Arcade hero CTA card** now navigates straight to `arcade/index.html`
  instead of scrolling down to the folder grid.
- **Onboarding modal** ("처음이신가요?") now opens anchored near the top
  of the viewport (under the sticky nav, within the hero's visual range)
  instead of dead-centered on screen.
- **Number Streak**: the post-guess pause (`REVEAL_MS`) — which drives
  both the result toast duration and the delay before the next round's
  number is revealed — changed from 3.8s to 1.5s.
- **Arcade end-of-run modal**: removed the "View Records" button across
  all 5 titles (Formula Firewall, Number Streak, Card Memory, Deck Dash,
  Paycheck Python) — clicking it opened the leaderboard overlay stacked
  behind the end-of-run overlay instead of replacing it, making the
  ranking unreadable. "Play Again" is now the only action; the ribbon's
  separate `Records` button (unaffected by this bug) remains the way to
  check the leaderboard mid-session.

## Post-launch fixes round 2 (2026-07-08, v3.2)

- **Real content bug**: `academy/spreadsheet-master/index.html` was still
  a 44-line "coming soon" stub ("첫 게시글을 준비 중입니다") left over from
  before Academy pivoted to the interactive-guide format — the real
  127-item, 5-level guide had only ever been delivered as a standalone
  download, never actually placed at this path. Replaced with the
  complete v2.1 guide (451 lines); verified its existing `../index.html`
  back-link correctly resolves to the Academy hub (this file genuinely
  lives one level deeper, unlike the two Academy files fixed in v3.1).
- **Hero headline**: line break moved to right after "직장인을 위한" per
  updated copy direction.
- **Feedback widget vs. mobile GNB**: the feedback pill's `bottom:14px`
  sat inside the fixed bottom nav's footprint on narrow screens. Added a
  mobile-only override (`bottom:84px` under 760px) so it floats above the
  GNB instead of overlapping it.
- **Desk Fortune Cookie slot boundary**: "home" now ends at 23:59 sharp
  (was wrapping through to 07:59) and "commute" now starts at 00:00
  (was 08:00) — the entire post-midnight span before the actual 08:40
  start window reads as commute-flavored instead of home-flavored.
- **Folder grid badge alignment**: badges ("2개 운영중" / "3개 테마 완성" /
  "준비중") now pin to the bottom of each card via `margin-top:auto`
  instead of a fixed `margin-top`, so they land on a shared baseline
  across a row regardless of how many lines each card's description wraps to.
- **Hero mobile overflow**: the floater's card block used fixed desktop
  pixel dimensions (up to ~350px total span) with no mobile override,
  overflowing narrow viewports. Added a dedicated mobile size/offset set
  (floater 210px, cards 160×108px) that fits within a 300px stage —
  comfortable on real phone widths (375px+), with only negligible
  clipping possible on legacy sub-340px devices.
- **Sticky top nav on detail pages**: already shipped in v3.1's
  "back-home" pass (`.topbar{position:sticky; top:0}`) — confirmed still
  in place, no further change needed here.

## Post-launch fixes round 3 (2026-07-08, v3.3)

- **Unified top/bottom nav across all 4 pages**: Arcade/Fortune/Academy's
  simple `.topbar` (brand + "← 홈으로" text link) was replaced with the
  exact same `.nav` component the root page uses — full Arcade/Fortune/
  Academy/Community links (current page shown as a non-clickable
  `.active-link`), sticky positioning, and a clickable "NTS Drive" logo
  that returns home. The standalone "← 홈으로" link is gone since the
  logo now serves that purpose on both mobile and desktop, matching how
  the home page itself works. Removed the now-dead `.topbar`/`.back-home`
  CSS.
- **Mobile bottom-nav clearance**: hub pages' `.main` only reserved 30px
  of bottom padding under the fixed bottom GNB (vs. the root page's
  78px), which on short-content pages like Fortune could make the nav
  look like it was floating mid-page with dead space below rather than
  pinned cleanly to the screen edge. Bumped to 90px to match.
- **Spreadsheet Master's back-link**: was its own full-width white bar
  with a border, sitting outside `.container` — visually inconsistent
  with every other Academy page's plain inline text link. Moved inside
  `.container` and restyled to match `business-english-master.html` /
  `ai-usage-master.html` exactly.
- **Arcade hero CTA scale-on-scroll**: the effect was driven by raw
  `window.scrollY` over a 260px range — on desktop, where the hero can be
  proportionally shorter relative to viewport height, the card could
  scroll out of view before the effect became visually obvious, making
  it seem broken versus mobile. Shortened the trigger range to 150px
  (same total scale amount, reached sooner) so it reliably plays while
  the card is still on screen on both breakpoints. Still purely a
  function of current scroll position, so scrolling back up smoothly
  reverses it exactly as before — no behavior change there, just made
  the forward direction actually visible on desktop.

## Hero background photo — tried and reverted (2026-07-08, v3.4 → v3.5)

Briefly shipped a dark desk-setup photo as the hero background
(`assets/hero-bg.jpg`, resized 2.0MB→221KB) with translucent frosted-glass
floater cards and light-colored text — reverted one turn later back to
the plain light-theme hero at the user's request. The asset file is left
on disk unused in case it's wanted again later; nothing currently
references it.

## Small polish (2026-07-08, v3.5)

Added `cursor:pointer` to `.nav .brand` ("NTS Drive" logo) — it was
already clickable (navigates home) but showed the default text cursor
on hover, which didn't signal that. Applies to all 4 pages since they
share the same `.nav` component.

## Hero headline reorder + two-tier sizing (2026-07-08, v3.6)

Line order flipped and given two font sizes: "미니게임, 학습, 커뮤니티가
모인" now leads (wrapped in `.h1-lead`, `font-size:0.62em` relative to the
parent h1 so it scales proportionally at every breakpoint), followed by
"직장인을 위한 드라이브" at the full headline size.

## Post-launch fixes round 4 — mobile nav & responsive (2026-07-08, v3.7)

- **Short-content pages' bottom nav looked mid-page instead of pinned to
  the screen edge** (visible on Fortune/Academy screenshots, not on
  Arcade): those hub pages' `.shell` had no minimum height, so on content
  shorter than one viewport, full-page screenshot tools (and some mobile
  browser edge cases) computed the fixed nav's position against a
  resized/short "page" rather than the real device viewport. Added
  `.shell{min-height:100vh}` so every hub page — regardless of how few
  items it lists — always has at least a full viewport of layout height,
  matching how the longer Arcade page happened to already look correct.
- **Real horizontal-overflow bug on the home page's mobile folder grid**:
  `.folders`/`.best-grid` used bare `repeat(n,1fr)` tracks, which in CSS
  Grid don't shrink below their content's intrinsic min-width unless
  explicitly told to. On narrow phones this let card text/badges force
  the grid wider than the viewport, and the screenshot showed the page
  scrolled sideways with the left edge of cards clipped off. Fixed by
  switching every grid to `minmax(0,1fr)` tracks and adding
  `min-width:0` to `.folder`/`.best-card` so they can actually shrink to
  their column's allotted width instead of overflowing it.
- **Bottom GNB**: removed the "더보기" (More) tab (previously just
  scrolled/linked back to the folder section — redundant now that the
  top nav exists everywhere) from all 4 pages. Order settled on
  홈 → Arcade → Fortune → Academy on every page, with the current section
  shown as the non-clickable `.active` item.

## Real-device horizontal scroll bugs (2026-07-09, v3.8)

Both reported from an actual mobile device (not just DevTools emulation),
and both were genuine, previously-unfixed bugs:

- **Root page**: despite `body{overflow-x:hidden}`, the page could still
  scroll/render shifted horizontally on real mobile browsers, clipping
  the hero headline and floater cards on the left edge. Root cause: per
  the CSS spec, setting only `overflow-x` (without `overflow-y`) forces
  the browser to compute the unset axis to `auto`, which some mobile
  browsers (Samsung Internet among them) handle inconsistently for
  clipping purposes. Fixed by also setting `overflow-x:hidden` on `html`
  (not just `body`) and explicitly setting `overflow-y:auto` alongside
  it, removing the ambiguity. As defense in depth, also shrank the
  decorative `.blob` elements' size/offsets on mobile so there's less
  overflow for any residual quirk to expose.
- **Spreadsheet Master, from Level 5 on**: this page is a fully
  standalone HTML file with its own `<style>` block — it never inherited
  the site-wide `styles.css`, and its own `body` rule had **no
  `overflow-x:hidden` at all**. Levels 1–4's shorter formula examples
  happened to fit without issue, but Level 5's longer automation
  examples (e.g. the Power Query card) were wide enough to expose the
  missing protection and push the whole page wider. Added
  `overflow-x:hidden` to both `html` and `body` in this file, plus
  `max-width:100%` + `word-break:break-word` on `.formula-box` so even a
  single long unbreakable token wraps instead of forcing overflow.

## New: Post — "미래에 열리는 편지" (2026-07-09)

A brand-new top-level category, built and validated but **deliberately not
yet linked from the home page** (`categories.json` untouched) — the site
owner wants to reveal it together with a broader nav reshuffle (dropping
Store, repositioning Community/Academy/Post) at a later date. Reachable
directly at `post/index.html` for review in the meantime.

- **Concept**: write a short letter to someone, pick an unlock time, get a
  shareable link. Whoever opens it before the unlock time sees only a
  sealed envelope with a live countdown; after it, the letter reveals
  with a paper-drop-in animation.
- **7 emotional templates** (놀림/축하/응원/고백/감사/위로/송별) — each just
  changes the envelope emoji and a single italic example line to spark
  ideas; the letter itself is always hand-written by the sender, never
  auto-generated.
- **No backend, same as Tarot Pick / Desk Fortune Cookie**: the entire
  letter (recipient/sender names, title, body, unlock timestamp, and
  optional photo) is UTF-8-safe base64url-encoded into a single `?d=`
  query param. The "lock" is a client-side time check, not real
  encryption — stated explicitly in the UI disclaimer, matching the same
  honest framing used for the other time-gated features on the site.
- **Optional photo → 32×32 / 16-color dot art, done entirely in the
  browser**: upload validation caps the source file at 8MB; the image is
  center-cropped to square, downsampled to a 32×32 canvas, and each pixel
  quantized to the nearest color in a fixed 16-color palette (shared by
  the composer and viewer, so it never needs to be transmitted) — packing
  2 palette indices per byte brings a full image down to exactly 512
  bytes (~683 base64 characters). Verified end-to-end with a Node
  simulation: pack→unpack roundtrip exact match, and a worst-case letter
  (300 Korean characters + full image + max-length names/title) produces
  a **2,314-character URL** — longer than the ultra-conservative 2,000-char
  guideline some older systems use, but comfortably within what modern
  browsers and KakaoTalk/messaging apps handle.
- On reveal, the photo fades in with a polaroid-style rotate+scale
  animation half a second after the letter text appears.
- **Unlock time**: 4 presets (1시간 후 / 오늘 자정 / 내일 아침 9시 / 다음
  출근일 아침 9시) plus a manual `datetime-local` picker; picking a preset
  fills the picker, editing the picker manually clears the preset
  selection. "다음 출근일" correctly skips weekends — verified with a Node
  simulation covering all 7 possible starting weekdays (Fri/Sat both
  correctly roll to the following Monday).
- **Design system is intentionally isolated** from the rest of the site
  (its own `post/style.css`, not the shared `styles.css`): cream/ink
  palette with a single deep-burgundy accent, Noto Serif KR headlines,
  generous whitespace — an editorial/Magazine-B mood distinct from every
  other section's palette.

## Post goes live site-wide + nav reshuffle (2026-07-09, v3.9)

Post is no longer hidden — `categories.json` now includes it (status
`Live`, no `itemsSource` since it's a single tool, not a list), and every
page's navigation was updated to match:

- **Store removed entirely** from `categories.json`. The home page's
  folder-grid rearrangement the user specified translates to: the old
  Store slot → Community, the old Community slot → Academy, the old
  Academy slot → Post. Net effect: home folder order is now Arcade
  (full-width) → Fortune, Post, Academy, Community (four equal cards).
- **Top nav, all 5 pages** (root + Arcade/Fortune/Academy/Post): links are
  now exactly Arcade → Fortune → Post → Academy — Community was dropped
  from the nav bar (it's still reachable from the home folder grid, just
  no longer a top-level nav link). Post sits between Fortune and Academy
  everywhere, as requested.
- **Bottom mobile GNB, all 5 pages**: 홈 → Arcade → Fortune → Post →
  Academy (5 items now, up from 4).
- **Post's own page** previously had a minimal standalone topbar (just a
  "← 홈으로" link) fitting its intentionally isolated editorial design.
  It now also carries the same site-wide nav links and bottom GNB as
  every other section — styled in Post's own cream/serif/burgundy palette
  rather than reusing the blue sans-serif look elsewhere, so the section
  still feels distinct while behaving consistently for navigation.
  Added a matching `navigate()` helper (fade transition + the same
  bfcache-blank-page fix already shipped elsewhere) so Post's page
  transitions now match the rest of the site.
- New `.f-post` folder-icon color (deep burgundy `#8B2635` family) added
  to `styles.css`, distinct from every other section's palette.
- Verified end-to-end: `categories.json` validity, div/brace balance
  across all 5 touched HTML files + 2 stylesheets, JS syntax on every
  inline and external script, live serving (200) on every asset, all 20
  cross-page nav links resolved via `urllib.parse.urljoin`, and the home
  page's folder-count logic re-verified with an actual Node `fetch` run
  (Arcade→5, Fortune→2, Post→Live/no count, Academy→3, Community→준비중).

## Post: Open Graph link preview (2026-07-09, v3.10)

Post had zero Open Graph tags — sharing a link on KakaoTalk/etc. would
show little to nothing useful. Since Post is fully client-side (no
backend), preview crawlers only ever read the raw HTML's `<meta>` tags
and never execute the JS that decodes the `?d=` letter payload — so a
per-letter personalized preview isn't technically possible, confirming
[전략]'s direction: one fixed, generic preview for every Post link
(compose page or a shared sealed letter alike).

- Added `og:title` / `og:description` / `og:image` (+ matching
  `twitter:card` set) using the copy confirmed by the user: title "시간이
  닿아야 열리는 편지", description "(띵동) 편지가 도착했어요. 정해진
  시간이 되면 열어볼 수 있어요." — deliberately generic since the sender
  is already implied by who shared the link, so no "someone sent you"
  framing was needed.
- Also synced the `<title>` tag to match the OG title (was "Post | NTS
  Drive").
- New `post/og-image.png` (1200×630, standard OG size) generated with
  Python/Pillow: cream background, a minimal line-art envelope with a
  wax-seal dot in Post's burgundy accent, a letter-spaced "POST" wordmark
  in Noto Serif CJK KR, and the tagline underneath — matching Post's
  existing editorial design language rather than reusing any of the
  site's other section colors.

## Post: share screen polish (2026-07-09, v3.11)

- The "편지가 봉인됐어요" success screen no longer shows the raw, very
  long encoded URL in a text box. It's now a styled `📫 편지 확인하러 가기`
  button/link — clarified to the user that this only prettifies *our own
  page*, since KakaoTalk and similar apps paste plain text and don't
  render `<a>` tags, so the underlying shared URL is still exactly as
  long as before.
- "링크 복사" and "공유하기" now prepend a friendly line
  (`📫 편지가 도착했어요, 확인해보세요!`) to the copied/shared text, so
  even though the URL itself can't be shortened without a backend, what
  actually lands in the recipient's chat reads better before any OG
  preview card loads.

## Post: OG image v2 (2026-07-09, v3.12)

- **Switched to 1600×800 (exactly 2:1)** after researching KakaoTalk's
  actual behavior: it resizes/crops shared-link thumbnails to 800×400
  (2:1), not the generic 1.91:1 OG standard — the original 1200×630 would
  have been slightly cropped there. Since "카톡 공유가 메인" (KakaoTalk
  sharing is the primary use case), rendering at 2x that target
  resolution keeps it sharp after Kakao's own resize while still being
  close enough to 1.91:1 for Facebook/Slack/etc. not to crop badly either.
- **Envelope now has real dimensionality**: a soft blurred drop shadow, a
  filled body (was outline-only), a shaded flap triangle, and a two-tone
  wax seal with a small highlight — replacing the flat line-art version.
- **Added a small illustrated "travel stamp"** in the envelope's top-right
  corner (perforated edge, sky/sun/sea/mountains/tiny sailboat, a
  "TRAVEL" postmark label), rotated slightly like a real stamp — per the
  user's idea that office workers often can't actually travel, so a
  travel-themed stamp offers a small bit of vicarious escapism (대리만족)
  right on the share card.

## Post: 48×48 photo grid + link shortening (2026-07-10, v3.13)

- **`IMG_GRID` raised from 32 to 48** for noticeably better photo
  recognizability (verified visually with a real test photo — facial
  features and glasses read much more clearly at 48×48 than 32×32).
- **Backward compatibility fix, done at the same time**: letters now also
  store `imgGrid` (the grid size that letter's photo was actually encoded
  at). Old links sealed before this field existed have no `imgGrid`, so
  the reveal logic falls back to 32 for those — meaning **any letter
  already sent out before this update keeps rendering correctly even
  though the site-wide default is now 48**. Verified with a Node
  simulation covering both an old-format (32×32, no `imgGrid`) and a
  new-format (48×48, `imgGrid:48`) letter — both round-trip their photo
  data byte-for-byte correctly. `renderPixelCanvas` now takes an explicit
  grid parameter instead of always assuming the current global constant.
  Worst-case URL length (300 Korean chars + full photo + max-length
  fields) is now 3,469 characters (was 2,314 at 32×32) — still
  comfortably within what modern browsers and KakaoTalk handle.
- The upload label's "32×32" text was hardcoded separately from the
  actual grid logic — now reads `${IMG_GRID}×${IMG_GRID}` directly from
  the constant so it can never drift out of sync again.
- **Optional link-shortening**: a small "🔗 링크가 너무 길다면, 짧게
  만들러 가기" link on the share screen opens `is.gd`'s own create page
  in a new tab (`is.gd/create.php?url=...`) — a plain page navigation,
  not a script-based cross-origin API call, so it sidesteps CORS
  entirely (CORS only restricts JS-initiated cross-origin requests, not
  full page loads). is.gd states shortened links are expected to last
  "forever" barring abuse/technical issues, which was the deciding
  factor over alternatives — a broken short link would defeat the whole
  point of a letter that might not be opened for months. This is
  strictly an optional extra step; the default share flow (copy/share/
  "편지 확인하러 가기") always uses the original long link.

## Site-wide update: Post promoted to primary + full Korean content (2026-07-10, v3.14)

A large batch of changes from a single design-team handoff document,
covering GNB order, the home page hero/copy, 15 Post-specific items, and
Korean localization for Arcade/Fortune (menu labels stay English, only
descriptions/content go Korean).

### 1. GNB order (all 5 pages)
- Desktop: Post → Arcade → Fortune → Academy
- Mobile bottom nav: 홈 → Post → Arcade → Fortune → Academy

### 2. Home page
- Headline lead line changed to "커뮤니티, 미니게임, 교육이 있는".
- Hero floater cards: the blue CTA card is now **Post** ("▶ 마음을 담은
  편지 쓰러가기", links to `post/index.html`); the card that was
  "Fortune" is now **Arcade**; "Academy" card unchanged.
- `categories.json` reordered (Post first) and every description
  translated to Korean — names stay English per the confirmed scope.
- "이번 주 BEST" reordered: Post → Formula Firewall → Tarot Pick.
- Onboarding modal copy replaced; its CTA now reads "Post로 이동하기"
  and links to Post instead of Arcade.
- **All home-page emoji swapped for line-style SVG icons** — Post
  (envelope), Arcade (joystick), Academy (open book), Community
  (monitor), Fortune (a 4-point sparkle, since no shape was specified
  for it), plus a house icon for "홈" — applied consistently to both the
  folder grid and the bottom nav's icons across all 5 pages so the two
  never look mismatched against each other.

### 3. Post (15 items)
- **8 templates** now (added "환영 편지" — "만나서 반가워. 앞으로 잘
  부탁해.").
- **"저장하기" button** on the reveal screen using `html2canvas` (same
  library already used by Desk Fortune Cookie / several Arcade games) to
  export the letter as a PNG.
- Removed "(선택)" from the 받는사람/보내는사람/편지 제목/사진 labels.
- **New optional "숨�는둔 마음" link field**: composer gets a URL input
  below the letter body (auto-prefixes `https://` if missing); the
  reveal screen shows a "숨겨둔 마음 보기 →" link at the bottom of the
  letter-paper, opening in a new tab — only rendered if the stored value
  actually starts with `http(s)://`, as a minor XSS guard.
- Top-left wordmark changed from "POST" to "NTS DRIVE".
- **Share screen reverted** to showing the raw link directly in a
  text box (the "📫 편지 확인하러 가기" button from a previous session
  is gone) — plus the "🔗 짧게 만들러 가기" is.gd shortcut is removed
  entirely per direct feedback that KakaoTalk previews only send the
  image card anyway, making it dead weight.
- **Fixed a real bug**: `copyShareLink` used to prepend explanatory text
  ("📫 편지가 도착했어요...") before the URL in the copied string — if
  that combined text landed in something that expects a bare URL (e.g.
  an address bar), it got treated as a search query instead of a link.
  Now copies the pure URL only.
- KakaoTalk preview text (`og:description`/`twitter:description`)
  updated to "♬띵동♪ 마음을 담은 편지가 도착했어요. 정해진 시간이
  되어야 볼 수 있어요."
- Three template example lines rewritten (응원/축하/놀림 편지) and the
  받는사람/보내는사람 placeholder examples changed to "은우"/"지민" —
  matching the site's existing characters from the Academy content.
- **Mobile GNB-floats-mid-page bug on the reveal screen fixed** with the
  same `min-height:100vh` pattern already used to fix this exact class
  of bug elsewhere on the site — Post's layout doesn't use the shared
  `.shell` wrapper, so it needed its own copy of the fix on `body`.
- **New draw tool**: a "사진 업로드" / "직접 그리기" tab next to the
  photo field. Drawing uses the *same* fixed 16-color palette as photo
  quantization (deliberately not a wider palette — for hand-drawn pixel
  art there's no quantization "damage" to avoid, so the existing
  palette costs nothing extra and keeps the retro dot-art look
  consistent). Mouse + touch painting on a scaled-up `IMG_GRID×IMG_GRID`
  canvas, a 16-swatch color picker, and a clear button; whichever
  source (upload or draw) was used most recently is what actually gets
  sealed into the letter.
- Verified with Node: the new `link` field round-trips correctly through
  encode/decode (including the `null`/absent case), and all 8 templates'
  text matches exactly what was requested.

### 4–6. Korean content
- Arcade's 5 game descriptions and Fortune's 2 content descriptions
  translated to Korean in their respective JSON files — menu labels
  (Arcade/Fortune/Academy/Post) stay in English everywhere, confirmed
  scope. Academy's `items.json` was already fully Korean from earlier
  work, so nothing needed changing there.

## Ad placement

`.ad-slot-vert` in the sidebar (root and arcade pages) is the reserved spot
for Google AdSense. Apply once there are 3–5 live arcade titles — more
content improves approval odds.

## Trademark checklist

- No real software company's logo, icon set, or exact color system is
  reproduced anywhere (root hub or arcade entries use an original palette
  and emoji only).
- Arcade titles reference generic UI *concepts* ("approval tray", "channel
  list", "spreadsheet grid") rather than naming or visually copying a
  specific product.
- Apply the same standard to every new title and every new stage folder
  before shipping it.
