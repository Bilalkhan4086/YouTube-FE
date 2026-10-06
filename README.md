# Wavely frontend

Responsive React + TypeScript frontend for the sibling `Youtube to Mp3` distributed backend. Includes MP3/MP4 conversion, quality selection, actual processing stages, cancellation, preview/download, refresh recovery in the current tab, a tools directory, three starter blog articles, and FAQs.

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite (normally http://localhost:5173). Start the backend separately using its README. The development server proxies `/api` to `http://localhost:8000`. Copy `.env.example` to `.env` to change `API_PROXY_TARGET`.

The frontend follows `config → auth → init → signed convert → progress → download` and targets the distributed API. Anonymous development sessions work automatically. Protected servers prompt for an access key held only in memory. Never put a shared API key in Vite environment variables or public assets. For a public production app, implement end-user authentication through the backend as described in its README.

## Verify and build

```sh
npm test
npm run build
npm run preview
```

Deploy `dist/` with a reverse proxy routing `/api/` to your backend. The Vite development proxy is not included in the production build or preview server. Alternatively set `VITE_API_BASE_URL` to the public backend origin at build time and configure the backend's `CORS_ORIGINS`. Signed URLs returned by the backend must be browser-reachable. Send `Referrer-Policy: no-referrer` and avoid logging capability query strings.

Routes use hashes so tools, articles, and FAQs work on static hosting without rewrite rules. Article content and tool cards live in `src/main.tsx`; styles are in `src/styles.css`. Blog copy is starter editorial content. Future tools are clearly marked as coming soon. Google Fonts enhance typography with local sans-serif fallbacks when unavailable.

Current-tab job capability URLs are held in sessionStorage solely to resume polling after refresh. Access keys and session credentials are never persisted. Downloads remain subject to backend expiry and conversion limits. Use media you own or are permitted to download.
