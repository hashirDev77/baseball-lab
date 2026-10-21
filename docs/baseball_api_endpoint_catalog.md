# Baseball API — Endpoint Response Catalog

Live probe of all **42** SportsAPI365 msdata baseball routes (`/v1/baseball/...`).
Use this before building the Baseball Product UI: it records **HTTP status**, **response shape**, **list keys**, **pagination**, and **ID dependencies**.

- **Generated:** 2026-10-21T12:31:40.219870+00:00
- **Evidence file:** [`../data/baseball-endpoint-evidence.json`](../data/baseball-endpoint-evidence.json)
- **Route source:** [`../data/baseball-routes.json`](../data/baseball-routes.json) (from `jjrm365-multi-sport-routes.json` → baseball, count 42)

> **Note:** Basketball (lines 52–99 in the same JSON) adds `incidents`, `injuries`, and season statistics routes that **baseball does not expose**. Baseball adds **`at-bats`**, **`top-performers`**, and **`umpires`** on the match.

---

## Auth and base URL

| Header | Role |
| --- | --- |
| `x-apim-key` | APIM gateway key |
| `X-Live-Key` | Live feed key |
| `accept: application/json` | Required for JSON bodies |

Base: `https://sports-api.sportsdata365.com/msdata` + `/v1/baseball/{path}`.

---

## IDs used in this probe (dependency chain)

Most routes need IDs from earlier calls. Recommended discovery order:

1. **`GET /search?q=Yankees`** → `teamId` (84917477)
2. **`GET /search?q=Ohtani`** → `playerId` (71698966)
3. **`GET /search?q=MLB`** → `uniqueTournamentId` / `tournamentId` (53168725)
4. **`GET /team/{teamId}/events/last`** → pick a **`status.type === finished`** row → `eventId` (67599823)
5. **`GET /event/{eventId}/lineups`** → `playerId` for per-player match stats; **`manager.id`** on away side (62643844 for sample game)
6. **`GET /unique-tournament/{tournamentId}/seasons`** → `seasonId` (68144200)
7. **`GET /event/{eventId}/enrichments`** → first `types[].type` for `.../enrichments/{type}` (e.g. `h2h_events`)
8. **`GET /team/{teamId}/enrichments`** → first type for team enrichments (e.g. `events_last`)

Probe snapshot:

```json
{
  "eventId": 67599823,
  "teamId": 84917477,
  "playerId": 71698966,
  "lineupPlayerId": 39625815,
  "tournamentId": 53168725,
  "seasonId": 68144200,
  "managerId": 62643844,
  "enrichmentType": "h2h_events",
  "teamEnrichmentType": "events_last",
  "date": "2026-10-21"
}
```

**Manager route:** probe had no home `manager` on the sample lineups; use **`managerId` from lineups** (away manager present on event 67599823). Calling `/manager/{managerId}` without a numeric id returns **400**.

---

## Quick reference (all 42 routes)

