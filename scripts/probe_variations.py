#!/usr/bin/env python3
"""Endpoint variations: different entities, match states, pagination edge cases (incl. page 2000)."""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
OUT = ROOT / "data" / "baseball-variation-tests.json"


def load_env() -> tuple[str, dict[str, str]]:
    path = ENV_PATH
    if not path.exists():
        path = Path("/Users/apple/Desktop/Football_Product/.env")
    env = {}
    for line in path.read_text().splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    base = env["MSDATA_BASE_URL"].rstrip("/")
    headers = {
        "accept": "application/json",
        "x-apim-key": env["MSDATA_API_KEY"],
        "X-Live-Key": env["MSDATA_LIVE_KEY"],
    }
    return base, headers


def get(base: str, headers: dict, path: str, params: dict | None = None) -> dict:
    url = f"{base}/v1/baseball/{path.lstrip('/')}"
    if params:
        url += "?" + urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read())
            return {"http": resp.status, "url": url, "body": body}
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            body = json.loads(raw) if raw else None
        except Exception:
            body = {"raw": raw[:400].decode("utf-8", "replace")}
        return {"http": e.code, "url": url, "body": body}


def list_meta(body: dict | None) -> dict:
    if not isinstance(body, dict):
        return {}
    for key in ("items", "events", "players", "atBats", "playerStatistics", "seasons"):
        if isinstance(body.get(key), list):
            return {
                "listKey": key,
                "count": len(body[key]),
                "page": body.get("page"),
                "limit": body.get("limit"),
                "total": body.get("total"),
                "totalPages": body.get("totalPages"),
                "hasMore": body.get("hasMore"),
            }
    return {"topKeys": list(body.keys())[:15]}


def status_type(ev: dict) -> str:
    st = ev.get("status")
    if isinstance(st, dict):
        return str(st.get("type") or st.get("description") or "")
    return str(st or "")


