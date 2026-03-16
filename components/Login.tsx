import React, { useState } from 'react';
import { Droplet, ShieldCheck, Mail, Loader2, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, UserPlus } from 'lucide-react';
import { BloodGroup, UserRole } from '../types';
import { signUp, logIn } from '../lib/auth';
import { createUserProfile, getUserProfile } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { logger } from '../lib/logger';

type View = 'login' | 'register' | 'verify-email';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup>('O+');
  const [regPhone, setRegPhone] = useState('');

  const clearError = () => setError('');

  // ========== LOGIN ==========
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email || !password) { setError('Please fill in all fields'); return; }

    setIsLoading(true);
    try {
      const fbUser = await logIn(email, password);
      const profile = await getUserProfile(fbUser.uid);
      if (profile) {
        navigate('/');
      } else {
        setView('register');
        setError('Complete your profile to continue.');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== SIGN UP ==========
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!regName.trim()) { setError('Name is required'); return; }
    if (!email) { setError('Email is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setIsLoading(true);
    try {
      const fbUser = await signUp(email, password);

      await createUserProfile(fbUser.uid, {
        name: regName.trim(),
        phone: regPhone.trim(),
        email: email,
        bloodGroup: regBloodGroup,
        role: role,
      });

      // Show verification screen
      setView('verify-email');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-700 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-200 mx-auto">
              <Droplet className="text-white" size={38} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-rose-100">
              <ShieldCheck className="text-rose-500" size={16} />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">
            <span className="text-slate-800">BloodLife</span>
            <span className="text-rose-600"> KA</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.4em] mt-1 uppercase">
            Bengaluru Emergency Portal
          </p>
        </div>

        {/* ========== LOGIN VIEW ========== */}
        {view === 'login' && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 p-10 border border-slate-100">
            {/* Role Tabs */}
            <div className="flex bg-slate-50 rounded-2xl p-1.5 mb-8 border border-slate-100">
              {[
                { value: UserRole.USER, label: 'USER' },
                { value: UserRole.BLOOD_BANK, label: 'BLOOD_BANK' },
                { value: UserRole.ADMIN, label: 'ADMIN' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setRole(value); clearError(); }}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    role === value
                      ? 'bg-white text-slate-800 shadow-md'
                      : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">
                  Account Identifier
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="email@address.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-4 text-slate-800 font-semibold border-2 border-slate-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">
                  Encrypted Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 rounded-2xl px-5 pr-14 py-4 text-slate-800 font-semibold border-2 border-slate-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[10px] font-black uppercase">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] hover:from-rose-600 hover:to-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-xl shadow-rose-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" size={16} /> AUTHENTICATING...</>
                ) : (
                  'INITIALIZE ACCESS'
                )}
              </button>
            </form>

            {/* Create Account Link */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setView('register'); clearError(); }}
                className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] hover:text-rose-700 transition-colors"
              >
                New to BloodLife? Create Account
              </button>
            </div>
          </div>
        )}

        {/* ========== REGISTER VIEW ========== */}
        {view === 'register' && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 p-10 border border-slate-100">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => { setView('login'); clearError(); }}
              className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 mb-6"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-3">
                <UserPlus className="text-emerald-600" size={28} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Create Account</h2>
              <p className="text-slate-400 text-[11px] font-bold mt-1">A verification email will be sent for OTP confirmation</p>
            </div>

            {/* Role Selection */}
            <div className="flex bg-slate-50 rounded-2xl p-1.5 mb-6 border border-slate-100">
              {[
                { value: UserRole.USER, label: 'USER' },
                { value: UserRole.BLOOD_BANK, label: 'BLOOD_BANK' },
                { value: UserRole.ADMIN, label: 'ADMIN' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    role === value
                      ? 'bg-white text-slate-800 shadow-md'
                      : 'text-slate-400 hover:text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor="reg-name" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">
                  Legal Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">
                  Email Address (OTP will be sent here)
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="email@address.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="reg-phone" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">
                  Phone Number *
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 9876543210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">
                  Create Password (min 6 chars)
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 rounded-2xl px-5 pr-14 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Blood Group */}
              <div>
                <label htmlFor="reg-blood" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">
                  Blood Classification
                </label>
                <select
                  id="reg-blood"
                  value={regBloodGroup}
                  onChange={(e) => setRegBloodGroup(e.target.value as BloodGroup)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all appearance-none"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[10px] font-black uppercase">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !regName.trim() || !email || !regPhone.trim() || password.length < 6}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" size={16} /> CREATING...</>
                ) : (
                  'CREATE ACCOUNT & SEND OTP'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========== VERIFY EMAIL VIEW ========== */}
        {view === 'verify-email' && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 p-10 border border-slate-100 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Mail className="text-emerald-600" size={36} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Verify Your Email</h2>
            <p className="text-slate-400 text-sm font-bold mb-2">We sent a verification link to</p>
            <p className="text-slate-800 font-black text-lg mb-6">{email}</p>

            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-6 text-left space-y-2">
              <p className="text-blue-700 text-sm font-bold">📩 Steps to complete:</p>
              <ol className="text-blue-600 text-xs font-medium space-y-1 list-decimal pl-4">
                <li>Open your email inbox</li>
                <li>Find the email from <strong>noreply@blood-bank-ad3a9.firebaseapp.com</strong></li>
                <li>Click the verification link in the email</li>
                <li>Come back here and log in with your credentials</li>
              </ol>
              <p className="text-blue-500 text-[10px] font-bold mt-2">💡 Check your spam/junk folder if you don't see it</p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-6">
              <CheckCircle className="text-emerald-600 flex-shrink-0" size={20} />
              <p className="text-emerald-700 text-xs font-bold text-left">
                Account created! You must verify your email before you can log in.
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setView('login'); setPassword(''); clearError(); }}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.25em] hover:from-rose-600 hover:to-rose-700 transition-all shadow-xl shadow-rose-200 active:scale-[0.98]"
            >
              GO TO LOGIN
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
