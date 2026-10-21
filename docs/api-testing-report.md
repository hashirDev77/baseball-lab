# Baseball Product — API testing and product validation report

**Scope:** small-scale functional and manual validation of the Baseball Product against the deployed SportsAPI365 baseball API. This is **not** production certification, load testing, or a security assessment.

**Statuses used:** `PASS` / `FAIL` / `BLOCKED` / `NOT TESTED` / `NEEDS INVESTIGATION`. A case is marked executed only when it was observed on a live GET. Documented claims that were not independently observed are labeled as documented.

---

## A. Document overview

| Field | Value |
| --- | --- |
| Product | Baseball Product |
| App | React UI. No local baseball backend. |
| API | `GET https://sports-api.sportsdata365.com/msdata/v1/baseball/*` |
| Catalog | **42** baseball routes |
| Client | Browser calls a same-origin proxy; keys stay server-side |
| Config names (values not recorded) | `MSDATA_BASE_URL`, `MSDATA_API_KEY`, `MSDATA_LIVE_KEY` |
| Nature | Evidence synthesis plus a small set of **additional read-only GETs**. No POST/PUT/DELETE. No load/stress. No app functionality changes. |

---

## B. Executive summary

The catalog of **42** baseball routes was executed. **40** returned HTTP 200 on valid entities; **2** catalog routes returned **404** on a valid team and a finished game (`best-players`, team `rankings`). No 5xx responses appeared in the recorded call set (196 calls: 181×200, 8×400, 7×404).

The product can ship **directory, search, match-centre extras, team profile, player profile, and competition total standings**. It cannot ship a trustworthy **Live** or **Results** feed from `GET /events` alone: `status=finished` and `status=inprogress` both returned **`total=0`** while a team `events/last` feed returned **thousands** of games in the same window. Matches → Results therefore falls back to one team’s `events/last`.

List rows on `/events` and `/fixtures/today` use a **string** `status` and **`{ series }`** scores. Event **detail** uses a **status object** `{ code, type, description }` and **`inningsBaseball` { run, hits, errors }**. In this review, `/fixtures/today` and `/events` returned the **same event IDs** and the same body size.

Other confirmed gaps: `/h2h` is 200 with `teamDuel`/`managerDuel` null; standings `home`/`away` are 200 with empty `rows` (total has a full table); `page > totalPages` is 200 with an empty list while `total` stays high; `X-Live-Key` alone is 200 and `x-apim-key` alone is 403; football-style **player season statistics** returns 200 for a known player but is **not in the 42-route catalog** and is not called by the player page.

This report does **not** assign numeric experience scores.

---

## C. Product overview + workflow-to-endpoint table

**What the product is:** a React lab that calls deployed `/v1/baseball/*` through a same-origin `/msdata` proxy. Keys stay in server env.

**Routes in the chrome:** Home `/`, Matches `/matches`, Competitions `/competitions`, Teams `/teams`, Players `/players`, Search `/search`, “42 routes” `/endpoints`. Additional routes exist but are not in the header: `/match/:id`, `/player/:id`, `/team/:id`, `/manager/:id`, `/competition/:id`.

| Feature / screen | Endpoints | Expected | Observed | Finding |
| --- | --- | --- | --- | --- |
| Home `/` | `fixtures/today`, `events`, `tournaments` | Sections Live / Today / Upcoming / Completed + competition cards | Live = events filtered to status label Live; Today = fixtures list; Upcoming/Completed = subsets of today. `/events` and `/fixtures/today` were the same `notstarted` rows. `status=inprogress` total=0 → Live empty. List scores are `series` only. | Live empty; Today cards cannot show R/H/E from the list payload. |
| Matches → Live | `GET /events?status=inprogress` | Live games | 200, `total=0` | Results/Live blocker. `FAIL` |
| Matches → Today | `GET /fixtures/today` | Today’s schedule | 200, same IDs as `/events` | Identical to default `/events` in this run. `NEEDS INVESTIGATION` (semantics) |
| Matches → Upcoming | `GET /events?status=notstarted` | Upcoming | 200, non-zero total | Works for the current thin feed. `PASS` |
| Matches → Results | `GET /events?status=finished`; if empty, `GET /team/{teamId}/events/last` | Completed games | finished `total=0`; fallback 200 with a large team history. Mixes canceled games into Results. | Fallback is one-team-only. `FAIL` |
| Match centre `/match/:id` | `GET /event/{id}` plus tabs: at-bats, lineups, statistics, player-statistics, top-performers, umpires, h2h, best-players, pregame-form, team-streaks, weather, enrichments | Full game | Finished game: detail 200 with R/H/E; best-players **404**; h2h **200 null duels**; other extras 200. | Centre usable except h2h empty and best-players 404. |
| Search `/search` | `GET /search?q=` | Typed hits → player/team/competition | Known team / player / competition queries returned typed hits. Missing `q` → 400, `message` is an **array**. Typo / near-miss search: **NOT TESTED**. | Required `q` works. |
| Players directory | `GET /players?page&limit=20` | Paginated directory | Large total and many pages. UI pages on `hasMore`. | `PASS` |
| Player `/player/:id` | `player/{id}`, `events/last`, `events/next` | Profile + recent/upcoming | Profile 200; `team: null`; last has a large history; next **total=0**. Season stats route not called. | Profile works; no season line; upcoming empty. |
| Teams directory | `GET /teams` | Directory | Paginated directory with a non-zero total. | `PASS` |
| Team `/team/:id` | profile, players, events last/next, featured-event, near-events, performance, rankings, unique-tournaments, standings-seasons, media, enrichments | Team hub | Profile 200; roster present; rankings **404**; events/next total=0; featured-event was a finished game. | Rankings 404 looks like a missing team. |
| Manager `/manager/:id` | `GET /manager/{id}` | Profile | 200 with id, name, imageUrl. Not in header. | API `PASS`; UI walk for this screen `NOT TESTED`. |
| Competitions `/competitions` | `GET /tournaments` | Directory | Paginated directory with a non-zero total. | `PASS` |
| Competition `/competition/:id` | unique-tournament, seasons, events, scheduled-events/{date}, standings/{type} total\|home\|away, round/{round} | Competition hub | Profile 200; seasons and events present; standings total has a full table; home/away **0** rows. | Home/away tables empty. |
| 42 routes `/endpoints` | Every catalog path | Click-to-GET lab | Lab page exists; catalog sweep covers the same paths. | Lab page exists; sweep `PASS` as API coverage. |

