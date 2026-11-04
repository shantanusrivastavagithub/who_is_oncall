# WhoIsOnCall 🚨

**WhoIsOnCall** is an end-to-end incident management and APM simulation platform. It orchestrates monitoring, alerting, on-call assignments, and Slack-based interactivity to simulate real-world Site Reliability Engineering (SRE) incident response workflows.

## 🌟 Key Features

1. **APM & Metric Simulation**: Dedicated mock microservices (`checkout-service`, `auth-service`, `inventory-service`) dynamically generate Prometheus-compatible metrics. They have built-in APIs to seamlessly pivot between "normal" operation and "incident" degradation (e.g., elevated error rates, high RPM, latency spikes).
2. **Chaos Simulator**: A central UI dashboard to trigger and resolve synthetic incidents across different mock microservices.
3. **Automated Alerting**: A fully containerized Prometheus & Alertmanager stack scrapes the mock services and fires webhooks based on threshold-breaking rules.
4. **Backend-For-Frontend (BFF)**: An orchestration service that receives Alertmanager webhooks, maintains active incident state, and manages the on-call assignments via an in-memory ledger.
5. **Slack Bot Integration (Socket Mode)**:
   - **Rich Alerting**: Pings the active on-call engineer in a Direct Message and broadcasts to a shared `critical-oncall-monitoring` channel using Slack Block Kit.
   - **Interactive Acknowledgement**: Engineers can click "Acknowledge" directly from the Slack message to update the incident ledger.
   - **RBAC (Role-Based Access Control)**: Enforces strict security so only the assigned on-call engineer can acknowledge the incident.
   - **Debounce & Deduplication**: Smart throttling rules (10-minute incident gaps, 5-minute post-resolve buffers) to prevent "flappy" alerting.
6. **Modern Frontend**: A Next.js and TailwindCSS-powered APM dashboard to visualize live metrics, view the incident ledger, and configure on-call rotations.

---

## 🏗️ Technical Architecture

The project is built entirely on **Docker Compose** with a microservices architecture.

### Component Flowchart

```mermaid
flowchart TD
    %% Define Node Colors
    classDef slack fill:#4A154B,stroke:#fff,stroke-width:2px,color:#fff;
    classDef react fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000;
    classDef node fill:#68A063,stroke:#fff,stroke-width:2px,color:#fff;
    classDef prom fill:#E6522C,stroke:#fff,stroke-width:2px,color:#fff;
    
    UI["Frontend Dashboard<br/>React / Next.js"]:::react
    BFF["BFF / API Gateway<br/>Node.js / Express"]:::node
    Slack(("Slack API<br/>Bolt / Socket Mode")):::slack
    
    Prom["Prometheus"]:::prom
    Alert["Alertmanager"]:::prom
    Grafana["Grafana Dashboard"]:::prom
    
    S1["checkout-service<br/>Node.js Metric Gen"]:::node
    S2["auth-service<br/>Node.js Metric Gen"]:::node
    S3["inventory-service<br/>Node.js Metric Gen"]:::node

    %% Interactions
    UI -->|"Triggers Chaos / Assigns On-Call"| BFF
    UI -->|"Reads Incident Ledger"| BFF
    
    BFF -->|"Toggles Incident State"| S1
    BFF -->|"Toggles Incident State"| S2
    BFF -->|"Toggles Incident State"| S3
    
    Prom -->|"Scrapes /metrics"| S1
    Prom -->|"Scrapes /metrics"| S2
    Prom -->|"Scrapes /metrics"| S3
    
    Grafana -->|"Reads PromQL"| Prom
    Prom -->|"Fires Rules"| Alert
    
    Alert -->|"Webhook HTTP POST"| BFF
    
    BFF <-->|"WebSockets (Receive Interactivity)"| Slack
    BFF -->|"HTTP POST (Send Block Kit Alerts)"| Slack
```

### Core Services

- `whoisoncall_frontend` (Port `3000`): The Next.js application UI.
- `whoisoncall_bff` (Port `4000`): The central API and Slack Bolt instance.
- `whoisoncall_checkout`, `whoisoncall_auth`, `whoisoncall_inventory` (Port `3000` internal): Lightweight Node.js apps generating Prometheus metrics using `prom-client`.
- `whoisoncall_prometheus` (Port `9090`): Configured with `prometheus.yml` (scrape configs) and `rules.yml` (alert thresholds).
- `whoisoncall_alertmanager` (Port `9093`): Configured with `alertmanager.yml` to route alerts to `http://bff:4000/api/webhook/alert`.
- `whoisoncall_grafana` (Port `3001`): Pre-provisioned Grafana dashboards mapped directly to the Prometheus data source.

---

## 🚀 Setup & Execution

### Prerequisites
- Docker & Docker Compose
- Node.js (for local development)
- A Slack App configured with **Socket Mode** enabled, Scopes (`chat:write`), and an App-Level Token (`xapp-...`).

### Environment Configuration
Create a `.env` file inside the `/bff` directory:
```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
```

### Running the Stack
To boot the entire architecture, run:
```bash
docker compose up -d --build
```

### Accessing the Applications
- **Main APM Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Grafana Metrics:** [http://localhost:3001](http://localhost:3001)
- **Prometheus:** [http://localhost:9090](http://localhost:9090)

---

## 🛠️ Recent Implementations

1. **Slack Socket Mode Integration**: Migrated the legacy HTTP interactivity webhooks to `@slack/bolt` WebSockets (`socketMode: true`). This removed the need to expose the local development environment via `ngrok`.
2. **RBAC Logic**: Secured the interactive Slack blocks. The backend now maps the alert's `serviceId` to the CSV-based on-call roster. If a user clicks "Acknowledge" but their `user.id` doesn't match the assigned engineer's `slackId`, they are rejected with an ephemeral error message.
3. **Block Kit Preservation**: Implemented smart Slack message updating. Acknowledging an incident retains the original alert context (metrics, RPM, limits) while appending a "✅ Acknowledged by @user" Context block, rather than overwriting the entire message.
4. **Alert Deduplication Engine**: 
   - **10-minute gap**: Prevents Alertmanager from spamming webhooks for simultaneous rule breaches (e.g., High RPM and High Error Rate firing together).
   - **5-minute buffer**: Enforces a strict quiet period post-resolution to prevent flappy alerts from immediately re-triggering the Pager.
