import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { listVehicles, listEvents } from '../../services/vehicleService'
import { listInvoices, mechanicRatings } from '../../services/invoiceService'
import type { Vehicle, HistoryEvent, Invoice, MechanicRating } from '../../types'
import { Page, money } from '../../components/ui/bits'
export default function Dashboard() {
  const { user } = useAuth(); const [d, setD] = useState<{ mine: Vehicle[]; ev: HistoryEvent[]; inv: Invoice[] } | null>(null)
  useEffect(() => { (async () => { const owner = user!.role === 'owner' ? user!.id : undefined; const mine = await listVehicles(owner); const [ev, inv] = await Promise.all([listEvents(mine.map(v => v.id)), listInvoices(owner)]); setD({ mine, ev, inv }) })() }, [user])
  const [rat, setRat] = useState<MechanicRating[]>([])
  useEffect(() => { if (user!.role === 'mechanic') mechanicRatings(user!.workshop).then(setRat) }, [user])
  if (!d) return <p className="text-sm text-slate-400">Carregando…</p>
  const { mine, ev, inv } = d
  const byMonth = Object.entries(ev.reduce<Record<string, number>>((a, e) => { const k = e.date.slice(0, 7); a[k] = (a[k] || 0) + e.value; return a }, {})).sort().map(([m, v]) => ({ m, v }))
  const pend = inv.filter(i => i.status === 'pendente' || i.status === 'vencido')
  const stats = [['Veículos', String(mine.length)], ['Serviços registrados', String(ev.length)], ['Total gasto', money(ev.reduce((s, e) => s + e.value, 0))], ['Notas em aberto', String(pend.length)]]
  return (<Page title={user!.role === 'owner' ? 'Painel do proprietário' : 'Painel da oficina'} action={user!.role === 'mechanic' ? <Link to="/app/registrar" className="btn">Registrar serviço</Link> : <Link to="/app/veiculos" className="btn">Meus veículos</Link>}>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{stats.map(([l, v]) => <div key={l} className="card"><p className="text-xs text-slate-400">{l}</p><p className="mt-1 text-xl font-semibold text-white">{v}</p></div>)}</div>
    <div className="card"><h2 className="mb-3 text-sm font-medium text-white">Despesas por mês</h2><div className="h-56"><ResponsiveContainer><BarChart data={byMonth}><XAxis dataKey="m" stroke="#64748b" fontSize={12} /><YAxis stroke="#64748b" fontSize={12} /><Tooltip contentStyle={{ background: '#171a21', border: '1px solid #262b36' }} /><Bar dataKey="v" fill="#22d3ee" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
    {pend.length > 0 && <div className="card border-warn/40 text-sm text-warn">{pend.length} nota(s) aguardando pagamento. <Link to="/app/notas" className="underline">Ver notas</Link></div>}
    {user!.role === 'mechanic' && <div className="card text-sm"><h2 className="mb-2 font-medium text-white">Avaliação dos mecânicos</h2>{rat.length === 0 ? <p className="text-slate-400">Sem serviços registrados.</p> : rat.map(r => <div key={r.mechanic} className="flex justify-between py-1"><span>{r.mechanic} <span className="text-xs text-slate-500">({r.services} serviço(s))</span></span><span className="text-warn">{r.ratings ? `★ ${r.average.toFixed(1)} (${r.ratings})` : 'sem avaliações'}</span></div>)}</div>}
  </Page>)
}