---

## D. API inventory (42 catalog routes + extra observed)

Base path: `https://sports-api.sportsdata365.com/msdata` + `/v1/baseball/...`. Auth headers used: `x-apim-key` (from `MSDATA_API_KEY`) and `X-Live-Key` (from `MSDATA_LIVE_KEY`).

### D1. Catalog (42)

| # | Route | HTTP | Kind / list key | Count / pagination | Inventory note |
| ---: | --- | ---: | --- | --- | --- |
| 1 | `/event/{eventId}` | 200 | match `event` | — | Detail. Status object; `inningsBaseball`. |
| 2 | `/event/{eventId}/at-bats` | 200 | `atBats` | paginated | Empty 200 on canceled/not-started. |
| 3 | `/event/{eventId}/best-players` | **404** | error envelope | — | `ENRICHMENT_NOT_FOUND` on a finished game. |
| 4 | `/event/{eventId}/enrichments` | 200 | `types` | several types | Includes h2h_events, highlights, series, team_streaks, votes. |
| 5 | `/event/{eventId}/enrichments/{type}` | 200 | `events` | paginated | |
| 6 | `/event/{eventId}/h2h` | 200 | `teamDuel`, `managerDuel` | both **null** | |
| 7 | `/event/{eventId}/lineups` | 200 | `home`, `away` | dressed players present; `manager` null on one side | |
| 8 | `/event/{eventId}/player-statistics` | 200 | `playerStatistics` | paginated | |
| 9 | `/event/{eventId}/player/{playerId}/statistics` | 200 | player object | — | Match-level, not season. |
| 10 | `/event/{eventId}/pregame-form` | 200 | `homeTeam`, `awayTeam` | form arrays + eventIds | |
| 11 | `/event/{eventId}/statistics` | 200 | `statistics` | period ALL | Fielding + batting groups. |
| 12 | `/event/{eventId}/team-streaks` | 200 | six keys, all `[]` | — | Not-started game 404 in lab. |
| 13 | `/event/{eventId}/top-performers` | 200 | `topPerformers` | several, roles batter | |
| 14 | `/event/{eventId}/umpires` | 200 | `umpires` | crew present | HP/1B/2B/3B/LF/RF. |
| 15 | `/event/{eventId}/weather` | 200 | `conditions` | present | |
| 16 | `/events` | 200 | `items` | small `total`; paginated | List shape ≠ detail. |
| 17 | `/fixtures/today` | 200 | `items` | same total as `/events` | Same IDs as `/events` in this review. |
| 18 | `/manager/{managerId}` | 200 | `manager` | id, name, imageUrl | |
| 19 | `/player/{playerId}` | 200 | `player` | `team: null` | |
| 20 | `/player/{playerId}/events/{direction}` | 200 | `events` | last: large total; next: total=0 | |
| 21 | `/players` | 200 | `items` | large total, many pages | |
| 22 | `/search` | 200 | `items` | typed hits | type/id/name. |
| 23 | `/team/{teamId}` | 200 | `team` | `country: null`; logoUrl present | |
| 24 | `/team/{teamId}/enrichments` | 200 | `types` | several types | |
| 25 | `/team/{teamId}/enrichments/{type}` | 200 | `events` | paginated | |
| 26 | `/team/{teamId}/events/{direction}` | 200 | `events` | last: thousands of games; next: total=0 | |
| 27 | `/team/{teamId}/featured-event` | 200 | match `event` | finished game | Not “currently live”. |
| 28 | `/team/{teamId}/media` | 200 | `media` | paginated | |
| 29 | `/team/{teamId}/near-events` | 200 | `previousEvent`, `nextEvent` | — | |
| 30 | `/team/{teamId}/performance` | 200 | `events` (+ form, points) | paginated | |
| 31 | `/team/{teamId}/players` | 200 | `players` | roster present | Nested `player` objects. |
| 32 | `/team/{teamId}/rankings` | **404** | error envelope | — | `ENRICHMENT_NOT_FOUND`. |
| 33 | `/team/{teamId}/standings-seasons` | 200 | `uniqueTournamentSeasons` | paginated | |
| 34 | `/team/{teamId}/unique-tournaments` | 200 | `uniqueTournaments` | present | |
| 35 | `/teams` | 200 | `items` | paginated | |
| 36 | `/tournaments` | 200 | `items` | paginated | |
| 37 | `/unique-tournament/{tournamentId}` | 200 | `uniqueTournament` | competition object | `currentSeasonId` missing on object; seasons envelope has it. |
| 38 | `/unique-tournament/{tournamentId}/events` | 200 | `events` | very large total | Deep page numbers return real data. |
| 39 | `/unique-tournament/{tournamentId}/scheduled-events/{date}` | 200 | `events` | day’s events | |
| 40 | `/unique-tournament/{tournamentId}/season/{seasonId}/round/{round}` | 200 | `events` | large total | |
| 41 | `/unique-tournament/{tournamentId}/season/{seasonId}/standings/{type}` | 200 | `standings` | total: full table; home/away: 0 rows | |
| 42 | `/unique-tournament/{tournamentId}/seasons` | 200 | `seasons` | paginated | `currentSeasonId` on envelope. |

