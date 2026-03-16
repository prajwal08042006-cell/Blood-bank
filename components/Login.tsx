
import React, { useState, useRef } from 'react';
import { 
  Droplets, Hospital, ShieldCheck, FileText, Check, 
  Loader2, X, Search, ShieldAlert, Fingerprint, Trash2, 
  CheckCircle2, Wand2, Building2
} from 'lucide-react';
import { useAuth } from '../App';
import { UserRole, BloodGroup, UserDocument } from '../types';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [error, setError] = useState('');
  
  // Advanced Document Upload State Management
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [uploadingState, setUploadingState] = useState<Record<string, {
    progress: number;
    phase: 'IDLE' | 'UPLOADING' | 'SCANNING' | 'VERIFYING';
    error?: string;
  }>>({
    'ID_PROOF': { progress: 0, phase: 'IDLE' },
    'MEDICAL_REPORT': { progress: 0, phase: 'IDLE' }
  });
  
  const idProofInputRef = useRef<HTMLInputElement>(null);
  const medicalReportInputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = (type: 'ID_PROOF' | 'MEDICAL_REPORT', file: File) => {
    setUploadingState(prev => ({ ...prev, [type]: { progress: 0, phase: 'UPLOADING' } }));

    // Phase 1: Uploading (0-100%)
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        
        // Phase 2: AI Scanning & Threat Check
        setUploadingState(prev => ({ ...prev, [type]: { progress: 100, phase: 'SCANNING' } }));
        
        setTimeout(() => {
          // Phase 3: Integrity Verification
          setUploadingState(prev => ({ ...prev, [type]: { progress: 100, phase: 'VERIFYING' } }));
          
          setTimeout(() => {
            // Check for mock "rejected" case (e.g., file too small or specific name)
            const isRejected = file.name.toLowerCase().includes('fake') || file.size < 1000;
            
            if (isRejected) {
              setUploadingState(prev => ({ 
                ...prev, 
                [type]: { progress: 0, phase: 'IDLE', error: 'Document rejected: Image clarity too low.' } 
              }));
              return;
            }

            const newDoc: UserDocument = {
              id: `${type}-${Date.now()}`,
              type: type === 'ID_PROOF' ? 'ID_PROOF' : 'MEDICAL_REPORT',
              name: file.name,
              status: 'PENDING',
              uploadDate: new Date().toISOString()
            };
            
            setDocuments(prev => [...prev.filter(d => d.type !== type), newDoc]);
            setUploadingState(prev => ({ ...prev, [type]: { progress: 0, phase: 'IDLE' } }));
          }, 1500);
        }, 1200);
      }
      setUploadingState(prev => ({ ...prev, [type]: { ...prev[type], progress } }));
    }, 200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ID_PROOF' | 'MEDICAL_REPORT') => {
    const file = e.target.files?.[0];
    if (file) simulateUpload(type, file);
  };

  const removeDocument = (type: string) => {
    setDocuments(prev => prev.filter(d => d.type !== type));
    if (type === 'ID_PROOF' && idProofInputRef.current) idProofInputRef.current.value = '';
    if (type === 'MEDICAL_REPORT' && medicalReportInputRef.current) medicalReportInputRef.current.value = '';
  };

  const simulateApproval = (type: string) => {
    setDocuments(prev => prev.map(d => 
      d.type === type ? { ...d, status: 'VERIFIED' } : d
    ));
  };

  const simulateAllApprovals = () => {
    setDocuments(prev => prev.map(d => ({ ...d, status: 'VERIFIED' })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (step === 1) {
        if (!name || !userId || !password) return setError('Identity fields are required.');
        setStep(2);
      } else {
        const hasId = documents.some(d => d.type === 'ID_PROOF');
        const isProcessing = Object.values(uploadingState).some((s: any) => s.phase !== 'IDLE');

        if (isProcessing) return setError('Please wait for document processing to finish.');
        if (!hasId) return setError(`A valid ${role === UserRole.BLOOD_BANK ? 'License' : 'ID Proof'} is mandatory.`);
        
        register({ name, email: userId, bloodGroup, role, documents, donationHistory: [], impactScore: 0, isAvailable: true });
        
        // Redirect based on role
        if (role === UserRole.BLOOD_BANK) {
           navigate('/inventory');
        } else {
           navigate('/history');
        }
      }
    } else {
      const success = login(userId, password, role);
      if (success) {
        if (role === UserRole.BLOOD_BANK) navigate('/inventory');
        else if (role === UserRole.ADMIN) navigate('/admin');
        else navigate('/map');
      }
      else setError('Invalid credentials. Access denied by State Security.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-rose-500 rounded-full blur-[200px]"></div>
      </div>

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-12">
          <div className="inline-block relative">
            <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl transform hover:rotate-6 transition-all duration-500 ${role === UserRole.BLOOD_BANK ? 'bg-blue-600 shadow-blue-200' : 'bg-rose-600 shadow-rose-200'}`}>
              {role === UserRole.BLOOD_BANK ? <Hospital className="text-white" size={48} /> : <Droplets className="text-white" size={48} />}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-100">
              <ShieldCheck className={role === UserRole.BLOOD_BANK ? "text-blue-600" : "text-rose-600"} size={24} />
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">BloodLife <span className={role === UserRole.BLOOD_BANK ? "text-blue-600" : "text-rose-600"}>KA</span></h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">
            {isRegistering ? `ENROLLMENT STAGE ${step} / 2` : 'BENGALURU EMERGENCY PORTAL'}
          </p>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]">
          {!isRegistering && (
             <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8 border border-slate-100">
              {Object.entries(UserRole).map(([key, val]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRole(val as UserRole)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black transition-all ${
                    role === val ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200/50' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegistering && step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Account Type Selection for Registration */}
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
                   <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                     <button
                       type="button"
                       onClick={() => setRole(UserRole.USER)}
                       className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${role === UserRole.USER ? 'bg-white shadow-sm text-rose-600 ring-1 ring-slate-200' : 'text-slate-400'}`}
                     >
                       <Droplets size={14} /> DONOR
                     </button>
                     <button
                       type="button"
                       onClick={() => setRole(UserRole.BLOOD_BANK)}
                       className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${role === UserRole.BLOOD_BANK ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-200' : 'text-slate-400'}`}
                     >
                       <Building2 size={14} /> BLOOD BANK
                     </button>
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {role === UserRole.BLOOD_BANK ? 'Institution Name' : 'Legal Full Name'}
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={role === UserRole.BLOOD_BANK ? "e.g. Apollo Hospital Indiranagar" : "e.g. Rahul Hegde"} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/5 text-slate-800 font-bold transition-all" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {role === UserRole.BLOOD_BANK ? 'Official Email ID' : 'State ID (Email)'}
                  </label>
                  <input type="email" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder={role === UserRole.BLOOD_BANK ? "admin@apollo.com" : "rahul@karnataka.gov.in"} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rose-500/5 text-slate-800 font-bold transition-all" />
                </div>

                {role === UserRole.USER && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Blood Group</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setBloodGroup(bg as BloodGroup)}
                          className={`py-3 rounded-xl font-black text-[10px] border-2 transition-all ${
                            bloodGroup === bg ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold" />
                </div>
              </div>
            )}

            {isRegistering && step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className={`p-5 rounded-3xl border flex items-start gap-4 ${role === UserRole.BLOOD_BANK ? 'bg-blue-50/50 border-blue-100' : 'bg-rose-50/50 border-rose-100'}`}>
                   <ShieldAlert className={role === UserRole.BLOOD_BANK ? "text-blue-600 mt-1 shrink-0" : "text-rose-600 mt-1 shrink-0"} size={24} />
                   <div className="space-y-1">
                     <p className={`text-xs font-black uppercase tracking-tight ${role === UserRole.BLOOD_BANK ? 'text-blue-900' : 'text-rose-900'}`}>
                       {role === UserRole.BLOOD_BANK ? 'Facility Verification' : 'Identity Compliance'}
                     </p>
                     <p className={`text-[10px] font-medium leading-relaxed ${role === UserRole.BLOOD_BANK ? 'text-blue-700/80' : 'text-rose-700/80'}`}>
                       {role === UserRole.BLOOD_BANK 
                         ? 'State regulations require valid operating licenses and safety certifications to join the emergency network.' 
                         : 'Karnataka health protocols require multi-factor identity verification. Your documents are encrypted and stored in State Health Vaults.'}
                     </p>
                   </div>
                </div>
                
                <div className="space-y-4">
                   {/* Document Slots */}
                   {[
                     { 
                       type: 'ID_PROOF', 
                       label: role === UserRole.BLOOD_BANK ? 'Operating License' : 'Government ID', 
                       sub: role === UserRole.BLOOD_BANK ? 'State Health Dept License' : 'Aadhar / Voter / Passport', 
                       icon: role === UserRole.BLOOD_BANK ? <FileText size={24} /> : <Fingerprint size={24} />, 
                       ref: idProofInputRef 
                     },
                     { 
                       type: 'MEDICAL_REPORT', 
                       label: role === UserRole.BLOOD_BANK ? 'Safety Certification' : 'Medical Clearance', 
                       sub: role === UserRole.BLOOD_BANK ? 'NABH / ISO Certificate' : 'Fitness Certificate (PDF/JPG)', 
                       icon: <Hospital size={24} />, 
                       ref: medicalReportInputRef 
                     }
                   ].map((slot) => {
                     const upState = uploadingState[slot.type];
                     const doc = documents.find(d => d.type === slot.type);
                     const isBusy = upState.phase !== 'IDLE';
                     
                     return (
                       <div key={slot.type} className="relative group">
                         <input 
                           type="file" 
                           ref={slot.ref} 
                           onChange={(e) => handleFileChange(e, slot.type as any)}
                           className="hidden" 
                           accept=".pdf,.jpg,.jpeg,.png"
                         />
                         
                         <div 
                           onClick={() => !isBusy && !doc && slot.ref.current?.click()}
                           className={`p-6 border-2 border-dashed rounded-[2.5rem] transition-all flex items-center gap-5 cursor-pointer relative overflow-hidden ${
                             doc ? 'bg-emerald-50 border-emerald-200 cursor-default' : 
                             isBusy ? 'bg-blue-50 border-blue-200 cursor-wait' : 
                             upState.error ? 'bg-rose-50 border-rose-200' :
                             'bg-slate-50 border-slate-200 hover:border-rose-400'
                           }`}
                         >
                            {/* Scanning Overlay Animation */}
                            {upState.phase === 'SCANNING' && (
                              <div className="absolute inset-0 bg-blue-600/5 animate-pulse pointer-events-none"></div>
                            )}

                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                              doc ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 
                              isBusy ? 'bg-blue-600 text-white shadow-lg' : 
                              upState.error ? 'bg-rose-500 text-white' :
                              'bg-white text-slate-400 group-hover:text-rose-600 shadow-sm'
                            }`}>
                               {upState.phase === 'UPLOADING' ? <Loader2 className="animate-spin" /> : 
                                upState.phase === 'SCANNING' ? <Search className="animate-bounce" /> : 
                                upState.phase === 'VERIFYING' ? <ShieldCheck className="animate-pulse" /> : 
                                doc ? <Check /> : upState.error ? <X /> : slot.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                               {upState.phase === 'IDLE' && !doc ? (
                                 <>
                                   <p className="text-sm font-black text-slate-800">{slot.label}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{upState.error || slot.sub}</p>
                                 </>
                               ) : doc ? (
                                 <>
                                   <p className="text-sm font-black text-emerald-900 truncate">{doc.name}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${doc.status === 'VERIFIED' ? 'bg-emerald-600 text-white' : 'bg-emerald-200/50 text-emerald-700'}`}>
                                        {doc.status}
                                      </span>
                                      <p className="text-[9px] font-bold text-emerald-600/70">{doc.status === 'VERIFIED' ? 'State Verified' : 'Securely Logged'}</p>
                                   </div>
                                 </>
                               ) : (
                                 <>
                                   <p className="text-xs font-black text-blue-900 uppercase tracking-tighter mb-2">
                                     {upState.phase === 'UPLOADING' ? `STREAMING: ${upState.progress}%` : 
                                      upState.phase === 'SCANNING' ? 'AI THREAT SCANNING...' : 'VERIFYING INTEGRITY...'}
                                   </p>
                                   <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-600 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(37,99,235,0.5)]" 
                                        style={{ width: upState.phase === 'UPLOADING' ? `${upState.progress}%` : '100%' }}
                                      ></div>
                                   </div>
                                 </>
                               )}
                            </div>

                            {doc && (
                              <div className="flex items-center gap-1">
                                {doc.status === 'PENDING' && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); simulateApproval(slot.type); }} 
                                    className="p-2 text-blue-400 hover:text-blue-600 transition-colors shrink-0 group/btn relative"
                                    title="Demo: Simulate Admin Approval"
                                  >
                                    <CheckCircle2 size={20} />
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap font-black">SIMULATE APPROVAL</span>
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeDocument(slot.type); }} 
                                  className="p-2 text-rose-300 hover:text-rose-600 transition-colors shrink-0"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            )}
                         </div>
                       </div>
                     );
                   })}
                </div>

                {/* --- SIMULATE STATE APPROVAL BUTTON --- */}
                {documents.length > 0 && documents.some(d => d.status === 'PENDING') && (
                  <button
                    type="button"
                    onClick={simulateAllApprovals}
                    className="w-full py-4 border-2 border-blue-500 text-blue-600 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-50 transition-all flex items-center justify-center gap-3 animate-in fade-in zoom-in-95 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors"></div>
                    <Wand2 size={16} className="group-hover:rotate-12 transition-transform" /> 
                    Simulate State Approval (Demo)
                  </button>
                )}
              </div>
            )}

            {!isRegistering && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Identifier</label>
                  <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="email@address.in" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold focus:ring-4 focus:ring-rose-500/5 transition-all outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Encrypted Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold focus:ring-4 focus:ring-rose-500/5 transition-all outline-none" />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 flex items-center gap-3 animate-bounce">
                <ShieldAlert size={20} />
                <p className="text-[10px] font-black uppercase leading-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              className={`w-full py-5 rounded-[2.5rem] font-black text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-4 relative group overflow-hidden ${role === UserRole.BLOOD_BANK ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'}`}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              {isRegistering ? (step === 1 ? 'GO TO VERIFICATION' : 'JOIN THE NETWORK') : 'INITIALIZE ACCESS'}
            </button>
          </form>

          <button onClick={() => { setIsRegistering(!isRegistering); setStep(1); setError(''); setRole(UserRole.USER); }} className="w-full mt-10 text-[10px] font-black uppercase text-slate-400 hover:text-rose-600 tracking-[0.2em] transition-colors">
            {isRegistering ? 'ALREADY REGISTERED? LOG IN' : "NEW TO BLOODLIFE? CREATE ACCOUNT"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
