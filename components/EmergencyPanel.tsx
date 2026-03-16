
import React, { useState, useEffect } from 'react';
import { ShieldAlert, Droplets, MapPin, Users, Send, CheckCircle, ArrowRight, Star, Loader2 } from 'lucide-react';
import { BloodGroup, DonorMatch } from '../types';
import { getAiDonorMatching } from '../services/geminiService';
import { useAuth } from '../App';
import { getAvailableDonors, createEmergencyRequest } from '../services/firestoreService';
import { logger } from '../lib/logger';

const EmergencyPanel: React.FC = () => {
  const { user, userLocation } = useAuth();
  const [step, setStep] = useState(1);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState<DonorMatch[]>([]);
  const [hospitalName, setHospitalName] = useState('');

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Set default hospital location based on user's location
  const location = userLocation || { lat: 12.9716, lng: 77.5946, address: 'Bengaluru, KA' };

  const startMatching = async () => {
    if (!bloodGroup || !user) return;
    setIsMatching(true);
    try {
      // Get real available donors from Firestore
      const donors = await getAvailableDonors(bloodGroup as BloodGroup);

      // Create emergency request in Firestore
      await createEmergencyRequest({
        requesterId: user.id,
        requesterName: user.name,
        bloodGroup: bloodGroup as BloodGroup,
        hospitalName: hospitalName || 'Hospital near my location',
        hospitalLocation: location,
        urgency: 'EMERGENCY',
      });

      // AI-powered donor matching
      const results = await getAiDonorMatching(bloodGroup as BloodGroup, location, donors);
      setMatches(results);
      setStep(2);
    } catch (err) {
      logger.error('Emergency broadcast failed:', err);
    } finally {
      setIsMatching(false);
    }
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
          <div className="space-y-4 mb-10">
            <div>
              <label htmlFor="hospital-name" className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Hospital Name
              </label>
              <input
                id="hospital-name"
                type="text"
                placeholder="e.g., Narayana Health, Bengaluru"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-slate-800 font-bold border-2 border-slate-100 focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 outline-none transition-all"
              />
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-semibold text-slate-700">{hospitalName || 'Your Current Location'}</p>
                <p className="text-sm text-slate-500">{location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}</p>
              </div>
              <MapPin size={20} className="text-rose-500" />
            </div>
          </div>

          <button
            onClick={startMatching}
            disabled={!bloodGroup || isMatching}
            className="w-full bg-rose-600 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-rose-700 transition-all disabled:opacity-50 shadow-xl shadow-rose-200"
          >
            {isMatching ? (
              <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={20} /> Analyzing Donors...</span>
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

          {matches.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl text-center">
              <p className="font-bold text-amber-700">No donors found matching your criteria yet.</p>
              <p className="text-amber-600 text-sm mt-1">Your request has been broadcast. Donors will be notified as they register.</p>
            </div>
          ) : (
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
          )}

          <button 
            onClick={() => { setStep(1); setMatches([]); }}
            className="w-full py-4 text-slate-500 font-medium hover:text-slate-800"
          >
            New Request
          </button>
        </div>
      )}
    </div>
  );
};

export default EmergencyPanel;
