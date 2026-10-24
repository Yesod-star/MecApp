import { Link } from 'react-router-dom'
import { Car, ShieldCheck, Wrench, Search } from 'lucide-react'
const items = [{ i: Car, t: 'Proprietários', d: 'Acompanhe manutenções, gastos e quilometragem em um só lugar.' }, { i: Search, t: 'Compradores', d: 'Consulte o histórico de um carro usado com a credencial do dono.' }, { i: Wrench, t: 'Oficinas', d: 'Registre serviços e notas fiscais com autoria e data.' }]
export default function Landing() {
  return (<div className="mx-auto max-w-5xl px-4 py-16">
    <div className="mb-2 flex items-center gap-2 font-bold text-white"><Car className="text-acc" />AutoHistory</div>
    <h1 className="mt-10 max-w-2xl text-4xl font-bold text-white md:text-5xl">O histórico completo do carro, antes de você fechar negócio.</h1>
    <p className="mt-4 max-w-xl text-slate-400">Plataforma acadêmica de demonstração. Todos os dados são fictícios e a autenticação é simulada.</p>
    <Link to="/login" className="btn mt-8">Entrar na demonstração</Link>
    <div className="mt-16 grid gap-4 md:grid-cols-3">{items.map(x => <div key={x.t} className="card"><x.i className="mb-3 text-acc" /><h3 className="font-semibold text-white">{x.t}</h3><p className="mt-1 text-sm text-slate-400">{x.d}</p></div>)}</div>
    <p className="mt-10 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} />O proprietário controla o que é compartilhado.</p></div>)
}
