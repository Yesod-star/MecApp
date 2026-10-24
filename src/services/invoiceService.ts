import { api } from './api'
import type { Invoice, InvoiceItem, MechanicRating } from '../types'
export const calcTotal = (items: InvoiceItem[], discount: number) => Math.max(0, items.reduce((s, i) => s + i.qty * i.unit, 0) - discount)
export const listInvoices = (ownerId?: string) => api<Invoice[]>('/api/invoices' + (ownerId ? `?ownerId=${ownerId}` : ''))
export const createInvoice = (inv: Omit<Invoice, 'id' | 'total' | 'status'>, author: string) => api<{ id: string }>('/api/invoices', { method: 'POST', body: { ...inv, author } })
export const rateInvoice = (id: string, ownerId: string, stars: number, comment: string) => api<Invoice>(`/api/invoices/${id}/rating`, { method: 'POST', body: { ownerId, stars, comment } })
export const mechanicRatings = (workshop?: string) => api<MechanicRating[]>('/api/mechanics/ratings' + (workshop ? `?workshop=${encodeURIComponent(workshop)}` : ''))