| HTTP | Route                                                                | Response kind                                 | List key                | Pagination |
| ---- | -------------------------------------------------------------------- | --------------------------------------------- | ----------------------- | ---------- |
| 200  | /event/{eventId}                                                     | match object                                  | —                       | —          |
| 200  | /event/{eventId}/at-bats                                             | paginated list                                | atBats                  | yes        |
| 404  | /event/{eventId}/best-players                                        | error envelope                                | —                       | —          |
| 200  | /event/{eventId}/enrichments                                         | list envelope                                 | types                   | —          |
| 200  | /event/{eventId}/enrichments/{type}                                  | paginated list                                | events                  | yes        |
| 200  | /event/{eventId}/h2h                                                 | object (teamDuel, managerDuel)                | —                       | —          |
| 200  | /event/{eventId}/lineups                                             | home/away split (lineups or similar)          | —                       | —          |
| 200  | /event/{eventId}/player-statistics                                   | paginated list                                | playerStatistics        | yes        |
| 200  | /event/{eventId}/player/{playerId}/statistics                        | player object                                 | —                       | —          |
| 200  | /event/{eventId}/pregame-form                                        | pregame form envelope                         | —                       | —          |
| 200  | /event/{eventId}/statistics                                          | list envelope                                 | statistics              | —          |
| 200  | /event/{eventId}/team-streaks                                        | object (general, generalPerLastX, generalTota | —                       | —          |
| 200  | /event/{eventId}/top-performers                                      | list envelope                                 | topPerformers           | —          |
| 200  | /event/{eventId}/umpires                                             | list envelope                                 | umpires                 | —          |
| 200  | /event/{eventId}/weather                                             | list envelope                                 | conditions              | —          |
| 200  | /events                                                              | paginated list                                | items                   | yes        |
| 200  | /fixtures/today                                                      | paginated list                                | items                   | yes        |
| 200  | /manager/{managerId}                                                 | manager object                                | —                       | —          |
| 200  | /player/{playerId}                                                   | player object                                 | —                       | —          |
| 200  | /player/{playerId}/events/{direction}                                | paginated list                                | events                  | yes        |
| 200  | /players                                                             | paginated list                                | items                   | yes        |
| 200  | /search                                                              | paginated list                                | items                   | yes        |
| 200  | /team/{teamId}                                                       | team object                                   | —                       | —          |
| 200  | /team/{teamId}/enrichments                                           | list envelope                                 | types                   | —          |
| 200  | /team/{teamId}/enrichments/{type}                                    | paginated list                                | events                  | yes        |
| 200  | /team/{teamId}/events/{direction}                                    | paginated list                                | events                  | yes        |
| 200  | /team/{teamId}/featured-event                                        | match object                                  | —                       | —          |
| 200  | /team/{teamId}/media                                                 | paginated list                                | media                   | yes        |
| 200  | /team/{teamId}/near-events                                           | previous/next event envelope                  | —                       | —          |
| 200  | /team/{teamId}/performance                                           | paginated list                                | events                  | yes        |
| 200  | /team/{teamId}/players                                               | list envelope                                 | players                 | —          |
| 404  | /team/{teamId}/rankings                                              | error envelope                                | —                       | —          |
| 200  | /team/{teamId}/standings-seasons                                     | paginated list                                | uniqueTournamentSeasons | yes        |
| 200  | /team/{teamId}/unique-tournaments                                    | paginated list                                | uniqueTournaments       | yes        |
| 200  | /teams                                                               | paginated list                                | items                   | yes        |
| 200  | /tournaments                                                         | paginated list                                | items                   | yes        |
| 200  | /unique-tournament/{tournamentId}                                    | competition object                            | —                       | —          |
| 200  | /unique-tournament/{tournamentId}/events                             | paginated list                                | events                  | yes        |
| 200  | /unique-tournament/{tournamentId}/scheduled-events/{date}            | paginated list                                | events                  | yes        |
| 200  | /unique-tournament/{tournamentId}/season/{seasonId}/round/{round}    | paginated list                                | events                  | yes        |
| 200  | /unique-tournament/{tournamentId}/season/{seasonId}/standings/{type} | list envelope                                 | standings               | —          |
| 200  | /unique-tournament/{tournamentId}/seasons                            | paginated list                                | seasons                 | yes        |

---

## Per-endpoint detail

### `/v1/baseball/event/{eventId}`

- **Called:** `event/67599823`
- **HTTP:** 200 · **Size:** 4959 bytes
- **Response kind:** match object
- **Top-level keys:** `event`
- **Wrapped object keys (sample):** `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format, winnerCode, venue, time, hasGlobalHighlights`…

### `/v1/baseball/event/{eventId}/at-bats`

- **Called:** `event/67599823/at-bats` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 1445 bytes
- **Response kind:** paginated list
- **Top-level keys:** `atBats, page, limit, total, totalPages, hasMore`
- **Primary list:** `atBats` (count in probe: 5)
- **Sample row keys:** `sequence, inning, inningHalf, pitcher, hitter, winProbability, occurredAt`…
- **Pagination:** page=1, limit=5, total=70, totalPages=14, hasMore=True

### `/v1/baseball/event/{eventId}/best-players`

- **Called:** `event/67599823/best-players`
- **HTTP:** 404 · **Size:** 334 bytes
- **Error message:** Enrichment "best_players" for baseball match 67599823 was not found.
- **Response kind:** error envelope
- **Top-level keys:** `statusCode, message, error, details, path, timestamp, requestId`
- **API error:** `NotFound` — Enrichment "best_players" for baseball match 67599823 was not found.

### `/v1/baseball/event/{eventId}/enrichments`

- **Called:** `event/67599823/enrichments`
- **HTTP:** 200 · **Size:** 604 bytes
- **Response kind:** list envelope
- **Top-level keys:** `types`
- **Primary list:** `types` (count in probe: 5)
- **Sample row keys:** `type, useCase`…

### `/v1/baseball/event/{eventId}/enrichments/{type}`

- **Called:** `event/67599823/enrichments/h2h_events`
- **HTTP:** 200 · **Size:** 25222 bytes
- **Response kind:** paginated list
- **Top-level keys:** `events, page, limit, total, totalPages, hasMore`
- **Primary list:** `events` (count in probe: 10)
- **Sample row keys:** `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, format, homeScore, awayScore, winnerCode, venue, time, hasGlobalHighlights`…
- **Pagination:** page=1, limit=10, total=219, totalPages=22, hasMore=True

### `/v1/baseball/event/{eventId}/h2h`

- **Called:** `event/67599823/h2h`
- **HTTP:** 200 · **Size:** 36 bytes
- **Response kind:** object (teamDuel, managerDuel)
- **Top-level keys:** `teamDuel, managerDuel`

### `/v1/baseball/event/{eventId}/lineups`

- **Called:** `event/67599823/lineups`
- **HTTP:** 200 · **Size:** 9069 bytes
- **Response kind:** home/away split (lineups or similar)
- **Top-level keys:** `home, away`

### `/v1/baseball/event/{eventId}/player-statistics`

- **Called:** `event/67599823/player-statistics` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 32244 bytes
- **Response kind:** paginated list
- **Top-level keys:** `playerStatistics, page, limit, total, totalPages, hasMore, coverage`
- **Primary list:** `playerStatistics` (count in probe: 5)
- **Sample row keys:** `team, player, position, statistics`…
- **Pagination:** page=1, limit=5, total=32, totalPages=7, hasMore=True

### `/v1/baseball/event/{eventId}/player/{playerId}/statistics`

- **Called:** `event/67599823/player/39625815/statistics`
- **HTTP:** 200 · **Size:** 3642 bytes
- **Response kind:** player object
- **Top-level keys:** `team, player, position, statistics`
- **Wrapped object keys (sample):** `id, name, firstName, lastName, shortName, position, gender, height, jerseyNumber, userCount, dateOfBirthTimestamp, marketValueCurrency, proposedMarketValueRaw, fieldTranslations, team`…

### `/v1/baseball/event/{eventId}/pregame-form`

- **Called:** `event/67599823/pregame-form`
- **HTTP:** 200 · **Size:** 463 bytes
- **Response kind:** pregame form envelope
- **Top-level keys:** `homeTeam, awayTeam`

### `/v1/baseball/event/{eventId}/statistics`

- **Called:** `event/67599823/statistics`
- **HTTP:** 200 · **Size:** 4716 bytes
- **Response kind:** list envelope
- **Top-level keys:** `statistics, inconsistencies`
- **Primary list:** `statistics` (count in probe: 1)
- **Sample row keys:** `period, groups`…

### `/v1/baseball/event/{eventId}/team-streaks`

- **Called:** `event/67599823/team-streaks`
- **HTTP:** 200 · **Size:** 111 bytes
- **Response kind:** object (general, generalPerLastX, generalTotal, head2head, head2HeadPerLastX, head2HeadTotal)
- **Top-level keys:** `general, generalPerLastX, generalTotal, head2head, head2HeadPerLastX, head2HeadTotal`

### `/v1/baseball/event/{eventId}/top-performers`

- **Called:** `event/67599823/top-performers`
- **HTTP:** 200 · **Size:** 541 bytes
- **Response kind:** list envelope
- **Top-level keys:** `topPerformers`
- **Primary list:** `topPerformers` (count in probe: 3)
- **Sample row keys:** `role, player, teamId, rating, statistics`…

### `/v1/baseball/event/{eventId}/umpires`

- **Called:** `event/67599823/umpires`
- **HTTP:** 200 · **Size:** 685 bytes
- **Response kind:** list envelope
- **Top-level keys:** `umpires`
- **Primary list:** `umpires` (count in probe: 6)
- **Sample row keys:** `umpire, assignment`…

### `/v1/baseball/event/{eventId}/weather`

- **Called:** `event/67599823/weather`
- **HTTP:** 200 · **Size:** 437 bytes
- **Response kind:** list envelope
- **Top-level keys:** `conditions`
- **Primary list:** `conditions` (count in probe: 2)
- **Sample row keys:** `temperature, generalCondition, condition, humidity, dewPoint, cloudCover, windSpeed, windDirection, isForecast, obsTime`…

### `/v1/baseball/events`

- **Called:** `events` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 1570 bytes
- **Response kind:** paginated list
- **Top-level keys:** `items, page, limit, total, totalPages, hasMore`
- **Primary list:** `items` (count in probe: 5)
- **Sample row keys:** `id, tournamentId, homeTeam, awayTeam, startTimestamp, status, homeScore, awayScore, seasonId, competitionName`…
- **Pagination:** page=1, limit=5, total=18, totalPages=4, hasMore=True

### `/v1/baseball/fixtures/today`

- **Called:** `fixtures/today` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 1570 bytes
- **Response kind:** paginated list
- **Top-level keys:** `items, page, limit, total, totalPages, hasMore`
- **Primary list:** `items` (count in probe: 5)
- **Sample row keys:** `id, tournamentId, homeTeam, awayTeam, startTimestamp, status, homeScore, awayScore, seasonId, competitionName`…
- **Pagination:** page=1, limit=5, total=18, totalPages=4, hasMore=True

### `/v1/baseball/manager/{managerId}`

- **Called:** `manager/62643844`
- **HTTP:** 200 · **Size:** 132 bytes
- **Response kind:** manager object
- **Top-level keys:** `manager`
- **Wrapped object keys (sample):** `id, name, imageUrl`…

### `/v1/baseball/player/{playerId}`

- **Called:** `player/71698966`
- **HTTP:** 200 · **Size:** 624 bytes
- **Response kind:** player object
- **Top-level keys:** `player`
- **Wrapped object keys (sample):** `id, name, firstName, lastName, shortName, position, gender, height, jerseyNumber, userCount, dateOfBirthTimestamp, marketValueCurrency, proposedMarketValueRaw, fieldTranslations, team`…

### `/v1/baseball/player/{playerId}/events/{direction}`

- **Called:** `player/71698966/events/last` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 25291 bytes
- **Response kind:** paginated list
- **Top-level keys:** `events, page, limit, total, totalPages, hasMore`
- **Primary list:** `events` (count in probe: 5)
- **Sample row keys:** `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format, winnerCode, venue, time, hasGlobalHighlights`…
- **Pagination:** page=1, limit=5, total=1253, totalPages=251, hasMore=True

### `/v1/baseball/players`

- **Called:** `players` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 467 bytes
- **Response kind:** paginated list
- **Top-level keys:** `items, page, limit, total, totalPages, hasMore`
- **Primary list:** `items` (count in probe: 5)
- **Sample row keys:** `id, name, countryAlpha2, position`…
- **Pagination:** page=1, limit=5, total=9758, totalPages=1952, hasMore=True

### `/v1/baseball/search`

- **Called:** `search` ? `{'page': 1, 'limit': 5, 'q': 'Yankees'}`
- **HTTP:** 200 · **Size:** 161 bytes
- **Response kind:** paginated list
- **Top-level keys:** `items, page, limit, total, totalPages, hasMore`
- **Primary list:** `items` (count in probe: 1)
- **Sample row keys:** `type, id, name, countryAlpha2, gender`…
- **Pagination:** page=1, limit=5, total=1, totalPages=1, hasMore=False

### `/v1/baseball/team/{teamId}`

- **Called:** `team/84917477`
- **HTTP:** 200 · **Size:** 736 bytes
- **Response kind:** team object
- **Top-level keys:** `team`
- **Wrapped object keys (sample):** `id, name, shortName, fullName, nameCode, type, gender, national, disabled, userCount, sport, country, teamColors, fieldTranslations, venue, category, tournament, primaryUniqueTournament`…

### `/v1/baseball/team/{teamId}/enrichments`

- **Called:** `team/84917477/enrichments`
- **HTTP:** 200 · **Size:** 1084 bytes
- **Response kind:** list envelope
- **Top-level keys:** `types`
- **Primary list:** `types` (count in probe: 8)
- **Sample row keys:** `type, useCase`…

### `/v1/baseball/team/{teamId}/enrichments/{type}`

- **Called:** `team/84917477/enrichments/events_last`
- **HTTP:** 200 · **Size:** 50291 bytes
- **Response kind:** paginated list
- **Top-level keys:** `events, page, limit, total, totalPages, hasMore`
- **Primary list:** `events` (count in probe: 10)
- **Sample row keys:** `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, format, homeScore, awayScore, winnerCode, venue, time, hasGlobalHighlights`…
- **Pagination:** page=1, limit=10, total=30, totalPages=3, hasMore=True

### `/v1/baseball/team/{teamId}/events/{direction}`

- **Called:** `team/84917477/events/last` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 23784 bytes
- **Response kind:** paginated list
- **Top-level keys:** `events, page, limit, total, totalPages, hasMore`
- **Primary list:** `events` (count in probe: 5)
- **Sample row keys:** `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format, winnerCode, venue, time, hasGlobalHighlights`…
- **Pagination:** page=1, limit=5, total=2123, totalPages=425, hasMore=True

### `/v1/baseball/team/{teamId}/featured-event`

- **Called:** `team/84917477/featured-event`
- **HTTP:** 200 · **Size:** 4983 bytes
- **Response kind:** match object
- **Top-level keys:** `event`
- **Wrapped object keys (sample):** `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, format, homeScore, awayScore, winnerCode, venue, time, hasGlobalHighlights`…

### `/v1/baseball/team/{teamId}/media`

- **Called:** `team/84917477/media` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 1877 bytes
- **Response kind:** paginated list
- **Top-level keys:** `media, page, limit, total, totalPages, hasMore`
- **Primary list:** `media` (count in probe: 5)
- **Sample row keys:** `title, subtitle, url, sourceUrl, thumbnailUrl, mediaType, doFollow, livestream, keyHighlight, createdAtTimestamp, forCountries`…
- **Pagination:** page=1, limit=5, total=10, totalPages=2, hasMore=True

### `/v1/baseball/team/{teamId}/near-events`

- **Called:** `team/84917477/near-events`
- **HTTP:** 200 · **Size:** 5727 bytes
- **Response kind:** previous/next event envelope
- **Top-level keys:** `previousEvent, nextEvent, sourceUpdatedAt`

### `/v1/baseball/team/{teamId}/performance`

- **Called:** `team/84917477/performance` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 34391 bytes
- **Response kind:** paginated list
- **Top-level keys:** `order, sampleSize, form, events, points, page, limit, total, totalPages, hasMore`
- **Primary list:** `events` (count in probe: 5)
- **Sample row keys:** `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, format, homeScore, awayScore, winnerCode, venue, time, hasGlobalHighlights`…
- **Pagination:** page=1, limit=5, total=20, totalPages=4, hasMore=True

### `/v1/baseball/team/{teamId}/players`

- **Called:** `team/84917477/players`
- **HTTP:** 200 · **Size:** 169606 bytes
- **Response kind:** list envelope
- **Top-level keys:** `players`
- **Primary list:** `players` (count in probe: 48)
- **Sample row keys:** `player, position`…

### `/v1/baseball/team/{teamId}/rankings`

- **Called:** `team/84917477/rankings` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 404 · **Size:** 339 bytes
- **Error message:** Enrichment "rankings" for baseball team 84917477 was not found.
- **Response kind:** error envelope
- **Top-level keys:** `statusCode, message, error, details, path, timestamp, requestId`
- **API error:** `NotFound` — Enrichment "rankings" for baseball team 84917477 was not found.

### `/v1/baseball/team/{teamId}/standings-seasons`

- **Called:** `team/84917477/standings-seasons` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 12469 bytes
- **Response kind:** paginated list
- **Top-level keys:** `uniqueTournamentSeasons, tournamentSeasons, page, limit, total, totalPages, hasMore`
- **Primary list:** `uniqueTournamentSeasons` (count in probe: 2)
- **Sample row keys:** `uniqueTournament, seasons`…
- **Pagination:** page=1, limit=5, total=4, totalPages=1, hasMore=False

### `/v1/baseball/team/{teamId}/unique-tournaments`

- **Called:** `team/84917477/unique-tournaments` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 2379 bytes
- **Response kind:** paginated list
- **Top-level keys:** `uniqueTournaments, page, limit, total, totalPages, hasMore`
- **Primary list:** `uniqueTournaments` (count in probe: 3)
- **Sample row keys:** `id, name, userCount, primaryColorHex, secondaryColorHex, category, fieldTranslations, hasPerformanceGraphFeature, hasEventPlayerStatistics, displayInverseHomeAwayTeams, tennisPoints`…
- **Pagination:** page=1, limit=5, total=3, totalPages=1, hasMore=False

### `/v1/baseball/teams`

- **Called:** `teams` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 399 bytes
- **Response kind:** paginated list
- **Top-level keys:** `items, page, limit, total, totalPages, hasMore`
- **Primary list:** `items` (count in probe: 5)
- **Sample row keys:** `id, name, countryAlpha2`…
- **Pagination:** page=1, limit=5, total=255, totalPages=51, hasMore=True

### `/v1/baseball/tournaments`

- **Called:** `tournaments` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 908 bytes
- **Response kind:** paginated list
- **Top-level keys:** `items, page, limit, total, totalPages, hasMore`
- **Primary list:** `items` (count in probe: 5)
- **Sample row keys:** `id, name, categoryName, countryAlpha2, logoUrl`…
- **Pagination:** page=1, limit=5, total=84, totalPages=17, hasMore=True

### `/v1/baseball/unique-tournament/{tournamentId}`

- **Called:** `unique-tournament/53168725`
- **HTTP:** 200 · **Size:** 782 bytes
- **Response kind:** competition object
- **Top-level keys:** `uniqueTournament`
- **Wrapped object keys (sample):** `id, name, userCount, primaryColorHex, secondaryColorHex, category, fieldTranslations, hasPerformanceGraphFeature, hasEventPlayerStatistics, displayInverseHomeAwayTeams, tennisPoints`…

### `/v1/baseball/unique-tournament/{tournamentId}/events`

- **Called:** `unique-tournament/53168725/events`
- **HTTP:** 200 · **Size:** 44544 bytes
- **Response kind:** paginated list
- **Top-level keys:** `events, page, limit, total, totalPages, hasMore`
- **Primary list:** `events` (count in probe: 10)
- **Sample row keys:** `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format, winnerCode, venue, time, hasGlobalHighlights`…
- **Pagination:** page=1, limit=10, total=29267, totalPages=2927, hasMore=True

### `/v1/baseball/unique-tournament/{tournamentId}/scheduled-events/{date}`

- **Called:** `unique-tournament/53168725/scheduled-events/2026-10-21`
- **HTTP:** 200 · **Size:** 4014 bytes
- **Response kind:** paginated list
- **Top-level keys:** `events, page, limit, total, totalPages, hasMore`
- **Primary list:** `events` (count in probe: 1)
- **Sample row keys:** `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format, winnerCode, venue, time, hasGlobalHighlights`…
- **Pagination:** page=1, limit=10, total=1, totalPages=1, hasMore=False

### `/v1/baseball/unique-tournament/{tournamentId}/season/{seasonId}/round/{round}`

- **Called:** `unique-tournament/53168725/season/68144200/round/1`
- **HTTP:** 200 · **Size:** 48566 bytes
- **Response kind:** paginated list
- **Top-level keys:** `events, page, limit, total, totalPages, hasMore`
- **Primary list:** `events` (count in probe: 10)
- **Sample row keys:** `id, homeTeam, awayTeam, tournament, season, roundInfo, status, statusType, startTimestamp, endTimestamp, sourceUpdatedAt, homeScore, awayScore, format, winnerCode, venue, time, hasGlobalHighlights`…
- **Pagination:** page=1, limit=10, total=2458, totalPages=246, hasMore=True

### `/v1/baseball/unique-tournament/{tournamentId}/season/{seasonId}/standings/{type}`

- **Called:** `unique-tournament/53168725/season/68144200/standings/total`
- **HTTP:** 200 · **Size:** 38810 bytes
- **Response kind:** list envelope
- **Top-level keys:** `standings`
- **Primary list:** `standings` (count in probe: 1)
- **Sample row keys:** `type, descriptions, rows`…

### `/v1/baseball/unique-tournament/{tournamentId}/seasons`

- **Called:** `unique-tournament/53168725/seasons` ? `{'page': 1, 'limit': 5}`
- **HTTP:** 200 · **Size:** 415 bytes
- **Response kind:** paginated list
- **Top-level keys:** `seasons, page, limit, total, totalPages, hasMore, currentSeasonId`
- **Primary list:** `seasons` (count in probe: 5)
- **Sample row keys:** `id, name, year, editor`…
- **Pagination:** page=1, limit=5, total=24, totalPages=5, hasMore=True

---

## Extra API-level checks (not separate catalog routes)

- **events status=finished** — HTTP 200, `paginated list`
  - Pagination: {'page': 1, 'limit': 5, 'total': 0, 'totalPages': 0, 'hasMore': False}
  - List count: 0
- **events status=inprogress** — HTTP 200, `paginated list`
  - Pagination: {'page': 1, 'limit': 5, 'total': 0, 'totalPages': 0, 'hasMore': False}
  - List count: 0
- **events page=9999** — HTTP 200, `paginated list`
  - Pagination: {'page': 9999, 'limit': 5, 'total': 18, 'totalPages': 4, 'hasMore': False}
  - List count: 0
- **events page=2 differs from page=1** — HTTP 200, `paginated list`
  - Pagination: {'page': 2, 'limit': 5, 'total': 18, 'totalPages': 4, 'hasMore': True}
  - List count: 5
- **search missing q** — HTTP 400, `error envelope`
- **event id non-numeric** — HTTP 400, `error envelope`
- **event id unknown** — HTTP 404, `error envelope`
- **standings home** — HTTP 200, `list envelope`
  - List count: 1
- **standings away** — HTTP 200, `list envelope`
  - List count: 1
- **player events next** — HTTP 200, `paginated list`
  - Pagination: {'page': 1, 'limit': 5, 'total': 0, 'totalPages': 0, 'hasMore': False}
  - List count: 0
- **team events next** — HTTP 200, `paginated list`
  - Pagination: {'page': 1, 'limit': 5, 'total': 0, 'totalPages': 0, 'hasMore': False}
  - List count: 0

---

## Cross-cutting findings for product / QA

### List envelope inconsistency

| Endpoint family | Array key | Pagination fields |
| --- | --- | --- |
| `/events`, `/fixtures/today`, `/teams`, `/players`, `/tournaments`, `/search` | `items` | `page`, `limit`, `total`, `totalPages`, `hasMore` |
| `/team/.../events/*`, `/player/.../events/*`, `/unique-tournament/.../events` | `events` | same pagination fields |

### Status and score shape

- **List rows** (`items`): `status` is often a **string** (`notstarted`); `homeScore` / `awayScore` may show **series** only during postseason (e.g. `{ "series": 4 }`), not full R/H/E.
- **Event detail** and **team event lists**: `status` is an **object** `{ code, type, description }`; scores include `current`, `display`, per-inning `innings`, and `inningsBaseball` `{ run, hits, errors }`.

### Filters and empty feeds

- **`GET /events?status=finished`** and **`?status=inprogress`** returned **`total: 0`** while **`GET /team/{id}/events/last`** had 2000+ finished games — do not use global `/events` alone for Results/Live tabs without verifying filters.
- **`GET /events?page=9999`** returns **200** with empty `items` but **`total` still 18** and **`totalPages` 4** — treat as empty page, not 404.
- **`GET /search`** without `q` → **400** (validation).

### Optional enrichments (404 vs empty 200)

- **`/event/{id}/best-players`** → **404** `ENRICHMENT_NOT_FOUND` on probed finished MLB game (use **`top-performers`** instead).
- **`/team/{id}/rankings`** → **404** enrichment not found for Yankees sample.
- Prefer **`GET .../enrichments`** first, then call **`.../enrichments/{type}`** with a listed type.

### Standings types

- **`standings/total`**: full table (~90 MLB rows) with `wins`, `losses`, `winPercentage`, `gamesBehind`, etc.
- **`standings/home`** and **`standings/away`**: **200** but **empty `rows`** in probe — confirm with API team before shipping split tables.

### Baseball-only match data

- **`/at-bats`**: paginated `atBats[]` — inning, half, pitcher/hitter ids, win probability, `occurredAt`.
- **`/top-performers`**: `topPerformers[]` with role `batter`, rating, batting stat subset.
- **`/umpires`**: `umpires[]` with assignment (HP, 1B, …).
- **`/h2h`**: `{ teamDuel: null, managerDuel: null }` on sample — empty object, not 404.

### Routes not in baseball catalog (vs basketball)

Basketball includes **`/incidents`**, **`/injuries`**, **`/player/.../unique-tournament/.../statistics`**, **`/team/.../unique-tournament/.../statistics`**. None of these appear in the baseball route list — do not wire football/basketball screens blindly.

---

## Re-run probes

```bash
cd Baseball_Product
python3 scripts/probe_all_endpoints.py
python3 scripts/generate_endpoint_doc.py
```

Requires `.env` with `MSDATA_BASE_URL`, `MSDATA_API_KEY`, `MSDATA_LIVE_KEY`.
