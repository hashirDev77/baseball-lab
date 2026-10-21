# Baseball Product — data

| File | Description |
| --- | --- |
| `baseball-routes.json` | Official route list (42 paths) extracted from `jjrm365-multi-sport-routes.json` |
| `baseball-endpoint-evidence.json` | Last live probe: HTTP status, classifications, body previews for every route |

Regenerate evidence:

```bash
python3 ../scripts/probe_all_endpoints.py
```

Requires `.env` at repo root with `MSDATA_BASE_URL`, `MSDATA_API_KEY`, `MSDATA_LIVE_KEY`.
