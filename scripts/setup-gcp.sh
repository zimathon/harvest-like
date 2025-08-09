#!/bin/bash

# Setup script for GCP deployment
set -e

echo "🔧 Setting up GCP for Harvest deployment..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install it first:"
    echo "https://www.terraform.io/downloads"
    exit 1
fi

# Get project ID
read -p "Enter your GCP Project ID: " PROJECT_ID
read -p "Enter your preferred region (default: us-central1): " REGION
REGION=${REGION:-us-central1}

# Set project
echo "📋 Setting up GCP project..."
gcloud config set project $PROJECT_ID

# Create terraform state bucket
STATE_BUCKET="${PROJECT_ID}-terraform-state"
echo "📦 Creating Terraform state bucket..."
gsutil mb -p $PROJECT_ID -l $REGION gs://${STATE_BUCKET}/ || echo "Bucket might already exist"
gsutil versioning set on gs://${STATE_BUCKET}/

# Generate JWT secret
echo "🔐 Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 32)

# Create .env.production file
echo "📝 Creating .env.production file..."
cat > .env.production << EOF
PROJECT_ID=${PROJECT_ID}
REGION=${REGION}
STATE_BUCKET=${STATE_BUCKET}
EOF

# Create terraform.tfvars
echo "📝 Creating terraform.tfvars..."
cat > deploy/terraform/terraform.tfvars << EOF
project_id = "${PROJECT_ID}"
region = "${REGION}"
jwt_secret = "${JWT_SECRET}"
frontend_url = "https://storage.googleapis.com/${PROJECT_ID}-harvest-frontend"
EOF

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. cd deploy/terraform"
echo "2. terraform init -backend-config=\"bucket=${STATE_BUCKET}\""
echo "3. terraform plan"
echo "4. terraform apply"
echo ""
echo "After Terraform completes:"
echo "1. Get the backend URL from Terraform output"
echo "2. Update .env.production with BACKEND_URL"
echo "3. Run ./scripts/deploy-backend.sh"
echo "4. Run ./scripts/deploy-frontend.sh"