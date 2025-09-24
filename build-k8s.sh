#!/bin/bash

echo "🐳 Building containers for Kubernetes deployment..."

# Build frontend nginx container
echo "📦 Building frontend container..."
docker build -t log-analyzer/frontend:latest -f docker/Dockerfile.frontend .

# Build API Gateway container
echo "📦 Building api-gateway container..."
docker build -t log-analyzer/api-gateway:latest -f docker/Dockerfile.api-gateway .

# Build other services (optional - if Dockerfiles exist)
if [ -f "docker/Dockerfile.ingestion" ]; then
    echo "📦 Building service-ingestion container..."
    docker build -t log-analyzer/service-ingestion:latest -f docker/Dockerfile.ingestion .
fi

if [ -f "docker/Dockerfile.analytics" ]; then
    echo "📦 Building service-analytics container..."
    docker build -t log-analyzer/service-analytics:latest -f docker/Dockerfile.analytics .
fi

echo "✅ All containers built successfully!"
echo ""
echo "🚀 To deploy to Kubernetes:"
echo "cd k8s/ && ./deploy.sh"
echo ""
echo "🌐 Access the application:"
echo "http://localhost:30080"
