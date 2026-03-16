
import React, { useState } from 'react';
import { ShieldAlert, Droplets, MapPin, Users, Send, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { BloodGroup, DonorMatch } from '../types';
import { getAiDonorMatching } from '../services/geminiService';
import { MOCK_DONORS, CURRENT_USER } from '../constants';

const EmergencyPanel: React.FC = () => {
  const [step, setStep] = useState(1);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState<DonorMatch[]>([]);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const startMatching = async () => {
    if (!bloodGroup) return;
    setIsMatching(true);
    // Simulate AI ranking
    const results = await getAiDonorMatching(bloodGroup as BloodGroup, CURRENT_USER.location, MOCK_DONORS);
    setMatches(results);
    setIsMatching(false);
    setStep(2);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-rose-100 p-3 rounded-2xl text-rose-600">
          <ShieldAlert size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Emergency Broadcast</h1>
          <p className="text-slate-500">Initiate a life-saving request in seconds.</p>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Droplets className="text-rose-500" />
            1. Select Required Blood Group
          </h2>
          
          <div className="grid grid-cols-4 gap-4 mb-10">
            {bloodGroups.map((group) => (
              <button
                key={group}
                onClick={() => setBloodGroup(group)}
                className={`py-6 rounded-2xl font-bold text-xl transition-all ${
                  bloodGroup === group 
                    ? 'bg-rose-600 text-white shadow-lg ring-4 ring-rose-100 scale-105' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MapPin className="text-rose-500" />
            2. Hospital Location
          </h2>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-10 flex justify-between items-center">
             <div>
               <p className="font-semibold text-slate-700">St. Jude Medical Center</p>
               <p className="text-sm text-slate-500">123 Broadway St, New York, NY</p>
             </div>
             <button className="text-rose-600 text-sm font-bold hover:underline">Change</button>
          </div>

          <button
            onClick={startMatching}
            disabled={!bloodGroup || isMatching}
            className="w-full bg-rose-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-rose-700 transition-all disabled:opacity-50"
          >
            {/* Corrected logic: use isMatching state instead of constant isTyping */}
            {isMatching ? (
              <span className="flex items-center gap-2">Analyzing Donors <Loader2 className="animate-spin" /></span>
            ) : (
              <>
                <Send size={20} />
                Broadcast Request
              </>
            )}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4 mb-8">
            <div className="bg-emerald-500 text-white p-2 rounded-full">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="font-bold text-emerald-800">Broadcast Successful!</p>
              <p className="text-emerald-600 text-sm">Notifications sent to {matches.length} eligible donors in your area.</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-rose-500" />
            AI-Prioritized Matches
          </h2>

          <div className="grid gap-4">
            {matches.map((match, idx) => (
              <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-lg">
                      {match.donor.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold border-2 border-white flex items-center gap-1">
                      <Star size={8} fill="currentColor" /> {match.donor.impactScore}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{match.donor.name}</h4>
                    <p className="text-sm text-slate-500">{match.distanceKm.toFixed(1)} km away • {match.reason}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-full border border-rose-100">
                    Match Score: {match.score}%
                  </div>
                  <button className="text-rose-600 font-bold text-sm hover:underline flex items-center gap-1">
                    Details <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setStep(1)}
            className="w-full py-4 text-slate-500 font-medium hover:text-slate-800"
          >
            Cancel Request
          </button>
        </div>
      )}
    </div>
  );
};

const Loader2: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
);

const isTyping = false; // Mock typing state

export default EmergencyPanel;
