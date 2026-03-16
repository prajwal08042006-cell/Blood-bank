import React, { useMemo, useState } from 'react';
import { 
  Droplets, ShieldCheck, Lock, CheckCircle2, 
  History, MapPin, FileBadge, Share2, Trophy, 
  FileText, AlertCircle, Sparkles, ChevronRight, 
  ExternalLink, RefreshCw, Award, Medal, Zap, Download,
  Verified, Eye
} from 'lucide-react';
import { useAuth } from '../App';
import { CURRENT_USER } from '../constants';

const DonationHistory: React.FC = () => {
  const { user, updateUser } = useAuth();
  const activeUser = user || CURRENT_USER;
  const [isVerifying, setIsVerifying] = useState(false);

  // Simulation logic for document approval
  const simulateApproval = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const updatedDocs = activeUser.documents.map(d => ({ ...d, status: 'VERIFIED' as const }));
      // Awarding bonus points for verification to help unlock certificates
      updateUser({ documents: updatedDocs, impactScore: activeUser.impactScore + 150 });
      setIsVerifying(false);
    }, 2000);
  };

  const COOLDOWN_DAYS = 90;

  const cooldownInfo = useMemo(() => {
    if (!activeUser.lastDonated) return { isEligible: true, daysRemaining: 0, progress: 100 };
    const lastDate = new Date(activeUser.lastDonated);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isEligible = diffDays >= COOLDOWN_DAYS;
    const daysRemaining = Math.max(0, COOLDOWN_DAYS - diffDays);
    const progress = Math.min(100, (diffDays / COOLDOWN_DAYS) * 100);
    return { isEligible, daysRemaining, progress, lastDate };
  }, [activeUser]);

  const badges = [
    { id: 1, name: 'State Guardian', requirement: 'Identity Verification', minScore: 0, icon: '🏛️' },
    { id: 2, name: 'Bengaluru Lifeline', requirement: 'First Donation Complete', minScore: 100, icon: '🏙️' },
    { id: 3, name: 'Emergency Ace', requirement: 'Impact Points > 300', minScore: 300, icon: '⚡' },
  ];

  // Digital Certificates Definition with detailed metadata and requirements
  const digitalCertificates = useMemo(() => [
    {
      id: 'cert-1',
      title: 'Commendable Contributor',
      description: 'Official recognition for active participation and positive impact in the state blood network.',
      requirement: 200,
      reqType: 'score',
      icon: <Award className="text-amber-500" size={32} />,
      color: 'from-amber-50 to-orange-100',
      accentColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      glowColor: 'shadow-amber-200/40'
    },
    {
      id: 'cert-2',
      title: 'Life Guardian',
      description: 'Awarded to state heroes who have completed 3 or more successful blood donations.',
      requirement: 3,
      reqType: 'donations',
      icon: <Medal className="text-rose-500" size={32} />,
      color: 'from-rose-50 to-pink-100',
      accentColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      glowColor: 'shadow-rose-200/40'
    },
    {
      id: 'cert-3',
      title: 'State Health Ambassador',
      description: 'The highest civilian honor for massive long-term impact on the regional blood supply chain.',
      requirement: 1000,
      reqType: 'score',
      icon: <Zap className="text-blue-500" size={32} />,
      color: 'from-blue-50 to-indigo-100',
      accentColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      glowColor: 'shadow-blue-200/40'
    }
  ], []);

  const hasVerifiedId = activeUser.documents.some(d => d.type === 'ID_PROOF' && d.status === 'VERIFIED');

  return (
    <div className="p-8 md:p-14 max-w-7xl mx-auto space-y-20 animate-in fade-in duration-700">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-4 py-1.5 rounded-full border border-rose-100 uppercase tracking-widest shadow-sm">Verified Contributor</span>
             <h1 className="text-6xl font-black text-slate-800 tracking-tighter">Impact Portfolio</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-slate-200">
                {activeUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-black text-slate-800 leading-none">{activeUser.name}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{activeUser.email}</p>
              </div>
            </div>
            <div className="h-12 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 text-slate-500">
              <div className="bg-rose-100 p-2 rounded-xl text-rose-600">
                <MapPin size={20} />
              </div>
              <p className="text-sm font-bold">{activeUser.location.address || "Bengaluru Division, KA"}</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-6">
          <div className="bg-white px-10 py-8 rounded-[3.5rem] border border-slate-100 shadow-2xl text-center min-w-[180px] relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-150"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 relative z-10">Total Impact</p>
             <p className="text-6xl font-black text-slate-800 relative z-10 tracking-tighter">{activeUser.impactScore}</p>
          </div>
          <div className="bg-slate-900 px-10 py-8 rounded-[3.5rem] shadow-2xl text-center min-w-[180px] text-white relative overflow-hidden group">
             <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 -ml-8 -mb-8 rounded-full transition-transform group-hover:scale-150"></div>
             <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.3em] mb-1 relative z-10">Blood Group</p>
             <p className="text-6xl font-black text-rose-500 relative z-10 tracking-tighter">{activeUser.bloodGroup}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-16">
           
           {/* Activity Timeline */}
           <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 blur-[100px] rounded-full -mr-40 -mt-40"></div>
             <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 mb-12 relative z-10">
               <History className="text-rose-600" /> Activity Timeline
             </h3>
             
             {activeUser.donationHistory.length > 0 ? (
                <div className="space-y-6 relative z-10">
                  {activeUser.donationHistory.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-8 bg-slate-50/80 rounded-[2.5rem] border border-slate-100 hover:border-rose-200 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg text-rose-600 group-hover:scale-110 transition-transform">
                          <Droplets size={28} />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-xl tracking-tight">{log.location}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{log.date} • {log.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-rose-600">+{log.points}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points Gained</p>
                      </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="py-24 text-center bg-slate-50/50 rounded-[3.5rem] border-2 border-dashed border-slate-200 relative z-10 group hover:bg-slate-50 transition-all">
                  <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                    <Sparkles size={48} className="text-rose-600" />
                  </div>
                  <h4 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">Your Legacy Starts Here</h4>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto mb-12 leading-relaxed text-lg">
                    Every drop counts towards a healthier state. Complete your first donation to see your timeline come to life.
                  </p>
                  
                  <div className="max-w-md mx-auto space-y-4">
                     {[
                       { label: 'Identity Verification', done: hasVerifiedId },
                       { label: 'Medical Clearance Uploaded', done: activeUser.documents.some(d => d.type === 'MEDICAL_REPORT') },
                       { label: 'Impact Score > 0', done: activeUser.impactScore > 0 },
                       { label: 'Emergency Responder Badge', done: false }
                     ].map((item, idx) => (
                       <div key={idx} className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${item.done ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-100 text-slate-300'}`}>
                         <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                         {item.done ? <CheckCircle2 size={24} className="text-emerald-500" /> : <div className="w-6 h-6 rounded-full border-2 border-slate-200"></div>}
                       </div>
                     ))}
                  </div>

                  <button className="mt-14 bg-rose-600 text-white px-14 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-2xl shadow-rose-200 flex items-center gap-4 mx-auto active:scale-95 group">
                    LOCATE BLOOD DRIVE <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </button>
                </div>
             )}
           </div>

           {/* --- DIGITAL CERTIFICATES SECTION --- */}
           <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-80 h-80 bg-slate-50/50 blur-[120px] rounded-full -ml-40 -mt-40"></div>
              <div className="flex items-center justify-between mb-16 relative z-10">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 flex items-center gap-4">
                    <Verified className="text-amber-500" size={32} /> Digital Certificates
                  </h3>
                  <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] mt-3">State-Verified Achievement System</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unlocked Credits</p>
                   <p className="text-3xl font-black text-slate-800 tracking-tighter">
                     {digitalCertificates.filter(c => (c.reqType === 'score' ? activeUser.impactScore : activeUser.donationHistory.length) >= c.requirement).length} 
                     <span className="text-slate-300 mx-2">/</span> 
                     {digitalCertificates.length}
                   </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                {digitalCertificates.map((cert) => {
                  const currentVal = cert.reqType === 'score' ? activeUser.impactScore : activeUser.donationHistory.length;
                  const isUnlocked = currentVal >= cert.requirement;
                  const progress = Math.min(100, (currentVal / cert.requirement) * 100);

                  return (
                    <div 
                      key={cert.id} 
                      className={`group p-10 border-2 rounded-[4rem] transition-all duration-700 flex flex-col h-full relative overflow-hidden ${
                        isUnlocked 
                          ? `bg-gradient-to-br ${cert.color} ${cert.borderColor} shadow-xl hover:shadow-2xl hover:-translate-y-3 ${cert.glowColor}` 
                          : 'bg-slate-50 border-slate-200 grayscale-[0.95] border-dashed opacity-60 hover:opacity-100 transition-opacity'
                      }`}
                    >
                      {/* Visual Flourish for Unlocked Cards */}
                      {isUnlocked && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 blur-[60px] rounded-full"></div>
                        </>
                      )}

                      <div className="flex justify-between items-start mb-10">
                        <div className={`p-6 bg-white rounded-[2rem] shadow-xl transition-all duration-500 group-hover:rotate-6 ${!isUnlocked && 'scale-90 opacity-40 grayscale'}`}>
                          {cert.icon}
                        </div>
                        {isUnlocked ? (
                          <div className="bg-emerald-500 text-white p-4 rounded-full shadow-lg shadow-emerald-100 animate-bounce">
                            <CheckCircle2 size={24} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="bg-slate-200 text-slate-400 p-4 rounded-full">
                            <Lock size={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                           <h4 className={`text-2xl font-black tracking-tight ${isUnlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                            {cert.title}
                          </h4>
                          {isUnlocked && <Verified size={18} className="text-blue-500" />}
                        </div>
                        <p className={`text-base font-medium leading-relaxed mb-10 ${isUnlocked ? 'text-slate-600' : 'text-slate-500'}`}>
                          {cert.description}
                        </p>
                        
                        {!isUnlocked && (
                          <div className="space-y-4 mb-10 bg-white/40 p-6 rounded-[2rem] border border-white/60">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                               <span className="text-slate-400">Unlock Progress</span>
                               <span className={cert.accentColor}>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-200/50 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full transition-all duration-[2s] ease-out`}
                                 style={{ width: `${progress}%`, backgroundColor: progress > 50 ? '#f43f5e' : '#94a3b8' }}
                               ></div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-center">
                              {currentVal} of {cert.requirement} {cert.reqType === 'score' ? 'Impact Points' : 'Donations'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className={`mt-auto pt-10 border-t flex items-center justify-between ${isUnlocked ? 'border-slate-200/60' : 'border-slate-200/20'}`}>
                        {!isUnlocked ? (
                          <div className="flex items-center gap-3">
                             <AlertCircle size={18} className="text-rose-400" />
                             <p className="text-[11px] font-black text-rose-400 uppercase tracking-[0.2em]">
                               Locked Achievement
                             </p>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col">
                               <p className={`text-[11px] font-black uppercase tracking-widest ${cert.accentColor}`}>State Achievement</p>
                               <p className="text-[11px] font-bold text-slate-500 mt-1">Ref ID: CERT-{cert.id.split('-')[1]}</p>
                            </div>
                            <div className="flex gap-4">
                               <button className="p-4 bg-white text-slate-400 rounded-3xl hover:text-blue-600 transition-all shadow-md border border-slate-100 active:scale-90" title="Preview Certificate">
                                 <Eye size={22} />
                               </button>
                               <button className="p-4 bg-slate-900 text-white rounded-3xl hover:bg-black transition-all shadow-xl active:scale-90" title="Download PDF">
                                 <Download size={22} />
                               </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>

           {/* Compliance Vault */}
           <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-50/50 blur-[120px] rounded-full -mr-32 -mb-32"></div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 relative z-10">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 flex items-center gap-4">
                    <FileBadge className="text-blue-600" size={32} /> Compliance Vault
                  </h3>
                  <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] mt-3">Verified Personal Health Documents</p>
                </div>
                {!hasVerifiedId && activeUser.documents.length > 0 && (
                  <button 
                    onClick={simulateApproval}
                    disabled={isVerifying}
                    className="flex items-center gap-4 bg-blue-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
                  >
                    {isVerifying ? <RefreshCw className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                    {isVerifying ? 'VERIFYING...' : 'MANUAL APPROVAL (DEMO)'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                {activeUser.documents.length > 0 ? activeUser.documents.map((doc) => (
                  <div key={doc.id} className="p-10 border border-slate-100 rounded-[4rem] bg-slate-50/50 flex flex-col gap-10 group hover:shadow-2xl hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="p-7 bg-white rounded-[2.2rem] shadow-xl text-slate-400 group-hover:text-blue-600 transition-colors">
                        <FileText size={42} />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-[11px] font-black px-6 py-3 rounded-2xl uppercase tracking-widest shadow-lg ${doc.status === 'VERIFIED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {doc.status}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-3 tracking-tighter">ID: {doc.id.split('-')[1]}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-800 truncate leading-tight tracking-tight">{doc.name}</p>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mt-3">{doc.type.replace('_', ' ')}</p>
                    </div>
                    <div className="pt-8 border-t border-slate-200 flex items-center justify-between">
                       <p className="text-[11px] font-bold text-slate-400 tracking-tight">Digitized {new Date(doc.uploadDate).toLocaleDateString()}</p>
                       <button className="text-blue-600 font-black text-[11px] uppercase flex items-center gap-3 hover:underline transition-all tracking-widest">
                         VIEW DOCUMENT <ExternalLink size={16} />
                       </button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-32 text-center border-4 border-dashed border-slate-100 rounded-[4rem] bg-slate-50/20">
                    <AlertCircle className="mx-auto text-slate-200 mb-10" size={80} />
                    <p className="text-slate-400 font-black uppercase text-lg tracking-[0.4em]">Vault is Empty</p>
                    <p className="text-slate-400 text-base mt-4 max-w-sm mx-auto font-medium leading-relaxed">
                      Upload your identity and medical certificates to achieve <span className="text-rose-600 font-black">Verified State Donor</span> status.
                    </p>
                  </div>
                )}
              </div>
           </div>
        </div>

        {/* Sidebar Achievements */}
        <div className="lg:col-span-4 space-y-16">
           <div className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden h-fit sticky top-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-rose-600/30 blur-[70px] rounded-full -mr-20 -mt-20"></div>
              <div className="flex items-center gap-6 mb-16">
                 <div className="bg-white/10 p-5 rounded-[2rem]"><Trophy className="text-amber-400" size={42} /></div>
                 <h3 className="text-4xl font-black tracking-tighter leading-none">Global Rank</h3>
              </div>

              <div className="space-y-10">
                {badges.map((badge) => {
                  const isUnlockedByScore = activeUser.impactScore >= badge.minScore && badge.minScore > 0;
                  const isIdentityBadge = badge.id === 1 && hasVerifiedId;
                  const unlocked = isUnlockedByScore || isIdentityBadge;

                  return (
                    <div key={badge.id} className={`flex items-center gap-8 p-8 rounded-[3.5rem] border transition-all duration-700 ${unlocked ? 'bg-white/5 border-white/10' : 'opacity-20 grayscale border-transparent'}`}>
                      <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl transition-all ${unlocked ? 'bg-white/10 rotate-6 scale-110 shadow-rose-900/40' : 'bg-slate-800'}`}>
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-xl tracking-tight leading-tight truncate">{badge.name}</h4>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mt-3">{badge.requirement}</p>
                      </div>
                      {unlocked ? <CheckCircle2 className="text-emerald-400 shrink-0" size={32} /> : <Lock className="text-slate-600 shrink-0" size={32} />}
                    </div>
                  );
                })}
              </div>

              <div className="mt-20 pt-16 border-t border-white/10 space-y-12">
                 <div className="p-12 bg-white/5 rounded-[3.5rem] border border-white/5 shadow-inner">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">State Progress</p>
                    <div className="flex justify-between items-end mb-6">
                       <span className="text-4xl font-black tracking-tighter">Elite 1</span>
                       <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{Math.min(100, Math.round((activeUser.impactScore / 1000) * 100))}% Completion</span>
                    </div>
                    <div className="h-5 bg-white/10 rounded-full overflow-hidden p-1.5 ring-1 ring-white/5">
                       <div className="h-full bg-rose-600 rounded-full shadow-[0_0_30px_rgba(225,29,72,0.9)] transition-all duration-[2.5s] ease-out" style={{ width: `${Math.max(15, (activeUser.impactScore / 1000) * 100)}%` }}></div>
                    </div>
                 </div>
                 
                 <button className="w-full bg-rose-600 py-8 rounded-[3rem] font-black flex items-center justify-center gap-6 hover:bg-rose-700 transition-all shadow-[0_20px_40px_-10px_rgba(225,29,72,0.5)] active:scale-95 group">
                   <Share2 size={32} className="group-hover:rotate-[360deg] transition-transform duration-1000" /> 
                   <span className="tracking-[0.3em] text-[11px] font-black uppercase">Broadcast Portfolio</span>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DonationHistory;
