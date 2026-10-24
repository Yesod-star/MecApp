import { api } from './api'
import type { Vehicle, HistoryEvent, Invoice, Diagnostic } from '../types'
export const listVehicles = (ownerId?: string) => api<Vehicle[]>('/api/vehicles' + (ownerId ? `?ownerId=${ownerId}` : ''))
export const getVehicle = (id: string) => api<Vehicle>(`/api/vehicles/${id}`).catch(() => undefined)
export const addVehicle = (v: Omit<Vehicle, 'id' | 'shareCode' | 'shareActive' | 'shared'>) => api<Vehicle>('/api/vehicles', { method: 'POST', body: v })
export const removeVehicle = (id: string) => api<null>(`/api/vehicles/${id}`, { method: 'DELETE' })
export const toggleShare = (id: string, key: 'shareActive' | 'invoices' | 'diagnostics') => api<Vehicle>(`/api/vehicles/${id}/share/${key}`, { method: 'POST' })
export const listEvents = (ids?: string[]) => ids && ids.length === 0 ? Promise.resolve([] as HistoryEvent[]) : api<HistoryEvent[]>('/api/events' + (ids ? `?vehicleIds=${ids.join(',')}` : ''))
export const consult = (plate: string, code: string) => api<{ vehicle: Omit<Vehicle, 'ownerId' | 'shareCode' | 'shareActive' | 'shared'>; events: HistoryEvent[]; invoices: Invoice[]; diagnostics: Diagnostic[] }>('/api/consult', { method: 'POST', body: { plate, code } })
export const transferVehicle = (id: string, fromId: string, toEmail: string) => api<Vehicle>(`/api/vehicles/${id}/transfer`, { method: 'POST', body: { fromId, toEmail } })
export const listOwners = () => api<{ id: string; name: string }[]>('/api/users?role=owner')
