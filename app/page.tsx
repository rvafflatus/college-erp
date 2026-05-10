"use client";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// This connects the website to your Supabase keys
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AttendancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase.from('students').select('*');
      if (error) console.error('Error fetching:', error);
      else setStudents(data || []);
      setLoading(false);
    }
    fetchStudents();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading Students...</div>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-800">Afflatus Attendance</h1>
      <div className="space-y-3">
        {students.map((student) => (
          <div key={student.id} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm">
            <div>
              <p className="font-bold">{student.name}</p>
              <p className="text-sm text-gray-500">Roll: {student.roll_number}</p>
            </div>
            <button className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-semibold">
              Present
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}