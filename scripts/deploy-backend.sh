#!/bin/bash

# Deploy backend to Cloud Run
set -e

# Load environment variables
if [ -f .env.production ]; then
  export $(cat .env.production | xargs)
fi

# Check required variables
if [ -z "$PROJECT_ID" ] || [ -z "$REGION" ]; then
  echo "Error: PROJECT_ID and REGION must be set"
  exit 1
fi

echo "🚀 Deploying backend to Cloud Run..."

# Configure Docker auth
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build and push Docker image
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest"

echo "📦 Building Docker image..."
docker build -f deploy/docker/Dockerfile.backend -t $IMAGE_URL .

echo "⬆️ Pushing image to Artifact Registry..."
docker push $IMAGE_URL

echo "🌐 Deploying to Cloud Run..."
gcloud run deploy harvest-backend \
  --image $IMAGE_URL \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=${PROJECT_ID}" \
  --service-account=harvest-backend@${PROJECT_ID}.iam.gserviceaccount.com

echo "✅ Backend deployment complete!"

# Get service URL
SERVICE_URL=$(gcloud run services describe harvest-backend --region $REGION --format 'value(status.url)')
echo "🔗 Backend URL: $SERVICE_URL"