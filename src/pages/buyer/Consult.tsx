import { useState } from 'react'
import { consult } from '../../services/vehicleService'
import { Page, StatusBadge, money, fdate } from '../../components/ui/bits'
type R = Awaited<ReturnType<typeof consult>>
export default function Consult() {
  const [plate, setPlate] = useState(''); const [code, setCode] = useState(''); const [r, setR] = useState<R | null>(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const go = async () => { setBusy(true); setErr(''); setR(null); try { setR(await consult(plate, code)) } catch (e) { setErr((e as Error).message) } setBusy(false) }
  const alerts: string[] = []
  if (r) { const e = r.events; e.forEach((x, i) => { if (i && x.km < e[i - 1].km) alerts.push(`Quilometragem em ${fdate(x.date)} menor que o registro anterior.`); if (i && (new Date(x.date).getTime() - new Date(e[i - 1].date).getTime()) > 31536000000) alerts.push(`Mais de 1 ano sem registros antes de ${fdate(x.date)}.`) }); if (!e.length) alerts.push('Nenhum evento registrado.') }
  return (<Page title="Consultar veículo">
    <div className="card grid gap-3 md:grid-cols-3"><div><label className="label">Placa</label><input className="input" value={plate} onChange={e => setPlate(e.target.value)} placeholder="ABC1D23" /></div><div><label className="label">Credencial de acesso</label><input className="input" value={code} onChange={e => setCode(e.target.value)} placeholder="AH-XXXX-00" /></div><div className="flex items-end"><button className="btn w-full" onClick={go} disabled={busy}>{busy ? 'Consultando…' : 'Consultar'}</button></div>
      <p className="text-xs text-slate-500 md:col-span-3">Demo: placa ABC1D23 e credencial AH-7K2M-91.</p>{err && <p className="err md:col-span-3">{err}</p>}</div>
    {r && <>
      <div className="card"><h2 className="font-semibold text-white">{r.vehicle.brand} {r.vehicle.model} {r.vehicle.version} · {r.vehicle.year}</h2><p className="text-sm text-slate-400">{r.vehicle.plate} · {r.vehicle.km.toLocaleString('pt-BR')} km informados</p></div>
      {alerts.map(a => <div key={a} className="card border-warn/40 text-sm text-warn">Atenção: {a} Alerta informativo, não prova de irregularidade.</div>)}
      <ol className="space-y-3 border-l border-line pl-4">{r.events.map(e => <li key={e.id} className="card text-sm"><b className="text-white">{e.description}</b><p className="text-xs text-slate-400">{fdate(e.date)} · {e.km.toLocaleString('pt-BR')} km · {e.workshop}</p></li>)}</ol>
      {r.invoices.length > 0 && <div className="card text-sm"><h3 className="mb-2 font-medium text-white">Notas compartilhadas</h3>{r.invoices.map(i => <div key={i.id} className="flex justify-between py-1"><span>{i.number} · {i.workshop}</span><span className="flex gap-2">{money(i.total)}<StatusBadge s={i.status} /></span></div>)}</div>}
      {r.diagnostics.length > 0 && <div className="card text-sm"><h3 className="mb-2 font-medium text-white">Diagnósticos OBD2 (dados simulados)</h3>{r.diagnostics.map(d => <p key={d.id}>{fdate(d.date)}: {d.codes.map(c => `${c.code} – ${c.desc}`).join('; ')}. Um código isolado não confirma defeito; pode exigir inspeção.</p>)}</div>}
    </>}
  </Page>)
}
