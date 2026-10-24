import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { listVehicles, listOwners } from '../../services/vehicleService'
import { createInvoice, calcTotal } from '../../services/invoiceService'
import type { InvoiceItem, Vehicle } from '../../types'
import { Page, money } from '../../components/ui/bits'
export default function NewInvoice() {
  const { user } = useAuth(); const nav = useNavigate(); const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [f, setF] = useState({ number: '', vehicleId: '', date: new Date().toISOString().slice(0, 10), due: new Date().toISOString().slice(0, 10), km: '', discount: '0' })
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]); const [ownerId, setOwnerId] = useState(''); const [mech, setMech] = useState(user!.name)
  useEffect(() => { listOwners().then(o => { setOwners(o); setOwnerId(o[0]?.id ?? '') }) }, [])
  useEffect(() => { if (ownerId) listVehicles(ownerId).then(v => { setVehicles(v); setF(p => ({ ...p, vehicleId: v[0]?.id || '' })) }) }, [ownerId])
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', qty: 1, unit: 0 }]); const [review, setReview] = useState(false); const [err, setErr] = useState('')
  const total = calcTotal(items, +f.discount || 0)
  const upd = (i: number, p: Partial<InvoiceItem>) => setItems(items.map((x, j) => j === i ? { ...x, ...p } : x))
  const save = async () => { try { await createInvoice({ number: f.number, vehicleId: f.vehicleId, workshop: user!.workshop ?? 'Oficina', mechanicName: mech, date: f.date, due: f.due, km: +f.km, items, discount: +f.discount || 0 }, user!.name); nav('/app/notas') } catch (e) { setErr((e as Error).message); setReview(false) } }
  const valid = f.number && mech.trim() && f.vehicleId && +f.km > 0 && items.every(i => i.description && i.qty > 0)
  return (<Page title="Registrar serviço e nota fiscal"><div className="card space-y-4">
    <p className="text-xs text-slate-500">Leitura automática por foto (OCR) ainda não existe: preencha manualmente. Envio de imagem será um recurso futuro.</p>
    <div className="grid gap-3 md:grid-cols-3">
      <div><label className="label">Nº da nota *</label><input className="input" value={f.number} onChange={e => setF({ ...f, number: e.target.value })} /></div>
      <div><label className="label">Cliente (proprietário) *</label><select className="input" value={ownerId} onChange={e => setOwnerId(e.target.value)}>{owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
      <div><label className="label">Mecânico responsável *</label><input className="input" value={mech} onChange={e => setMech(e.target.value)} placeholder="Quem fez o serviço" /></div>
      <div><label className="label">Veículo</label><select className="input" value={f.vehicleId} onChange={e => setF({ ...f, vehicleId: e.target.value })}>{vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} · {v.model}</option>)}</select></div>
      <div><label className="label">Quilometragem *</label><input type="number" className="input" value={f.km} onChange={e => setF({ ...f, km: e.target.value })} /></div>
      <div><label className="label">Emissão</label><input type="date" className="input" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div>
      <div><label className="label">Vencimento</label><input type="date" className="input" value={f.due} onChange={e => setF({ ...f, due: e.target.value })} /></div>
      <div><label className="label">Desconto (R$)</label><input type="number" className="input" value={f.discount} onChange={e => setF({ ...f, discount: e.target.value })} /></div></div>
    {items.map((it, i) => <div key={i} className="grid grid-cols-6 gap-2"><input className="input col-span-3" placeholder="Serviço ou peça" value={it.description} onChange={e => upd(i, { description: e.target.value })} /><input type="number" className="input" value={it.qty} onChange={e => upd(i, { qty: +e.target.value })} /><input type="number" className="input" value={it.unit} onChange={e => upd(i, { unit: +e.target.value })} /><button className="btn-ghost justify-center" onClick={() => setItems(items.filter((_, j) => j !== i))} disabled={items.length === 1}>Remover</button></div>)}
    <button className="btn-ghost" onClick={() => setItems([...items, { description: '', qty: 1, unit: 0 }])}>Adicionar item</button>
    <p className="text-right text-lg font-semibold text-white">Total: {money(total)}</p>{err && <p className="err">{err}</p>}
    {!review ? <button className="btn" disabled={!valid} onClick={() => setReview(true)}>Revisar</button> : <div className="rounded-lg border border-acc/40 p-3 text-sm">Confirma o registro da nota {f.number} de {money(total)}? Será criado um evento no histórico e uma cobrança pendente.<div className="mt-3 flex gap-2"><button className="btn" onClick={save}>Confirmar e salvar</button><button className="btn-ghost" onClick={() => setReview(false)}>Voltar</button></div></div>}
  </div></Page>)
}
