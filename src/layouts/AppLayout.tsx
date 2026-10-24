import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Car, FileText, Search, Bell, Shield, LogOut, Menu, Wrench, X, MapPin } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { demoAccounts } from '../services/authService'
import type { Role } from '../types'
const menus: Record<Role, { to: string; label: string; icon: typeof Car }[]> = {
  owner: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard }, { to: '/app/veiculos', label: 'Meus veículos', icon: Car }, { to: '/app/notas', label: 'Notas e pagamentos', icon: FileText }, { to: '/app/consultar', label: 'Consultar veículo', icon: Search }, { to: '/app/oficinas', label: 'Oficinas', icon: MapPin }, { to: '/app/privacidade', label: 'Privacidade', icon: Shield }],
  mechanic: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard }, { to: '/app/registrar', label: 'Registrar serviço', icon: Wrench }, { to: '/app/notas', label: 'Notas fiscais', icon: FileText }, { to: '/app/consultar', label: 'Buscar veículo', icon: Search }, { to: '/app/privacidade', label: 'Privacidade', icon: Shield }],
  buyer: [{ to: '/app/consultar', label: 'Consultar veículo', icon: Search }, { to: '/app/oficinas', label: 'Oficinas', icon: MapPin }, { to: '/app/privacidade', label: 'Privacidade', icon: Shield }] }
export default function AppLayout() {
  const { user, signOut, switchTo } = useAuth(); const [open, setOpen] = useState(false); const nav = useNavigate()
  if (!user) return <Navigate to="/login" replace />
  const side = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 flex items-center gap-2 text-lg font-bold text-white"><Car className="text-acc" size={22} />AutoHistory</div>
      {menus[user.role].map(m => <NavLink key={m.to} to={m.to} end={m.to === '/app'} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-acc/10 text-acc' : 'text-slate-400 hover:bg-white/5'}`}><m.icon size={17} />{m.label}</NavLink>)}
      <button onClick={() => { signOut(); nav('/') }} className="mt-auto flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white"><LogOut size={17} />Sair</button>
    </nav>)
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-card lg:block">{side}</aside>
      {open && <div className="fixed inset-0 z-40 flex lg:hidden"><div className="w-64 bg-card">{side}</div><button className="flex-1 bg-black/60" onClick={() => setOpen(false)} aria-label="Fechar menu"><X className="m-3 text-white" /></button></div>}
      <div className="flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <span className="text-sm text-slate-400">Olá, {user.name}</span>
          <label className="flex items-center gap-2 text-xs text-slate-400"><Bell size={15} />Perfil de teste
            <select className="input !w-auto !py-1" value={user.id} onChange={e => { const u = demoAccounts().find(a => a.id === e.target.value)!; switchTo(u); nav(u.role === 'buyer' ? '/app/consultar' : '/app') }}>
              {demoAccounts().map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}</select></label>
        </header>
        <main className="mx-auto max-w-5xl p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>)
}
