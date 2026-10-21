# Baseball API — Testing Report

Live API test run against all **42** catalog routes. This document is for **QA and integrators only**
(response shapes, verdicts, pagination, failures). Product UI planning stays in the endpoint catalog.

- **Test run (UTC):** 2026-10-21T12:31:40.219870+00:00
- **Base URL:** `https://sports-api.sportsdata365.com/msdata/v1/baseball/...`
- **Evidence JSON:** [`../data/baseball-endpoint-evidence.json`](../data/baseball-endpoint-evidence.json)

## How tests were executed

1. Discover IDs via `search`, `team/.../events/last`, `lineups`, `enrichments`, `seasons`.
2. Call each route template with those IDs (see table below).
3. Record HTTP status, response size, top-level keys, list key, pagination, sample row keys.
4. Run additional filter/pagination/validation probes (see end).

### IDs used in this run

```json
{
  "eventId": 67599823,
  "teamId": 84917477,
  "playerId": 71698966,
  "lineupPlayerId": 39625815,
  "managerId": 62643844,
  "tournamentId": 53168725,
  "seasonId": 68144200,
  "enrichmentType": "h2h_events",
  "teamEnrichmentType": "events_last",
  "date": "2026-10-21"
}
```

## Verdict summary

| Verdict | Count | Meaning |
| --- | ---: | --- |
| **PASS** | 38 | HTTP 200 and non-empty payload fits expected type |
| **PASS_PARTIAL** | 1 | HTTP 200 but sparse or incomplete business data |
| **PASS_EMPTY** | 1 | HTTP 200 with valid empty/null business data |
| **OPTIONAL_MISSING** | 2 | HTTP 404 enrichment not recorded (optional route) |
| **FAIL** | 0 | Unexpected error |
| **EXPECTED** | 0 | Expected validation error |

## Matrix (all catalog routes)

