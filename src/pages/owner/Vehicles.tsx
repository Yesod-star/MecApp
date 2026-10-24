import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import * as svc from '../../services/vehicleService'
import type { Vehicle } from '../../types'
import { Page, Empty } from '../../components/ui/bits'
export default function Vehicles() {
  const { user } = useAuth(); const [list, setList] = useState<Vehicle[] | null>(null); const [f, setF] = useState({ brand: '', model: '', plate: '', year: '2020', km: '0', color: '', fuel: 'Flex' }); const [err, setErr] = useState('')
  const refresh = () => svc.listVehicles(user!.id).then(setList); useEffect(() => { refresh() }, [])
  const add = async () => { if (!f.brand || !f.model || !/^[A-Za-z]{3}\d[A-Za-z0-9]\d{2}$/.test(f.plate)) return setErr('Informe marca, modelo e uma placa válida (ex.: ABC1D23).'); setErr(''); await svc.addVehicle({ ownerId: user!.id, brand: f.brand, model: f.model, plate: f.plate.toUpperCase(), year: +f.year, km: +f.km, color: f.color, fuel: f.fuel }); setF({ ...f, brand: '', model: '', plate: '' }); refresh() }
  const del = async (id: string) => { if (confirm('Excluir este veículo? (simulado)')) { await svc.removeVehicle(id); refresh() } }
  return (<Page title="Meus veículos">
    <div className="card grid gap-3 md:grid-cols-4">{(['brand', 'model', 'plate', 'year', 'km', 'color'] as const).map(k => <div key={k}><label className="label">{({ brand: 'Marca *', model: 'Modelo *', plate: 'Placa *', year: 'Ano', km: 'Quilometragem', color: 'Cor' })[k]}</label><input className="input" value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></div>)}
      <div className="flex items-end"><button className="btn w-full" onClick={add}>Cadastrar veículo</button></div>{err && <p className="err md:col-span-4">{err}</p>}</div>
    {!list ? <p className="text-sm text-slate-400">Carregando…</p> : list.length === 0 ? <Empty text="Nenhum veículo cadastrado. Cadastre o primeiro acima." /> :
      <div className="grid gap-3 md:grid-cols-2">{list.map(v => <div key={v.id} className="card flex items-center justify-between"><Link to={`/app/veiculos/${v.id}`}><p className="font-semibold text-white">{v.brand} {v.model} {v.version}</p><p className="text-sm text-slate-400">{v.plate} · {v.year} · {v.km.toLocaleString('pt-BR')} km</p></Link><button onClick={() => del(v.id)} aria-label="Excluir" className="text-slate-500 hover:text-bad"><Trash2 size={17} /></button></div>)}</div>}
  </Page>)
}
