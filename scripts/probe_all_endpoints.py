#!/usr/bin/env python3
"""Probe all 42 baseball msdata routes; write JSON evidence for docs."""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
OUT_JSON = ROOT / "data" / "baseball-endpoint-evidence.json"
ROUTES_JSON = ROOT / "data" / "baseball-routes.json"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        alt = Path("/Users/apple/Desktop/Football_Product/.env")
        path = alt if alt.exists() else path
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def get(base: str, headers: dict[str, str], path: str, params: dict | None = None) -> dict:
    url = f"{base.rstrip('/')}/v1/baseball/{path.lstrip('/')}"
    if params:
        q = {k: v for k, v in params.items() if v is not None}
        url += "?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = resp.read()
            parsed = json.loads(body) if body else None
            return {"path": path, "url": url, "http": resp.status, "bytes": len(body), "body": parsed}
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            parsed = json.loads(body) if body else None
        except Exception:
            parsed = {"raw": body[:800].decode("utf-8", "replace")}
        return {
            "path": path,
            "url": url,
            "http": e.code,
            "bytes": len(body or b""),
            "body": parsed,
            "error": (parsed or {}).get("message") if isinstance(parsed, dict) else str(e),
        }
    except Exception as e:
        return {"path": path, "url": url, "http": 0, "bytes": 0, "body": None, "error": str(e)}


def id_from_search_item(item: dict) -> int | None:
    if not isinstance(item, dict):
        return None
    try:
        return int(item["id"])
    except Exception:
        return None


def classify_response(path: str, result: dict) -> dict:
    http = result.get("http")
    body = result.get("body")
    out: dict = {
        "http": http,
        "bytes": result.get("bytes"),
        "responseKind": "unknown",
        "topLevelKeys": [],
        "listKey": None,
        "listCount": None,
        "pagination": None,
        "nestedObjectKeys": None,
        "sampleRowKeys": None,
        "apiError": None,
        "notes": [],
    }
    if not isinstance(body, dict):
        out["responseKind"] = "non-object or empty"
        return out

    out["topLevelKeys"] = list(body.keys())

    if body.get("statusCode") or body.get("error") in ("NotFound", "BadRequest"):
        out["responseKind"] = "error envelope"
        out["apiError"] = {
            "statusCode": body.get("statusCode"),
            "message": body.get("message"),
            "error": body.get("error"),
            "details": body.get("details"),
        }
        return out

    pag_keys = ("page", "limit", "total", "totalPages", "hasMore")
    if any(k in body for k in pag_keys):
        out["pagination"] = {k: body.get(k) for k in pag_keys if k in body}

    list_candidates = [
        "items",
        "events",
        "players",
        "seasons",
        "media",
        "rankings",
        "types",
        "atBats",
        "playerStatistics",
        "topPerformers",
        "umpires",
        "standings",
        "uniqueTournaments",
        "uniqueTournamentSeasons",
        "tournamentSeasons",
        "conditions",
        "statistics",
    ]
    for key in list_candidates:
        if isinstance(body.get(key), list):
            lst = body[key]
            out["listKey"] = key
            out["listCount"] = len(lst)
            out["responseKind"] = "paginated list" if out["pagination"] else "list envelope"
            if lst and isinstance(lst[0], dict):
                out["sampleRowKeys"] = list(lst[0].keys())[:30]
            break

    object_wrappers = {
        "event": "match object",
        "player": "player object",
        "team": "team object",
        "uniqueTournament": "competition object",
        "manager": "manager object",
    }
    for key, kind in object_wrappers.items():
        if isinstance(body.get(key), dict):
            out["responseKind"] = kind
            out["nestedObjectKeys"] = list(body[key].keys())[:35]
            break

    if out["responseKind"] == "unknown":
        if body.get("home") and body.get("away"):
            out["responseKind"] = "home/away split (lineups or similar)"
            for side in ("home", "away"):
                s = body.get(side)
                if isinstance(s, dict):
                    out.setdefault("sideKeys", {})[side] = list(s.keys())[:25]
        elif body.get("homeTeam") and body.get("awayTeam"):
            out["responseKind"] = "pregame form envelope"
        elif body.get("previousEvent") is not None or body.get("nextEvent") is not None:
            out["responseKind"] = "previous/next event envelope"
        elif body.get("teamDuel") is not None or body.get("managerDuel") is not None:
            out["responseKind"] = "head-to-head envelope"
        elif body.get("statistics") is not None:
            out["responseKind"] = "match statistics object"
        elif body.get("conditions") is not None:
            out["responseKind"] = "weather object"
        else:
            out["responseKind"] = f"object ({', '.join(list(body.keys())[:8])})"

    return out


