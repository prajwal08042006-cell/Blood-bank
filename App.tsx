
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import Layout from './components/Layout';
import LiveMap from './components/LiveMap';
import EmergencyPanel from './components/EmergencyPanel';
import AdminPanel from './components/AdminPanel';
import ChatBot from './components/ChatBot';
import DonationHistory from './components/DonationHistory';
import Login from './components/Login';
import { UserRole, UserProfile, Location, BloodGroup } from './types';
import { onAuthChange, signOutUser } from './lib/auth';
import { getUserProfile, updateUserProfile, seedBloodBanks } from './services/firestoreService';
import { logger } from './lib/logger';
import { Package, MapPin, RefreshCw, Clock, XCircle, LogOut } from 'lucide-react';
import { clearAndSeedDatabase } from './services/seedService';

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
        } catch (err) {
          logger.error('Failed to load profile:', err);
          setUser(null);
        }

        // Seed blood bank data in background — never block the auth flow
        seedBloodBanks().catch((err) => {
          logger.warn('Blood bank seed skipped:', err);
        });
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

// --- Pending Approval Screen ---
const PendingApprovalScreen: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

  const isPending = user?.accountStatus === 'PENDING';
  const isRejected = user?.accountStatus === 'REJECTED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 p-10 border border-slate-100 text-center">
        <div className={`w-20 h-20 ${isRejected ? 'bg-rose-50' : 'bg-amber-50'} rounded-[2rem] flex items-center justify-center mx-auto mb-6`}>
          {isRejected ? <XCircle className="text-rose-500" size={40} /> : <Clock className="text-amber-500" size={40} />}
        </div>

        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          {isRejected ? 'Account Rejected' : 'Approval Pending'}
        </h2>

        <p className="text-slate-400 text-sm font-bold mb-6">
          {isRejected
            ? 'Your account has been rejected by the admin. Please contact support.'
            : 'Your account is under review. An admin will approve your documents shortly.'}
        </p>

        {isPending && (
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 mb-6 text-left">
            <p className="text-amber-700 text-xs font-bold">📋 What happens next:</p>
            <ul className="text-amber-600 text-xs font-medium mt-2 space-y-1 list-disc pl-4">
              <li>Admin reviews your uploaded documents</li>
              <li>You'll get access once approved</li>
              <li>Check back in a few minutes</li>
            </ul>
          </div>
        )}

        <div className="space-y-3">
          {isPending && (
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-200"
            >
              {checking ? <><RefreshCw className="animate-spin" size={16} /> CHECKING...</> : <><RefreshCw size={16} /> CHECK APPROVAL STATUS</>}
            </button>
          )}
          <button
            onClick={logout}
            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 flex items-center justify-center gap-2 transition-all"
          >
            <LogOut size={16} /> SIGN OUT
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Protected Route ---
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.accountStatus !== 'APPROVED') return <PendingApprovalScreen />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

