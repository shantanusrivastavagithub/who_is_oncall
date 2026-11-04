'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, CheckCircle } from 'lucide-react';


interface TelemetryTick {
  time: string;
  dotNet: number;
  webExternal: number;
  responseTime: number;
  apdexApp: number;
  throughput: number;
  errorRate: number;
  logs: number;
}

interface ApmDashboardProps {
  serviceId: string;
}


const ChartCard = ({ title, stat, subtext, children }: { title: string, stat: string | number, subtext: string, children: React.ReactNode }) => (
  <div className="bg-black border border-slate-800 rounded-md p-4 shadow-sm flex flex-col h-full">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-slate-300 font-semibold">{title}</h3>
      <div className="text-right">
        <span className="text-xl text-slate-100">{stat}</span>
        <p className="text-xs text-slate-500">{subtext}</p>
      </div>
    </div>
    <div className="w-full h-[250px]">
      {children}
    </div>
  </div>
);


export default function ApmDashboard({ serviceId }: ApmDashboardProps) {
  const [data, setData] = useState<TelemetryTick[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(`apm-data-${serviceId}`);
      if (saved) return JSON.parse(saved);
    }
    return [];
  });
  const [isIncident, setIsIncident] = useState(false);

  
  useEffect(() => {
    sessionStorage.setItem(`apm-data-${serviceId}`, JSON.stringify(data));
  }, [data, serviceId]);

  
  useEffect(() => {
    const fetchTick = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/apm/tick?service=${serviceId}`);
        const newTick: any = await res.json(); 

        setData(prevData => {
          const updated = [...prevData, newTick];
          if (updated.length > 20) updated.shift();
          return updated;
        });
        
        setIsIncident(newTick.isIncidentActive);
      } catch (err) {
        console.error(`Failed to fetch APM data for ${serviceId}:`, err);
      }
    };

    fetchTick(); 
    const intervalId = setInterval(fetchTick, 5000);
    return () => clearInterval(intervalId); 
  }, [serviceId]);

  const toggleIncident = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/apm/toggle-incident?service=${serviceId}`, { method: 'POST' });
      const status = await res.json();
      setIsIncident(status.isIncidentActive);
    } catch (err) {
      console.error("Failed to toggle incident:", err);
    }
  };

  const latest = data[data.length - 1] || { responseTime: 0, apdexApp: 0, throughput: 0, errorRate: 0, logs: 0 };

  return (
    <div className="p-6">
      
      {}
      <div className="mb-6 flex justify-between items-center bg-black p-4 border border-slate-800 rounded-md shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-100 uppercase">{serviceId.replace('-', ' ')} (Live)</h1>
          <p className="text-sm text-slate-400">Polling every 5 seconds</p>
        </div>
        
        {}
        <button 
          onClick={toggleIncident}
          className={`px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors ${
            isIncident ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/60' : 'bg-red-900/40 text-red-400 border border-red-500/30 hover:bg-red-900/60'
          }`}
        >
          {isIncident ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {isIncident ? "Resolve Incident" : "Trigger Service Outage"}
        </button>
      </div>

      {}
      <div className="grid grid-cols-12 gap-4">
        
        {}
        <div className="col-span-12 lg:col-span-8">
          <ChartCard title="Web transactions time" stat={`${latest.responseTime} ms`} subtext="App Server">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" ms" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                <Area type="monotone" dataKey="webExternal" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} isAnimationActive={false} />
                <Area type="monotone" dataKey="dotNet" stackId="1" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} isAnimationActive={false} />
                <Line type="monotone" dataKey="responseTime" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {}
        <div className="col-span-12 lg:col-span-4">
          <ChartCard title="Apdex score" stat={latest.apdexApp} subtext="App Server">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                <Line type="stepAfter" dataKey="apdexApp" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {}
        <div className="col-span-12 md:col-span-4">
          <ChartCard title="Throughput" stat={`${latest.throughput} rpm`} subtext="average">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="throughput" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {}
        <div className="col-span-12 md:col-span-4">
          <ChartCard title="Error rate" stat={`${latest.errorRate} %`} subtext="average">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                <Line type="stepAfter" dataKey="errorRate" stroke="#f87171" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {}
        <div className="col-span-12 md:col-span-4">
          <ChartCard title="Logs" stat={latest.logs} subtext="total">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                <Line type="monotone" dataKey="logs" stroke="#c084fc" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

      </div>
    </div>
  );
}