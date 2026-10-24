import type { User } from '../types'
import { api } from './api'
// Autenticação SIMULADA (sem token/JWT): não é segura. Trocar por JWT/Supabase Auth depois.
export const login = (email: string, password: string) => api<User>('/api/auth/login', { method: 'POST', body: { email, password } })
export const demoAccounts = (): User[] => [
  { id: 'u1', name: 'Carlos Mendes', email: 'proprietario@demo.com', role: 'owner' },
  { id: 'u4', name: 'Marina Costa', email: 'marina@demo.com', role: 'owner' },
  { id: 'u5', name: 'Bruno Alves', email: 'bruno@demo.com', role: 'owner' },
  { id: 'u2', name: 'Ana Souza', email: 'comprador@demo.com', role: 'buyer' },
  { id: 'u3', name: 'Rafael Lima', email: 'oficina@demo.com', role: 'mechanic', workshop: 'Oficina Torque Fino' }]
