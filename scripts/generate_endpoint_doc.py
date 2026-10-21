#!/usr/bin/env python3
"""Build baseball_api_endpoint_catalog.md from probe evidence JSON."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "data" / "baseball-endpoint-evidence.json"
OUT = ROOT / "docs" / "baseball_api_endpoint_catalog.md"


def md_table(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    widths = [max(len(r[i]) for r in rows) for i in range(len(rows[0]))]
    lines = []
    for ri, row in enumerate(rows):
        line = "| " + " | ".join(cell.ljust(widths[i]) for i, cell in enumerate(row)) + " |"
        lines.append(line)
        if ri == 0:
            lines.append("| " + " | ".join("-" * w for w in widths) + " |")
    return "\n".join(lines)


def main() -> None:
    data = json.loads(EVIDENCE.read_text())
    ids = data["discoveredIds"]
    generated = data["generatedAt"]

    lines: list[str] = [
        "# Baseball API — Endpoint Response Catalog",
        "",
        "Live probe of all **42** SportsAPI365 msdata baseball routes (`/v1/baseball/...`).",
        "Use this before building the Baseball Product UI: it records **HTTP status**, **response shape**, **list keys**, **pagination**, and **ID dependencies**.",
        "",
        f"- **Generated:** {generated}",
        f"- **Evidence file:** [`../data/baseball-endpoint-evidence.json`](../data/baseball-endpoint-evidence.json)",
        f"- **Route source:** [`../data/baseball-routes.json`](../data/baseball-routes.json) (from `jjrm365-multi-sport-routes.json` → baseball, count 42)",
        "",
        "> **Note:** Basketball (lines 52–99 in the same JSON) adds `incidents`, `injuries`, and season statistics routes that **baseball does not expose**. Baseball adds **`at-bats`**, **`top-performers`**, and **`umpires`** on the match.",
        "",
        "---",
        "",
        "## Auth and base URL",
        "",
        "| Header | Role |",
        "| --- | --- |",
        "| `x-apim-key` | APIM gateway key |",
        "| `X-Live-Key` | Live feed key |",
        "| `accept: application/json` | Required for JSON bodies |",
        "",
        "Base: `https://sports-api.sportsdata365.com/msdata` + `/v1/baseball/{path}`.",
        "",
        "---",
        "",
        "## IDs used in this probe (dependency chain)",
        "",
        "Most routes need IDs from earlier calls. Recommended discovery order:",
        "",
        "1. **`GET /search?q=Yankees`** → `teamId` (84917477)",
        "2. **`GET /search?q=Ohtani`** → `playerId` (71698966)",
        "3. **`GET /search?q=MLB`** → `uniqueTournamentId` / `tournamentId` (53168725)",
        "4. **`GET /team/{teamId}/events/last`** → pick a **`status.type === finished`** row → `eventId` (67599823)",
        "5. **`GET /event/{eventId}/lineups`** → `playerId` for per-player match stats; **`manager.id`** on away side (62643844 for sample game)",
        "6. **`GET /unique-tournament/{tournamentId}/seasons`** → `seasonId` (68144200)",
        "7. **`GET /event/{eventId}/enrichments`** → first `types[].type` for `.../enrichments/{type}` (e.g. `h2h_events`)",
        "8. **`GET /team/{teamId}/enrichments`** → first type for team enrichments (e.g. `events_last`)",
        "",
        "Probe snapshot:",
        "",
        "```json",
        json.dumps(
            {
                k: ids[k]
                for k in (
                    "eventId",
                    "teamId",
                    "playerId",
                    "lineupPlayerId",
                    "tournamentId",
                    "seasonId",
                    "managerId",
                    "enrichmentType",
                    "teamEnrichmentType",
                    "date",
                )
                if k in ids
            },
            indent=2,
        ),
        "```",
        "",
        "**Manager route:** probe had no home `manager` on the sample lineups; use **`managerId` from lineups** (away manager present on event 67599823). Calling `/manager/{managerId}` without a numeric id returns **400**.",
        "",
        "---",
        "",
        "## Quick reference (all 42 routes)",
        "",
    ]

    table = [["HTTP", "Route", "Response kind", "List key", "Pagination"]]
    for r in data["routes"]:
        c = r["classification"]
        pag = "yes" if c.get("pagination") else "—"
        table.append(
            [
                str(r["http"]),
                r["routeTemplate"].replace("/v1/baseball", ""),
                c.get("responseKind", "")[:45],
                str(c.get("listKey") or "—"),
                pag,
            ]
        )
    lines.append(md_table(table))
    lines.extend(["", "---", "", "## Per-endpoint detail", ""])

    for r in data["routes"]:
        c = r["classification"]
        lines.append(f"### `{r['routeTemplate']}`")
        lines.append("")
        lines.append(f"- **Called:** `{r['calledPath']}`" + (f" ? `{r['query']}`" if r.get("query") else ""))
        lines.append(f"- **HTTP:** {r['http']} · **Size:** {r['bytes']} bytes")
        if r.get("error"):
            lines.append(f"- **Error message:** {r['error']}")
        lines.append(f"- **Response kind:** {c.get('responseKind')}")
        if c.get("topLevelKeys"):
            lines.append(f"- **Top-level keys:** `{', '.join(c['topLevelKeys'][:20])}`")
        if c.get("listKey"):
            lines.append(f"- **Primary list:** `{c['listKey']}` (count in probe: {c.get('listCount')})")
        if c.get("sampleRowKeys"):
            lines.append(f"- **Sample row keys:** `{', '.join(c['sampleRowKeys'][:18])}`…")
        if c.get("nestedObjectKeys"):
            lines.append(f"- **Wrapped object keys (sample):** `{', '.join(c['nestedObjectKeys'][:18])}`…")
        if c.get("pagination"):
            pg = c["pagination"]
            lines.append(
                f"- **Pagination:** page={pg.get('page')}, limit={pg.get('limit')}, total={pg.get('total')}, totalPages={pg.get('totalPages')}, hasMore={pg.get('hasMore')}"
            )
        if c.get("apiError"):
            ae = c["apiError"]
            lines.append(f"- **API error:** `{ae.get('error')}` — {ae.get('message')}")
        lines.append("")

    lines.extend(
        [
            "---",
            "",
            "## Extra API-level checks (not separate catalog routes)",
            "",
        ]
    )
    for e in data["extraProbes"]:
        c = e["classification"]
        lines.append(f"- **{e['label']}** — HTTP {e['http']}, `{c.get('responseKind')}`")
        if c.get("pagination"):
            lines.append(f"  - Pagination: {c['pagination']}")
        if c.get("listCount") is not None:
            lines.append(f"  - List count: {c['listCount']}")
    lines.extend(
        [
            "",
            "---",
            "",
            "## Cross-cutting findings for product / QA",
            "",
            "### List envelope inconsistency",
            "",
            "| Endpoint family | Array key | Pagination fields |",
            "| --- | --- | --- |",
            "| `/events`, `/fixtures/today`, `/teams`, `/players`, `/tournaments`, `/search` | `items` | `page`, `limit`, `total`, `totalPages`, `hasMore` |",
            "| `/team/.../events/*`, `/player/.../events/*`, `/unique-tournament/.../events` | `events` | same pagination fields |",
            "",
            "### Status and score shape",
            "",
            "- **List rows** (`items`): `status` is often a **string** (`notstarted`); `homeScore` / `awayScore` may show **series** only during postseason (e.g. `{ \"series\": 4 }`), not full R/H/E.",
            "- **Event detail** and **team event lists**: `status` is an **object** `{ code, type, description }`; scores include `current`, `display`, per-inning `innings`, and `inningsBaseball` `{ run, hits, errors }`.",
            "",
            "### Filters and empty feeds",
            "",
            "- **`GET /events?status=finished`** and **`?status=inprogress`** returned **`total: 0`** while **`GET /team/{id}/events/last`** had 2000+ finished games — do not use global `/events` alone for Results/Live tabs without verifying filters.",
            "- **`GET /events?page=9999`** returns **200** with empty `items` but **`total` still 18** and **`totalPages` 4** — treat as empty page, not 404.",
            "- **`GET /search`** without `q` → **400** (validation).",
            "",
            "### Optional enrichments (404 vs empty 200)",
            "",
            "- **`/event/{id}/best-players`** → **404** `ENRICHMENT_NOT_FOUND` on probed finished MLB game (use **`top-performers`** instead).",
            "- **`/team/{id}/rankings`** → **404** enrichment not found for Yankees sample.",
            "- Prefer **`GET .../enrichments`** first, then call **`.../enrichments/{type}`** with a listed type.",
            "",
            "### Standings types",
            "",
            "- **`standings/total`**: full table (~90 MLB rows) with `wins`, `losses`, `winPercentage`, `gamesBehind`, etc.",
            "- **`standings/home`** and **`standings/away`**: **200** but **empty `rows`** in probe — confirm with API team before shipping split tables.",
            "",
            "### Baseball-only match data",
            "",
            "- **`/at-bats`**: paginated `atBats[]` — inning, half, pitcher/hitter ids, win probability, `occurredAt`.",
            "- **`/top-performers`**: `topPerformers[]` with role `batter`, rating, batting stat subset.",
            "- **`/umpires`**: `umpires[]` with assignment (HP, 1B, …).",
            "- **`/h2h`**: `{ teamDuel: null, managerDuel: null }` on sample — empty object, not 404.",
            "",
            "### Routes not in baseball catalog (vs basketball)",
            "",
            "Basketball includes **`/incidents`**, **`/injuries`**, **`/player/.../unique-tournament/.../statistics`**, **`/team/.../unique-tournament/.../statistics`**. None of these appear in the baseball route list — do not wire football/basketball screens blindly.",
            "",
            "---",
            "",
            "## Re-run probes",
            "",
            "```bash",
            "cd Baseball_Product",
            "python3 scripts/probe_all_endpoints.py",
            "python3 scripts/generate_endpoint_doc.py",
            "```",
            "",
            "Requires `.env` with `MSDATA_BASE_URL`, `MSDATA_API_KEY`, `MSDATA_LIVE_KEY`.",
            "",
        ]
    )

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
