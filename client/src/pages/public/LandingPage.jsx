import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  Clock3,
  ScanFace,
  Shield,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: Camera,
    title: 'Face Recognition Attendance',
    description: 'Secure biometric check-in with real-time face matching and confidence verification.',
  },
  {
    icon: BarChart3,
    title: 'Live Analytics',
    description: 'Track attendance trends, department reports, and user performance with actionable insights.',
  },
  {
    icon: Shield,
    title: 'Secure Access Control',
    description: 'Built with role-based authentication, encrypted sessions, and protected admin routes.',
  },
  {
    icon: Clock3,
    title: 'Smart Time Tracking',
    description: 'Automatically identify late entries, attendance history, and daily summaries.',
  },
];

const stats = [
  { label: 'Users', value: '500+' },
  { label: 'Attendance Records', value: '18k+' },
  { label: 'Accuracy', value: '99.2%' },
  { label: 'Avg. Processing', value: '< 1 sec' },
];

const highlights = [
  'Admin dashboard and reporting tools',
  'AI-powered attendance insights',
  'Role-aware access for users and admins',
  'Responsive design for desktop and mobile',
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0f2638] text-[#f3f7f8]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0f2638]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" aria-label="SmartAttend home" className="flex items-center"><img src="/smartattend-mark.svg" alt="" className="block h-11 w-11 max-h-full max-w-full object-contain" /><span className="ml-2 text-xl font-bold">Smart<span className="text-cyan-300">Attend</span></span></Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#about" className="transition hover:text-white">About</a>
            <a href="#security" className="transition hover:text-white">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-[#14b8a6] hover:text-white"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#14b8a6]/40 bg-[#14b8a6]/10 px-3 py-1 text-sm text-[#8ce7d6]">
              <CheckCircle2 className="h-4 w-4" />
              Smart attendance with face recognition
            </div>

            <h1 className="max-w-xl text-4xl font-black leading-tight text-white md:text-6xl">
              Secure attendance for modern teams.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Automate check-ins, monitor attendance in real time, and give admins instant visibility with AI-powered reporting.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-6 py-3 font-semibold text-white shadow-lg shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8]"
              >
                Access Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-[#14b8a6] hover:bg-white/10"
              >
                Create Account
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-[#2d6d86] bg-[#123a52] p-6 shadow-2xl shadow-black/20">
              <div className="rounded-2xl border border-[#2d6d86] bg-[#081f31] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#76ead8]">
                      <span className="h-2 w-2 rounded-full bg-[#76ead8] shadow-[0_0_12px_#76ead8]" /> Live verification
                    </div>
                    <p className="mt-3 text-sm text-slate-400">Today’s attendance</p>
                    <h3 className="mt-1 text-2xl font-bold text-white">98.6%</h3>
                  </div>
                  <div className="rounded-2xl border border-[#76ead8]/30 bg-[#14b8a6]/15 p-3 text-[#76ead8]">
                    <ScanFace className="h-7 w-7" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    { name: 'Present', value: '84', color: 'bg-[#76ead8]' },
                    { name: 'Late', value: '7', color: 'bg-[#f5c76b]' },
                    { name: 'Absent', value: '3', color: 'bg-[#fb7185]' },
                  ].map((item) => (
                    <div key={item.name}>
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                        <span>{item.name}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#17384b]">
                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">Features</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Everything you need for attendance management</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-[#173b50] p-6">
                <div className="mb-5 inline-flex rounded-xl bg-indigo-500/10 p-3 text-indigo-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="border-y border-white/10 bg-slate-900/60">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">Why it matters</p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">Built for productivity, accountability, and trust.</h2>
            </div>

            <div className="space-y-4">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                  <p className="text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-600/10 via-slate-900 to-slate-900 p-8 md:p-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">Security first</p>
                <h2 className="mt-3 text-3xl font-bold">Ready for secure, scalable attendance tracking.</h2>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Open App
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-400">
        © 2026 SmartAttend. Secure attendance management with face recognition.
      </footer>
    </div>
  );
};

export default LandingPage;