def main() -> None:
    base, headers = load_env()
    tests: list[dict] = []

    def record(category: str, name: str, path: str, params: dict | None, result: dict, notes: str = ""):
        meta = list_meta(result.get("body") if isinstance(result.get("body"), dict) else None)
        verdict = "PASS"
        if result["http"] >= 400:
            verdict = "EXPECTED" if result["http"] in (400, 404) else "FAIL"
        elif meta.get("count") == 0 and meta.get("listKey"):
            if meta.get("page") and meta.get("totalPages") and meta["page"] > meta["totalPages"]:
                verdict = "PASS_EMPTY"
                notes = (notes + " " if notes else "") + "Empty page beyond totalPages (200 OK, not 404)."
            elif params and params.get("page", 1) > 100:
                verdict = "PASS_EMPTY"
                notes = (notes + " " if notes else "") + "High page number returns empty items."
            else:
                verdict = "PASS_EMPTY"
        elif meta.get("count", 0) > 0:
            verdict = "PASS"
        tests.append(
            {
                "category": category,
                "name": name,
                "path": path,
                "params": params,
                "http": result["http"],
                "meta": meta,
                "verdict": verdict,
                "notes": notes.strip(),
            }
        )

    # --- Discover varied event IDs ---
    team_id = 84917477
    last = get(base, headers, f"team/{team_id}/events/last", {"page": 1, "limit": 30})
    events = (last.get("body") or {}).get("events") or []
    by_type: dict[str, int] = {}
    for ev in events:
        t = status_type(ev).lower()
        if "finish" in t and "finished" not in by_type:
            by_type["finished"] = ev["id"]
        if "cancel" in t and "canceled" not in by_type:
            by_type["canceled"] = ev["id"]
    today = get(base, headers, "fixtures/today", {"page": 1, "limit": 20})
    for ev in (today.get("body") or {}).get("items") or []:
        st = str(ev.get("status", "")).lower()
        if "notstart" in st and "notstarted" not in by_type:
            by_type["notstarted"] = ev["id"]
    if "finished" not in by_type:
        by_type["finished"] = 67599823

    # --- A) Same match sub-routes on 3 event types ---
    for label, eid in by_type.items():
        for suffix in ("", "/lineups", "/statistics", "/at-bats", "/top-performers", "/best-players"):
            p = f"event/{eid}{suffix}"
            params = {"page": 1, "limit": 5} if suffix == "/at-bats" else None
            r = get(base, headers, p, params)
            record("event_state_variation", f"{label} event{suffix or ' detail'}", p, params, r, f"eventId={eid}")

    # --- B) Second team / player ---
    for tid, tname in [(84917477, "Yankees"), (20869353, "Rays")]:
        r = get(base, headers, f"team/{tid}/events/last", {"page": 1, "limit": 3})
        record("entity_variation", f"team events last ({tname})", f"team/{tid}/events/last", {"page": 1, "limit": 3}, r)
    for pid, pname in [(71698966, "Ohtani"), (39625815, "Volpe")]:
        r = get(base, headers, f"player/{pid}/events/last", {"page": 1, "limit": 3})
        record("entity_variation", f"player events last ({pname})", f"player/{pid}/events/last", {"page": 1, "limit": 3}, r)

    # --- C) Pagination: page 2000 and beyond totalPages ---
    pagination_cases = [
        ("events (small total ~18)", "events", {"page": 2000, "limit": 5}),
        ("events last page (4)", "events", {"page": 4, "limit": 5}),
        ("events page 5 beyond totalPages", "events", {"page": 5, "limit": 5}),
        ("players page 2000 (totalPages ~1952)", "players", {"page": 2000, "limit": 5}),
        ("players page 1952 (last)", "players", {"page": 1952, "limit": 5}),
        ("players page 1953 beyond", "players", {"page": 1953, "limit": 5}),
        ("team events last page 2000 (totalPages ~425)", f"team/{team_id}/events/last", {"page": 2000, "limit": 5}),
        ("team events last page 425", f"team/{team_id}/events/last", {"page": 425, "limit": 5}),
        ("team events last page 426", f"team/{team_id}/events/last", {"page": 426, "limit": 5}),
        ("at-bats page 2000 (totalPages ~14)", "event/67599823/at-bats", {"page": 2000, "limit": 5}),
        ("at-bats last page 14", "event/67599823/at-bats", {"page": 14, "limit": 5}),
        ("ut events page 2000 (totalPages ~2927)", "unique-tournament/53168725/events", {"page": 2000, "limit": 10}),
        ("ut events page 2927", "unique-tournament/53168725/events", {"page": 2927, "limit": 10}),
        ("ut events page 2928", "unique-tournament/53168725/events", {"page": 2928, "limit": 10}),
    ]
    for name, path, params in pagination_cases:
        r = get(base, headers, path, params)
        record("pagination_edge", name, path, params, r)

    # --- D) limit extremes ---
    for name, path, params in [
        ("events limit=1", "events", {"page": 1, "limit": 1}),
        ("events limit=100", "events", {"page": 1, "limit": 100}),
        ("events limit=2000", "events", {"page": 1, "limit": 2000}),
        ("search limit=2000", "search", {"q": "a", "page": 1, "limit": 2000}),
    ]:
        r = get(base, headers, path, params)
        record("limit_variation", name, path, params, r)

    # --- E) status filter variations on /events ---
    for st in ("finished", "inprogress", "notstarted", "canceled", "postponed", "ended"):
        r = get(base, headers, "events", {"page": 1, "limit": 5, "status": st})
        record("status_filter", f"events status={st}", "events", {"page": 1, "limit": 5, "status": st}, r)

    # --- F) enrichment types on same event ---
    enr = get(base, headers, "event/67599823/enrichments")
    types = []
    for t in (enr.get("body") or {}).get("types") or []:
        if isinstance(t, dict) and t.get("type"):
            types.append(t["type"])
    for et in types[:6]:
        r = get(base, headers, f"event/67599823/enrichments/{et}")
        record("enrichment_type_variation", f"event enrichments/{et}", f"event/67599823/enrichments/{et}", None, r)

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "discoveredEventIdsByState": by_type,
        "summary": {
            "totalTests": len(tests),
            "byVerdict": {},
            "byCategory": {},
        },
        "tests": tests,
    }
    for t in tests:
        payload["summary"]["byVerdict"][t["verdict"]] = payload["summary"]["byVerdict"].get(t["verdict"], 0) + 1
        payload["summary"]["byCategory"][t["category"]] = payload["summary"]["byCategory"].get(t["category"], 0) + 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2))
    print(json.dumps(payload["summary"], indent=2))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
