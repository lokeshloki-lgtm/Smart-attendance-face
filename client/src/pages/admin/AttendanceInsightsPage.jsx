import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CalendarDays, CheckCircle2, Clock3, Sparkles, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { Card } from '../../components/common';
import { analyticsAPI } from '../../services/api';

const formatDate = (date) => date.toISOString().slice(0, 10);
const startOfWeek = (date) => {
  const value = new Date(date);
  value.setDate(value.getDate() - ((value.getDay() + 6) % 7));
  return value;
};
const getRange = (period, selectedMonth) => {
  const today = new Date();
  if (period === 'today') return { startDate: formatDate(today), endDate: formatDate(today) };
  if (period === 'week') {
    const start = startOfWeek(today);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { startDate: formatDate(start), endDate: formatDate(end) };
  }
  if (period === 'month') {
    const [year, month] = selectedMonth.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    return { startDate: formatDate(start), endDate: formatDate(new Date(year, month, 0)) };
  }
  return { startDate: formatDate(today), endDate: formatDate(today) };
};

const StatCard = ({ label, value, icon: Icon, color }) => <Card className="border border-white/10 bg-[#0d2638]/90"><div className="flex items-center justify-between"><p className="text-sm text-slate-400">{label}</p><Icon size={18} className={color} /></div><p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p></Card>;
const Bar = ({ value, max, color }) => <div className="h-28 flex-1 rounded-t-md bg-white/5"><div className={`mt-auto h-full min-h-0 rounded-t-md ${color}`} style={{ height: `${max ? Math.max(value / max * 100, value ? 8 : 0) : 0}%` }} /></div>;

