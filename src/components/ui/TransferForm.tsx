import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { transferVehicle } from '../../services/vehicleService'
export default function TransferForm({ id, plate }: { id: string; plate: string }) {
  const { user } = useAuth(); const nav = useNavigate(); const [email, setEmail] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const go = async () => {
    if (!confirm(`Transferir o veículo ${plate} para ${email}? Você perderá o acesso de proprietário.`)) return
    setBusy(true); setErr('')
    try { await transferVehicle(id, user!.id, email); nav('/app/veiculos') } catch (e) { setErr((e as Error).message) }
    setBusy(false)
  }
  return (<div className="card space-y-3 text-sm"><p>Informe o e-mail da conta do novo proprietário. A transferência revoga o compartilhamento atual e registra o evento no histórico.</p>
    <input className="input" type="email" placeholder="email@novo-proprietario.com" value={email} onChange={e => setEmail(e.target.value)} />
    {err && <p className="err">{err}</p>}<button className="btn" disabled={!email || busy} onClick={go}>Transferir veículo</button>
    <p className="text-xs text-slate-500">Demo: marina@demo.com ou bruno@demo.com.</p></div>)
}
