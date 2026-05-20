"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FeesPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userMeta, setUserMeta] = useState<any>(null);
  
  // Administrative States
  const [records, setRecords] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
  
  // Student Personal States
  const [studentFee, setStudentFee] = useState<any>(null);
  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('afflatus_user_role');
    const meta = localStorage.getItem('afflatus_user_meta');
    setUserRole(role);
    if (meta) setUserMeta(JSON.parse(meta));
  }, []);

  useEffect(() => {
    if (!userRole) return;

    async function fetchPortalData() {
      try {
        if (userRole === 'admin' || userRole === 'teacher') {
          // Fetch master admin arrays
          const { data: feeData } = await supabase.from('fee_ledger').select(`id, total_fees, fees_paid, student_id, students (name, roll_number, course)`);
          const { data: txData } = await supabase.from('fee_transactions').select('*').order('payment_date', { ascending: false });
          setRecords(feeData || []);
          setTransactions(txData || []);
        } else if (userRole === 'student' && userMeta) {
          const sId = userMeta.student_id;
          
          // 1. Fetch personal single fee ledger row
          const { data: personalFee } = await supabase.from('fee_ledger').select(`total_fees, fees_paid, students (name, roll_number, course)`).eq('student_id', sId).single();
          setStudentFee(personalFee);

          // 2. Fetch personal itemized attendance logs history matching this student ID
          const { data: personalAttendance } = await supabase.from('attendance_logs').select('*').eq('student_id', sId).order('created_at', { ascending: false });
          setStudentAttendance(personalAttendance || []);
        }
      } catch (error) {
        console.error('Error streaming relational metrics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPortalData();
  }, [userRole, userMeta]);

  // Calculate Student Attendance Percentages
  const totalClasses = studentAttendance.length;
  const presentCount = studentAttendance.filter(a => a.status === 'Present').length;
  const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 100;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full bg-cyan-800 text-white px-6 py-4 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Afflatus ERP</h1>
          <p className="text-xs text-cyan-200 mt-1 uppercase tracking-wider font-semibold">Portal Gateway: {userRole}</p>
        </div>
        <Link href="/" className="mt-3 md:mt-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full transition-all">
          ← Dashboard
        </Link>
      </header>

      <section className="w-full max-w-5xl px-4 py-12 flex-grow">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Syncing Cloud Ledger Sheets...</p>
          </div>
        ) : userRole === 'student' ? (
          
          // ============================================================
          // 📱 CUSTOM STUDENT VIEW INTERFACE TERMINAL
          // ============================================================
          <div className="space-y-8 max-w-3xl mx-auto">
            
            {/* Student Header Summary Badge */}
            <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800">{studentFee?.students?.name}</h2>
                <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mt-1">
                  Roll ID: {studentFee?.students?.roll_number} • Class: {studentFee?.students?.course}
                </p>
              </div>
              <span className="bg-cyan-50 text-cyan-700 text-xs font-black px-4 py-2 rounded-full border border-cyan-100 uppercase tracking-wide">
                Student Profile Verified
              </span>
            </div>

            {/* Twin Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Card A: Live Performance Meter */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-md text-center flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Attendance Score</p>
                <div className={`text-5xl font-black mt-3 ${attendancePercentage >= 75 ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {attendancePercentage}%
                </div>
                <p className="text-xs font-medium text-slate-500 mt-2">
                  Logged Present for <span className="font-bold text-slate-700">{presentCount}</span> out of <span className="font-bold text-slate-700">{totalClasses}</span> sessions.
                </p>
              </div>

              {/* Card B: Individual Outstanding Liabilities */}
              <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-md text-center flex flex-col items-center justify-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Personal Account Balance</p>
                <div className="text-5xl font-black text-rose-600 mt-3">
                  ₹{(Number(studentFee?.total_fees) - Number(studentFee?.fees_paid)).toLocaleString()}
                </div>
                <p className="text-xs font-medium text-slate-500 mt-2">
                  Cleared Paid Volume: <span className="font-semibold text-emerald-600">₹{studentFee?.fees_paid}</span> / ₹{studentFee?.total_fees}
                </p>
              </div>

            </div>

            {/* Student Personal Calendar Logs Feed */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Your Attendance History Log</h3>
              {studentAttendance.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium py-4 text-center">No daily roll-call records synchronized to this account ledger yet.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 divide-y divide-slate-50">
                  {studentAttendance.map((att) => (
                    <div key={att.id} className="flex justify-between items-center py-3 first:pt-0">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Daily Roll-Call Verification</p>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">Timestamp Date: {att.marked_date}</p>
                      </div>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                        att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          
          // ============================================================
          // 🏛️ MASTER ADMINISTRATIVE VIEW INTERFACE (ADMIN / TEACHERS)
          // ============================================================
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
                    const studentTx = transactions.filter(t => t.student_id === studentId);

                    return (
                      <React.Fragment key={rec.id}>
                        <tr onClick={() => setExpandedStudentId(isExpanded ? null : studentId)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                          <td className="p-5">
                            <p className="font-bold text-slate-800">{studentName}</p>
                            <p className="text-xs font-bold text-cyan-700 mt-0.5">Roll ID: {rec.students?.roll_number} • {rec.students?.course}</p>
                          </td>
                          <td className="p-5 font-semibold text-slate-600">₹{rec.total_fees}</td>
                          <td className="p-5 font-semibold text-emerald-600">₹{rec.fees_paid}</td>
                          <td className="p-5 font-bold text-rose-600">₹{balance}</td>
                          <td className="p-5 text-center">
                            <button className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wide px-3 py-1.5 rounded-lg">
                              {isExpanded ? 'Hide History ▲' : 'View History ▼'}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-slate-50/70 p-5 border-t border-b border-slate-100">
                              <div className="max-w-2xl mx-auto bg-white border border-slate-200/50 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Payment Ledger — {studentName}</h4>
                                {studentTx.length === 0 ? (
                                  <p className="text-xs text-slate-400 font-medium py-2">No historical installment receipts logged.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {studentTx.map((tx) => (
                                      <div key={tx.id} className="flex justify-between items-center bg-slate-50 border border-slate-100 px-4 py-2 rounded-lg text-xs">
                                        <p className="text-slate-700 font-bold">🟢 Installment Collection Receipt</p>
                                        <div className="text-right">
                                          <p className="text-emerald-700 font-extrabold">₹{tx.amount_paid}</p>
                                          <p className="text-[10px] text-slate-400">Date: {tx.payment_date}</p>
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