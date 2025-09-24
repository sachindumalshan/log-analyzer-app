# Log Analyzer App

A scalable, containerized log analysis application with AI-powered insights using microservices architecture.

## 🏗️ Architecture

```
log-analyzer-app/
├── backend/
│   ├── service-ingestion/          # Log ingestion microservice
│   │   ├── server.js
│   │   ├── package.json
│   │   └── package-lock.json
│   └── service-analytics/          # AI analytics microservice
│       ├── server.js
│       ├── package.json
│       └── package-lock.json
├── frontend/                       # Web dashboard
│   ├── public/
│   │   ├── index.html
│   │   ├── app.js
│   │   └── styles.css
│   └── nginx.conf
├── shared/                         # Shared resources
│   └── logs/
│       └── logs.jsonl
├── docker/                         # Docker configurations
│   ├── Dockerfile.ingestion
│   ├── Dockerfile.analytics
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── k8s/                           # Kubernetes manifests
│   ├── service-ingestion.yaml
│   ├── service-analytics.yaml
│   └── frontend.yaml
└── README.md
```

## 🚀 Features

### Service Ingestion
- **RESTful API** for log ingestion
- **Bulk log processing** support
- **Prometheus metrics** integration
- **Health checks** and monitoring
- **JSON Lines format** storage

### Service Analytics
- **AI-powered log summarization** using GROQ API
- **Intelligent log analysis** and insights
- **Performance metrics** tracking
- **Configurable AI models**

### Frontend Dashboard
- **Real-time log visualization**
- **Interactive filtering** by service and level
- **AI summary generation**
- **Responsive design** with dark theme
- **Auto-refresh capabilities**

## 🛠️ Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Kubernetes cluster (for K8s deployment)

### 1. Using Docker Compose (Recommended)

```bash
# Clone and navigate to the project
git clone <repository-url>
cd log-analyzer-app

# Start all services
cd docker
docker-compose up -d

# Access the application
# Frontend: http://localhost:8080
# Ingestion API: http://localhost:3001
# Analytics API: http://localhost:3000
```

### 2. Local Development

```bash
# Start ingestion service
cd backend/service-ingestion
npm install
npm start  # Runs on port 3001

# Start analytics service (new terminal)
cd backend/service-analytics
npm install
export GROQ_API_KEY="your-groq-api-key"
npm start  # Runs on port 3000

# Start frontend (new terminal)
cd frontend
# Serve static files with any web server
python3 -m http.server 8080 --directory public
```

### 3. Kubernetes Deployment

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n log-analyzer

# Access via NodePort or configure ingress
kubectl get svc -n log-analyzer
```

## 📊 API Documentation

### Ingestion Service (Port 3001)

#### Submit Single Log
```bash
POST /ingest
Content-Type: application/json

{
  "message": "User login successful",
  "level": "info",
  "service": "auth-service",
  "metadata": {
    "userId": "12345",
    "ip": "192.168.1.1"
  }
}
```

#### Submit Bulk Logs
```bash
POST /ingest/bulk
Content-Type: application/json

{
  "logs": [
    {
      "message": "Error processing payment",
      "level": "error",
      "service": "payment-service"
    },
    {
      "message": "Order created successfully",
      "level": "info",
      "service": "order-service"
    }
  ]
}
```

#### Get Logs
```bash
GET /logs?limit=100&service=auth-service&level=error
```

#### Health Check
```bash
GET /health
```

#### Metrics
```bash
GET /metrics  # Prometheus format
```

### Analytics Service (Port 3000)

#### Generate AI Summary
```bash
POST /summarize
```

#### Health Check
```bash
GET /health
```

#### Metrics
```bash
GET /metrics
```

## 🔧 Configuration

### Environment Variables

#### Service Ingestion
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

#### Service Analytics
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `GROQ_API_KEY`: GROQ API key for AI features

### Docker Configuration

Each service has its own Dockerfile optimized for production:
- **Multi-stage builds** for minimal image sizes
- **Non-root users** for security
- **Health checks** for container orchestration
- **Proper signal handling**

## 📈 Monitoring & Observability

### Prometheus Metrics

Both services expose Prometheus metrics at `/metrics`:

**Ingestion Service:**
- `logs_received_total`: Number of logs received
- `log_ingest_duration_seconds`: Log ingestion duration
- `log_size_bytes`: Size of ingested logs

**Analytics Service:**
- `summaries_generated_total`: Number of AI summaries generated
- `groq_api_calls_total`: Total GROQ API calls
- `groq_api_duration_seconds`: GROQ API call duration
- `summary_length_chars`: Length of generated summaries

### Optional Monitoring Stack

Enable with Docker Compose profiles:

```bash
# Start with monitoring
docker-compose --profile monitoring up -d