// --- Inventory Manager ---
const InventoryManager = () => {
  const { user, firebaseUser } = useAuth();
  const defaultStock: Record<BloodGroup, number> = { 'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0 };
  const [stock, setStock] = useState<Record<BloodGroup, number>>(user?.stock || defaultStock);
  const [editingGroup, setEditingGroup] = useState<BloodGroup | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync stock from user profile when it changes
  useEffect(() => {
    if (user?.stock) setStock(user.stock);
  }, [user?.stock]);

  const handleStockChange = (group: BloodGroup, value: number) => {
    setStock((prev) => ({ ...prev, [group]: Math.max(0, value) }));
  };

  const handleSave = async () => {
    if (!firebaseUser) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // Update stock in 'users' collection (user profile)
      const { doc: firestoreDoc, updateDoc, serverTimestamp: ts } = await import('firebase/firestore');
      const { db: database } = await import('./lib/firebase');
      await updateDoc(firestoreDoc(database, 'users', firebaseUser.uid), {
        stock,
        updatedAt: ts(),
      });
      // Also update blood_banks collection for map display
      try {
        await updateDoc(firestoreDoc(database, 'blood_banks', firebaseUser.uid), {
          stock,
          updatedAt: ts(),
        });
      } catch {
        // blood_banks doc might not exist, that's ok
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      logger.error('Failed to save inventory:', err);
      alert('Failed to save inventory. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalUnits = Object.values(stock).reduce((a: number, b: number) => a + b, 0);
  const lowStockGroups = Object.entries(stock).filter(([, v]) => (v as number) < 10).length;

  return (
    <div className="p-8 md:p-14 bg-slate-50 min-h-full max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter">Inventory Control</h1>
          <p className="text-slate-400 font-bold mt-2 flex items-center gap-2">
            <MapPin size={18} className="text-blue-600" /> {user?.name || "Blood Bank"}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setIsRefreshing(true);
              if (user?.stock) setStock(user.stock);
              setTimeout(() => setIsRefreshing(false), 600);
            }}
            className="flex-1 md:flex-none bg-white border-2 border-slate-200 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> RESET
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 md:flex-none px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg ${
              saveSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-200'
                : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700'
            } disabled:opacity-60`}
          >
            {isSaving ? (
              <><RefreshCw size={16} className="animate-spin" /> SAVING...</>
            ) : saveSuccess ? (
              <><Package size={16} /> SAVED ✓</>
            ) : (
              <><Package size={16} /> SAVE STOCK</>
            )}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Units</p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter mt-1">{totalUnits}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blood Groups</p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter mt-1">8</p>
        </div>
        <div className={`p-5 rounded-2xl border ${lowStockGroups > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest ${lowStockGroups > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>Low Stock Alerts</p>
          <p className={`text-3xl font-black tracking-tighter mt-1 ${lowStockGroups > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{lowStockGroups}</p>
        </div>
      </div>

      {/* Editable Stock Grid */}
      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <Package className="text-blue-600" /> Stock Levels
          </h3>
          <p className="text-xs font-bold text-slate-400">Click any value to edit</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {(Object.entries(stock) as [BloodGroup, number][]).map(([group, units]) => {
            const isLow = units < 10;
            const isEditing = editingGroup === group;

            return (
              <div
                key={group}
                onClick={() => setEditingGroup(group)}
                className={`relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer group ${
                  isEditing
                    ? 'bg-blue-50 border-blue-300 shadow-lg shadow-blue-100 ring-2 ring-blue-200'
                    : isLow
                    ? 'bg-rose-50 border-rose-200 hover:border-rose-300 hover:shadow-md'
                    : 'bg-slate-50/30 border-slate-100 hover:border-slate-200 hover:shadow-md'
                }`}
              >
                <span className="text-xs font-black text-slate-400 mb-2 block tracking-[0.2em]">{group}</span>

                {isEditing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStockChange(group, units - 1); }}
                      className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl font-black text-lg hover:bg-rose-200 active:scale-90 transition-all flex items-center justify-center"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={units}
                      onChange={(e) => handleStockChange(group, parseInt(e.target.value) || 0)}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => setEditingGroup(null)}
                      autoFocus
                      min={0}
                      className="w-16 text-center text-3xl font-black tracking-tighter bg-white border-2 border-blue-200 rounded-xl py-1 focus:outline-none focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStockChange(group, units + 1); }}
                      className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl font-black text-lg hover:bg-emerald-200 active:scale-90 transition-all flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <span className={`text-4xl font-black tracking-tighter block ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                    {units}
                  </span>
                )}

                {isLow && !isEditing && (
                  <span className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full animate-pulse" />
                )}
              </div>
            );
          })}
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
  if (user.accountStatus !== 'APPROVED') return <PendingApprovalScreen />;
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
          <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AdminPanel /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={[UserRole.BLOOD_BANK]}><InventoryManager /></ProtectedRoute>} />
          <Route path="/seed" element={
            <div className="min-h-screen flex items-center justify-center p-4">
              <button onClick={async () => {
                try {
                  await clearAndSeedDatabase();
                  alert('Seeded successfully!');
                  window.location.href = '/';
                } catch (e) {
                  alert('Error: ' + e);
                }
              }} className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold">RUN SEEDER</button>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AuthGateChat />
      </Router>
    </AuthProvider>
  );
};

export default App;
