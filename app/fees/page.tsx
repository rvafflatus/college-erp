"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FeesPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFees() {
      try {
        // Fetch fee entries and join them with student data
        const { data, error } = await supabase
          .from('fee_ledger')
          .select(`
            id,
            total_fees,
            fees_paid,
            students (
              name,
              roll_number,
              course
            )
          `);

        if (error) throw error;
        setRecords(data || []);
      } catch (error) {
        console.error('Error fetching financial ledger:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFees();
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

      {/* Main Content Body */}
      <section className="w-full max-w-5xl px-4 py-12 flex-grow">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            Finance & Fee Ledger
          </h2>
          <p className="text-slate-500 font-medium">
            Real-time balance tracking and tuition updates.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading Financial Records...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 shadow-md rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-100">
                    <th className="p-5">Student / Course</th>
                    <th className="p-5">Total Fees</th>
                    <th className="p-5">Paid Amount</th>
                    <th className="p-5">Pending Balance</th>
                    <th className="p-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {records.map((rec) => {
                    const balance = rec.total_fees - rec.fees_paid;
                    const isFullyPaid = balance <= 0;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Student Meta */}
                        <td className="p-5">
                          <p className="font-bold text-slate-800">{rec.students?.name || 'N/A'}</p>
                          <p className="text-xs font-bold text-cyan-700 mt-0.5">
                            Roll ID: {rec.students?.roll_number} • {rec.students?.course}
                          </p>
                        </td>
                        
                        {/* Financial Columns */}
                        <td className="p-5 font-semibold text-slate-600">₹{rec.total_fees}</td>
                        <td className="p-5 font-semibold text-emerald-600">₹{rec.fees_paid}</td>
                        <td className="p-5 font-bold text-rose-600">₹{balance}</td>
                        
                        {/* Status Pill Indicator */}
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            isFullyPaid 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {isFullyPaid ? 'Clear' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}