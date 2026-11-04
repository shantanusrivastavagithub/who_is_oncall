"use client";

import { useEffect, useState } from 'react';
import { User, ShieldAlert, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface OnCallAssignment {
  serviceId: string;
  engineer: string;
  slackId: string;
}

export default function OncallPage() {
  const [assignments, setAssignments] = useState<OnCallAssignment[]>([]);
  const [newEngineer, setNewEngineer] = useState<{ [key: string]: string }>({});
  const [newSlackId, setNewSlackId] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/oncall');
      const data = await res.json();
      setAssignments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (serviceId: string) => {
    const engineer = newEngineer[serviceId];
    const slackId = newSlackId[serviceId];
    if (!engineer || !slackId) {
      alert("Please provide both Engineer Name and Slack Member ID");
      return;
    }

    try {
      await fetch('http://localhost:4000/api/oncall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, engineer, slackId })
      });
      setNewEngineer(prev => ({ ...prev, [serviceId]: '' }));
      setNewSlackId(prev => ({ ...prev, [serviceId]: '' }));
      fetchAssignments();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading On-Call Roster...</div>;

  return (
    <main className="min-h-screen bg-slate-950 font-sans">
      {}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3 flex items-center">
        <Link href="/incidents" className="text-blue-400 hover:underline text-sm font-medium mr-4 transition-colors">
          &larr; Back to Incident Hub
        </Link>
        <span className="text-slate-600">|</span>
        <span className="text-slate-300 font-semibold ml-4">On-Call Roster</span>
      </div>

      <div className="p-8 max-w-7xl mx-auto text-slate-100">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert size={36} className="text-blue-400" />
          <h1 className="text-4xl font-bold">On-Call Roster</h1>
        </div>
        
        <p className="text-slate-400 mb-8 text-lg">
          Manage incident responders. When Alertmanager detects an outage, the system will automatically page the engineer assigned below via Slack.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assignments.map(a => (
            <div key={a.serviceId} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl hover:border-blue-500/50 transition-colors">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-100">
                <CheckCircle size={20} className="text-emerald-500" />
                {a.serviceId}
              </h2>
              
              <div className="flex items-center gap-3 mb-6 bg-[#0a0e17] p-4 rounded-lg border border-slate-800/80">
                <div className="bg-blue-900/20 p-3 rounded-full">
                  <User size={24} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Currently Paging</p>
                  <p className="text-2xl font-bold text-slate-200">{a.engineer}</p>
                  <p className="text-sm text-blue-400 font-mono mt-1">{a.slackId}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <input 
                  type="text" 
                  placeholder="New Engineer Name..." 
                  className="bg-[#0a0e17] border border-slate-700 rounded px-3 py-2 flex-grow text-slate-300 focus:outline-none focus:border-blue-500 placeholder-slate-600 text-sm"
                  value={newEngineer[a.serviceId] || ''}
                  onChange={(e) => setNewEngineer({...newEngineer, [a.serviceId]: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Slack Member ID (e.g. U0BET...)" 
                  className="bg-[#0a0e17] border border-slate-700 rounded px-3 py-2 flex-grow text-slate-300 focus:outline-none focus:border-blue-500 placeholder-slate-600 text-sm font-mono"
                  value={newSlackId[a.serviceId] || ''}
                  onChange={(e) => setNewSlackId({...newSlackId, [a.serviceId]: e.target.value})}
                />
                <button 
                  onClick={() => updateAssignment(a.serviceId)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded transition-colors mt-2 text-sm shadow-sm"
                >
                  Assign & Sync Slack
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
