import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, RefreshCw, Search, User, Users, XCircle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { Button, Card } from '../../components/common';
import { userAPI } from '../../services/api';

const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const displayDate = (record) => {
  const key = record.attendanceDate || localDateKey(new Date(record.date));
  return new Date(`${key}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const statusStyles = {
  Present: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
  Late: 'bg-amber-400/10 text-amber-200 border-amber-400/20',
  Absent: 'bg-rose-400/10 text-rose-300 border-rose-400/20',
};

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getTeacherStudents({ search: query || undefined, department, sort, order });
      const data = response.data.data || [];
      setStudents(data);
      setDepartments(response.data.departments || []);
      if (selectedStudent) {
        const refreshed = data.find((student) => student._id === selectedStudent._id);
        if (refreshed) setSelectedStudent(refreshed);
      }
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load students.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (student) => {
    setSelectedStudent(student);
    setDetailLoading(true);
    try {
      const response = await userAPI.getTeacherStudentAttendance(student._id);
      setAttendance(response.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load attendance records.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadStudents(); }, 250);
    return () => window.clearTimeout(timer);
  }, [query, department, sort, order]);

  useEffect(() => {
    if (students.length && !selectedStudent) void loadAttendance(students[0]);
  }, [students, selectedStudent]);

  const selectedRecords = useMemo(() => attendance?.records || [], [attendance]);

  return (
    <div className="min-h-screen bg-[#071522] text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono-label text-xs text-cyan-300">Teacher portal / academic attendance</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Student directory</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Review registered students and their complete attendance history using the same local dates shown in student dashboards.</p>
          </div>
          <Button variant="ghost" onClick={() => { void loadStudents(); }}><RefreshCw size={16} /> Refresh</Button>
        </div>

        {error && <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}
        <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.5fr)]">
          <section className="rounded-3xl border border-white/10 bg-[#0d2638]/90 p-5 shadow-2xl shadow-cyan-950/10">
            <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-cyan-300/70">Registered users</p><h2 className="mt-1 text-xl font-bold text-white">Students <span className="text-sm font-normal text-slate-500">({students.length})</span></h2></div><Users className="text-cyan-300" size={21} /></div>
            <div className="space-y-3">
              <label className="relative block"><Search size={16} className="absolute left-3 top-3.5 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, roll number, course" className="h-11 w-full rounded-xl border border-white/10 bg-[#081b2a] pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-300/50" /></label>
              <div className="grid grid-cols-[1fr_1fr] gap-3"><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-10 rounded-xl border border-white/10 bg-[#081b2a] px-3 text-xs text-slate-300 outline-none focus:border-cyan-300/50"><option value="all">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={`${sort}:${order}`} onChange={(event) => { const [nextSort, nextOrder] = event.target.value.split(':'); setSort(nextSort); setOrder(nextOrder); }} className="h-10 rounded-xl border border-white/10 bg-[#081b2a] px-3 text-xs text-slate-300 outline-none focus:border-cyan-300/50"><option value="name:asc">Name A-Z</option><option value="name:desc">Name Z-A</option><option value="rollNumber:asc">Roll number</option><option value="course:asc">Course</option><option value="department:asc">Department</option></select></div>
            </div>
            <div className="mt-5 max-h-[640px] space-y-2 overflow-y-auto pr-1">
              {loading ? <p className="py-10 text-center text-sm text-slate-500">Loading students...</p> : students.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No students match the current filters.</p> : students.map((student) => <button type="button" key={student._id} onClick={() => { void loadAttendance(student); }} className={`w-full rounded-2xl border p-4 text-left transition ${selectedStudent?._id === student._id ? 'border-cyan-300/50 bg-cyan-300/10' : 'border-white/10 bg-[#081b2a] hover:border-cyan-300/30'}`}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><User size={18} /></div><div className="min-w-0"><p className="truncate font-semibold text-white">{student.name}</p><p className="mt-1 truncate text-xs text-slate-500">{student.studentId || 'Roll number not set'} · {student.className || student.department || 'Course not set'}</p></div></div><span className="text-sm font-bold text-cyan-200">{student.attendance.percentage}%</span></div><div className="mt-3 flex gap-3 text-[10px] text-slate-500"><span>P {student.attendance.present}</span><span>L {student.attendance.late}</span><span>A {student.attendance.absent}</span><span>{student.email}</span></div></button>)}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0d2638]/90 p-5 shadow-2xl shadow-cyan-950/10 sm:p-6">
            {!selectedStudent ? <div className="flex min-h-[500px] items-center justify-center text-slate-500">Select a student to view attendance.</div> : <>
              <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start"><div><p className="text-xs uppercase tracking-widest text-cyan-300/70">Student profile</p><h2 className="mt-1 text-2xl font-bold text-white">{selectedStudent.name}</h2><p className="mt-1 text-sm text-slate-400">{selectedStudent.studentId || 'No roll number'} · {selectedStudent.className || selectedStudent.department || 'Course not set'} · {selectedStudent.email}</p></div><div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-center"><p className="text-2xl font-extrabold text-cyan-200">{attendance?.summary.percentage ?? selectedStudent.attendance.percentage}%</p><p className="text-[10px] uppercase tracking-widest text-slate-500">attendance</p></div></div>
              {detailLoading ? <p className="py-12 text-center text-sm text-slate-500">Loading attendance history...</p> : attendance && <><div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Present', attendance.summary.present, CheckCircle2, 'text-emerald-300'], ['Late', attendance.summary.late, Clock3, 'text-amber-200'], ['Absent', attendance.summary.absent, XCircle, 'text-rose-300'], ['Records', attendance.summary.total, CalendarDays, 'text-cyan-200']].map(([label, value, Icon, color]) => <div key={label} className="rounded-2xl border border-white/10 bg-[#081b2a] p-3"><Icon size={16} className={color} /><p className="mt-3 text-xl font-bold text-white">{value}</p><p className="text-xs text-slate-500">{label}</p></div>)}</div><div className="overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[1.3fr_0.7fr_0.8fr] gap-3 bg-white/[0.04] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500"><span>Attendance date</span><span>Status</span><span>Check-in time</span></div><div className="max-h-[520px] divide-y divide-white/5 overflow-y-auto">{selectedRecords.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No attendance records found.</p> : selectedRecords.map((record) => <div key={record._id} className="grid grid-cols-[1.3fr_0.7fr_0.8fr] items-center gap-3 px-4 py-3 text-sm"><span className="flex items-center gap-2 text-slate-300"><CalendarDays size={14} className="text-cyan-300/70" />{displayDate(record)}</span><span className={`w-fit rounded-full border px-2 py-1 text-[10px] font-bold ${statusStyles[record.status] || statusStyles.Absent}`}>{record.status}</span><span className="text-slate-400">{record.checkInTime || 'Not recorded'}</span></div>)}</div></div></>}
            </>}
          </section>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
