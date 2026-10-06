const base = ((import.meta as unknown as {env:Record<string,string>}).env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export function apiUrl(path:string) { return /^https?:\/\//.test(path) ? path : `${base}${path}`; }
export class ApiError extends Error {
 constructor(message:string, public status:number) {super(message);}
}
export async function request<T>(path:string, options:RequestInit = {}):Promise<T> {
 const controller = new AbortController();
 const abort = () => controller.abort();
 options.signal?.addEventListener('abort', abort, {once:true});
 if(options.signal?.aborted) controller.abort();
 const timeout = setTimeout(() => controller.abort(), 20000);
 try {
  const res = await fetch(apiUrl(path), {...options, signal:controller.signal, headers:{'Content-Type':'application/json', ...options.headers}});
  const data = await res.json().catch(() => null);
  if (!res.ok) {
   const detail = data?.detail;
   throw new ApiError(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((x:{msg:string})=>x.msg).join(' ') : data?.message || `Request failed (${res.status}). Please try again.`, res.status);
  }
  if (!data) throw new Error('The conversion service returned an unexpected response. Please try again.');
  return data as T;
 } catch (e) {
  if (e instanceof TypeError || (e instanceof Error && e.name === 'AbortError')) throw new Error('Unable to reach the conversion service. Please check your connection and try again.');
  throw e;
 } finally {clearTimeout(timeout);options.signal?.removeEventListener('abort', abort);}
}
export type Job = {id:string;progressURL:string;downloadURL:string;previewURL:string;cancelURL:string;format:'mp3'|'mp4';heartbeatURL?:string|null};
export type Progress = {status:string;stage:string;error?:string;error_code?:string;size_bytes?:number;expires_at?:number;format:'mp3'|'mp4';queue_position?:number|null;queue_total?:number;cancel_requested?:boolean;client_presence_seconds?:number|null};
