import type { ReactNode } from 'react'
import type { InvoiceStatus } from '../../types'
export const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const fdate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
const tone: Record<InvoiceStatus, string> = { pago: 'text-ok bg-ok/10', pendente: 'text-warn bg-warn/10', aguardando: 'text-acc bg-acc/10', vencido: 'text-bad bg-bad/10', cancelado: 'text-slate-400 bg-slate-500/10' }
export const StatusBadge = ({ s }: { s: InvoiceStatus }) => <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone[s]}`}>{s}</span>
export const Empty = ({ text }: { text: string }) => <div className="card text-center text-sm text-slate-400">{text}</div>
export const Page = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <div className="space-y-5"><div className="flex items-center justify-between gap-3"><h1 className="text-xl font-semibold text-white">{title}</h1>{action}</div>{children}</div>)
