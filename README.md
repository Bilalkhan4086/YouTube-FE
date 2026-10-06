# Wavely frontend

Responsive React + TypeScript frontend for the sibling `Youtube to Mp3` distributed backend. Includes MP3/MP4 conversion, quality selection, actual processing stages, cancellation, preview/download, refresh recovery in the current tab, a tools directory, 30 original SEO blog articles, and FAQs.

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

The converter, tools, and FAQs use hash routes. The blog uses real `/blog/` and `/blog/<slug>/` URLs with complete static HTML generated at build time. Article content lives in `content/articles.mjs`; blog rendering and styling live in `scripts/blog.mjs` and `public/blog.css`. The journal provides search, topic filters, tables of contents, source links, and related reading. Old hash-based blog links redirect to the new paths. Future tools are clearly marked as coming soon.

Set `SITE_URL` to your actual public origin before a production build to include canonical URLs and the sitemap. Without it, local pages work but production URL metadata is intentionally omitted. Serve the generated blog directories directly and return 404 for unknown blog URLs. See [blog SEO and deployment guidance](docs/blog-seo.md) and the [30-page keyword map](docs/blog-keyword-map.csv).

Current-tab job capability URLs are held in sessionStorage solely to resume polling after refresh. Access keys and session credentials are never persisted. Downloads remain subject to backend expiry and conversion limits. Use media you own or are permitted to download.

## Queue and presence

New browser conversions opt into the distributed API’s presence lease. The UI displays
an estimated queue position, polls status every 5 seconds while queued / 2 seconds
while processing, and renews presence every 15 seconds with a POST heartbeat. Temporary
failures retry automatically with capped backoff. Closing or navigating away from the
conversion page stops presence; after 90 seconds by default, queued work is cancelled
and active work is stopped through worker cleanup. Brief refreshes resume from the
current tab. A suspended background tab or sustained offline period may also time out;
completed files retain their normal expiry. Requires backend schema revision 3 and the
updated API, dispatcher, and workers. See [backend behavior](../BE/docs/queue-presence.md).
