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
