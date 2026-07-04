# NTS_Drive — Static Portal for the Office-Worker Track

Backend-free static site covering all four roadmap stages behind one shared
"drive" UI shell: **Arcade → Academy → Store**.

## Structure

```
office-game-hub/
├── index.html            NTS_Drive root hub (4 top-level folders)
├── categories.json          Root-level folder metadata (edit to add stages)
├── styles.css              Shared file-explorer shell (root + all subpages)
├── arcade/
│   ├── index.html          NTS_Arcade (Stage 1, live)
│   ├── titles.json           Arcade entries (edit to add titles)
│   └── doc-stack-clicker/    First live entry: "Endless Approval Stack"
│       ├── index.html
│       ├── style.css
│       └── script.js
├── academy/index.html       Academy — learning content hub (Stage 2, live, empty for now)
│   └── items.json             Learning items (English quizzes etc.) — empty until first upload
└── store/index.html         Store placeholder (Stage 3, planned)
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

## Academy content 1: Word Sprint (2026-07-04)

A 10-question, 4-choice English vocabulary quiz. Located at
`academy/word-sprint/`. First word pack: **Business English Essentials**
(40 words) in `academy/word-sprint/words.json`.

**Design decisions:**
- Distractor answers are drawn at random from *other* words' correct
  definitions in the same pool — adding a new word only requires one
  `{ "term": ..., "definition": ... }` entry, no hand-written wrong answers.
- 10-second per-question timer keeps rounds short enough for a work break;
  timing out counts as a miss and auto-advances.
- Streak bonus: 3+ correct in a row adds +5 per question on top of the base
  +10, to reward focus without punishing a single miss too harshly.
- Only a personal best score is stored locally (`ws_best_score`) — no Top 10
  leaderboard. Academy is a skill-building tool, not a competitive arcade
  title, so the scoring model is intentionally simpler than Arcade titles.
- Visual style is a clean flashcard/quiz UI in the site's own design tokens,
  not an homage to any specific office software — Academy content doesn't
  need the same "mimic a real app" premise as Arcade titles.

**Adding a second word pack:** create `academy/word-pack-2/` with its own
`index.html` + `words.json` (same schema), then add one entry to
`academy/items.json`.

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
