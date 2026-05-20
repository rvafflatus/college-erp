"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | 'student' | null>(null);
  const [userMeta, setUserMeta] = useState<any>(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState({ students: 0, pending: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cachedRole = localStorage.getItem('afflatus_user_role');
    const cachedMeta = localStorage.getItem('afflatus_user_meta');
    if (cachedRole) {
      setUserRole(cachedRole as any);
      if (cachedMeta) setUserMeta(JSON.parse(cachedMeta));
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !userRole) return;
    
    async function loadMetrics() {
      setLoading(true);
      try {
        if (userRole === 'admin' || userRole === 'teacher') {
          const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
          const { data: fees } = await supabase.from('fee_ledger').select('total_fees, fees_paid');
          const totalOut = (fees || []).reduce((acc, curr) => acc + (Number(curr.total_fees) - Number(curr.fees_paid)), 0);
          setMetrics({ students: count || 0, pending: totalOut });
        } else if (userRole === 'student' && userMeta) {
          // Individual student view metrics calculations
          const { data: fee } = await supabase.from('fee_ledger').select('total_fees, fees_paid').eq('student_id', userMeta.student_id).single();
          if (fee) {
            setMetrics({ students: 1, pending: (Number(fee.total_fees) - Number(fee.fees_paid)) });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [isLoggedIn, userRole, userMeta]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data, error: fetchErr } = await supabase
        .from('portal_users')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .eq('password', password)
        .single();

      if (fetchErr || !data) {
        setError('Invalid login identifier credentials.');
        return;
      }

      localStorage.setItem('afflatus_user_role', data.role);
      localStorage.setItem('afflatus_user_meta', JSON.stringify(data));
      setUserRole(data.role);
      setUserMeta(data);
      setIsLoggedIn(true);
    } catch (err) {
      setError('Connection failure.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole(null);
    setUserMeta(null);
    setUsername('');
    setPassword('');
  };

  // --- SCREEN 1: LOGIN GATEWAY ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-cyan-800 text-white p-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Afflatus Portal</h1>
            <p className="text-xs text-cyan-200 uppercase tracking-wider font-semibold mt-1">Multi-Role Gatekeeper</p>
          </div>
          <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Username / Registration ID</label>
              <input type="text" placeholder="e.g., rahul, teacher, owner" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-600 font-medium text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Security Key Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-600 font-medium text-sm" required />
            </div>
            {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl text-center">{error}</p>}
            <button type="submit" className="w-full bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all">Authenticate Credentials</button>
          </form>
        </div>
      </main>
    );
  }

  // --- SCREEN 2: COMPREHENSIVE CONTROL INTERFACES ---
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full bg-cyan-800 text-white px-6 py-4 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Afflatus ERP</h1>
          <p className="text-xs text-cyan-200 mt-1 uppercase tracking-wider font-semibold">Role Profile: {userRole}</p>
        </div>
        <button onClick={handleLogout} className="mt-3 md:mt-0 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm transition-all">Sign Out</button>
      </header>

      <section className="w-full max-w-5xl px-4 py-12 flex-grow">
        <h2 className="text-3xl font-extrabold text-slate-800 text-center mb-2">
          {userRole === 'admin' && "Institutional Control Center"}
          {userRole === 'teacher' && "Staff Command Room"}
          {userRole === 'student' && `Student Academic Terminal: ${username.toUpperCase()}`}
        </h2>
        <p className="text-slate-500 font-medium text-center mb-8">Secure system pipelines verified.</p>

        {/* Dynamic Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto mb-10">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{userRole === 'student' ? 'Enrolled Status' : 'Managed Registry'}</p>
            <h3 className="text-2xl font-black text-cyan-800 mt-1">{loading ? '...' : userRole === 'student' ? `${userMeta?.associated_course}` : `${metrics.students} Active Students`}</h3>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{userRole === 'student' ? 'Your Outstanding Fees' : 'Gross Uncollected Revenue'}</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">₹{metrics.pending.toLocaleString()}</h3>
          </div>
        </div>

        {/* Dashboard Grid Map Rules Based On User Type Roles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          
          {/* ACTION 1: ATTENDANCE BLOCK */}
          {(userRole === 'admin' || userRole === 'teacher') ? (
            <Link href="/attendance" className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg text-center flex flex-col items-center justify-center h-40 transition-all">
              <span className="text-3xl mb-2">📝</span>
              <h4 className="text-lg font-bold text-slate-800">Attendance Roster</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Mark Student Logs</p>
            </Link>
          ) : (
            <div className="p-6 bg-slate-100/50 border border-slate-200/40 rounded-2xl text-center flex flex-col items-center justify-center h-40 opacity-50">
              <span className="text-3xl mb-2 grayscale">📝</span>
              <h4 className="text-lg font-bold text-slate-400">Attendance Logged</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Managed By Instructor</p>
            </div>
          )}

          {/* ACTION 2: VIEW ARCHIVES / PERSONAL STATS */}
          <Link href={userRole === 'student' ? '/fees' : '/history'} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg text-center flex flex-col items-center justify-center h-40 transition-all">
            <span className="text-3xl mb-2">{userRole === 'student' ? '💳' : '📊'}</span>
            <h4 className="text-lg font-bold text-slate-800">{userRole === 'student' ? 'My Fee Balances' : 'Audit Logs History'}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Inspect Database Feed</p>
          </Link>

          {/* ACTION 3: THE BRAND NEW DIGITAL NOTES DOCUMENT VAULT */}
          <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg text-center flex flex-col items-center justify-center h-44 border-t-4 border-cyan-600 transition-all cursor-pointer" onClick={() => alert('Launching Course Content Cloud Bucket Vault in next phase level module!')}>
            <span className="text-3xl mb-2">📚</span>
            <h4 className="text-lg font-bold text-slate-700">Course Notes Vault</h4>
            <p className="text-[10px] text-cyan-700 font-bold uppercase mt-1">
              {userRole === 'student' ? 'Download PDF Handouts' : 'Upload Syllabus Resources'}
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}