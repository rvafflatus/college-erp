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

  // Master Lists from Database
  const [courseList, setCourseList] = useState<any[]>([]);

  // Admin Form States
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'add_student' | 'add_teacher' | 'add_course'>('overview');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentCourse, setNewStudentCourse] = useState('');
  const [newStudentFees, setNewStudentFees] = useState('25000');
  
  const [newTeacherUser, setNewTeacherUser] = useState('');
  const [newTeacherPass, setNewTeacherPass] = useState('');

  const [newCourseName, setNewCourseName] = useState('');
  
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

  const fetchCourses = async () => {
    try {
      const { data, error: courseErr } = await supabase
        .from('courses')
        .select('*')
        .order('course_name', { ascending: true });
      if (!courseErr && data) {
        setCourseList(data);
        if (data.length > 0 && !newStudentCourse) {
          setNewStudentCourse(data[0].course_name);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    if (isLoggedIn) {
      loadMetrics();
      fetchCourses();
    }
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

  // Safely Create Student with Roll Validation Checks
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg('');
    setAdminErrMsg('');

    const rollNum = parseInt(newStudentRoll);
    const selectedBatch = newStudentCourse || (courseList[0]?.course_name);

    if (!selectedBatch) {
      setAdminErrMsg('Please create a course track first before enrolling students.');
      return;
    }

    try {
      // Check if Roll Number already exists to prevent duplicate failures
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id, name')
        .eq('roll_number', rollNum)
        .maybeSingle();

      if (existingStudent) {
        setAdminErrMsg(`Roll ID ${rollNum} is already assigned to ${existingStudent.name}. Use a unique Roll Number.`);
        return;
      }

      // Step 1: Insert Student Profile row
      const { data: studentData, error: studentErr } = await supabase
        .from('students')
        .insert([{ name: newStudentName.trim(), roll_number: rollNum, course: selectedBatch }])
        .select()
        .single();

      if (studentErr || !studentData) throw new Error('Student profile block failed.');

      // Step 2: Insert matching financial row ledger card
      const { error: feeErr } = await supabase
        .from('fee_ledger')
        .insert([{ student_id: studentData.id, total_fees: parseFloat(newStudentFees), fees_paid: 0 }]);

      if (feeErr) {
        // Cleanup orphaned student row if subsequent steps fail
        await supabase.from('students').delete().eq('id', studentData.id);
        throw new Error('Fee ledger configuration failed.');
      }

      // Step 3: Register unique client credential gateway
      const studentUsername = newStudentName.trim().toLowerCase().replace(/\s+/g, '');
      const { error: userErr } = await supabase
        .from('portal_users')
        .insert([{ username: studentUsername, password: 'student123', role: 'student', associated_course: selectedBatch, student_id: studentData.id }]);

      if (userErr) {
        await supabase.from('students').delete().eq('id', studentData.id);
        throw new Error('User authentication gateway generation failed.');
      }

      setAdminSuccessMsg(`Shabaash! ${newStudentName.trim()} admitted cleanly. Portal Login ID: "${studentUsername}"`);
      setNewStudentName('');
      setNewStudentRoll('');
      loadMetrics();
    } catch (err: any) {
      console.error(err);
      setAdminErrMsg(err.message || 'Failed to complete registration pipelines.');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg('');
    setAdminErrMsg('');

    try {
      const { error: courseErr } = await supabase
        .from('courses')
        .insert([{ course_name: newCourseName.trim() }]);

      if (courseErr) throw courseErr;

      setAdminSuccessMsg(`Success! New course track "${newCourseName}" active inside ERP databases.`);
      setNewCourseName('');
      fetchCourses();
    } catch (err) {
      setAdminErrMsg('Course name identification token already registered.');
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSuccessMsg('');
    setAdminErrMsg('');

    try {
      const { error: teacherErr } = await supabase
        .from('portal_users')
        .insert([{ username: newTeacherUser.trim().toLowerCase(), password: newTeacherPass, role: 'teacher' }]);

      if (teacherErr) throw teacherErr;

      setAdminSuccessMsg(`Success! Faculty profile user "${newTeacherUser}" ready.`);
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
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800">
            {userRole === 'admin' && "Institutional Administrative Control Hub"}
            {userRole === 'teacher' && "Staff Instruction Command Room"}
            {userRole === 'student' && `Student Academic Terminal`}
          </h2>
          <p className="text-slate-500 font-medium mt-1">Secure real-time cloud data synchronization verified.</p>
        </div>

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

        {userRole === 'admin' && (
          <div className="max-w-4xl mx-auto bg-white border border-slate-200/60 rounded-3xl shadow-md overflow-hidden mb-10">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex gap-3 overflow-x-auto">
              <button onClick={() => { setActiveAdminTab('overview'); setAdminSuccessMsg(''); setAdminErrMsg(''); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeAdminTab === 'overview' ? 'bg-cyan-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>Control Overview</button>
              <button onClick={() => { setActiveAdminTab('add_course'); setAdminSuccessMsg(''); setAdminErrMsg(''); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeAdminTab === 'add_course' ? 'bg-cyan-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>+ Add New Course</button>
              <button onClick={() => { setActiveAdminTab('add_student'); setAdminSuccessMsg(''); setAdminErrMsg(''); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeAdminTab === 'add_student' ? 'bg-cyan-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>+ Admit New Student</button>
              <button onClick={() => { setActiveAdminTab('add_teacher'); setAdminSuccessMsg(''); setAdminErrMsg(''); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeAdminTab === 'add_teacher' ? 'bg-cyan-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>+ Register Teacher</button>
            </div>

            <div className="p-6 min-h-[220px]">
              {adminSuccessMsg && <p className="mb-4 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">{adminSuccessMsg}</p>}
              {adminErrMsg && <p className="mb-4 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-xl text-center">{adminErrMsg}</p>}

              {activeAdminTab === 'overview' && (
                <div className="text-left space-y-2">
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Dynamic Content Configurations Active</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Welcome to the master control engine. Use the management panels to scale your institution infrastructure. Adding a new course instantly loads it into the student registry dropdown selector logic across the portal systems.
                  </p>
                </div>
              )}

              {activeAdminTab === 'add_course' && (
                <form onSubmit={handleCreateCourse} className="flex flex-col sm:flex-row gap-3 text-left max-w-xl items-end">
                  <div className="flex-grow w-full">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">New Course Name</label>
                    <input type="text" placeholder="e.g., RSCIT New Batch" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-medium text-slate-800" required />
                  </div>
                  <button type="submit" className="bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 h-[34px] rounded-xl shadow-sm transition-all whitespace-nowrap">Save Course Track</button>
                </form>
              )}

              {activeAdminTab === 'add_student' && (
                <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Full Student Name</label>
                    <input type="text" placeholder="e.g., Dheeraj Mittal" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-medium text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Unique Roll Number</label>
                    <input type="number" placeholder="e.g., 210" value={newStudentRoll} onChange={(e) => setNewStudentRoll(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-medium text-slate-800" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Course Track</label>
                    <select value={newStudentCourse} onChange={(e) => setNewStudentCourse(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-bold text-slate-800 h-[34px]">
                      {courseList.map((course) => (
                        <option key={course.id} value={course.course_name}>{course.course_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Course Total Base Fee (INR)</label>
                    <input type="number" value={newStudentFees} onChange={(e) => setNewStudentFees(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-cyan-700 font-medium text-slate-800" required />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button type="submit" className="bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-2 rounded-xl shadow-sm transition-all">Admit Student</button>
                  </div>
                </form>
              )}

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link href="/attendance" className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg text-center flex flex-col items-center justify-center h-40 transition-all group">
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">📝</span>
            <h4 className="text-lg font-bold text-slate-800">Attendance Roster</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Mark Logs</p>
          </Link>

          <Link href={userRole === 'student' ? '/fees' : '/history'} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg text-center flex flex-col items-center justify-center h-40 transition-all group">
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{userRole === 'student' ? '💳' : '📊'}</span>
            <h4 className="text-lg font-bold text-slate-800">{userRole === 'student' ? 'My Fee Balances' : 'Audit Logs History'}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Inspect Database Feed</p>
          </Link>

          <Link href="/fees" className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg text-center flex flex-col items-center justify-center h-40 transition-all group">
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">💰</span>
            <h4 className="text-lg font-bold text-slate-800">{userRole === 'student' ? 'My Performance' : 'Fee Ledger Management'}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Inspect Ledger System</p>
          </Link>
        </div>
      </section>
    </main>
  );
}