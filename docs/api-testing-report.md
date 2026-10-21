# Baseball Product — API testing and product validation report

**Scope:** small-scale functional and manual validation of the Baseball Product against the deployed SportsAPI365 baseball API. This is **not** production certification, load testing, or a security assessment.

**Statuses used:** `PASS` / `FAIL` / `BLOCKED` / `NOT TESTED` / `NEEDS INVESTIGATION`. A case is marked executed only when repo evidence or a read-only GET from this review exists. Documented claims that were not independently observed are labeled as documented.

---

## A. Document overview

| Field | Value |
| --- | --- |
| Product | Baseball Product (`/Users/apple/Desktop/Baseball_Product`) |
| App | React UI `apps/web` (Vite, port **5175**). No local baseball backend. |
| API | `GET https://sports-api.sportsdata365.com/msdata/v1/baseball/*` |
| Catalog | **42** routes in `apps/web/src/catalog.ts` and `data/baseball-routes.json` (`count`: 42) |
| Client | `apps/web/src/msdata.ts` — browser calls same-origin `/msdata`; Vite proxy and Vercel handlers attach keys server-side |
| Config names (values not recorded) | `MSDATA_BASE_URL`, `MSDATA_API_KEY`, `MSDATA_LIVE_KEY` (optional `WEB_PORT`) |
| This report | `docs/api-testing-report.md` (new). Does **not** replace existing reports listed in `docs/README.md`. |
| Review date | 21 Oct 2026 |
| Nature | Evidence synthesis + a small set of **additional read-only GETs** (section O). No POST/PUT/DELETE. No load/stress. No app functionality changes. |

### Evidence generations used

| Artifact | Generated | Role |
| --- | --- | --- |
| `data/baseball-endpoint-evidence.json` | 2026-10-21T12:31:40.219870+00:00 | Live probe of all 42 catalog routes + 11 extra probes |
| `docs/baseball_api_testing_report.md` | same timestamp | Generated matrix from that JSON |
| `data/baseball-variation-tests.json` | 2026-10-21T12:33:50.939014+00:00 | 51 variation/pagination/status tests |
| `docs/baseball_api_variation_testing.md` | same timestamp | Variation write-up |
| `data/full-catalog-test.json` | lab sweep; `rowCount` 71, `catalogCovered` 42 | Broader catalog + error/paging rows |
| `data/calls.json` | 196 recorded calls, timestamps 12:57–13:01Z | In-product / lab HTTP log |
| `data/findings.json` / `data/gaps.json` | same lab window | Structured findings |
| `docs/Baseball_Product_Review.md`, `docs/baseball_api_improvements.md` | Checked 21 Oct 2026 | Playbook + API-team list; UI walk notes |
| Additional read-only GETs (this review) | 21 Oct 2026, after the files above | Re-check of listed observations (section O) |

**Sample IDs (verified in evidence `discoveredIds` and this review’s GETs):** event `67599823`, Yankees `84917477`, Ohtani `71698966`, MLB `53168725`, season `68144200`, manager `62643844`. Probe also recorded lineup player `39625815`, enrichment type `h2h_events`, team enrichment `events_last`. Variation tests added canceled `82011329` and not-started `28606880`.

---

## B. Executive summary

The catalog of **42** baseball routes was executed. **40** returned HTTP 200 on the sample entities; **2** catalog routes returned **404** on valid Yankees / finished-game IDs (`best-players`, team `rankings`). No 5xx appeared in `calls.json` (196 calls: 181×200, 8×400, 7×404).

The product can ship **directory, search, match-centre extras, team profile, player profile, and MLB total standings**. It cannot ship a trustworthy **Live** or **Results** feed from `GET /events` alone: `status=finished` and `status=inprogress` both returned **`total=0`** while `GET /team/84917477/events/last` returned **`total=2123`** in the same window (re-confirmed this review). Matches → Results therefore falls back to Yankees `events/last` (code + `calls.json`).

List rows on `/events` and `/fixtures/today` use a **string** `status` and **`{ series }`** scores. Event **detail** for `67599823` uses a **status object** `{ code: 100, type: "finished", description: "Ended" }` and **`inningsBaseball` { run, hits, errors }** (Yankees 3 / 7 / 0 vs Rays 4 / 7 / 1). In this review, `/fixtures/today` and `/events` (`limit=20`) returned the **same 18 IDs** and the same 5290-byte bodies.

Other confirmed gaps: `/h2h` is 200 with `teamDuel`/`managerDuel` null; standings `home`/`away` are 200 with empty `rows` (total has **90**); `page > totalPages` is 200 with an empty list while `total` stays high; `X-Live-Key` alone is 200 and `x-apim-key` alone is 403; football-style **player season statistics** returns 200 for Ohtani but is **not in the 42-route catalog** and is not called by `Player.tsx`.

This report does **not** assign numeric experience scores. Existing `docs/baseball_api_reports.md` contains lab scores; they are out of scope here.

---

## C. Product overview + workflow-to-endpoint table

**What the product is (from repo, not assumed):** a React lab at `http://127.0.0.1:5175` that calls deployed `/v1/baseball/*` through a same-origin `/msdata` proxy (`apps/web/vite.config.ts` locally; `apps/web/api/msdata/[...path].ts` and `apps/web/middleware.ts` on Vercel). Keys stay in server env. Footer copy: “SportsAPI365 baseball · no local API”.

**Routes in the chrome** (`apps/web/src/components/Layout.tsx`): Home `/`, Matches `/matches`, Competitions `/competitions`, Teams `/teams`, Players `/players`, Search `/search`, “42 routes” `/endpoints`. Additional routes exist but are not in the header: `/match/:id`, `/player/:id`, `/team/:id`, `/manager/:id`, `/competition/:id` (`App.tsx`).

**Documented vs observed:** screens and tabs below are from **source**. What the user saw on 21 Oct 2026 is taken from `data/calls.json`, `data/findings.json`, and `docs/baseball_api_improvements.md` where those files name the screen. No screenshots were created for this report.

