#!/bin/bash

# Deploy frontend to Cloud Storage
set -e

# Load environment variables
if [ -f .env.production ]; then
  export $(cat .env.production | xargs)
fi

# Check required variables
if [ -z "$PROJECT_ID" ] || [ -z "$BACKEND_URL" ]; then
  echo "Error: PROJECT_ID and BACKEND_URL must be set"
  exit 1
fi

BUCKET_NAME="${PROJECT_ID}-harvest-frontend"

echo "🚀 Deploying frontend to Cloud Storage..."

# Create .env.production for Vite
echo "📝 Creating production environment file..."
cat > .env.production << EOF
VITE_API_URL=${BACKEND_URL}
EOF

# Build frontend
echo "📦 Building frontend..."
npm run build

# Upload to Cloud Storage
echo "⬆️ Uploading to Cloud Storage..."
gsutil -m rsync -r -d dist/ gs://${BUCKET_NAME}/

# Set cache control for static assets
echo "⚡ Setting cache headers..."
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" "gs://${BUCKET_NAME}/**/*.js"
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" "gs://${BUCKET_NAME}/**/*.css"
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" "gs://${BUCKET_NAME}/**/*.woff"
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" "gs://${BUCKET_NAME}/**/*.woff2"
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" "gs://${BUCKET_NAME}/index.html"

echo "✅ Frontend deployment complete!"
echo "🔗 Frontend URL: https://storage.googleapis.com/${BUCKET_NAME}/index.html"

# If using Load Balancer with custom domain
if [ ! -z "$FRONTEND_DOMAIN" ]; then
  echo "🌐 Custom domain: https://${FRONTEND_DOMAIN}"
fi