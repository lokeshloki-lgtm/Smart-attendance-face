import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit3, Plus, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { Button, Card } from '../../components/common';
import { userAPI } from '../../services/api';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const profilePhotoUrl = (photo) => photo?.startsWith('/uploads/') ? `${API_ORIGIN}${photo}` : photo;

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll({ limit: 100 });
      setUsers(response.data.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load members.');
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const removeMember = async (member) => {
    if (!window.confirm(`Delete ${member.name}'s account?`)) return;
    try {
      await userAPI.delete(member._id);
      setUsers((current) => current.filter((item) => item._id !== member._id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete member.');
    }
  };

  const visibleUsers = users.filter((member) => `${member.name} ${member.studentId || member.employeeId || ''} ${member.department || ''}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="min-h-screen bg-[#071522] text-slate-100"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono-label text-xs text-cyan-300">Directory / identity registry</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Registered Members</h1><p className="mt-2 text-slate-400">Manage face-enrolled students and employees.</p></div><Link to="/users/register"><Button className="!bg-cyan-400 !text-[#061521] hover:!bg-cyan-300"><Plus size={17} /> Register New Member</Button></Link></div>
    <div className="mt-8 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, ID, or department" className="w-full rounded-xl border border-white/10 bg-[#0d2638] py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-cyan-300" /></div><Button variant="ghost" onClick={() => { void loadUsers(); }}><RefreshCw size={16} /> Refresh</Button></div>
    {error && <p className="mt-4 rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
    {visibleUsers.length === 0 ? <Card className="mt-6 border border-white/10 bg-[#0d2638]/90"><div className="py-10 text-center text-slate-500"><Users className="mx-auto mb-2" />No registered members found.</div></Card> : <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleUsers.map((member) => <Card key={member._id} className="border border-cyan-300/10 bg-[#0d2638]/90 shadow-[0_0_30px_rgba(34,211,238,0.04)]"><div className="flex items-start justify-between"><div className="flex items-center gap-4"><img src={profilePhotoUrl(member.profilePhoto || member.faceImage) || '/default-avatar.svg'} alt={`${member.name} profile`} className="h-16 w-16 rounded-full border-2 border-cyan-300/40 bg-[#081b2a] object-cover shadow-[0_0_18px_rgba(34,211,238,0.15)]" /><div><h2 className="font-bold text-white">{member.name}</h2><p className="mt-1 text-xs text-cyan-300">{member.role === 'TEACHER' ? 'Employee' : 'Student'}</p></div></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Active</span></div><dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-sm"><div><dt className="text-xs text-slate-500">Roll / Employee ID</dt><dd className="mt-1 font-medium text-slate-200">{member.studentId || member.employeeId || 'Not set'}</dd></div><div><dt className="text-xs text-slate-500">Department</dt><dd className="mt-1 truncate font-medium text-slate-200">{member.department || 'Unassigned'}</dd></div></dl><p className="mt-4 text-xs text-slate-500">Registered {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'recently'}</p><div className="mt-5 flex gap-2"><Button variant="ghost" size="sm" className="flex-1" onClick={() => navigate(`/users/${member._id}/edit`)}><Edit3 size={15} /> Edit</Button><Button variant="danger" size="sm" onClick={() => { void removeMember(member); }} aria-label={`Delete ${member.name}`}><Trash2 size={15} /></Button></div></Card>)}</div>}
  </main></div>;
};

export default UserManagement;