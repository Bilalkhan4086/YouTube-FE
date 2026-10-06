export function normalizeYoutubeUrl(value) {
 try {
  const u = new URL(value.trim());
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || (u.port && !['80','443'].includes(u.port))) return null;
  const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/');
  let id;
  if (u.hostname === 'youtu.be' && parts.length === 1) id = parts[0];
  if (['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'].includes(u.hostname)) {
   if (u.pathname === '/watch') id = u.searchParams.get('v');
   else if (parts.length === 2 && ['shorts','embed','live'].includes(parts[0])) id = parts[1];
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube.com/watch?v=${id}` : null;
 } catch { return null; }
}