| Feature / screen | Endpoints (from source) | Expected (product intent in source/docs) | Observed | Finding |
| --- | --- | --- | --- | --- |
| Home `/` | `fixtures/today`, `events`, `tournaments` (`Home.tsx`) | Sections Live / Today / Upcoming / Completed + competition cards | **Code:** Live = events filtered to status label Live; Today = fixtures list; Upcoming/Completed = subsets of today. **API:** `/events` and `/fixtures/today` are the same 18 `notstarted` rows (this review). `status=inprogress` total=0 → Live empty. List scores are `series` only. **Lab 12:58Z:** `calls.json` Home “Live match card” also issued N+1 `GET /event/{id}` with `fallbackUsed: true` (8 extraCalls in findings). **Current `Home.tsx` does not N+1.** | Live empty; Today cards cannot show R/H/E from the list payload. Distinguish current source vs earlier lab N+1. |
| Matches → Live | `GET /events?status=inprogress` | Live games | 200, `total=0` (evidence extra probe + variation + this review) | Results/Live blocker. `FAIL` |
| Matches → Today | `GET /fixtures/today` | Today’s schedule | 200, `total=18`, same IDs as `/events` (this review) | Identical to default `/events` in this run. `NEEDS INVESTIGATION` (semantics) |
| Matches → Upcoming | `GET /events?status=notstarted` | Upcoming | 200, `total=18` (variation + this review) | Works for the current thin feed. `PASS` |
| Matches → Results | `GET /events?status=finished`; if empty, `GET /team/84917477/events/last` (`Matches.tsx` + `SAMPLE.teamId`) | Completed games | finished `total=0`; fallback 200, Yankees `total=2123` (`calls.json` 12:58:42–43Z; note in UI) | Fallback is Yankees-only and mixes canceled (`82011329` first row this review, status object type `canceled`). `FAIL` |
| Match centre `/match/:id` | `GET /event/{id}` plus tabs: at-bats, lineups, statistics, player-statistics, top-performers, umpires, h2h, best-players, pregame-form, team-streaks, weather, enrichments (`Match.tsx`) | Full game | Sample `67599823`: detail 200 with R/H/E; best-players **404**; h2h **200 null duels**; other extras 200. Lab recorded Match Centre calls for header / streaks / weather / pregame / at-bats / top-performers / umpires — not every tab. | Centre usable except h2h empty and best-players 404. |
| Search `/search` | `GET /search?q=` (`Search.tsx`) | Typed hits → player/team/competition | `q=Yankees` → 1 team hit id `84917477`. Catalog audit: Ohtani 200 (249 B), MLB 200 (444 B). Missing `q` → 400, `message` is an **array**. Playbook typo `Yankeess`: **no JSON evidence**. | Required `q` works. Typo case `NOT TESTED`. |
| Players directory | `GET /players?page&limit=20` | Paginated directory | Probe: total **9758**, totalPages **1952**. UI pages on `hasMore`. | `PASS` |
| Player `/player/:id` | `player/{id}`, `events/last`, `events/next` | Profile + recent/upcoming | Ohtani 200; `team: null`; last total **1253**; next **total=0**. Season stats route not called. UI lab: overview only. | Profile works; no season line; upcoming empty. |
| Teams directory | `GET /teams` | Directory | Probe total **255**, totalPages **51**. | `PASS` |
| Team `/team/:id` | profile, players, events last/next, featured-event, near-events, performance, rankings, unique-tournaments, standings-seasons, media, enrichments | Team hub | Yankees 200; roster `players` n=48; rankings **404**; events/next total=0; featured-event is finished `67599823` (findings). UI lab hit overview/featured/near/performance only. | Rankings 404 looks like a missing team. |
| Manager `/manager/:id` | `GET /manager/{id}` | Profile | 200 `{ id: 62643844, name: "Kevin Cash", imageUrl }` (image host path only). Not in header; “open from a lineup” (playbook). No `calls.json` row with `screen: Manager`. | API `PASS`; UI walk for this screen `NOT TESTED` in `calls.json`. |
| Competitions `/competitions` | `GET /tournaments` | Directory | Probe total **84**. | `PASS` |
| Competition `/competition/:id` | unique-tournament, seasons, events, scheduled-events/{date}, standings/{type} total\|home\|away, round/{round} | MLB hub | MLB 200 name `MLB`; seasons total 24; events total **29267**; scheduled 2026-10-21 total **1**; standings total **90** rows; home/away **0** rows. UI lab: overview, seasons, events. | Home/away tables empty. |
| 42 routes `/endpoints` | Every `CATALOG` path (`EndpointLab.tsx`) with sample IDs | Click-to-GET lab | Source fires GETs; sample IDs match probe. No dedicated `calls.json` screen name for this page; catalog sweep covers the same paths. | Lab page exists; sweep `PASS` as API coverage. |

---

## D. API inventory (42 catalog routes + extra observed)

Base path: `https://sports-api.sportsdata365.com/msdata` + `/v1/baseball/...`. Auth headers used by probes and the Vite proxy: `x-apim-key` (from `MSDATA_API_KEY`) and `X-Live-Key` (from `MSDATA_LIVE_KEY`).

IDs in the 12:31Z probe: event `67599823`, team `84917477`, player `71698966` (event player-stats used lineup `39625815`), manager `62643844`, tournament `53168725`, season `68144200`, date `2026-10-21`, enrichments `h2h_events` / `events_last`.

### D1. Catalog (42)

| # | Route | Called path (probe) | HTTP | Kind / list key | Count / pagination | Inventory note |
| ---: | --- | --- | ---: | --- | --- | --- |
| 1 | `/event/{eventId}` | `event/67599823` | 200 | match `event` | — | Detail. Re-GET: status object; `inningsBaseball`. |
| 2 | `/event/{eventId}/at-bats` | `.../at-bats?page=1&limit=5` | 200 | `atBats` | n=5, total=70, pages=14 | Empty 200 on canceled/not-started (variation). |
| 3 | `/event/{eventId}/best-players` | `.../best-players` | **404** | error envelope | — | `ENRICHMENT_NOT_FOUND` on finished sample. |
| 4 | `/event/{eventId}/enrichments` | `.../enrichments` | 200 | `types` | n=5 | h2h_events, highlights, series, team_streaks, votes. |
| 5 | `/event/{eventId}/enrichments/{type}` | `.../enrichments/h2h_events` | 200 | `events` | n=10, total=219 | |
| 6 | `/event/{eventId}/h2h` | `.../h2h` | 200 | `teamDuel`, `managerDuel` | both **null**, 36 B | |
| 7 | `/event/{eventId}/lineups` | `.../lineups` | 200 | `home`, `away` | home `dressedPlayers` 16; `manager` null | |
| 8 | `/event/{eventId}/player-statistics` | `.../player-statistics?page=1&limit=5` | 200 | `playerStatistics` | n=5, total=32, pages=7 | |
| 9 | `/event/{eventId}/player/{playerId}/statistics` | `event/67599823/player/39625815/statistics` | 200 | player object | — | Match-level, not season. |
| 10 | `/event/{eventId}/pregame-form` | `.../pregame-form` | 200 | `homeTeam`, `awayTeam` | form arrays + eventIds | |
| 11 | `/event/{eventId}/statistics` | `.../statistics` | 200 | `statistics` | n=1 period ALL | Fielding + batting groups. |
| 12 | `/event/{eventId}/team-streaks` | `.../team-streaks` | 200 | six keys, all `[]` | 111 B | Probe `PASS_PARTIAL`. Not-started sample 404 in lab. |
| 13 | `/event/{eventId}/top-performers` | `.../top-performers` | 200 | `topPerformers` | n=3, roles batter | |
| 14 | `/event/{eventId}/umpires` | `.../umpires` | 200 | `umpires` | n=6 | HP/1B/2B/3B/LF/RF. |
| 15 | `/event/{eventId}/weather` | `.../weather` | 200 | `conditions` | n=2 | |
| 16 | `/events` | `events?page=1&limit=5` | 200 | `items` | n=5, **total=18**, pages=4 | List shape ≠ detail. |
| 17 | `/fixtures/today` | `fixtures/today?page=1&limit=5` | 200 | `items` | n=5, **total=18**, pages=4 | Same 18 IDs as `/events` this review (`limit=20`). |
| 18 | `/manager/{managerId}` | `manager/62643844` | 200 | `manager` | id, name, imageUrl | |
| 19 | `/player/{playerId}` | `player/71698966` | 200 | `player` | `team: null` | |
| 20 | `/player/{playerId}/events/{direction}` | `player/71698966/events/last` | 200 | `events` | n=5, total=1253, pages=251 | `next` extra: total=0. |
| 21 | `/players` | `players?page=1&limit=5` | 200 | `items` | n=5, total=9758, pages=1952 | |
| 22 | `/search` | `search?q=Yankees` | 200 | `items` | n=1, total=1 | type/id/name. |
| 23 | `/team/{teamId}` | `team/84917477` | 200 | `team` | `country: null`; logoUrl present | |
| 24 | `/team/{teamId}/enrichments` | `.../enrichments` | 200 | `types` | n=8 | |
| 25 | `/team/{teamId}/enrichments/{type}` | `.../enrichments/events_last` | 200 | `events` | n=10, total=30, pages=3 | |
| 26 | `/team/{teamId}/events/{direction}` | `team/84917477/events/last` | 200 | `events` | n=5, **total=2123**, pages=425 | `next` extra: total=0. |
| 27 | `/team/{teamId}/featured-event` | `.../featured-event` | 200 | match `event` | finished `67599823` (findings) | Not “currently live”. |
| 28 | `/team/{teamId}/media` | `.../media?page=1&limit=5` | 200 | `media` | n=5, total=10, pages=2 | |
| 29 | `/team/{teamId}/near-events` | `.../near-events` | 200 | `previousEvent`, `nextEvent` | — | |
| 30 | `/team/{teamId}/performance` | `.../performance?page=1&limit=5` | 200 | `events` (+ form, points) | n=5, total=20, pages=4 | |
| 31 | `/team/{teamId}/players` | `.../players` | 200 | `players` | n=48 | Nested `player` objects. |
| 32 | `/team/{teamId}/rankings` | `.../rankings` | **404** | error envelope | — | `ENRICHMENT_NOT_FOUND`. |
| 33 | `/team/{teamId}/standings-seasons` | `.../standings-seasons` | 200 | `uniqueTournamentSeasons` | n=2, total=4, pages=1 | |
| 34 | `/team/{teamId}/unique-tournaments` | `.../unique-tournaments` | 200 | `uniqueTournaments` | n=3, total=3 | |
| 35 | `/teams` | `teams?page=1&limit=5` | 200 | `items` | n=5, total=255, pages=51 | |
| 36 | `/tournaments` | `tournaments?page=1&limit=5` | 200 | `items` | n=5, total=84, pages=17 | |
| 37 | `/unique-tournament/{tournamentId}` | `unique-tournament/53168725` | 200 | `uniqueTournament` | name MLB | full-catalog: `currentSeasonId` missing on object; seasons envelope has it. |
| 38 | `/unique-tournament/{tournamentId}/events` | `.../events` | 200 | `events` | n=10, **total=29267**, pages=2927 | Page 2000 is real data (variation). |
| 39 | `/unique-tournament/{tournamentId}/scheduled-events/{date}` | `.../scheduled-events/2026-10-21` | 200 | `events` | n=1, total=1 | |
| 40 | `/unique-tournament/{tournamentId}/season/{seasonId}/round/{round}` | `.../round/1` | 200 | `events` | n=10, total=2458, pages=246 | |
| 41 | `/unique-tournament/{tournamentId}/season/{seasonId}/standings/{type}` | `.../standings/total` | 200 | `standings` | 1 table, **90** rows | home/away extra: 0 rows. |
| 42 | `/unique-tournament/{tournamentId}/seasons` | `.../seasons?page=1&limit=5` | 200 | `seasons` | n=5, total=24, pages=5 | `currentSeasonId` on envelope. |

