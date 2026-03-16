
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import Layout from './components/Layout';
import LiveMap from './components/LiveMap';
import EmergencyPanel from './components/EmergencyPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ChatBot from './components/ChatBot';
import DonationHistory from './components/DonationHistory';
import Login from './components/Login';
import { UserRole, UserProfile, Location, BloodGroup } from './types';
import { onAuthChange, signOutUser } from './lib/auth';
import { getUserProfile, updateUserProfile, seedBloodBanks } from './services/firestoreService';
import { logger } from './lib/logger';
import { Package, MapPin, RefreshCw } from 'lucide-react';

// --- Auth Context ---
interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: UserProfile | null;
  loading: boolean;
  userLocation: Location | null;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  // Get user geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Detected Live Location",
          });
        },
        () => {
          logger.warn("Location access denied, defaulting to Bengaluru central.");
          setUserLocation({ lat: 12.9716, lng: 77.5946, address: "Bengaluru, KA" });
        }
      );
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid);
          setUser(profile);
          // Seed blood bank data on first authenticated load
          await seedBloodBanks();
        } catch (err) {
          logger.error('Failed to load profile:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await signOutUser();
    setUser(null);
    setFirebaseUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<UserProfile>) => {
    if (!firebaseUser || !user) return;
    await updateUserProfile(firebaseUser.uid, updates);
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, [firebaseUser, user]);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    const profile = await getUserProfile(firebaseUser.uid);
    setUser(profile);
  }, [firebaseUser]);

  const value = {
    firebaseUser,
    user,
    loading,
    userLocation,
    logout,
    updateUser,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Loading screen ---
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#FDFDFF] flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 bg-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl shadow-rose-200">
        <Package className="text-white" size={40} />
      </div>
      <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Loading BloodLife...</p>
    </div>
  </div>
);

// --- Protected Route ---
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

// --- Inventory Manager ---
const InventoryManager = () => {
  const { user } = useAuth();
  const initialStock = user?.stock || { 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0 };
  const [stock, setStock] = useState<Record<BloodGroup, number>>(initialStock);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStock((prev) => {
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
            <MapPin size={18} className="text-blue-600" /> {user?.name || "Blood Bank"}
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

// --- Home Dispatcher ---
const HomeDispatcher = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === UserRole.ADMIN) return <Navigate to="/admin" replace />;
  if (user.role === UserRole.BLOOD_BANK) return <Navigate to="/inventory" replace />;
  return <Navigate to="/map" replace />;
};

// --- Auth Gate Chat ---
const AuthGateChat = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <ChatBot />;
};

// --- Login Gate ---
const LoginGate = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
};

// --- App ---
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginGate />} />
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

export default App;
