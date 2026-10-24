import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Landing from './pages/public/Landing'
import NotFound from './pages/public/NotFound'
import Privacy from './pages/public/Privacy'
import Login from './pages/auth/Login'
import Dashboard from './pages/owner/Dashboard'
import Vehicles from './pages/owner/Vehicles'
import VehicleDetail from './pages/owner/VehicleDetail'
import Invoices from './pages/owner/Invoices'
import Workshops from './pages/public/Workshops'
import Consult from './pages/buyer/Consult'
import NewInvoice from './pages/mechanic/NewInvoice'
import { useAuth } from './contexts/AuthContext'
const Home = () => { const { user } = useAuth(); return user?.role === 'buyer' ? <Navigate to="/app/consultar" replace /> : <Dashboard /> }
export default function App() {
  return (<Routes>
    <Route path="/" element={<Landing />} /><Route path="/login" element={<Login />} />
    <Route path="/app" element={<AppLayout />}>
      <Route index element={<Home />} /><Route path="veiculos" element={<Vehicles />} /><Route path="veiculos/:id" element={<VehicleDetail />} />
      <Route path="notas" element={<Invoices />} /><Route path="oficinas" element={<Workshops />} /><Route path="consultar" element={<Consult />} /><Route path="registrar" element={<NewInvoice />} /><Route path="privacidade" element={<Privacy />} />
    </Route>
    <Route path="*" element={<NotFound />} /></Routes>)
}
