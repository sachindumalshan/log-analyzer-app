#!/bin/bash

# Simple run script for log analyzer containers
cd "$(dirname "$0")/.."

echo "🚀 Starting Log Analyzer Services..."

# Create network if it doesn't exist
sudo docker network create log-analyzer-network 2>/dev/null || true

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
sudo docker stop frontend api-gateway service-ingestion service-analytics 2>/dev/null || true
sudo docker rm frontend api-gateway service-ingestion service-analytics 2>/dev/null || true

# Start all services
echo "📡 Starting backend services..."
sudo docker run -d --name service-ingestion --network log-analyzer-network -p 3001:3001 log-analyzer/service-ingestion:latest

sudo docker run -d --name service-analytics --network log-analyzer-network -p 3002:3000 log-analyzer/service-analytics:latest

sudo docker run -d --name api-gateway --network log-analyzer-network -p 3000:3000 log-analyzer/api-gateway:latest

echo "🌐 Starting frontend..."
sudo docker run -d --name frontend --network log-analyzer-network -p 80:80 log-analyzer/frontend:latest

echo "✅ All services started!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost"
echo "   API Gateway: http://localhost:3000"
echo "   Ingestion: http://localhost:3001" 
echo "   Analytics: http://localhost:3002"
