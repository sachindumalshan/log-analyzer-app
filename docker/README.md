# Log Analyzer - Docker Setup

Simple and minimal Docker setup for the Log Analyzer microservices.

## Quick Start

### 1. Build all containers
```bash
cd docker
./build.sh
```

### 2. Run all services
```bash
./run.sh
```

### 3. Access the application
- **Frontend**: http://localhost
- **API Gateway**: http://localhost:3000
- **Ingestion Service**: http://localhost:3001
- **Analytics Service**: http://localhost:3002

### 4. Stop all services
```bash
./stop.sh
```

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend  │───▶│ API Gateway  │───▶│ Service         │    │ Service         │
│   (nginx)   │    │ (Node.js)    │    │ Ingestion       │    │ Analytics       │
│   Port: 80  │    │ Port: 3000   │    │ (Node.js)       │    │ (Node.js + AI)  │
└─────────────┘    └──────────────┘    │ Port: 3001      │    │ Port: 3002      │
                                       └─────────────────┘    └─────────────────┘
```

## Containers

- **Frontend**: nginx serving static files (HTML/CSS/JS)
- **API Gateway**: Orchestrates communication between services  
- **Service Ingestion**: Handles log data ingestion
- **Service Analytics**: AI-powered log analysis using GROQ

## Network

All containers run on the `log-analyzer-network` Docker network for internal communication.
