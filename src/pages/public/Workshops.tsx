import { useState } from 'react'
import { MapPin, ExternalLink } from 'lucide-react'
import { Page } from '../../components/ui/bits'
export default function Workshops() {
  const [place, setPlace] = useState('Cachoeiro de Itapemirim, ES'); const [q, setQ] = useState(place)
  const query = encodeURIComponent('oficina mecânica em ' + q)
  return (<Page title="Oficinas mecânicas" action={<a className="btn-ghost" href={`https://www.google.com/maps/search/${query}`} target="_blank" rel="noreferrer"><ExternalLink size={15} />Abrir no Google Maps</a>}>
    <div className="flex gap-2"><div className="relative flex-1"><MapPin size={15} className="absolute left-3 top-2.5 text-slate-400" /><input className="input pl-9" value={place} onChange={e => setPlace(e.target.value)} onKeyDown={e => e.key === 'Enter' && setQ(place)} placeholder="Cidade, bairro ou CEP" /></div><button className="btn" onClick={() => setQ(place)}>Buscar</button></div>
    <div className="overflow-hidden rounded-xl border border-line"><iframe title="Mapa de oficinas" className="h-[60vh] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${query}&output=embed`} /></div>
    <p className="text-xs text-slate-500">Mapa do Google focado em oficinas mecânicas. Os resultados vêm do Google e não são oficinas cadastradas no AutoHistory.</p></Page>)
}