const AttendanceInsightsPage = () => {
  const currentMonth = formatDate(new Date()).slice(0, 7);
  const [period, setPeriod] = useState('week');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => period === 'custom' ? { startDate: customStart, endDate: customEnd } : getRange(period, selectedMonth), [period, selectedMonth, customStart, customEnd]);
  useEffect(() => {
    if (!range.startDate || !range.endDate) return;
    let active = true;
    setLoading(true);
    analyticsAPI.getAttendanceInsights(range).then((response) => {
      if (active) { setReport(response.data.data); setError(''); }
    }).catch((requestError) => {
      if (active) setError(requestError.response?.data?.message || 'Unable to load attendance insights.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);

  const totals = report?.totals || { present: 0, absent: 0, late: 0, attendancePercentage: 0 };
  const maxDaily = Math.max(...(report?.daily || []).map((day) => day.present + day.late + day.absent), 1);
  const title = period === 'week' ? 'Weekly Attendance' : period === 'month' ? 'Monthly Attendance' : period === 'today' ? "Today's Attendance" : 'Custom Attendance Range';
  return <div className="min-h-screen bg-[#071522] text-slate-100"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="font-mono-label text-xs text-cyan-300">Insights / attendance intelligence</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Attendance Insights</h1><p className="mt-2 text-slate-400">Real attendance records, trends, and member-level analysis.</p></div><div className="flex flex-wrap items-center gap-3 text-xs"><span className="flex items-center gap-2 text-emerald-300"><Activity size={15} /> Live database analysis</span><Link to="/attendance-ai" className="text-cyan-300 hover:text-white">Open AI Assistant</Link><Link to="/attendance" className="text-cyan-300 hover:text-white">Attendance Records</Link></div></div>
    <Card className="mt-6 border border-cyan-300/15 bg-[#0d2638]/90"><div className="flex items-center gap-2 text-sm font-semibold text-cyan-200"><CalendarDays size={16} /> Reporting period</div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-lg border border-white/10 bg-[#081b2a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300"><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="custom">Custom Date Range</option></select>{period === 'month' ? <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="rounded-lg border border-white/10 bg-[#081b2a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300" /> : <div className="rounded-lg border border-white/10 bg-[#081b2a] px-3 py-2.5 text-sm text-slate-400">{range.startDate} to {range.endDate}</div>}{period === 'custom' && <><input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} className="rounded-lg border border-white/10 bg-[#081b2a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300" /><input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} className="rounded-lg border border-white/10 bg-[#081b2a] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300" /></>}</div></Card>
    {error && <p className="mt-6 rounded-lg border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}
    {loading ? <Card className="mt-6 border border-white/10 bg-[#0d2638]/90"><p className="py-12 text-center text-sm text-slate-400">Calculating attendance insights...</p></Card> : report && <>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5"><StatCard label="Members" value={report.members} icon={Activity} color="text-cyan-200" /><StatCard label="Present" value={totals.present} icon={CheckCircle2} color="text-emerald-300" /><StatCard label="Absent" value={totals.absent} icon={UserX} color="text-rose-300" /><StatCard label="Late" value={totals.late} icon={Clock3} color="text-amber-300" /><StatCard label="Attendance" value={`${totals.attendancePercentage}%`} icon={Sparkles} color="text-indigo-300" /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]"><Card className="border border-white/10 bg-[#0d2638]/90"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold">{title}</h2><p className="mt-1 text-xs text-slate-500">Daily attendance breakdown from {report.range.startDate} to {report.range.endDate}</p></div><div className="flex gap-3 text-xs text-slate-400"><span className="text-emerald-300">Present</span><span className="text-amber-300">Late</span><span className="text-rose-300">Absent</span></div></div><div className="mt-6 flex items-end gap-2 overflow-x-auto pb-1">{report.daily.map((day) => <div key={day.date} className="min-w-10 flex-1 text-center"><div className="flex h-28 items-end gap-0.5"><Bar value={day.present} max={maxDaily} color="bg-emerald-400" /><Bar value={day.late} max={maxDaily} color="bg-amber-400" /><Bar value={day.absent} max={maxDaily} color="bg-rose-400" /></div><p className="mt-2 text-[11px] text-slate-300">{period === 'month' ? day.date.slice(8) : day.day}</p><p className="text-[10px] text-slate-500">{day.total} records</p></div>)}</div></Card><Card className="border border-white/10 bg-[#0d2638]/90"><h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles size={18} className="text-cyan-300" /> Attendance summary</h2><div className="mt-4 space-y-3">{report.insights.map((insight) => <p key={insight} className="rounded-lg border border-cyan-300/10 bg-[#081b2a] p-3 text-sm text-slate-300">{insight}</p>)}</div></Card></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><Card className="border border-white/10 bg-[#0d2638]/90"><h2 className="text-lg font-bold">Frequent absences and late arrivals</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="mb-2 text-xs uppercase tracking-wide text-rose-300">Absences</p>{report.frequentAbsences.length ? report.frequentAbsences.map((member) => <p key={member._id} className="flex justify-between border-b border-white/10 py-2 text-sm"><span>{member.name}</span><strong className="text-rose-300">{member.absent}</strong></p>) : <p className="text-sm text-slate-500">No absences recorded.</p>}</div><div><p className="mb-2 text-xs uppercase tracking-wide text-amber-300">Late attendance</p>{report.frequentLate.length ? report.frequentLate.map((member) => <p key={member._id} className="flex justify-between border-b border-white/10 py-2 text-sm"><span>{member.name}</span><strong className="text-amber-300">{member.late}</strong></p>) : <p className="text-sm text-slate-500">No late attendance recorded.</p>}</div></div></Card><Card className="border border-white/10 bg-[#0d2638]/90"><h2 className="text-lg font-bold">Member attendance</h2><div className="mt-4 max-h-64 overflow-y-auto">{report.memberStats.map((member) => <div key={member._id} className="flex items-center justify-between border-b border-white/10 py-2.5 text-sm last:border-0"><div><p className="font-semibold">{member.name}</p><p className="text-xs text-slate-500">{member.studentId || member.employeeId || 'ID unavailable'}</p></div><span className={member.attendancePercentage < 75 ? 'text-rose-300' : 'text-emerald-300'}>{member.attendancePercentage}%</span></div>)}{!report.memberStats.length && <p className="text-sm text-slate-500">No active members found.</p>}</div></Card></div>
    </>}
    <p className="mt-6 flex items-center gap-2 text-xs text-slate-500"><AlertTriangle size={14} /> Attendance percentages count Present and Late as attended; missing records remain visible as zero-value days.</p>
  </main></div>;
};

export default AttendanceInsightsPage;
