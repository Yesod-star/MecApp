import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User } from '../types'
import * as auth from '../services/authService'
interface Ctx { user: User | null; signIn: (e: string, p: string) => Promise<User>; signOut: () => void; switchTo: (u: User) => void }
const C = createContext<Ctx>(null!)
export const useAuth = () => useContext(C)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => { try { return JSON.parse(localStorage.getItem('ah-user') || 'null') } catch { return null } })
  const set = (u: User | null) => { setUser(u); try { u ? localStorage.setItem('ah-user', JSON.stringify(u)) : localStorage.removeItem('ah-user') } catch { /* ignore */ } }
  const signIn = async (e: string, p: string) => { const u = await auth.login(e, p); set(u); return u }
  return <C.Provider value={{ user, signIn, signOut: () => set(null), switchTo: set }}>{children}</C.Provider>
}
