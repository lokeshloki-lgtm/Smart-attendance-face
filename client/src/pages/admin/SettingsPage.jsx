import React, { useState } from 'react';
import { Clock3, Save, UserCircle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { Button, Card, Input } from '../../components/common';
import { authAPI, getApiErrorMessage, settingsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();
  const defaultAttendanceWindow = { startTime: '00:00', lateTime: '09:00', absentTime: '18:00' };
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '' });
  const [attendanceWindow, setAttendanceWindow] = useState(defaultAttendanceWindow);
  const [windowMessage, setWindowMessage] = useState('');
  const [windowError, setWindowError] = useState('');

  React.useEffect(() => {
    settingsAPI.getAttendance()
      .then((response) => setAttendanceWindow({ ...defaultAttendanceWindow, ...response.data.data }))
      .catch((requestError) => setWindowError(getApiErrorMessage(requestError, 'Unable to load attendance time settings.')));
  }, []);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      await authAPI.updateProfile(profile);
      setMessage('Admin profile updated successfully.');
      setError('');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update the admin profile.'));
      setMessage('');
    }
  };

  const saveAttendanceWindow = async (event) => {
    event.preventDefault();
    const times = [attendanceWindow.startTime, attendanceWindow.lateTime, attendanceWindow.absentTime]
      .map((value) => value.split(':').map(Number));
    const minutes = times.map(([hours, minutesValue]) => hours * 60 + minutesValue);
    if (!(minutes[0] < minutes[1] && minutes[1] < minutes[2])) {
      setWindowError('Times must follow: start, late, then absent.');
      setWindowMessage('');
      return;
    }
    try {
      const response = await settingsAPI.updateAttendance(attendanceWindow);
      setAttendanceWindow(response.data.data);
      setWindowMessage('Attendance time settings updated successfully.');
      setWindowError('');
    } catch (requestError) {
      setWindowError(getApiErrorMessage(requestError, 'Unable to update attendance time settings.'));
      setWindowMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-[#071522] text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8"><p className="font-mono-label text-xs text-cyan-300">Administration / controls</p><h1 className="mt-2 text-3xl font-extrabold">Admin Settings</h1><p className="mt-2 text-slate-400">Manage administrator identity and account preferences.</p></div>
        {message && <p className="mb-5 rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p>}
        {error && <p className="mb-5 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
        <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-white/10 bg-[#0d2638]/90">
          <h2 className="flex items-center gap-2 text-lg font-bold"><UserCircle size={18} /> Admin profile</h2>
          <form onSubmit={saveProfile} className="mt-5 space-y-4">
            <Input label="Name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
            <Input label="Phone" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
            <Input label="Department" value={profile.department} onChange={(event) => setProfile({ ...profile, department: event.target.value })} />
            <Button type="submit"><Save size={16} /> Save profile</Button>
          </form>
        </Card>
        <Card className="border border-cyan-300/15 bg-[#0d2638]/90">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Clock3 size={18} /> Attendance time</h2>
          <p className="mt-2 text-sm text-slate-400">Choose when face-verified attendance starts, becomes late, and becomes absent.</p>
          {windowMessage && <p className="mt-4 rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-200">{windowMessage}</p>}
          {windowError && <p className="mt-4 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-200">{windowError}</p>}
          <form onSubmit={saveAttendanceWindow} className="mt-5 space-y-4">
            <Input label="Starting time" type="time" value={attendanceWindow.startTime} onChange={(event) => setAttendanceWindow({ ...attendanceWindow, startTime: event.target.value })} required />
            <Input label="Late after" type="time" value={attendanceWindow.lateTime} onChange={(event) => setAttendanceWindow({ ...attendanceWindow, lateTime: event.target.value })} required />
            <Input label="Absent after" type="time" value={attendanceWindow.absentTime} onChange={(event) => setAttendanceWindow({ ...attendanceWindow, absentTime: event.target.value })} required />
            <Button type="submit"><Save size={16} /> Save attendance time</Button>
          </form>
        </Card>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
