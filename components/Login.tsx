import React, { useState, useEffect } from 'react';
import { Droplet, Shield, Mail, Loader2, UserPlus, ChevronDown, CheckCircle, ArrowLeft } from 'lucide-react';
import { BloodGroup, UserRole } from '../types';
import { sendSignInLink, completeSignIn, isEmailSignInLink } from '../lib/auth';
import { createUserProfile, getUserProfile } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { logger } from '../lib/logger';

type LoginStep = 'email' | 'check-email' | 'register';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Login: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup>('O+');

  // Check if user arrived via email sign-in link
  useEffect(() => {
    const checkEmailLink = async () => {
      const url = window.location.href;
      if (isEmailSignInLink(url)) {
        setIsLoading(true);
        setError('');
        try {
          const fbUser = await completeSignIn(url);
          if (fbUser) {
            // Check if profile exists
            const profile = await getUserProfile(fbUser.uid);
            if (profile) {
              navigate('/');
            } else {
              setEmail(fbUser.email || '');
              setStep('register');
            }
          }
        } catch (err: unknown) {
          setError((err as Error).message || 'Sign-in failed');
          setStep('email');
        } finally {
          setIsLoading(false);
        }
      }
    };
    checkEmailLink();
  }, [navigate]);

  // Validate email
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // Step 1: Send sign-in link
  const handleSendLink = async () => {
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await sendSignInLink(email);
      setStep('check-email');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Complete registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim()) {
      setError('Name is required');
      return;
    }

    setIsLoading(true);
    try {
      const { auth } = await import('../lib/firebase');
      const fbUser = auth.currentUser;
      if (!fbUser) {
        setError('Authentication expired. Please start over.');
        setStep('email');
        return;
      }

      await createUserProfile(fbUser.uid, {
        name: regName.trim(),
        phone: '',
        email: email || fbUser.email || '',
        bloodGroup: regBloodGroup,
        role: role,
      });

      navigate('/');
    } catch (err: unknown) {
      logger.error('Registration failed:', err);
      setError('Registration failed. Please try again.');
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
          {/* Step 1: Email Input */}
          {step === 'email' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Mail className="text-blue-600" size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sign In</h2>
                <p className="text-slate-400 text-sm font-bold mt-2">Enter your email to receive a sign-in link</p>
              </div>

              {/* Role Selection */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: UserRole.USER, label: 'Donor' },
                  { value: UserRole.BLOOD_BANK, label: 'Blood Bank' },
                  { value: UserRole.ADMIN, label: 'Admin' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`py-3 px-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 ${
                      role === value
                        ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200'
                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email-input" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                  Email Address
                </label>
                <input
                  id="email-input"
                  type="email"
                  autoComplete="email"
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendLink()}
                  className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-slate-800 font-bold text-lg border-2 border-slate-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[11px] font-black uppercase">{error}</p>
                </div>
              )}

              {/* Send Link Button */}
              <button
                type="button"
                onClick={handleSendLink}
                disabled={isLoading || !isValidEmail(email)}
                className="w-full bg-rose-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> SENDING...
                  </>
                ) : (
                  <>
                    <Shield size={18} /> SEND SIGN-IN LINK
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Check Email */}
          {step === 'check-email' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-emerald-600" size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Check Your Email</h2>
                <p className="text-slate-400 text-sm font-bold mt-2">
                  We sent a sign-in link to
                </p>
                <p className="text-slate-700 font-black text-lg mt-1">{email}</p>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-3">
                <p className="text-blue-700 text-sm font-bold">📩 Open the email and click the sign-in link</p>
                <p className="text-blue-600 text-xs font-medium">The link will bring you back here and sign you in automatically. Check your spam folder if you don't see it.</p>
              </div>

              {/* Resend */}
              <button
                type="button"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    await sendSignInLink(email);
                    setError('');
                  } catch (err: unknown) {
                    setError((err as Error).message);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                RESEND LINK
              </button>

              {/* Back */}
              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); }}
                className="w-full flex items-center justify-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                <ArrowLeft size={14} /> Use Different Email
              </button>

              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[11px] font-black uppercase">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Registration (new user) */}
          {step === 'register' && (
            <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="text-emerald-600" size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Complete Profile</h2>
                <p className="text-slate-400 text-sm font-bold mt-2">Almost there! Fill in your details</p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="reg-name" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Full Name *
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-slate-800 font-bold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all"
                />
              </div>

              {/* Blood Group */}
              <div>
                <label htmlFor="reg-blood-group" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Blood Group *
                </label>
                <div className="relative">
                  <select
                    id="reg-blood-group"
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value as BloodGroup)}
                    className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-slate-800 font-bold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all appearance-none"
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
                disabled={isLoading || !regName.trim()}
                className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> CREATING PROFILE...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> CREATE ACCOUNT
                  </>
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
