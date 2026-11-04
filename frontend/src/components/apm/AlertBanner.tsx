"use client";

import { useEffect, useState } from 'react';

export default function AlertBanner() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:4000/api/alerts');
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        }
      } catch (e) {
        
      }
    }, 2000); 
    return () => clearInterval(interval);
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50 flex flex-col gap-1">
      {alerts.map((alert, idx) => (
        <div key={idx} className="bg-red-600 text-white font-bold px-4 py-4 text-center shadow-2xl flex items-center justify-center gap-4 animate-pulse">
          <span className="text-3xl">🚨</span>
          <span className="text-xl tracking-wide">
            CRITICAL OUTAGE ON <span className="uppercase text-yellow-300 font-black">{alert.labels.service}</span>! 
            <span className="ml-4 opacity-80">|</span> 
            <span className="ml-4">PAGING ON-CALL ENGINEER:</span> 
            <span className="underline text-2xl ml-2 font-black text-yellow-300">{alert.assignedEngineer}</span>
          </span>
          <span className="text-3xl">🚨</span>
        </div>
      ))}
    </div>
  );
}
