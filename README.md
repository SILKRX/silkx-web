# SILKX — website

Digital real estate boutique for Tashkent: new developments, rentals, student housing and short-term stays,
with 3D tours (360°), map-based listings and an AI assistant.

**Stack:** Next.js 14 (App Router) · React 18 · TypeScript (strict) · Tailwind CSS 3 · Supabase (REST, optional) · zero-dependency WebGL 360° viewer.

## Run locally

```bash
npm install
npm run dev
```
Open http://localhost:3000

## Pages

| Route | What it is |
|---|---|
| `/` | Home: video / animated Tashkent hero, hot offers, 3D tour showcase, audiences |
| `/catalog` | Catalog with filters (district, rooms, price, deal type) |
| `/complex/[id]`, `/rent/[id]` | Property page: gallery, 3D tour, facts, map, contact |
| `/add` | Owners add a property: category, map pin, photos, 360° panoramas → moderation |
| `/api/listings`, `/api/listings/upload` | Listing submission + per-file image upload |

## Configuration

Copy `.env.example` → `.env.local` (never committed).

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Save listings and photos (run `supabase/migrations/*.sql` first). Without them the form runs in demo mode. |
| `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` | Real Yandex Maps. Without it the free OpenStreetMap map is used. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | New-listing alerts to the moderator. |

Social links, phone, e-mail and the hero video: `lib/site-config.ts`.

## Team workflow

```bash
git pull                       # get teammates' changes
git checkout -b feature/name   # work on a branch
git add . && git commit -m "what changed"
git push -u origin feature/name   # then open a Pull Request on GitHub
```
