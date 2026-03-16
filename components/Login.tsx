import React, { useState } from 'react';
import { Droplet, ShieldCheck, Mail, Loader2, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, UserPlus, FileText, Upload, Building2, MapPin } from 'lucide-react';
import { BloodGroup, UserRole } from '../types';
import { signUp, logIn } from '../lib/auth';
import { createUserProfile, getUserProfile } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { logger } from '../lib/logger';

type View = 'login' | 'register-donor' | 'register-bank' | 'verify-email';

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

  // Donor registration fields
  const [regName, setRegName] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup>('O+');
  const [regPhone, setRegPhone] = useState('');
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [medCertFile, setMedCertFile] = useState<File | null>(null);

  // Blood Bank registration fields
  const [bankName, setBankName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [bankContact, setBankContact] = useState('');
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [accreditationFile, setAccreditationFile] = useState<File | null>(null);

  const clearError = () => setError('');

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

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
        setView('register-donor');
        setError('Complete your profile to continue.');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== DONOR SIGN UP ==========
  const handleDonorSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!regName.trim()) { setError('Name is required'); return; }
    if (!email) { setError('Email is required'); return; }
    if (!regPhone.trim()) { setError('Phone number is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!idProofFile) { setError('ID Proof is required'); return; }
    if (!medCertFile) { setError('Medical Certificate is required'); return; }

    setIsLoading(true);
    try {
      let idProofData = '';
      let medCertData = '';
      if (idProofFile) idProofData = await fileToBase64(idProofFile);
      if (medCertFile) medCertData = await fileToBase64(medCertFile);

      const fbUser = await signUp(email, password);

      await createUserProfile(fbUser.uid, {
        name: regName.trim(),
        phone: regPhone.trim(),
        email: email,
        bloodGroup: regBloodGroup,
        role: UserRole.USER,
        documents: [
          {
            id: `id_${Date.now()}`,
            type: 'ID_PROOF' as const,
            name: idProofFile.name,
            status: 'PENDING' as const,
            uploadDate: new Date().toISOString(),
            data: idProofData,
          },
          {
            id: `med_${Date.now() + 1}`,
            type: 'CERTIFICATE' as const,
            name: medCertFile.name,
            status: 'PENDING' as const,
            uploadDate: new Date().toISOString(),
            data: medCertData,
          },
        ],
      });

      setView('verify-email');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== BLOOD BANK SIGN UP ==========
  const handleBankSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!bankName.trim()) { setError('Blood Bank name is required'); return; }
    if (!email) { setError('Email is required'); return; }
    if (!bankContact.trim()) { setError('Contact number is required'); return; }
    if (!licenseNumber.trim()) { setError('License number is required'); return; }
    if (!bankAddress.trim()) { setError('Address is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!licenseFile) { setError('Blood Bank License is required'); return; }
    if (!accreditationFile) { setError('NABL/NABH Accreditation is required'); return; }

    setIsLoading(true);
    try {
      let licenseData = '';
      let accreditationData = '';
      if (licenseFile) licenseData = await fileToBase64(licenseFile);
      if (accreditationFile) accreditationData = await fileToBase64(accreditationFile);

      const fbUser = await signUp(email, password);

      await createUserProfile(fbUser.uid, {
        name: bankName.trim(),
        phone: bankContact.trim(),
        email: email,
        bloodGroup: 'O+',
        role: UserRole.BLOOD_BANK,
        location: { lat: 12.9716, lng: 77.5946, address: bankAddress.trim() },
        licenseNumber: licenseNumber.trim(),
        documents: [
          {
            id: `lic_${Date.now()}`,
            type: 'CERTIFICATE' as const,
            name: licenseFile.name,
            status: 'PENDING' as const,
            uploadDate: new Date().toISOString(),
            data: licenseData,
          },
          {
            id: `acc_${Date.now() + 1}`,
            type: 'CERTIFICATE' as const,
            name: accreditationFile.name,
            status: 'PENDING' as const,
            uploadDate: new Date().toISOString(),
            data: accreditationData,
          },
        ],
      });

      setView('verify-email');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== FILE UPLOAD COMPONENT ==========
  const FileUploadBox: React.FC<{
    id: string;
    label: string;
    hint: string;
    file: File | null;
    onFileChange: (f: File | null) => void;
  }> = ({ id, label, hint, file, onFileChange }) => (
    <div>
      <label htmlFor={id} className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">
        {label}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer hover:border-emerald-400 ${
          file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50'
        }`}
        onClick={() => document.getElementById(id)?.click()}
      >
        <input
          id={id}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-xl">
              <FileText size={18} />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-black text-emerald-700 truncate">{file.name}</p>
              <p className="text-[10px] text-emerald-500 font-bold">{(file.size / 1024).toFixed(1)} KB • Ready</p>
            </div>
            <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
          </div>
        ) : (
          <div className="py-2">
            <Upload className="mx-auto text-slate-300 mb-2" size={24} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{hint}</p>
            <p className="text-[9px] text-slate-300 mt-1">JPG, PNG, PDF up to 5MB</p>
          </div>
        )}
      </div>
    </div>
  );

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
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[10px] font-black uppercase">{error}</p>
                </div>
              )}

              <button type="submit" disabled={isLoading || !email || !password}
                className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.25em] hover:from-rose-600 hover:to-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-xl shadow-rose-200 active:scale-[0.98]">
                {isLoading ? <><Loader2 className="animate-spin" size={16} /> AUTHENTICATING...</> : 'INITIALIZE ACCESS'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button type="button" onClick={() => { setView('register-donor'); clearError(); }}
                className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] hover:text-rose-700 transition-colors">
                New to BloodLife? Create Account
              </button>
            </div>
          </div>
        )}

        {/* ========== DONOR REGISTER ========== */}
        {view === 'register-donor' && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 p-10 border border-slate-100">
            <button type="button" onClick={() => { setView('login'); clearError(); }}
              className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 mb-6">
              <ArrowLeft size={14} /> Back to Login
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-3">
                <UserPlus className="text-emerald-600" size={28} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Donor Registration</h2>
              <p className="text-slate-400 text-[11px] font-bold mt-1">Register as a blood donor</p>
            </div>

            {/* Switch to Blood Bank */}
            <div className="text-center mb-5">
              <button type="button" onClick={() => { setView('register-bank'); clearError(); }}
                className="text-[10px] font-black text-blue-500 uppercase tracking-[0.15em] hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                🏥 Register as Blood Bank instead?
              </button>
            </div>

            <form onSubmit={handleDonorSignUp} className="space-y-4">
              <div>
                <label htmlFor="d-name" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Full Name</label>
                <input id="d-name" type="text" autoComplete="name" placeholder="Your full name" value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label htmlFor="d-email" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Email Address</label>
                <input id="d-email" type="email" autoComplete="email" placeholder="email@address.in" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label htmlFor="d-phone" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Phone Number</label>
                <input id="d-phone" type="tel" autoComplete="tel" placeholder="+91 9876543210" value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label htmlFor="d-pass" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Password (min 6 chars)</label>
                <div className="relative">
                  <input id="d-pass" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 rounded-2xl px-5 pr-14 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all placeholder:text-slate-300" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500" aria-label="Toggle password">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="d-blood" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Blood Group</label>
                <select id="d-blood" value={regBloodGroup} onChange={(e) => setRegBloodGroup(e.target.value as BloodGroup)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 outline-none transition-all appearance-none">
                  {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>

              <FileUploadBox id="id-proof" label="Government ID Proof *" hint="Upload Aadhaar / PAN / Voter ID" file={idProofFile} onFileChange={setIdProofFile} />
              <FileUploadBox id="med-cert" label="Medical Fitness Certificate *" hint="Upload Medical Certificate" file={medCertFile} onFileChange={setMedCertFile} />

              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[10px] font-black uppercase">{error}</p>
                </div>
              )}

              <button type="submit" disabled={isLoading || !regName.trim() || !email || !regPhone.trim() || password.length < 6 || !idProofFile || !medCertFile}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.25em] hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98]">
                {isLoading ? <><Loader2 className="animate-spin" size={16} /> REGISTERING...</> : 'REGISTER AS DONOR'}
              </button>
            </form>
          </div>
        )}

        {/* ========== BLOOD BANK REGISTER ========== */}
        {view === 'register-bank' && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 p-10 border border-slate-100">
            <button type="button" onClick={() => { setView('login'); clearError(); }}
              className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 mb-6">
              <ArrowLeft size={14} /> Back to Login
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-3">
                <Building2 className="text-blue-600" size={28} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Blood Bank Registration</h2>
              <p className="text-slate-400 text-[11px] font-bold mt-1">Register your blood bank facility</p>
            </div>

            {/* Switch to Donor */}
            <div className="text-center mb-5">
              <button type="button" onClick={() => { setView('register-donor'); clearError(); }}
                className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.15em] hover:text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                🩸 Register as Donor instead?
              </button>
            </div>

            <form onSubmit={handleBankSignUp} className="space-y-4">
              <div>
                <label htmlFor="b-name" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Blood Bank Name</label>
                <input id="b-name" type="text" placeholder="e.g., Narayana Blood Centre" value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label htmlFor="b-license" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">License Number</label>
                <input id="b-license" type="text" placeholder="SLAB-XXXX-XXXX" value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label htmlFor="b-address" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">
                  <span className="flex items-center gap-1"><MapPin size={10} /> Facility Address</span>
                </label>
                <input id="b-address" type="text" placeholder="Full address, Bengaluru" value={bankAddress}
                  onChange={(e) => setBankAddress(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label htmlFor="b-email" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Official Email</label>
                <input id="b-email" type="email" autoComplete="email" placeholder="admin@bloodbank.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label htmlFor="b-contact" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Contact Number</label>
                <input id="b-contact" type="tel" autoComplete="tel" placeholder="+91 80 XXXX XXXX" value={bankContact}
                  onChange={(e) => setBankContact(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl px-5 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-slate-300" />
              </div>

              <div>
                <label htmlFor="b-pass" className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2 block">Password (min 6 chars)</label>
                <div className="relative">
                  <input id="b-pass" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 rounded-2xl px-5 pr-14 py-3.5 text-slate-800 font-semibold border-2 border-slate-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 outline-none transition-all placeholder:text-slate-300" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500" aria-label="Toggle password">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <FileUploadBox id="bank-license" label="Blood Bank License *" hint="Upload CDSCO / State Drug License" file={licenseFile} onFileChange={setLicenseFile} />
              <FileUploadBox id="bank-accreditation" label="NABL / NABH Accreditation *" hint="Upload Accreditation Certificate" file={accreditationFile} onFileChange={setAccreditationFile} />

              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl border border-rose-100 text-center">
                  <p className="text-[10px] font-black uppercase">{error}</p>
                </div>
              )}

              <button type="submit"
                disabled={isLoading || !bankName.trim() || !email || !bankContact.trim() || !licenseNumber.trim() || !bankAddress.trim() || password.length < 6 || !licenseFile || !accreditationFile}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.25em] hover:from-blue-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-200 active:scale-[0.98]">
                {isLoading ? <><Loader2 className="animate-spin" size={16} /> REGISTERING...</> : 'REGISTER BLOOD BANK'}
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
                <li>Open your email inbox (check spam too)</li>
                <li>Find the email from Firebase</li>
                <li>Click the verification link</li>
                <li>Come back here and log in</li>
              </ol>
            </div>

            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-6">
              <CheckCircle className="text-emerald-600 flex-shrink-0" size={20} />
              <p className="text-emerald-700 text-xs font-bold text-left">
                Account created! Documents uploaded for verification. Verify your email to log in.
              </p>
            </div>

            <button type="button" onClick={() => { setView('login'); setPassword(''); clearError(); }}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.25em] hover:from-rose-600 hover:to-rose-700 transition-all shadow-xl shadow-rose-200 active:scale-[0.98]">
              GO TO LOGIN
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
