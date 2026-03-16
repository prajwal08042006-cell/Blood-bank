
import React from 'react';
import { Droplets, Map as MapIcon, Heart, ShieldAlert, BarChart3, LogOut, Package } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { UserRole } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getNavItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case UserRole.ADMIN:
        return [
          { name: 'System Overview', path: '/admin', icon: <BarChart3 size={20} /> },
          { name: 'Live Map', path: '/map', icon: <MapIcon size={20} /> },
        ];
      case UserRole.BLOOD_BANK:
        return [
          { name: 'Inventory', path: '/inventory', icon: <Package size={20} /> },
          { name: 'Live Map', path: '/map', icon: <MapIcon size={20} /> },
        ];
      case UserRole.USER:
      default:
        return [
          { name: 'Live Map', path: '/map', icon: <MapIcon size={20} /> },
          { name: 'Emergency Request', path: '/emergency', icon: <ShieldAlert size={20} /> },
          { name: 'My Impact', path: '/history', icon: <Heart size={20} /> },
        ];
    }
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-2">
          <div className={`p-2 rounded-lg ${
            user?.role === UserRole.ADMIN ? 'bg-slate-800' : 
            user?.role === UserRole.BLOOD_BANK ? 'bg-blue-600' : 'bg-rose-600'
          }`}>
            <Droplets className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">BloodLife AI</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <div className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {user?.role} Workspace
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const activeColor = user?.role === UserRole.ADMIN ? 'bg-slate-100 text-slate-900' :
                              user?.role === UserRole.BLOOD_BANK ? 'bg-blue-50 text-blue-600' :
                              'bg-rose-50 text-rose-600';
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? `${activeColor} font-semibold` 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              user?.role === UserRole.ADMIN ? 'bg-slate-600' : 
              user?.role === UserRole.BLOOD_BANK ? 'bg-blue-500' : 'bg-rose-500'
            }`}>
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-800">{user?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-black">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-500 hover:text-rose-600 w-full px-3 py-2 text-sm transition-colors font-semibold"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Nav */}
        <div className="md:hidden glass border-b border-slate-200 p-4 flex justify-between items-center z-50">
           <div className="flex items-center gap-2">
            <Droplets className="text-rose-600" size={24} />
            <span className="font-bold text-slate-800">BloodLife</span>
          </div>
          <button onClick={handleLogout} className="p-2 bg-slate-100 rounded-lg text-slate-600"><LogOut size={20}/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
