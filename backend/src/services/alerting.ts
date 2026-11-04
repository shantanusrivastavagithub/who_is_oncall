import { slackApp } from './slackBot';



const SLACK_USER_MAPPING: Record<string, string> = {
  'Vibhos Vs (L1 On-Call)': 'D0BFU0NN03A', 
  'Shantanu Srivastava (L2 Escalation)': 'D0BEZKYLU7L'
};

export const triggerSlackAlert = async (incident: any) => {
  try {
    const alertBlocks = [
      {
        type: "header",
        text: { type: "plain_text", text: `🚨 ${incident.severity} Incident Triggered!` }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Service:*\n${incident.service}` },
          { type: "mrkdwn", text: `*Assignee:*\n${incident.assignee}` }
        ]
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Alert Reason:*\n${incident.title}` }
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `🤖 *AI SRE Agent:*\n${incident.aiRationale}` }]
      },
      { type: "divider" }
    ];

    
    await slackApp.client.chat.postMessage({
      channel: '#critical-oncall-monitoring',
      text: `New ${incident.severity} Incident on ${incident.service}`, 
      blocks: alertBlocks
    });

    
    const slackUserId = SLACK_USER_MAPPING[incident.assignee];
    if (slackUserId) {
      await slackApp.client.chat.postMessage({
        channel: slackUserId,
        text: `You have been assigned a new ${incident.severity} incident.`,
        blocks: alertBlocks
      });
    }

  } catch (error) {
    console.error('Error sending Slack alert:', error);
  }
};