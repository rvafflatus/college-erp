"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AttendancePage() {
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch real data from your Supabase table
  useEffect(() => {
    async function fetchStudents() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('roll_number', { ascending: true });
        
        if (error) throw error;
        
        // Map default local state status 'Present'
        const trackingData = (data || []).map(student => ({
          ...student,
          status: 'Present' 
        }));
        
        setAllStudents(trackingData);
        setFilteredStudents(trackingData); // Default show all
      } catch (error) {
        console.error('Error connecting to database:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  // Filter students dynamically whenever the selected course changes
  useEffect(() => {
    if (selectedCourse === 'All Courses') {
      setFilteredStudents(allStudents);
    } else {
      setFilteredStudents(allStudents.filter(s => s.course === selectedCourse));
    }
  }, [selectedCourse, allStudents]);

  // Toggle local status between Present and Absent
  const toggleStatus = (id: number) => {
    setAllStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, status: student.status === 'Present' ? 'Absent' : 'Present' };
      }
      return student;
    }));
  };

  // Submit logs to the backend database
  const handleSubmitLogs = async () => {
    setSubmitting(true);
    try {
      // Build rows only for the currently filtered/displayed students
      const logRows = filteredStudents.map(student => ({
        student_id: student.id,
        status: student.status
      }));

      if (logRows.length === 0) {
        alert('No students selected in this batch filter.');
        return;
      }

      const { error } = await supabase
        .from('attendance_logs')
        .insert(logRows);

      if (error) throw error;

      alert(`Shabaash! Attendance logs for ${selectedCourse} saved to cloud.`);
    } catch (error) {
      console.error('Error submitting records:', error);
      alert('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Extract unique courses for the dropdown menu dynamically
  const uniqueCourses = ['All Courses', ...Array.from(new Set(allStudents.map(s => s.course || 'B.A. 1st Year')))];

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

      <section className="w-full max-w-4xl px-4 py-12 flex-grow">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            Daily Attendance Roster
          </h2>
          <p className="text-slate-500 font-medium">Select course filter to manage specific classrooms.</p>
        </div>

        {/* BATCH FILTER DROPDOWN */}
        <div className="max-w-xs mx-auto mb-6">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2 text-center">
            Select Class / Batch
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-cyan-600 font-bold text-sm shadow-sm transition-all"
          >
            {uniqueCourses.map((course, idx) => (
              <option key={idx} value={course}>{course}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-800 mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Syncing Roster...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                  No active student profiles found under "{selectedCourse}".
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div key={student.id} className="p-4 sm:p-6 flex justify-between items-center bg-white hover:bg-slate-50/50 transition-colors">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">{student.name}</h4>
                      <div className="flex gap-2 items-center mt-0.5">
                        <p className="text-xs font-bold text-cyan-700 uppercase tracking-wide">
                          Roll ID: {student.roll_number}
                        </p>
                        <span className="text-slate-300 text-xs">•</span>
                        <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                          {student.course}
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => toggleStatus(student.id)}
                      className={`border px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${
                        student.status === 'Present' 
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/60' 
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200/60'
                      }`}
                    >
                      {student.status}
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="bg-slate-50/50 border-t border-slate-100 p-4 flex justify-end">
              <button 
                onClick={handleSubmitLogs}
                disabled={submitting || filteredStudents.length === 0}
                className="bg-cyan-800 hover:bg-cyan-900 disabled:bg-slate-300 text-white font-bold text-sm uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-sm transition-all"
              >
                {submitting ? 'Saving Logs...' : `Submit ${selectedCourse} Logs`}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}