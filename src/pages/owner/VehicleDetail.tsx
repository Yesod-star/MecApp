import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as svc from '../../services/vehicleService'
import type { Vehicle, HistoryEvent } from '../../types'
import TransferForm from '../../components/ui/TransferForm'
import { Page, Empty, money, fdate } from '../../components/ui/bits'
export default function VehicleDetail() {
  const { id } = useParams(); const [v, setV] = useState<Vehicle | undefined | null>(null); const [ev, setEv] = useState<HistoryEvent[]>([]); const [tab, setTab] = useState<'hist' | 'share' | 'transfer'>('hist')
  useEffect(() => { svc.getVehicle(id!).then(setV); svc.listEvents([id!]).then(r => setEv([...r].sort((a, b) => b.date.localeCompare(a.date)))) }, [id])
  if (v === null) return <p className="text-sm text-slate-400">Carregando…</p>
  if (!v) return <Empty text="Veículo não encontrado." />
  const tg = async (k: 'shareActive' | 'invoices' | 'diagnostics') => setV(await svc.toggleShare(v.id, k))
  return (<Page title={`${v.brand} ${v.model} · ${v.plate}`}>
    <div className="flex gap-2">{([['hist', 'Histórico'], ['share', 'Compartilhamento'], ['transfer', 'Transferir']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={tab === k ? 'btn' : 'btn-ghost'}>{l}</button>)}</div>
    {tab === 'transfer' ? <TransferForm id={v.id} plate={v.plate} /> : tab === 'hist' ? (ev.length === 0 ? <Empty text="Sem eventos registrados." /> : <ol className="space-y-3 border-l border-line pl-4">{ev.map(e => <li key={e.id} className="card"><div className="flex justify-between text-sm"><b className="text-white">{e.description}</b><span>{money(e.value)}</span></div><p className="mt-1 text-xs text-slate-400">{fdate(e.date)} · {e.km.toLocaleString('pt-BR')} km · {e.workshop} · lançado por {e.author}</p></li>)}</ol>) :
      <div className="card space-y-4 text-sm"><p>Credencial exclusiva de consulta: <code className="rounded bg-bg px-2 py-1 text-acc">{v.shareCode}</code></p>
        {([['shareActive', 'Compartilhamento ativo', v.shareActive], ['invoices', 'Compartilhar notas fiscais', v.shared.invoices], ['diagnostics', 'Compartilhar diagnósticos', v.shared.diagnostics]] as const).map(([k, l, on]) => <label key={k} className="flex items-center gap-3"><input type="checkbox" checked={on} onChange={() => tg(k)} />{l}</label>)}
        <p className="text-xs text-slate-500">Desativar revoga imediatamente o acesso por placa. Dados pessoais nunca são compartilhados.</p></div>}
  </Page>)
}