def substitute_path(template: str, ids: dict) -> tuple[str, dict | None]:
    """Return baseball-relative path and query params."""
    p = template.replace("/v1/baseball/", "")
    params: dict | None = None

    if "{eventId}" in p:
        p = p.replace("{eventId}", str(ids["eventId"]))
    if "{playerId}" in p:
        p = p.replace("{playerId}", str(ids["playerId"]))
    if "{teamId}" in p:
        p = p.replace("{teamId}", str(ids["teamId"]))
    if "{managerId}" in p:
        if not ids.get("managerId"):
            return p, None  # will 404 or skip
        p = p.replace("{managerId}", str(ids["managerId"]))
    if "{tournamentId}" in p:
        p = p.replace("{tournamentId}", str(ids["tournamentId"]))
    if "{seasonId}" in p:
        p = p.replace("{seasonId}", str(ids["seasonId"]))
    if "{direction}" in p:
        p = p.replace("{direction}", "last")
    if "{date}" in p:
        p = p.replace("{date}", ids["date"])
    if "{round}" in p:
        p = p.replace("{round}", "1")
    if "{type}" in p:
        if "/standings/" in p:
            p = p.replace("{type}", "total")
        elif "/team/" in p and "/enrichments/" in p:
            p = p.replace("{type}", ids.get("teamEnrichmentType", "events_last"))
        else:
            p = p.replace("{type}", ids.get("enrichmentType", "best_players"))

    if p in ("events", "fixtures/today", "teams", "players", "tournaments", "search"):
        params = {"page": 1, "limit": 5}
        if p == "search":
            params["q"] = "Yankees"
    elif p.endswith("/events/last") or p.endswith("/events/next"):
        params = {"page": 1, "limit": 5}
    elif "/player-statistics" in p and "player/" not in p.split("/player-statistics")[0][-10:]:
        params = {"page": 1, "limit": 5}
    elif "/at-bats" in p:
        params = {"page": 1, "limit": 5}
    elif "/media" in p:
        params = {"page": 1, "limit": 5}
    elif "/performance" in p:
        params = {"page": 1, "limit": 5}
    elif "/rankings" in p:
        params = {"page": 1, "limit": 5}
    elif "/unique-tournaments" in p:
        params = {"page": 1, "limit": 5}
    elif "/standings-seasons" in p:
        params = {"page": 1, "limit": 5}
    elif "/seasons" in p and "unique-tournament" in p:
        params = {"page": 1, "limit": 5}
    elif "/unique-tournament/" in p and p.endswith("/events"):
        params = {"page": 1, "limit": 5}

    if p.endswith("/standings/{type}") or re.search(r"/standings/(total|home|away)$", p):
        pass  # already substituted type in template - fix
    if "{type}" in template and "standings" in template:
        p = p.replace("{type}", "total")

    return p, params


def discover_ids(base: str, headers: dict[str, str]) -> dict:
    ids: dict = {
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "enrichmentType": "best_players",
        "managerId": None,
        "lineupPlayerId": None,
    }

    search_y = get(base, headers, "search", {"q": "Yankees", "page": 1, "limit": 5})
    search_o = get(base, headers, "search", {"q": "Ohtani", "page": 1, "limit": 5})
    search_m = get(base, headers, "search", {"q": "MLB", "page": 1, "limit": 5})

    ids["teamId"] = id_from_search_item(((search_y.get("body") or {}).get("items") or [None])[0]) or 84917477
    ids["playerId"] = id_from_search_item(((search_o.get("body") or {}).get("items") or [None])[0]) or 71698966
    ids["tournamentId"] = id_from_search_item(((search_m.get("body") or {}).get("items") or [None])[0]) or 53168725

    team_last = get(base, headers, f"team/{ids['teamId']}/events/last", {"page": 1, "limit": 15})
    finished = None
    for ev in (team_last.get("body") or {}).get("events") or []:
        st = ev.get("status") or {}
        if isinstance(st, dict) and st.get("type") == "finished":
            finished = ev.get("id")
            break
    ids["eventId"] = finished or 67599823

    seasons = get(base, headers, f"unique-tournament/{ids['tournamentId']}/seasons", {"page": 1, "limit": 5})
    sbody = seasons.get("body") or {}
    season_list = sbody.get("seasons") or sbody.get("items") or []
    ids["seasonId"] = season_list[0].get("id") if season_list else 68144200

    lineups = get(base, headers, f"event/{ids['eventId']}/lineups")
    for side in ("home", "away"):
        s = (lineups.get("body") or {}).get(side) or {}
        mgr = s.get("manager") or s.get("coach")
        if isinstance(mgr, dict) and mgr.get("id") and not ids.get("managerId"):
            ids["managerId"] = mgr["id"]
    for side in ("home", "away"):
        s = (lineups.get("body") or {}).get(side) or {}
        for p in s.get("players") or []:
            pl = (p.get("player") or p) if isinstance(p, dict) else None
            if isinstance(pl, dict) and pl.get("id"):
                ids["lineupPlayerId"] = pl["id"]
                break
        if ids.get("lineupPlayerId"):
            break

    enr = get(base, headers, f"event/{ids['eventId']}/enrichments")
    types = []
    for t in (enr.get("body") or {}).get("types") or []:
        if isinstance(t, dict):
            types.append(t.get("type"))
        elif isinstance(t, str):
            types.append(t)
    if types:
        ids["enrichmentType"] = types[0]

    tenr = get(base, headers, f"team/{ids['teamId']}/enrichments")
    ttypes = []
    for t in (tenr.get("body") or {}).get("types") or []:
        if isinstance(t, dict):
            ttypes.append(t.get("type"))
    ids["teamEnrichmentType"] = ttypes[0] if ttypes else "events_last"

    return ids