### D2. Extra observed routes / calls labeled **not-in-catalog**

These are **not** in `CATALOG` / `baseball-routes.json`. They were still observed.

| Path | HTTP | Source | Label |
| --- | ---: | --- | --- |
| `/v1/baseball/player/71698966/unique-tournament/53168725/season/68144200/statistics` | **200** | Additional GET this review (also documented 21 Oct in `baseball_api_improvements.md`) | **not-in-catalog**. Keys include `player`, `team`, `statistics`, `playerId`, `teamId`, `uniqueTournamentId`, `seasonId`. Nested: `battingAvg` 0.275, `battingHomeRuns` 30, `battingAtBats` 523, `appearances` 135, `battingHits` 144. |
| `/player/{id}/events/sideways` | 400 | `full-catalog-test.json` / `calls.json` | Invalid `direction` on a catalog template, not a new route. |
| `/unique-tournament/.../standings/form` | 400 | same | Invalid standings `type`. |
| `/unique-tournament/.../scheduled-events/not-a-date` | 400 | same | Invalid date. |
| `/event/abc`, `/event/999999999`, `/player/999999999`, `/team/999999999` | 400 / 404 | catalog extras | Invalid/unknown IDs on catalog templates. |

`docs/baseball_api_endpoint_catalog.md` notes basketball-only `incidents`, `injuries`, and season-statistics paths as **absent from the baseball catalog**. Season statistics is nonetheless **reachable** (row above). Incidents/injuries were **not** called in this review (`NOT TESTED`).

---

## E. Response schema and data quality

**Documented (catalog/improvements) vs observed (JSON + this review’s GETs).** Truncated `bodyPreview` strings in evidence are not treated as full payloads; this review’s event-detail GET is used for score/status fields that the 1200-character preview cut off.

### E1. Event list vs event detail (confirmed)

`GET /events` and `GET /fixtures/today` row 0 (id `28606880`, this review):

```json
{
  "id": 28606880,
  "status": "notstarted",
  "homeScore": { "series": 4 },
  "awayScore": { "series": 2 },
  "tournamentId": 53168725,
  "competitionName": "MLB Postseason",
  "seasonId": 68144200
}
```

Row keys: `id, tournamentId, homeTeam, awayTeam, startTimestamp, status, homeScore, awayScore, seasonId, competitionName`. No `tournament` object. `status` is a **string**. `startTimestamp` is unix seconds (probe row and findings).

`GET /event/67599823` (this review, 4959 B, same size as 12:31Z probe):

- Teams: New York Yankees vs Tampa Bay Rays; venue `Yankee Stadium`.
- `status`: `{ "code": 100, "type": "finished", "description": "Ended" }`; `statusType`: `"finished"`.
- `homeScore` keys include `series, current, display, innings, period1–period9, normaltime, inningsBaseball`.
- `homeScore.inningsBaseball`: `{ "run": 3, "hits": 7, "errors": 0 }`; away `{ "run": 4, "hits": 7, "errors": 1 }`.
- `tournament.id`: **null**; `tournament.name`: `"MLB Postseason"`; nested `uniqueTournament.id`: **53168725**, name `"MLB"`.
- `startTimestamp`: integer `1791417600`.

`apps/web/src/msdata.ts` `asMatch` reads `uniqueTournament` **or** `tournament` **or** nested uniqueTournament. Because `tournament` exists, `tournament.id` (null) wins — Match → Competition link can fail even though nested MLB id is present. `findings.json` `BROKEN_RELATIONSHIP` on `uniqueTournament.id` matches this client mapping.

Team `events/last` uses list key **`events`** (not `items`) and a **status object**. First row this review: id `82011329`, `{ code: 70, type: "canceled", description: "Canceled" }`, `homeScore` keys `["series"]` only.

### E2. List-key split (observed)

| Family | Array key | Pagination fields |
| --- | --- | --- |
| `/events`, `/fixtures/today`, `/teams`, `/players`, `/tournaments`, `/search` | `items` | `page, limit, total, totalPages, hasMore` |
| team/player/unique-tournament event lists, at-bats, media, etc. | `events` / `atBats` / `media` / … | same pagination fields when present |
| team roster | `players` | no page fields in probe |
| standings | `standings[].rows` | no page fields |

### E3. Other shapes (sanitized)

| Resource | Observed |
| --- | --- |
| Search hit | `{ "type": "team", "id": 84917477, "name": "New York Yankees", "countryAlpha2": null, "gender": "M" }` |
| H2H | `{ "teamDuel": null, "managerDuel": null }` |
| Team streaks (finished sample) | all six buckets `[]` |
| Top performers | 3× `role: "batter"` with battingHits / battingAtBats / battingHomeRuns / battingRbi |
| Umpires | assignment HP, 1B, 2B, 3B, LF, RF |
| Weather | temperature, humidity, windSpeed, isForecast true/false |
| Pregame form | `form: ["L","L","W","W","W"]` home; eventIds listed; `source: "derived"` |
| Lineups home | `confirmed: true`, `startersListed: 11`, `dressedPlayers: 16`, `manager: null`, `formation: null`; player rows have `battingOrder`, `appearanceRoles`, `startingPitcher` |
| Player Ohtani | position `DH`, jersey `17`, height 193, `team: null` |
| Team Yankees | `country: null`, `manager: null`, `logoUrl` present (path only) |
| Standings total row keys | team, position, matches, wins, draws, losses, scoresFor/Against, gamesBehind, winPercentage, group, … |
| Error envelope | `statusCode, message, error, path, timestamp, requestId` (+ `details` on 404) |
| Validation `message` | sometimes **string**, sometimes **array of strings** (search missing `q`; `status=ended`) |