| Verdict | HTTP | Route | Response kind | List key | Count |
| --- | ---: | --- | --- | --- | ---: |
| PASS | 200 | `/event/{eventId}` | match object | — | — |
| PASS | 200 | `/event/{eventId}/at-bats` | paginated list | atBats | 5 |
| OPTIONAL_MISSING | 404 | `/event/{eventId}/best-players` | error envelope | — | — |
| PASS | 200 | `/event/{eventId}/enrichments` | list envelope | types | 5 |
| PASS | 200 | `/event/{eventId}/enrichments/{type}` | paginated list | events | 10 |
| PASS_EMPTY | 200 | `/event/{eventId}/h2h` | object (teamDuel, managerDuel) | — | — |
| PASS | 200 | `/event/{eventId}/lineups` | home/away split (lineups or similar) | — | — |
| PASS | 200 | `/event/{eventId}/player-statistics` | paginated list | playerStatistics | 5 |
| PASS | 200 | `/event/{eventId}/player/{playerId}/statistics` | player object | — | — |
| PASS | 200 | `/event/{eventId}/pregame-form` | pregame form envelope | — | — |
| PASS | 200 | `/event/{eventId}/statistics` | list envelope | statistics | 1 |
| PASS_PARTIAL | 200 | `/event/{eventId}/team-streaks` | object (general, generalPerLastX, genera | — | — |
| PASS | 200 | `/event/{eventId}/top-performers` | list envelope | topPerformers | 3 |
| PASS | 200 | `/event/{eventId}/umpires` | list envelope | umpires | 6 |
| PASS | 200 | `/event/{eventId}/weather` | list envelope | conditions | 2 |
| PASS | 200 | `/events` | paginated list | items | 5 |
| PASS | 200 | `/fixtures/today` | paginated list | items | 5 |
| PASS | 200 | `/manager/{managerId}` | manager object | — | — |
| PASS | 200 | `/player/{playerId}` | player object | — | — |
| PASS | 200 | `/player/{playerId}/events/{direction}` | paginated list | events | 5 |
| PASS | 200 | `/players` | paginated list | items | 5 |
| PASS | 200 | `/search` | paginated list | items | 1 |
| PASS | 200 | `/team/{teamId}` | team object | — | — |
| PASS | 200 | `/team/{teamId}/enrichments` | list envelope | types | 8 |
| PASS | 200 | `/team/{teamId}/enrichments/{type}` | paginated list | events | 10 |
| PASS | 200 | `/team/{teamId}/events/{direction}` | paginated list | events | 5 |
| PASS | 200 | `/team/{teamId}/featured-event` | match object | — | — |
| PASS | 200 | `/team/{teamId}/media` | paginated list | media | 5 |
| PASS | 200 | `/team/{teamId}/near-events` | previous/next event envelope | — | — |
| PASS | 200 | `/team/{teamId}/performance` | paginated list | events | 5 |
| PASS | 200 | `/team/{teamId}/players` | list envelope | players | 48 |
| OPTIONAL_MISSING | 404 | `/team/{teamId}/rankings` | error envelope | — | — |
| PASS | 200 | `/team/{teamId}/standings-seasons` | paginated list | uniqueTournamentSeasons | 2 |
| PASS | 200 | `/team/{teamId}/unique-tournaments` | paginated list | uniqueTournaments | 3 |
| PASS | 200 | `/teams` | paginated list | items | 5 |
| PASS | 200 | `/tournaments` | paginated list | items | 5 |
| PASS | 200 | `/unique-tournament/{tournamentId}` | competition object | — | — |
| PASS | 200 | `/unique-tournament/{tournamentId}/events` | paginated list | events | 10 |
| PASS | 200 | `/unique-tournament/{tournamentId}/scheduled-events/{date}` | paginated list | events | 1 |
| PASS | 200 | `/unique-tournament/{tournamentId}/season/{seasonId}/round/{round}` | paginated list | events | 10 |
| PASS | 200 | `/unique-tournament/{tournamentId}/season/{seasonId}/standings/{type}` | list envelope | standings | 1 |
| PASS | 200 | `/unique-tournament/{tournamentId}/seasons` | paginated list | seasons | 5 |

---

## Per-endpoint test results

### `/event/{eventId}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 4959 bytes
- **Request:** `event/67599823`
- **Expected data (test plan):** Full match: teams, status object, inning scores, venue, tournament.
- **Actual data returned:** match object · keys: `event` · nested: `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format`
- **Pagination:** N/A (not a paginated list)

### `/event/{eventId}/at-bats`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 1445 bytes
- **Request:** `event/67599823/at-bats` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated play-by-play: inning, pitcher, hitter, win probability.
- **Actual data returned:** paginated list · keys: `atBats, page, limit, total, totalPages, hasMore` · array `atBats` (n=5) · row fields: `sequence, inning, inningHalf, pitcher, hitter, winProbability, occurredAt`
- **Pagination:** page=1, limit=5, total=70, totalPages=14, hasMore=True

### `/event/{eventId}/best-players`

- **Verdict:** **OPTIONAL_MISSING** — Enrichment not on file for this entity (404).
- **HTTP:** 404 · **Response size:** 334 bytes
- **Request:** `event/67599823/best-players`
- **Expected data (test plan):** Optional enrichment: ranked players (often 404 on baseball).
- **Actual data returned:** error envelope · keys: `statusCode, message, error, details, path, timestamp, requestId`
- **Pagination:** N/A (not a paginated list)
- **API error body:** `NotFound` — Enrichment "best_players" for baseball match 67599823 was not found.

### `/event/{eventId}/enrichments`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 604 bytes
- **Request:** `event/67599823/enrichments`
- **Expected data (test plan):** Index of available match enrichment types.
- **Actual data returned:** list envelope · keys: `types` · array `types` (n=5) · row fields: `type, useCase`
- **Pagination:** N/A (not a paginated list)

### `/event/{eventId}/enrichments/{type}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 25222 bytes
- **Request:** `event/67599823/enrichments/h2h_events`
- **Expected data (test plan):** Payload for one enrichment type (e.g. h2h_events → events list).
- **Actual data returned:** paginated list · keys: `events, page, limit, total, totalPages, hasMore` · array `events` (n=10) · row fields: `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, format, homeScore, awayScore`
- **Pagination:** page=1, limit=10, total=219, totalPages=22, hasMore=True

### `/event/{eventId}/h2h`

- **Verdict:** **PASS_EMPTY** — 200 but teamDuel/managerDuel null — no H2H data for sample.
- **HTTP:** 200 · **Response size:** 36 bytes
- **Request:** `event/67599823/h2h`
- **Expected data (test plan):** Prior meetings: teamDuel / managerDuel or linked events.
- **Actual data returned:** object (teamDuel, managerDuel) · keys: `teamDuel, managerDuel`
- **Pagination:** N/A (not a paginated list)

### `/event/{eventId}/lineups`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 9069 bytes
- **Request:** `event/67599823/lineups`
- **Expected data (test plan):** home/away lineups: players, batting order, manager.
- **Actual data returned:** home/away split (lineups or similar) · keys: `home, away`
- **Pagination:** N/A (not a paginated list)

### `/event/{eventId}/player-statistics`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 32244 bytes
- **Request:** `event/67599823/player-statistics` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated box-score rows per player.
- **Actual data returned:** paginated list · keys: `playerStatistics, page, limit, total, totalPages, hasMore, coverage` · array `playerStatistics` (n=5) · row fields: `team, player, position, statistics`
- **Pagination:** page=1, limit=5, total=32, totalPages=7, hasMore=True

### `/event/{eventId}/player/{playerId}/statistics`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 3642 bytes
- **Request:** `event/67599823/player/39625815/statistics`
- **Expected data (test plan):** One player's stats for this match.
- **Actual data returned:** player object · keys: `team, player, position, statistics` · nested: `id, name, firstName, lastName, shortName, position, gender, height, jerseyNumber, userCount, dateOfBirthTimestamp, marketValueCurrency, proposedMarketValueRaw, fieldTranslations`
- **Pagination:** N/A (not a paginated list)

### `/event/{eventId}/pregame-form`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 463 bytes
- **Request:** `event/67599823/pregame-form`
- **Expected data (test plan):** Recent W/L form and sample event ids per team.
- **Actual data returned:** pregame form envelope · keys: `homeTeam, awayTeam`
- **Pagination:** N/A (not a paginated list)

### `/event/{eventId}/statistics`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 4716 bytes
- **Request:** `event/67599823/statistics`
- **Expected data (test plan):** Team comparison stats (batting/fielding groups).
- **Actual data returned:** list envelope · keys: `statistics, inconsistencies` · array `statistics` (n=1) · row fields: `period, groups`
- **Pagination:** N/A (not a paginated list)

### `/event/{eventId}/team-streaks`

- **Verdict:** **PASS_PARTIAL** — 200; streak structure present but buckets may be empty.
- **HTTP:** 200 · **Response size:** 111 bytes
- **Request:** `event/67599823/team-streaks`
- **Expected data (test plan):** Streak buckets (may be empty arrays).
- **Actual data returned:** object (general, generalPerLastX, generalTotal, head2head, head2HeadPerLastX, head2HeadTotal) · keys: `general, generalPerLastX, generalTotal, head2head, head2HeadPerLastX, head2HeadTotal`
- **Pagination:** N/A (not a paginated list)

### `/event/{eventId}/top-performers`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 541 bytes
- **Request:** `event/67599823/top-performers`
- **Expected data (test plan):** Top batters/performers with rating and key stats.
- **Actual data returned:** list envelope · keys: `topPerformers` · array `topPerformers` (n=3) · row fields: `role, player, teamId, rating, statistics`
- **Pagination:** N/A (not a paginated list)

### `/event/{eventId}/umpires`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 685 bytes
- **Request:** `event/67599823/umpires`
- **Expected data (test plan):** Umpire crew and plate assignments.
- **Actual data returned:** list envelope · keys: `umpires` · array `umpires` (n=6) · row fields: `umpire, assignment`
- **Pagination:** N/A (not a paginated list)

### `/event/{eventId}/weather`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 437 bytes
- **Request:** `event/67599823/weather`
- **Expected data (test plan):** conditions[] with temp, wind, humidity.
- **Actual data returned:** list envelope · keys: `conditions` · array `conditions` (n=2) · row fields: `temperature, generalCondition, condition, humidity, dewPoint, cloudCover, windSpeed, windDirection, isForecast, obsTime`
- **Pagination:** N/A (not a paginated list)

### `/events`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 1570 bytes
- **Request:** `events` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated items[] of matches; supports page/limit/status.
- **Actual data returned:** paginated list · keys: `items, page, limit, total, totalPages, hasMore` · array `items` (n=5) · row fields: `id, tournamentId, homeTeam, awayTeam, startTimestamp, status, homeScore, awayScore, seasonId, competitionName`
- **Pagination:** page=1, limit=5, total=18, totalPages=4, hasMore=True

### `/fixtures/today`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 1570 bytes
- **Request:** `fixtures/today` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated items[] for today's schedule.
- **Actual data returned:** paginated list · keys: `items, page, limit, total, totalPages, hasMore` · array `items` (n=5) · row fields: `id, tournamentId, homeTeam, awayTeam, startTimestamp, status, homeScore, awayScore, seasonId, competitionName`
- **Pagination:** page=1, limit=5, total=18, totalPages=4, hasMore=True

### `/manager/{managerId}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 132 bytes
- **Request:** `manager/62643844`
- **Expected data (test plan):** Manager profile object.
- **Actual data returned:** manager object · keys: `manager` · nested: `id, name, imageUrl`
- **Pagination:** N/A (not a paginated list)

### `/player/{playerId}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 624 bytes
- **Request:** `player/71698966`
- **Expected data (test plan):** Player profile object.
- **Actual data returned:** player object · keys: `player` · nested: `id, name, firstName, lastName, shortName, position, gender, height, jerseyNumber, userCount, dateOfBirthTimestamp, marketValueCurrency, proposedMarketValueRaw, fieldTranslations`
- **Pagination:** N/A (not a paginated list)

### `/player/{playerId}/events/{direction}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 25291 bytes
- **Request:** `player/71698966/events/last` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated events[] (last/next).
- **Actual data returned:** paginated list · keys: `events, page, limit, total, totalPages, hasMore` · array `events` (n=5) · row fields: `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format`
- **Pagination:** page=1, limit=5, total=1253, totalPages=251, hasMore=True

### `/players`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 467 bytes
- **Request:** `players` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated items[] player directory.
- **Actual data returned:** paginated list · keys: `items, page, limit, total, totalPages, hasMore` · array `items` (n=5) · row fields: `id, name, countryAlpha2, position`
- **Pagination:** page=1, limit=5, total=9758, totalPages=1952, hasMore=True

### `/search`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 161 bytes
- **Request:** `search` · query `{'page': 1, 'limit': 5, 'q': 'Yankees'}`
- **Expected data (test plan):** Paginated items[] typed hits (requires q).
- **Actual data returned:** paginated list · keys: `items, page, limit, total, totalPages, hasMore` · array `items` (n=1) · row fields: `type, id, name, countryAlpha2, gender`
- **Pagination:** page=1, limit=5, total=1, totalPages=1, hasMore=False

### `/team/{teamId}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 736 bytes
- **Request:** `team/84917477`
- **Expected data (test plan):** Team profile object.
- **Actual data returned:** team object · keys: `team` · nested: `id, name, shortName, fullName, nameCode, type, gender, national, disabled, userCount, sport, country, teamColors, fieldTranslations`
- **Pagination:** N/A (not a paginated list)

### `/team/{teamId}/enrichments`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 1084 bytes
- **Request:** `team/84917477/enrichments`
- **Expected data (test plan):** types[] of team-level enrichments.
- **Actual data returned:** list envelope · keys: `types` · array `types` (n=8) · row fields: `type, useCase`
- **Pagination:** N/A (not a paginated list)

### `/team/{teamId}/enrichments/{type}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 50291 bytes
- **Request:** `team/84917477/enrichments/events_last`
- **Expected data (test plan):** Data for one team enrichment (e.g. events_last).
- **Actual data returned:** paginated list · keys: `events, page, limit, total, totalPages, hasMore` · array `events` (n=10) · row fields: `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, format, homeScore, awayScore`
- **Pagination:** page=1, limit=10, total=30, totalPages=3, hasMore=True

### `/team/{teamId}/events/{direction}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 23784 bytes
- **Request:** `team/84917477/events/last` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated events[] team schedule.
- **Actual data returned:** paginated list · keys: `events, page, limit, total, totalPages, hasMore` · array `events` (n=5) · row fields: `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format`
- **Pagination:** page=1, limit=5, total=2123, totalPages=425, hasMore=True

### `/team/{teamId}/featured-event`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 4983 bytes
- **Request:** `team/84917477/featured-event`
- **Expected data (test plan):** Single highlighted event object.
- **Actual data returned:** match object · keys: `event` · nested: `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, format, homeScore, awayScore`
- **Pagination:** N/A (not a paginated list)

### `/team/{teamId}/media`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 1877 bytes
- **Request:** `team/84917477/media` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated media[] (highlights URLs).
- **Actual data returned:** paginated list · keys: `media, page, limit, total, totalPages, hasMore` · array `media` (n=5) · row fields: `title, subtitle, url, sourceUrl, thumbnailUrl, mediaType, doFollow, livestream, keyHighlight, createdAtTimestamp, forCountries`
- **Pagination:** page=1, limit=5, total=10, totalPages=2, hasMore=True

### `/team/{teamId}/near-events`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 5727 bytes
- **Request:** `team/84917477/near-events`
- **Expected data (test plan):** previousEvent / nextEvent envelope.
- **Actual data returned:** previous/next event envelope · keys: `previousEvent, nextEvent, sourceUpdatedAt`
- **Pagination:** N/A (not a paginated list)

### `/team/{teamId}/performance`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 34391 bytes
- **Request:** `team/84917477/performance` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** form, events, points with pagination.
- **Actual data returned:** paginated list · keys: `order, sampleSize, form, events, points, page, limit, total, totalPages, hasMore` · array `events` (n=5) · row fields: `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, format, homeScore, awayScore`
- **Pagination:** page=1, limit=5, total=20, totalPages=4, hasMore=True

### `/team/{teamId}/players`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 169606 bytes
- **Request:** `team/84917477/players`
- **Expected data (test plan):** players[] roster for team.
- **Actual data returned:** list envelope · keys: `players` · array `players` (n=48) · row fields: `player, position`
- **Pagination:** N/A (not a paginated list)

### `/team/{teamId}/rankings`

- **Verdict:** **OPTIONAL_MISSING** — Enrichment not on file for this entity (404).
- **HTTP:** 404 · **Response size:** 339 bytes
- **Request:** `team/84917477/rankings` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Optional enrichment rankings (often 404).
- **Actual data returned:** error envelope · keys: `statusCode, message, error, details, path, timestamp, requestId`
- **Pagination:** N/A (not a paginated list)
- **API error body:** `NotFound` — Enrichment "rankings" for baseball team 84917477 was not found.

### `/team/{teamId}/standings-seasons`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 12469 bytes
- **Request:** `team/84917477/standings-seasons` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Tournament/season groupings for standings.
- **Actual data returned:** paginated list · keys: `uniqueTournamentSeasons, tournamentSeasons, page, limit, total, totalPages, hasMore` · array `uniqueTournamentSeasons` (n=2) · row fields: `uniqueTournament, seasons`
- **Pagination:** page=1, limit=5, total=4, totalPages=1, hasMore=False

### `/team/{teamId}/unique-tournaments`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 2379 bytes
- **Request:** `team/84917477/unique-tournaments` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated uniqueTournaments[].
- **Actual data returned:** paginated list · keys: `uniqueTournaments, page, limit, total, totalPages, hasMore` · array `uniqueTournaments` (n=3) · row fields: `id, name, userCount, primaryColorHex, secondaryColorHex, category, fieldTranslations, hasPerformanceGraphFeature, hasEventPlayerStatistics, displayInverseHomeAwayTeams, tennisPoints`
- **Pagination:** page=1, limit=5, total=3, totalPages=1, hasMore=False

### `/teams`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 399 bytes
- **Request:** `teams` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated items[] team directory.
- **Actual data returned:** paginated list · keys: `items, page, limit, total, totalPages, hasMore` · array `items` (n=5) · row fields: `id, name, countryAlpha2`
- **Pagination:** page=1, limit=5, total=255, totalPages=51, hasMore=True

### `/tournaments`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 908 bytes
- **Request:** `tournaments` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated items[] competition directory.
- **Actual data returned:** paginated list · keys: `items, page, limit, total, totalPages, hasMore` · array `items` (n=5) · row fields: `id, name, categoryName, countryAlpha2, logoUrl`
- **Pagination:** page=1, limit=5, total=84, totalPages=17, hasMore=True

### `/unique-tournament/{tournamentId}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 782 bytes
- **Request:** `unique-tournament/53168725`
- **Expected data (test plan):** Competition metadata object.
- **Actual data returned:** competition object · keys: `uniqueTournament` · nested: `id, name, userCount, primaryColorHex, secondaryColorHex, category, fieldTranslations, hasPerformanceGraphFeature, hasEventPlayerStatistics, displayInverseHomeAwayTeams, tennisPoints`
- **Pagination:** N/A (not a paginated list)

### `/unique-tournament/{tournamentId}/events`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 44544 bytes
- **Request:** `unique-tournament/53168725/events`
- **Expected data (test plan):** Paginated events[] in competition.
- **Actual data returned:** paginated list · keys: `events, page, limit, total, totalPages, hasMore` · array `events` (n=10) · row fields: `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format`
- **Pagination:** page=1, limit=10, total=29267, totalPages=2927, hasMore=True

### `/unique-tournament/{tournamentId}/scheduled-events/{date}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 4014 bytes
- **Request:** `unique-tournament/53168725/scheduled-events/2026-10-21`
- **Expected data (test plan):** Events on a calendar date.
- **Actual data returned:** paginated list · keys: `events, page, limit, total, totalPages, hasMore` · array `events` (n=1) · row fields: `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format`
- **Pagination:** page=1, limit=10, total=1, totalPages=1, hasMore=False

### `/unique-tournament/{tournamentId}/season/{seasonId}/round/{round}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 48566 bytes
- **Request:** `unique-tournament/53168725/season/68144200/round/1`
- **Expected data (test plan):** Events for a season round.
- **Actual data returned:** paginated list · keys: `events, page, limit, total, totalPages, hasMore` · array `events` (n=10) · row fields: `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format`
- **Pagination:** page=1, limit=10, total=2458, totalPages=246, hasMore=True

### `/unique-tournament/{tournamentId}/season/{seasonId}/standings/{type}`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 38810 bytes
- **Request:** `unique-tournament/53168725/season/68144200/standings/total`
- **Expected data (test plan):** standings[] table (total/home/away).
- **Actual data returned:** list envelope · keys: `standings` · array `standings` (n=1) · row fields: `type, descriptions, rows`
- **Pagination:** N/A (not a paginated list)

### `/unique-tournament/{tournamentId}/seasons`

- **Verdict:** **PASS** — 200 with parseable payload matching expected shape.
- **HTTP:** 200 · **Response size:** 415 bytes
- **Request:** `unique-tournament/53168725/seasons` · query `{'page': 1, 'limit': 5}`
- **Expected data (test plan):** Paginated seasons[].
- **Actual data returned:** paginated list · keys: `seasons, page, limit, total, totalPages, hasMore, currentSeasonId` · array `seasons` (n=5) · row fields: `id, name, year, editor`
- **Pagination:** page=1, limit=5, total=24, totalPages=5, hasMore=True

---

## Additional API tests (beyond 42-route catalog)

### events status=finished

- **Verdict:** **FAIL_DATA** — Global /events filter returns total=0 while team history has finished games — investigate filter or indexing.
- **HTTP:** 200 · **Path:** `events` · params `{'page': 1, 'limit': 5, 'status': 'finished'}`
- **Response:** paginated list · page=1, limit=5, total=0, totalPages=0, hasMore=False
- **List:** `items` count=0

### events status=inprogress

- **Verdict:** **FAIL_DATA** — Global /events filter returns total=0 while team history has finished games — investigate filter or indexing.
- **HTTP:** 200 · **Path:** `events` · params `{'page': 1, 'limit': 5, 'status': 'inprogress'}`
- **Response:** paginated list · page=1, limit=5, total=0, totalPages=0, hasMore=False
- **List:** `items` count=0

### events page=9999

- **Verdict:** **PASS_EMPTY** — Out-of-range page returns empty items with total unchanged (not 404).
- **HTTP:** 200 · **Path:** `events` · params `{'page': 9999, 'limit': 5}`
- **Response:** paginated list · page=9999, limit=5, total=18, totalPages=4, hasMore=False
- **List:** `items` count=0

### events page=2 differs from page=1

- **Verdict:** **PASS** — Page 2 first id (56340050) differs from page 1 (28606880).
- **HTTP:** 200 · **Path:** `events` · params `{'page': 2, 'limit': 5}`
- **Response:** paginated list · page=2, limit=5, total=18, totalPages=4, hasMore=True
- **List:** `items` count=5
- **Pagination check:** `{'page1FirstId': 28606880, 'page2FirstId': 56340050, 'differentPages': True}`

### search missing q

- **Verdict:** **EXPECTED** — Correct rejection when q is missing on /search.
- **HTTP:** 400 · **Path:** `search` · params `{'page': 1, 'limit': 5}`
- **Response:** error envelope · N/A (not a paginated list)

### event id non-numeric

- **Verdict:** **EXPECTED** — Correct rejection when q is missing on /search.
- **HTTP:** 400 · **Path:** `event/abc` · params `None`
- **Response:** error envelope · N/A (not a paginated list)

### event id unknown

- **Verdict:** **EXPECTED** — Unknown numeric event id should return 404.
- **HTTP:** 404 · **Path:** `event/999999999` · params `None`
- **Response:** error envelope · N/A (not a paginated list)

### standings home

- **Verdict:** **PASS_EMPTY** — 200 but standings rows empty for home/away split in this season.
- **HTTP:** 200 · **Path:** `unique-tournament/53168725/season/68144200/standings/home` · params `None`
- **Response:** list envelope · N/A (not a paginated list)
- **List:** `standings` count=1

### standings away

- **Verdict:** **PASS_EMPTY** — 200 but standings rows empty for home/away split in this season.
- **HTTP:** 200 · **Path:** `unique-tournament/53168725/season/68144200/standings/away` · params `None`
- **Response:** list envelope · N/A (not a paginated list)
- **List:** `standings` count=1

### player events next

- **Verdict:** **PASS_EMPTY**
- **HTTP:** 200 · **Path:** `player/71698966/events/next` · params `{'page': 1, 'limit': 5}`
- **Response:** paginated list · page=1, limit=5, total=0, totalPages=0, hasMore=False
- **List:** `events` count=0

### team events next

- **Verdict:** **PASS_EMPTY**
- **HTTP:** 200 · **Path:** `team/84917477/events/next` · params `{'page': 1, 'limit': 5}`
- **Response:** paginated list · page=1, limit=5, total=0, totalPages=0, hasMore=False
- **List:** `events` count=0

---

## Variation testing (different data & page 2000)

Extended tests (multiple event states, teams, players, status filters, enrichment types, **page 2000**) are documented in:

**[`baseball_api_variation_testing.md`](./baseball_api_variation_testing.md)** · evidence: [`../data/baseball-variation-tests.json`](../data/baseball-variation-tests.json)

**Short answer on page 2000:** If `page` ≤ `totalPages`, you get **real rows** (e.g. MLB `/unique-tournament/.../events?page=2000` → 10 events). If `page` > `totalPages`, API returns **HTTP 200 with an empty list** — not fake placeholder objects, but **`total` / `totalPages` are not cleared** (same as page 9999). **`limit=2000`** is rejected with **400**, not 200.

The original 42-route pass used **one primary finished event** (67599823); variation tests add **canceled** (82011329) and **notstarted** (28606880) plus a second team/player.

---

## Regenerate this report

```bash
python3 scripts/probe_all_endpoints.py
python3 scripts/generate_api_testing_report.py
```
