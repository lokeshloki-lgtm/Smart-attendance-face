import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button, Input, Card } from '../../components/common';
import { getHomeRoute, useAuth } from '../../context/AuthContext';
import { showError, showSuccess } from '../../utils/toast';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserCheck, ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomeRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data) => {
    try {
      const res = await login(data.email.trim(), data.password);
      const userRole = res?.data?.user?.role;
      showSuccess(`Welcome back, ${res?.data?.user?.name || 'User'}!`);
      navigate(getHomeRoute(userRole), { replace: true });
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.data?.retryAfterSeconds;
        showError(`Too many attempts. Try again in ${Math.max(1, Math.ceil((retryAfter || 60) / 60))} minute(s).`);
        return;
      }
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? 'Invalid email or password'
          : 'Login failed. Please try again.');
      showError(msg);
    }
  };

  const handleQuickFill = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <Card className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex aspect-square w-24 max-w-full items-center justify-center overflow-hidden rounded-2xl">
              <img src="/smartattend-logo.svg" alt="SmartAttend" className="block h-full w-full max-h-full max-w-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In to SmartAttend</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Enter your credentials to access your portal
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="name@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Please enter a valid email address',
                },
              })}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full mt-2"
              size="md"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo quick-fill credentials */}
          <div className="mt-6 rounded-xl border border-indigo-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-slate-800/60 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 mb-2">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@smartattend.com', 'Admin@123456')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 transition"
              >
                <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-400" />
                Fill Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('john@example.com', 'User@123456')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 transition"
              >
                <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                Fill User
              </button>
            </div>
            <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 space-y-0.5">
              <p>• Admin: admin@smartattend.com (Pass: Admin@123456)</p>
              <p>• User: john@example.com (Pass: User@123456)</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