### E4. Quality issues tied to evidence

- Finished Yankees–Rays has a full baseball box on **detail**, not on **list**.
- Ohtani `team` is null on the player object (findings `PREFERRED_FIELD_MISSING`).
- Yankees team `country` is null on `/team/{id}` while the same club nested on event detail has `country: { name: "USA", alpha2: "US" }`.
- Shirt numbers on the lineup preview rows shown are null.
- `calls.json` timestamps are unix-ms ISO; API `startTimestamp` is unix **seconds** (findings `SCHEMA_INCONSISTENCY`).

---

## F. Manual API test strategy

**Goal:** confirm the 42 catalog routes respond, that product screens can consume them, and that known gaps still reproduce. Not a performance SLA, not a soak test, not auth-bypass research beyond the four-header matrix already documented.

**In scope**

- GET (and code-level HEAD allowance on the proxy) against `/v1/baseball/*`.
- Happy path on sample IDs from search → team events → lineups → seasons.
- Status filters, pagination edges already in `probe_variations.py`, validation 400/404.
- Product workflows on the pages in `App.tsx`.

**Out of scope**

- Load/stress, fuzzing, destructive writes (proxy returns **405** for non-GET/HEAD — **code**, not executed here).
- Sports other than baseball (middleware 400 if path is not `/v1/baseball`).
- Certifying production SLOs or completeness of global baseball coverage.

**How tests were executed (existing)**

1. `scripts/probe_all_endpoints.py` discovers IDs via search (Yankees / Ohtani / MLB), team `events/last`, lineups, seasons, enrichments; calls each of 42 templates; writes `data/baseball-endpoint-evidence.json`.
2. Same script’s `extraProbes` (11): finished/inprogress, page 9999, page 2, search missing q, event abc / 999999999, standings home/away, player/team `events/next`.
3. `scripts/probe_variations.py` — 51 tests (states, second team/player, page 2000, limits, status tokens, enrichment types).
4. Full-catalog lab → `data/full-catalog-test.json` (71 rows) and `data/calls.json` (196 calls).
5. This review: additional **read-only GETs** listed in section O (auth matrix, identity of fixtures vs events, filters, detail R/H/E, h2h/best-players/top-performers/rankings, standings, players page 9999, search without q, not-in-catalog season stats).

**Environments:** probes hit `MSDATA_BASE_URL` directly with both key headers. The UI hits `http://127.0.0.1:5175/msdata/...` (Vite injects the same header names). Additional GETs used curl + both headers except the auth matrix.

**ID chain (documented and used):** search `q=Yankees` → team `84917477` → `events/last` finished row → event `67599823`; search Ohtani → `71698966`; search MLB → `53168725`; seasons → `68144200`; lineups → manager `62643844`, player `39625815`.

---

## G. Detailed manual test cases

Legend: **Executed** = JSON evidence and/or this review’s GET. **Expected** is the product/catalog expectation, not an SLA.

### G1. Catalog routes (42)

| ID | Endpoint / workflow | Scenario | Preconditions | Steps | Expected | Actual | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC-C-01 | `GET /event/{eventId}` | Finished sample detail | event 67599823 | GET | 200 match with teams, status, scores | 200, 4959 B; Yankees–Rays; status object finished; inningsBaseball 3-4 | PASS | evidence + this GET | Nested uniqueTournament id 53168725; `tournament.id` null |
| TC-C-02 | `GET /event/{id}/at-bats` | Play-by-play | same | GET page=1 limit=5 | paginated at-bats | 200, n=5, total=70, pages=14 | PASS | evidence | Canceled/not-started: empty 200 (variation) |
| TC-C-03 | `GET /event/{id}/best-players` | Optional MOTM | same | GET | usable list or empty 200 | **404** ENRICHMENT_NOT_FOUND | FAIL | evidence + this GET | Catalog includes the route |
| TC-C-04 | `GET /event/{id}/enrichments` | Type index | same | GET | types[] | 200, 5 types | PASS | evidence | |
| TC-C-05 | `GET /event/{id}/enrichments/{type}` | h2h_events | type from index | GET h2h_events | paged events | 200, total=219 | PASS | evidence | Also highlights/series/team_streaks/votes 200 (variation) |
| TC-C-06 | `GET /event/{id}/h2h` | Prior meetings | finished game | GET | duels or documented empty | 200, both duels **null**, 36 B | FAIL | evidence + this GET | HTTP 200 is not an error; product H2H tab is blank |
| TC-C-07 | `GET /event/{id}/lineups` | Roster | same | GET | home/away players | 200; home dressedPlayers 16; manager null | PASS | evidence | Baseball roster, not XI=11 |
| TC-C-08 | `GET /event/{id}/player-statistics` | Box | same | GET | paged stats | 200, total=32 | PASS | evidence | |
| TC-C-09 | `GET /event/{id}/player/{playerId}/statistics` | One player match stats | lineup player 39625815 | GET | 200 stats | 200 | PASS | evidence | Not season stats |
| TC-C-10 | `GET /event/{id}/pregame-form` | Form | same | GET | W/L form | 200, home L,L,W,W,W | PASS | evidence | |
| TC-C-11 | `GET /event/{id}/statistics` | Team comparison | same | GET | groups | 200, period ALL, Fielding+Batting | PASS | evidence | |
| TC-C-12 | `GET /event/{id}/team-streaks` | Streaks | same | GET | streak buckets | 200, all arrays empty, 111 B | NEEDS INVESTIGATION | evidence | Probe PASS_PARTIAL; not-started 404 in calls.json |
| TC-C-13 | `GET /event/{id}/top-performers` | Batters/pitchers | same | GET | list | 200, 3 batters | PASS | evidence + this GET | Usable MOTM stand-in |
| TC-C-14 | `GET /event/{id}/umpires` | Crew | same | GET | umpires | 200, n=6 | PASS | evidence | |
| TC-C-15 | `GET /event/{id}/weather` | Conditions | same | GET | conditions | 200, n=2 | PASS | evidence | |
| TC-C-16 | `GET /events` | Default feed | none | GET page=1 limit=5 | current matches | 200, total=**18**, all notstarted in samples | PASS | evidence | Business completeness vs team history is TC-X-01 |
| TC-C-17 | `GET /fixtures/today` | Today | none | GET | today’s games | 200, total=18; **same IDs as /events** (limit=20 this review) | NEEDS INVESTIGATION | evidence + this GET | Identical feed in this run |
| TC-C-18 | `GET /manager/{managerId}` | Kevin Cash | 62643844 | GET | profile | 200 name Kevin Cash | PASS | evidence | |
| TC-C-19 | `GET /player/{playerId}` | Ohtani | 71698966 | GET | profile | 200, team null | PASS | evidence | Thin preferred fields |
| TC-C-20 | `GET /player/{id}/events/last` | Recent | same | GET | paged events | 200, total=1253 | PASS | evidence | |
| TC-C-21 | `GET /players` | Directory | none | GET | paged players | 200, total=9758 | PASS | evidence | |
| TC-C-22 | `GET /search` | q=Yankees | q required | GET | typed hits | 200, 1 team 84917477 | PASS | evidence + this GET | |
| TC-C-23 | `GET /team/{teamId}` | Yankees | 84917477 | GET | profile | 200, country null | PASS | evidence | |
| TC-C-24 | `GET /team/{id}/enrichments` | Index | same | GET | types | 200, n=8 | PASS | evidence | |
| TC-C-25 | `GET /team/{id}/enrichments/{type}` | events_last | type from index | GET | payload | 200, total=30 | PASS | evidence | |
| TC-C-26 | `GET /team/{id}/events/last` | History | same | GET | paged events | 200, **total=2123**, pages=425 | PASS | evidence + this GET | Contrasts with /events?status=finished |
| TC-C-27 | `GET /team/{id}/featured-event` | Featured | same | GET | one event | 200; findings: 67599823 finished | PASS | evidence + findings | Semantics unclear vs live |
| TC-C-28 | `GET /team/{id}/media` | Media | same | GET | paged media | 200, total=10 | PASS | evidence | |
| TC-C-29 | `GET /team/{id}/near-events` | Prev/next | same | GET | envelope | 200 | PASS | evidence | |
| TC-C-30 | `GET /team/{id}/performance` | Form | same | GET | form+events | 200, total=20 | PASS | evidence | Scope undocumented (findings P3) |
| TC-C-31 | `GET /team/{id}/players` | Roster | same | GET | players[] | 200, n=48 | PASS | evidence | Nested player id/name |
| TC-C-32 | `GET /team/{id}/rankings` | Rankings | same | GET | list or empty 200 | **404** ENRICHMENT_NOT_FOUND | FAIL | evidence + this GET | |
| TC-C-33 | `GET /team/{id}/standings-seasons` | Seasons with tables | same | GET | list | 200, total=4 | PASS | evidence | |
| TC-C-34 | `GET /team/{id}/unique-tournaments` | Team competitions | same | GET | list | 200, total=3 | PASS | evidence | |
| TC-C-35 | `GET /teams` | Directory | none | GET | paged teams | 200, total=255 | PASS | evidence | |
| TC-C-36 | `GET /tournaments` | Directory | none | GET | paged competitions | 200, total=84 | PASS | evidence | |
| TC-C-37 | `GET /unique-tournament/{id}` | MLB | 53168725 | GET | competition | 200 name MLB | PASS | evidence | currentSeasonId missing on object (full-catalog) |
| TC-C-38 | `GET /unique-tournament/{id}/events` | Competition feed | same | GET | paged events | 200, total=29267, pages=2927 | PASS | evidence | |
| TC-C-39 | `GET /unique-tournament/{id}/scheduled-events/{date}` | Calendar 2026-10-21 | date | GET | day’s events | 200, total=1 | PASS | evidence | |
| TC-C-40 | `GET /unique-tournament/{id}/season/{sid}/round/{round}` | Round 1 | season 68144200 | GET | events | 200, total=2458 | PASS | evidence | |
| TC-C-41 | `GET /unique-tournament/{id}/season/{sid}/standings/total` | Table | same | GET | rows | 200, 90 rows, type total | PASS | evidence + this GET | |
| TC-C-42 | `GET /unique-tournament/{id}/seasons` | Season list | same | GET | seasons | 200, total=24 | PASS | evidence | |

