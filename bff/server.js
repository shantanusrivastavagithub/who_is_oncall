const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { App } = require('@slack/bolt');


const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
  port: 3001 
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

const PORT = process.env.PORT || 4000;


const SERVICES = [
  { id: 'checkout-service', url: 'http://checkout-service:3000' },
  { id: 'auth-service', url: 'http://auth-service:3000' },
  { id: 'inventory-service', url: 'http://inventory-service:3000' }
];

app.get('/api/apm/services/tick', async (req, res) => {
  try {
    const promises = SERVICES.map(svc => axios.get(`${svc.url}/api/telemetry`).catch(() => null));
    const results = await Promise.all(promises);
    
    const aggregated = results.filter(r => r && r.data).map(r => {
      const data = r.data;
      return {
        id: data.service.id,
        name: data.service.name,
        responseTime: data.summary.avgWebTransactionTimeMs || 0,
        throughput: data.summary.avgThroughputRpm || 0,
        apdexApp: data.summary.currentApdexScore || 0,
        errorRate: data.summary.avgErrorRatePct || 0,
        logs: data.summary.totalLogsK ? data.summary.totalLogsK * 1000 : 0
      };
    });
    
    res.json(aggregated);
  } catch (error) {
    res.status(500).json({ error: 'BFF aggregation failed' });
  }
});

app.get('/api/apm/tick', async (req, res) => {
  const serviceId = req.query.service;
  const svc = SERVICES.find(s => s.id === serviceId);
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  
  try {
    const response = await axios.get(`${svc.url}/api/telemetry`);
    const data = response.data;
    const latest = data.telemetry[data.telemetry.length - 1];
    
    res.json({
      time: new Date(latest.timestamp).toLocaleTimeString(),
      dotNet: latest.webTransaction.dotNetMs,
      webExternal: latest.webTransaction.webExternalMs,
      responseTime: latest.webTransaction.totalResponseTimeMs,
      apdexApp: latest.apdex.appServer,
      throughput: latest.throughputRpm,
      errorRate: latest.errorRatePct,
      logs: latest.logCount,
      isIncidentActive: !!svc.isIncident
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tick' });
  }
});

app.post('/api/apm/toggle-incident', async (req, res) => {
  const serviceId = req.query.service;
  const svc = SERVICES.find(s => s.id === serviceId);
  if (!svc) return res.status(404).json({ error: 'Service not found' });
  
  try {
    svc.isIncident = !svc.isIncident;
    const action = svc.isIncident ? 'trigger-incident' : 'resolve-incident';
    
    const response = await axios.post(`${svc.url}/admin/${action}`);
    res.json({ isIncidentActive: response.data.isIncidentActive });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle incident' });
  }
});

const fs = require('fs');
const path = require('path');

const ONCALL_FILE = path.join(__dirname, 'oncall.csv');

if (!fs.existsSync(ONCALL_FILE)) {
  
  fs.writeFileSync(ONCALL_FILE, 'checkout-service,tania,U0BETD06GTD\\nauth-service,Vibho Sharma,U0BEZLG3HV0\\ninventory-service,Shantanu Srivastava,U0BEWAYCD7X\\n');
}

function getOnCallData() {
  try {
    const data = fs.readFileSync(ONCALL_FILE, 'utf8');
    return data.trim().split('\\n').map(line => {
      const [serviceId, engineer, slackId] = line.split(',');
      return { serviceId, engineer, slackId };
    }).filter(item => item.serviceId);
  } catch (err) {
    return [];
  }
}

function updateOnCallData(serviceId, newEngineer, newSlackId) {
  const currentData = getOnCallData();
  const updatedData = currentData.map(item => 
    item.serviceId === serviceId ? { serviceId, engineer: newEngineer, slackId: newSlackId } : item
  );
  
  const csvContent = updatedData.map(item => `${item.serviceId},${item.engineer},${item.slackId}`).join('\\n') + '\\n';
  fs.writeFileSync(ONCALL_FILE, csvContent);
}

app.get('/api/oncall', (req, res) => {
  res.json(getOnCallData());
});

app.post('/api/oncall', (req, res) => {
  const { serviceId, engineer, slackId } = req.body;
  if (!serviceId || !engineer || !slackId) {
    return res.status(400).json({ error: 'Missing serviceId, engineer, or slackId' });
  }
  updateOnCallData(serviceId, engineer, slackId);
  res.json({ success: true, data: getOnCallData() });
});

let activeAlerts = [];
let incidentsList = [];
const serviceIncidentStates = {}; 

app.post('/api/webhook/alert', async (req, res) => {
  console.log('\\n\\n🚨 [ALERTMANAGER] WEBHOOK RECEIVED:');
  
  const oncallData = getOnCallData();
  
  const now = Date.now();
  if (req.body && req.body.alerts) {
    for (const alert of req.body.alerts) {
      const service = alert.labels.service;
      if (!serviceIncidentStates[service]) {
        serviceIncidentStates[service] = { lastTriggered: 0, lastResolved: 0 };
      }
      const state = serviceIncidentStates[service];

      if (alert.status === 'resolved') {
        activeAlerts = activeAlerts.filter(a => a.labels.service !== service);
        console.log(`✅ Alert Resolved for ${service}`);
        
        state.lastResolved = now;
        
        
        const existingInc = incidentsList.find(i => i.service === service && i.status !== 'Resolved');
        if (existingInc) existingInc.status = 'Resolved';
        
      } else if (alert.status === 'firing') {
        
        if (now - state.lastTriggered < 10 * 60 * 1000) {
          console.log(`[Debounce] Skipping incident for ${service} (within 10m of last trigger)`);
          continue;
        }
        
        
        if (now - state.lastResolved < 5 * 60 * 1000) {
          console.log(`[Debounce] Skipping incident for ${service} (within 5m of last resolve)`);
          continue;
        }

        state.lastTriggered = now;

        const existing = activeAlerts.find(a => a.labels.service === service);
        if (!existing) {
          const assignment = oncallData.find(o => o.serviceId === service);
          alert.assignedEngineer = assignment ? assignment.engineer : 'Unassigned';
          
          activeAlerts.push(alert);
          console.log(`🚨 Paging On-Call Engineer [${alert.assignedEngineer}] for ${alert.labels.service}!`);
          
          
          let activeInc = incidentsList.find(i => i.service === alert.labels.service && i.status !== 'Resolved');
          if (!activeInc) {
            activeInc = {
              id: Math.random().toString(36).substr(2, 9),
              service: alert.labels.service,
              assignee: alert.assignedEngineer,
              status: 'Triggered',
              severity: alert.labels.severity || 'Critical'
            };
            incidentsList.push(activeInc);
          }
          
          
          if (assignment && assignment.slackId && process.env.SLACK_BOT_TOKEN) {
            try {
              const blocks = [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": `🚨 *CRITICAL OUTAGE: ${alert.labels.service}* 🚨\nHi <@${assignment.slackId}>, you are currently on-call. Alertmanager has detected anomalies.\n*Details:* ${alert.annotations?.description || 'Threshold breached.'}`
                  }
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {
                        "type": "plain_text",
                        "text": "Acknowledge",
                        "emoji": true
                      },
                      "style": "primary",
                      "value": activeInc.id,
                      "action_id": "acknowledge_incident"
                    }
                  ]
                }
              ];

              const payloadBase = {
                text: `🚨 CRITICAL OUTAGE: ${alert.labels.service} 🚨`,
                blocks: blocks
              };

              const headers = {
                'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                'Content-Type': 'application/json'
              };

              
              console.log(`💬 Sending Slack DM to ${assignment.slackId}...`);
              await axios.post('https://slack.com/api/chat.postMessage', {
                channel: assignment.slackId,
                ...payloadBase
              }, { headers });
              
              
              const channelId = 'C0BFZ5A4M29'; 
              console.log(`💬 Sending Slack message to channel ${channelId}...`);
              await axios.post('https://slack.com/api/chat.postMessage', {
                channel: channelId,
                ...payloadBase
              }, { headers });

              console.log(`✅ Slack messages sent successfully.`);
            } catch (err) {
              console.error(`❌ Failed to send Slack message:`, err.response?.data || err.message);
            }
          }
        }
      }
    }
  }
  
  res.status(200).send('Alert received');
});


