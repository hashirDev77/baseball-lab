# Baseball API — Variation & pagination testing

Supplement to [`baseball_api_testing_report.md`](./baseball_api_testing_report.md).
Tests **different entities**, **match states**, **status filters**, **enrichment types**, and **pagination** (including **page 2000**).

- **Generated (UTC):** 2026-10-21T12:33:50.939014+00:00
- **Raw JSON:** [`../data/baseball-variation-tests.json`](../data/baseball-variation-tests.json)
- **Tests run:** 51

## Event IDs used (by state)

```json
{
  "canceled": 82011329,
  "finished": 67599823,
  "notstarted": 28606880
}
```

Same sub-routes were called on **finished**, **canceled**, and **notstarted** events.

## Verdict summary

| Verdict | Count |
| --- | ---: |
| EXPECTED | 6 |
| PASS | 31 |
| PASS_EMPTY | 14 |

## Does page 2000 return real data?

| Endpoint | page=2000 result | Interpretation |
| --- | --- | --- |
| `players` | HTTP 200, count=0, totalPages=1952 | **Empty 200** — page is beyond `totalPages`; `items`/`events` = []. Not fake rows; **misleading `total` stays high**. |
| `team/84917477/events/last` | HTTP 200, count=0, totalPages=425 | **Empty 200** — page is beyond `totalPages`; `items`/`events` = []. Not fake rows; **misleading `total` stays high**. |
| `event/67599823/at-bats` | HTTP 200, count=0, totalPages=14 | **Empty 200** — page is beyond `totalPages`; `items`/`events` = []. Not fake rows; **misleading `total` stays high**. |
| `unique-tournament/53168725/events` | HTTP 200, count=10, totalPages=2927 | **Real data** — page exists within `totalPages`. |

**Important:** `GET /unique-tournament/53168725/events?page=2000` returned **10 events** because totalPages ≈ **2927** — page 2000 is valid.

**`limit=2000`** on `/events` and `/search` returns **HTTP 400** (validation), not a oversized 200.

## Status filter matrix (`GET /events`)

| status param | HTTP | total | items in page |
| --- | ---: | ---: | ---: |
| `finished` | 200 | 0 | 0 |
| `inprogress` | 200 | 0 | 0 |
| `notstarted` | 200 | 18 | 5 |
| `canceled` | 200 | 0 | 0 |
| `postponed` | 200 | 0 | 0 |
| `ended` | 400 | — | — |

`finished`, `inprogress`, `canceled`, `postponed` returned **total=0** in this run while team `events/last` has 2123 finished games — **filter values or indexing issue**.
`notstarted` returned **total=18** (matches current feed).
`ended` returned **400** (invalid status token).

## All variation tests

