# Baseball Product

React frontend for the **deployed** SportsAPI365 baseball API (`/v1/baseball/*`). This repo is the UI only — no local backend.

## Run

Copy `.env.example` to `.env` and set the keys:

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5175`.

## Deploy on Vercel

Import this repo. Leave **Root Directory** empty.

In Vercel → Settings → Environment Variables:

- `VITE_MSDATA_BASE_URL` = `https://sports-api.sportsdata365.com/msdata`
- `VITE_MSDATA_API_KEY`
- `VITE_MSDATA_LIVE_KEY`

Redeploy after saving. Do not commit `.env`.

The browser talks to same-origin `/msdata/...`. Vercel rewrites that path to the deployed SportsAPI365 host.

## Layout

| Path | Contents |
| --- | --- |
| [`src/`](./src/) | React UI |
| [`docs/`](./docs/) | API testing reports |
| [`data/`](./data/) | Probe evidence |
| [`scripts/`](./scripts/) | Optional Python probes |

Start with [`docs/Baseball_Product_Review.md`](./docs/Baseball_Product_Review.md).
