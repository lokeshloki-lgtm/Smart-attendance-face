import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	Activity,
	ArrowLeft,
	CalendarDays,
	CheckCircle2,
	Clock3,
	ExternalLink,
	MapPin,
	Monitor,
	Search,
	ShieldCheck,
	UserCircle as User,
	Users,
	XCircle,
} from 'lucide-react';
import {
	Bar,
	BarChart,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI } from '../../services/api';

const statusMeta = {
	Present: { color: '#32d583', soft: 'bg-emerald-400/10 text-emerald-300', icon: CheckCircle2 },
	Late: { color: '#f7c948', soft: 'bg-amber-300/10 text-amber-200', icon: Clock3 },
	Absent: { color: '#ff6b7a', soft: 'bg-rose-400/10 text-rose-300', icon: XCircle },
};

const formatDate = (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => (
	value ? new Date(value).toLocaleDateString('en-US', options) : 'Unknown date'
);

const getRecordUser = (record, user) => record.userId && typeof record.userId === 'object' ? record.userId : user;

const initials = (name = 'Student') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const Section = ({ title, eyebrow, action, children, className = '' }) => (
	<section className={`rounded-3xl border border-white/10 bg-[#102b4a]/70 p-5 shadow-2xl shadow-[#020b18]/20 backdrop-blur-xl sm:p-6 ${className}`}>
		<div className="mb-5 flex items-start justify-between gap-4">
			<div><p className="font-mono-label text-[10px] text-cyan-300/70">{eyebrow}</p><h2 className="mt-1 text-lg font-bold tracking-tight text-white">{title}</h2></div>
			{action}
		</div>
		{children}
	</section>
);

const StudentCard = ({ record, user }) => {
	const person = getRecordUser(record, user);
	const meta = statusMeta[record.status] || statusMeta.Present;
	const StatusIcon = meta.icon;
	return (
		<motion.article whileHover={{ y: -3 }} className="group rounded-2xl border border-white/10 bg-[#0b2340]/80 p-4 transition hover:border-cyan-300/40 hover:shadow-lg hover:shadow-cyan-950/40">
			<div className="flex items-start gap-3">
				{record.facePhoto || person?.profilePhoto || person?.profileImage ? <img src={record.facePhoto || person.profilePhoto || person.profileImage} alt={record.studentName || person?.name || 'Student'} className="h-11 w-11 rounded-xl object-cover ring-2 ring-cyan-300/20" /> : <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/10 text-sm font-bold text-cyan-200">{initials(record.studentName || person?.name)}</div>}
				<div className="min-w-0 flex-1"><p className="truncate font-bold text-white">{record.studentName || person?.name || 'Student'}</p><p className="mt-0.5 text-xs text-slate-400">{record.studentId || person?.studentId || person?.employeeId || 'ID not provided'} · {person?.department || 'General'}</p></div>
				<span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${meta.soft}`}><StatusIcon size={12} />{record.status}</span>
			</div>
			<div className="mt-4 grid grid-cols-2 gap-y-3 text-xs">
				<div><p className="text-slate-500">Check-in</p><p className="mt-1 font-semibold text-slate-200">{record.checkInTime || 'Not recorded'}</p></div>
				<div><p className="text-slate-500">Confidence</p><p className="mt-1 font-semibold text-cyan-200">{record.recognitionConfidence != null ? `${Math.round(record.recognitionConfidence * 100)}%` : 'Manual'}</p></div>
				<div className="col-span-2 flex min-w-0 items-start gap-1.5 text-slate-300"><MapPin size={13} className="mt-0.5 shrink-0 text-cyan-300" /><span className="min-w-0 truncate">{record.locationAddress || 'Address unavailable'}<span className="block text-[11px] text-slate-500">Latitude: {record.latitude != null ? Number(record.latitude).toFixed(6) : 'Unavailable'} · Longitude: {record.longitude != null ? Number(record.longitude).toFixed(6) : 'Unavailable'}</span></span></div>
				<div className="col-span-2 flex min-w-0 items-center gap-1.5 text-slate-400"><Monitor size={13} className="shrink-0 text-slate-500" /><span className="truncate">{record.deviceInfo || record.verificationMethod || 'Verification device unavailable'}</span></div>
			</div>
		</motion.article>
	);
};

const UserAttendanceHistory = () => {
	const { user } = useAuth();
	const [records, setRecords] = useState([]);
	const [error, setError] = useState('');
	const [query, setQuery] = useState('');
	const [date, setDate] = useState('');
	const [department, setDepartment] = useState('all');
	const [location, setLocation] = useState('all');
	const [selectedLocation, setSelectedLocation] = useState(null);

	useEffect(() => {
		if (!user?._id) return;
		attendanceAPI.history({ limit: 100 })
			.then((response) => setRecords(response.data.data || []))
			.catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load attendance history.'));
	}, [user?._id]);

	const departments = useMemo(() => [...new Set(records.map((record) => getRecordUser(record, user)?.department).filter(Boolean))], [records, user]);
	const locations = useMemo(() => [...new Set(records.map((record) => record.locationAddress).filter(Boolean))], [records]);
	const filteredRecords = useMemo(() => records.filter((record) => {
		const person = getRecordUser(record, user);
		const haystack = `${record.studentName || ''} ${record.studentId || ''} ${person?.name || ''}`.toLowerCase();
		return (!query || haystack.includes(query.toLowerCase())) && (!date || record.date?.slice(0, 10) === date) && (department === 'all' || person?.department === department) && (location === 'all' || record.locationAddress === location);
	}), [records, user, query, date, department, location]);

	const stats = useMemo(() => {
		const present = filteredRecords.filter((record) => record.status === 'Present').length;
		const late = filteredRecords.filter((record) => record.status === 'Late').length;
		const absent = filteredRecords.filter((record) => record.status === 'Absent').length;
		const total = filteredRecords.length;
		return { present, late, absent, total, rate: total ? Math.round(((present + late) / total) * 100) : 0 };
	}, [filteredRecords]);

	const weeklyData = useMemo(() => Array.from({ length: 7 }, (_, index) => {
		const day = new Date();
		day.setHours(0, 0, 0, 0);
		day.setDate(day.getDate() - (6 - index));
		const key = day.toISOString().slice(0, 10);
		const dayRecords = filteredRecords.filter((record) => record.date?.slice(0, 10) === key);
		return { day: day.toLocaleDateString('en-US', { weekday: 'short' }), present: dayRecords.filter((record) => record.status === 'Present').length, late: dayRecords.filter((record) => record.status === 'Late').length, absent: dayRecords.filter((record) => record.status === 'Absent').length };
	}), [filteredRecords]);

	const mapRecords = filteredRecords.filter((record) => record.latitude != null && record.longitude != null);
	const currentMapRecord = selectedLocation || mapRecords[0];
	const statusColumns = ['Present', 'Late', 'Absent'];

	const kpis = [
		{ label: 'Present', value: stats.present, note: 'On-time check-ins', icon: CheckCircle2, color: 'text-emerald-300', glow: 'from-emerald-400/20' },
		{ label: 'Late', value: stats.late, note: 'After 09:00 check-ins', icon: Clock3, color: 'text-amber-200', glow: 'from-amber-300/20' },
		{ label: 'Absent', value: stats.absent, note: 'Missed check-ins', icon: XCircle, color: 'text-rose-300', glow: 'from-rose-400/20' },
		{ label: 'Attendance rate', value: `${stats.rate}%`, note: 'Present + late / total', icon: ShieldCheck, color: 'text-cyan-200', glow: 'from-cyan-300/20' },
	];

	return (
		<div className="min-h-screen bg-[#07182d] text-slate-100">
			<Navbar />
			<div className="pointer-events-none fixed inset-x-0 top-16 -z-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(21,182,229,0.16),transparent_65%)]" />
			<main className="relative z-10 mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
					<div><Link to="/user/dashboard" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 transition hover:text-white"><ArrowLeft size={15} /> Back to dashboard</Link><p className="font-mono-label text-[10px] text-cyan-300/70">SmartAttend / personal analytics</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Attendance command center</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">A live view of verified presence, patterns, and check-in locations for {user?.name || 'your account'}.</p></div>
					<div className="flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3 text-xs text-cyan-100"><Activity size={17} className="text-cyan-300" /><span><b className="text-white">Live sync</b><br />Updated just now</span><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /></div>
				</div>

				{error && <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}
				<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map((kpi, index) => { const Icon = kpi.icon; return <motion.div key={kpi.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${kpi.glow} to-[#102b4a]/80 p-5 shadow-xl shadow-[#020b18]/20`}><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-300/5 blur-2xl" /><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-300">{kpi.label}</p><Icon size={19} className={kpi.color} /></div><p className={`mt-4 text-4xl font-extrabold tracking-tight ${kpi.color}`}>{kpi.value}</p><p className="mt-1 text-xs text-slate-500">{kpi.note}</p></motion.div>; })}</div>

				<div className="mb-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
					<Section title="Weekly attendance" eyebrow="last 7 days" action={<span className="rounded-full bg-white/5 px-3 py-1 text-[10px] text-slate-400">{stats.total} records</span>}><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData} barGap={5}><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#7f9bb5', fontSize: 11 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#7f9bb5', fontSize: 11 }} /><Tooltip cursor={{ fill: 'rgba(90, 210, 240, 0.06)' }} contentStyle={{ background: '#0b2340', border: '1px solid rgba(103, 232, 249, 0.2)', borderRadius: 12, color: '#fff' }} /><Bar dataKey="present" stackId="a" fill="#32d583" radius={[0, 0, 4, 4]} name="Present" /><Bar dataKey="late" stackId="a" fill="#f7c948" name="Late" /><Bar dataKey="absent" stackId="a" fill="#ff6b7a" radius={[4, 4, 0, 0]} name="Absent" /></BarChart></ResponsiveContainer></div></Section>
					<Section title="Attendance health" eyebrow="status distribution"><div className="flex items-center justify-center gap-5"><div className="relative h-44 w-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: 'Present', value: stats.present }, { name: 'Late', value: stats.late }, { name: 'Absent', value: stats.absent }]} dataKey="value" innerRadius={57} outerRadius={75} paddingAngle={4} stroke="none"><Cell fill="#32d583" /><Cell fill="#f7c948" /><Cell fill="#ff6b7a" /></Pie><Tooltip contentStyle={{ background: '#0b2340', border: '1px solid rgba(103, 232, 249, 0.2)', borderRadius: 12 }} /></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-extrabold text-white">{stats.rate}%</span><span className="text-[10px] uppercase tracking-widest text-slate-500">on track</span></div></div><div className="space-y-3 text-xs">{[['Present', stats.present, '#32d583'], ['Late', stats.late, '#f7c948'], ['Absent', stats.absent, '#ff6b7a']].map(([label, value, color]) => <div key={label} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /><span className="w-14 text-slate-400">{label}</span><b className="text-white">{value}</b></div>)}</div></div></Section>
				</div>

				<Section title="Attendance locations" eyebrow="verified GPS activity" className="mb-6" action={currentMapRecord?.mapsLink && <a href={currentMapRecord.mapsLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-white">Open in Maps <ExternalLink size={13} /></a>}><div className="grid gap-5 lg:grid-cols-[1fr_280px]"><div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#081b32]">{currentMapRecord ? <iframe title="Attendance location map" className="h-full min-h-[280px] w-full opacity-80 grayscale-[0.35]" src={`https://www.google.com/maps?q=${currentMapRecord.latitude},${currentMapRecord.longitude}&output=embed`} /> : <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-500"><MapPin size={28} className="text-cyan-300/60" /><p>No GPS locations captured yet.</p></div>}<div className="pointer-events-none absolute inset-0 bg-cyan-400/5" /></div><div className="space-y-2">{mapRecords.length ? mapRecords.slice(0, 5).map((record) => <button type="button" key={record._id} onClick={() => setSelectedLocation(record)} className={`w-full rounded-xl border p-3 text-left transition ${currentMapRecord?._id === record._id ? 'border-cyan-300/50 bg-cyan-300/10' : 'border-white/10 bg-white/[0.02] hover:border-cyan-300/30'}`}><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-slate-200">{record.locationAddress || 'Recorded location'}</span><MapPin size={14} className="shrink-0 text-cyan-300" /></div><p className="mt-1 text-[10px] text-slate-500">{formatDate(record.date, { month: 'short', day: 'numeric' })} · {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}</p></button>) : <p className="text-xs leading-5 text-slate-500">Location pins will appear here when attendance is captured with GPS enabled.</p>}</div></div></Section>

				<div className="mb-6 rounded-3xl border border-cyan-300/20 bg-[#0d2948]/80 p-4 shadow-xl shadow-cyan-950/10 backdrop-blur-xl"><div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:items-end"><label className="relative block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Search records</span><Search size={16} className="absolute left-3 top-[37px] text-cyan-300/60" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or roll number" className="h-11 w-full rounded-xl border border-white/10 bg-[#081b32] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50" /></label><label><span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#081b32] px-3 text-sm text-slate-300 outline-none focus:border-cyan-300/50" /></label><label><span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Department</span><select value={department} onChange={(event) => setDepartment(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#081b32] px-3 text-sm text-slate-300 outline-none focus:border-cyan-300/50"><option value="all">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Location</span><select value={location} onChange={(event) => setLocation(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-[#081b32] px-3 text-sm text-slate-300 outline-none focus:border-cyan-300/50"><option value="all">All locations</option>{locations.map((item) => <option key={item} value={item}>{item}</option>)}</select></label></div></div>

				<div className="mb-6 flex items-center justify-between"><div><p className="font-mono-label text-[10px] text-cyan-300/70">record stream</p><h2 className="mt-1 text-xl font-bold text-white">Attendance activity</h2></div><span className="flex items-center gap-2 text-xs text-slate-500"><Users size={15} /> {filteredRecords.length} shown</span></div>
				{!error && filteredRecords.length === 0 ? <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-12 text-center"><User size={32} className="mx-auto text-cyan-300/60" /><p className="mt-3 font-semibold text-slate-300">No attendance records match these filters.</p><p className="mt-1 text-sm text-slate-500">Try clearing a filter or mark your first attendance.</p></div> : <div className="grid gap-6 lg:grid-cols-3">{statusColumns.map((status) => { const meta = statusMeta[status]; const StatusIcon = meta.icon; return <div key={status} className="min-w-0"><div className="mb-3 flex items-center justify-between"><h3 className={`flex items-center gap-2 text-sm font-bold ${meta.soft.split(' ')[1]}`}><StatusIcon size={16} /> {status}</h3><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-slate-500">{filteredRecords.filter((record) => record.status === status).length}</span></div><div className="space-y-3">{filteredRecords.filter((record) => record.status === status).map((record) => <StudentCard key={record._id} record={record} user={user} />)}</div></div>; })}</div>}

				<div className="mt-8 rounded-2xl border border-white/10 bg-[#0b2340]/60 p-4 text-xs text-slate-500"><div className="flex items-center gap-2"><CalendarDays size={14} className="text-cyan-300" /> Latest activity appears first. Face match scores and GPS details are shown exactly as returned by the attendance service.</div></div>
			</main>
		</div>
	);
};

export default UserAttendanceHistory;
