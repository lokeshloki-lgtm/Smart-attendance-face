import React, { useEffect, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { Card } from '../../components/common';
import { analyticsAPI } from '../../services/api';

const AnalyticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([analyticsAPI.getOverview(), analyticsAPI.getMonthly(), analyticsAPI.getLocations()])
      .then(([overviewResponse, monthlyResponse, locationsResponse]) => {
        setOverview(overviewResponse.data.data);
        setMonthly(monthlyResponse.data.data || []);
        setLocations(locationsResponse.data.data || []);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load analytics.'));
  }, []);

  const maxMonthly = Math.max(...monthly.map((item) => item.total), 1);

  return <div className="min-h-screen bg-[#071522] text-slate-100"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><p className="font-mono-label text-xs text-cyan-300">Insights / operational intelligence</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Attendance analytics</h1><p className="mt-2 text-slate-400">Heatmap intensity, live recognition outcomes, and captured locations.</p>{error && <p className="mt-6 rounded-lg bg-rose-400/10 p-4 text-sm text-rose-200">{error}</p>}{overview && <div className="mt-8 grid gap-4 sm:grid-cols-4">{[['Users', overview.totalUsers], ['Present', overview.presentCount], ['Absent', overview.absentCount], ['Late', overview.lateCount]].map(([label, value]) => <Card key={label} className="border border-white/10 bg-[#0d2638]/90"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-cyan-200">{value}</p></Card>)}</div>}<div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><Card className="border border-white/10 bg-[#0d2638]/90"><h2 className="font-bold">Attendance heatmap</h2><p className="mt-1 text-xs text-slate-500">Monthly volume by intensity</p><div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">{monthly.map((item) => <div key={item.month} className="rounded-lg border border-white/10 p-3" style={{ backgroundColor: `rgba(34, 211, 238, ${Math.max(0.08, item.total / maxMonthly * 0.7)})` }}><p className="text-xs text-slate-300">{item.month}</p><p className="mt-2 text-lg font-bold">{item.total}</p><p className="text-[11px] text-slate-300">{item.present} present</p></div>)}</div></Card><Card className="border border-white/10 bg-[#0d2638]/90"><h2 className="flex items-center gap-2 font-bold"><MapPin size={17} className="text-cyan-300" /> Location map pins</h2><p className="mt-1 text-xs text-slate-500">Recent GPS-verified activity</p><div className="mt-4 space-y-3">{locations.length === 0 ? <p className="py-8 text-sm text-slate-500">No GPS attendance records yet.</p> : locations.slice(0, 10).map((record) => <div key={record._id} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-[#081b2a] p-3"><div><p className="text-sm font-semibold">{record.studentName}</p><p className="mt-1 text-xs text-slate-500">{record.locationAddress || `${record.latitude}, ${record.longitude}`}</p></div>{record.mapsLink && <a href={record.mapsLink} target="_blank" rel="noreferrer" aria-label={`Open map for ${record.studentName}`} className="text-cyan-300 hover:text-white"><ExternalLink size={16} /></a>}</div>)}</div></Card></div></main></div>;
};

export default AnalyticsPage;