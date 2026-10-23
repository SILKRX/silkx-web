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
| `/api/assistant` | SILKX AI: voice/chat assistant in UZ · RU · EN · ZH · KO · TR |

## SILKX AI (voice assistant)

- 6 languages: Uzbek, Russian, English, Chinese, Korean, Turkish (`lib/property-details.ts → ASSISTANT_LANGS`).
- Voice input and spoken answers use the browser's Web Speech API (Chrome, Edge, Safari). Spoken answers need a system voice for that language.
- Answers only from catalog data: property details, rental terms, the mortgage checklist and rules for foreign buyers.
- Mortgage rules (down payment, term, loan limit, rate, exchange rate) live in `CREDIT_RULES` in `lib/property-details.ts`. Update them when bank terms change.

## Configuration

Copy `.env.example` → `.env.local` (never committed).

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Save listings and photos (run `supabase/migrations/*.sql` first). Without them the form runs in demo mode. |
| `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` | Real Yandex Maps. Without it the free OpenStreetMap map is used. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | New-listing alerts to the moderator. |
| `ANTHROPIC_API_KEY` | Real AI answers for SILKX AI (Claude). Without it the assistant answers from built-in rules in all 6 languages. |
| `ASSISTANT_MODEL` | Optional: another Claude model id (default `claude-haiku-5-5`). |

Social links, phone, e-mail and the hero video: `lib/site-config.ts`.

## Team workflow

```bash
git pull                       # get teammates' changes
git checkout -b feature/name   # work on a branch
git add . && git commit -m "what changed"
git push -u origin feature/name   # then open a Pull Request on GitHub
```

## 3D tour photos

Demo tours use real 360° interior photos from [Poly Haven](https://polyhaven.com) (CC0 license: free for any use, no attribution required).
Download them once: `powershell -ExecutionPolicy Bypass -File scripts\get-demo-tours.ps1` (saves to `public/tours/real/`).
If the files are missing, the tour falls back to the generated rooms in `public/tours/`.
