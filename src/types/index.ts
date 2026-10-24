export type Role = 'owner' | 'buyer' | 'mechanic'
export interface User { id: string; name: string; email: string; role: Role; workshop?: string }
export interface Vehicle { id: string; ownerId: string; brand: string; model: string; version?: string; year: number; plate: string; color: string; fuel: string; km: number; shareCode: string; shareActive: boolean; shared: { invoices: boolean; diagnostics: boolean } }
export type EventType = 'revisao' | 'oleo' | 'peca' | 'reparo' | 'inspecao' | 'diagnostico' | 'transferencia'
export interface HistoryEvent { id: string; vehicleId: string; date: string; km: number; type: EventType; description: string; workshop: string; value: number; invoiceId?: string; author: string }
export type InvoiceStatus = 'pendente' | 'aguardando' | 'pago' | 'vencido' | 'cancelado'
export interface InvoiceItem { description: string; qty: number; unit: number }
export interface Invoice { id: string; number: string; vehicleId: string; workshop: string; date: string; due: string; km: number; items: InvoiceItem[]; discount: number; total: number; status: InvoiceStatus; paidAt?: string; mechanicName: string; stars?: number | null; review?: string | null }
export interface MechanicRating { mechanic: string; services: number; ratings: number; average: number }
export interface Diagnostic { id: string; vehicleId: string; date: string; km: number; codes: { code: string; desc: string }[]; notes: string; simulated: true }
export interface Notification { id: string; text: string; read: boolean; to: string }
