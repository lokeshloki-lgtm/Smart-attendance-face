import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import FaceCapture from '../../components/FaceCapture';
import { Card } from '../../components/common';
import { attendanceAPI, getApiErrorMessage, userAPI } from '../../services/api';

const MarkAttendancePage = () => {
  const [capture, setCapture] = useState(null);
  const [status, setStatus] = useState({ message: '', error: '' });
  const [submitting, setSubmitting] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [phase, setPhase] = useState('detecting');
  const [recognizedStudent, setRecognizedStudent] = useState(null);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const verificationLockRef = useRef(false);

  const markAttendance = async () => {
    if (!capture?.descriptor || verificationLockRef.current) return;
    verificationLockRef.current = true;
    setSubmitting(true);
    setStatus({ message: '', error: '' });
    try {
      setPhase('verifying');
      const recognitionResponse = await userAPI.recognizeFace({
        faceDescriptors: capture.descriptors?.length ? capture.descriptors : [capture.descriptor],
      });
      const recognized = recognitionResponse.data.data;
      setRecognizedStudent({ ...recognized.user, confidence: recognized.confidence });
      setPhase('submitting');
      const response = await attendanceAPI.mark({
        faceDescriptor: capture.descriptor,
        detectionConfidence: capture.detectionConfidence,
        detectedFaceCount: capture.detectedFaceCount,
      });
      setAttendanceRecord(response.data.data);
      setStatus({ message: response.data.message || 'Attendance marked successfully.', error: '' });
    } catch (requestError) {
      setAlreadyMarked(requestError.response?.status === 409);
      setStatus({ message: '', error: getApiErrorMessage(requestError, 'Attendance could not be marked.') });
      setCapture(null);
      setResetKey((current) => current + 1);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (capture?.descriptor && !submitting && !status.message && !status.error && !alreadyMarked) void markAttendance();
  }, [capture, submitting, status.message, status.error, alreadyMarked]);

  const retry = () => {
    verificationLockRef.current = false;
    setCapture(null);
    setStatus({ message: '', error: '' });
    setAlreadyMarked(false);
    setRecognizedStudent(null);
    setAttendanceRecord(null);
    setPhase('detecting');
    setResetKey((current) => current + 1);
  };

  return <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-100"><Navbar /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><Link to="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline dark:text-indigo-400"><ArrowLeft size={16} /> Back to dashboard</Link><h1 className="text-3xl font-bold">Attendance kiosk</h1><p className="mt-2 text-gray-600 dark:text-gray-400">Recognize an enrolled member and record today&apos;s attendance.</p><div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.7fr)]"><FaceCapture resetKey={resetKey} onCapture={(nextCapture) => { if (!verificationLockRef.current) { setCapture(nextCapture); setAlreadyMarked(false); setStatus({ message: '', error: '' }); } }} disabled={submitting || Boolean(status.message) || alreadyMarked} /><Card><h2 className="text-lg font-bold">Mark recognized member</h2><p className="mt-2 text-sm text-gray-500">The server verifies the face before creating today&apos;s attendance record.</p>{capture?.image && <img src={capture.image} alt="Captured face" className="mt-5 aspect-video w-full rounded-lg object-cover" />}{recognizedStudent && <div className="mt-5 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-indigo-950"><p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Student recognized</p><p className="mt-2 text-lg font-bold">{recognizedStudent.name}</p><p className="text-sm">Student ID: {recognizedStudent.studentId || recognizedStudent.employeeId || 'Not provided'}</p><p className="text-sm">{recognizedStudent.department || 'Department not provided'}</p><p className="mt-2 text-sm font-semibold">Recognition confidence: {Number(recognizedStudent.confidence || 0).toFixed(1)}%</p>{attendanceRecord && <p className="mt-2 text-sm font-semibold text-emerald-700">Attendance: {attendanceRecord.status} at {attendanceRecord.checkInTime || attendanceRecord.time}</p>}</div>}{capture && !status.error && !status.message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{phase === 'submitting' ? 'Marking attendance...' : 'Recognizing face...'}</p>}{status.error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p>{status.error}</p><button type="button" onClick={retry} className="mt-3 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold hover:bg-red-100">Retry verification</button></div>}{status.message && <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 size={17} /> {status.message}</p>}</Card></div></main></div>;
};

export default MarkAttendancePage;
