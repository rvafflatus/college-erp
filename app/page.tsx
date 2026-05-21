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
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Admin Form States
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'add_student' | 'add_teacher'>('overview');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentCourse, setNewStudentCourse] = useState('');
  const [newStudentFees, setNewStudentFees] = useState('25000');
  
  const [newTeacherUser, setNewTeacherUser] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');
  
  const [adminSuccessMsg, setAdminSuccessMsg] = useState('');
  const [adminErrMsg, setAdminErrMsg] = useState('');

  useEffect(() => {
    const cachedRole = localStorage.getItem('afflatus_user_role');
    const cachedMeta = localStorage.getItem('afflatus_user_meta');
    if (cachedRole) {
      setUserRole(cachedRole as any);
      if (cachedMeta) setUserMeta(JSON.parse(cachedMeta));
      setIsLoggedIn(true);
    }
  }, []);

  const loadMetrics = async () => {
    if (!isLoggedIn || !userRole) return;
    setLoadingMetrics(true);
    try {
      if (userRole === 'admin' || userRole === 'teacher') {
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { data: fees } = await supabase.from('fee_ledger').select('total_fees, fees_paid');
        const totalOut = (fees || []).reduce((acc, curr) => acc + (Number(curr.total_fees) - Number(curr.fees_paid)), 0);
        setMetrics({ students: count || 0, pending: totalOut });
      } else if (userRole === 'student' && userMeta) {
        const { data: fee } = await supabase.from('fee_ledger').select('total_fees, fees_paid').eq('student_id', userMeta.student_id).single();
        if (fee) {
          setMetrics({ students: 1, pending: (Number(fee.total_fees) - Number(fee.fees_paid)) });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
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
        setError('Invalid login credentials.');
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
    setActiveAdminTab('overview');
  };

  // Admin Operation: Insert New Student into Database Roster
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg('');
    setAdminErrMsg('');

    try {
      // 1. Insert Profile into 'students' table
      const { data: studentData, error: studentErr } = await supabase
        .from('students')
        .insert([{ name: newStudentName, roll_number: parseInt(newStudentRoll), course: newStudentCourse }])
        .select()
        .single();

      if (studentErr || !studentData) throw studentErr;

      // 2. Insert corresponding financial base record into 'fee_ledger' table
      const { error: feeErr } = await supabase
        .from('fee_ledger')
        .insert([{ student_id: studentData.id, total_fees: parseFloat(newStudentFees), fees_paid: 0 }]);

      if (feeErr) throw feeErr;

      // 3. Auto-generate a student portal login account in 'portal_users' table
      const studentUsername = newStudentName.toLowerCase().replace(/\s+/g, '');
      await supabase
        .from('portal_users')
        .insert([{ username: studentUsername, password: 'student123', role: 'student', associated_course: newStudentCourse, student_id: studentData.id }]);

      setAdminSuccessMsg(`Success! ${newStudentName} registered. Portal Login ID created: "${studentUsername}"`);
      setNewStudentName('');
      setNewStudentRoll('');
      setNewStudentCourse('');
      loadMetrics(); // Refresh homepage counts
    } catch (err) {
      console.error(err);
      setAdminErrMsg('Failed to inject records. Check constraint parameters.');
    }
  };

  // Admin Operation: Register a New Faculty Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg('');
    setAdminErrMsg('');

    try {
      const { error: teacherErr } = await supabase
        .from('portal_users')
        .insert([{ username: newTeacherUser.trim().toLowerCase(), password: newTeacherPass, role: 'teacher' }]);

      if (teacherErr) throw teacherErr;

      setAdminSuccessMsg(`Success! Instructor account "${newTeacherUser}" active in portal database.`);
      setNewTeacherUser('');
      setNewTeacherPass('');
    } catch (err) {
      setAdminErrMsg('Username registration token already exists.');
    }
  };

  // --- SCREEN 1: LOGIN GATEWAY ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-cyan-800 text-white p-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Afflatus Portal</h1>
            <p className="text-xs text-cyan-200 uppercase tracking-wider font-semibold mt-1">Institutional Gateway</p>
          </div>
          <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Username ID</label>
              <input type="text" placeholder="owner, teacher, or student name" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-600 font-medium text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Portal Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-600 font-medium text-sm" required />
            </div>
            {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl text-center">{error}</p>}
            <button type="submit" className="w-full bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all">Sign In</button>
          </form>
        </div>
      </main>
    );
  }

  // --- SCREEN 2: AUTHENTICATED PORTAL VIEW ---
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full bg-cyan-800 text-white px-6 py-4 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Afflatus ERP</h1>
          <p className="text-xs text-cyan-200 mt-1 uppercase tracking-wider font-semibold">Authorized Profile Access: {userRole?.toUpperCase()}</p>
        </div>
        <button onClick={handleLogout} className="mt-3 md:mt-0 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm transition-all">Sign Out</button>
      </header>

      <section className="w-full max-w-5xl px-4 py-12 flex-grow">
        
        {/* Main Header Display Text */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800">
            {userRole === 'admin' && "Institutional Administrative Control Hub"}
            {userRole === 'teacher' && "Staff Instruction Command Room"}
            {userRole === 'student' && `Student Academic Terminal`}
          </h2>
          <p className="text-slate-500 font-medium mt-1">Secure real-time cloud data synchronization verified.</p>
        </div>

        {/* Global Overview Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{userRole === 'student' ? 'Enrolled Course' : 'Total Managed Registry'}</p>
            <h3 className="text-2xl font-black text-cyan-800 mt-1">{loadingMetrics ? '...' : userRole === 'student' ? `${userMeta?.associated_course}` : `${metrics.students} Active Profiles`}</h3>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{userRole === 'student' ? 'Outstanding Fees Balance' : 'Gross Uncollected Revenue'}</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">₹{loadingMetrics ? '...' : metrics.pending.toLocaleString()}</h3>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ⚙️ SPECIAL ADAPTIVE WINDOW: EXCLUSIVE ADMIN CONTROL SUB-PANEL */}
        {/* ========================================================================= */}
        {userRole === 'admin' && (
          <div className="max-w-4xl mx-auto bg-white border border-slate-200/60 rounded-3xl shadow-md overflow-hidden mb-10">
            {/* Inner Dashboard Admin Tabs Header Nav */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex gap-3 overflow-x-auto">
              <button onClick={() => { setActiveAdminTab('overview'); setAdminSuccessMsg(''); setAdminErrMsg(''); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeAdminTab === 'overview' ? 'bg-cyan-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Control Panel Overview</button>
              <button onClick={() => { setActiveAdminTab('add_student'); setAdminSuccessMsg(''); setAdminErrMsg(''); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeAdminTab === 'add_student' ? 'bg-cyan-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>+ Admit New Student</button>
              <button onClick={() => { setActiveAdminTab('add_teacher'); setAdminSuccessMsg(''); setAdminErrMsg(''); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeAdminTab === 'add_teacher' ? 'bg-cyan-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>+ Register New Teacher</button>
            </div>

            <div className="p-6 min-h-[220px]">
              {adminSuccessMsg && <p className="mb-4 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">{adminSuccessMsg}</p>}
              {adminErrMsg && <p className="mb-4 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-xl text-center">{adminErrMsg}</p>}

              {/* TAB 1: ADMIN OVERVIEW PANEL INTERACTION GUIDE */}
              {activeAdminTab === 'overview' && (
                <div className="text-left space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Administrative Tools Operational</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Welcome to the core management terminal. Use the action utility bars above to directly insert verified parameters into the database layer. Every newly admitted profile will automatically compute across billing ledgers and generate custom client login metrics dynamically.
                  </p>
                  <div className="pt-4 flex gap-2">
                    <span className="bg-cyan-50 border border-cyan-100 text-cyan-800 text-[10px] font-bold px-2.5 py-1 rounded">Real-Time Sync Online</span>
                    <span className="bg-purple-50 border border-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded">Relational Keys Active</span>
                  </div>
                </div>
              )}

              {/* TAB 2: ACTIVE NEW STUDENT ADMISSION FORM OPERATION */}
              {activeAdminTab === 'add_student' && (
                <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Student Name</label>
                    <input type="text" placeholder="e.g., Suresh Kumar" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-medium text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Unique Roll Number</label>
                    <input type="number" placeholder="e.g., 105" value={newStudentRoll} onChange={(e) => setNewStudentRoll(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-medium text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Assign Course Batch Name</label>
                    <input type="text" placeholder="e.g., RSCIT, B.C.A. 1st Year" value={newStudentCourse} onChange={(e) => setNewStudentCourse(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-medium text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tuition Course Fee Amount (INR)</label>
                    <input type="number" value={newStudentFees} onChange={(e) => setNewStudentFees(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-medium text-slate-800" required />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button type="submit" className="bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-2 rounded-xl shadow-sm transition-all">Execute Admission Registration</button>
                  </div>
                </form>
              )}

              {/* TAB 3: REGISTER NEW TEACHER FACULTY METHOD ACCOUNT */}
              {activeAdminTab === 'add_teacher' && (
                <form onSubmit={handleCreateTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Teacher Login Username</label>
                    <input type="text" placeholder="e.g., sunil_sir" value={newTeacherUser} onChange={(e) => setNewTeacherUser(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-medium text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Secure Portal Access Password</label>
                    <input type="text" placeholder="e.g., teacher123" value={newTeacherPass} onChange={(e) => setNewTeacherPass(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-medium text-slate-800" required />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button type="submit" className="bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-2 rounded-xl shadow-sm transition-all">Register Staff Account</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* System Core Interface Operation Links Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          
          {/* CARD 1: MARK ATTENDANCE */}
          {(userRole === 'admin' || userRole === 'teacher') ? (
            <Link href="/attendance" className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg text-center flex flex-col items-center justify-center h-40 transition-all group">
              <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📝</span>
              <h4 className="text-lg font-bold text-slate-800">Attendance Roster</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Mark Logs</p>
            </Link>
          ) : (
            <div className="p-6 bg-slate-100/50 border border-slate-200/40 rounded-2xl text-center flex flex-col items-center justify-center h-40 opacity-50">
              <span className="text-4xl mb-2 grayscale">📝</span>
              <h4 className="text-lg font-bold text-slate-400">Attendance Managed</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">By Faculty Instructor</p>
            </div>
          )}

          {/* CARD 2: BALANCES / HISTORY LOGS */}
          <Link href={userRole === 'student' ? '/fees' : '/history'} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg text-center flex flex-col items-center justify-center h-40 transition-all group">
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{userRole === 'student' ? '💳' : '📊'}</span>
            <h4 className="text-lg font-bold text-slate-800">{userRole === 'student' ? 'My Fee Balances' : 'Audit Logs History'}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Inspect Database Feed</p>
          </Link>

          {/* CARD 3: FEE MANAGEMENT (RESTRICTED FOR REGULAR TEACHERS, READ FOR STUDENTS, ADMIN UNLOCKED) */}
          {userRole === 'teacher' ? (
            <div className="p-6 bg-slate-100/50 border border-slate-200/40 rounded-2xl text-center flex flex-col items-center justify-center h-40 opacity-50">
              <span className="text-4xl mb-2 grayscale">💳</span>
              <h4 className="text-lg font-bold text-slate-400">Accounts Ledger</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Admin Access Only</p>
            </div>
          ) : (
            <Link href="/fees" className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg text-center flex flex-col items-center justify-center h-40 transition-all group">
              <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">💰</span>
              <h4 className="text-lg font-bold text-slate-800">{userRole === 'student' ? 'My Performance' : 'Fee Ledger Management'}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Inspect Ledger System</p>
            </Link>
          )}

        </div>
      </section>
    </main>
  );
}