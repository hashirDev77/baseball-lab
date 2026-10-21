# Baseball Product Review

We built a live baseball React app on the SportsAPI365 Baseball API to see if a customer can ship a normal baseball app from the current **42** endpoints. Screens call `/v1/baseball/*` directly (no local backend). Several screens are empty or thin because the deployed API is empty, 404s optional extras, or uses a different list shape.

This document is the user-facing testing playbook. The API-team list from the live product is [`baseball_api_improvements.md`](./baseball_api_improvements.md). Live probe evidence lives in [`../data/baseball-endpoint-evidence.json`](../data/baseball-endpoint-evidence.json) and [`../data/baseball-variation-tests.json`](../data/baseball-variation-tests.json). Combined coverage output is [`baseball_api_reports.md`](./baseball_api_reports.md).

---

## How to run the product

1. Copy `.env.example` to `.env` and set `VITE_MSDATA_API_KEY` and `VITE_MSDATA_LIVE_KEY` (same keys as Cricket/Football products).
2. From the repo root:

```bash
pnpm install
pnpm dev
```

- Web: `http://127.0.0.1:5175` (React app → deployed `/v1/baseball`)

Re-run automated API tests:

```bash
pnpm audit:variations
python3 scripts/probe_all_endpoints.py
```

Do not commit `.env` or API keys.

---

## Testing playbook (which screens hit which endpoints)

Walk these paths. **42 routes** is a page that fires each catalog path against the deployed API.

| Screen | What to do | Routes consumed |
| --- | --- | --- |
| **Home** | Open `/` | `/fixtures/today`, `/events`, `/tournaments`; N+1 `/event/{id}` when list scores are series-only |
| **Matches → Live / Today / Upcoming / Results** | Open `/matches` and each tab | `/events` (+ status). Results falls back to `/team/84917477/events/last` when `status=finished` is empty |
| **Match centre** | Open a finished game (sample `67599823`) and every tab | `/event/{id}`, `/pregame-form`, `/team-streaks`, `/weather`, `/lineups`, `/statistics`, `/player-statistics`, `/player/{pid}/statistics`, `/at-bats`, `/top-performers`, `/umpires`, `/h2h`, `/best-players`, `/enrichments`, `/enrichments/{type}` |
| **Search** | Query `Yankees`, `Ohtani`, `MLB`, then `Yankeess` | `/search` (`q` required; 400 without it) |
| **Players** | Directory + Ohtani `71698966` | `/players`, `/player/{id}`, `/player/{id}/events/{direction}` — no season-stats route on baseball |
| **Teams** | Yankees `84917477`, every tab | `/teams`, `/team/{id}`, `/players`, `/events/{direction}`, `/featured-event`, `/near-events`, `/performance`, `/media`, `/enrichments`, `/enrichments/{type}`, `/standings-seasons`, `/unique-tournaments`, `/rankings` |
| **Manager** | Open from a lineup, not the home header | `/manager/{id}` (sample `62643844`) |
| **Competitions** | MLB `53168725`, standings type total / home / away | `/tournaments`, `/unique-tournament/{id}`, `/seasons`, `/events`, `/scheduled-events/{date}`, `/standings/{type}`, `/season/.../round/{round}` |
| **42 routes** | Open `/endpoints` and click each path | All 42 catalog routes against the live API |

### ID dependency chain

Search (`q=Yankees` / `Ohtani` / `MLB`) yields team, player, and tournament IDs. Team `/events/last` yields event IDs. Lineups yield lineup player IDs and manager IDs. Unique-tournament `/seasons` yields season IDs. Event/team enrichments yield enrichment type tokens.

Sample IDs from the last probe: event `67599823` (finished), Yankees `84917477`, Ohtani `71698966`, MLB `53168725`, season `68144200`, manager `62643844`, lineup player `39625815`, canceled `82011329`, not-started `28606880`.

---

## What should be improved in the Baseball API

### Auth

**Today:** `x-apim-key` alone can 403. `X-Live-Key` alone returns 200. Both keys also return 200.

**Needed:** One written contract. Say which header is required so a customer does not have to guess.

### `GET /v1/baseball/events` status filters

**Today:** `status=finished`, `inprogress`, `canceled`, and `postponed` return `total=0`. `status=notstarted` returns a small feed. `status=ended` is 400.

