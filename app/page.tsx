import React from 'react';
import Link from 'next/link';

export default function Home() {
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
        <div className="mt-3 md:mt-0 bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full">
          Level 1 Prototype
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
          
          {/* CARD 1: ATTENDANCE (Now Clickable) */}
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

          {/* CARD 2: FEE LEDGER (Coming Soon Static Card) */}
          <div className="p-8 bg-slate-100/70 border border-slate-200/50 rounded-2xl text-center flex flex-col items-center justify-center h-48 opacity-60">
            <span className="text-5xl mb-4 grayscale">
              💳
            </span>
            <h3 className="text-2xl font-bold text-slate-400">
              Fee Ledger
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Coming Soon
            </p>
          </div>

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
              Prototype structure is now live. Cloud database synchronization verified.
            </p>
          </div>
        </div>

      </section>
    </main>
  );
}