import { useState } from 'react'
import { rateInvoice } from '../../services/invoiceService'
import type { Invoice } from '../../types'
export default function RatingBox({ inv, ownerId, onDone }: { inv: Invoice; ownerId: string; onDone: () => void }) {
  const [stars, setStars] = useState(inv.stars ?? 0); const [c, setC] = useState(inv.review ?? ''); const [err, setErr] = useState(''); const [open, setOpen] = useState(false)
  const save = async () => { try { await rateInvoice(inv.id, ownerId, stars, c); setOpen(false); onDone() } catch (e) { setErr((e as Error).message) } }
  if (!open) return (<div className="w-full text-xs text-slate-400">{inv.stars ? <span className="text-warn">{'★'.repeat(inv.stars)}{'☆'.repeat(5 - inv.stars)}</span> : 'Serviço ainda não avaliado.'} {inv.review && `"${inv.review}"`} <button className="underline" onClick={() => setOpen(true)}>{inv.stars ? 'Editar avaliação' : 'Avaliar serviço'}</button></div>)
  return (<div className="w-full space-y-2 border-t border-line pt-3"><div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setStars(n)} aria-label={`${n} estrelas`} className={n <= stars ? 'text-xl text-warn' : 'text-xl text-slate-600'}>★</button>)}</div>
    <input className="input" placeholder="Comentário (opcional)" value={c} onChange={e => setC(e.target.value)} />{err && <p className="err">{err}</p>}
    <div className="flex gap-2"><button className="btn" disabled={!stars} onClick={save}>Enviar avaliação</button><button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button></div></div>)
}
