"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AttendancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from your Supabase table
  useEffect(() => {
    async function fetchStudents() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('roll_number', { ascending: true });
        
        if (error) throw error;
        setStudents(data || []);
      } catch (error) {
        console.error('Error connecting to database:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center">
      
      {/* Synchronized Header Banner */}
      <header className="w-full bg-cyan-800 text-white px-6 py-4 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Afflatus ERP</h1>
          <p className="text-xs text-cyan-200 mt-1 uppercase tracking-wider font-semibold">
            GST : 08AEFPV3954D1ZA
          </p>
        </div>
        <Link href="/" className="mt-3 md:mt-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all">
          ← Back to Dashboard
        </Link>
      </header>

      {/* Main Student Roster Body */}
      <section className="w-full max-w-4xl px-4 py-12 flex-grow">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            Daily Attendance Roster
          </h2>
          <p className="text-slate-500 font-medium">
            Select student metrics below to log live database verification.
          </p>
        </div>

        {/* Database Load Handling */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Syncing with Supabase Cloud Database...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No active student profiles discovered inside table schema.
                </div>
              ) : (
                students.map((student) => (
                  <div key={student.id} className="p-4 sm:p-6 flex justify-between items-center bg-white hover:bg-slate-50/50 transition-colors">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">{student.name}</h4>
                      <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide mt-0.5">
                        Roll ID: {student.roll_number}
                      </p>
                    </div>
                    
                    {/* Toggle Indicator Button */}
                    <button className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-all">
                      Present
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Form Footer Execution Action */}
            <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex justify-end">
              <button 
                onClick={() => alert('Attendance metrics cached successfully for Level 1 demo!')}
                className="bg-cyan-800 hover:bg-cyan-900 text-white font-bold text-sm uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-sm transition-all"
              >
                Submit Logs
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}