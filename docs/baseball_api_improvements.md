# Baseball API — improvements found in the product

This is the API-team list from running the Baseball Product locally against the **deployed** SportsAPI365 baseball API (`/v1/baseball/`*).

- **Product:** React app at `http://127.0.0.1:5175` (no local backend; Vite proxies `/msdata`)
- **Checked:** 21 Oct 2026
- **Sample IDs:** event `67599823` (Yankees–Rays, finished), Yankees `84917477`, Ohtani `71698966`, MLB `53168725`, season `68144200`

The UI can ship a directory, search, match centre, team, player, and competition pages. Several **normal baseball screens stay empty or wrong** because of the API, not because of missing UI.

Supporting matrices: [testing report](./baseball_api_testing_report.md), [variation tests](./baseball_api_variation_testing.md), [product review](./Baseball_Product_Review.md).

---

## What the product cannot do today

| Screen | What the user sees | API cause |
| --- | --- | --- |
| Home → **Live** | “No matches.” | `/events?status=inprogress` returns `total=0` |
| Matches → **Results** | Empty feed, then a Yankees-only fallback | `/events?status=finished` returns `total=0` while Yankees `/events/last` has **2123** games |
| Home / Matches → **Today** | Cards say “Competition” and **series 4 vs series 2**, not R/H/E | List rows use string `status`, `competitionName` only (no tournament object), `homeScore: { series }` |
| Matches → **Results** fallback | Canceled games labelled Upcoming, mixed with real finals | `/events?status=finished` is empty, so the app uses team `events/last` (canceled + finished mixed; score shape inconsistent) |
| Match → **h2h** | Blank panel | `/event/{id}/h2h` is 200 with `teamDuel: null`, `managerDuel: null` |
| Match → **best-players** | Looks like the match is missing | 404 `Enrichment "best_players" … was not found` on a valid finished game. `/top-performers` on the same event is 200 |
| Team → **rankings** | Same 404 pattern | `/team/{id}/rankings` 404 on Yankees |
| Competition → **standings home/away** | Empty tables | `/standings/total` has **90** rows; `/home` and `/away` have `rows: []` |
| Player page | No season batting/pitching line | Catalog of 42 routes omits season statistics (the route itself **does** work — see below) |

---

## Priority list for the API

### 1. Make `/events` status filters match reality

**Observed (this run):**

| `status` | HTTP | `total` |
| --- | ---: | ---: |
| *(none)* / `notstarted` | 200 | 18 |
| `finished` | 200 | **0** |
| `inprogress` | 200 | **0** |
| `canceled` | 200 | **0** |
| `postponed` | 200 | **0** |
| `ended` | **400** | — |

Allowed values in the 400 message: `notstarted, inprogress, halftime, pause, finished, postponed, canceled, awarded, interrupted, coverage_lost`.

`GET /team/84917477/events/last` returns **total=2123** in the same hour.

**Needed:** `status=finished` and `status=inprogress` must list the same games that appear on team/player event feeds. Until they do, no customer can build Live or Results without a team-specific workaround.

### 2. Put a real scoreboard on list rows

`GET /fixtures/today` and `GET /events` return the **same 18 upcoming games** in this run. Each row looks like:

- `status`: string `"notstarted"` (detail uses `{ code, type, description }`)
- `homeScore` / `awayScore`: `{ "series": N }` only
- `tournamentId` + `competitionName`, no `tournament` object
- list key: `items[]`

`GET /event/{id}` for a finished game has `status` object, `inningsBaseball: { run, hits, errors }`, and a named tournament.

Team `/events/last` uses list key `events[]` (not `items`), a status **object**, and still often only `{ series }` on canceled rows — finished rows on that feed can include inning splits.

**Needed on every list event:**

- same status object as detail
- `inningsBaseball` (R/H/E), not only series
- tournament **id and name**
- one list key (`items` **or** `events`)

Home currently has to guess the competition title and cannot show a baseball score without N+1 `/event/{id}` calls.

### 3. Optional extras should be 200-empty, not 404

| Route | This run | Product impact |
| --- | --- | --- |
| `/event/67599823/best-players` | **404** `ENRICHMENT_NOT_FOUND` | Match tab looks broken |
| `/event/67599823/top-performers` | **200**, 3 rows (batter/pitcher ratings) | This is the usable MOTM route |
| `/team/84917477/rankings` | **404** | Team tab looks like a missing team |

