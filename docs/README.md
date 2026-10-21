# Baseball Product — documentation

| Document | Description |
| --- | --- |
| [Baseball_Product_Review.md](./Baseball_Product_Review.md) | **Start here:** how to run the lab, testing playbook, API blockers |
| [baseball_api_reports.md](./baseball_api_reports.md) | Combined coverage notes from earlier lab runs |
| [baseball_api_testing_report.md](./baseball_api_testing_report.md) | **API testing:** 42-route pass, verdicts, response types |
| [baseball_api_variation_testing.md](./baseball_api_variation_testing.md) | **Variations:** multiple event states/entities, status filters, **page 2000**, limit edges |
| [baseball_api_endpoint_catalog.md](./baseball_api_endpoint_catalog.md) | Full catalog of all 42 baseball endpoints: HTTP status, response shapes, pagination, ID dependencies, QA findings |

Raw probe output lives in [`../data/`](../data/) (not duplicated here).

## Regenerate

From the repo root:

```bash
pnpm audit:variations
python3 scripts/probe_all_endpoints.py
python3 scripts/generate_endpoint_doc.py
python3 scripts/generate_api_testing_report.py
python3 scripts/probe_variations.py
python3 scripts/generate_variation_report.py
```
