import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Users, CheckCircle, XCircle, FileText, Loader2, RefreshCw, Eye, Phone, Mail, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { getPendingUsers, approveUser, rejectUser } from '../services/firestoreService';
import { clearAndSeedDatabase, seedLoginableAccounts } from '../services/seedService';
import { logger } from '../lib/logger';

const AdminPanel: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeedingAccounts, setIsSeedingAccounts] = useState(false);

  const loadPendingUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const users = await getPendingUsers();
      setPendingUsers(users);
    } catch (err) {
      logger.error('Failed to load pending users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  const handleApprove = async (uid: string) => {
    setActionLoading(uid);
    try {
      await approveUser(uid);
      setPendingUsers((prev) => prev.filter((u) => u.id !== uid));
    } catch (err) {
      logger.error('Failed to approve user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uid: string) => {
    setActionLoading(uid);
    try {
      await rejectUser(uid);
      setPendingUsers((prev) => prev.filter((u) => u.id !== uid));
    } catch (err) {
      logger.error('Failed to reject user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-violet-100 p-3 rounded-2xl text-violet-600">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Admin Panel</h1>
            <p className="text-slate-500">Review and approve new user registrations.</p>
          </div>
        </div>
        <button
          onClick={loadPendingUsers}
          disabled={isLoading || isSeeding}
          className="bg-white border-2 border-slate-200 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>      {/* Admin Actions */}
      <div className="bg-red-50 border border-red-100 p-5 rounded-3xl flex items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-red-800 font-bold">Database Management</h3>
          <p className="text-red-600 text-sm">Clear existing data and seed with 200 donors, 20 blood banks, and admin.</p>
        </div>
        <button
          onClick={async () => {
            if (confirm('Are you sure? This will wipe the database and seed new data.')) {
              setIsSeeding(true);
              try {
                await clearAndSeedDatabase();
                alert('Seed complete! 200 donors, 20 blood banks, and 1 admin created. The app will reload.');
                window.location.reload();
              } catch (err) {
                console.error(err);
                alert('Seed failed. Check console.');
              } finally {
                setIsSeeding(false);
              }
            }
          }}
          disabled={isSeeding}
          className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-red-200 whitespace-nowrap"
        >
          {isSeeding ? <><Loader2 size={16} className="animate-spin" /> SEEDING...</> : 'SEED DATABASE'}
        </button>
      </div>

      {/* Seed Loginable Accounts */}
      <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl flex items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-emerald-800 font-bold">Create Demo Accounts</h3>
          <p className="text-emerald-600 text-sm">Create real loginable accounts: <strong>donor@bloodlife.in</strong> / donor123 &amp; <strong>bank@bloodlife.in</strong> / bank1234</p>
        </div>
        <button
          onClick={async () => {
            setIsSeedingAccounts(true);
            try {
              const result = await seedLoginableAccounts();
              const msg = [...result.success, ...result.failed].join('\n');
              alert('Demo Account Results:\n\n' + msg);
            } catch (err) {
              console.error(err);
              alert('Failed to create demo accounts. Check console.');
            } finally {
              setIsSeedingAccounts(false);
            }
          }}
          disabled={isSeedingAccounts}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 whitespace-nowrap"
        >
          {isSeedingAccounts ? <><Loader2 size={16} className="animate-spin" /> CREATING...</> : 'CREATE DEMO ACCOUNTS'}
        </button>
      </div>

      {/* Stats */}
      <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl flex items-center gap-4 mb-8">
        <Users className="text-amber-600" size={24} />
        <p className="text-amber-800 font-bold">
          {pendingUsers.length} pending approval{pendingUsers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-slate-300" size={40} />
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center">
          <CheckCircle className="text-emerald-500 mx-auto mb-3" size={40} />
          <p className="font-bold text-emerald-800">All caught up!</p>
          <p className="text-emerald-600 text-sm mt-1">No pending registrations to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((pendingUser) => {
            const isExpanded = expandedUser === pendingUser.id;
            const isActioning = actionLoading === pendingUser.id;
            const isBank = pendingUser.role === UserRole.BLOOD_BANK;

            return (
              <div key={pendingUser.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Header */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-all"
                  onClick={() => setExpandedUser(isExpanded ? null : pendingUser.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg ${
                      isBank ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {pendingUser.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{pendingUser.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          isBank ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {isBank ? 'Blood Bank' : 'Donor'}
                        </span>
                        <span className="text-xs text-slate-400">{pendingUser.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {!isExpanded && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApprove(pendingUser.id); }}
                          disabled={isActioning}
                          className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600 disabled:opacity-50 transition-all"
                        >
                          {isActioning ? <Loader2 className="animate-spin" size={14} /> : 'Approve'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReject(pendingUser.id); }}
                          disabled={isActioning}
                          className="bg-rose-500 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-rose-600 disabled:opacity-50 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-6 bg-slate-50/50 space-y-4">
                    {/* Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100">
                        <Mail size={16} className="text-slate-400" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                          <p className="text-sm font-bold text-slate-800">{pendingUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100">
                        <Phone size={16} className="text-slate-400" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                          <p className="text-sm font-bold text-slate-800">{pendingUser.phone || 'N/A'}</p>
                        </div>
                      </div>
                      {isBank && (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100">
                          <MapPin size={16} className="text-slate-400" />
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                            <p className="text-sm font-bold text-slate-800">{pendingUser.location?.address || 'N/A'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Extra Info */}
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-xs font-bold border border-rose-100">
                        Blood: {pendingUser.bloodGroup}
                      </span>
                      {pendingUser.licenseNumber && (
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                          License: {pendingUser.licenseNumber}
                        </span>
                      )}
                    </div>

                    {/* Documents */}
                    <div>
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Uploaded Documents</h5>
                      {pendingUser.documents.length === 0 ? (
                        <p className="text-slate-400 text-sm">No documents uploaded.</p>
                      ) : (
                        <div className="space-y-2">
                          {pendingUser.documents.map((docItem) => (
                            <div key={docItem.id} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100">
                              <FileText size={18} className="text-blue-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{docItem.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{docItem.type} • {docItem.status}</p>
                              </div>
                              {docItem.data && (
                                <a
                                  href={docItem.data}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={docItem.name}
                                  className="text-blue-500 hover:text-blue-700 flex items-center gap-1 text-xs font-bold"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye size={14} /> View
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(pendingUser.id)}
                        disabled={isActioning}
                        className="flex-1 bg-emerald-500 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200"
                      >
                        {isActioning ? <Loader2 className="animate-spin" size={16} /> : <><CheckCircle size={16} /> Approve Account</>}
                      </button>
                      <button
                        onClick={() => handleReject(pendingUser.id)}
                        disabled={isActioning}
                        className="flex-1 bg-rose-500 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-200"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
