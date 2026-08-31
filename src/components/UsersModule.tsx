import React, { useState } from 'react';
import { KeyRound, UserPlus, UsersRound } from 'lucide-react';
import { useAccess, UserRole } from '../context/AccessContext';

type UserForm = { name: string; email: string; password: string; role: UserRole; active: boolean };
const emptyForm: UserForm = { name: '', email: '', password: '', role: 'operator', active: true };

export const UsersModule: React.FC = () => {
  const { users, addUser, updateUser, can } = useAccess();
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({});

  if (!can('users.manage')) return <div>Acesso não autorizado.</div>;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setMessage('Nome, e-mail e senha são obrigatórios.');
      return;
    }
    setSaving(true);
    const result = await addUser({ ...form, name: form.name.trim(), email: form.email.trim() });
    setSaving(false);
    if (!result.ok) {
      setMessage(result.message ?? 'Não foi possível cadastrar o usuário.');
      return;
    }
    setForm(emptyForm);
    setMessage('Usuário cadastrado. Ele já pode entrar usando o e-mail e a senha definidos.');
  };

  const changeRole = async (id: string, role: UserRole) => {
    if (!window.confirm('Alterar o perfil deste usuário?')) return;
    const result = await updateUser(id, { role });
    if (!result.ok) setMessage(result.message ?? 'Não foi possível alterar o perfil.');
  };

  const toggleActive = async (id: string, active: boolean, name: string) => {
    if (!window.confirm(`${active ? 'Inativar' : 'Ativar'} ${name}?`)) return;
    const result = await updateUser(id, { active: !active });
    if (!result.ok) setMessage(result.message ?? 'Não foi possível alterar o status.');
  };

  const resetPassword = async (id: string, name: string) => {
    const password = passwordDrafts[id] ?? '';
    if (password.length < 8) {
      setMessage('A nova senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (!window.confirm(`Redefinir a senha de ${name}?`)) return;
    const result = await updateUser(id, { password });
    if (!result.ok) {
      setMessage(result.message ?? 'Não foi possível redefinir a senha.');
      return;
    }
    setPasswordDrafts((current) => ({ ...current, [id]: '' }));
    setMessage(`Senha de ${name} atualizada.`);
  };

  return <div className="space-y-6">
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF9FD] text-[#087B9F]"><UsersRound className="h-5 w-5" /></div><div><h1 className="text-xl font-bold">Usuários e Permissões</h1><p className="mt-1 text-sm text-neutral-500">Cadastre acessos e defina o perfil de cada pessoa.</p></div></div></section>

    <section className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-[#75B82A]" /><h2 className="font-bold">Cadastrar usuário</h2></div>
        <label className="block text-sm font-semibold">Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5" placeholder="Nome completo" /></label>
        <label className="block text-sm font-semibold">E-mail<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1.5" placeholder="nome@empresa.com" /></label>
        <label className="block text-sm font-semibold">Senha provisória<input required type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1.5" placeholder="Mínimo de 8 caracteres" /></label>
        <label className="block text-sm font-semibold">Perfil<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className="mt-1.5"><option value="admin">Administrador</option><option value="manager">Gestor</option><option value="operator">Operacional</option></select></label>
        <button disabled={saving} className="rounded-xl bg-[#75B82A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#669E22] disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Cadastrando...' : 'Cadastrar usuário'}</button>
        {message && <p role="status" className="rounded-xl bg-[#F4FAEA] px-3 py-2 text-sm text-[#314E0D]">{message}</p>}
      </form>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs"><div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-[#D99000]" /><h2 className="font-bold">Perfis de acesso</h2></div><div className="mt-4 space-y-3 text-sm text-neutral-600"><p><strong className="text-[#111111]">Administrador:</strong> acesso completo, inclusive usuários e permissões.</p><p><strong className="text-[#111111]">Gestor:</strong> operação, análise, vendas e custos; sem gestão de usuários.</p><p><strong className="text-[#111111]">Operacional:</strong> produtos, estoque, vendas e perdas.</p></div><p className="mt-6 rounded-xl border border-[#CFF2FA] bg-[#EAF9FD] p-3 text-xs leading-5 text-[#06495E]">As senhas não são exibidas nem recuperáveis. Elas são armazenadas como hash neste navegador.</p></div>
    </section>

    <section className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs"><h2 className="font-bold">Acessos cadastrados</h2><table className="mt-4 min-w-[980px] w-full text-sm"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Nova senha</th><th>Status</th><th className="text-right">Ações</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td className="font-semibold">{user.name}</td><td>{user.email}</td><td><select value={user.role} onChange={(event) => void changeRole(user.id, event.target.value as UserRole)} className="min-h-0 w-auto rounded-lg border border-neutral-300 bg-white px-2 py-1 text-xs"><option value="admin">Administrador</option><option value="manager">Gestor</option><option value="operator">Operacional</option></select></td><td><div className="flex items-center gap-2"><input type="password" minLength={8} autoComplete="new-password" aria-label={`Nova senha para ${user.name}`} value={passwordDrafts[user.id] ?? ''} onChange={(event) => setPasswordDrafts((current) => ({ ...current, [user.id]: event.target.value }))} className="min-h-0 w-40 rounded-lg border border-neutral-300 px-2 py-1 text-xs" placeholder="8+ caracteres" /><button onClick={() => void resetPassword(user.id, user.name)} className="rounded-lg border border-[#A7E5F2] px-2 py-1 text-xs font-semibold text-[#087B9F] hover:bg-[#EAF9FD]">Salvar</button></div></td><td><span className={user.active ? 'text-[#426D12]' : 'text-[#C92F0A]'}>{user.active ? 'Ativo' : 'Inativo'}</span></td><td className="text-right"><button onClick={() => void toggleActive(user.id, user.active, user.name)} disabled={user.id === 'demo-admin'} className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40">{user.active ? 'Inativar' : 'Ativar'}</button></td></tr>)}</tbody></table></section>
  </div>;
};
