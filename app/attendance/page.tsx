import React from 'react';
import Link from 'next/link'; // Import the Link component

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header with Afflatus Branding */}
      <header className="bg-[#1a5f7a] text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Afflatus ERP</h1>
            <p className="text-xs opacity-90 font-mono">GST: 08AEFPV3954D1ZA</p>
          </div>
          <div className="text-right">
            <span className="bg-white text-[#1a5f7a] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              LEVEL 1 PROTOTYPE
            </span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="flex-grow p-4 max-w-4xl mx-auto w-full space-y-6">
        <div className="mt-2 text-center">
          <h2 className="text-xl font-semibold text-gray-800">College Command Center</h2>
          <p className="text-sm text-gray-500">System ready for 500 Students & 50 Teachers.</p>
        </div>

        {/* Primary Action Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Link to Attendance Page */}
          <Link href="/attendance" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:border-[#1a5f7a] transition-all active:scale-95">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-bold text-gray-800">Attendance</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center">Mark logs</p>
          </Link>

          {/* Fee Ledger (Still a prototype div) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center opacity-60">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="font-bold text-gray-800">Fee Ledger</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center">Coming Soon</p>
          </div>
        </div>

        {/* Digital Notice Board Section */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Campus Notices</h3>
          <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-[#1a5f7a]">
            <p className="text-sm font-bold text-[#1a5f7a]">Welcome to Afflatus Portal</p>
            <p className="text-xs text-gray-600 mt-1">Prototype structure is now live.</p>
          </div>
        </section>
      </main>

      <footer className="p-6 bg-gray-100 text-center border-t border-gray-200">
        <p className="text-xs text-gray-500 font-medium">Afflatus • Tonk, Rajasthan</p>
        <p className="text-[10px] text-gray-400 mt-1">Support: 9782147688</p>
      </footer>
    </div>
  );
}