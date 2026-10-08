# Google indexing investigation — October 8, 2026

## Diagnosis

The owner reports **Discovered – currently not indexed**. Google knows these URLs but has not crawled them yet. This is not evidence that the XML sitemap is broken. The reason Google has deferred crawling cannot be established from public requests; Search Console crawl statistics, URL Inspection, and host logs are needed. Content is dated October 6, but this does not establish when Google first discovered it.

Google explains the status in its [Page indexing report documentation](https://support.google.com/webmasters/answer/7440203?hl=en). Discovery, crawling, indexing, and ranking are separate steps. A sitemap does not guarantee indexing.

## Live evidence, before changes

Audited `https://youtube-to-mp3.live` using direct HTTP requests:

| Check | Result | Implication |
| --- | --- | --- |
| `/sitemap.xml` | 200, application/xml; parsed XML; 32 distinct expected URLs | No current sitemap delivery or format failure |
| All 32 canonical URLs | 200 HTML, unique titles, matching self-canonicals, no noindex meta/header | No observed blocking indexing directive or redirect target |
| All 31 blog pages | Static HTML including main content and H1 | Blog content does not require React rendering |
| Blog index | Links to all 30 articles in HTML | No orphan articles in the sitemap |
| `/robots.txt` | Allows public pages; blocks only `/api/`; correct sitemap reference | Public blog crawling permitted |
| Unknown root and blog paths | Real 404 responses | No observed homepage fallback / soft-404 routing problem |
| HTTP homepage | 308 to HTTPS | Protocol consolidation works |
| Sample Googlebot user agent | 200, same article body | No observed user-agent block; not a test from Google's IPs |
| Slashless and `index.html` blog variants | 200 duplicate copies | Missing permanent redirects to canonical URLs |
| Homepage initial HTML | Empty React root; blog link only in noscript | Guide discovery depends on rendering or noscript processing |
| `www.youtube-to-mp3.live` | DNS lookup failed | Use the working non-www property and sitemap; configure www in DNS/Vercel if it is advertised or has backlinks |

The duplicate routes and initial homepage links are improvements to crawl efficiency, not proven causes of Google's reported status. There is no evidence here that all 30 articles are rejected for quality. Some introductory topics overlap; review this if Google later reports duplicate selection or **Crawled – currently not indexed**.

## Changes prepared

- `vercel.json`: permanent redirects from slashless blog URLs and explicit HTML index aliases to the existing slash canonical URLs. Rules are scoped to HTML pages; API and asset paths are unaffected. No catch-all rewrite.
- `scripts/blog.mjs`: useful initial homepage content with ordinary links to the journal and the same three featured guides shown by React. React replaces this fallback when it mounts. Readers without JavaScript retain navigation.
- `scripts/check-seo.mjs`: repeatable live deployment checks for all expected sitemap URLs, status codes, titles, canonicals, indexing directives, links, missing pages, aliases, and a simulated crawler user agent. It checks this project's generated markup, not arbitrary websites or actual Google index status.

All 18 existing tests and the production build passed. Route patterns were compiled with path-to-regexp 6.3.0 and checked for every blog canonical, both aliases, redirect loops, and unintended API/asset matches. This is local route validation; Vercel edge behavior must still be verified after deployment.

## Deployment and Search Console follow-up

1. Deploy the changed frontend through its existing Vercel project. Retain `SITE_URL=https://youtube-to-mp3.live` in Production and publish the entire `dist` directory. These source changes are not live merely because the local build passed.
2. From `FE`, run `npm run check:seo -- https://youtube-to-mp3.live`. Expected: zero failures and zero warnings. Any duplicate-route warning means the routing changes are not active yet.
3. In the matching Search Console property, confirm `/sitemap.xml` shows **Success**, 32 discovered pages, and a recent last-read date. Keep the existing sitemap submission if healthy.
4. Inspect `/blog/` and `/blog/youtube-to-mp3-guide/`. Run **Test live URL** and check crawl allowed, successful fetch, indexing allowed, and rendered article content. Then **Request indexing** for these priority pages. This requests consideration, not guaranteed inclusion.
5. Check **Settings → Crawl stats → Host status**, response times, and 429/5xx trends. If Google's live fetch fails while normal requests succeed, inspect Vercel firewall/bot-protection events and verified Google crawler access. Do not infer historical server overload from the status alone.
6. Track the last-crawl date and exclusion reason over the following weeks. Repeatedly submitting unchanged URLs does not establish that the underlying cause is fixed. If the reason becomes **Crawled – currently not indexed**, examine content usefulness and Google's selected canonical before changing the sitemap again.

The tools and FAQ screens use hash routes. They are not separate entries in this 32-URL sitemap and should not be expected to index as independent pages. Separate indexable pages would require real URLs and their own useful content.
