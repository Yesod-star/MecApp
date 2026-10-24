import { useEffect, useMemo, useState } from 'react'
import { Copy, QrCode } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import * as inv from '../../services/invoiceService'
import { fakePixCode, confirmPayment } from '../../services/paymentService'
import type { Invoice } from '../../types'
import RatingBox from '../../components/ui/RatingBox'
import { Page, Empty, StatusBadge, money, fdate } from '../../components/ui/bits'
export default function Invoices() {
  const { user } = useAuth(); const [list, setList] = useState<Invoice[]>([]); const [q, setQ] = useState(''); const [asc, setAsc] = useState(false); const [pix, setPix] = useState<Invoice | null>(null); const [paid, setPaid] = useState(false)
  const refresh = () => inv.listInvoices(user!.role === 'owner' ? user!.id : undefined).then(setList)
  useEffect(() => { refresh() }, [])
  const shown = useMemo(() => list.filter(i => (i.number + i.workshop + i.status).toLowerCase().includes(q.toLowerCase())).sort((a, b) => (asc ? 1 : -1) * a.date.localeCompare(b.date)), [list, q, asc])
  const pay = async () => { await confirmPayment(pix!.id); setPaid(true); refresh() }
  return (<Page title="Notas fiscais e pagamentos">
    <div className="flex gap-2"><input className="input" placeholder="Buscar por número, oficina ou status" value={q} onChange={e => setQ(e.target.value)} /><button className="btn-ghost whitespace-nowrap" onClick={() => setAsc(!asc)}>Data {asc ? '↑' : '↓'}</button></div>
    {shown.length === 0 ? <Empty text="Nenhuma nota encontrada." /> : <div className="space-y-3">{shown.map(i => <div key={i.id} className="card flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-white">Nota {i.number} · {i.workshop}</p><p className="text-xs text-slate-500">Mecânico: {i.mechanicName || 'não informado'}</p><p className="text-xs text-slate-400">Emitida {fdate(i.date)} · vence {fdate(i.due)}</p></div>
      <div className="flex items-center gap-3"><b>{money(i.total)}</b><StatusBadge s={i.status} />{user!.role === 'owner' && i.status !== 'pago' && i.status !== 'cancelado' && <button className="btn" onClick={() => { setPaid(false); setPix(i) }}><QrCode size={15} />Pagar com Pix</button>}</div>{user!.role === 'owner' && <RatingBox inv={i} ownerId={user!.id} onDone={refresh} />}{user!.role !== 'owner' && i.stars ? <p className="w-full text-xs text-warn">{'★'.repeat(i.stars)} {i.review}</p> : null}</div>)}</div>}
    {pix && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><div className="card w-full max-w-sm space-y-3 text-center">
      {paid ? <><h2 className="text-lg font-semibold text-ok">Pagamento confirmado (demonstração)</h2><p className="text-sm text-slate-400">Comprovante fictício da nota {pix.number}: {money(pix.total)}</p></> : <><h2 className="font-semibold text-white">Pix demonstrativo · {money(pix.total)}</h2>
        <div className="mx-auto grid h-36 w-36 place-items-center rounded-lg bg-white text-xs text-slate-900">QR fictício</div>
        <code className="block break-all rounded bg-bg p-2 text-xs">{fakePixCode(pix.id)}</code>
        <button className="btn-ghost mx-auto" onClick={() => navigator.clipboard?.writeText(fakePixCode(pix.id))}><Copy size={14} />Copiar código</button>
        <p className="text-xs text-warn">Código fictício. Nenhuma cobrança real é gerada.</p><button className="btn w-full" onClick={pay}>Simular confirmação</button></>}
      <button className="btn-ghost w-full justify-center" onClick={() => setPix(null)}>Fechar</button></div></div>}
  </Page>)
}
