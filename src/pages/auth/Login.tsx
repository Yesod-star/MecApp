import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
const schema = z.object({ email: z.string().email('E-mail inválido'), password: z.string().min(6, 'Mínimo de 6 caracteres') })
type F = z.infer<typeof schema>
export default function Login() {
  const { signIn } = useAuth(); const nav = useNavigate(); const [show, setShow] = useState(false); const [error, setError] = useState('')
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) })
  const demo = (email: string) => { setValue('email', email); setValue('password', '123456') }
  const onSubmit = async (d: F) => { try { const u = await signIn(d.email, d.password); nav(u.role === 'buyer' ? '/app/consultar' : '/app') } catch (e) { setError((e as Error).message) } }
  return (<div className="grid min-h-screen place-items-center p-4"><form onSubmit={handleSubmit(onSubmit)} className="card w-full max-w-sm space-y-4">
    <h1 className="text-xl font-semibold text-white">Entrar</h1>
    <div><label className="label">E-mail</label><input className="input" {...register('email')} />{errors.email && <p className="err">{errors.email.message}</p>}</div>
    <div><label className="label">Senha</label><div className="relative"><input type={show ? 'text' : 'password'} className="input pr-9" {...register('password')} /><button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-2 text-slate-400" aria-label="Mostrar senha">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>{errors.password && <p className="err">{errors.password.message}</p>}</div>
    {error && <p className="err">{error}</p>}
    <button className="btn w-full" disabled={isSubmitting}>Entrar</button>
    <div className="border-t border-line pt-3 text-xs text-slate-400">Contas de demonstração (senha 123456):
      <div className="mt-2 flex flex-wrap gap-2">{[['Proprietário', 'proprietario@demo.com'], ['Comprador', 'comprador@demo.com'], ['Oficina', 'oficina@demo.com'], ['Proprietária 2', 'marina@demo.com'], ['Proprietário 3', 'bruno@demo.com']].map(([l, e]) => <button type="button" key={e} className="btn-ghost !py-1" onClick={() => demo(e)}>{l}</button>)}</div></div>
    <p className="text-xs text-slate-500">Autenticação simulada, sem segurança real.</p></form></div>)
}