### D2. Extra observed routes / calls labeled **not-in-catalog**

These are **not** in the 42-route baseball catalog. They were still observed.

| Path | HTTP | Label |
| --- | ---: | --- |
| `/v1/baseball/player/{playerId}/unique-tournament/{tournamentId}/season/{seasonId}/statistics` | **200** | **not-in-catalog**. Keys include `player`, `team`, `statistics`, `playerId`, `teamId`, `uniqueTournamentId`, `seasonId`. Nested batting stats (average, home runs, at-bats, appearances, hits). |
| `/player/{id}/events/sideways` | 400 | Invalid `direction` on a catalog template, not a new route. |
| `/unique-tournament/.../standings/form` | 400 | Invalid standings `type`. |
| `/unique-tournament/.../scheduled-events/not-a-date` | 400 | Invalid date. |
| `/event/abc`, `/event/{unknown}`, `/player/{unknown}`, `/team/{unknown}` | 400 / 404 | Invalid/unknown IDs on catalog templates. |

Basketball-only `incidents`, `injuries`, and season-statistics paths are **absent from the baseball catalog**. Season statistics is nonetheless **reachable** (row above). Incidents/injuries were **not** called in this review (`NOT TESTED`).

---

## E. Response schema and data quality

Truncated previews are not treated as full payloads; event-detail GETs are used for score/status fields.

### E1. Event list vs event detail (confirmed)

`GET /events` and `GET /fixtures/today` list row shape:

```json
{
  "id": "<eventId>",
  "status": "notstarted",
  "homeScore": { "series": "<n>" },
  "awayScore": { "series": "<n>" },
  "tournamentId": "<tournamentId>",
  "competitionName": "<name>",
  "seasonId": "<seasonId>"
}
```

Row keys: `id, tournamentId, homeTeam, awayTeam, startTimestamp, status, homeScore, awayScore, seasonId, competitionName`. No `tournament` object. `status` is a **string**. `startTimestamp` is unix seconds.

`GET /event/{eventId}` for a finished game:

- Teams, venue present.
- `status`: `{ "code": 100, "type": "finished", "description": "Ended" }`; `statusType`: `"finished"`.
- `homeScore` keys include `series, current, display, innings, period1–period9, normaltime, inningsBaseball`.
- `homeScore.inningsBaseball`: `{ "run": "<n>", "hits": "<n>", "errors": "<n>" }` (same keys on away).
- `tournament.id`: **null**; `tournament.name` present; nested `uniqueTournament.id` present.
- `startTimestamp`: integer unix seconds.

The client mapping reads `uniqueTournament` **or** `tournament` **or** nested uniqueTournament. Because `tournament` exists, `tournament.id` (null) wins — Match → Competition link can fail even though a nested competition id is present.

Team `events/last` uses list key **`events`** (not `items`) and a **status object**. First row in this review was **canceled**, with `homeScore` keys `["series"]` only.

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
| Search hit | `{ "type": "team", "id": "<id>", "name": "<name>", "countryAlpha2": null, "gender": "M" }` |
| H2H | `{ "teamDuel": null, "managerDuel": null }` |
| Team streaks (finished game) | all six buckets `[]` |
| Top performers | several `role: "batter"` with battingHits / battingAtBats / battingHomeRuns / battingRbi |
| Umpires | assignment HP, 1B, 2B, 3B, LF, RF |
| Weather | temperature, humidity, windSpeed, isForecast true/false |
| Pregame form | `form` W/L letters; eventIds listed; `source: "derived"` |
| Lineups | `confirmed`, `startersListed`, `dressedPlayers`, `manager` (null on one side), `formation: null`; player rows have `battingOrder`, `appearanceRoles`, `startingPitcher` |
| Player | position, jersey, height present; `team: null` |
| Team | `country: null`, `manager: null`, `logoUrl` present (path only) |
| Standings total row keys | team, position, matches, wins, draws, losses, scoresFor/Against, gamesBehind, winPercentage, group, … |
| Error envelope | `statusCode, message, error, path, timestamp, requestId` (+ `details` on 404) |
| Validation `message` | sometimes **string**, sometimes **array of strings** (search missing `q`; `status=ended`) |

