import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

import { startSlackBot } from './services/slackBot';
import { triggerSlackAlert } from './services/alerting';

const app = express();
app.use(cors());
app.use(express.json());





interface Incident {
  id: string;
  title: string;
  service: string;
  severity: 'Sev 1' | 'Sev 2' | 'Sev 3';
  status: 'Triggered' | 'Acknowledged' | 'Resolved';
  assignee: string;
  aiRationale: string;
  createdAt: string;
}


let incidents: Incident[] = [];


const SERVICES = [
  { id: 'checkout-service', name: 'CarvedRockWebShop (Checkout)' },
  { id: 'auth-service', name: 'Authentication Service' },
  { id: 'inventory-service', name: 'Inventory DB Helper' }
];


const incidentStates: Record<string, boolean> = {
  'checkout-service': false,
  'auth-service': false,
  'inventory-service': false
};






const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const generateTickForService = (serviceId: string) => {
  const isIncidentActive = incidentStates[serviceId] || false;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  
  const dotNetMs = isIncidentActive ? rand(15, 25) : rand(3, 7);
  const webExternalMs = isIncidentActive ? rand(6, 10) : rand(1, 3);
  const throughput = isIncidentActive ? rand(700, 900) : rand(40, 70);
  const errorRate = isIncidentActive ? rand(30, 40) : 0;
  const logs = isIncidentActive ? rand(10000, 15000) : rand(100, 200);
  const apdexApp = isIncidentActive ? rand(0.5, 0.7) : rand(0.95, 1.0);

  return {
    time: timeStr,
    dotNet: parseFloat(dotNetMs.toFixed(1)),
    webExternal: parseFloat(webExternalMs.toFixed(1)),
    responseTime: parseFloat((dotNetMs + webExternalMs).toFixed(1)),
    apdexApp: parseFloat(apdexApp.toFixed(2)),
    throughput: Math.floor(throughput),
    errorRate: parseFloat(errorRate.toFixed(1)),
    logs: Math.floor(logs)
  };
};







app.get('/api/apm/services/tick', (req: Request, res: Response) => {
  const payload = SERVICES.map(svc => {
    const tick = generateTickForService(svc.id);
    return {
      id: svc.id,
      name: svc.name,
      ...tick
    };
  });
  res.json(payload);
});


app.get('/api/apm/tick', (req: Request, res: Response) => {
  const serviceId = (req.query.service as string) || 'checkout-service';
  const tick = generateTickForService(serviceId);
  res.json(tick);
});


app.post('/api/apm/toggle-incident', (req: Request, res: Response) => {
  const serviceId = (req.query.service as string) || 'checkout-service';
  
  if (incidentStates[serviceId] !== undefined) {
    incidentStates[serviceId] = !incidentStates[serviceId];
  }

  res.json({ 
    message: `Incident state for ${serviceId} is now: ${incidentStates[serviceId]}`, 
    isIncidentActive: incidentStates[serviceId] 
  });
});







app.get('/api/incidents', (req: Request, res: Response) => {
  const sorted = [...incidents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sorted);
});


app.put('/api/incidents/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const incidentIndex = incidents.findIndex(inc => inc.id === id);
  if (incidentIndex === -1) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  
  incidents[incidentIndex].status = status;

  
  if (status === 'Resolved') {
    const targetService = SERVICES.find(s => s.name === incidents[incidentIndex].service);
    if (targetService) {
      incidentStates[targetService.id] = false;
    }
  }

  res.json(incidents[incidentIndex]);
});


app.post('/api/incidents', (req: Request, res: Response) => {
  const { title, service, severity, aiRationale } = req.body;
  
  const newIncident: Incident = {
    id: randomUUID(),
    title,
    service,
    severity,
    status: 'Triggered',
    assignee: 'Bob (L2 Escalation)',
    aiRationale,
    createdAt: new Date().toISOString(),
  };

  incidents.push(newIncident);
  res.status(201).json(newIncident);
});







const loadThresholds = () => {
  try {
    const filePath = path.join(__dirname, 'thresholds.json');
    if (!fs.existsSync(filePath)) {
      console.warn("⚠️ thresholds.json missing. Create it to enable auto-alerting.");
      return null;
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Failed to parse thresholds.json", error);
    return null;
  }
};


setInterval(() => {
  const thresholds = loadThresholds();
  if (!thresholds) return;

  SERVICES.forEach(svc => {
    const tick = generateTickForService(svc.id);
    const limits = thresholds[svc.id];

    if (!limits) return;

    let isBreached = false;
    let breachReason = '';

    if (tick.errorRate > limits.errorRateLimit) {
      isBreached = true;
      breachReason = `Error Rate Spike: ${tick.errorRate.toFixed(1)}% (Limit: ${limits.errorRateLimit}%)`;
    } else if (tick.responseTime > limits.responseTimeLimit) {
      isBreached = true;
      breachReason = `High Latency: ${tick.responseTime.toFixed(1)}ms (Limit: ${limits.responseTimeLimit}ms)`;
    } else if (tick.apdexApp < limits.apdexMinLimit) {
      isBreached = true;
      breachReason = `Severe Apdex Degradation: ${tick.apdexApp.toFixed(2)} (Minimum: ${limits.apdexMinLimit})`;
    }

    if (isBreached) {
      
      const hasActiveIncident = incidents.some(
        (inc) => inc.service === svc.name && inc.status !== 'Resolved'
      );

      if (!hasActiveIncident) {
        console.log(`[ALERT] Threshold breach on ${svc.id}: ${breachReason}`);

        const newIncident: Incident = {
          id: randomUUID(),
          title: breachReason,
          service: svc.name,
          severity: svc.id === 'checkout-service' ? 'Sev 1' : 'Sev 2',
          status: 'Triggered',
          assignee: 'Alice (L1 On-Call)',
          aiRationale: `AI SRE Assessment: System detected a critical anomaly. ${breachReason}. Immediate triage recommended to prevent cascading failures.`,
          createdAt: new Date().toISOString(),
        };

        incidents.push(newIncident);
        
        
        triggerSlackAlert(newIncident);
      }
    }
  });
}, 5000);






const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 WhoIsOnCall BFF & Threshold Engine running on http://localhost:${PORT}`);
  await startSlackBot();
});