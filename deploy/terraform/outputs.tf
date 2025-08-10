# Terraform Outputs for Harvest Like

# Deployment Information
output "deployment_info" {
  description = "Deployment configuration summary"
  value = {
    mode        = var.enable_free_tier ? "FREE_TIER" : "STANDARD"
    environment = var.environment
    region      = var.region
    project_id  = var.project_id
  }
}

# Backend Service
output "backend_service" {
  description = "Backend service details"
  value = {
    url             = var.enable_free_tier ? google_cloud_run_service.backend_free[0].status[0].url : google_cloud_run_service.backend[0].status[0].url
    service_name    = var.enable_free_tier ? google_cloud_run_service.backend_free[0].name : google_cloud_run_service.backend[0].name
    min_instances   = var.enable_free_tier ? 0 : 1
    max_instances   = var.enable_free_tier ? 1 : 10
    memory          = var.enable_free_tier ? "256Mi" : "512Mi"
    cache_enabled   = var.enable_free_tier ? true : false
  }
}

# Frontend Service
output "frontend_service" {
  description = "Frontend deployment details"
  value = var.enable_free_tier ? {
    type         = "Firebase Hosting"
    url          = var.frontend_url
    instructions = "Deploy using: firebase deploy --only hosting"
  } : {
    type       = "Cloud Storage + CDN"
    bucket_url = google_storage_bucket.frontend[0].url
    cdn_ip     = try(google_compute_global_forwarding_rule.frontend[0].ip_address, "N/A")
  }
}

# Database
output "database_info" {
  description = "Firestore database configuration"
  value = {
    name         = var.enable_free_tier ? data.google_firestore_database.main_free[0].name : google_firestore_database.database[0].name
    location     = var.enable_free_tier ? data.google_firestore_database.main_free[0].location_id : google_firestore_database.database[0].location_id
    type         = var.enable_free_tier ? data.google_firestore_database.main_free[0].type : google_firestore_database.database[0].type
    mode         = var.enable_free_tier ? "Single Region" : "Multi Region"
    daily_limits = var.enable_free_tier ? {
      reads  = var.daily_firestore_read_limit
      writes = var.daily_firestore_write_limit
    } : {
      reads  = "unlimited"
      writes = "unlimited"
    }
  }
}

# Cost Management
output "cost_management" {
  description = "Cost control settings"
  value = var.enable_free_tier ? {
    monthly_budget     = "¥${var.monthly_budget_jpy}"
    budget_alerts      = "Enabled at 50%, 80%, 100%"
    auto_shutdown      = var.auto_shutdown_on_budget_exceed
    warmup_schedule    = var.warmup_enabled ? var.warmup_schedule : "Disabled"
  } : {
    monthly_budget = "No budget limit"
    budget_alerts  = "Disabled"
    auto_shutdown  = false
    warmup_schedule = "Not applicable"
  }
}

# Free Tier Usage
output "free_tier_limits" {
  description = "Free tier usage limits"
  value = var.enable_free_tier ? {
    cloud_run = {
      requests = "2M requests/month free"
      memory   = "360,000 GB-seconds/month free"
      cpu      = "180,000 vCPU-seconds/month free"
    }
    firestore = {
      storage = "1GB free"
      reads   = "50,000/day free"
      writes  = "20,000/day free"
    }
    scheduler = "3 jobs free"
    storage   = "5GB free (if using Cloud Storage)"
  } : {
    cloud_run = {
      requests = "Standard pricing"
      memory   = "Standard pricing"
      cpu      = "Standard pricing"
    }
    firestore = {
      storage = "Standard pricing"
      reads   = "Standard pricing"
      writes  = "Standard pricing"
    }
    scheduler = "Standard pricing"
    storage   = "Standard pricing"
  }
}

# API Endpoints
output "api_endpoints" {
  description = "API endpoint URLs"
  value = {
    base_url     = var.enable_free_tier ? google_cloud_run_service.backend_free[0].status[0].url : google_cloud_run_service.backend[0].status[0].url
    health_check = var.enable_free_tier ? "${google_cloud_run_service.backend_free[0].status[0].url}/health" : "${google_cloud_run_service.backend[0].status[0].url}/health"
    api_v2       = var.enable_free_tier ? "${google_cloud_run_service.backend_free[0].status[0].url}/api/v2" : "${google_cloud_run_service.backend[0].status[0].url}/api/v2"
  }
}

# Service Account
output "service_account" {
  description = "Service account information"
  value = {
    email = google_service_account.backend.email
    id    = google_service_account.backend.id
  }
}

