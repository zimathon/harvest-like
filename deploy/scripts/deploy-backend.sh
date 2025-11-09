#!/bin/bash

# Deploy backend to Cloud Run
# Usage: ./deploy-backend.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_ID="harvest-a82c0"
REGION="asia-northeast1"
SERVICE_NAME="harvest-backend"
REPOSITORY="harvest-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting backend deployment to GCP...${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Project: ${YELLOW}${PROJECT_ID}${NC}"
echo -e "Region: ${YELLOW}${REGION}${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    exit 1
fi

# Set the project
echo -e "${GREEN}Setting GCP project...${NC}"
gcloud config set project ${PROJECT_ID}

# Get absolute paths before changing directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
SERVER_DIR="${PROJECT_ROOT}/server"
ENV_VARS_FILE="${SERVER_DIR}/env-vars.yaml"

# Check if env-vars.yaml exists
if [ -f "$ENV_VARS_FILE" ]; then
    echo -e "${GREEN}Using environment variables from ${ENV_VARS_FILE}${NC}"
    ENV_VARS_OPTION="--env-vars-file ${ENV_VARS_FILE}"
else
    echo -e "${YELLOW}⚠️  env-vars.yaml not found at ${ENV_VARS_FILE}${NC}"
    echo -e "${YELLOW}Using inline environment variables${NC}"
    ENV_VARS_OPTION="--update-env-vars NODE_ENV=${ENVIRONMENT},PROJECT_ID=harvest-a82c0,GOOGLE_CLOUD_PROJECT=harvest-a82c0,USE_FIRESTORE_EMULATOR=false,JWT_SECRET=0aafbf8b391afe1bb826349b3045645101c5a1cf0f913c689d56ed742645866c,CORS_ALLOWED_ORIGINS=https://harvest-a82c0.web.app#https://harvest-a82c0.firebaseapp.com"
fi

# Build Docker image
echo -e "${GREEN}Building Docker image...${NC}"
cd "${SERVER_DIR}"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/api:latest"
docker build --platform=linux/amd64 -f Dockerfile.production -t ${IMAGE_TAG} .

# Push to Artifact Registry
echo -e "${GREEN}Pushing image to Artifact Registry...${NC}"
docker push ${IMAGE_TAG}

# Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_TAG} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    ${ENV_VARS_OPTION} \
    --memory 512Mi \
    --cpu 1 \
    --timeout 60 \
    --concurrency 80 \
    --max-instances 10 \
    --min-instances 0 \
    --port 8080

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
    --platform managed \
    --region ${REGION} \
    --format 'value(status.url)')

echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
echo -e "Service URL: ${YELLOW}${SERVICE_URL}${NC}"

# Run health check
echo -e "${GREEN}Running health check...${NC}"
HEALTH_CHECK_URL="${SERVICE_URL}/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${HEALTH_CHECK_URL})

if [ ${HTTP_STATUS} -eq 200 ]; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed with status: ${HTTP_STATUS}${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"