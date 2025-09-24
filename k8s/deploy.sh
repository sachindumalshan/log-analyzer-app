#!/bin/bash

# Simple deployment script for log-analyzer k8s resources
echo "🚀 Deploying Log Analyzer to Kubernetes..."

# Apply all deployment and service files
echo "📦 Applying deployments..."
kubectl apply -f frontend-deployment.yaml
kubectl apply -f api-gateway-deployment.yaml
kubectl apply -f service-analytics-deployment.yaml  
kubectl apply -f service-ingestion-deployment.yaml

echo "🔗 Applying services..."
kubectl apply -f frontend-service.yaml
kubectl apply -f api-gateway-service.yaml
kubectl apply -f service-analytics-service.yaml
kubectl apply -f service-ingestion-service.yaml

echo "✅ Deployment complete!"
echo ""
echo "🔍 Check deployment status:"
echo "kubectl get pods"
echo "kubectl get services"
echo ""
echo "🌐 Access the application:"
echo "http://localhost:30080"
