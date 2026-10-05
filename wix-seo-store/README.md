# Wix SEO Store

SEO-first, fully server-rendered storefront built with **TanStack Start** on top
of a **Wix Stores** site via **Wix Headless** (`@wix/sdk` + `@wix/stores` +
`@wix/categories`, OAuth visitor tokens). Supports both Wix Stores catalogs:
**Catalog V3** (`productsV3` + categories, the default for new stores) and
**Catalog V1** (`products` + collections), auto-detected per site. Scaffolded with `@tanstack/cli create` (React, Nitro node-server,
ESLint).

## Run

```bash
cp .env.example .env        # set WIX_CLIENT_ID + SITE_URL
npm install
npm run dev                 # http://localhost:3000
npm run build          # Cloudflare Workers build: dist/{client,server} + .wrangler/deploy
node scripts/verify-seo.mjs http://localhost:3000   # no-JS SEO assertions
```

| Env var | Purpose |
| --- | --- |
| `WIX_CLIENT_ID` | Client ID of a Wix Headless OAuth app. **Unset → built-in mock catalog** (clearly marked: footer notice + `X-Data-Source: mock`). |
| `SITE_URL` | Absolute origin for canonical, `og:url`, JSON-LD, sitemap, robots. Defaults to the request origin. |
| `SITE_NAME`, `SITE_DESCRIPTION` | Branding / default meta. |
| `SITE_LOGO_URL` | Logo for Organization JSON-LD (absolute URL or site path). Default `/logo.png`. |
| `WIX_CATALOG_VERSION` | `V1` or `V3` to skip catalog auto-detection. |

## Routes

| Path | Notes |
| --- | --- |
| `/` | Featured products + collections. Organization/WebSite(SearchAction)/ItemList JSON-LD. |
| `/category/$slug?page=N` | Wix collection listing, 12/page, rel prev/next, self-canonical, `?page=1` → 301, out-of-range → 404, `noindex` beyond page 10. BreadcrumbList + CollectionPage/ItemList JSON-LD. |
| `/products/$slug` | PDP. `og:type=product`, product:* OG tags, Product/Offer + BreadcrumbList JSON-LD, preloaded LCP image. |
| `/search?q=` | Internal search (`noindex`, `private, no-store`). Target of the WebSite SearchAction. |
| `/cart` | Wix eCom current cart (`noindex`, `private, no-store`). |
| `/sitemap.xml`, `/robots.txt` | Server routes generated from the catalog. |
| anything else | Real HTTP 404 with `noindex`. |

## Where things live

- `src/lib/seo.ts` – `seo()` head builder, JSON-LD helpers.
- `src/lib/media.ts` – Wix media transform URLs (AVIF/WebP/JPEG srcsets).
- `src/components/Picture.tsx` – `<picture>` + LCP preload descriptor.
- `src/lib/api.ts` – server functions used by route loaders.
- `src/server/catalog/index.ts` – picks mock / Wix, and detects the site's catalog version.
- `src/server/catalog/wix-v3.ts` – Wix Stores Catalog V3 provider (products, categories, variants).
- `src/server/catalog/wix.ts` – Wix Stores Catalog V1 provider; `mock-data.ts` – fallback.
- `src/server/cart.ts` – Wix eCom current cart with visitor tokens in an httpOnly cookie.
- `src/start.ts` – Wix site-script injection and the /checkout, /_paylink, /_proposal, /_api hand-offs.
- `src/server/site-scripts.ts` – Wix site scripts (Custom Code, marketing tags, consent, analytics).
- `src/server/auth.ts`, `src/routes/account.*.ts` – Wix member login/logout (Base44 reserves `/api/auth/*`).
- `src/lib/analytics.ts` – ViewContent / AddToCart / InitiateCheckout via `window.wixAnalytics`.

## Get a Wix store to test against

```bash
npx @wix/cli login                       # device login
npm create @wix/new@latest headless init -- --site-template commerce \
  --business-name "My Store" --folder-name my-store --skip-install --no-publish
```

The generated `my-store/.env.local` contains `WIX_CLIENT_ID` (public). The
commerce template seeds 12 products in one "All Products" category, including
variant products (Size/Color), a sale item and an out-of-stock item.

## Failure behavior

- Wix unreachable: pages render a `noindex` error page with HTTP 500 and
  `Cache-Control: no-store` (the header/nav still render); `sitemap.xml`
  returns 503 with `Retry-After` so crawlers retry instead of dropping URLs.
- Unknown product/category slugs and out-of-range pages are real 404s.

## Verified against a live Catalog V3 store

- `scripts/verify-seo.mjs`: all checks pass on live data and on mock data.
- Browser flow: pick a variant, add to the Wix cart, add a second product,
  then checkout redirects to the Wix-hosted checkout.
- Lighthouse (live Wix media, mobile / desktop): performance 93–98 / 100,
  accessibility 100, SEO 100. Best practices is 78 only because the test ran
  over plain http (`is-on-https`); it is 100 over HTTPS.
- Pagination and multi-collection nav are exercised on mock data; the seeded
  Wix template has 12 products in a single category.

## Deployed on Base44

Live: https://wix-seo-storefront-716be8c4.base44.app (Base44 app `6ac34c6ec1768adf716be8c4`,
TanStack Start template, Cloudflare Workers). Built with the template's toolchain
(`@base44/vite-plugin`, `@cloudflare/vite-plugin`, `wrangler.jsonc`) and published from the
app sandbox. App secrets: `WIX_CLIENT_ID`, `WIX_SITE_URL`, `SITE_NAME`.

Verified on the live HTTPS URL: `verify-seo.mjs` 116/116; browser flow (variant add-to-cart,
Wix cart, checkout hand-off to Wix) with the Wix analytics and consent runtimes loaded;
Lighthouse mobile 96, desktop 99–100, SEO and accessibility 100.
