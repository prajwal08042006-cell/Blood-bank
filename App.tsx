
import React, { useState, createContext, useContext, useMemo, useEffect } from 'react';
import { logger } from './lib/logger';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LiveMap from './components/LiveMap';
import EmergencyPanel from './components/EmergencyPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ChatBot from './components/ChatBot';
import DonationHistory from './components/DonationHistory';
import Login from './components/Login';
import { UserRole, UserProfile, Location, UserDocument, BloodGroup } from './types';
import { CURRENT_USER, MOCK_DONORS, MOCK_BLOOD_BANKS, MOCK_REQUESTS } from './constants';
import { Package, Activity, MapPin, CheckCircle, Clock, AlertTriangle, Zap, RefreshCw, Users, PlusCircle } from 'lucide-react';

// --- Auth Context ---
interface AuthContextType {
  user: UserProfile | null;
  allUsers: UserProfile[];
  login: (id: string, pass: string, role: UserRole) => boolean;
  register: (profile: Partial<UserProfile>) => void;
  logout: () => void;
  userLocation: Location | null;
  updateUser: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([...MOCK_DONORS, CURRENT_USER]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          address: "Detected Live Location"
        });
      }, (error) => {
        logger.warn("Location access denied, defaulting to Bengaluru central.");
        setUserLocation({ lat: 12.9716, lng: 77.5946, address: "Bengaluru, KA" });
      });
    }
  }, []);

  const login = (id: string, pass: string, role: UserRole) => {
    // 1. Check existing users (Donors/Users)
    const found = allUsers.find(u => (u.id === id || u.email === id) && u.role === role);
    if (found) {
      setUser(found);
      return true;
    }

    // 2. Check Mock Blood Banks (if role is BLOOD_BANK)
    if (role === UserRole.BLOOD_BANK) {
      const bank = MOCK_BLOOD_BANKS.find(b => b.id === id || b.name === id || b.contact === id);
      if (bank) {
        const bankUser: UserProfile = {
          id: bank.id,
          name: bank.name,
          email: `${bank.name.split(' ')[0].toLowerCase()}@bloodlife.com`, // Mock email
          bloodGroup: 'O+', // Irrelevant
          isAvailable: true,
          role: UserRole.BLOOD_BANK,
          impactScore: 1000,
          location: bank.location,
          documents: [],
          donationHistory: [],
          stock: bank.stock
        };
        setUser(bankUser);
        return true;
      }
    }

    // 3. Fallback: Create new user (Demo Mode)
    if (id && pass) {
      const newUser = { ...CURRENT_USER, id, name: id.split('@')[0], role, donationHistory: [], documents: [] };
      setUser(newUser);
      return true;
    }
    return false;
  };

  const register = (profile: Partial<UserProfile>) => {
    const newUser: UserProfile = {
      id: `KA-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      name: profile.name || 'Anonymous',
      email: profile.email || '',
      bloodGroup: profile.bloodGroup || 'O+',
      isAvailable: true,
      role: profile.role || UserRole.USER,
      impactScore: profile.impactScore || 0,
      location: userLocation || { lat: 12.9716, lng: 77.5946 },
      documents: profile.documents || [],
      donationHistory: profile.donationHistory || [],
      ...profile
    } as UserProfile;
    setAllUsers(prev => [...prev, newUser]);
    setUser(newUser);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    }
  };

  const logout = () => setUser(null);

  const value = useMemo(() => ({ user, allUsers, login, register, logout, userLocation, updateUser }), [user, allUsers, userLocation]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles
}) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

const InventoryManager = () => {
  const { user } = useAuth();
  const initialStock = user?.stock || MOCK_BLOOD_BANKS[0].stock;
  const [stock, setStock] = useState<Record<BloodGroup, number>>(initialStock);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStock(prev => {
        const next = { ...prev };
        const keys = Object.keys(next) as Array<keyof typeof next>;
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const change = Math.random() > 0.7 ? 1 : -1;
        next[randomKey] = Math.max(0, next[randomKey] + change);
        return next;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 md:p-14 bg-slate-50 min-h-full max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter">Inventory Control</h1>
          <p className="text-slate-400 font-bold mt-2 flex items-center gap-2">
            <MapPin size={18} className="text-blue-600" /> {user?.name || "Narayana Health, Bannerghatta Road, Bengaluru"}
          </p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 1000);
            }}
            className="flex-1 md:flex-none bg-white border-2 border-slate-200 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} /> SYNC SYSTEM
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight mb-10">
              <Package className="text-blue-600" /> Current Stock Levels
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(stock).map(([group, units]) => {
                // Fixed: Operator '<' cannot be applied to types 'unknown' and 'number' by casting units to number
                const count = units as number;
                return (
                  <div key={group} className={`p-8 rounded-[2rem] border-2 transition-all ${count < 10 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50/30 border-slate-100'}`}>
                    <span className="text-xs font-black text-slate-400 mb-1 block tracking-[0.2em]">{group}</span>
                    <span className={`text-4xl font-black tracking-tighter block ${count < 10 ? 'text-rose-600' : 'text-slate-800'}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeDispatcher />} />
          <Route path="/map" element={<ProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN, UserRole.BLOOD_BANK]}><LiveMap /></ProtectedRoute>} />
          <Route path="/emergency" element={<ProtectedRoute allowedRoles={[UserRole.USER]}><EmergencyPanel /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute allowedRoles={[UserRole.USER]}><DonationHistory /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={[UserRole.BLOOD_BANK]}><InventoryManager /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AuthGateChat />
      </Router>
    </AuthProvider>
  );
};

const HomeDispatcher = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === UserRole.ADMIN) return <Navigate to="/admin" replace />;
  if (user.role === UserRole.BLOOD_BANK) return <Navigate to="/inventory" replace />;
  return <Navigate to="/map" replace />;
};

const AuthGateChat = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <ChatBot />;
};

export default App;