### G2. Filters, pagination, errors, auth, extra route

| ID | Endpoint / workflow | Scenario | Preconditions | Steps | Expected | Actual | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC-X-01 | `GET /events?status=finished` | Results filter | finished games exist on team feed | GET limit=5 | non-zero when history exists | 200, items=[], **total=0** | FAIL | evidence extra, variation, this GET | Yankees last total=2123 same window |
| TC-X-02 | `GET /events?status=inprogress` | Live filter | — | GET | live games or honest empty if none live | 200, **total=0** | FAIL | same | Cannot distinguish “no live games” vs broken index |
| TC-X-03 | `GET /events?status=notstarted` | Upcoming filter | — | GET | upcoming | 200, total=18 | PASS | variation + this GET | |
| TC-X-04 | `GET /events?status=canceled` | Canceled filter | canceled id 82011329 exists | GET | canceled games | 200, total=0 | FAIL | variation + this GET | |
| TC-X-05 | `GET /events?status=postponed` | Postponed | — | GET | postponed or empty | 200, total=0 | NEEDS INVESTIGATION | variation + this GET | No independent postponed id in repo |
| TC-X-06 | `GET /events?status=ended` | Invalid token | — | GET | 400 | 400; allowed: notstarted, inprogress, halftime, pause, finished, postponed, canceled, awarded, interrupted, coverage_lost | PASS | variation + this GET | `ended` is not in the enum; detail `description` is “Ended” |
| TC-X-07 | `GET /events` page 1 vs 2 | Paging | total=18 | GET page=1 then 2, limit=5 | different slices | page1 first 28606880, page2 first 56340050 | PASS | evidence extra | |
| TC-X-08 | `GET /events?page=9999` | Beyond totalPages | totalPages=4 | GET | honest empty | 200, items=[], **total still 18**, hasMore=false | FAIL | evidence extra | Empty list is honest; leftover total is not |
| TC-X-09 | `GET /players?page=9999` | Beyond 1952 | — | GET | honest empty | 200, n=0, **total=9758**, totalPages=1952 | FAIL | this GET (same as catalog extra) | |
| TC-X-10 | `GET /players?page=2000` | page 2000 vs totalPages 1952 | — | GET | empty 200 | 200, count=0 | PASS | variation | No fake rows |
| TC-X-11 | `GET /unique-tournament/53168725/events?page=2000` | page 2000 in range | totalPages≈2927 | GET limit=10 | real rows | 200, count=10, total=29267 | PASS | variation | Page 2000 is valid here |
| TC-X-12 | `GET /events?limit=2000` | Oversize limit | — | GET | validation error | **400** | PASS | variation | Same for search limit=2000 |
| TC-X-13 | `GET /events?limit=1` / `limit=100` | Limit honoured | — | GET | n≤limit | limit=1 → n=1; limit=100 → n=18 | PASS | variation | |
| TC-X-14 | `GET /search` missing q | Validation | omit q | GET | 400 | 400, message **array** of 4 strings | PASS | evidence + this GET | |
| TC-X-15 | `GET /event/abc` | Non-numeric id | — | GET | 400 | 400 string message | PASS | evidence | |
| TC-X-16 | `GET /event/999999999` | Unknown id | — | GET | 404 | 404 EVENT_NOT_FOUND | PASS | evidence | Contrast with enrichment 404 |
| TC-X-17 | Standings home/away | Split tables | MLB 2026 season | GET home, away | rows or documented empty | 200, 1 table each, **rows: []** (59 B); total 90 rows | FAIL | evidence extra + this GET | |
| TC-X-18 | Player/team `events/next` | Upcoming | Ohtani, Yankees | GET | upcoming or empty | both 200, total=0 | PASS | evidence extra | Empty may be off-season; not a transport error |
| TC-X-19 | Auth: both headers | `/events?limit=1` | keys in env | GET | 200 | 200, keys items/page/limit/total | PASS | this GET | Values not recorded |
| TC-X-20 | Auth: `X-Live-Key` only | same | — | GET | documented contract unknown | **200** | PASS | this GET | Confirms improvements.md |
| TC-X-21 | Auth: `x-apim-key` only | same | — | GET | unknown | **403** Forbidden JSON | FAIL | this GET | Fail vs “either key works”; contract missing |
| TC-X-22 | Auth: no key | same | — | GET | 401/403 | **403**, body not JSON (5490 B) | PASS | this GET | Non-JSON error vs JSON 403 with APIM only |
| TC-X-23 | Season stats **not-in-catalog** | Ohtani MLB 2026 | player/tour/season ids | GET football-style path | unknown / catalog says absent | **200**, battingAvg 0.275, HR 30, AB 523, appearances 135 | PASS | this GET | Not wired in `Player.tsx` |
| TC-X-24 | Invalid direction `events/sideways` | Enum | Ohtani | GET | 400 | 400 “enum string is expected” | PASS | full-catalog / calls | |
| TC-X-25 | Invalid standings `form` | Enum | MLB season | GET | 400 | 400 | PASS | full-catalog | |
| TC-X-26 | Invalid calendar date | `not-a-date` | MLB | GET | 400 | 400 expected YYYY-MM-DD | PASS | full-catalog | |
| TC-X-27 | Event states: canceled / notstarted | Same sub-routes | ids 82011329, 28606880 | GET detail, lineups, statistics, at-bats, top-performers, best-players | documented empty vs 404 | detail/lineups/statistics/top-performers 200; at-bats empty 200; best-players 404 all three states | PASS | variation (18 tests) | Empty vs unsupported still undocumented |
| TC-X-28 | Second entities | Rays / Volpe last | team 20869353, player 39625815 | GET events/last | 200 | Rays total=2081; Volpe total=615 | PASS | variation | |

