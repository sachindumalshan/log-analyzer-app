#!/bin/bash

# Simple build script for log analyzer containers
cd "$(dirname "$0")/.."

echo "🔨 Building Log Analyzer Containers..."

# Build all containers
echo "📦 Building frontend..."
sudo docker build -t log-analyzer/frontend:latest -f docker/Dockerfile.frontend .

echo "📦 Building api-gateway..."
sudo docker build -t log-analyzer/api-gateway:latest -f docker/Dockerfile.api-gateway .

echo "📦 Building service-ingestion..."
sudo docker build -t log-analyzer/service-ingestion:latest -f docker/Dockerfile.ingestion .

echo "📦 Building service-analytics..."
sudo docker build -t log-analyzer/service-analytics:latest -f docker/Dockerfile.analytics .

echo "✅ All containers built successfully!"