### E4. Quality issues

- A finished game has a full baseball box on **detail**, not on **list**.
- Player `team` is null on the player object.
- Team `country` is null on `/team/{id}` while the same club nested on event detail has `country: { name, alpha2 }`.
- Shirt numbers on lineup preview rows shown are null.
- Client call logs use unix-ms timestamps; API `startTimestamp` is unix **seconds**.

---

## F. Manual API test strategy

**Goal:** confirm the 42 catalog routes respond, that product screens can consume them, and that known gaps still reproduce. Not a performance SLA, not a soak test, not auth-bypass research beyond the four-header matrix already documented.

**In scope**

- GET against `/v1/baseball/*`.
- Happy path on IDs found via search → team events → lineups → seasons.
- Status filters, pagination edges, validation 400/404.
- Product workflows on the main screens.

**Out of scope**

- Load/stress, fuzzing, destructive writes (proxy is documented as **405** for non-GET/HEAD — **not executed** here).
- Sports other than baseball (proxy rejects paths that are not `/v1/baseball`).
- Certifying production SLOs or completeness of global baseball coverage.

**How tests were executed**

1. Discover IDs via search, team `events/last`, lineups, seasons, enrichments; call each of 42 templates.
2. Extra probes: finished/inprogress, far page numbers, search missing q, invalid/unknown ids, standings home/away, player/team `events/next`.
3. Variation tests (states, second team/player, deep pages, limits, status tokens, enrichment types).
4. Full-catalog lab sweep and in-product HTTP log.
5. Additional **read-only GETs** (auth matrix, identity of fixtures vs events, filters, detail R/H/E, h2h/best-players/top-performers/rankings, standings, far player pages, search without q, not-in-catalog season stats).

**Environments:** probes hit `MSDATA_BASE_URL` directly with both key headers. The UI hits the same-origin `/msdata` proxy (which injects the same header names). Additional GETs used both headers except the auth matrix.

---

## G. Detailed manual test cases

Legend: **Executed** = observed on a live GET. **Expected** is the product/catalog expectation, not an SLA.

### G1. Catalog routes (42)

