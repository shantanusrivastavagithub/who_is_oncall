import Link from 'next/link';
import { AlertOctagon, Users, ShieldAlert } from 'lucide-react';

export default function IncidentManagementHub() {
  return (
    <main className="min-h-screen bg-slate-950 font-sans flex flex-col">
      
      {}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3 flex items-center">
        <Link href="/" className="text-blue-400 hover:underline text-sm font-medium mr-4 transition-colors">
          &larr; Back to Global Home
        </Link>
        <span className="text-slate-600">|</span>
        <span className="text-slate-300 font-semibold ml-4">Incident Management Hub</span>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          
          {}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-slate-100 flex items-center justify-center gap-3 mb-4 tracking-tight">
              <ShieldAlert className="text-red-400" size={40} />
              Incident Management
            </h1>
            <p className="text-lg text-slate-400">Triage live alerts and manage on-call engineering schedules.</p>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {}
            <Link href="/incidents/active" className="group block">
              <div className="bg-slate-900/50 rounded-xl shadow-sm border border-slate-800 p-8 hover:shadow-md hover:border-red-500 transition-all h-full flex flex-col items-center text-center">
                <div className="bg-red-900/20 p-4 rounded-full mb-4 group-hover:bg-red-900/40 transition-colors">
                  <AlertOctagon size={40} className="text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-red-400">Active Incidents</h2>
                <p className="text-slate-400">View and resolve live Sev 1/2/3 alerts triggered by threshold breaches.</p>
              </div>
            </Link>

            {}
            <Link href="/incidents/oncall" className="group block">
              <div className="bg-slate-900/50 rounded-xl shadow-sm border border-slate-800 p-8 hover:shadow-md hover:border-blue-500 transition-all h-full flex flex-col items-center text-center">
                <div className="bg-blue-900/20 p-4 rounded-full mb-4 group-hover:bg-blue-900/40 transition-colors">
                  <Users size={40} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2 group-hover:text-blue-400">On-Call Schedules</h2>
                <p className="text-slate-400">View current engineering shift assignments and service escalation paths.</p>
              </div>
            </Link>

          </div>
        </div>
      </div>
    </main>
  );
}