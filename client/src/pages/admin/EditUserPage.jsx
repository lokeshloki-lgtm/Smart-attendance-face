import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { Button, Card, Input } from '../../components/common';
import { userAPI } from '../../services/api';

const EditUserPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', department: '', className: '', phone: '', identifier: '', role: 'STUDENT' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userAPI.getById(id).then(({ data }) => {
      const member = data.data;
      setForm({ name: member.name || '', email: member.email || '', department: member.department || '', className: member.className || '', phone: member.phone || '', identifier: member.studentId || member.employeeId || '', role: member.role === 'TEACHER' ? 'TEACHER' : 'STUDENT' });
    }).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load member.'));
  }, [id]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await userAPI.update(id, { name: form.name, department: form.department, className: form.className, phone: form.phone, role: form.role, ...(form.role === 'TEACHER' ? { employeeId: form.identifier } : { studentId: form.identifier }) });
      navigate('/users');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update member.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="min-h-screen bg-[#071522] text-slate-100"><Navbar /><main className="mx-auto max-w-2xl px-4 py-8 sm:px-6"><Link to="/users" className="mb-6 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-white"><ArrowLeft size={16} /> Back to members</Link><Card className="border border-cyan-300/15 bg-[#0d2638]/90"><p className="font-mono-label text-xs text-cyan-300">Directory / edit member</p><h1 className="mt-2 text-3xl font-bold">Edit member</h1><form onSubmit={submit} className="mt-6 space-y-4"><Input label="Full name" name="name" required value={form.name} onChange={updateField} /><Input label="Roll number / Employee ID" name="identifier" value={form.identifier} onChange={updateField} /><Input label="Email" name="email" type="email" disabled value={form.email} onChange={updateField} /><Input label="Phone" name="phone" value={form.phone} onChange={updateField} /><Input label="Department" name="department" value={form.department} onChange={updateField} /><Input label="Class / batch" name="className" value={form.className} onChange={updateField} /><select name="role" value={form.role} onChange={updateField} className="w-full rounded-lg border border-white/10 bg-[#081b2a] px-4 py-2.5 text-sm text-white"><option value="STUDENT">Student</option><option value="TEACHER">Employee</option></select>{error && <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}<Button type="submit" className="w-full !bg-cyan-400 !text-[#061521]" isLoading={saving}><Save size={17} /> Save changes</Button></form></Card></main></div>;
};

export default EditUserPage;