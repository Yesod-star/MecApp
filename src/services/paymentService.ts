import { api } from './api'
import type { Invoice } from '../types'
// Pix DEMONSTRATIVO: código fictício, sem cobrança real.
export const fakePixCode = (id: string) => `DEMO-PIX-NAO-REAL-${id.toUpperCase()}-AUTOHISTORY`
export const confirmPayment = (invoiceId: string) => api<Invoice>(`/api/invoices/${invoiceId}/pay`, { method: 'POST' })
