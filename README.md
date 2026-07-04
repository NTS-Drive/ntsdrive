# NTS_Drive — Static Portal for the Office-Worker Track

Backend-free static site covering three roadmap stages behind one shared
"drive" UI shell: **Arcade → Academy → Store**.

## Structure

```
office-game-hub/
├── index.html               NTS_Drive root hub (3 top-level folders)
├── categories.json            Root-level folder metadata (edit to add stages)
├── styles.css                Shared file-explorer shell (root + all subpages)
├── analytics.js               Shared GA4 loader (one Measurement ID for the whole site)
├── arcade/                   Stage 1, live
│   ├── index.html
│   ├── titles.json             Arcade entries (edit to add titles)
│   ├── deck-dash/               Endless-runner title
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   └── formula-firewall/        Tower-defense title
│       ├── index.html
│       ├── style.css
│       └── script.js
├── academy/                  Stage 2, live
│   ├── index.html
│   ├── items.json               Academy entries (edit to add content)
│   ├── picture-match/           Emoji vocabulary quiz
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── script.js
│   │   └── words.json
│   └── equation-hunt/           Spreadsheet-style hidden-calculation puzzle
│       ├── index.html
│       ├── style.css
│       └── script.js
└── store/index.html         Stage 3, planned
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

## Academy content update (2026-07-05): Picture Match replaces Word Sprint

Word Sprint (business-vocabulary multiple choice) tested as too generic and
too hard. Replaced with **Picture Match** at `academy/picture-match/`:

- An emoji is shown; the player picks the matching English word.
- 80 words across 10 levels (`academy/picture-match/words.json`), grouped
  into themes: everyday basics/objects, three rounds of countries, wild and
  rare animals, and curious/quirky objects — all easy to represent visually
  with an emoji, unlike the old abstract business terms.
- Difficulty scales with level: more answer options (3 → 4 → 5) and a
  shorter timer (12s down to 6s) as levels increase.
- 3 lives for the whole run (not per level); reaching Level 10's last word
  is a win. Streak bonus (+5 per question once 3+ in a row).
- Only a personal best (highest level reached) is stored locally — no Top 10
  leaderboard, deliberately kept lighter than Arcade titles since this is a
  skill-building tool, not a competitive one.
- Country flag emoji were used for the "Countries" themes — flags are
  national symbols, not corporate trademarks, so this carries no brand risk.

**Adding a third theme:** append entries with a new `level` (11+) to
`words.json`, or add more words to an existing level — no code changes
needed either way.

## Academy content update (2026-07-05): removed the "English quizzes" framing

`categories.json`'s Academy description no longer says "starting with English
quizzes" — Academy now also hosts non-English content (starting with a math
puzzle), so the copy was generalized to "Bite-sized learning content for
office workers."

## Academy content 2: Equation Hunt (2026-07-05)

A Wordle-style hidden-calculation puzzle at `academy/equation-hunt/`, skinned
as a spreadsheet cell grid + on-screen keypad.

**Genre note (trademark-relevant):** this reuses the generic "guess a hidden
string, get green/amber/gray position feedback" mechanic popularized by
Wordle and cloned by dozens of apps (including math-focused ones). That
mechanic itself isn't owned by any single company. What we did **not** copy:
any specific app's name, exact color palette, daily-puzzle countdown copy,
or in-app ads. The visual skin here is our own spreadsheet/cell-grid design
using the site's existing accent color and fonts.

**How it works:**
- Every level hides a calculation (digits 0–9 and `+ − × ÷`, no parentheses,
  no multi-digit numbers) that evaluates to a shown target number, using
  standard order of operations.
- A small custom expression evaluator (`evalExpression` in `script.js`)
  handles precedence — no `eval()` is used anywhere.
- The puzzle generator retries up to 300 times to find a random equation
  whose result is a non-negative integer ≤ 200 (with a guaranteed-valid
  fallback), so puzzles are generated fresh each run rather than pulled from
  a fixed list.
- Feedback uses the standard duplicate-character-safe algorithm (exact
  matches locked in first, then leftover positions checked for present-but-
  misplaced characters).
- **Levels**: 1–3 use 5-character equations with 8 guesses; 4–7 use 7
  characters with 6 guesses; 8–10 use 9 characters with 5 guesses. Solving a
  level's puzzle advances you; running out of guesses ends the run at that
  level.
- Only a personal best (highest level reached) is stored locally
  (`eh_best_level`) — same lighter-than-Arcade approach as Picture Match.

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