def main() -> None:
    env = load_env(ENV_PATH)
    base = (env.get("MSDATA_BASE_URL") or env.get("VITE_MSDATA_BASE_URL") or "https://sports-api.sportsdata365.com/msdata").rstrip("/")
    headers = {
        "accept": "application/json",
        "x-apim-key": env.get("MSDATA_API_KEY") or env.get("VITE_MSDATA_API_KEY") or "",
        "X-Live-Key": env.get("MSDATA_LIVE_KEY") or env.get("VITE_MSDATA_LIVE_KEY") or "",
    }

    routes_doc = json.loads(ROUTES_JSON.read_text())
    if "baseball" in routes_doc:
        route_templates = routes_doc["baseball"]["routes"]
    else:
        route_templates = routes_doc["routes"]

    ids = discover_ids(base, headers)
    ids["playerIdForEventStats"] = ids.get("lineupPlayerId") or ids["playerId"]

    results = []
    for template in route_templates:
        rel, params = substitute_path(template, ids)
        # Special: player stats in event needs lineup player
        if "/player/{playerId}/statistics" in template and "event/" in template:
            rel = rel.replace(str(ids["playerId"]), str(ids["playerIdForEventStats"]))
        # Special: enrichments type
        if "/enrichments/{type}" in template and "team/" in template:
            rel = re.sub(r"/enrichments/[^/]+$", f"/enrichments/{ids['teamEnrichmentType']}", rel)
        if "/enrichments/{type}" in template and "event/" in template:
            rel = re.sub(r"/enrichments/[^/]+$", f"/enrichments/{ids['enrichmentType']}", rel)
        if "/standings/{type}" in template:
            rel = rel.replace("{type}", "total") if "{type}" in rel else rel

        raw = get(base, headers, rel, params)
        summary = classify_response(template, raw)
        results.append(
            {
                "routeTemplate": template,
                "calledPath": rel,
                "query": params,
                "idsUsed": {k: ids[k] for k in ("eventId", "teamId", "playerId", "tournamentId", "seasonId", "managerId", "date") if k in ids},
                "http": raw.get("http"),
                "bytes": raw.get("bytes"),
                "error": raw.get("error"),
                "classification": summary,
                "bodyPreview": _preview(raw.get("body")),
            }
        )

    # Extra pagination / filter probes documented separately
    extras = []
    events_p1 = get(base, headers, "events", {"page": 1, "limit": 5})
    events_p2 = get(base, headers, "events", {"page": 2, "limit": 5})
    id1 = None
    id2 = None
    try:
        id1 = ((events_p1.get("body") or {}).get("items") or [None])[0].get("id")
        id2 = ((events_p2.get("body") or {}).get("items") or [None])[0].get("id")
    except Exception:
        pass
    pagination_ok = id1 and id2 and id1 != id2

    for label, path, params in [
        ("events status=finished", "events", {"page": 1, "limit": 5, "status": "finished"}),
        ("events status=inprogress", "events", {"page": 1, "limit": 5, "status": "inprogress"}),
        ("events page=9999", "events", {"page": 9999, "limit": 5}),
        ("events page=2 differs from page=1", "events", {"page": 2, "limit": 5}),
        ("search missing q", "search", {"page": 1, "limit": 5}),
        ("event id non-numeric", "event/abc", None),
        ("event id unknown", "event/999999999", None),
        ("standings home", f"unique-tournament/{ids['tournamentId']}/season/{ids['seasonId']}/standings/home", None),
        ("standings away", f"unique-tournament/{ids['tournamentId']}/season/{ids['seasonId']}/standings/away", None),
        ("player events next", f"player/{ids['playerId']}/events/next", {"page": 1, "limit": 5}),
        ("team events next", f"team/{ids['teamId']}/events/next", {"page": 1, "limit": 5}),
    ]:
        raw = get(base, headers, path, params)
        extra_row = {
            "label": label,
            "path": path,
            "params": params,
            "http": raw.get("http"),
            "classification": classify_response(path, raw),
            "bodyPreview": _preview(raw.get("body")),
        }
        if label == "events page=2 differs from page=1":
            extra_row["paginationCheck"] = {
                "page1FirstId": id1,
                "page2FirstId": id2,
                "differentPages": pagination_ok,
            }
        extras.append(extra_row)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "baseUrl": base,
        "sport": "baseball",
        "routeCount": len(route_templates),
        "discoveredIds": ids,
        "routes": results,
        "extraProbes": extras,
    }
    OUT_JSON.write_text(json.dumps(payload, indent=2, default=str))
    print(f"Wrote {OUT_JSON} ({len(results)} routes, {len(extras)} extras)")


def _preview(body, max_len: int = 1200) -> str | None:
    if body is None:
        return None
    text = json.dumps(body, default=str)
    if len(text) > max_len:
        return text[:max_len] + "…"
    return text


if __name__ == "__main__":
    main()
