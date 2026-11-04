const express = require('express');
const cors = require('cors');
const client = require('prom-client');
const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 3000;
const SERVICE_ID = process.env.SERVICE_ID || 'srv-unknown-000';
const SERVICE_NAME = process.env.SERVICE_NAME || 'UnknownService';


const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'node_' });

const metricDotNetMs = new client.Gauge({ name: 'web_transaction_dotnet_ms', help: 'DotNet web transaction time in ms', labelNames: ['service'] });
const metricWebExternalMs = new client.Gauge({ name: 'web_transaction_external_ms', help: 'External web transaction time in ms', labelNames: ['service'] });
const metricTotalResponseMs = new client.Gauge({ name: 'web_transaction_total_ms', help: 'Total response time in ms', labelNames: ['service'] });
const metricApdexApp = new client.Gauge({ name: 'apdex_app', help: 'App Server Apdex score', labelNames: ['service'] });
const metricApdexEnd = new client.Gauge({ name: 'apdex_end', help: 'End User Apdex score', labelNames: ['service'] });
const metricThroughput = new client.Gauge({ name: 'throughput_rpm', help: 'Throughput in requests per minute', labelNames: ['service'] });
const metricErrorRate = new client.Gauge({ name: 'error_rate_pct', help: 'Error rate percentage', labelNames: ['service'] });
const metricLogCount = new client.Gauge({ name: 'log_count', help: 'Total log count', labelNames: ['service'] });

register.registerMetric(metricDotNetMs);
register.registerMetric(metricWebExternalMs);
register.registerMetric(metricTotalResponseMs);
register.registerMetric(metricApdexApp);
register.registerMetric(metricApdexEnd);
register.registerMetric(metricThroughput);
register.registerMetric(metricErrorRate);
register.registerMetric(metricLogCount);

const MAX_HISTORY = 6; 
const TARGETS = {
  normal: { dotNetMs: 5.0, webExternalMs: 2.0, apdexApp: 0.98, apdexEnd: 0.95, throughputRpm: 50, errorRatePct: 0.0, logCount: 120 },
  incident: { dotNetMs: 18.0, webExternalMs: 8.0, apdexApp: 0.63, apdexEnd: 0.60, throughputRpm: 800, errorRatePct: 33.0, logCount: 12600 }
};

let isIncidentActive = false;
let history = [];
let currentState = { ...TARGETS.normal };

function stepValue(current, target, maxStep, noiseMax) {
  const diff = target - current;
  let next = current + (diff * 0.2); 
  next += (Math.random() * 2 - 1) * noiseMax;
  if (next < 0) next = 0;
  return Number(next.toFixed(2));
}

function generateTelemetryTick() {
  const target = isIncidentActive ? TARGETS.incident : TARGETS.normal;
  currentState.dotNetMs = stepValue(currentState.dotNetMs, target.dotNetMs, 2.0, 0.5);
  currentState.webExternalMs = stepValue(currentState.webExternalMs, target.webExternalMs, 1.0, 0.2);
  currentState.apdexApp = Math.min(1, stepValue(currentState.apdexApp, target.apdexApp, 0.1, 0.02));
  currentState.apdexEnd = Math.min(1, stepValue(currentState.apdexEnd, target.apdexEnd, 0.1, 0.02));
  currentState.throughputRpm = Math.floor(stepValue(currentState.throughputRpm, target.throughputRpm, 100, 10));
  currentState.logCount = Math.floor(stepValue(currentState.logCount, target.logCount, 1000, 50));
  currentState.errorRatePct = stepValue(currentState.errorRatePct, target.errorRatePct, 5.0, 1.0);

  const totalResponseTimeMs = Number((currentState.dotNetMs + currentState.webExternalMs).toFixed(2));

  
  metricDotNetMs.set({ service: SERVICE_ID }, currentState.dotNetMs);
  metricWebExternalMs.set({ service: SERVICE_ID }, currentState.webExternalMs);
  metricTotalResponseMs.set({ service: SERVICE_ID }, totalResponseTimeMs);
  metricApdexApp.set({ service: SERVICE_ID }, currentState.apdexApp);
  metricApdexEnd.set({ service: SERVICE_ID }, currentState.apdexEnd);
  metricThroughput.set({ service: SERVICE_ID }, currentState.throughputRpm);
  metricErrorRate.set({ service: SERVICE_ID }, currentState.errorRatePct);
  metricLogCount.set({ service: SERVICE_ID }, currentState.logCount);

  return {
    timestamp: new Date().toISOString(),
    comment: isIncidentActive ? "--- SIMULATED INCIDENT ACTIVE ---" : "--- NORMAL TRAFFIC ---",
    webTransaction: { dotNetMs: currentState.dotNetMs, webExternalMs: currentState.webExternalMs, totalResponseTimeMs },
    apdex: { appServer: currentState.apdexApp, endUser: currentState.apdexEnd },
    throughputRpm: currentState.throughputRpm, errorRatePct: currentState.errorRatePct, logCount: currentState.logCount
  };
}


setInterval(() => {
  history.push(generateTelemetryTick());
  if (history.length > MAX_HISTORY) history.shift(); 
}, 5000);

history.push(generateTelemetryTick());

function calculateSummary(telemetryArray) {
  if (telemetryArray.length === 0) return {};
  const sum = telemetryArray.reduce((acc, curr) => ({
    time: acc.time + curr.webTransaction.totalResponseTimeMs, apdex: acc.apdex + curr.apdex.appServer, throughput: acc.throughput + curr.throughputRpm, error: acc.error + curr.errorRatePct, logs: acc.logs + curr.logCount
  }), { time: 0, apdex: 0, throughput: 0, error: 0, logs: 0 });

  const count = telemetryArray.length;
  return {
    avgWebTransactionTimeMs: Number((sum.time / count).toFixed(2)),
    currentApdexScore: Number((sum.apdex / count).toFixed(2)),
    avgThroughputRpm: Math.floor(sum.throughput / count),
    avgErrorRatePct: Number((sum.error / count).toFixed(2)),
    totalLogsK: Math.floor(sum.logs / 1000)
  };
}


app.get('/api/telemetry', (req, res) => {
  res.json({
    service: {
      id: SERVICE_ID,
      name: SERVICE_NAME,
      environment: "production",
      instanceCount: Math.floor(Math.random() * 5) + 5
    },
    timeRange: {
      start: history[0]?.timestamp || new Date().toISOString(),
      end: history[history.length - 1]?.timestamp || new Date().toISOString(),
      resolutionIntervalSeconds: 5
    },
    summary: calculateSummary(history),
    telemetry: history
  });
});


app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.post('/admin/trigger-incident', (req, res) => {
  isIncidentActive = true;
  res.json({ message: `Incident triggered on ${SERVICE_NAME}.`, isIncidentActive });
});

app.post('/admin/resolve-incident', (req, res) => {
  isIncidentActive = false;
  res.json({ message: `Incident resolved on ${SERVICE_NAME}.`, isIncidentActive });
});

app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] Pod running on port ${PORT}`);
});