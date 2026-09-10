import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { Card, Badge } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { Users, CalendarCheck, Sparkles, Shield, UserPlus, ArrowRight, Activity } from 'lucide-react';
import { dashboardAPI } from '../../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = () => dashboardAPI.getAdminDashboard()
      .then((response) => setDashboard(response.data.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load admin metrics.'));
    void loadDashboard();
    const interval = window.setInterval(loadDashboard, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const quickLinks = [
    { title: 'User Management', desc: 'View, add, edit, or register face embeddings for members.', icon: Users, to: '/users', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { title: 'Register New Member', desc: 'Onboard a student or employee into the database.', icon: UserPlus, to: '/users/register', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { title: 'Attendance Records', desc: 'Inspect logs, verify attendance, and manage daily entries.', icon: CalendarCheck, to: '/attendance', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
    { title: 'Mark Attendance (Kiosk)', desc: 'Launch real-time camera face recognition scanner.', icon: CalendarCheck, to: '/attendance/mark', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { title: 'AI Attendance Assistant', desc: 'Query insights, generate summaries, and detect anomalies.', icon: Sparkles, to: '/attendance-ai', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
    { title: 'Attendance Insights', desc: 'Review weekly and monthly trends, absences, late arrivals, and member percentages.', icon: Activity, to: '/attendance-insights', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div><div className="flex items-center gap-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm"><Shield size={14} /> Admin Portal</span><Badge variant="success">Active</Badge></div><h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight">Welcome back, {user?.name || 'Administrator'}!</h1><p className="mt-1 text-indigo-100 text-sm md:text-base">Department: {user?.department || 'Administration'} • ID: {user?.employeeId || 'ADMIN001'}</p></div>
            <Link to="/attendance/mark" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 shadow-md transition">Open Attendance Kiosk <ArrowRight size={16} /></Link>
          </div>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Admin Operations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return <Link key={item.title} to={item.to} className="group"><Card className="h-full border border-gray-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-lg transition duration-200"><div className="flex items-start gap-4"><div className={`p-3 rounded-xl ${item.color} group-hover:scale-110 transition-transform`}><Icon size={24} /></div><div className="flex-1"><h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.title}</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.desc}</p></div></div></Card></Link>;
            })}
          </div>
        </section>

        {error && <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        {dashboard && <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">{[['Total students', dashboard.stats.totalUsers], ['Present today', dashboard.stats.presentToday], ['Absent today', dashboard.stats.absentToday], ['Attendance %', `${dashboard.stats.attendancePercentage}%`], ['Registered Face IDs', dashboard.stats.registeredFaceIds]].map(([label, value]) => <Card key={label}><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card>)}</div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><h2 className="text-lg font-bold">Recent attendance activity</h2><div className="mt-4 space-y-3">{dashboard.recentAttendance?.slice(0, 6).map((record) => <div key={record._id} className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3 text-sm last:border-0 dark:border-slate-800"><div><p className="font-semibold">{record.studentName || record.userId?.name || 'Student'}</p><p className="text-xs text-gray-500">{record.studentId || record.userId?.studentId || 'ID unavailable'} · {record.checkInTime}</p></div><Badge variant={record.status === 'Absent' ? 'danger' : 'success'}>{record.status}</Badge></div>)}</div></Card>
            <Card><h2 className="text-lg font-bold">Today by department</h2><div className="mt-4 space-y-3">{Object.entries(dashboard.departmentAttendance || {}).map(([department, summary]) => <div key={department} className="flex items-center justify-between border-b border-gray-200 pb-3 text-sm last:border-0 dark:border-slate-800"><span>{department}</span><span className="text-gray-500">{summary.present} present · {summary.late} late · {summary.absent} absent</span></div>)}{!Object.keys(dashboard.departmentAttendance || {}).length && <p className="text-sm text-gray-500">No attendance recorded today.</p>}</div></Card>
          </div>
        </>}
      </main>
    </div>
  );
};

export default AdminDashboard;
