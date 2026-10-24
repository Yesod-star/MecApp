const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5080'
export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let r: Response
  try { r = await fetch(BASE + path, { method: init?.method, headers: { 'Content-Type': 'application/json' }, body: init?.body ? JSON.stringify(init.body) : undefined }) }
  catch { throw new Error('Não foi possível conectar à API. Ela está rodando em ' + BASE + '?') }
  const body = r.status === 204 ? null : await r.json().catch(() => null)
  if (!r.ok) throw new Error(body?.message ?? 'Erro no servidor (' + r.status + ')')
  return body as T
}
