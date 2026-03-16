
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Users, Droplets, Clock, TrendingUp, MapPin, Download, ShieldCheck, MoreVertical } from 'lucide-react';
import { useAuth } from '../App';

const dataTrend = [
  { name: 'Mon', requests: 45, donations: 62 },
  { name: 'Tue', requests: 78, donations: 55 },
  { name: 'Wed', requests: 52, donations: 91 },
  { name: 'Thu', requests: 124, donations: 88 },
  { name: 'Fri', requests: 89, donations: 122 },
  { name: 'Sat', requests: 156, donations: 104 },
  { name: 'Sun', requests: 94, donations: 142 },
];

const dataGroups = [
  { name: 'O+', value: 4500 },
  { name: 'A+', value: 3200 },
  { name: 'B+', value: 3100 },
  { name: 'O-', value: 800 },
];

const COLORS = ['#e11d48', '#fb7185', '#fda4af', '#fff1f2'];

const AnalyticsDashboard: React.FC = () => {
  const { allUsers } = useAuth();

  return (
    <div className="p-8 md:p-12 bg-slate-50 min-h-full max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Karnataka Health Analytics</h1>
          <p className="text-slate-500 font-medium">Integrated Command & Control Center Portal</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => alert("Generating Statewide Report...")} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Download size={16} /> Export State Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Statewide Donors', value: allUsers.length.toString(), icon: <Users />, color: 'bg-blue-600', trend: '+12%' },
          { label: 'Active KA Requests', value: '428', icon: <Activity />, color: 'bg-rose-600', trend: '-2%' },
          { label: 'Donations (Month)', value: '12,482', icon: <Droplets />, color: 'bg-emerald-600', trend: '+5%' },
          { label: 'State Avg Response', value: '11.4m', icon: <Clock />, color: 'bg-amber-600', trend: '-0.5m' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:scale-150 transition-all duration-700 ${stat.color}`}></div>
            <div className={`${stat.color} text-white p-3 rounded-2xl w-fit mb-6 shadow-lg shadow-slate-100`}>
              {React.cloneElement(stat.icon as any, { size: 24 })}
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</h3>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="font-black text-slate-800 text-xl mb-10 flex items-center gap-2">
            <TrendingUp className="text-rose-600" /> Karnataka Weekly Pattern
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataTrend}>
                <defs>
                  <linearGradient id="colorReqState" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} />
                <Tooltip />
                <Area type="monotone" dataKey="requests" stroke="#e11d48" strokeWidth={4} fillOpacity={1} fill="url(#colorReqState)" dot={{r: 4, fill: '#fff', stroke: '#e11d48', strokeWidth: 2}} />
                <Area type="monotone" dataKey="donations" stroke="#10b981" strokeWidth={4} fillOpacity={0} dot={{r: 4, fill: '#fff', stroke: '#10b981', strokeWidth: 2}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h3 className="font-black text-slate-800 text-xl mb-10">System Users</h3>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {allUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">{u.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-black text-slate-800">{u.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{u.role}</p>
                  </div>
                </div>
                <button onClick={() => alert(`Managing user ${u.name}`)} className="text-slate-300 hover:text-slate-600"><MoreVertical size={18} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-12 rounded-[3rem] relative shadow-2xl">
        <h3 className="text-4xl font-black tracking-tight mb-6">Regional Demand Heatmap</h3>
        <p className="text-slate-400 text-lg font-medium max-w-2xl mb-10">Real-time AI logic identifying Hubballi and Mysuru as potential supply-deficit zones for B- units in the next 72 hours.</p>
        <button onClick={() => alert("Opening interactive heatmap portal...")} className="bg-rose-600 px-10 py-4 rounded-2xl font-black hover:bg-rose-700 transition-all shadow-lg">View Detailed Heatmap</button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