| ID | Endpoint / workflow | Scenario | Steps | Expected | Actual | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-C-01 | `GET /event/{eventId}` | Finished game detail | GET | 200 match with teams, status, scores | 200; status object finished; inningsBaseball present | PASS | Nested uniqueTournament id present; `tournament.id` null |
| TC-C-02 | `GET /event/{id}/at-bats` | Play-by-play | GET page=1 | paginated at-bats | 200, paginated | PASS | Canceled/not-started: empty 200 |
| TC-C-03 | `GET /event/{id}/best-players` | Optional MOTM | GET | usable list or empty 200 | **404** ENRICHMENT_NOT_FOUND | FAIL | Catalog includes the route |
| TC-C-04 | `GET /event/{id}/enrichments` | Type index | GET | types[] | 200, several types | PASS | |
| TC-C-05 | `GET /event/{id}/enrichments/{type}` | h2h_events | GET | paged events | 200, paginated | PASS | Other listed types also 200 |
| TC-C-06 | `GET /event/{id}/h2h` | Prior meetings | GET | duels or documented empty | 200, both duels **null** | FAIL | HTTP 200 is not an error; product H2H tab is blank |
| TC-C-07 | `GET /event/{id}/lineups` | Roster | GET | home/away players | 200; dressed players present; manager null on one side | PASS | Baseball roster, not XI=11 |
| TC-C-08 | `GET /event/{id}/player-statistics` | Box | GET | paged stats | 200, paginated | PASS | |
| TC-C-09 | `GET /event/{id}/player/{playerId}/statistics` | One player match stats | GET | 200 stats | 200 | PASS | Not season stats |
| TC-C-10 | `GET /event/{id}/pregame-form` | Form | GET | W/L form | 200 | PASS | |
| TC-C-11 | `GET /event/{id}/statistics` | Team comparison | GET | groups | 200, period ALL, Fielding+Batting | PASS | |
| TC-C-12 | `GET /event/{id}/team-streaks` | Streaks | GET | streak buckets | 200, all arrays empty | NEEDS INVESTIGATION | Not-started 404 in lab |
| TC-C-13 | `GET /event/{id}/top-performers` | Batters/pitchers | GET | list | 200, several batters | PASS | Usable MOTM stand-in |
| TC-C-14 | `GET /event/{id}/umpires` | Crew | GET | umpires | 200 | PASS | |
| TC-C-15 | `GET /event/{id}/weather` | Conditions | GET | conditions | 200 | PASS | |
| TC-C-16 | `GET /events` | Default feed | GET page=1 | current matches | 200, small total, all notstarted in this run | PASS | Business completeness vs team history is TC-X-01 |
| TC-C-17 | `GET /fixtures/today` | Today | GET | today’s games | 200; **same IDs as /events** | NEEDS INVESTIGATION | Identical feed in this run |
| TC-C-18 | `GET /manager/{managerId}` | Profile | GET | profile | 200 name + imageUrl | PASS | |
| TC-C-19 | `GET /player/{playerId}` | Profile | GET | profile | 200, team null | PASS | Thin preferred fields |
| TC-C-20 | `GET /player/{id}/events/last` | Recent | GET | paged events | 200, large total | PASS | |
| TC-C-21 | `GET /players` | Directory | GET | paged players | 200, large total | PASS | |
| TC-C-22 | `GET /search` | Known team name | GET | typed hits | 200, team hit | PASS | |
| TC-C-23 | `GET /team/{teamId}` | Profile | GET | profile | 200, country null | PASS | |
| TC-C-24 | `GET /team/{id}/enrichments` | Index | GET | types | 200 | PASS | |
| TC-C-25 | `GET /team/{id}/enrichments/{type}` | events_last | GET | payload | 200, paginated | PASS | |
| TC-C-26 | `GET /team/{id}/events/last` | History | GET | paged events | 200, **thousands** of games | PASS | Contrasts with /events?status=finished |
| TC-C-27 | `GET /team/{id}/featured-event` | Featured | GET | one event | 200; finished game | PASS | Semantics unclear vs live |
| TC-C-28 | `GET /team/{id}/media` | Media | GET | paged media | 200 | PASS | |
| TC-C-29 | `GET /team/{id}/near-events` | Prev/next | GET | envelope | 200 | PASS | |
| TC-C-30 | `GET /team/{id}/performance` | Form | GET | form+events | 200 | PASS | Scope undocumented |
| TC-C-31 | `GET /team/{id}/players` | Roster | GET | players[] | 200, roster present | PASS | Nested player id/name |
| TC-C-32 | `GET /team/{id}/rankings` | Rankings | GET | list or empty 200 | **404** ENRICHMENT_NOT_FOUND | FAIL | |
| TC-C-33 | `GET /team/{id}/standings-seasons` | Seasons with tables | GET | list | 200 | PASS | |
| TC-C-34 | `GET /team/{id}/unique-tournaments` | Team competitions | GET | list | 200 | PASS | |
| TC-C-35 | `GET /teams` | Directory | GET | paged teams | 200 | PASS | |
| TC-C-36 | `GET /tournaments` | Directory | GET | paged competitions | 200 | PASS | |
| TC-C-37 | `GET /unique-tournament/{id}` | Competition | GET | competition | 200 | PASS | currentSeasonId missing on object |
| TC-C-38 | `GET /unique-tournament/{id}/events` | Competition feed | GET | paged events | 200, very large total | PASS | |
| TC-C-39 | `GET /unique-tournament/{id}/scheduled-events/{date}` | Calendar day | GET | day’s events | 200 | PASS | |
| TC-C-40 | `GET /unique-tournament/{id}/season/{sid}/round/{round}` | Round 1 | GET | events | 200 | PASS | |
| TC-C-41 | `GET /unique-tournament/{id}/season/{sid}/standings/total` | Table | GET | rows | 200, full table, type total | PASS | |
| TC-C-42 | `GET /unique-tournament/{id}/seasons` | Season list | GET | seasons | 200 | PASS | |

### G2. Filters, pagination, errors, auth, extra route

