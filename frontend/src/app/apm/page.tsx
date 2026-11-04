'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Server, ArrowRight } from 'lucide-react';


interface ServiceMetrics {
  id: string;
  name: string;
  responseTime: number;   
  throughput: number;     
  apdexApp: number;       
  errorRate: number;      
  logs: number;           
}

export default function ApmHomePage() {
  const [services, setServices] = useState<ServiceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    
    const fetchServices = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/apm/services/tick');
        if (res.ok) {
          const data = await res.json();
          setServices(data);
        } else {
          throw new Error('BFF not ready, falling back to mock data');
        }
      } catch (err) {
        setServices([
          { id: 'checkout-service', name: 'CarvedRockWebShop (Checkout)', responseTime: 23.1, throughput: 417, apdexApp: 0.98, errorRate: 0.0, logs: 1200 },
          { id: 'auth-service', name: 'Authentication Service', responseTime: 45.2, throughput: 850, apdexApp: 0.92, errorRate: 1.2, logs: 3400 },
          { id: 'inventory-service', name: 'Inventory DB Helper', responseTime: 12.5, throughput: 320, apdexApp: 0.99, errorRate: 0.0, logs: 800 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices(); 
    const intervalId = setInterval(fetchServices, 5000); 
    
    return () => clearInterval(intervalId); 
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 font-sans">
      
      {}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-3 flex items-center">
        <Link href="/" className="text-purple-400 hover:underline text-sm font-medium mr-4">
          &larr; Back to Home
        </Link>
        <span className="text-slate-600">|</span>
        <span className="text-slate-300 font-semibold ml-4 flex items-center gap-2">
          <Activity size={16} className="text-purple-400" /> Chaos Simulator
        </span>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        
        {}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
              <Server className="text-purple-400" size={32} />
              Outage Simulator
            </h1>
            <p className="text-slate-400 mt-1">Select a microservice to intentionally violate PromQL boundaries and test your pager routing.</p>
          </div>
        </div>

        {}
        <div className="bg-slate-900/50 rounded-lg border border-slate-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading live metrics...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                    <th className="p-4 font-semibold">Service Name</th>
                    <th className="p-4 font-semibold text-right">Web Transactions Time</th>
                    <th className="p-4 font-semibold text-right">Throughput</th>
                    <th className="p-4 font-semibold text-right">Apdex Score</th>
                    <th className="p-4 font-semibold text-right">Error Rate</th>
                    <th className="p-4 font-semibold text-right">Logs</th>
                    <th className="p-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="p-4 font-bold text-slate-100 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${service.errorRate > 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        {service.name}
                      </td>
                      <td className="p-4 text-right text-slate-300 font-mono text-sm">{service.responseTime.toFixed(1)} ms</td>
                      <td className="p-4 text-right text-slate-300 font-mono text-sm">{service.throughput} rpm</td>
                      <td className="p-4 text-right text-slate-300 font-mono text-sm">{service.apdexApp.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono text-sm">
                        <span className={`px-2 py-1 rounded font-bold ${service.errorRate > 5 ? 'bg-red-900/40 text-red-400' : 'text-slate-300'}`}>
                          {service.errorRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-300 font-mono text-sm">{service.logs.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <Link href={`/apm/${service.id}`} className="text-purple-400 hover:text-purple-300 font-medium text-sm flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          View Graphs <ArrowRight size={14} />
                        </Link>
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