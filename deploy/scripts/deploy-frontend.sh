#!/bin/bash

# Deploy frontend to Cloud Storage and CDN
# Usage: ./deploy-frontend.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_ID="harvest-like-prod"
BUCKET_NAME="${PROJECT_ID}-frontend"
BACKEND_URL=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting frontend deployment to GCP...${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Project: ${YELLOW}${PROJECT_ID}${NC}"
echo -e "Bucket: ${YELLOW}${BUCKET_NAME}${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    exit 1
fi

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo -e "${RED}❌ gsutil is not installed${NC}"
    exit 1
fi

# Set the project
echo -e "${GREEN}Setting GCP project...${NC}"
gcloud config set project ${PROJECT_ID}

# Get backend URL from Cloud Run
echo -e "${GREEN}Getting backend URL...${NC}"
BACKEND_URL=$(gcloud run services describe harvest-backend \
    --platform managed \
    --region asia-northeast1 \
    --format 'value(status.url)')

if [ -z "${BACKEND_URL}" ]; then
    echo -e "${RED}❌ Could not get backend URL${NC}"
    exit 1
fi

echo -e "Backend URL: ${YELLOW}${BACKEND_URL}${NC}"

# Build frontend with production environment
echo -e "${GREEN}Building frontend...${NC}"
cd ../.. # Go to project root

# Create production env file
cat > .env.production <<EOF
VITE_API_URL=${BACKEND_URL}/api/v2
VITE_ENV=${ENVIRONMENT}
EOF

# Build the frontend
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

# Upload to Cloud Storage
echo -e "${GREEN}Uploading to Cloud Storage...${NC}"

# Create bucket if it doesn't exist
gsutil mb -p ${PROJECT_ID} -c STANDARD -l asia-northeast1 gs://${BUCKET_NAME} 2>/dev/null || true

# Set bucket to be publicly accessible
gsutil iam ch allUsers:objectViewer gs://${BUCKET_NAME}

# Configure bucket for website hosting
gsutil web set -m index.html -e index.html gs://${BUCKET_NAME}

# Upload files with proper cache headers
echo -e "${GREEN}Uploading static assets...${NC}"

# Upload HTML files (no cache)
gsutil -m -h "Cache-Control:no-cache, no-store, must-revalidate" \
    -h "Content-Type:text/html" \
    rsync -r -d -x ".*\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$" \
    dist/ gs://${BUCKET_NAME}/

# Upload JS and CSS files (1 year cache)
gsutil -m -h "Cache-Control:public, max-age=31536000, immutable" \
    rsync -r -j js,css \
    dist/ gs://${BUCKET_NAME}/

# Upload images and fonts (1 year cache)
gsutil -m -h "Cache-Control:public, max-age=31536000" \
    rsync -r -j png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot \
    dist/ gs://${BUCKET_NAME}/

# Get the bucket URL
BUCKET_URL="https://storage.googleapis.com/${BUCKET_NAME}"

echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
echo -e "Bucket URL: ${YELLOW}${BUCKET_URL}${NC}"

# Invalidate CDN cache if configured
if gcloud compute url-maps list --format="value(name)" | grep -q "harvest-frontend-lb"; then
    echo -e "${GREEN}Invalidating CDN cache...${NC}"
    gcloud compute url-maps invalidate-cdn-cache harvest-frontend-lb \
        --path "/*" \
        --async
    echo -e "${GREEN}✅ CDN cache invalidation initiated${NC}"
fi

# Clean up
rm -f .env.production

echo -e "${GREEN}🎉 Frontend deployment complete!${NC}"
echo -e "Access your application at: ${YELLOW}${BUCKET_URL}${NC}"

# If custom domain is configured
if [ ! -z "${CUSTOM_DOMAIN}" ]; then
    echo -e "Custom domain: ${YELLOW}https://${CUSTOM_DOMAIN}${NC}"
fi