| ID | Endpoint / workflow | Scenario | Steps | Expected | Actual | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-X-01 | `GET /events?status=finished` | Results filter | GET | non-zero when history exists | 200, items=[], **total=0** | FAIL | Team last feed has thousands in the same window |
| TC-X-02 | `GET /events?status=inprogress` | Live filter | GET | live games or honest empty if none live | 200, **total=0** | FAIL | Cannot distinguish “no live games” vs broken index |
| TC-X-03 | `GET /events?status=notstarted` | Upcoming filter | GET | upcoming | 200, non-zero total | PASS | |
| TC-X-04 | `GET /events?status=canceled` | Canceled filter | GET | canceled games | 200, total=0 | FAIL | Canceled games exist on team last |
| TC-X-05 | `GET /events?status=postponed` | Postponed | GET | postponed or empty | 200, total=0 | NEEDS INVESTIGATION | No independent postponed id confirmed |
| TC-X-06 | `GET /events?status=ended` | Invalid token | GET | 400 | 400; allowed: notstarted, inprogress, halftime, pause, finished, postponed, canceled, awarded, interrupted, coverage_lost | PASS | `ended` is not in the enum; detail `description` is “Ended” |
| TC-X-07 | `GET /events` page 1 vs 2 | Paging | GET page=1 then 2 | different slices | different first-row ids | PASS | |
| TC-X-08 | `GET /events?page=9999` | Beyond totalPages | GET | honest empty | 200, items=[], **total unchanged**, hasMore=false | FAIL | Empty list is honest; leftover total is not |
| TC-X-09 | `GET /players?page=9999` | Beyond last page | GET | honest empty | 200, n=0, **total unchanged** | FAIL | |
| TC-X-10 | `GET /players?page=2000` | Deep page vs last page | GET | empty 200 | 200, count=0 | PASS | No fake rows |
| TC-X-11 | `GET /unique-tournament/{id}/events?page=2000` | page 2000 in range | GET | real rows | 200, real rows, large total | PASS | Page 2000 is valid here |
| TC-X-12 | `GET /events?limit=2000` | Oversize limit | GET | validation error | **400** | PASS | Same for search limit=2000 |
| TC-X-13 | `GET /events?limit=1` / `limit=100` | Limit honoured | GET | n≤limit | limit=1 → n=1; large limit capped at total | PASS | |
| TC-X-14 | `GET /search` missing q | Validation | omit q | 400 | 400, message **array** of strings | PASS | |
| TC-X-15 | `GET /event/abc` | Non-numeric id | GET | 400 | 400 string message | PASS | |
| TC-X-16 | `GET /event/{unknown}` | Unknown id | GET | 404 | 404 EVENT_NOT_FOUND | PASS | Contrast with enrichment 404 |
| TC-X-17 | Standings home/away | Split tables | GET home, away | rows or documented empty | 200, 1 table each, **rows: []**; total has a full table | FAIL | |
| TC-X-18 | Player/team `events/next` | Upcoming | GET | upcoming or empty | both 200, total=0 | PASS | Empty may be off-season; not a transport error |
| TC-X-19 | Auth: both headers | `/events?limit=1` | GET | 200 | 200, keys items/page/limit/total | PASS | Values not recorded |
| TC-X-20 | Auth: `X-Live-Key` only | same | GET | documented contract unknown | **200** | PASS | |
| TC-X-21 | Auth: `x-apim-key` only | same | GET | unknown | **403** Forbidden JSON | FAIL | Fail vs “either key works”; contract missing |
| TC-X-22 | Auth: no key | same | GET | 401/403 | **403**, body not JSON | PASS | Non-JSON error vs JSON 403 with APIM only |
| TC-X-23 | Season stats **not-in-catalog** | Known player + competition + season | GET football-style path | unknown / catalog says absent | **200**, batting average / HR / AB / appearances | PASS | Not wired on the player page |
| TC-X-24 | Invalid direction `events/sideways` | Enum | GET | 400 | 400 “enum string is expected” | PASS | |
| TC-X-25 | Invalid standings `form` | Enum | GET | 400 | 400 | PASS | |
| TC-X-26 | Invalid calendar date | `not-a-date` | GET | 400 | 400 expected YYYY-MM-DD | PASS | |
| TC-X-27 | Event states: canceled / notstarted | Same sub-routes | GET detail, lineups, statistics, at-bats, top-performers, best-players | documented empty vs 404 | detail/lineups/statistics/top-performers 200; at-bats empty 200; best-players 404 all three states | PASS | Empty vs unsupported still undocumented |
| TC-X-28 | Second entities | Another team / player last | GET events/last | 200 | 200, large totals | PASS | |

### G3. Product workflows (UI)

| ID | Endpoint / workflow | Scenario | Steps | Expected | Actual | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-P-01 | Home Live | Open `/` | Load Home | Live cards if games in progress | Code filters events to Live; API inprogress total=0 → empty “No matches.” | FAIL | |
| TC-P-02 | Home Today cards | Open `/` | View Today | R/H/E + competition name | List series scores; competitionName string unused by card mapping | FAIL | |
| TC-P-03 | Matches Results fallback | Open Results | Click Results | Completed games | `/events?status=finished` empty then one-team `events/last` fallback | FAIL | One team only |
| TC-P-04 | Match centre | Open a finished match | Open tabs | Header + extras | Detail 200; best-players tab HTTP 404; h2h null JSON | FAIL | FAIL is for best-players/h2h tabs; overview PASS (see C-01) |
| TC-P-05 | Search known team | `/search` | Submit a known team name | Team link | 200, type team | PASS | |
| TC-P-06 | Search player / competition | `/search` | Submit | Player / competition | Catalog audit 200. Search page grouping of those queries `NOT TESTED` | PASS | |
| TC-P-07 | Search typo | Near-miss query | Submit | empty or near-miss | Not observed | NOT TESTED | |
| TC-P-08 | Player page | Open a known player | Open | Profile + recent | Overview 200. Season stats not requested by page | PASS | Season line absent by catalog, not by API (TC-X-23) |
| TC-P-09 | Team rankings tab | Open rankings | Open tab | Rankings or empty | GET 404 | FAIL | |
| TC-P-10 | Competition standings home/away | Toggle home/away | Toggle | Tables | API empty rows | FAIL | total PASS (TC-C-41) |
| TC-P-11 | Manager from lineup | Open manager | Open | Profile | API 200. No recorded UI walk | NOT TESTED | Header has no Manager link |
| TC-P-12 | Endpoint lab | `/endpoints` | Click each path | 42 GETs | Page exists; covered at API layer, not as this page | NOT TESTED | |
| TC-P-13 | Proxy methods | `/msdata` | Non-GET | 405 | Documented on the proxy; not executed | NOT TESTED | Non-destructive policy |

---

## H. Pagination analysis

Observed pagination fields: `page`, `limit`, `total`, `totalPages`, `hasMore`. Not every list uses them (roster `players[]`, standings, umpires, top-performers).

