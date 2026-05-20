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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinancialData() {
      try {
        // 1. Fetch overall fee structures
        const { data: feeData, error: feeErr } = await supabase
          .from('fee_ledger')
          .select(`id, total_fees, fees_paid, student_id, students (name, roll_number, course)`);
        if (feeErr) throw feeErr;

        // 2. Fetch individual itemized transaction logs
        const { data: txData, error: txErr } = await supabase
          .from('fee_transactions')
          .select('*')
          .order('payment_date', { ascending: false });
        if (txErr) throw txErr;

        setRecords(feeData || []);
        setTransactions(txData || []);
      } catch (error) {
        console.error('Error fetching financial ledger data streams:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFinancialData();
  }, []);

  const toggleExpand = (studentId: number) => {
    setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center">
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

      <section className="w-full max-w-5xl px-4 py-12 flex-grow">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Finance & Fee Ledger</h2>
          <p className="text-slate-500 font-medium">Click any student row to inspect dated installment histories.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Retrieving Itemized Financial Records...</p>
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
                    <th className="p-5 text-center">Receipts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {records.map((rec) => {
                    const studentId = rec.student_id;
                    const studentName = rec.students?.name || 'N/A';
                    const balance = rec.total_fees - rec.fees_paid;
                    const isExpanded = expandedStudentId === studentId;
                    
                    // Filter transactions specifically belonging to this student
                    const studentTx = transactions.filter(t => t.student_id === studentId);

                    return (
                      <React.Fragment key={rec.id}>
                        {/* MAIN ROW */}
                        <tr 
                          onClick={() => toggleExpand(studentId)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="p-5">
                            <p className="font-bold text-slate-800">{studentName}</p>
                            <p className="text-xs font-bold text-cyan-700 mt-0.5">
                              Roll ID: {rec.students?.roll_number} • {rec.students?.course}
                            </p>
                          </td>
                          <td className="p-5 font-semibold text-slate-600">₹{rec.total_fees}</td>
                          <td className="p-5 font-semibold text-emerald-600">₹{rec.fees_paid}</td>
                          <td className="p-5 font-bold text-rose-600">₹{balance}</td>
                          <td className="p-5 text-center">
                            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all">
                              {isExpanded ? 'Hide History ▲' : 'View History ▼'}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDABLE INSTALLMENT DETAIL DROPDOWN */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-slate-50/70 p-5 border-t border-b border-slate-100">
                              <div className="max-w-2xl mx-auto bg-white border border-slate-200/50 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                                  Official Payment Ledger Statement — {studentName}
                                </h4>
                                {studentTx.length === 0 ? (
                                  <p className="text-xs text-slate-400 font-medium py-2">
                                    No historical installment receipts logged in database for this profile.
                                  </p>
                                ) : (
                                  <div className="space-y-2.5">
                                    {studentTx.map((tx) => (
                                      <div key={tx.id} className="flex justify-between items-center bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-lg text-xs font-medium">
                                        <div className="flex items-center gap-2">
                                          <span className="text-emerald-600 text-base">🟢</span>
                                          <p className="text-slate-700 font-bold">Installment Collection Receipt</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-emerald-700 font-extrabold text-sm">₹{tx.amount_paid}</p>
                                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Cleared Date: {tx.payment_date}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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