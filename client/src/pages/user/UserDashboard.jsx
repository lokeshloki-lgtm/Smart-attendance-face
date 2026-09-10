import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { Card, Badge, Button } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  Calendar,
  ScanFace,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';

const UserDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = () => dashboardAPI.getUserDashboard()
      .then((response) => setDashboard(response.data.data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load dashboard data.'));
    void loadDashboard();
    const interval = window.setInterval(loadDashboard, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const userActions = [
    {
      title: 'Mark My Attendance',
      desc: 'Use camera biometric scanner to verify and check-in.',
      icon: Camera,
      to: '/user/mark-attendance',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
    title: 'Register My Face',
    desc: 'Save your face embedding for secure attendance verification.',
    icon: ScanFace,
    to: '/user/register-face',
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  },
  {
      title: 'Attendance History',
      desc: 'Review past attendance logs, check-in times, and statuses.',
      icon: Calendar,
      to: '/user/attendance',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'My Profile & Face Data',
      desc: 'View your profile information and update face embeddings.',
      icon: UserIcon,
      to: '/user/profile',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'AI Attendance Insights',
      desc: 'Chat with AI to analyze your personal attendance habits.',
      icon: Sparkles,
      to: '/user/ai',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Hero */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-teal-600 via-indigo-600 to-indigo-800 p-6 md:p-8 text-white shadow-xl shadow-indigo-500/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  <CheckCircle2 size={14} /> {user?.role === 'TEACHER' ? 'Teacher Portal' : 'Student Portal'}
                </span>
                <Badge variant="success">Active</Badge>
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight">
                Hello, {user?.name || 'Member'}!
              </h1>
              <p className="mt-1 text-indigo-100 text-sm md:text-base">
                Department: {user?.department || 'IT'} • ID: {user?.studentId || user?.employeeId || 'STU001'}
              </p>
            </div>
            <div>
              <Link
                to="/user/mark-attendance"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 shadow-lg transition"
              >
                <Camera size={18} /> {dashboard?.stats.todayStatus.marked ? 'Already Marked Today' : 'Mark Attendance Now'}
              </Link>
            </div>
          </div>
        </div>

        {error && <p className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        {dashboard && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card><p className="text-sm text-gray-500">Today</p><p className="mt-2 text-2xl font-bold">{dashboard.stats.todayStatus.marked ? dashboard.stats.todayStatus.status : 'Not marked'}</p><p className="mt-1 text-sm text-gray-500">{dashboard.stats.todayStatus.checkInTime || 'Capture your face to check in'}</p></Card>
            <Card><p className="text-sm text-gray-500">This month</p><p className="mt-2 text-2xl font-bold">{dashboard.currentMonth.percentage}%</p><p className="mt-1 text-sm text-gray-500">{dashboard.currentMonth.summary.present + dashboard.currentMonth.summary.late} attended</p></Card>
            <Card><p className="text-sm text-gray-500">All-time records</p><p className="mt-2 text-2xl font-bold">{dashboard.stats.allTime.total}</p><p className="mt-1 text-sm text-gray-500">{dashboard.stats.allTime.percentage}% attendance</p></Card>
          </div>
        )}

        {dashboard && <div className="mb-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">{new Date(dashboard.currentMonth.year, dashboard.currentMonth.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2><p className="mt-1 text-sm text-gray-500">Green present, yellow late, red absent</p></div><Calendar className="text-indigo-500" size={22} /></div><div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs"><span className="font-semibold text-gray-500">Mon</span><span className="font-semibold text-gray-500">Tue</span><span className="font-semibold text-gray-500">Wed</span><span className="font-semibold text-gray-500">Thu</span><span className="font-semibold text-gray-500">Fri</span><span className="font-semibold text-gray-500">Sat</span><span className="font-semibold text-gray-500">Sun</span>{Array.from({ length: (new Date(dashboard.currentMonth.year, dashboard.currentMonth.month, 1).getDay() + 6) % 7 }).map((_, index) => <span key={`empty-${index}`} />)}{dashboard.currentMonth.days.map((day) => { const status = day.present ? 'bg-emerald-500' : day.late ? 'bg-amber-400' : day.absent ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'; return <div key={day.date} className={`rounded p-2 text-white ${status} ${day.date === new Date().toISOString().split('T')[0] ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`} title={`${day.date}: Present ${day.present}, Absent ${day.absent}, Late ${day.late}`}>{Number(day.date.slice(-2))}</div>; })}</div></Card>
          <Card><h2 className="text-lg font-bold">This week</h2><p className="mt-1 text-sm text-gray-500">Monday to Sunday</p><div className="mt-5 grid grid-cols-7 gap-2">{dashboard.currentWeek.map((day) => <div key={day.date} className={`rounded-lg p-2 text-center ${day.date === new Date().toISOString().split('T')[0] ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-slate-700'}`}><p className="text-xs font-bold">{day.day}</p><p className="mt-2 text-lg font-bold">{day.present + day.late}</p><p className="text-[10px] text-emerald-600">P {day.present}</p><p className="text-[10px] text-rose-500">A {day.absent}</p><p className="text-[10px] text-amber-600">L {day.late}</p></div>)}</div></Card>
        </div>}

        {/* Quick Actions */}
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} to={item.to} className="group">
                <Card className="h-full border border-gray-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-lg transition duration-200">
                  <div className={`p-3 rounded-xl w-fit ${item.color} group-hover:scale-110 transition-transform mb-3`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {item.desc}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