| Observation | Result |
| --- | --- |
| Page 2 is a new slice on `/events` | PASS |
| Directories page 2 differ | PASS |
| `page > totalPages` → HTTP **200**, empty array, **`total` unchanged**, `hasMore: false` | FAIL as a client-stop contract; PASS that rows are not fabricated |
| A deep page **inside** range returns real rows | PASS |
| `limit=2000` rejected | PASS |
| `limit=1` and a large valid `limit` honoured | PASS |
| Search huge page: total stays, items empty | same leftover-total pattern |
| UI paging uses `hasMore` only | Safe against leftover `total`, but only if `hasMore` is false (it was on far pages) |

---

## I. Error handling and HTTP status

| HTTP | When observed | Body shape | Product handling |
| ---: | --- | --- | --- |
| 200 | Most catalog GETs | Resource JSON | Parsed as JSON; treated as error only if `!response.ok` |
| 200 empty | filters total=0; h2h nulls; events/next; standings home/away rows=[] | Valid JSON | Matches Results treats empty finished as fallback; Home Live shows “No matches.” H2H tab still 200 so the panel shows nulls, not an error |
| 400 | search missing/short `q`; non-numeric event id; events status=ended; events/sideways; standings/form; invalid date; limit=2000 | `error: "Bad Request"`; `message` string **or** array | Search shows concatenated/stringified message |
| 403 | `x-apim-key` only; no key | APIM-only: JSON Forbidden; no-key: **non-JSON** | UI copy for 401/403 mentions setting both key names — does not say Live-Key-only is sufficient |
| 404 entity | unknown event/player/team numeric id | `details.code` EVENT_NOT_FOUND / equivalent | Distinguishable message |
| 404 enrichment | best-players, rankings; team-streaks on not-started | `details.code` ENRICHMENT_NOT_FOUND, `reason` no_data_recorded | Same HTTP as missing entity; Match/Team tabs look broken |
| 404 | (none for a missing proxy) | — | Client maps 404 to “proxy not found” **even for API enrichment 404s** — product copy can mis-blame the proxy |
| 405 | non-GET/HEAD on proxy | text “Method not allowed” | Documented only; not executed |
| 5xx | — | — | **Not observed** |

Match/Team tabs always render raw JSON for extras rather than mapping 404 vs empty.

---

## J. Product-level manual validation

**Method:** source review of every product route, plus recorded UI screens (Home, Full catalog, Match Centre, Team, Competition, Matches, Search, Player). Manager and Endpoint lab page were not walked as named screens.

| Journey | Can a user complete it? |
| --- | --- |
| Browse today’s slate | Partially: upcoming cards, series scores, competition name on the list row |
| See live games | No — Live empty while filter returns total=0 |
| See completed games globally | No — Results empty then one-team fallback |
| Open a finished game and read R/H/E | Yes on a finished game |
| At-bats / lineups / box / umpires / weather / top-performers | Yes on a finished game |
| Best players tab | No — 404 |
| H2H tab | No useful data — null duels |
| Search a team and open it | Yes |
| Open a player and see season AVG/HR | No in UI (route exists off-catalog) |
| Team roster | Yes |
| Team rankings | No — 404 |
| Competition total table | Yes |
| Competition home/away tables | No — empty rows |
| Manager profile | API yes; chrome does not link it |
| Click all 42 routes | Page exists; API already swept |

**Consistency across pages:** list feeds without a tournament object show “Competition unknown” when `tournament.id` and `name` are missing; fixtures rows have `competitionName` but the client mapping reads `uniqueTournament` / `tournament` / `tournamentName`, **not** `competitionName` — Home cards can show “Competition unknown” even when the API sent `competitionName`. That is a **client mapping gap**, not a separate API test.

**Edge states checked:** empty Live; empty Results then fallback; canceled first row on team last; not-started at-bats empty; unknown ids 404; missing search q 400. **Not tested:** authenticated vs anonymous UI (keys are server-side); mobile viewport; `/endpoints` click-through as a user; Search typo; Manager navigation from a lineup click (lineup panel is raw JSON, not links).

---

## K. Findings / defect register

Severity is product impact in this lab, not a vendor SLA.