### G3. Product workflows (UI)

| ID | Endpoint / workflow | Scenario | Preconditions | Steps | Expected | Actual | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TC-P-01 | Home Live | Open `/` | `pnpm dev` :5175 | Load Home | Live cards if games in progress | Code filters events to Live; API inprogress total=0 → empty “No matches.” Lab Home also N+1’d event detail at 12:58Z | FAIL | Home.tsx; this GET; calls.json Home | Current source has no N+1 |
| TC-P-02 | Home Today cards | Open `/` | same | View Today | R/H/E + competition name | List series scores; competitionName string; findings HOME_MATCH_SCORE_MISSING | FAIL | evidence list row; findings | MatchCard prints series via `scoreDisplay` |
| TC-P-03 | Matches Results fallback | Open `/matches?tab=results` | finished filter empty | Click Results | Completed games | `calls.json`: `/events?status=finished` 200 73 B then `/team/84917477/events/last` fallbackUsed | FAIL | Matches.tsx; calls; findings EVENT_FINISHED_FILTER_INCOMPLETE | Yankees-only |
| TC-P-04 | Match centre sample | `/match/67599823` | finished id | Open tabs | Header + extras | Detail 200; best-players tab will show HTTP 404 (JsonPanel); h2h null JSON | FAIL | Match.tsx; this GET | FAIL is for best-players/h2h tabs; overview PASS (see C-01) |
| TC-P-05 | Search Yankees | `/search` | — | Submit Yankees | Team link | 200, id 84917477, type team (`calls.json` Search) | PASS | calls + this GET | |
| TC-P-06 | Search Ohtani / MLB | `/search` | — | Submit | Player / competition | Catalog audit 200 (249 B / 444 B). UI Search screen only logged Yankees | PASS | calls.json Full catalog audit | UI grouping of those queries `NOT TESTED` on Search page |
| TC-P-07 | Search typo `Yankeess` | playbook | — | Submit | empty or near-miss | No JSON / calls row | NOT TESTED | — | Playbook-only |
| TC-P-08 | Player Ohtani | `/player/71698966` | — | Open | Profile + recent | Overview 200 (`calls.json` Player). Season stats not requested by page | PASS | Player.tsx; calls | Season line absent by catalog, not by API (TC-X-23) |
| TC-P-09 | Team Yankees rankings tab | `/team/84917477?tab=rankings` | — | Open tab | Rankings or empty | GET 404 | FAIL | Team.tsx; this GET | |
| TC-P-10 | Competition standings home/away | `/competition/53168725?tab=standings` | season selected | Toggle home/away | Tables | API empty rows; UI JsonPanel | FAIL | Competition.tsx; this GET | total PASS (TC-C-41) |
| TC-P-11 | Manager from lineup | `/manager/62643844` | id from lineup | Open | Profile | API 200. No calls.json Manager screen | NOT TESTED | ManagerPage source; API C-18 | Header has no Manager link |
| TC-P-12 | Endpoint lab | `/endpoints` | sample IDs in form | Click each path | 42 GETs | Source maps CATALOG; IDs match SAMPLE + 62643844 / 68144200 | NOT TESTED | EndpointLab.tsx | Covered at API layer by probe, not as this page in calls.json |
| TC-P-13 | Proxy methods | `/msdata` | local/Vercel | Non-GET | 405 | **Code** `middleware.ts` / API handler | NOT TESTED | source only | Not executed (non-destructive policy) |

---

## H. Pagination analysis

Observed pagination fields: `page`, `limit`, `total`, `totalPages`, `hasMore`. Not every list uses them (roster `players[]`, standings, umpires, top-performers).

| Observation | Evidence | Result |
| --- | --- | --- |
| Page 2 is a new slice on `/events` | extra probe: first ids 28606880 vs 56340050 | PASS |
| Directories page 2 differ | full-catalog teams/players/tournaments `different=true` | PASS |
| `page > totalPages` → HTTP **200**, empty array, **`total` unchanged**, `hasMore: false` | events page 9999 (total 18 / pages 4); players page 9999 and 2000 (total 9758 / pages 1952); team events page 2000 (total 2123 / pages 425); at-bats page 2000 (total 70 / pages 14) | FAIL as a client-stop contract; PASS that rows are not fabricated |
| Page 2000 **inside** range returns real rows | MLB unique-tournament events page 2000: n=10, totalPages 2927, total 29267; last page 2927 n=7; page 2928 empty | PASS |
| `limit=2000` rejected | events and search → 400 (variation EXPECTED) | PASS |
| `limit=1` and `limit=100` honoured | n=1; n=18 (=total) | PASS |
| Search huge page | full-catalog page 9999, total stays 1, items empty | same leftover-total pattern |
| UI paging | Players/Teams use `hasMore` only (`Player.tsx`, `Team.tsx`) | Safe against leftover `total`, but only if `hasMore` is false (it was on page 9999) |

---

## I. Error handling and HTTP status

| HTTP | When observed | Body shape | Product handling |
| ---: | --- | --- | --- |
| 200 | Most catalog GETs | Resource JSON | `msdata.ts` parses JSON; `error` only if `!response.ok` |
| 200 empty | filters total=0; h2h nulls; events/next; standings home/away rows=[] | Valid JSON | Matches Results treats empty finished as fallback; Home Live shows “No matches.” H2H tab still 200 so JsonPanel shows nulls, not DataState error |
| 400 | search missing/short `q`; event/abc; events status=ended; events/sideways; standings/form; not-a-date; limit=2000 | `error: "Bad Request"`; `message` string **or** array | Search shows concatenated/stringified message (`calls.json` error field joins array with commas) |
| 403 | `x-apim-key` only; no key | APIM-only: JSON Forbidden; no-key: **non-JSON** 5490 B | UI copy in `msdata.ts` for 401/403 mentions setting `MSDATA_API_KEY` and `MSDATA_LIVE_KEY` in Vercel — does not say Live-Key-only is sufficient |
| 404 entity | unknown event/player/team numeric id | `details.code` EVENT_NOT_FOUND / equivalent | Distinguishable message (“Baseball match … was not found”) |
| 404 enrichment | best-players, rankings; team-streaks on not-started 28606880 | `details.code` ENRICHMENT_NOT_FOUND, `reason` no_data_recorded | Same HTTP as missing entity; Match/Team tabs look broken |
| 404 | (none in catalog sweep for missing `/msdata` proxy) | — | `msdata.ts` maps 404 to “`/msdata` proxy not found” **even for API enrichment 404s** — product copy can mis-blame the proxy |
| 405 | non-GET/HEAD on proxy | text “Method not allowed” | Code only; not executed |
| 5xx | — | — | **Not observed** in calls.json or probes |

`widgetCopy` in `DataState.tsx` knows `OPTIONAL_404`, but Match/Team tabs always render `JsonPanel` for extras rather than mapping 404 vs empty.

---

## J. Product-level manual validation

**Method:** source review of every `App.tsx` route, plus `data/calls.json` screens (Home 77, Full catalog 93, Match Centre 15, Team 4, Competition 3, Matches 2, Search 1, Player 1). `docs/baseball_api_improvements.md` (checked 21 Oct 2026) is treated as a **documented UI walk**, not as new screenshots.

