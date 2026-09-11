import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import FaceCapture from '../../components/FaceCapture';
import { Card } from '../../components/common';
import { attendanceAPI, getApiErrorMessage, userAPI } from '../../services/api';

const MAX_ATTENDANCE_RETRIES = 3;
const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const createSessionId = () => `attendance-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const formatCheckInTime = (value) => value
  ? new Date(`1970-01-01T${value}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  : 'Not available';


const playAttendanceSuccessSound = async () => {
  const audio = new Audio('/assets/attendance-success.mpeg');
  audio.preload = 'auto';
  try {
    await audio.play();
  } catch (audioError) {
    if (import.meta.env.DEV) console.warn('[Attendance] success sound was blocked by the browser', { message: audioError.message });
  }
};

const retryDelay = (requestError, retryCount) => {
  const retryAfter = requestError.response?.headers?.['retry-after'];
  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) return retryAfterSeconds * 1000;
  const retryAfterDate = Date.parse(retryAfter);
  return Number.isFinite(retryAfterDate) && retryAfterDate > Date.now()
    ? retryAfterDate - Date.now()
    : 1000 * (2 ** retryCount);
};

const UserMarkAttendance = () => {
  const navigate = useNavigate();
  const [capture, setCapture] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [phase, setPhase] = useState('detecting');
  const [recognizedStudent, setRecognizedStudent] = useState(null);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const submissionLockRef = useRef(false);
  const sessionIdRef = useRef(createSessionId());
  const frameBufferRef = useRef([]);
  const recognitionStartedRef = useRef(false);

  const markAttendance = async () => {
    if (!capture?.descriptor || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setSubmitting(true);
    setPhase('verifying');
    setError('');
    setMessage('');
    if (import.meta.env.DEV) console.debug('[Attendance] face match captured', { sessionId: sessionIdRef.current, detectionConfidence: capture.detectionConfidence });
    try {
      setPhase('verifying');
      const recognitionResponse = await userAPI.recognizeFace({
        faceDescriptors: capture.descriptors?.length ? capture.descriptors : [capture.descriptor],
      });
      const recognized = recognitionResponse.data.data;
      setRecognizedStudent(recognized.user);
      setPhase('submitting');
      for (let retryCount = 0; retryCount <= MAX_ATTENDANCE_RETRIES; retryCount += 1) {
        try {
          if (import.meta.env.DEV) console.debug('[Attendance] submission start', { sessionId: sessionIdRef.current, retryCount });
          const response = await attendanceAPI.mark({
            faceDescriptor: capture.descriptor,
            faceDescriptors: capture.descriptors,
            detectionConfidence: capture.detectionConfidence,
            detectedFaceCount: capture.detectedFaceCount,
            deviceName: navigator.userAgent,
          }, { headers: { 'X-Attendance-Session-Id': sessionIdRef.current } });
          if (import.meta.env.DEV) console.debug('[Attendance] submission success', { sessionId: sessionIdRef.current, status: response.status, retryCount });
          setAttendanceRecord(response.data.data);
          setRecognizedStudent(response.data.data.user || recognized.user);
          await playAttendanceSuccessSound();
          setPhase('success');
          setMessage('Attendance marked successfully!');
          window.setTimeout(() => navigate('/user/attendance'), 900);
          return;
        } catch (requestError) {
          const status = requestError.response?.status;
          if (import.meta.env.DEV) console.warn('[Attendance] submission response', { sessionId: sessionIdRef.current, status, retryCount });
          if (status !== 429 || retryCount === MAX_ATTENDANCE_RETRIES) throw requestError;
          const delay = retryDelay(requestError, retryCount);
          if (import.meta.env.DEV) console.warn('[Attendance] rate limited; retrying', { sessionId: sessionIdRef.current, retryCount: retryCount + 1, delay });
          await wait(delay);
        }
      }
    } catch (requestError) {
      const duplicate = requestError.response?.status === 409 && requestError.response?.data?.message?.includes('already marked');
      const rateLimited = requestError.response?.status === 429;
      const authFailure = requestError.response?.status === 401
        && ['No authorization token provided', 'Invalid or expired token', 'Invalid token', 'Token expired'].includes(requestError.response?.data?.message);
      setPhase('error');
      setAlreadyMarked(duplicate);
      setError(authFailure ? 'Your session has expired. Please sign in again before marking attendance.' : duplicate ? 'Already Marked Today' : rateLimited ? 'Attendance server is temporarily busy. Please try again in a moment.' : getApiErrorMessage(requestError, 'Attendance could not be marked. Please try again.'));
      console.error('[Attendance] final failure', { sessionId: sessionIdRef.current, status: requestError.response?.status, retryCount: MAX_ATTENDANCE_RETRIES });
      setCapture(null);
      setResetKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (capture?.descriptor && !message && !error && !alreadyMarked && !submitting) void markAttendance();
  }, [capture, message, error, alreadyMarked, submitting]);

  const retry = () => {
    submissionLockRef.current = false;
    sessionIdRef.current = createSessionId();
    setCapture(null);
    frameBufferRef.current = [];
    recognitionStartedRef.current = false;
    setError('');
    setMessage('');
    setAlreadyMarked(false);
    setRecognizedStudent(null);
    setAttendanceRecord(null);
    setPhase('detecting');
    setResetKey((current) => current + 1);
  };

  return (
    <div className="min-h-screen bg-[#071522] text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/user/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-white"><ArrowLeft size={16} /> Back to dashboard</Link>
        <div className="mb-8"><p className="font-mono-label text-xs text-cyan-300">Verification / live check-in</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Mark attendance</h1><p className="mt-2 text-slate-400">Keep your face inside the camera frame for automatic verification.</p></div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.7fr)]">
          <FaceCapture continuous resetKey={resetKey} onCapture={(nextCapture) => { if (!submissionLockRef.current && !recognitionStartedRef.current) { frameBufferRef.current = [...frameBufferRef.current, nextCapture].slice(-5); setPhase(frameBufferRef.current.length < 3 ? 'detecting' : 'verifying'); setAlreadyMarked(false); setError(''); if (frameBufferRef.current.length === 5) { recognitionStartedRef.current = true; setCapture({ ...nextCapture, descriptor: frameBufferRef.current[0].descriptor, descriptors: frameBufferRef.current.map((frame) => frame.descriptor), samples: frameBufferRef.current }); } } }} disabled={submitting || recognitionStartedRef.current || Boolean(message) || alreadyMarked} />
          <Card className="border border-cyan-300/15 bg-[#0d2638]/90">
            <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="text-cyan-300" size={19} /> Secure verification</h2>
            <p className="mt-2 text-sm text-slate-400">Attendance submits automatically after one clear face matches the registered descriptor within the configured face-distance threshold.</p>
            {capture?.image && <img src={capture.image} alt="Captured face" className="mt-5 aspect-video w-full rounded-lg object-cover" />}
            {recognizedStudent && <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">✓ STUDENT RECOGNIZED</p><p className="mt-2 text-sm text-slate-300">Student: <span className="font-bold text-white">{recognizedStudent.name}</span></p><p className="text-sm text-slate-300">Roll Number: <span className="font-semibold text-white">{recognizedStudent.studentId || recognizedStudent.employeeId || 'Not provided'}</span></p><p className="text-sm text-slate-300">Check-in: <span className="font-semibold text-white">{formatCheckInTime(attendanceRecord?.checkInTime)}</span></p><p className="text-sm text-slate-300">Course: <span className="font-semibold text-white">{recognizedStudent.className || recognizedStudent.department || 'Not provided'}</span></p>{attendanceRecord && <p className="mt-2 text-sm font-semibold text-emerald-200">✓ Attendance {attendanceRecord.status}</p>}</div>}
            {capture && !error && !message && <p className="mt-4 rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-200">{phase === 'verifying' ? 'Verifying face...' : phase === 'submitting' ? 'Marking attendance...' : 'Face detected. Verifying identity...'}</p>}
            {error && <div className="mt-4 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-200"><p>{error}</p><button type="button" onClick={retry} className="mt-3 rounded-lg border border-rose-300/40 px-3 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-300/10">Retry verification</button></div>}
            {message && <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-200"><CheckCircle2 size={17} /> {message}</p>}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserMarkAttendance;
