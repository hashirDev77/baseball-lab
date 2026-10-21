#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VAR = ROOT / "data" / "baseball-variation-tests.json"
OUT = ROOT / "docs" / "baseball_api_variation_testing.md"


def main() -> None:
    if not VAR.exists():
        raise SystemExit("Run: python3 scripts/probe_variations.py")

    data = json.loads(VAR.read_text())
    tests = data["tests"]
    lines = [
        "# Baseball API — Variation & pagination testing",
        "",
        "Supplement to [`baseball_api_testing_report.md`](./baseball_api_testing_report.md).",
        "Tests **different entities**, **match states**, **status filters**, **enrichment types**, and **pagination** (including **page 2000**).",
        "",
        f"- **Generated (UTC):** {data['generatedAt']}",
        f"- **Raw JSON:** [`../data/baseball-variation-tests.json`](../data/baseball-variation-tests.json)",
        f"- **Tests run:** {data['summary']['totalTests']}",
        "",
        "## Event IDs used (by state)",
        "",
        "```json",
        json.dumps(data["discoveredEventIdsByState"], indent=2),
        "```",
        "",
        "Same sub-routes were called on **finished**, **canceled**, and **notstarted** events.",
        "",
        "## Verdict summary",
        "",
        "| Verdict | Count |",
        "| --- | ---: |",
    ]
    for k, v in sorted(data["summary"]["byVerdict"].items()):
        lines.append(f"| {k} | {v} |")

    lines.extend(
        [
            "",
            "## Does page 2000 return real data?",
            "",
            "| Endpoint | page=2000 result | Interpretation |",
            "| --- | --- | --- |",
        ]
    )

    page2000 = [t for t in tests if "page 2000" in t["name"]]
    for t in page2000:
        m = t["meta"]
        cnt = m.get("count", "—")
        tp = m.get("totalPages", "—")
        if t["verdict"] == "PASS" and (cnt or 0) > 0:
            interp = "**Real data** — page exists within `totalPages`."
        elif t["verdict"] == "PASS_EMPTY":
            interp = "**Empty 200** — page is beyond `totalPages`; `items`/`events` = []. Not fake rows; **misleading `total` stays high**."
        else:
            interp = t.get("notes") or ""
        lines.append(f"| `{t['path']}` | HTTP {t['http']}, count={cnt}, totalPages={tp} | {interp} |")

    lines.extend(
        [
            "",
            "**Important:** `GET /unique-tournament/53168725/events?page=2000` returned **10 events** because totalPages ≈ **2927** — page 2000 is valid.",
            "",
            "**`limit=2000`** on `/events` and `/search` returns **HTTP 400** (validation), not a oversized 200.",
            "",
            "## Status filter matrix (`GET /events`)",
            "",
            "| status param | HTTP | total | items in page |",
            "| --- | ---: | ---: | ---: |",
        ]
    )
    for t in tests:
        if t["category"] != "status_filter":
            continue
        st = t["name"].replace("events status=", "")
        lines.append(f"| `{st}` | {t['http']} | {t['meta'].get('total', '—')} | {t['meta'].get('count', '—')} |")

    lines.extend(
        [
            "",
            "`finished`, `inprogress`, `canceled`, `postponed` returned **total=0** in this run while team `events/last` has 2123 finished games — **filter values or indexing issue**.",
            "`notstarted` returned **total=18** (matches current feed).",
            "`ended` returned **400** (invalid status token).",
            "",
            "## All variation tests",
            "",
            "| Category | Name | HTTP | Verdict | list count | total | totalPages |",
            "| --- | --- | ---: | --- | ---: | ---: | ---: |",
        ]
    )
    for t in tests:
        m = t["meta"]
        lines.append(
            f"| {t['category']} | {t['name']} | {t['http']} | {t['verdict']} | "
            f"{m.get('count', '—')} | {m.get('total', '—')} | {m.get('totalPages', '—')} |"
        )

    lines.extend(
        [
            "",
            "## Regenerate",
            "",
            "```bash",
            "python3 scripts/probe_variations.py",
            "python3 scripts/generate_variation_report.py",
            "```",
            "",
        ]
    )

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
