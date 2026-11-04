'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertOctagon, ShieldAlert, Activity, CheckCircle } from 'lucide-react';


interface ActiveIncident {
  id: string;
  service: string;
  assignee: string;
  status: 'Triggered' | 'Acknowledged' | 'Resolved';
  severity: string;
  
  responseTime: number;
  throughput: number;
  apdexApp: number;
  errorRate: number;
  logs: number;
}

export default function ActiveIncidentsPage() {
  const [incidents, setIncidents] = useState<ActiveIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  
  const fetchIncidents = async () => {
    try {
      
      const res = await fetch('http://localhost:4000/api/incidents');
      const data = await res.json();

      
      const activeData = data.filter((inc: any) => inc.status !== 'Resolved');

      
      
      
      const tableData: ActiveIncident[] = activeData.map((inc: any) => ({
        id: inc.id,
        service: inc.service,
        assignee: inc.assignee,
        status: inc.status,
        severity: inc.severity,
        responseTime: inc.status === 'Triggered' ? 26.5 : 5.1,  
        throughput: inc.status === 'Triggered' ? 780 : 50,
        apdexApp: inc.status === 'Triggered' ? 0.65 : 0.98,
        errorRate: inc.status === 'Triggered' ? 32.5 : 0.0,
        logs: inc.status === 'Triggered' ? 12500 : 120,
      }));

      setIncidents(tableData);
    } catch (err) {
      console.error("Failed to fetch active incidents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    
    const intervalId = setInterval(fetchIncidents, 10000);
    return () => clearInterval(intervalId);
  }, []);

  
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`http://localhost:4000/api/incidents/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchIncidents(); 
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  
  const getStatusBadge = (status: string) => {
    if (status === 'Triggered') {
      return <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-400 border border-red-500/30 px-2 py-1 rounded text-xs font-bold animate-pulse"><AlertOctagon size={12} /> TRIGGERED</span>;
    }
    return <span className="inline-flex items-center gap-1 bg-blue-900/40 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-xs font-bold"><Activity size={12} /> IN PROGRESS</span>;
  };

  return (
    <main className="min-h-screen bg-slate-950 font-sans">
      
      {}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3 flex items-center">
        <Link href="/incidents" className="text-blue-400 hover:underline text-sm font-medium mr-4 transition-colors">
          &larr; Back to Incident Hub
        </Link>
        <span className="text-slate-600">|</span>
        <span className="text-slate-300 font-semibold ml-4">Active Incidents Ledger</span>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        
        {}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <ShieldAlert className="text-red-400" size={32} />
            Active Incidents
          </h1>
          <p className="text-slate-400 mt-1">Live alert ledger tracking threshold breaches and active response assignments.</p>
        </div>

        {}
        <div className="bg-slate-900/50 rounded-lg border border-slate-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading active alerts...</div>
          ) : incidents.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="mx-auto text-green-400 mb-3" size={40} />
              <h3 className="text-lg font-bold text-slate-100">No Active Incidents</h3>
              <p className="text-slate-400">All services are currently operating within nominal thresholds.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                    <th className="p-4 font-semibold">Sr No.</th>
                    <th className="p-4 font-semibold">Service</th>
                    <th className="p-4 font-semibold">Current On-Call</th>
                    <th className="p-4 font-semibold text-right">Web Transactions Time</th>
                    <th className="p-4 font-semibold text-right">Throughput</th>
                    <th className="p-4 font-semibold text-right">Apdex Score</th>
                    <th className="p-4 font-semibold text-right">Error Rate</th>
                    <th className="p-4 font-semibold text-right">Logs</th>
                    <th className="p-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {incidents.map((incident, index) => (
                    <tr key={incident.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 text-slate-500 font-medium">{index + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-100">{incident.service}</div>
                        <div className="mt-1">{getStatusBadge(incident.status)}</div>
                      </td>
                      <td className="p-4 font-medium text-blue-400">{incident.assignee}</td>
                      
                      {}
                      <td className="p-4 text-right text-slate-300 font-mono text-sm">{incident.responseTime.toFixed(1)} ms</td>
                      <td className="p-4 text-right text-slate-300 font-mono text-sm">{incident.throughput} rpm</td>
                      <td className="p-4 text-right text-slate-300 font-mono text-sm">{incident.apdexApp.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono text-sm">
                        <span className={`px-2 py-1 rounded font-bold ${incident.errorRate > 5 ? 'bg-red-900/40 text-red-400' : 'text-slate-300'}`}>
                          {incident.errorRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-300 font-mono text-sm">{incident.logs.toLocaleString()}</td>
                      
                      {}
                      <td className="p-4 text-center">
                        {incident.status === 'Triggered' ? (
                          <button 
                            onClick={() => updateStatus(incident.id, 'Acknowledged')}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm w-full"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateStatus(incident.id, 'Resolved')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm w-full flex items-center justify-center gap-1"
                          >
                            <CheckCircle size={14} /> Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}