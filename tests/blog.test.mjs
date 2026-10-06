import test from 'node:test';
import assert from 'node:assert/strict';
import {articles} from '../content/articles.mjs';
import {articlePath, renderArticle, renderIndex, render404, renderMarkdown, sitemap, siteOrigin, wordCount} from '../scripts/blog.mjs';
const origin = 'https://wavely.example';
test('30 distinct, complete guides have unique URLs, descriptions, targets, and valid related reading', () => {
 assert.equal(articles.length,30);
 for (const key of ['slug','title','description','keyword']) assert.equal(new Set(articles.map(a=>a[key])).size,30,key);
 for(const article of articles){
  assert.match(article.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(wordCount(article)>=400,article.slug);
  assert.ok((article.body.match(/^## /gm)||[]).length>=5,article.slug);
  assert.match(article.body,/\]\(https:\/\//,article.slug);
  assert.equal(article.related.length,3);
  assert.equal(new Set(article.related).size,3);
  for(const slug of article.related) assert.ok(slug!==article.slug && articles.some(a=>a.slug===slug),slug);
 }
});
test('every article is complete HTML with one H1, unique canonical, matching schema, and valid fragments', () => {
 for (const article of articles){
  const html=renderArticle(article,origin);
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert.ok(html.includes(`<link rel="canonical" href="${origin}${articlePath(article)}">`));
  assert.ok(!html.includes('noindex'));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema['@graph'][0].headline,article.title);
  assert.equal(schema['@graph'][0].mainEntityOfPage['@id'],origin+articlePath(article));
  for (const [,fragment] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${fragment}"`),`${article.slug}: ${fragment}`);
  assert.ok(html.includes('<h2 id='));
  assert.ok(html.includes(article.description.replaceAll('&','&amp;')));
 }
});
test('all local blog links resolve and the index links to every guide without JavaScript', () => {
 const paths=new Set(['/blog/',...articles.map(articlePath)]);
 for(const html of [renderIndex(origin),...articles.map(a=>renderArticle(a,origin))]) {
  for(const [,path] of html.matchAll(/href="(\/blog\/[^"]*)"/g)) assert.ok(paths.has(path),path);
 }
 const index=renderIndex(origin);
 assert.equal((index.match(/data-card /g)||[]).length,30);
 for(const article of articles) assert.ok(index.includes(`href="${articlePath(article)}"`));
});
test('sitemap contains 32 absolute canonical URLs and no hashes or invented production domain', () => {
 const xml=sitemap(origin);
 assert.equal((xml.match(/<loc>/g)||[]).length,32);
 assert.ok(!xml.includes('#'));
 for(const article of articles) assert.ok(xml.includes(`<loc>${origin}${articlePath(article)}</loc>`));
 assert.equal(sitemap(''),'');
 assert.ok(!renderArticle(articles[0]).includes('rel="canonical"'));
});
test('site origin validation rejects credentials and non-origin URLs', () => {
 assert.equal(siteOrigin(''),'');
 assert.equal(siteOrigin('https://wavely.example/'),origin);
 for (const url of ['javascript:alert(1)','https://name:secret@example.com','https://example.com/path','https://example.com/?q=a','https://example.com/#x']) assert.throws(()=>siteOrigin(url));
});
test('editorial markup escapes HTML and rejects active link protocols', () => {
 assert.equal(renderMarkdown('<script>alert(1)</script>'),'<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
 assert.throws(()=>renderMarkdown('[click](javascript:alert)'));
 const table=renderMarkdown('| Setting | Size |\n| --- | --- |\n| 128 | 10 |');
 assert.match(table,/<th scope="col">Setting<\/th>/);
 assert.ok(!table.includes('<td>---</td>'));
});
test('not-found output is noindex and links readers back to the journal', () => {
 const html=render404();
 assert.match(html,/name="robots" content="noindex,follow"/);
 assert.match(html,/href="\/blog\/"/);
});
