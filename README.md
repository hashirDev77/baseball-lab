# Baseball Product

A React app that calls the **deployed** SportsAPI365 baseball APIs (`/v1/baseball/*`, 42 routes). There is no local backend.

## Run

Copy `.env.example` to `.env` and set `MSDATA_API_KEY` / `MSDATA_LIVE_KEY`:

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5175`.

The browser always calls same-origin `/msdata/v1/baseball/...`. Vite proxies that path locally; Vercel does the same in production. API keys stay in server env, not in the JS bundle.

## Deploy on Vercel

Import this repo. If Vercel sets **Root Directory** to `apps/web`, leave it — that matches this project. If you leave Root Directory empty, the repo-root `vercel.json` is used instead.

In Vercel → Settings → Environment Variables add:

- `MSDATA_BASE_URL` = `https://sports-api.sportsdata365.com/msdata`
- `MSDATA_API_KEY`
- `MSDATA_LIVE_KEY`

Use Production (and Preview if you want). Do not commit `.env`. Redeploy after saving the variables.

## Layout

| Path | Contents |
| --- | --- |
| [`apps/web`](./apps/web) | React UI |
| [`docs/`](./docs/) | API testing reports |
| [`data/`](./data/) | Probe evidence |
| [`scripts/`](./scripts/) | Repeatable Python probes |

Start with [`docs/Baseball_Product_Review.md`](./docs/Baseball_Product_Review.md).