**Needed:** 200 + empty payload when the enrichment is not recorded. Keep `/top-performers` as the baseball “best players” route, or make `best-players` an alias.

### 4. Populate or document `/event/{id}/h2h`

Finished Yankees–Rays `67599823` returns HTTP 200:

```json
{ "teamDuel": null, "managerDuel": null }
```

**Needed:** prior meetings with event IDs, or an explicit empty contract so clients do not treat this as a failed request.

### 5. Home/away standings

MLB 2026 (`53168725` / `68144200`):

- `/standings/total` → 1 table, **90 rows**
- `/standings/home` → 1 table, **0 rows**
- `/standings/away` → 1 table, **0 rows**

**Needed:** fill home/away, or remove those types from the baseball catalog.

### 6. Honest pagination

`GET /players?page=9999` → HTTP **200**, `items: []`, `total: 9758`, `totalPages: 1952`, `hasMore: false`.

Same pattern on team events and at-bats when `page > totalPages`. `limit=2000` is **400** (validation). Page 2000 **is** real data on MLB `/unique-tournament/{id}/events` because `totalPages ≈ 2927`.

**Needed:** 400 for out-of-range pages, **or** keep 200 but do not leave `total` looking like the page still has a full feed. Clients should be able to stop without guessing.

### 7. One auth rule

Live check on `/events?limit=1`:

| Headers | HTTP |
| --- | ---: |
| `x-apim-key` + `X-Live-Key` | 200 |
| `X-Live-Key` only | 200 |
| `x-apim-key` only | **403** |
| none | 403 |

**Needed:** document that `X-Live-Key` is required (and whether APIM is required in front of the gateway). Customers should not have to discover this by trial.

### 8. Add season player statistics to the published baseball catalog

The 42-route catalog has no season-stats path. The football-style URL **already works** for Ohtani:

`GET /v1/baseball/player/71698966/unique-tournament/53168725/season/68144200/statistics` → **200** with `battingAvg`, `battingHomeRuns`, `battingAtBats`, appearances, etc.

The player screen cannot show season averages until this route is in the baseball catalog (and the product wired to it).

### 9. Lineups are baseball rosters, not a starting XI

Finished game lineups: **16** players per side, with `battingOrder`, `position`, `shirtNumber`, `startingPitcher`. Home `manager` was **null**; away had manager `62643844` (Kevin Cash).

**Needed:** manager id on both sides; document roster size; do not copy football “XI = 11”.

### 10. Small contract cleanups

- `GET /search` without `q` is **400** with `message` as an **array** of strings. Return one string (or keep `q` required and say so). Hits for `Yankees` / `Ohtani` already include `type`, `id`, `name`.
- `/fixtures/today` and `/events` were identical in this run (same 18 IDs). If today is meant to be “games with a first pitch today”, say so; if `/events` is a live+upcoming feed, it should not ignore finished/in-progress games.
- Canceled games still 200 on lineups/statistics/top-performers; at-bats is empty 200. Document empty vs unsupported by match state.
- Validation `message` is sometimes a string, sometimes an array, sometimes `{ code, message }`. One error shape would stop UIs from printing `[object Object]`.

---

## What already works (do not “fix” these)

These are good enough to build on:

- Search (`q=Yankees` / `Ohtani` / `MLB`) with type + id
- Event detail with R/H/E (`inningsBaseball`)
- At-bats play-by-play on finished games (`total=70` on `67599823`)
- Lineups, player-statistics, umpires, weather, enrichments
- `/top-performers` (batter + pitcher)
- Team profile, roster, media, featured-event, near-events, unique-tournaments
- Player profile + `/events/last`
- MLB tournament, seasons, **total** standings, scheduled-events
- Manager by id

---

## Suggested API changelog (shortest path)

1. Index `/events?status=finished` and `inprogress` (unblocks Live + Results).
2. Copy detail score + status onto `/events` and `/fixtures/today` rows (unblocks Home cards).
3. 200-empty for `best-players` and team `rankings`; keep `/top-performers`.
4. Fill or drop h2h and home/away standings.
5. Publish player season statistics on the baseball catalog.
6. Write the auth header rule and one error-object shape.

None of these require a new sport. They make the existing 42 routes usable in a normal baseball app.