| Journey | Can a user complete it? | Evidence |
| --- | --- | --- |
| Browse today’s slate | Partially: 18 upcoming cards, series scores, “MLB Postseason” via `competitionName` | Home/Matches Today |
| See live games | No — Live empty while filter returns total=0 | TC-P-01, TC-X-02 |
| See completed games globally | No — Results empty then Yankees-only fallback | TC-P-03 |
| Open a finished game and read R/H/E | Yes for `67599823` | TC-C-01 |
| At-bats / lineups / box / umpires / weather / top-performers | Yes on finished sample | catalog 200s |
| Best players tab | No — 404 | TC-C-03 |
| H2H tab | No useful data — null duels | TC-C-06 |
| Search Yankees and open team | Yes | TC-P-05 |
| Open Ohtani and see season AVG/HR | No in UI (route exists off-catalog) | TC-P-08, TC-X-23 |
| Yankees roster | Yes (48 players) | TC-C-31 |
| Yankees rankings | No — 404 | TC-C-32 |
| MLB total table | Yes (90 rows) | TC-C-41 |
| MLB home/away tables | No — empty rows | TC-X-17 |
| Manager profile | API yes; chrome does not link it | TC-P-11 |
| Click all 42 routes | Page exists; API already swept | TC-P-12 |

**Consistency across pages:** `asMatch` / `MatchCard` are shared. List feeds without a tournament object show “Competition unknown” when `tournament.id` and `name` are missing; fixtures rows have `competitionName` but `asMatch` reads `uniqueTournament` / `tournament` / `tournamentName`, **not** `competitionName` — Home cards can show “Competition unknown” even when the API sent `competitionName`. That is a **client mapping gap** observed in source, not a separate API test.

**Edge states checked in evidence:** empty Live; empty Results then fallback; canceled first row on Yankees last; not-started at-bats empty; unknown ids 404; missing search q 400. **Not tested:** authenticated vs anonymous UI (keys are server-side); mobile viewport; `/endpoints` click-through as a user; Search typo; Manager navigation from a lineup click (lineup JsonPanel is raw JSON, not links).

---

## K. Findings / defect register

Severity is product impact in this lab, not a vendor SLA.

| ID | Severity | Area | Finding | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| F-01 | **Critical** | `/events` filters | `status=finished` and `inprogress` return total=0 while team `events/last` has 2123 games. Live and Results cannot be built from the global feed. | extra probes, variation, this GET, Matches.tsx fallback, findings EVENT_FINISHED_FILTER_INCOMPLETE | Open |
| F-02 | **High** | List vs detail schema | List: string status + `{ series }` + `competitionName`. Detail: status object + `inningsBaseball` R/H/E + nested uniqueTournament. Home cannot print a baseball scoreboard from the list. | evidence previews; this GET; findings LIST_SCORE_SERIES_ONLY / SCHEMA_INCONSISTENCY / HOME_MATCH_SCORE_MISSING | Open |
| F-03 | **High** | Optional enrichments | `best-players` and team `rankings` 404 on valid finished Yankees–Rays / Yankees. `top-performers` is 200. Same 404 class as unknown entity. | evidence + this GET | Open |
| F-04 | **High** | Auth contract | `X-Live-Key` alone 200; `x-apim-key` alone 403; both 200; none 403 non-JSON. No written rule in `.env.example` beyond setting both names. | this GET; improvements.md | Open |
| F-05 | **High** | Catalog gap | Player season statistics path returns 200 with battingAvg/HR/AB and is not in the 42 routes or `Player.tsx`. | this GET; catalog.ts | Open |
| F-06 | **Medium** | `/h2h` | 200 with null duels on finished sample. | evidence + this GET | Open |
| F-07 | **Medium** | Standings home/away | 200 empty `rows` vs total 90. | extra probes + this GET | Open |
| F-08 | **Medium** | Pagination | `page > totalPages` is 200 empty with **stale high `total`**. | extra probes, variation, this GET | Open |
| F-09 | **Medium** | `/fixtures/today` vs `/events` | Identical 18 IDs and byte size in this run. Unclear whether “today” is a calendar slice. | this GET | Open |
| F-10 | **Medium** | Tournament id on detail | `tournament.id` null; nested `uniqueTournament.id` 53168725. `asMatch` prefers `tournament` so competition links break. | this GET; msdata.ts; findings BROKEN_RELATIONSHIP | Open (API + client) |
| F-11 | **Medium** | `/events?status=canceled` | total=0 while canceled event 82011329 is first on Yankees last. | this GET; variation | Open |
| F-12 | **Medium** | Client 404 copy | `msdata.ts` treats any HTTP 404 as “`/msdata` proxy not found”. Enrichment 404s get the wrong operator hint. | msdata.ts vs 404 bodies | Open (client) |
| F-13 | **Low** | Error `message` type | Array vs string vs `{code,message}` (documented in improvements; search 400 array confirmed). | this GET search; ended 400 array | Open |
| F-14 | **Low** | Player/team preferred fields | Ohtani `team` null; Yankees `country` null on team resource; findings P3 list. | evidence previews; findings | Open |
| F-15 | **Low** | Featured-event semantics | Returns finished 67599823; findings FEATURED_EVENT_SEMANTICS_UNCLEAR. | findings; probe 200 | Open |
| F-16 | **Low** | Lineup manager | Home `manager` null; away manager used for `/manager/62643844`. | evidence lineup preview; improvements.md | Open |
| F-17 | **Low** | `competitionName` unused | List rows include `competitionName`; `asMatch` does not read it → “Competition unknown”. | msdata.ts vs list keys | Open (client) |

`data/findings.json` also records `SLOW_ENDPOINT` (e.g. `/events` 1174ms, some event details >800ms). Those are lab timings, not load tests; not promoted to this register as performance defects.

---

## L. Usability / integration assessment

No numeric scores.

**What integrates cleanly:** search hits with `type` + `id` + `name`; event detail R/H/E; at-bats; lineups with batting order; player-statistics; umpires; weather; top-performers; team roster; media; near-events; MLB total standings; seasons list; manager by id; pagination `hasMore` on directories.

**What forces workarounds:** Results tab hard-codes Yankees `SAMPLE.teamId`; Home Live depends on a global inprogress filter that is empty; MatchCard must interpret string-or-object status and series-or-innings scores (`statusOf`, `scoreDisplay` in `msdata.ts`).

**What looks like a broken page:** best-players and rankings tabs (404 JSON); h2h tab (nulls); standings home/away (empty table JSON); Live (empty state).

**Lab vs current source:** on 21 Oct 12:58–13:01Z the Home lab recorded N+1 `GET /event/{id}` (`fallbackUsed: true`). Current `Home.tsx` only calls three list endpoints. Do not assume the N+1 still ships; do assume list scores are still series-only.

**Operator experience:** `.env.example` asks for both key names. Vite sends both if present. Live-Key alone is enough on `/events?limit=1`; APIM alone is not. Customers copying only the APIM key will see 403.

**Accessibility / visual QA:** not in scope. Match extras are raw `JsonPanel` (`JSON.stringify`), not baseball-specific widgets — fine for a lab, not a consumer UI.

---

## M. Coverage summary (how counts were calculated)

