import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-900 mb-4 text-center">
        Afflatus College ERP
      </h1>
      <p className="text-gray-600 mb-8 text-lg">Digital Management System</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/attendance" className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg border-t-4 border-blue-600 transition-all">
          <h2 className="text-xl font-bold mb-2">Student Attendance</h2>
          <p className="text-gray-500">Mark and track daily presence of students.</p>
        </Link>

        <div className="p-6 bg-gray-100 rounded-xl border border-dashed border-gray-400 opacity-60">
          <h2 className="text-xl font-bold mb-2 text-gray-400">Fees Management (Coming Soon)</h2>
          <p className="text-gray-400">Track pending fees and generate receipts.</p>
        </div>
      </div>
    </main>
  );
}