Yankees `/team/{id}/events/last` has **2000+ finished games** in the same run.

**Needed:** A working Results and Live feed. The Matches → Results tab cannot stay empty while completed games exist on team pages. The product currently falls back to Yankees history and records `EVENT_FINISHED_FILTER_INCOMPLETE`.

### `GET /v1/baseball/fixtures/today` and list `/events` vs `/event/{id}`

**Today:**

- List `items[]` use a **string** `status` and thin scores (`series` only).
- Detail uses a **status object** and `inningsBaseball` (runs / hits / errors).
- Some routes list `events[]` instead of `items[]`.

A home screen therefore N+1s into `/event/{id}` to print a real scoreboard.

**Needed on every list row:**

- `homeScore` / `awayScore` with `inningsBaseball` (R/H/E), not only series
- the same status object as match detail
- one list key (`items` or `events`, not both)
- tournament id **and** name

### Pagination

**Today:** `page > totalPages` returns **HTTP 200 + empty list** while `total` stays high (page 9999 / page 2000 on `players`, team events, at-bats). Page 2000 is **real data** when `totalPages` is larger (MLB `/unique-tournament/{id}/events` had ~2927 pages). `limit=2000` is **400**.

**Needed:** Either 400 for out-of-range pages, or set `total`/`hasMore` so clients can stop. Do not imply there are still rows.

### Optional enrichments as 404

**Today:** `/event/{id}/best-players` and `/team/{id}/rankings` 404 on valid Yankees / finished MLB games (`Enrichment was not found`). `/top-performers` returns batters and pitchers.

**Needed:** 200 with an empty body for optional extras. A 404 looks like the match or team does not exist. Prefer `/top-performers` as the baseball MOTM route.

### `GET /v1/baseball/event/{id}/h2h`

**Today:** HTTP 200 with null `teamDuel` / `managerDuel` on a finished sample game.

**Needed:** Prior meetings with event IDs, or a documented empty object.

### `GET /v1/baseball/unique-tournament/{id}/season/{sid}/standings/{type}`

**Today:** `/standings/total` has rows. `/standings/home` and `/standings/away` return empty `rows`.

**Needed:** Split tables that match total, or drop home/away from the catalog.

### Lineups

**Today:** Baseball roster is ~16, not a football starting XI. Manager id is on the lineup side, not always on the home team object.

**Needed:** Player IDs, batting order, positions, shirt numbers, manager id. Do not document “starting XI = 11”.

### `GET /v1/baseball/event/{id}/at-bats`

**Today:** Paginated play-by-play on finished games. Empty 200 on canceled and not-started games. Other match routes may still 200 for a canceled game.

**Needed:** Document empty-vs-unsupported. Keep at-bats off the first paint if the game has not started.

### Player season statistics — **missing from the 42-route catalog**

The published baseball catalog does not list season stats. The football-style path **already returns 200** for Ohtani:

`GET /v1/baseball/player/71698966/unique-tournament/53168725/season/68144200/statistics` (battingAvg, HRs, at-bats, …).

The player page still cannot show season averages until this route is catalogued and wired.

**Needed:** Add it to the baseball catalog (or document it as supported).

### `GET /v1/baseball/search`

**Today:** `q` is required (400 without it). Typed hits work for Yankees / Ohtani / MLB.

**Needed:** Keep `q` required. Include type, id, and name on every hit so Search can deep-link.

---

## Endpoints that would remove the most product pain

1. Working `/events?status=finished` and `inprogress`
2. R/H/E (not only series) on `/fixtures/today` and `/events` list rows
3. One status object + one list key across list and detail
4. Honest pagination (`page > totalPages` should not look like a full feed)
5. 200-empty instead of 404 for `best-players` and team `rankings`
6. Populated `/h2h` or a documented empty duel
7. Home/away standings rows, or remove those types
8. One published auth header rule

---

## Related docs

| Document | Role |
| --- | --- |
| [baseball_api_testing_report.md](./baseball_api_testing_report.md) | 42-route live test matrix |
| [baseball_api_variation_testing.md](./baseball_api_variation_testing.md) | Multi-entity, status filters, page 2000 |
| [baseball_api_endpoint_catalog.md](./baseball_api_endpoint_catalog.md) | Reference shapes and ID dependencies |
| [baseball_api_reports.md](./baseball_api_reports.md) | Combined in-product coverage + gap recommendations |