| Bucket | Count | How it was counted |
| --- | ---: | --- |
| Catalog routes | **42** | `len(CATALOG)` in `catalog.ts`; `data/baseball-routes.json` `"count": 42`; same list in both files |
| Catalog routes executed in 12:31Z probe | **42 / 42** | `baseball-endpoint-evidence.json` `"routeCount": 42` and `len(routes)==42` |
| Probe extra probes | **11** | `len(extraProbes)` in that JSON |
| Variation tests | **51** | `summary.totalTests` in `baseball-variation-tests.json` (PASS 31, PASS_EMPTY 14, EXPECTED 6) |
| Full-catalog lab rows | **71** | `rowCount` / `len(rows)` in `full-catalog-test.json`; `catalogCovered` 42, `uncovered` [] |
| Recorded HTTP calls | **196** | `len(calls.json)`; statuses 181×200, 8×400, 7×404 |
| UI screens with ≥1 calls.json row | 7 named screens + catalog sweep | Counter of `screen`; **Manager** and **Endpoint lab page** have no screen rows |
| Additional GETs this review | Auth 4 header combos + 21 path GETs listed in O | curl, GET only |
| Catalog cases in §G1 marked executed | 42 | All have probe evidence |
| §G1 PASS / FAIL / NEEDS INVESTIGATION | 37 PASS, 3 FAIL (C-03, C-06, C-32), 2 NEEDS INVESTIGATION (C-12, C-17) | From §G1 Status column |
| Product journeys in §J | 14 rows | One per journey; mix of PASS/FAIL/NOT TESTED |
| Load/stress | **0** | Explicitly not run |
| Destructive requests | **0** | GET/HEAD only |

**This is not 100% product certification.** Gaps: Manager UI walk, `/endpoints` click-through, Search typo, Search Ohtani/MLB on the Search **page** (only catalog audit), Team tabs beyond overview/featured/near/performance in `calls.json`, Match tabs not all present in Match Centre lab rows, incidents/injuries uncalled, POST 405 unexecuted, postponed filter without a known postponed id, whether inprogress=0 means no live baseball worldwide.

---

## N. Recommendations and conclusion

### Must

1. Make `/events?status=finished` and `inprogress` return the games that already exist on team/player `events/last` (F-01). Until then, Live/Results are not shippable without a team-specific hack.
2. Put detail-equivalent **status object** and **`inningsBaseball` (R/H/E)** on `/events` and `/fixtures/today` rows (F-02).
3. Return **200 + empty** for missing optional enrichments (`best-players`, team `rankings`) instead of 404, **or** drop them from the baseball catalog and point MOTM at `/top-performers` (F-03).
4. Publish one auth rule: which of `X-Live-Key` / `x-apim-key` is required (F-04).

### Should

5. Add `GET /v1/baseball/player/{id}/unique-tournament/{tid}/season/{sid}/statistics` to the baseball catalog and to the player page (F-05) — it already returns battingAvg / HR / AB.
6. Populate `/h2h` or document null duels as the empty contract (F-06).
7. Fill standings `home`/`away` or remove those types from the product tabs (F-07).
8. For `page > totalPages`, either 400 or keep 200 but do not leave `total` looking like a full feed (F-08).
9. Document `/fixtures/today` vs `/events` (F-09).
10. Set `tournament.id` (or tell clients to use nested `uniqueTournament.id`); optionally fix `asMatch` to prefer nested id when `tournament.id` is null (F-10).
11. Stop mapping API 404 bodies to “proxy not found” in `msdata.ts` (F-12).

### Nice-to-have

12. One `message` type on errors (F-13).
13. Player.team and team.country on profile resources (F-14).
14. Document featured-event vs near-events (F-15).
15. Manager id on both lineup sides; document roster size (F-16).
16. Map list `competitionName` in `asMatch` (F-17).
17. `hasMore`-only paging is already a reasonable client defense.

### Conclusion

The Baseball Product is a thin, honest lab over **42** deployed GETs. Enough of the catalog works to demonstrate search, a finished match centre, a team roster, and an MLB table. **Live and Results do not**, because the global `/events` status index does not match team history. List scoreboards are series-only; optional extras 404; season stats exist off-catalog. Treat this document as a **21 Oct 2026 evidence pack**, not a go-live certificate.

---

## O. Appendix / evidence paths

### O1. Repo paths

| Path | Use |
| --- | --- |
| `apps/web/src/catalog.ts` | 42 route strings |
| `apps/web/src/msdata.ts` | Client, SAMPLE ids, status/score mapping |
| `apps/web/src/App.tsx` | Routes |
| `apps/web/src/pages/*.tsx` | Screen → endpoint wiring |
| `apps/web/vite.config.ts` | `/msdata` proxy, header names |
| `apps/web/api/msdata/[...path].ts`, `apps/web/middleware.ts` | Production proxy (GET/HEAD only) |
| `data/baseball-routes.json` | Official 42 |
| `data/baseball-endpoint-evidence.json` | Full probe (large; do not paste) |
| `data/baseball-variation-tests.json` | 51 variation tests |
| `data/full-catalog-test.json` | 71 lab rows |
| `data/calls.json` | 196 call log |
| `data/findings.json`, `data/gaps.json` | Structured findings |
| `docs/baseball_api_testing_report.md` | Generated 42-route report (kept) |
| `docs/baseball_api_variation_testing.md` | Variation report (kept) |
| `docs/baseball_api_endpoint_catalog.md` | Shape catalog (kept) |
| `docs/baseball_api_improvements.md` | API-team list (kept) |
| `docs/Baseball_Product_Review.md` | Playbook (kept) |
| `docs/baseball_api_reports.md` | Combined lab notes (kept; contains scores not used here) |
| `scripts/probe_all_endpoints.py`, `scripts/probe_variations.py` | Repeatable GET probes |
| `.env.example` | Config **names** only |

### O2. Existing evidence vs additional tests this review

**Existing (preferred, used first):** all files in O1 generated 21 Oct 2026 12:31–13:01Z, plus source.

**Additional read-only GETs this review (after those files):** GET only; no bodies committed; secrets not logged.

| Call | Result (sanitized) |
| --- | --- |
| `/events?limit=1` headers: both / Live-Key only / APIM only / none | 200 / **200** / **403** Forbidden JSON / **403** non-JSON 5490 B |
| `/events?page=1&limit=20` and `/fixtures/today?page=1&limit=20` | both 200, 5290 B, **same 18 IDs**, total=18 |
| `/events?status=` finished, inprogress, notstarted, canceled, postponed, ended | 200 total=0; 200 total=0; 200 total=18; 200 total=0; 200 total=0; **400** enum list |
| `/team/84917477/events/last?limit=5` | 200, total=2123; row0 id 82011329 canceled, series only |
| `/event/67599823` | 200, 4959 B; status finished; inningsBaseball 3–4; venue Yankee Stadium |
| `/event/67599823/h2h` | 200, both duels null |
| `/event/67599823/best-players` | 404 ENRICHMENT_NOT_FOUND |
| `/event/67599823/top-performers` | 200, 3 batters |
| `/team/84917477/rankings` | 404 ENRICHMENT_NOT_FOUND |
| standings total / home / away | 200 × 90 rows / 200 × 0 / 200 × 0 |
| `/players?page=9999&limit=5` | 200, n=0, total=9758, totalPages=1952 |
| `/search` without q | 400, message array |
| `/search?q=Yankees` | 200, team 84917477 |
| `/player/71698966/unique-tournament/53168725/season/68144200/statistics` | **200 not-in-catalog**, battingAvg 0.275, HR 30, AB 523, appearances 135 |

Python `urllib` on this machine failed TLS (`CERTIFICATE_VERIFY_FAILED`); additional GETs used `/usr/bin/curl` instead. Probe scripts in-repo already succeeded at 12:31Z.

### O3. Sample IDs (verified)

```json
{
  "eventId": 67599823,
  "teamId": 84917477,
  "playerId": 71698966,
  "lineupPlayerId": 39625815,
  "managerId": 62643844,
  "tournamentId": 53168725,
  "seasonId": 68144200,
  "canceledEventId": 82011329,
  "notStartedEventId": 28606880
}
```

### O4. How to regenerate probes (does not overwrite this report)

From repo root, with `.env` containing `MSDATA_BASE_URL`, `MSDATA_API_KEY`, `MSDATA_LIVE_KEY`:

```bash
python3 scripts/probe_all_endpoints.py
python3 scripts/probe_variations.py
```

Those commands refresh `data/*.json` and, if you also run the generate_* scripts, the **other** docs — not this file.