slackApp.action('acknowledge_incident', async ({ ack, body, respond }) => {
  await ack();
  try {
    const action = body.actions[0];
    const incidentId = action.value;
    const inc = incidentsList.find(i => i.id === incidentId);
    
    if (inc) {
      
      const oncallData = getOnCallData();
      const assignment = oncallData.find(o => o.serviceId === inc.service);
      
      if (assignment && assignment.slackId !== body.user.id) {
        await respond({
          response_type: "ephemeral",
          replace_original: false,
          text: `🚫 Access Denied: You are not the assigned on-call engineer for ${inc.service}. Only <@${assignment.slackId}> can acknowledge this incident.`
        });
        return;
      }

      if (inc.status === 'Triggered') {
        inc.status = 'Acknowledged';
        console.log(`✅ Incident ${incidentId} acknowledged by ${body.user.username} via Slack`);
        
        const originalBlock = body.message.blocks && body.message.blocks[0] ? body.message.blocks[0] : null;
        
        const updatedBlocks = [];
        if (originalBlock) {
          updatedBlocks.push(originalBlock);
        } else {
          updatedBlocks.push({
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": `🚨 *CRITICAL OUTAGE: ${inc.service}* 🚨`
            }
          });
        }
        
        updatedBlocks.push({
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": `✅ *Acknowledged* by <@${body.user.id}>`
            }
          ]
        });

        await respond({
          replace_original: true,
          text: `✅ Incident acknowledged by <@${body.user.id}>.`,
          blocks: updatedBlocks
        });
      } else {
        await respond({
          replace_original: true,
          text: `ℹ️ Incident is already ${inc.status}.`
        });
      }
    }
  } catch (e) {
    console.error('Failed to process Slack interactivity payload', e);
  }
});

app.get('/api/alerts', (req, res) => {
  res.json(activeAlerts);
});

app.get('/api/incidents', (req, res) => {
  res.json(incidentsList);
});

app.put('/api/incidents/:id/status', async (req, res) => {
  const inc = incidentsList.find(i => i.id === req.params.id);
  if (inc) {
    inc.status = req.body.status;
  
    
    if (inc.status === 'Resolved') {
      activeAlerts = activeAlerts.filter(a => a.labels.service !== inc.service);
      
      
      const svc = SERVICES.find(s => s.id === inc.service);
      if (svc) {
        svc.isIncident = false;
        try {
          await axios.post(`${svc.url}/admin/resolve-incident`);
        } catch(e) {
          console.error(`Failed to resolve backend simulator for ${inc.service}`, e.message);
        }
      }
    }
  }
  
  res.json({ success: true });
});

app.listen(PORT, async () => {
  console.log(`BFF running on port ${PORT}`);
  
  try {
    await slackApp.start();
    console.log('⚡️ Slack Bolt app is running in Socket Mode!');
  } catch (error) {
    console.error('Failed to start Slack Bolt app:', error);
  }
});
