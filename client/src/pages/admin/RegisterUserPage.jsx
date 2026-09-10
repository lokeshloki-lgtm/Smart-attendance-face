import React, { useRef, useState } from 'react';
import { ArrowLeft, Briefcase, CheckCircle2, GraduationCap, ImagePlus, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import FaceCapture from '../../components/FaceCapture';
import { Button, Card, Input } from '../../components/common';
import { userAPI } from '../../services/api';

const RegisterUserPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', className: '', identifier: '', role: 'STUDENT', profilePhoto: '' });
  const [capture, setCapture] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [faceConfirmed, setFaceConfirmed] = useState(false);
  const [retakeKey, setRetakeKey] = useState(0);
  const sampleBufferRef = useRef([]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, profilePhoto: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleFaceCapture = (result) => {
    sampleBufferRef.current = [...sampleBufferRef.current, result].slice(-5);
    const samples = sampleBufferRef.current;
    setCapture({ ...result, descriptor: samples[0].descriptor, descriptors: samples.map((sample) => sample.descriptor), samples });
    setFaceConfirmed(false);
    if (!form.profilePhoto && result.image) setForm((current) => ({ ...current, profilePhoto: result.image }));
  };

  const handleCameraRefresh = () => {
    sampleBufferRef.current = [];
    setCapture(null);
    setFaceConfirmed(false);
    setError('');
  };

  const handleRetakeFace = () => {
    handleCameraRefresh();
    setForm((current) => ({ ...current, profilePhoto: '' }));
    setRetakeKey((current) => current + 1);
  };

  const confirmFace = () => {
    if (!capture?.descriptors || capture.descriptors.length < 5) return;
    setFaceConfirmed(true);
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      if (!capture?.descriptors || capture.descriptors.length < 5) throw new Error('Capture five clear face samples before creating the account.');
      if (!faceConfirmed) throw new Error('Confirm the detected face before creating the account.');
      const profilePhoto = form.profilePhoto || capture.image;
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        department: form.department,
        className: form.className,
        role: form.role,
        profilePhoto,
        faceDescriptors: capture.descriptors,
        faceImage: capture.image,
        ...(form.role === 'STUDENT' ? { studentId: form.identifier.trim() } : { employeeId: form.identifier.trim() }),
      };
      const response = await userAPI.create(payload);
      setSuccess(response.data.message || 'Student registered successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to register user.');
    } finally {
      setSaving(false);
    }
  };

  const previewPhoto = form.profilePhoto || capture?.image;

  return <div className="min-h-screen bg-[#071522] text-slate-100"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <Link to="/users" className="mb-6 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-white"><ArrowLeft size={16} /> Back to members</Link>
    <div className="mb-8"><p className="font-mono-label text-xs text-cyan-300">Member enrollment / 01</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Register New Member</h1><p className="mt-2 max-w-2xl text-slate-400">Create a secure identity and capture ten face angles for reliable attendance verification.</p></div>
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="border border-cyan-400/15 bg-[#0d2638]/90 shadow-[0_0_50px_rgba(34,211,238,0.08)]"><form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><Input label="Full name" name="name" required value={form.name} onChange={updateField} placeholder="Avery Morgan" /><Input label="Roll number / Employee ID" name="identifier" required value={form.identifier} onChange={updateField} placeholder="STU-2048" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Input label="Email" name="email" type="email" required value={form.email} onChange={updateField} placeholder="avery@campus.edu" /><Input label="Phone" name="phone" type="tel" value={form.phone} onChange={updateField} placeholder="+1 555 0199" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-medium text-slate-300">Department</label><select name="department" value={form.department} onChange={updateField} className="w-full rounded-lg border border-white/10 bg-[#081b2a] px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300"><option value="">Select department</option><option>Computer Science</option><option>Information Technology</option><option>Electronics</option><option>Management</option><option>Administration</option></select></div><div><label className="mb-2 block text-sm font-medium text-slate-300">Role</label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setForm((current) => ({ ...current, role: 'STUDENT' }))} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${form.role === 'STUDENT' ? 'border-cyan-300 bg-cyan-300/15 text-cyan-200' : 'border-white/10 text-slate-400'}`}><GraduationCap size={16} /> Student</button><button type="button" onClick={() => setForm((current) => ({ ...current, role: 'TEACHER' }))} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${form.role === 'TEACHER' ? 'border-cyan-300 bg-cyan-300/15 text-cyan-200' : 'border-white/10 text-slate-400'}`}><Briefcase size={16} /> Employee</button></div></div></div>
        <div><label htmlFor="profile-photo" className="mb-2 block text-sm font-medium text-slate-300">Profile photo</label><label htmlFor="profile-photo" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-cyan-300/30 bg-[#081b2a] px-4 py-3 text-sm text-slate-300 transition hover:border-cyan-300"><ImagePlus size={18} className="text-cyan-300" />{form.profilePhoto ? 'Profile photo selected' : 'Upload a profile photo'}<input id="profile-photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" /></label></div>
        {error && <p className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}{success && <p className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200"><CheckCircle2 size={17} /> Face Registered Successfully.</p>}
        <Button type="submit" className="w-full !bg-cyan-400 !text-[#061521] hover:!bg-cyan-300" disabled={!capture?.samples?.length || !faceConfirmed || saving} isLoading={saving}><UserPlus size={17} /> Register member</Button>
      </form></Card>
      <div><FaceCapture continuous onCapture={handleFaceCapture} onReset={handleCameraRefresh} resetKey={retakeKey} showRefresh disabled={saving} /><p className="mt-3 text-center text-xs text-slate-500">Keep one face centered while five quality-checked samples are collected.</p></div>
    </div>
    {previewPhoto && <Card className="mt-6 border border-cyan-300/20 bg-[#0d2638]/90"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><img src={previewPhoto} alt="Member profile preview" className="h-28 w-28 rounded-2xl border border-cyan-300/40 object-cover shadow-[0_0_25px_rgba(34,211,238,0.2)]" /><div><p className="font-mono-label text-xs text-cyan-300">Profile preview</p><h2 className="mt-1 text-xl font-bold">{form.name || 'New member'}</h2><p className="mt-1 text-sm text-slate-400">{form.identifier || 'ID pending'} · {form.department || 'Department pending'}</p></div></div><div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4"><button type="button" onClick={handleRetakeFace} disabled={saving} className="rounded-lg border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50">↻ Retake Face</button><button type="button" onClick={confirmFace} disabled={!capture?.descriptors || capture.descriptors.length < 5 || saving || faceConfirmed} className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#061521] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">✓ Confirm Face ID ({capture?.descriptors?.length || 0}/5)</button>{faceConfirmed && <span className="text-sm font-semibold text-emerald-300">Face ID Confirmed ✓</span>}</div></Card>}
  </main></div>;
};

export default RegisterUserPage;