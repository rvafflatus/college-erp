"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        // Fetch logs and join with student names from the 'students' table
        const { data, error } = await supabase
          .from('attendance_logs')
          .select(`
            id,
            status,
            marked_date,
            students (
              name,
              roll_number
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center">
      
      {/* Header Banner */}
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

      {/* Main Body */}
      <section className="w-full max-w-4xl px-4 py-12 flex-grow">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            Historical Attendance Archives
          </h2>
          <p className="text-slate-500 font-medium">
            Reviewing all real-time cloud data entries submitted to the system.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Retrieving historical records...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                  No historical logs found in the cloud filing cabinet yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 sm:p-6 flex justify-between items-center bg-white hover:bg-slate-50/50 transition-colors">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">
                        {log.students?.name || 'Unknown Student'}
                      </h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                        Roll ID: {log.students?.roll_number || 'N/A'} • Date: {log.marked_date}
                      </p>
                    </div>
                    
                    <span className={`px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      log.status === 'Present' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}