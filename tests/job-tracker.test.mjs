import test from 'node:test';
import assert from 'node:assert/strict';
import {startJobTracker} from '../src/job-tracker.mjs';
const flush = () => new Promise(resolve => setImmediate(resolve));
const job = {heartbeatURL:'/heartbeat', progressURL:'/progress'};
function harness(request) {
 let clock=0;
 const tasks=new Map(), states=[], errors=[], unavailable=[], calls=[];
 let sequence=0;
 const tracker=startJobTracker({job,request:async (path,options)=>{calls.push([path,options.method]);return request(path,options);},
  onProgress:p=>states.push(p),onError:e=>errors.push(e),onUnavailable:e=>unavailable.push(e),
  now:()=>clock,schedule:(fn,delay)=>{const id=++sequence;tasks.set(id,{fn,delay});return id;},clear:id=>tasks.delete(id)});
 return {tracker,tasks,states,errors,unavailable,calls,async tick(){
  const [id,task]=tasks.entries().next().value;tasks.delete(id);clock+=task.delay;task.fn();await flush();
 }};
}
test('queue rank updates, heartbeat renews every 15 seconds, and completion stops polling',async()=>{
 let result={status:'queued',queue_position:10};
 const h=harness(async()=>result);
 await flush();
 assert.deepEqual(h.calls,[['/heartbeat','POST']]);
 result={status:'queued',queue_position:9};await h.tick();
 assert.equal(h.states.at(-1).queue_position,9);
 assert.deepEqual(h.calls.at(-1),['/progress','GET']);
 await h.tick();await h.tick();
 assert.deepEqual(h.calls.at(-1),['/heartbeat','POST']);
 result={status:'running',stage:'encoding'};await h.tick();
 assert.equal([...h.tasks.values()][0].delay,2000);
 result={status:'completed'};await h.tick();
 assert.equal(h.tasks.size,0);
});
test('temporary failures retry automatically and do not renew the heartbeat clock on failure',async()=>{
 let fail=true;
 const h=harness(async()=>{if(fail)throw new Error('Offline');return {status:'queued'};});
 await flush();await h.tick();
 assert.equal(h.errors.length,2);
 assert.match(h.errors[0],/Reconnecting automatically/);
 assert.equal([...h.tasks.values()][0].delay,4000);
 fail=false;await h.tick();
 assert.deepEqual(h.calls.at(-1),['/heartbeat','POST']);
 assert.equal(h.errors.at(-1),'');h.tracker.stop();
});
test('expired capabilities stop retries and release the UI from its busy state',async()=>{
 const h=harness(async()=>{throw Object.assign(new Error('Job expired'),{status:410});});
 await flush();assert.deepEqual(h.unavailable,['Job expired']);assert.equal(h.tasks.size,0);
 h.tracker.wake();assert.equal(h.calls.length,1);
});
test('page departure aborts pending status and ignores late responses',async()=>{
 let resolve,signal;
 const h=harness((_,options)=>{signal=options.signal;return new Promise(r=>resolve=r);});
 h.tracker.stop();assert.equal(signal.aborted,true);
 resolve({status:'completed'});await flush();
 assert.equal(h.states.length,0);assert.equal(h.tasks.size,0);
});
test('page restore immediately checks presence without overlapping requests',async()=>{
 let resolve;
 const h=harness(()=>new Promise(r=>resolve=r));
 h.tracker.pause();h.tracker.wake();h.tracker.wake();
 assert.equal(h.calls.length,1);
 resolve({status:'queued'});await flush();
 await h.tick();assert.equal(h.calls.length,2);
 h.tracker.stop();resolve({status:'queued'});await flush();
});
test('cancelled requests stop polling and cannot be woken back into work',async()=>{
 const h=harness(async()=>({status:'cancelled',error_code:'client_disconnected'}));
 await flush();h.tracker.wake();
 assert.equal(h.states[0].error_code,'client_disconnected');assert.equal(h.tasks.size,0);assert.equal(h.calls.length,1);
});
