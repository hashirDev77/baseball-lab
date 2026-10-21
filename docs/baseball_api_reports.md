# Baseball API Coverage Report

Generated 2026-10-21T12:58:04.802Z

This product is a baseball UI and an API coverage lab for **42** SportsAPI365 baseball routes. Completeness is measured from live observations, not from calling each route once.

## Live catalog sweep

Run `pnpm audit:phase1` or `pnpm audit:full` to populate this section.


## Full-catalog audit

- Rows recorded: **71**
- Catalog routes: **42**
- Covered in this run: **42**
- Uncovered: none

## Endpoint coverage

- Catalog: **42**
- Tested: **42**
- Returning useful data: **36**
- Empty: **0**
- Errors: **6**
- Untested: **0**
- API calls recorded: **93**
- Gaps: **6**
- Manual findings: **0**

## Experience scores

- MATCH EXPERIENCE: **100%**
- TEAM EXPERIENCE: **100%**
- PLAYER EXPERIENCE: **100%**
- COMPETITION EXPERIENCE: **100%**
- SEARCH EXPERIENCE: **100%**

## Screen coverage

- Home: overall 100, complete 100%, gaps 0
- Matches: overall 100, complete 100%, gaps 0
- Match Centre: overall 100, complete 100%, gaps 0
- Team: overall 100, complete 100%, gaps 0
- Player: overall 100, complete 100%, gaps 0
- Competition: overall 100, complete 100%, gaps 0
- Search: overall 100, complete 100%, gaps 0
- Manager: overall 100, complete 100%, gaps 0
- Full catalog audit: overall 91, complete 52%, gaps 6

## Endpoint matrix

- `/event/{eventId}` · Match Centre · last 200 · 328ms · useful=true empty=false · score 92
- `/event/{eventId}/at-bats` · Match Centre · last 200 · 321ms · useful=true empty=false · score 100
- `/event/{eventId}/best-players` · Match Centre · last 404 · 391ms · useful=false empty=false · score 52
- `/event/{eventId}/enrichments` · Match Centre · last 200 · 408ms · useful=true empty=false · score 100
- `/event/{eventId}/enrichments/{type}` · Match Centre · last 200 · 415ms · useful=true empty=false · score 100
- `/event/{eventId}/h2h` · Match Centre · last 200 · 320ms · useful=true empty=false · score 100
- `/event/{eventId}/lineups` · Match Centre · last 200 · 333ms · useful=true empty=false · score 100
- `/event/{eventId}/player-statistics` · Match Centre · last 200 · 374ms · useful=true empty=false · score 100
- `/event/{eventId}/player/{playerId}/statistics` · Match Centre · last 200 · 317ms · useful=true empty=false · score 100
- `/event/{eventId}/pregame-form` · Match Centre · last 200 · 370ms · useful=true empty=false · score 100
- `/event/{eventId}/statistics` · Match Centre · last 200 · 326ms · useful=true empty=false · score 100
- `/event/{eventId}/team-streaks` · Match Centre · last 200 · 316ms · useful=true empty=false · score 100
- `/event/{eventId}/top-performers` · Match Centre · last 200 · 314ms · useful=true empty=false · score 100
- `/event/{eventId}/umpires` · Match Centre · last 200 · 307ms · useful=true empty=false · score 100
- `/event/{eventId}/weather` · Match Centre · last 200 · 328ms · useful=true empty=false · score 100
- `/events` · Matches · last 200 · 327ms · useful=true empty=false · score 92
- `/fixtures/today` · Home · last 200 · 343ms · useful=true empty=false · score 100
- `/manager/{managerId}` · Manager · last 200 · 314ms · useful=true empty=false · score 100
- `/player/{playerId}` · Player · last 200 · 384ms · useful=true empty=false · score 92
- `/player/{playerId}/events/{direction}` · Player · last 400 · 317ms · useful=false empty=false · score 60
- `/players` · Players directory · last 200 · 406ms · useful=true empty=false · score 100
- `/search` · Search · last 200 · 356ms · useful=true empty=false · score 100
- `/team/{teamId}` · Team · last 404 · 572ms · useful=false empty=false · score 52
- `/team/{teamId}/enrichments` · Team · last 200 · 330ms · useful=true empty=false · score 100
- `/team/{teamId}/enrichments/{type}` · Team · last 200 · 351ms · useful=true empty=false · score 100
- `/team/{teamId}/events/{direction}` · Team · last 200 · 310ms · useful=true empty=false · score 100
- `/team/{teamId}/featured-event` · Team · last 200 · 612ms · useful=true empty=false · score 100
- `/team/{teamId}/media` · Team · last 200 · 348ms · useful=true empty=false · score 100
- `/team/{teamId}/near-events` · Team · last 200 · 351ms · useful=true empty=false · score 100
- `/team/{teamId}/performance` · Team · last 200 · 466ms · useful=true empty=false · score 100
- `/team/{teamId}/players` · Team · last 200 · 336ms · useful=true empty=false · score 100
- `/team/{teamId}/rankings` · Team · last 404 · 409ms · useful=false empty=false · score 52
- `/team/{teamId}/standings-seasons` · Team · last 200 · 346ms · useful=true empty=false · score 100
- `/team/{teamId}/unique-tournaments` · Team · last 200 · 410ms · useful=true empty=false · score 100
- `/teams` · Teams directory · last 200 · 314ms · useful=true empty=false · score 100
- `/tournaments` · Competitions · last 200 · 312ms · useful=true empty=false · score 100
- `/unique-tournament/{tournamentId}` · Competition · last 200 · 364ms · useful=true empty=false · score 100
- `/unique-tournament/{tournamentId}/events` · Competition · last 200 · 342ms · useful=true empty=false · score 100
- `/unique-tournament/{tournamentId}/scheduled-events/{date}` · Competition · last 400 · 405ms · useful=false empty=false · score 60
- `/unique-tournament/{tournamentId}/season/{seasonId}/round/{round}` · Competition · last 200 · 361ms · useful=true empty=false · score 100
- `/unique-tournament/{tournamentId}/season/{seasonId}/standings/{type}` · Competition · last 400 · 409ms · useful=false empty=false · score 60
- `/unique-tournament/{tournamentId}/seasons` · Competition · last 200 · 572ms · useful=true empty=false · score 100

