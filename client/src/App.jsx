import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RegisterUserPage from './pages/admin/RegisterUserPage';
import EditUserPage from './pages/admin/EditUserPage';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import MarkAttendancePage from './pages/admin/MarkAttendancePage';
import ReportsPage from './pages/admin/ReportsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import DepartmentsPage from './pages/admin/DepartmentsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AttendanceAIPage from './pages/admin/AttendanceAIPage';
import AttendanceInsightsPage from './pages/admin/AttendanceInsightsPage';
import UserDashboard from './pages/user/UserDashboard';
import UserMarkAttendance from './pages/user/UserMarkAttendance';
import UserAttendanceHistory from './pages/user/UserAttendanceHistory';
import UserProfile from './pages/user/UserProfile';
import UserAI from './pages/user/UserAI';
import RegisterFacePage from './pages/user/RegisterFacePage';

const adminRoute = (element) => (
	<ProtectedRoute requireAdmin>{element}</ProtectedRoute>
);

const studentRoute = (element) => <ProtectedRoute allowedRoles={['STUDENT', 'USER']}>{element}</ProtectedRoute>;
const teacherRoute = (element) => <ProtectedRoute allowedRoles={['TEACHER']}>{element}</ProtectedRoute>;

const App = () => (
	<ThemeProvider>
		<AuthProvider>
			<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<Toaster position="top-right" />
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />

					<Route path="/dashboard" element={adminRoute(<AdminDashboard />)} />
					<Route path="/users" element={adminRoute(<UserManagement />)} />
					<Route path="/users/register" element={adminRoute(<RegisterUserPage />)} />
					<Route path="/users/:id/edit" element={adminRoute(<EditUserPage />)} />
					<Route path="/attendance" element={adminRoute(<AttendanceManagement />)} />
					<Route path="/attendance/mark" element={adminRoute(<MarkAttendancePage />)} />
					<Route path="/reports" element={adminRoute(<ReportsPage />)} />
					<Route path="/analytics" element={adminRoute(<AnalyticsPage />)} />
					<Route path="/departments" element={adminRoute(<DepartmentsPage />)} />
					<Route path="/settings" element={adminRoute(<SettingsPage />)} />
					<Route path="/attendance-ai" element={adminRoute(<AttendanceAIPage />)} />
					<Route path="/attendance-insights" element={adminRoute(<AttendanceInsightsPage />)} />

					<Route path="/user/dashboard" element={studentRoute(<UserDashboard />)} />
					<Route path="/teacher/dashboard" element={teacherRoute(<UserDashboard />)} />
					<Route path="/student/dashboard" element={studentRoute(<UserDashboard />)} />
					<Route path="/user/mark-attendance" element={studentRoute(<UserMarkAttendance />)} />
					<Route path="/user/register-face" element={studentRoute(<RegisterFacePage />)} />
					<Route path="/user/attendance" element={studentRoute(<UserAttendanceHistory />)} />
					<Route path="/user/profile" element={studentRoute(<UserProfile />)} />
					<Route path="/user/ai" element={studentRoute(<UserAI />)} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	</ThemeProvider>
);

export default App;