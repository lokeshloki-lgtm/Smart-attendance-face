import React, { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import { Button, Card, Input } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const UserProfile = () => {
	const { user } = useAuth();
	const [form, setForm] = useState({ name: '', phone: '', department: '' });
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	useEffect(() => {
		const loadProfile = async () => {
			try {
				const response = await authAPI.getProfile();
				setForm({
					name: response.data.data.name || '',
					phone: response.data.data.phone || '',
					department: response.data.data.department || '',
				});
			} catch (requestError) {
				setError(requestError.response?.data?.message || 'Unable to load profile.');
			}
		};

		void loadProfile();
	}, []);
	const submit = async (event) => { event.preventDefault(); setError(''); setMessage(''); try { await authAPI.updateProfile(form); setMessage('Profile updated successfully.'); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to update profile.'); } };
	return <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-100"><Navbar /><main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-bold">My profile</h1><p className="mt-2 text-gray-600 dark:text-gray-400">Keep your account details up to date.</p><Card className="mt-8"><p className="mb-5 text-sm text-gray-500">Signed in as {user?.email}</p><form onSubmit={submit} className="space-y-4"><Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /><Input label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /><Input label="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<Button type="submit">Save profile</Button></form></Card></main></div>;
};

export default UserProfile;
