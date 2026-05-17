"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check if teacher logged in previously (Handy session storage)
  useEffect(() => {
    const session = localStorage.getItem('afflatus_teacher_session');
    if (session === 'active') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hardcoded credentials for the Level 2 Demo gate
    if (username.trim().toLowerCase() === 'teacher' && password === 'admin123') {
      localStorage.setItem('afflatus_teacher_session', 'active');
      setIsLoggedIn(true);
      setError('');
    } else {
      setError('Invalid Staff ID or Portal Password.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('afflatus_teacher_session');
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
  };

  // --- SCREEN 1: THE LOGIN GATEWAY ---
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-slate-200/60 rounded-3xl shadow-xl overflow-hidden">
          
          {/* Header Banner inside card */}
          <div className="bg-cyan-800 text-white p-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Afflatus ERP</h1>
            <p className="text-xs text-cyan-200 uppercase tracking-wider font-semibold mt-1">
              Secure Staff Gateway
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Staff Username
              </label>
              <input 
                type="text"
                placeholder="e.g., teacher"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-600 font-medium text-sm transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Portal Password
              </label>
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-600 font-medium text-sm transition-all"
                required
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl text-center">
                {error}
              </p>
            )}

            <button 
              type="submit"
              className="w-full bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all duration-150"
            >
              Sign In to Dashboard
            </button>
          </form>

        </div>
        <p className="text-xs text-slate-400 mt-6 font-medium">
          Authorized personnel access only. Registered GST: 08AEFPV3954D1ZA
        </p>
      </main>
    );
  }

  // --- SCREEN 2: THE SECURE COMMAND CENTER (YOUR DASHBOARD) ---
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center">
      
      {/* Professional Header Banner */}
      <header className="w-full bg-cyan-800 text-white px-6 py-4 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Afflatus ERP</h1>
          <p className="text-xs text-cyan-200 mt-1 uppercase tracking-wider font-semibold">
            GST : 08AEFPV3954D1ZA
          </p>
        </div>
        <div className="flex items-center gap-4 mt-3 md:mt-0">
          <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">
            Level 2 Secure Portal
          </div>
          <button 
            onClick={handleLogout}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-sm transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Command Center Body */}
      <section className="w-full max-w-6xl px-4 py-12 text-center flex-grow">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
          College Command Center
        </h2>
        <p className="text-slate-500 font-medium mb-10">
          System ready for 500 Students & 50 Teachers.
        </p>

        {/* Dashboard Grid Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-10">
          
          {/* CARD 1: ATTENDANCE */}
          <Link href="/attendance" className="group block cursor-pointer">
            <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-cyan-500/30 transition-all duration-300 text-center flex flex-col items-center justify-center h-48">
              <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                📝
              </span>
              <h3 className="text-2xl font-bold text-slate-800 group-hover:text-cyan-700 transition-colors">
                Attendance
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                Mark Logs
              </p>
            </div>
          </Link>

          {/* CARD 2: VIEW HISTORY (Now Active Link) */}
          <Link href="/history" className="group block cursor-pointer">
            <div className="p-8 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-cyan-500/30 transition-all duration-300 text-center flex flex-col items-center justify-center h-48">
              <span className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                📊
              </span>
              <h3 className="text-2xl font-bold text-slate-800 group-hover:text-cyan-700 transition-colors">
                View History
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                Database Archives
              </p>
            </div>
          </Link>

        </div>

        {/* Notice Board Area */}
        <div className="max-w-4xl mx-auto text-left bg-white border border-slate-100 shadow-sm rounded-2xl p-6">
          <h4 className="text-lg font-bold text-slate-800 mb-3">
            Campus Notices
          </h4>
          <div className="border-l-4 border-cyan-700 bg-cyan-50/50 p-4 rounded-r-xl">
            <h5 className="font-bold text-cyan-900 text-sm md:text-base">
              Welcome to Afflatus Portal
            </h5>
            <p className="text-xs md:text-sm text-cyan-700 mt-1">
              Security protocols active. Active teacher session tracking system verified.
            </p>
          </div>
        </div>

      </section>
    </main>
  );
}