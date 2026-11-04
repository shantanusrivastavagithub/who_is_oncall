import { App } from '@slack/bolt';
import dotenv from 'dotenv';

dotenv.config();

export const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

export const startSlackBot = async () => {
  try {
    await slackApp.start();
    console.log('⚡️ Slack Bolt app is running in Socket Mode!');
  } catch (error) {
    console.error('Failed to start Slack Bot:', error);
  }
};