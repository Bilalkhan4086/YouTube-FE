import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeYoutubeUrl} from '../src/url.mjs';
const canonical='https://www.youtube.com/watch?v=dQw4w9WgXcQ';
test('normalizes supported video URL forms and strips tracking',()=>{
 for(const value of [canonical,'https://youtu.be/dQw4w9WgXcQ?t=10','https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=abc','https://youtube.com/shorts/dQw4w9WgXcQ','https://youtube.com/live/dQw4w9WgXcQ','https://youtube.com/embed/dQw4w9WgXcQ'])assert.equal(normalizeYoutubeUrl(value),canonical);
});
test('rejects unsupported hosts, malformed IDs, credentials and playlists',()=>{
 for(const value of ['','not a url','https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ','https://youtube.com/playlist?list=abc','https://youtu.be/short','ftp://youtu.be/dQw4w9WgXcQ','https://user:pass@youtube.com/watch?v=dQw4w9WgXcQ','https://youtube.com:8080/watch?v=dQw4w9WgXcQ'])assert.equal(normalizeYoutubeUrl(value),null);
});
