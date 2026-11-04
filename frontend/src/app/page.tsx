import Link from 'next/link';
import { Activity, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';

export default function GlobalHomePage() {
  return (
    <main className="min-h-screen bg-slate-950 font-sans flex flex-col items-center justify-center p-6">
      
      <div className="max-w-4xl w-full flex flex-col items-center">
        
        {}
        <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900/40 shadow-sm border border-blue-800">
          <ShieldCheck className="text-blue-400" size={36} />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-center text-slate-100">
          WhoIsOnCall Platform
        </h1>
        <p className="text-lg text-slate-400 text-center max-w-2xl mb-12">
          Unified monitoring and incident response. Monitor live telemetry, manage active incidents, and coordinate on-call schedules from a single source of truth.
        </p>

        {}
        <div className="grid md:grid-cols-2 gap-8 w-full">
          
          {}
          <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer" className="group block h-full">
            <div className="bg-slate-900/50 rounded-2xl shadow-sm border border-slate-800 p-8 hover:shadow-lg hover:border-orange-500 transition-all duration-300 h-full flex flex-col items-start relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                <Activity size={100} className="text-orange-400" />
              </div>
              <div className="bg-orange-900/20 p-4 rounded-xl mb-6 group-hover:bg-orange-900/40 transition-colors">
                <Activity size={32} className="text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-orange-400 transition-colors">Grafana APM</h2>
              <p className="text-slate-400 mb-8 flex-grow relative z-10">
                Industry-standard APM powered by Prometheus. View auto-provisioned dashboards with real-time throughput and error metrics.
              </p>
              <div className="flex items-center text-orange-400 font-semibold group-hover:gap-2 transition-all">
                Open Grafana <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </a>

          {}
          <Link href="/incidents" className="group block h-full">
            <div className="bg-slate-900/50 rounded-2xl shadow-sm border border-slate-800 p-8 hover:shadow-lg hover:border-red-500 transition-all duration-300 h-full flex flex-col items-start relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                <ShieldAlert size={100} className="text-red-400" />
              </div>
              <div className="bg-red-900/20 p-4 rounded-xl mb-6 group-hover:bg-red-900/40 transition-colors">
                <ShieldAlert size={32} className="text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-red-400 transition-colors">Incident Management</h2>
              <p className="text-slate-400 mb-8 flex-grow relative z-10">
                Respond to threshold breaches, manage active incidents, and coordinate with the scheduled on-call engineers.
              </p>
              <div className="flex items-center text-red-400 font-semibold group-hover:gap-2 transition-all">
                Enter Incidents <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>

          {}
          <Link href="/apm" className="group block h-full">
            <div className="bg-slate-900/50 rounded-2xl shadow-sm border border-slate-800 p-8 hover:shadow-lg hover:border-purple-500 transition-all duration-300 h-full flex flex-col items-start relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                <Activity size={100} className="text-purple-400" />
              </div>
              <div className="bg-purple-900/20 p-4 rounded-xl mb-6 group-hover:bg-purple-900/40 transition-colors">
                <Activity size={32} className="text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-3 group-hover:text-purple-400 transition-colors">Chaos Simulator</h2>
              <p className="text-slate-400 mb-8 flex-grow relative z-10">
                Break the math! Force a microservice to violate PromQL boundaries (error rate, latency) to test if Alertmanager successfully pages the engineer.
              </p>
              <div className="flex items-center text-purple-400 font-semibold group-hover:gap-2 transition-all">
                Enter Simulator <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>

        </div>
      </div>
    </main>
  );
}
