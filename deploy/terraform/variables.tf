# Terraform Variables for Harvest Like

# Core Configuration
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-northeast1"  # 東京リージョン
}

variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string
  default     = "production"
}

# Free Tier Configuration
variable "enable_free_tier" {
  description = "Enable free tier optimizations (¥0~¥1,000/month)"
  type        = bool
  default     = true  # デフォルトで無料枠最適化を有効
}

variable "monthly_budget_jpy" {
  description = "Monthly budget in JPY (only used when enable_free_tier is true)"
  type        = string
  default     = "1000"  # ¥1,000
}

variable "billing_account" {
  description = "GCP Billing Account ID (required for budget alerts)"
  type        = string
  default     = ""
}

# Authentication
variable "jwt_secret" {
  description = "JWT Secret for authentication"
  type        = string
  sensitive   = true
}

# Frontend Configuration
variable "frontend_url" {
  description = "Frontend URL for CORS (use Firebase Hosting URL for free tier)"
  type        = string
  default     = "https://harvest-like.web.app"  # Firebase Hosting default
}

variable "frontend_domain" {
  description = "Frontend custom domain for SSL certificate (only for standard deployment)"
  type        = string
  default     = ""
}

# Cloud Run Configuration (Free Tier Optimized)
variable "cloud_run_min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0  # 0 for free tier, 1 for production
}

variable "cloud_run_max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 1  # 1 for free tier, 10 for production
}

variable "cloud_run_memory" {
  description = "Memory allocation for Cloud Run"
  type        = string
  default     = "256Mi"  # 256Mi for free tier, 512Mi for production
}

variable "cloud_run_cpu" {
  description = "CPU allocation for Cloud Run"
  type        = string
  default     = "1"  # 1 vCPU
}

variable "cloud_run_concurrency" {
  description = "Maximum concurrent requests per instance"
  type        = number
  default     = 100  # Higher for free tier to handle more with single instance
}

# Cache Configuration
variable "cache_enabled" {
  description = "Enable caching for API responses"
  type        = bool
  default     = true
}

variable "cache_ttl" {
  description = "Cache TTL in seconds"
  type        = number
  default     = 3600  # 1 hour for free tier
}

# Firestore Configuration
variable "firestore_location" {
  description = "Firestore database location"
  type        = string
  default     = "asia-northeast1"  # Single region for free tier
}

variable "firestore_cache_size_bytes" {
  description = "Firestore client cache size in bytes"
  type        = number
  default     = 52428800  # 50MB
}

# Scheduler Configuration
variable "warmup_schedule" {
  description = "Cloud Scheduler cron expression for warmup"
  type        = string
  default     = "*/30 9-18 * * MON-FRI"  # Every 30 min during business hours
}

variable "warmup_enabled" {
  description = "Enable Cloud Scheduler warmup job"
  type        = bool
  default     = true
}

# Firebase Configuration
variable "use_firebase_hosting" {
  description = "Use Firebase Hosting instead of Cloud Storage for frontend"
  type        = bool
  default     = true  # True for free tier
}

variable "firebase_project" {
  description = "Firebase project ID (usually same as GCP project)"
  type        = string
  default     = ""
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable Cloud Monitoring (may incur costs)"
  type        = bool
  default     = false  # Disabled for free tier
}

variable "log_retention_days" {
  description = "Log retention period in days"
  type        = number
  default     = 7  # Minimum retention for free tier
}

# Rate Limiting (Free Tier Protection)
variable "daily_firestore_read_limit" {
  description = "Daily Firestore read limit (free tier: 50,000)"
  type        = number
  default     = 45000  # 90% of free tier limit
}

variable "daily_firestore_write_limit" {
  description = "Daily Firestore write limit (free tier: 20,000)"
  type        = number
  default     = 18000  # 90% of free tier limit
}

variable "daily_api_request_limit" {
  description = "Daily API request limit"
  type        = number
  default     = 1800000  # 90% of Cloud Run free tier
}

# User Limits (Free Tier)
variable "max_users" {
  description = "Maximum number of users for free tier"
  type        = number
  default     = 50
}

variable "max_storage_gb" {
  description = "Maximum storage in GB"
  type        = number
  default     = 1  # 1GB for Firestore free tier
}

# Deployment Configuration
variable "docker_image_tag" {
  description = "Docker image tag for deployment"
  type        = string
  default     = "latest"
}

variable "enable_cdn" {
  description = "Enable Cloud CDN (only for standard deployment)"
  type        = bool
  default     = false
}

variable "enable_load_balancer" {
  description = "Enable Load Balancer (only for standard deployment)"
  type        = bool
  default     = false
}

# Cost Control
variable "auto_shutdown_on_budget_exceed" {
  description = "Automatically shutdown services when budget is exceeded"
  type        = bool
  default     = true
}

variable "budget_alert_emails" {
  description = "Email addresses for budget alerts"
  type        = list(string)
  default     = []
}

# Tags for Resource Management
variable "labels" {
  description = "Labels to apply to all resources"
  type        = map(string)
  default = {
    project     = "harvest-like"
    environment = "production"
    tier        = "free"
    managed_by  = "terraform"
  }
}