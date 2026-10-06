# Wavely blog: content and SEO

Implemented October 6, 2026. The journal contains 30 original English articles, approximately 14,900 body words in total, in five clusters: getting started, audio quality, downloads and devices, listening and organization, and troubleshooting. Each article has a separate practical intent, a primary keyword, source links, and three related guides.

## Keyword strategy

The screenshot supplied with the request is the source for the volumes and difficulty scores below. Its country, collection date, and tool settings were not supplied, so these are planning inputs, not independently verified current estimates. A difficulty of zero is not a ranking guarantee.

The broad converter terms describe substantially overlapping tool intent. The homepage remains their main destination. The blog supports that page with distinct informational questions instead of creating a separate near-duplicate landing page for every word-order variant.

| Supplied keyword | Screenshot volume | Difficulty | Main destination | Supporting guide |
| --- | --- | --- | --- | --- |
| youtube to mp3 | 450K | 53 | `/` | `/blog/youtube-to-mp3-guide/` |
| youtube to mp3 converter | 60.5K | 0 | `/` | `/blog/choose-youtube-to-mp3-converter/` |
| youtube to mp3 player | 27.1K | 48 | `/blog/youtube-to-mp3-player/` | `/blog/mp3-player-transfer/` |
| youtube to mp3 download | 10.8K | 38 | `/` | `/blog/youtube-to-mp3-download/` |
| convert youtube to mp3 | 9.9K | 79 | `/` | `/blog/convert-youtube-to-mp3/` |
| to convert youtube to mp3 | 6.6K | 44 | `/` | `/blog/convert-youtube-to-mp3/` |
| youtube to mp3 downloader | 4.4K | 32 | `/` | `/blog/choose-youtube-to-mp3-converter/` |
| youtube video to mp3 | 3.6K | 48 | `/` | `/blog/youtube-video-to-mp3/` |
| youtube to mp3 convert | 2.4K | 37 | `/` | `/blog/convert-youtube-to-mp3/` |
| download youtube to mp3 | 2.4K | 38 | `/` | `/blog/offline-listening/` |

The 30 article keywords in `blog-keyword-map.csv` are editorial long-tail expansions. No search volume or difficulty has been invented for them. The content library uses the primary query naturally; it does not output a meta-keywords tag or force awkward word-order variants into prose.

## Implementation

- `content/articles.mjs`: titles, primary keywords, categories, descriptions, original article bodies, dates, and related slugs.
- `scripts/blog.mjs`: narrow editorial Markdown renderer and Vite plugin. Emits complete static HTML at `/blog/` and `/blog/<slug>/` in development and production builds.
- `public/blog.css` and `public/blog.js`: responsive journal styling and optional search/topic filtering. The full article collection remains readable and linked without JavaScript.
- `src/main.tsx`: homepage teasers and navigation to real blog URLs. Old `#/blog` links redirect to the equivalent path, including the three original slugs.
- `tests/blog.test.mjs`: content uniqueness/completeness, link and fragment validation, metadata, schema, sitemap, escaping, and not-found checks.

Each page has one H1, a unique title and description, semantic section headings, computed reading time, visible organization byline, publication date, table of contents, inline references, and related reading. Article pages include BlogPosting and BreadcrumbList JSON-LD. The index uses CollectionPage and, with a configured origin, ItemList. Open Graph and Twitter text metadata are included. No fictional author credentials, testimonials, test results, or ranking promises are used.

## Production domain and hosting

Set `SITE_URL` to the real public origin before building, for example:

```sh
SITE_URL=https://your-domain.com npm run build
```

Alternatively put it in the frontend's `.env` file. This is a build-time setting. Use the actual canonical HTTPS origin, without a path, query, or fragment. The deployment must serve the app at the domain root.

With `SITE_URL` configured, the build emits self-canonical URLs, absolute structured-data URLs, homepage canonical, and a 32-URL `sitemap.xml` (home, index, 30 articles). `robots.txt` references that sitemap. Without it, local development still works, but the build warns and omits canonical URLs and the sitemap instead of publishing an invented domain. Set this before production launch.

Deploy the entire `dist/` directory, including `blog/`, `blog.css`, `blog.js`, `robots.txt`, and `404.html`. Configure directory indexes so `/blog/slug/` serves `/blog/slug/index.html`. Redirect known directory URLs without a trailing slash to their slash form. Unknown blog paths must return an actual 404, not the React homepage with status 200. The Vite development and preview servers already enforce this for `/blog` paths; production hosting needs the equivalent setting.

For Nginx, add this alongside the existing API proxy and frontend locations, adapting `root` to your deployment:

```nginx
location = /blog {
    return 301 /blog/;
}
location /blog/ {
    try_files $uri $uri/ =404;
    index index.html;
}
error_page 404 /404.html;
```

Do not apply a blanket SPA rewrite to missing `/blog/` pages. The existing converter still uses hash routes for tools and FAQs, so this work does not require rewriting those routes. Keep the existing `/api/` reverse proxy; Vite's development proxy is not part of the deployed files.

The generated not-found page is noindex. Hash aliases redirect in the client because fragments are not sent to the server. Normal article links use crawlable paths directly.

## Editorial research and maintenance

Product claims were checked against the current frontend and backend code: MP3 options, MP4 output limit, job recovery, temporary retention, supported URL normalization, and unsupported batch/trim controls. In particular, a watch URL with a video ID plus playlist context is normalized to the individual video; a playlist-only URL is rejected.

Primary references are linked next to the relevant article passages:

- YouTube Help: uploaded-video downloads and offline-app behavior.
- Apple Support: locating iPhone/iPad downloads.
- Google Chrome Help: Android file downloads.
- Microsoft Support: file discovery in Windows.
- MDN: audio concepts, codecs, containers, and browser playback.
- Audacity: export settings and editing projects versus audio exports.
- YouTube terms: distinctions concerning download and sharing permissions.

File-size examples are original arithmetic with explicit units and assumptions, not claims about measured service throughput. Articles do not recommend bypassing source restrictions. Wavely-specific behavior should be rechecked when the converter changes; external device instructions should be rechecked as platform interfaces change.

Edit the content source and rebuild to update a page. Change its `updated` value only when its content is actually revised; if separate publication and modification dates are needed later, add both explicitly. Regenerate the keyword CSV with `node scripts/keyword-map.mjs` after changing slugs or targets.

Before launch, set the domain, verify the hosting's real 200/301/404 responses, then submit `/sitemap.xml` in the site's search-engine webmaster tools. Rankings and indexing cannot be verified until the pages are deployed and crawled.
