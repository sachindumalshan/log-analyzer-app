#!/bin/bash

# Simple stop script for log analyzer containers

echo "🛑 Stopping Log Analyzer Services..."

# Stop all containers
sudo docker stop frontend api-gateway service-ingestion service-analytics 2>/dev/null || true

# Remove all containers  
sudo docker rm frontend api-gateway service-ingestion service-analytics 2>/dev/null || true

echo "✅ All services stopped and removed!"