| ID | Severity | Area | Finding | Status |
| --- | --- | --- | --- | --- |
| F-01 | **Critical** | `/events` filters | `status=finished` and `inprogress` return total=0 while team `events/last` has thousands of games. Live and Results cannot be built from the global feed. | Open |
| F-02 | **High** | List vs detail schema | List: string status + `{ series }` + `competitionName`. Detail: status object + `inningsBaseball` R/H/E + nested uniqueTournament. Home cannot print a baseball scoreboard from the list. | Open |
| F-03 | **High** | Optional enrichments | `best-players` and team `rankings` 404 on a valid finished game / valid team. `top-performers` is 200. Same 404 class as unknown entity. | Open |
| F-04 | **High** | Auth contract | `X-Live-Key` alone 200; `x-apim-key` alone 403; both 200; none 403 non-JSON. No written rule beyond setting both names. | Open |
| F-05 | **High** | Catalog gap | Player season statistics path returns 200 with battingAvg/HR/AB and is not in the 42 routes or on the player page. | Open |
| F-06 | **Medium** | `/h2h` | 200 with null duels on a finished game. | Open |
| F-07 | **Medium** | Standings home/away | 200 empty `rows` vs a full total table. | Open |
| F-08 | **Medium** | Pagination | `page > totalPages` is 200 empty with **stale high `total`**. | Open |
| F-09 | **Medium** | `/fixtures/today` vs `/events` | Identical IDs and byte size in this run. Unclear whether “today” is a calendar slice. | Open |
| F-10 | **Medium** | Tournament id on detail | `tournament.id` null; nested `uniqueTournament.id` present. Client prefers `tournament` so competition links break. | Open (API + client) |
| F-11 | **Medium** | `/events?status=canceled` | total=0 while canceled events exist on team last. | Open |
| F-12 | **Medium** | Client 404 copy | Any HTTP 404 is treated as “proxy not found”. Enrichment 404s get the wrong operator hint. | Open (client) |
| F-13 | **Low** | Error `message` type | Array vs string vs `{code,message}` (search 400 array confirmed). | Open |
| F-14 | **Low** | Player/team preferred fields | Player `team` null; team `country` null on team resource. | Open |
| F-15 | **Low** | Featured-event semantics | Returns a finished game. | Open |
| F-16 | **Low** | Lineup manager | Home `manager` null; away manager used for `/manager/{id}`. | Open |
| F-17 | **Low** | `competitionName` unused | List rows include `competitionName`; client mapping does not read it → “Competition unknown”. | Open (client) |

Lab timings (some list/detail calls over ~800ms) were recorded but are not promoted here as performance defects.

---

## L. Usability / integration assessment

No numeric scores.

**What integrates cleanly:** search hits with `type` + `id` + `name`; event detail R/H/E; at-bats; lineups with batting order; player-statistics; umpires; weather; top-performers; team roster; media; near-events; competition total standings; seasons list; manager by id; pagination `hasMore` on directories.

**What forces workarounds:** Results tab hard-codes one team id; Home Live depends on a global inprogress filter that is empty; match cards must interpret string-or-object status and series-or-innings scores.

**What looks like a broken page:** best-players and rankings tabs (404 JSON); h2h tab (nulls); standings home/away (empty table JSON); Live (empty state).

**Operator experience:** config asks for both key names. The proxy sends both if present. Live-Key alone is enough on `/events?limit=1`; APIM alone is not. Customers copying only the APIM key will see 403.

**Accessibility / visual QA:** not in scope. Match extras are raw JSON, not baseball-specific widgets — fine for a lab, not a consumer UI.

---

## M. Coverage summary (how counts were calculated)

| Bucket | Count | How it was counted |
| --- | ---: | --- |
| Catalog routes | **42** | Official baseball catalog |
| Catalog routes executed | **42 / 42** | One GET per catalog template |
| Extra probes | **11** | finished/inprogress, paging, validation, standings splits, next events |
| Variation tests | **51** | States, second entities, deep pages, limits, status tokens |
| Full-catalog lab rows | **71** | Catalog plus error/paging rows; catalog covered 42 |
| Recorded HTTP calls | **196** | 181×200, 8×400, 7×404 |
| UI screens with ≥1 recorded call | 7 named screens + catalog sweep | **Manager** and **Endpoint lab page** have no screen rows |
| Additional GETs this review | Auth 4 header combos + path GETs in this report | GET only |
| Catalog cases in §G1 marked executed | 42 | All observed |
| §G1 PASS / FAIL / NEEDS INVESTIGATION | 37 PASS, 3 FAIL (C-03, C-06, C-32), 2 NEEDS INVESTIGATION (C-12, C-17) | From §G1 Status column |
| Product journeys in §J | 14 rows | One per journey; mix of PASS/FAIL/NOT TESTED |
| Load/stress | **0** | Explicitly not run |
| Destructive requests | **0** | GET/HEAD only |

**This is not 100% product certification.** Gaps: Manager UI walk, `/endpoints` click-through, Search typo, Search player/competition on the Search **page** (only catalog audit), Team tabs beyond overview/featured/near/performance, Match tabs not all walked, incidents/injuries uncalled, POST 405 unexecuted, postponed filter without a known postponed id, whether inprogress=0 means no live baseball worldwide.

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
10. Set `tournament.id` (or tell clients to use nested `uniqueTournament.id`); optionally prefer nested id when `tournament.id` is null (F-10).
11. Stop mapping API 404 bodies to “proxy not found” (F-12).

### Nice-to-have

12. One `message` type on errors (F-13).
13. Player.team and team.country on profile resources (F-14).
14. Document featured-event vs near-events (F-15).
15. Manager id on both lineup sides; document roster size (F-16).
16. Map list `competitionName` in the client (F-17).
17. `hasMore`-only paging is already a reasonable client defense.

### Conclusion

The Baseball Product is a thin, honest lab over **42** deployed GETs. Enough of the catalog works to demonstrate search, a finished match centre, a team roster, and a competition table. **Live and Results do not**, because the global `/events` status index does not match team history. List scoreboards are series-only; optional extras 404; season stats exist off-catalog. Treat this document as an evidence pack, not a go-live certificate.
