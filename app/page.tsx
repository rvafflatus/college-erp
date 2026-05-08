import React from 'react';

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
        
        {/* Welcome Section */}
        <div className="mt-2">
          <h2 className="text-xl font-semibold text-gray-800 text-center">College Command Center</h2>
          <p className="text-sm text-gray-500 text-center">Welcome, Admin. System ready for 500 Students.</p>
        </div>

        {/* Primary Action Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:border-blue-500 transition-colors">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="font-bold text-gray-800">Attendance</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Level 1 Feature</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center hover:border-blue-500 transition-colors">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="font-bold text-gray-800">Fee Ledger</h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Level 1 Feature</p>
          </div>
        </div>

        {/* Digital Notice Board (Primary Feature) */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Digital Notice Board</h3>
            <button className="text-[#1a5f7a] text-xs font-semibold">+ New Notice</button>
          </div>
          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-[#1a5f7a]">
              <p className="text-sm font-bold text-[#1a5f7a]">Final Exam Schedule 2026</p>
              <p className="text-xs text-gray-600 mt-1">Exams start from June 15th. Check portal for details.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border-l-4 border-gray-300">
              <p className="text-sm font-bold text-gray-700">Holil Holiday Announcement</p>
              <p className="text-xs text-gray-500 mt-1">College will remain closed for 3 days starting March 5th.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Handy Footer */}
      <footer className="p-6 bg-gray-100 text-center border-t border-gray-200">
        <p className="text-xs text-gray-500 font-medium">Built by Afflatus • Tonk, Rajasthan</p>
        <p className="text-[10px] text-gray-400 mt-1">Support: +91 9782147688 | rv.afflatus@gmail.com</p>
      </footer>
    </div>
  );
}