| Category | Name | HTTP | Verdict | list count | total | totalPages |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| event_state_variation | canceled event detail | 200 | PASS | — | — | — |
| event_state_variation | canceled event/lineups | 200 | PASS | — | — | — |
| event_state_variation | canceled event/statistics | 200 | PASS | — | — | — |
| event_state_variation | canceled event/at-bats | 200 | PASS_EMPTY | 0 | 0 | 0 |
| event_state_variation | canceled event/top-performers | 200 | PASS | — | — | — |
| event_state_variation | canceled event/best-players | 404 | EXPECTED | — | — | — |
| event_state_variation | finished event detail | 200 | PASS | — | — | — |
| event_state_variation | finished event/lineups | 200 | PASS | — | — | — |
| event_state_variation | finished event/statistics | 200 | PASS | — | — | — |
| event_state_variation | finished event/at-bats | 200 | PASS | 5 | 70 | 14 |
| event_state_variation | finished event/top-performers | 200 | PASS | — | — | — |
| event_state_variation | finished event/best-players | 404 | EXPECTED | — | — | — |
| event_state_variation | notstarted event detail | 200 | PASS | — | — | — |
| event_state_variation | notstarted event/lineups | 200 | PASS | — | — | — |
| event_state_variation | notstarted event/statistics | 200 | PASS | — | — | — |
| event_state_variation | notstarted event/at-bats | 200 | PASS_EMPTY | 0 | 0 | 0 |
| event_state_variation | notstarted event/top-performers | 200 | PASS | — | — | — |
| event_state_variation | notstarted event/best-players | 404 | EXPECTED | — | — | — |
| entity_variation | team events last (Yankees) | 200 | PASS | 3 | 2123 | 708 |
| entity_variation | team events last (Rays) | 200 | PASS | 3 | 2081 | 694 |
| entity_variation | player events last (Ohtani) | 200 | PASS | 3 | 1253 | 418 |
| entity_variation | player events last (Volpe) | 200 | PASS | 3 | 615 | 205 |
| pagination_edge | events (small total ~18) | 200 | PASS_EMPTY | 0 | 18 | 4 |
| pagination_edge | events last page (4) | 200 | PASS | 3 | 18 | 4 |
| pagination_edge | events page 5 beyond totalPages | 200 | PASS_EMPTY | 0 | 18 | 4 |
| pagination_edge | players page 2000 (totalPages ~1952) | 200 | PASS_EMPTY | 0 | 9758 | 1952 |
| pagination_edge | players page 1952 (last) | 200 | PASS | 3 | 9758 | 1952 |
| pagination_edge | players page 1953 beyond | 200 | PASS_EMPTY | 0 | 9758 | 1952 |
| pagination_edge | team events last page 2000 (totalPages ~425) | 200 | PASS_EMPTY | 0 | 2123 | 425 |
| pagination_edge | team events last page 425 | 200 | PASS | 3 | 2123 | 425 |
| pagination_edge | team events last page 426 | 200 | PASS_EMPTY | 0 | 2123 | 425 |
| pagination_edge | at-bats page 2000 (totalPages ~14) | 200 | PASS_EMPTY | 0 | 70 | 14 |
| pagination_edge | at-bats last page 14 | 200 | PASS | 5 | 70 | 14 |
| pagination_edge | ut events page 2000 (totalPages ~2927) | 200 | PASS | 10 | 29267 | 2927 |
| pagination_edge | ut events page 2927 | 200 | PASS | 7 | 29267 | 2927 |
| pagination_edge | ut events page 2928 | 200 | PASS_EMPTY | 0 | 29267 | 2927 |
| limit_variation | events limit=1 | 200 | PASS | 1 | 18 | 18 |
| limit_variation | events limit=100 | 200 | PASS | 18 | 18 | 1 |
| limit_variation | events limit=2000 | 400 | EXPECTED | — | — | — |
| limit_variation | search limit=2000 | 400 | EXPECTED | — | — | — |
| status_filter | events status=finished | 200 | PASS_EMPTY | 0 | 0 | 0 |
| status_filter | events status=inprogress | 200 | PASS_EMPTY | 0 | 0 | 0 |
| status_filter | events status=notstarted | 200 | PASS | 5 | 18 | 4 |
| status_filter | events status=canceled | 200 | PASS_EMPTY | 0 | 0 | 0 |
| status_filter | events status=postponed | 200 | PASS_EMPTY | 0 | 0 | 0 |
| status_filter | events status=ended | 400 | EXPECTED | — | — | — |
| enrichment_type_variation | event enrichments/h2h_events | 200 | PASS | 10 | 219 | 22 |
| enrichment_type_variation | event enrichments/highlights | 200 | PASS | — | — | — |
| enrichment_type_variation | event enrichments/series | 200 | PASS | 3 | 3 | 1 |
| enrichment_type_variation | event enrichments/team_streaks | 200 | PASS | — | — | — |
| enrichment_type_variation | event enrichments/votes | 200 | PASS | — | — | — |

## Regenerate

```bash
python3 scripts/probe_variations.py
python3 scripts/generate_variation_report.py
```
