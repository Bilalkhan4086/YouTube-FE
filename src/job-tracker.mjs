/** One request at a time; status reads never renew the server's browser lease. */
export function startJobTracker({job, request, onProgress, onError, onUnavailable,
 schedule = setTimeout, clear = clearTimeout, now = Date.now}) {
 let stopped = false;
 let paused = false;
 let timer;
 let controller;
 let inFlight = false;
 let wakePending = false;
 let nextHeartbeat = 0;
 let failures = 0;
 const terminal = new Set(['completed', 'failed', 'cancelled']);
 function later(delay) {
  clear(timer);
  if (!stopped && !paused) timer = schedule(poll, delay);
 }
 async function poll() {
  if (stopped || paused || inFlight) return;
  inFlight = true;
  controller = new AbortController();
  let delay = 3000;
  try {
   const heartbeat = job.heartbeatURL && now() >= nextHeartbeat;
   const progress = await request(heartbeat ? job.heartbeatURL : job.progressURL, {
    method: heartbeat ? 'POST' : 'GET', signal: controller.signal,
   });
   if (stopped || paused) return;
   if (heartbeat) nextHeartbeat = now() + 15000;
   failures = 0;
   onError('');
   onProgress(progress);
   if (terminal.has(progress.status)) {stopped = true; return;}
   delay = progress.status === 'queued' ? 5000 : 2000;
  } catch (error) {
   if (stopped || paused) return;
   if ([401, 403, 404, 410].includes(error.status)) {
    stopped = true;
    onUnavailable(error.message);
    return;
   }
   onError(`${error.message} Reconnecting automatically…`);
   delay = Math.min(15000, 2000 * 2 ** failures++);
  } finally {
   inFlight = false;
   if (wakePending) {wakePending = false; delay = 0;}
   later(delay);
  }
 }
 const wake = () => {
  if (stopped) return;
  paused = false;
  nextHeartbeat = 0;
  clear(timer);
  if (inFlight) wakePending = true;
  else void poll();
 };
 void poll();
 return {
  wake,
  pause() {paused = true; clear(timer); controller?.abort();},
  stop() {stopped = true; clear(timer); controller?.abort();},
 };
}
