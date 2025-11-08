#!/bin/bash
# Cloud Scheduler warmup job for keeping Cloud Run warm during business hours

set -e

PROJECT_ID="${PROJECT_ID:-harvest-a82c0}"
REGION="${REGION:-asia-northeast1}"
SERVICE_NAME="${SERVICE_NAME:-harvest-backend}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --format='value(status.url)')

echo "Creating Cloud Scheduler job for warmup..."

# Create or update the scheduler job
gcloud scheduler jobs create http backend-warmup \
  --project=$PROJECT_ID \
  --location=$REGION \
  --schedule="*/10 9-18 * * MON-FRI" \
  --uri="${SERVICE_URL}/health" \
  --http-method=GET \
  --time-zone="Asia/Tokyo" \
  --attempt-deadline=10s \
  --description="Keep backend warm during business hours" \
  || gcloud scheduler jobs update http backend-warmup \
  --project=$PROJECT_ID \
  --location=$REGION \
  --schedule="*/10 9-18 * * MON-FRI" \
  --uri="${SERVICE_URL}/health" \
  --http-method=GET \
  --time-zone="Asia/Tokyo" \
  --attempt-deadline=10s \
  --description="Keep backend warm during business hours"

echo "✅ Cloud Scheduler warmup job created/updated"
echo "Service will stay warm Mon-Fri 9:00-18:00 JST"
echo "Cost: ~1,300 requests/month (0.065% of free tier)"
