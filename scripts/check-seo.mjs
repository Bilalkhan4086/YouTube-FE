// Deployment smoke check, not a Google indexing-status checker. Node 20+.
import {articles, updated} from '../content/articles.mjs';
import {articlePath, siteOrigin} from './blog.mjs';

const origin = siteOrigin(process.argv[2] || process.env.SITE_URL || '');
if (!origin) throw new Error('Usage: npm run check:seo -- https://your-domain.com');
const failures = [];
const warnings = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
async function get(path, userAgent = 'Wavely-SEO-Check/1.0') {
 const response = await fetch(new URL(path, origin), {
  redirect: 'manual', signal: AbortSignal.timeout(20000), headers: {'User-Agent': userAgent},
 });
 return {status: response.status, headers: response.headers, body: await response.text()};
}
function checkPage(page, path) {
 check(page.status === 200, `${path}: HTTP ${page.status}`);
 check(/text\/html/i.test(page.headers.get('content-type') || ''), `${path}: not HTML`);
 check(!/noindex|\bnone\b/i.test(page.headers.get('x-robots-tag') || ''), `${path}: blocked by X-Robots-Tag`);
 check(!/<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*content=["'][^"']*(?:noindex|\bnone\b)/i.test(page.body), `${path}: noindex metadata`);
 const canonicals = [...page.body.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/g)].map(m => m[1]);
 check(canonicals.length === 1 && canonicals[0] === origin + path, `${path}: canonical ${JSON.stringify(canonicals)}`);
 if (path.startsWith('/blog/')) check(/<h1>/.test(page.body) && /<main\b/.test(page.body), `${path}: missing static page content`);
}

try {
 const xml = await get('/sitemap.xml');
 check(xml.status === 200 && /(?:application|text)\/xml/.test(xml.headers.get('content-type') || ''), 'Sitemap must return 200 XML');
 check(xml.body.includes('http://www.sitemaps.org/schemas/sitemap/0.9'), 'Sitemap namespace missing');
 const urls = [...xml.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
 const paths = ['/', '/blog/', ...articles.map(articlePath)];
 check(urls.length === paths.length && new Set(urls).size === paths.length, 'Sitemap count/uniqueness mismatch');
 for (const path of paths) check(urls.includes(origin + path), `Sitemap missing ${path}`);
 const robots = await get('/robots.txt');
 check(robots.status === 200 && robots.body.includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt missing sitemap');
 check(/^Allow: \/\s*$/m.test(robots.body) && !/^Disallow: \/(?:blog\/?)?\s*$/m.test(robots.body), 'Review robots crawl permissions');
 // Small batches avoid putting a large burst of traffic on the site.
 const titles = new Set();
 for (let i = 0; i < paths.length; i += 4) {
  const results = await Promise.all(paths.slice(i, i + 4).map(async path => ({path, page: await get(path)})));
  for (const {path, page} of results) {
   checkPage(page, path);
   const title = page.body.match(/<title>(.*?)<\/title>/s)?.[1];
   check(Boolean(title) && !titles.has(title), `${path}: missing/duplicate title`);
   titles.add(title);
   if (path === '/blog/') for (const article of articles) check(page.body.includes(`href="${articlePath(article)}"`), `Index missing link to ${article.slug}`);
   if (path === '/') {
    const withoutNoscript = page.body.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
    if (!withoutNoscript.includes('href="/blog/"')) warnings.push('Homepage blog discovery depends on JavaScript or noscript');
   }
  }
 }
 for (const path of ['/seo-check-page-that-does-not-exist/', '/blog/seo-check-page-that-does-not-exist/']) {
  const page = await get(path);
  check(page.status === 404, `${path}: expected real 404, got ${page.status}`);
 }
 for (const [path, destination] of [
  ['/blog', '/blog/'], ['/blog/index.html', '/blog/'],
  [articlePath(articles[0]).slice(0, -1), articlePath(articles[0])],
  [articlePath(articles[0]) + 'index.html', articlePath(articles[0])],
 ]) {
  const page = await get(path);
  if (![301, 308].includes(page.status) || new URL(page.headers.get('location') || path, origin).href !== origin + destination) {
   warnings.push(`${path}: should permanently redirect to ${destination}, got ${page.status}`);
  }
 }
 const bot = await get(articlePath(articles[0]), 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
 checkPage(bot, articlePath(articles[0]));
 console.log(`Checked ${paths.length} canonical pages, sitemap, robots, missing pages, URL variants, and simulated Googlebot response. Content revision: ${updated}.`);
 console.log('A simulated user agent does not verify access from real Googlebot IPs; use Search Console Live Test for that.');
} catch (error) {
 failures.push(error.message);
}
for (const warning of warnings) console.warn(`WARN: ${warning}`);
for (const failure of failures) console.error(`FAIL: ${failure}`);
console.log(`${failures.length} failures; ${warnings.length} warnings. This does not prove Google has indexed the pages.`);
process.exitCode = failures.length ? 1 : 0;
