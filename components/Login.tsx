import React, { useState, useEffect } from 'react';
import { Droplet, Shield, Phone, Loader2, UserPlus, ChevronDown } from 'lucide-react';
import { BloodGroup, UserRole } from '../types';
import { initRecaptcha, sendOtp, verifyOtp } from '../lib/auth';
import { createUserProfile, getUserProfile } from '../services/firestoreService';
import OtpVerification from './OtpVerification';
import { useNavigate } from 'react-router-dom';
import { logger } from '../lib/logger';

type LoginStep = 'phone' | 'otp' | 'register';

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const Login: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<LoginStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Registration fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup>('O+');

  // Initialize reCAPTCHA on mount
  useEffect(() => {
    initRecaptcha('recaptcha-container');
  }, []);

  // Format phone number to E.164
  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
    if (cleaned.length === 10) return `+91${cleaned}`;
    if (phone.startsWith('+')) return phone;
    return `+91${cleaned}`;
  };

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    setError('');
    const formatted = formatPhone(phoneNumber);

    if (formatted.length < 13) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(formatted);
      setPhoneNumber(formatted);
      setStep('otp');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (code: string) => {
    setError('');
    setIsLoading(true);
    try {
      const fbUser = await verifyOtp(code);

      // Check if user profile exists in Firestore
      const profile = await getUserProfile(fbUser.uid);
      if (profile) {
        // Existing user → go to dashboard
        navigate('/');
      } else {
        // New user → show registration form
        setStep('register');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2b: Resend OTP
  const handleResendOtp = async () => {
    setError('');
    try {
      await sendOtp(phoneNumber);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to resend OTP');
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
      // Get current Firebase user (should be authenticated after OTP)
      const { auth } = await import('../lib/firebase');
      const fbUser = auth.currentUser;
      if (!fbUser) {
        setError('Authentication expired. Please start over.');
        setStep('phone');
        return;
      }

      await createUserProfile(fbUser.uid, {
        name: regName.trim(),
        phone: phoneNumber,
        email: regEmail.trim() || undefined,
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
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="w-16 h-16 bg-rose-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-rose-200 animate-pulse-gentle">
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
          {/* Step 1: Phone Number */}
          {step === 'phone' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Phone className="text-blue-600" size={36} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sign In</h2>
                <p className="text-slate-400 text-sm font-bold mt-2">Enter your phone number to receive an OTP</p>
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

              {/* Phone Input */}
              <div>
                <label htmlFor="phone-input" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                  Phone Number
                </label>
                <div className="flex gap-3">
                  <div className="bg-slate-50 rounded-2xl px-4 py-4 text-slate-600 font-black text-sm border-2 border-slate-100 flex items-center">
                    +91
                  </div>
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="9876 543 210"
                    value={phoneNumber.replace('+91', '')}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    className="flex-1 bg-slate-50 rounded-2xl px-6 py-4 text-slate-800 font-bold text-lg border-2 border-slate-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all tracking-wider"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[11px] font-black uppercase">{error}</p>
                </div>
              )}

              {/* Send OTP Button */}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading || phoneNumber.replace(/\D/g, '').length < 10}
                className="w-full bg-rose-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all shadow-xl shadow-rose-200 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} /> SENDING...
                  </>
                ) : (
                  <>
                    <Shield size={18} /> SEND OTP
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <OtpVerification
              phoneNumber={phoneNumber}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => { setStep('phone'); setError(''); }}
              isVerifying={isLoading}
              error={error}
            />
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

              {/* Email (optional) */}
              <div>
                <label htmlFor="reg-email" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Email (optional)
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
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
