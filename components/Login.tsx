import React, { useState } from 'react';
import { Droplet, Shield, Mail, Loader2, UserPlus, ChevronDown, Lock, LogIn, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { BloodGroup, UserRole } from '../types';
import { signUp, logIn } from '../lib/auth';
import { createUserProfile, getUserProfile } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { logger } from '../lib/logger';

type AuthMode = 'login' | 'signup';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sign-up specific fields
  const [regName, setRegName] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup>('O+');
  const [role, setRole] = useState<UserRole>(UserRole.USER);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const fbUser = await logIn(email, password);

      // Check if profile exists
      const profile = await getUserProfile(fbUser.uid);
      if (profile) {
        navigate('/');
      } else {
        // Edge case: auth exists but no Firestore profile — switch to signup to complete registration
        setMode('signup');
        setError('Please complete your profile registration.');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regName.trim()) {
      setError('Name is required');
      return;
    }
    if (!email) {
      setError('Email is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const fbUser = await signUp(email, password);

      // Create Firestore profile
      await createUserProfile(fbUser.uid, {
        name: regName.trim(),
        phone: '',
        email: email,
        bloodGroup: regBloodGroup,
        role: role,
      });

      setSuccess('Account created! A verification email has been sent to ' + email + '. Please verify your email and then log in.');
      setMode('login');
      setPassword('');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="w-16 h-16 bg-rose-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-rose-200 animate-pulse">
              <Droplet className="text-white" size={30} />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
            BLOOD<span className="text-rose-600">LIFE</span>
          </h1>
          <p className="text-slate-400 font-bold text-[11px] tracking-[0.3em] mt-1">
            KARNATAKA EMERGENCY NETWORK
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-100 p-10 border border-slate-100">
          {/* Tab Switcher */}
          <div className="flex mb-8 bg-slate-100 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-800 shadow-md'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-800 shadow-md'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 mb-6 flex items-start gap-3">
              <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
              <p className="text-xs font-bold">{success}</p>
            </div>
          )}

          {/* ========== LOGIN FORM ========== */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                  <LogIn className="text-blue-600" size={28} />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Welcome Back</h2>
                <p className="text-slate-400 text-xs font-bold mt-1">Log in to your verified account</p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="login-email" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="yourname@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 rounded-2xl pl-12 pr-6 py-4 text-slate-800 font-bold border-2 border-slate-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 rounded-2xl pl-12 pr-14 py-4 text-slate-800 font-bold border-2 border-slate-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[11px] font-black uppercase">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full bg-rose-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" size={18} /> LOGGING IN...</>
                ) : (
                  <><LogIn size={18} /> LOG IN</>
                )}
              </button>
            </form>
          )}

          {/* ========== SIGN UP FORM ========== */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="text-emerald-600" size={28} />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Create Account</h2>
                <p className="text-slate-400 text-xs font-bold mt-1">A verification email will be sent to activate your account</p>
              </div>

              {/* Role Selection */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: UserRole.USER, label: 'Donor' },
                  { value: UserRole.BLOOD_BANK, label: 'Blood Bank' },
                  { value: UserRole.ADMIN, label: 'Admin' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                      role === value
                        ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200'
                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="signup-name" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Full Name *
                </label>
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-6 py-3.5 text-slate-800 font-bold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    placeholder="yourname@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 rounded-2xl pl-12 pr-6 py-3.5 text-slate-800 font-bold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="signup-password" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Password * (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 rounded-2xl pl-12 pr-14 py-3.5 text-slate-800 font-bold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Blood Group */}
              <div>
                <label htmlFor="signup-blood-group" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Blood Group *
                </label>
                <div className="relative">
                  <select
                    id="signup-blood-group"
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value as BloodGroup)}
                    className="w-full bg-slate-50 rounded-2xl px-6 py-3.5 text-slate-800 font-bold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all appearance-none"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[11px] font-black uppercase">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !regName.trim() || !email || password.length < 6}
                className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" size={18} /> CREATING ACCOUNT...</>
                ) : (
                  <><Shield size={18} /> SIGN UP &amp; VERIFY EMAIL</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-300 text-[10px] font-bold mt-8 tracking-widest uppercase">
          Secured by Firebase Authentication
        </p>
      </div>
    </div>
  );
};

export default Login;
