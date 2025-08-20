const BASE = 'http://127.0.0.1:5000'
export type Msg = { role: 'system' | 'user' | 'assistant'; content: string }
export async function chat(history: Msg[], modelName?: string) {
  const url = new URL(`${BASE}/chat`)
  if (modelName) url.searchParams.set('model_name', modelName)
  const res = await fetch(url.toString(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ history }) })
  return res.json() as Promise<{ reply?: string; tts_url?: string | null; avatar_url?: string | null; error?: string }>
}
export async function stt(blob: Blob) {
  const fd = new FormData(); fd.append('file', blob, 'mic.webm')
  const res = await fetch(`${BASE}/stt`, { method: 'POST', body: fd })
  return res.json() as Promise<{ text?: string; error?: string }>
}
export async function ollamaHealth() {
  const res = await fetch(`${BASE}/ollama/health`)
  return res.json() as Promise<{ ok: boolean; error?: string | null }>
}
export async function getCatalog() {
  const res = await fetch(`${BASE}/models/catalog`)
  return res.json() as Promise<{ models: string[] }>
}
export async function getLocalModels() {
  const res = await fetch(`${BASE}/models/local`)
  return res.json() as Promise<{ models: { name: string; size?: number }[]; error?: string }>
}
export async function pullModelStart(model: string) {
  const res = await fetch(`${BASE}/models/pull`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model }) })
  return res.json() as Promise<{ job_id?: string | null; done?: boolean; progress?: number; error?: string }>
}
export async function pullModelStatus(jobId: string) {
  const res = await fetch(`${BASE}/models/pull/${jobId}`)
  return res.json() as Promise<{ done?: boolean; progress?: number; status?: string; error?: string }>
}
export const staticUrl = (path: string) => `${BASE}${path}`