# Deployment Commands
output "deployment_commands" {
  description = "Useful commands for deployment"
  value = {
    terraform_init   = "terraform init -backend-config=\"bucket=${var.project_id}-terraform-state\""
    terraform_plan   = var.enable_free_tier ? "terraform plan -var=\"enable_free_tier=true\"" : "terraform plan"
    terraform_apply  = var.enable_free_tier ? "terraform apply -var=\"enable_free_tier=true\" -auto-approve" : "terraform apply -auto-approve"
    docker_build     = "docker build -t ${var.region}-docker.pkg.dev/${var.project_id}/harvest-backend/api:latest ."
    docker_push      = "docker push ${var.region}-docker.pkg.dev/${var.project_id}/harvest-backend/api:latest"
    firebase_deploy  = var.enable_free_tier ? "firebase deploy --only hosting" : "N/A"
  }
}

# Monitoring URLs
output "monitoring_urls" {
  description = "Monitoring and management URLs"
  value = {
    cloud_run_console = var.enable_free_tier ? "https://console.cloud.google.com/run/detail/${var.region}/${google_cloud_run_service.backend_free[0].name}?project=${var.project_id}" : "https://console.cloud.google.com/run/detail/${var.region}/${google_cloud_run_service.backend[0].name}?project=${var.project_id}"
    firestore_console = "https://console.cloud.google.com/firestore/data?project=${var.project_id}"
    billing_console   = "https://console.cloud.google.com/billing?project=${var.project_id}"
    logs_explorer     = "https://console.cloud.google.com/logs/query?project=${var.project_id}"
  }
}

# Configuration Summary
output "config_summary" {
  description = "Configuration summary for verification"
  value = <<-EOT
    🚀 Harvest Like Deployment Summary
    ===================================
    Mode: ${var.enable_free_tier ? "FREE TIER (¥0-¥1,000/month)" : "STANDARD"}
    
    Backend:
      URL: ${var.enable_free_tier ? google_cloud_run_service.backend_free[0].status[0].url : google_cloud_run_service.backend[0].status[0].url}
      Memory: ${var.enable_free_tier ? "256Mi" : "512Mi"}
      Instances: ${var.enable_free_tier ? "0-1" : "1-10"}
      Cache: ${var.enable_free_tier ? "Enabled (1 hour)" : "Optional"}
    
    Frontend:
      Type: ${var.enable_free_tier ? "Firebase Hosting (FREE)" : "Cloud Storage + CDN"}
      URL: ${var.frontend_url}
    
    Database:
      Type: Firestore Native
      Location: ${var.enable_free_tier ? data.google_firestore_database.main_free[0].location_id : google_firestore_database.database[0].location_id}
      Daily Limits: ${var.enable_free_tier ? "45k reads, 18k writes" : "Unlimited"}
    
    Cost Controls:
      Budget: ${var.enable_free_tier ? "¥1,000/month with alerts" : "No limit"}
      Auto-shutdown: ${var.enable_free_tier ? "Enabled" : "Disabled"}
    
    Next Steps:
    1. ${var.enable_free_tier ? "Deploy frontend: firebase deploy --only hosting" : "Upload frontend: gsutil rsync -r dist/ gs://${var.project_id}-harvest-frontend/"}
    2. Test API: curl ${var.enable_free_tier ? google_cloud_run_service.backend_free[0].status[0].url : google_cloud_run_service.backend[0].status[0].url}/health
    3. Monitor costs: https://console.cloud.google.com/billing?project=${var.project_id}
  EOT
}

# Important Notes
output "important_notes" {
  description = "Important deployment notes"
  value = var.enable_free_tier ? [
    "✅ FREE TIER mode is enabled - optimized for ¥0-¥1,000/month",
    "📝 Remember to deploy frontend to Firebase Hosting (free)",
    "⏰ Warmup runs only during business hours (9-18 JST, weekdays)",
    "💾 Cache is enabled (1 hour TTL) to reduce Firestore reads",
    "🚨 Budget alerts set at ¥1,000 - monitor your usage",
    "👥 Limited to 50 users and 1GB storage",
    "🔒 No SSL certificate or Load Balancer (use Firebase Hosting)",
    "📊 Daily limits: 45k Firestore reads, 18k writes"
  ] : [
    "💰 STANDARD mode - normal pricing applies",
    "🌐 Cloud Storage + CDN enabled for frontend",
    "🔐 SSL certificate and Load Balancer configured",
    "♾️ No usage limits applied",
    "📈 Auto-scaling enabled (1-10 instances)"
  ]
}