## Missing fields

- None recorded yet.

## Relationship issues

- None recorded yet.

## Improvement backlog

### Return empty 200 for optional extras

/event/{id}/best-players and /team/{id}/rankings 404 on valid entities. Prefer 200 empty, and point match UX at /top-performers.


## Catalog

- `/event/{eventId}` (match / Match Centre)
- `/event/{eventId}/at-bats` (match / Match Centre)
- `/event/{eventId}/best-players` (match / Match Centre)
- `/event/{eventId}/enrichments` (match / Match Centre)
- `/event/{eventId}/enrichments/{type}` (match / Match Centre)
- `/event/{eventId}/h2h` (match / Match Centre)
- `/event/{eventId}/lineups` (match / Match Centre)
- `/event/{eventId}/player-statistics` (match / Match Centre)
- `/event/{eventId}/player/{playerId}/statistics` (match / Match Centre)
- `/event/{eventId}/pregame-form` (match / Match Centre)
- `/event/{eventId}/statistics` (match / Match Centre)
- `/event/{eventId}/team-streaks` (match / Match Centre)
- `/event/{eventId}/top-performers` (match / Match Centre)
- `/event/{eventId}/umpires` (match / Match Centre)
- `/event/{eventId}/weather` (match / Match Centre)
- `/events` (lists / Matches)
- `/fixtures/today` (lists / Home)
- `/manager/{managerId}` (manager / Manager)
- `/player/{playerId}` (player / Player)
- `/player/{playerId}/events/{direction}` (player / Player)
- `/players` (lists / Players directory)
- `/search` (lists / Search)
- `/team/{teamId}` (team / Team)
- `/team/{teamId}/enrichments` (team / Team)
- `/team/{teamId}/enrichments/{type}` (team / Team)
- `/team/{teamId}/events/{direction}` (team / Team)
- `/team/{teamId}/featured-event` (team / Team)
- `/team/{teamId}/media` (team / Team)
- `/team/{teamId}/near-events` (team / Team)
- `/team/{teamId}/performance` (team / Team)
- `/team/{teamId}/players` (team / Team)
- `/team/{teamId}/rankings` (team / Team)
- `/team/{teamId}/standings-seasons` (team / Team)
- `/team/{teamId}/unique-tournaments` (team / Team)
- `/teams` (lists / Teams directory)
- `/tournaments` (lists / Competitions)
- `/unique-tournament/{tournamentId}` (competition / Competition)
- `/unique-tournament/{tournamentId}/events` (competition / Competition)
- `/unique-tournament/{tournamentId}/scheduled-events/{date}` (competition / Competition)
- `/unique-tournament/{tournamentId}/season/{seasonId}/round/{round}` (competition / Competition)
- `/unique-tournament/{tournamentId}/season/{seasonId}/standings/{type}` (competition / Competition)
- `/unique-tournament/{tournamentId}/seasons` (competition / Competition)

## Definition of done questions

- Which user journeys work completely?
- Which cannot be completed?
- Which endpoints return empty data?
- Which endpoints have partial data?
- Which important fields are absent?
- Which entities cannot be linked?
- Which endpoints behave differently by competition?
- Which data is unclear or undocumented?
- Which user experience requires too many requests?
- Which genuinely new endpoints are needed?
- Which existing endpoints only need more/better fields?
