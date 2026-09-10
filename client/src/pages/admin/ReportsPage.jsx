import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, FileSpreadsheet, Printer, Search } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { Button, Card } from '../../components/common';
import { attendanceAPI } from '../../services/api';

const ReportsPage = () => {
	const [report, setReport] = useState(null); const [error, setError] = useState('');
	const [period, setPeriod] = useState('daily'); const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState(''); const [department, setDepartment] = useState(''); const [query, setQuery] = useState('');
	const exportExcel = () => {
		if (!report?.records?.length) return;
		const rows = [['Name', 'ID', 'Department', 'Date', 'Time', 'Status', 'Confidence', 'Latitude', 'Longitude', 'Location']];
		report.records.forEach((record) => rows.push([record.studentName, record.studentId || record.userId?.employeeId || '', record.userId?.department || '', new Date(record.date).toLocaleDateString(), record.checkInTime, record.status, `${Math.round((record.recognitionConfidence || 0) * 100)}%`, record.latitude || '', record.longitude || '', record.locationAddress || '']));
		const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
		const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); link.download = 'smartattend-attendance.csv'; link.click(); URL.revokeObjectURL(link.href);
	};
	const loadReport = async (params = {}) => {
		try {
			const response = await attendanceAPI.getReport(params);
			setReport(response.data.data); setError('');
		} catch (requestError) { setError(requestError.response?.data?.message || 'Unable to generate report.'); }
	};
	useEffect(() => {
		const loadReport = async () => {
			try {
				const response = await attendanceAPI.getReport();
				setReport(response.data.data);
			} catch (requestError) {
				setError(requestError.response?.data?.message || 'Unable to generate report.');
			}
		};

		void loadReport();
	}, []);
	const departments = useMemo(() => [...new Set((report?.records || []).map((record) => record.userId?.department).filter(Boolean))], [report]);
	const records = (report?.records || []).filter((record) => `${record.studentName} ${record.studentId || ''} ${record.userId?.department || ''}`.toLowerCase().includes(query.toLowerCase()));
	const byStudent = records.reduce((groups, record) => { const key = record.studentName || record.userId?.name || 'Unknown'; groups[key] ||= { present: 0, absent: 0, late: 0, total: 0 }; groups[key].total += 1; groups[key][record.status.toLowerCase()] += 1; return groups; }, {});
	const applyFilters = () => { const today = new Date(); const end = endDate || today.toISOString().slice(0, 10); let start = startDate || end; if (period === 'weekly') { const date = new Date(end); date.setDate(date.getDate() - 6); start = date.toISOString().slice(0, 10); } if (period === 'monthly') { const date = new Date(end); date.setDate(1); start = date.toISOString().slice(0, 10); } void loadReport({ startDate: start, endDate: end, ...(department ? { department } : {}) }); };
	return <div className="min-h-screen bg-[#071522] text-slate-100"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono-label text-xs text-cyan-300">Insights / exports</p><h1 className="mt-2 text-3xl font-bold">Attendance reports</h1><p className="mt-2 text-slate-400">Daily, weekly, monthly, student-wise, and department-wise attendance.</p></div><div className="flex gap-2"><Button variant="ghost" onClick={exportExcel}><FileSpreadsheet size={16} /> CSV</Button><Button variant="ghost" onClick={() => window.print()}><Printer size={16} /> PDF / Print</Button></div></div><Card className="mt-6 border border-white/10 bg-[#0d2638]/90"><div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"><select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-lg border border-white/10 bg-[#081b2a] px-3 py-2 text-sm"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="custom">Custom range</option></select><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={period !== 'custom'} className="rounded-lg border border-white/10 bg-[#081b2a] px-3 py-2 text-sm" /><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={period !== 'custom'} className="rounded-lg border border-white/10 bg-[#081b2a] px-3 py-2 text-sm" /><select value={department} onChange={(event) => setDepartment(event.target.value)} className="rounded-lg border border-white/10 bg-[#081b2a] px-3 py-2 text-sm"><option value="">All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select><Button onClick={applyFilters}><CalendarRange size={16} /> Apply</Button></div><div className="relative mt-3"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by student name or ID" className="w-full rounded-lg border border-white/10 bg-[#081b2a] py-2 pl-9 pr-3 text-sm text-white" /></div></Card>{error && <p className="mt-6 rounded-lg bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}{report && <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[['Records', report.summary.totalRecords], ['Present', report.summary.present], ['Absent', report.summary.absent], ['Attendance %', `${report.summary.presentPercentage}%`], ['Confidence', report.summary.averageConfidence]].map(([label, value]) => <Card key={label} className="border border-white/10 bg-[#0d2638]/90"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card>)}</div><div className="mt-8 grid gap-6 lg:grid-cols-2"><Card className="border border-white/10 bg-[#0d2638]/90"><h2 className="font-bold">Department-wise report</h2><div className="mt-4 space-y-3">{Object.entries(report.byDepartment).map(([item, stats]) => <div key={item} className="flex justify-between border-b border-white/10 pb-3 text-sm"><span>{item}</span><span>{stats.present} present · {stats.absent} absent · {stats.total ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%</span></div>)}</div></Card><Card className="border border-white/10 bg-[#0d2638]/90"><h2 className="font-bold">Student-wise report</h2><div className="mt-4 space-y-3">{Object.entries(byStudent).map(([name, stats]) => <div key={name} className="flex justify-between border-b border-white/10 pb-3 text-sm"><span>{name}</span><span>{stats.present} present · {stats.absent} absent · {stats.total ? ((stats.present + stats.late) / stats.total * 100).toFixed(1) : 0}%</span></div>)}</div></Card></div></>}</main></div>;
};

export default ReportsPage;
