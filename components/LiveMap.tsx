
import React, { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Hospital, User, Navigation, ShieldAlert, X, Target, Loader2 } from 'lucide-react';
import { useAuth } from '../App';
import { getAvailableDonors, getBloodBanks, getActiveRequests } from '../services/firestoreService';
import { UserProfile, BloodBank, EmergencyRequest } from '../types';
import { logger } from '../lib/logger';

declare const L: any;

const LiveMap: React.FC = () => {
  const { userLocation } = useAuth();
  const [search, setSearch] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [donors, setDonors] = useState<UserProfile[]>([]);
  const [banks, setBanks] = useState<BloodBank[]>([]);
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const [d, b, r] = await Promise.all([
          getAvailableDonors(),
          getBloodBanks(),
          getActiveRequests(),
        ]);
        setDonors(d);
        setBanks(b);
        setRequests(r);
      } catch (err) {
        logger.error('Failed to load map data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const initMap = () => {
    if (!mapContainerRef.current || isLoading) return;
    
    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [12.9716, 77.5946];
    const map = L.map(mapContainerRef.current).setView(center, 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add 'Me' Marker
    if (userLocation) {
      const meIcon = L.divIcon({
        className: 'custom-marker-me',
        html: `<div class="w-8 h-8 bg-blue-500 border-4 border-white rounded-full shadow-xl animate-pulse flex items-center justify-center text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: meIcon })
        .addTo(map)
        .bindPopup("<b>Your Current Location</b>")
        .openPopup();
    }

    // Add Donors from Firestore
    donors.forEach(donor => {
      if (!donor.isAvailable) return;
      const donorIcon = L.divIcon({
        className: 'custom-marker-donor',
        html: `<span>${donor.bloodGroup}</span>`,
        iconSize: [30, 30]
      });
      L.marker([donor.location.lat, donor.location.lng], { icon: donorIcon })
        .addTo(map)
        .on('click', () => setSelectedEntity({ ...donor, type: 'DONOR' }));
    });

    // Add Blood Banks from Firestore
    banks.forEach(bank => {
      const bankIcon = L.divIcon({
        className: 'custom-marker-bank',
        html: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
        iconSize: [36, 36]
      });
      L.marker([bank.location.lat, bank.location.lng], { icon: bankIcon })
        .addTo(map)
        .on('click', () => setSelectedEntity({ ...bank, type: 'BANK' }));
    });

    // Add Emergency Requests from Firestore
    requests.forEach(req => {
      const reqIcon = L.divIcon({
        className: 'custom-marker-request',
        html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`,
        iconSize: [44, 44]
      });
      L.marker([req.location.lat, req.location.lng], { icon: reqIcon })
        .addTo(map)
        .on('click', () => setSelectedEntity({ ...req, type: 'REQUEST' }));
    });
  };

  useEffect(() => {
    initMap();
    return () => {
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
    };
  }, [userLocation, isLoading, donors, banks, requests]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
    }
  };

  return (
    <div className="h-full relative overflow-hidden flex flex-col">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[94%] md:w-[600px] z-[1000]">
        <div className="glass shadow-2xl rounded-3xl p-2.5 flex items-center gap-3 border border-white/50">
          <div className="pl-4 text-slate-400"><Search size={22} /></div>
          <input
            type="text"
            placeholder="Search Karnataka facilities..."
            className="flex-1 bg-transparent py-3 focus:outline-none text-slate-800 font-medium placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search facilities"
          />
          <button className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all">
            FIND
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-[1001] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin text-rose-600 mx-auto mb-4" size={40} />
            <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Loading map data...</p>
          </div>
        </div>
      )}

      <div id="map" ref={mapContainerRef} className="flex-1"></div>

      <button 
        onClick={handleRecenter}
        className="absolute bottom-10 right-10 bg-white p-4 rounded-2xl shadow-xl z-[999] text-blue-600 hover:bg-blue-50 transition-all border border-slate-100"
      >
        <Target size={24} />
      </button>

      {selectedEntity && (
        <div className="absolute bottom-10 left-6 right-6 md:left-10 md:w-[400px] glass shadow-2xl rounded-[2.5rem] p-8 border border-white/50 animate-in slide-in-from-bottom-10 z-[1001]">
          <button onClick={() => setSelectedEntity(null)} className="absolute top-6 right-6 p-2 text-slate-400"><X size={20} /></button>
          <div className="flex gap-5 items-start mb-6">
            <div className={`p-4 rounded-3xl text-white shadow-lg ${selectedEntity.type === 'DONOR' ? 'bg-rose-600' : selectedEntity.type === 'BANK' ? 'bg-blue-600' : 'bg-red-600 animate-pulse'}`}>
              {selectedEntity.type === 'DONOR' ? <User size={28} /> : selectedEntity.type === 'BANK' ? <Hospital size={28} /> : <ShieldAlert size={28} />}
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 tracking-tight">{selectedEntity.name || selectedEntity.hospitalName}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedEntity.bloodGroup || 'Facility'}</p>
            </div>
          </div>
          <button onClick={() => alert(`Starting navigation to ${selectedEntity.name || selectedEntity.hospitalName}`)} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-rose-700 shadow-xl shadow-rose-200">
            <Navigation size={18} strokeWidth={3} /> GET DIRECTIONS
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveMap;
