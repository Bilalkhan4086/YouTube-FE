import {articles, updated} from '../content/articles.mjs';

export function siteOrigin(value = '') {
 if (!value.trim()) return '';
 const url = new URL(value);
 if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('SITE_URL must be an http(s) origin without a path, credentials, query, or hash.');
 return url.origin;
}
export function configuredSiteOrigin(env = {}) {
 const origin = siteOrigin(env.SITE_URL?.trim() || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : ''));
 if (env.VERCEL === '1') {
  if (!origin) throw new Error('Set SITE_URL to your public HTTPS origin or enable Vercel system environment variables before deploying. A sitemap is required.');
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname === '[::1]' || /^127\./.test(url.hostname)) throw new Error('SITE_URL must be a public HTTPS origin for Vercel deployments, not a localhost URL.');
 }
 return origin;
}
export const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const articlePath = article => `/blog/${article.slug}/`;
export const wordCount = article => plainText(article.body).split(/\s+/).filter(Boolean).length;
export const readTime = article => Math.max(1, Math.ceil(wordCount(article) / 200));
export function plainText(markdown) { return markdown.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[#|*]/g, ' ').replace(/\s+/g, ' ').trim(); }
const headingId = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function inline(value) {
 return escape(value).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
  if (!url.startsWith('/') && !url.startsWith('https://')) throw new Error(`Unsupported editorial link: ${url}`);
  return `<a href="${url}">${label}</a>`;
 });
}
export function renderMarkdown(markdown) {
 return markdown.trim().replace(/^(## .+)\n(?=\S)/gm, '$1\n\n').split(/\n\s*\n/).map(block => {
  const lines = block.split('\n');
  if (block.startsWith('## ')) return `<h2 id="${headingId(block.slice(3))}">${inline(block.slice(3))}</h2>`;
  if (lines.every(line => line.startsWith('- '))) return `<ul>${lines.map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
  if (lines.every(line => /^\d+\. /.test(line))) return `<ol>${lines.map(line => `<li>${inline(line.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
  if (block.startsWith('|')) {
   const rows = lines.map(line => line.split('|').slice(1,-1).map(cell => cell.trim()));
   return `<div class="table-scroll" role="region" aria-label="Comparison table" tabindex="0"><table><thead><tr>${rows[0].map(cell => `<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.slice(2).map(row => `<tr>${row.map(cell => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  return `<p>${inline(block.replaceAll('\n', ' '))}</p>`;
 }).join('\n');
}
const categories = [...new Set(articles.map(a => a.category))];
const marks = ['↗', '≋', '↓', '◎', '+'];
function card(article, index = 0) {
 return `<a class="post-card" href="${articlePath(article)}" data-card data-category="${escape(article.category)}" data-search="${escape(`${article.title} ${article.description} ${article.keyword}`.toLowerCase())}"><div class="card-art tone-${categories.indexOf(article.category)}" aria-hidden="true"><span>${marks[categories.indexOf(article.category)]}</span><small>WAVELY / NOTES</small><b>${String(index+1).padStart(2,'0')}</b></div><div class="card-copy"><div class="eyebrow">${escape(article.category)} <span>· ${readTime(article)} min read</span></div><h2>${escape(article.title)}</h2><p>${escape(article.description)}</p><span class="read-link">Read the guide <span aria-hidden="true">↗</span></span></div></a>`;
}
function shell({title, description, path, content, origin, schema, noindex = false}) {
 const absolute = origin ? `${origin}${path}` : '';
 const graph = schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>` : '';
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#f8faf7"><title>${escape(title)}</title><meta name="description" content="${escape(description)}">${noindex?'<meta name="robots" content="noindex,follow">':''}${absolute?`<link rel="canonical" href="${escape(absolute)}"><meta property="og:url" content="${escape(absolute)}">`:''}<meta property="og:type" content="${path === '/blog/' ? 'website' : 'article'}"><meta property="og:site_name" content="Wavely"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/blog.css">${graph}<script src="/blog.js" defer></script></head><body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="/" aria-label="Wavely home"><span aria-hidden="true">≋</span>wavely<b>.</b></a><nav aria-label="Main navigation"><a href="/">YouTube to MP3</a><a href="/#/tools">All tools</a><a href="/blog/" aria-current="${path === '/blog/' ? 'page' : 'true'}">Blog</a><a href="/#/faq">FAQs</a></nav><a class="button header-button" href="/">Open converter <span aria-hidden="true">↗</span></a></header><main id="main">${content}</main><footer class="site-footer"><div><a class="brand" href="/">wavely<b>.</b></a><p>A little less clicking. A little more listening.</p></div><nav aria-label="Footer navigation"><a href="/">Converter</a><a href="/blog/">All 30 guides</a><a href="/#/faq">FAQs</a></nav><p class="footer-note">© ${updated.slice(0,4)} Wavely. Independent tool. Not affiliated with YouTube or Google.</p></footer></body></html>`;
}
export function renderIndex(origin = '') {
 const content = `<section class="journal-hero"><div class="eyebrow">THE WAVELY JOURNAL <span> / 30 PRACTICAL GUIDES</span></div><h1>A little know-how.<br><em>A better listening life.</em></h1><p>Clear answers about YouTube to MP3 conversion, audio quality, and taking your recordings with you.</p><a class="text-link" href="/blog/youtube-to-mp3-guide/">New here? Start with the essential guide <span aria-hidden="true">↗</span></a></section><section class="journal-list" aria-label="Browse articles"><div class="filters" data-filters hidden><div class="search-field"><label for="article-search">Find a guide</label><input id="article-search" type="search" placeholder="Try bitrate, iPhone, or downloads…" autocomplete="off"></div><div class="category-field"><label for="article-category">Topic</label><select id="article-category"><option value="">All topics</option>${categories.map(c => `<option>${escape(c)}</option>`).join('')}</select></div></div><p class="result-count" data-count aria-live="polite">30 guides for better listening</p><div class="post-grid">${articles.map(card).join('')}</div><div class="empty-state" data-empty hidden><h2>No matching guides</h2><p>Try a broader phrase or choose a different topic.</p><button class="button" type="button" data-reset>Show all guides</button></div><noscript><p>All 30 guides are listed above. Use your browser’s Find feature to locate a topic.</p></noscript></section>`;
 return shell({title:'YouTube to MP3 Guides & Audio Tips | Wavely Blog',description:'Browse 30 practical guides to YouTube to MP3 conversion, bitrate, downloads, devices, and troubleshooting. Find clear steps for better offline listening.',path:'/blog/',origin,content,schema:{'@context':'https://schema.org','@type':'CollectionPage',name:'Wavely Journal',...(origin?{url:`${origin}/blog/`,mainEntity:{'@type':'ItemList',itemListElement:articles.map((a,i)=>({'@type':'ListItem',position:i+1,url:`${origin}${articlePath(a)}`,name:a.title}))}}:{})}});
}
export function renderArticle(article, origin = '') {
 const headings = [...article.body.matchAll(/^## (.+)$/gm)].map(m => m[1]);
 const related = article.related.map(slug => articles.find(a => a.slug === slug));
 if (related.some(a => !a)) throw new Error(`Missing related article for ${article.slug}`);
 const path = articlePath(article);
 const absolute = origin ? `${origin}${path}` : undefined;
 const breadcrumbs = [{'@type':'ListItem',position:1,name:'Home',...(origin?{item:`${origin}/`}:{})},{'@type':'ListItem',position:2,name:'Journal',...(origin?{item:`${origin}/blog/`}:{})},{'@type':'ListItem',position:3,name:article.title,...(absolute?{item:absolute}:{})}];
 const schema = {'@context':'https://schema.org','@graph':[{'@type':'BlogPosting',headline:article.title,description:article.description,datePublished:article.updated,dateModified:article.updated,inLanguage:'en',articleSection:article.category,wordCount:wordCount(article),author:{'@type':'Organization',name:'Wavely',...(origin?{url:origin}:{})},publisher:{'@type':'Organization',name:'Wavely'},...(absolute?{url:absolute,mainEntityOfPage:{'@type':'WebPage','@id':absolute}}:{})},{'@type':'BreadcrumbList',itemListElement:breadcrumbs}]};
 const content = `<article><div class="article-header"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/blog/">Journal</a><span aria-hidden="true">/</span><span>${escape(article.category)}</span></nav><div class="eyebrow">${escape(article.category)} <span>· ${readTime(article)} MIN READ</span></div><h1>${escape(article.title)}</h1><p class="article-deck">${escape(article.description)}</p><div class="byline"><span class="author-mark" aria-hidden="true">w.</span><span>By Wavely <span class="byline-date">Published <time datetime="${article.updated}">October 6, 2026</time></span></span></div></div><div class="article-layout"><aside class="contents"><nav aria-label="Table of contents"><h2>In this guide</h2><ol>${headings.map(h=>`<li><a href="#${headingId(h)}">${escape(h)}</a></li>`).join('')}</ol></nav><a class="text-link" href="/blog/">← All guides</a></aside><div class="article-body">${renderMarkdown(article.body)}<aside class="article-cta"><div class="eyebrow">PUT IT INTO PRACTICE</div><h2>Ready for your next listen?</h2><p>Choose your format, save your file, and check the result. Use recordings you are authorized to download.</p><a class="button" href="/">Open the converter <span aria-hidden="true">↗</span></a></aside></div></div></article><section class="related"><div class="section-heading"><div><div class="eyebrow">KEEP EXPLORING</div><h2>A few useful next reads.</h2></div><a class="text-link" href="/blog/">Browse all guides ↗</a></div><div class="post-grid">${related.map(a=>card(a,articles.indexOf(a))).join('')}</div></section>`;
 return shell({title:`${article.title} | Wavely`,description:article.description,path,content,origin,schema});
}
export function render404(origin = '') {
 return shell({title:'Page not found | Wavely',description:'This Wavely guide could not be found. Browse the journal for conversion, audio quality, and download help.',path:'/404.html',origin,content:'<section class="journal-hero"><div class="eyebrow">404 / PAGE NOT FOUND</div><h1>Nothing playing here.</h1><p>The guide may have moved, or the address may be incomplete.</p><a class="button" href="/blog/">Browse all guides</a></section>',noindex:true});
}
export function sitemap(origin) {
 if (!origin) return '';
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/blog/',...articles.map(articlePath)].map(path=>`<url><loc>${escape(origin+path)}</loc>${path==='/'?'':`<lastmod>${updated}</lastmod>`}</url>`).join('')}</urlset>\n`;
}
export const robots = origin => `# Public pages and assets are crawlable.\nUser-agent: *\nAllow: /\nDisallow: /api/\n${origin?`\nSitemap: ${origin}/sitemap.xml\n`:''}`;
export function llms(origin = '') {
 return `# Wavely\n\n> Wavely is a web-based YouTube to MP3 and MP4 converter with practical guides about audio quality, downloads, devices, and troubleshooting.\n\nUse recordings you own or are authorized to download. Wavely is independent and is not affiliated with YouTube or Google. The converter requires JavaScript; the guides are available as static HTML.\n\n## Main pages\n\n- [Converter](${origin}/): Convert an individual video to MP3 audio or MP4 video.\n- [Wavely Journal](${origin}/blog/): Browse ${articles.length} practical guides.\n\n${categories.map(category=>`## ${category}\n\n${articles.filter(a=>a.category===category).map(a=>`- [${a.title}](${origin}${articlePath(a)}): ${a.description}`).join('\n')}`).join('\n\n')}\n\n## Optional\n\n- [Full guide text](${origin}/llms-full.txt): The published guides in one Markdown document.\n${origin?`- [XML sitemap](${origin}/sitemap.xml): Canonical website URLs.\n`:''}`;
}
export function llmsFull(origin = '') {
 return `# Wavely published guides\n\nThe following text is generated from the same content as the public journal.\n\n${articles.map(a=>`## ${a.title}\n\nSource: ${origin}${articlePath(a)}\nUpdated: ${a.updated}\n\n${a.description}\n\n${a.body.replace(/^## /gm,'### ').replace(/\]\(\/(?!\/)([^)]*)\)/g,(_,path)=>`](${origin}/${path})`)}`).join('\n\n---\n\n')}\n`;
}
function crawlerFiles(origin) {
 return new Map([
  ['/robots.txt', {type:'text/plain', body:robots(origin)}],
  ['/llms.txt', {type:'text/plain', body:llms(origin)}],
  ['/llms-full.txt', {type:'text/plain', body:llmsFull(origin)}],
  ['/sitemap.xml', {type:'application/xml', body:sitemap(origin)}],
 ]);
}
export function blogPlugin(origin = '') {
 const files = crawlerFiles(origin);
 const seoMiddleware = (req, res, next) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  const file = files.get(pathname);
  if (!file) return next();
  const missing = !file.body;
  res.statusCode = missing ? 404 : 200;
  res.setHeader('Content-Type', `${missing ? 'text/plain' : file.type}; charset=utf-8`);
  res.end(missing ? 'Set SITE_URL to generate sitemap.xml.\n' : file.body);
 };
 const middleware = (req, res, next) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  if (!/^\/blog(?:\/|$)/.test(pathname)) return next();
  const normalized = pathname.replace(/\/+$/, '') + '/';
  const article = articles.find(a=>articlePath(a) === normalized);
  const exists = normalized === '/blog/' || article;
  if (exists && pathname !== normalized) {res.statusCode=301;res.setHeader('Location',normalized);res.end();return;}
  res.statusCode = exists ? 200 : 404;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(normalized==='/blog/'?renderIndex(origin):article?renderArticle(article,origin):render404(origin));
 };
 return {name:'wavely-static-blog',configureServer(server){server.middlewares.use(seoMiddleware);server.middlewares.use(middleware);},configurePreviewServer(server){server.middlewares.use(middleware);},generateBundle(){
  this.emitFile({type:'asset',fileName:'blog/index.html',source:renderIndex(origin)});
  for(const article of articles) this.emitFile({type:'asset',fileName:`blog/${article.slug}/index.html`,source:renderArticle(article,origin)});
  this.emitFile({type:'asset',fileName:'404.html',source:render404(origin)});
  for (const [path, file] of files) if (file.body) this.emitFile({type:'asset',fileName:path.slice(1),source:file.body});
  if(!origin) this.warn('Set SITE_URL to your production origin to emit canonical URLs and sitemap.xml. Local blog pages remain available.');
 },transformIndexHtml(html){return html.replace('</head>',`${origin?`<link rel="canonical" href="${escape(origin)}/"><meta property="og:url" content="${escape(origin)}/">`:''}</head>`).replace('<div id="root"></div>','<div id="root"></div><noscript><p><a href="/blog/">Read Wavely’s 30 YouTube to MP3 guides</a>. The converter requires JavaScript.</p></noscript>');}};
}
