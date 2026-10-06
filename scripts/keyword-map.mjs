import {writeFileSync} from 'node:fs';
import {articles} from '../content/articles.mjs';
import {articlePath, wordCount} from './blog.mjs';
const csv = value => `"${String(value).replaceAll('"','""')}"`;
const rows=[['URL','Primary keyword','Topic cluster','Title','Description','Body words','Related URLs'],...articles.map(a=>[articlePath(a),a.keyword,a.category,a.title,a.description,wordCount(a),a.related.map(slug=>`/blog/${slug}/`).join(' | ')])];
writeFileSync(new URL('../docs/blog-keyword-map.csv',import.meta.url), rows.map(row=>row.map(csv).join(',')).join('\n')+'\n');