# Access Prometheus: http://localhost:9090
# Access Grafana: http://localhost:3003 (admin/admin123)
```

## 🔒 Security

### Container Security
- **Non-root users** in all containers
- **Minimal base images** (Alpine Linux)
- **Read-only root filesystems** where possible
- **Security scanning** with Trivy/Snyk

### Kubernetes Security
- **RBAC** with minimal permissions
- **Network policies** for service isolation
- **Pod security contexts**
- **Secret management** for sensitive data

### API Security
- **CORS configuration**
- **Rate limiting** (TODO)
- **Input validation**
- **Authentication** (TODO)

## 🚀 Deployment Strategies

### Docker Compose (Development/Testing)
```bash
cd docker
docker-compose up -d
```

### Kubernetes (Production)
```bash
# Create namespace
kubectl create namespace log-analyzer

# Deploy all services
kubectl apply -f k8s/

# Verify deployment
kubectl get all -n log-analyzer
```

### Scaling
```bash
# Docker Compose scaling
docker-compose up -d --scale service-ingestion=3

# Kubernetes scaling
kubectl scale deployment service-ingestion --replicas=5 -n log-analyzer
```

## 🛡️ High Availability

### Kubernetes Features Used:
- **Multiple replicas** for each service
- **Horizontal Pod Autoscaler** (HPA)
- **Health checks** and readiness probes
- **Rolling updates** with zero downtime
- **Persistent volumes** for shared storage

### Load Balancing:
- **Service discovery** via Kubernetes services
- **Ingress controller** for external traffic
- **Round-robin** load balancing

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tlnp | grep :3001
   
   # Modify ports in docker-compose.yml or environment
   ```

2. **Volume permissions**
   ```bash
   # Fix shared volume permissions
   sudo chown -R 1001:1001 ./shared/logs/
   ```

3. **GROQ API issues**
   ```bash
   # Check API key configuration
   echo $GROQ_API_KEY
   
   # Test API connectivity
   curl -H "Authorization: Bearer $GROQ_API_KEY" \
        https://api.groq.com/openai/v1/models
   ```

### Logs and Debugging

```bash
# Docker Compose logs
docker-compose logs -f service-ingestion
docker-compose logs -f service-analytics

# Kubernetes logs
kubectl logs -f deployment/service-ingestion -n log-analyzer
kubectl logs -f deployment/service-analytics -n log-analyzer

# Health checks
curl http://localhost:3001/health
curl http://localhost:3000/health
```

## 🧪 Testing

### API Testing
```bash
# Test log ingestion
curl -X POST http://localhost:3001/ingest \
  -H "Content-Type: application/json" \
  -d '{"message": "Test log", "level": "info", "service": "test"}'

# Test log retrieval
curl http://localhost:3001/logs?limit=10

# Test AI summary
curl -X POST http://localhost:3000/summarize
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 -T application/json -p test-log.json \
   http://localhost:3001/ingest

# Using curl for bulk testing
curl -X POST http://localhost:3001/ingest/bulk \
  -H "Content-Type: application/json" \
  -d @bulk-logs.json
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [GROQ](https://groq.com/) for AI capabilities
- [Express.js](https://expressjs.com/) for web framework
- [Prometheus](https://prometheus.io/) for metrics
- [Bootstrap](https://getbootstrap.com/) for UI components

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for scalable log analysis**
