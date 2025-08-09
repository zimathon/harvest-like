terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    # バケット名は terraform init 時に指定
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# API有効化
resource "google_project_service" "required_apis" {
  for_each = toset([
    "cloudrun.googleapis.com",
    "cloudbuild.googleapis.com",
    "firestore.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
  ])
  
  service = each.value
  disable_on_destroy = false
}

# Artifact Registry リポジトリ
resource "google_artifact_registry_repository" "backend" {
  location      = var.region
  repository_id = "harvest-backend"
  description   = "Docker repository for Harvest backend"
  format        = "DOCKER"
  
  depends_on = [google_project_service.required_apis]
}

# Firestore データベース
resource "google_firestore_database" "database" {
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  depends_on = [google_project_service.required_apis]
}

# Secret Manager - JWT Secret
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "jwt_secret_version" {
  secret = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}

# Cloud Run サービス
resource "google_cloud_run_service" "backend" {
  name     = "harvest-backend"
  location = var.region
  
  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/harvest-backend/api:latest"
        
        ports {
          container_port = 8080
        }
        
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }
        
        env {
          name  = "CORS_ORIGIN"
          value = var.frontend_url
        }
        
        env {
          name = "JWT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.jwt_secret.secret_id
              key  = "latest"
            }
          }
        }
        
        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }
      
      service_account_name = google_service_account.backend.email
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "10"
        "autoscaling.knative.dev/minScale" = "0"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [
    google_project_service.required_apis,
    google_secret_manager_secret_version.jwt_secret_version
  ]
}

# Cloud Run を公開
resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# サービスアカウント
resource "google_service_account" "backend" {
  account_id   = "harvest-backend"
  display_name = "Harvest Backend Service Account"
}

# Firestore アクセス権限
resource "google_project_iam_member" "firestore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# Secret Manager アクセス権限
resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# Cloud Storage バケット（フロントエンド用）
resource "google_storage_bucket" "frontend" {
  name          = "${var.project_id}-harvest-frontend"
  location      = var.region
  force_destroy = true
  
  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }
  
  cors {
    origin          = ["*"]
    method          = ["GET"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
  
  uniform_bucket_level_access = true
}

# バケットを公開
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.frontend.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Load Balancer for Frontend (CDN)
resource "google_compute_backend_bucket" "frontend_backend" {
  name        = "harvest-frontend-backend"
  bucket_name = google_storage_bucket.frontend.name
  enable_cdn  = true
  
  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    client_ttl        = 3600
    default_ttl       = 3600
    max_ttl           = 86400
    negative_caching  = true
    serve_while_stale = 86400
  }
}

resource "google_compute_url_map" "frontend" {
  name            = "harvest-frontend-urlmap"
  default_service = google_compute_backend_bucket.frontend_backend.id
}

resource "google_compute_target_https_proxy" "frontend" {
  name    = "harvest-frontend-https-proxy"
  url_map = google_compute_url_map.frontend.id
  
  ssl_certificates = [google_compute_managed_ssl_certificate.frontend.id]
}

resource "google_compute_managed_ssl_certificate" "frontend" {
  name = "harvest-frontend-cert"
  
  managed {
    domains = [var.frontend_domain]
  }
}

resource "google_compute_global_forwarding_rule" "frontend" {
  name       = "harvest-frontend-forwarding-rule"
  target     = google_compute_target_https_proxy.frontend.id
  port_range = "443"
  ip_protocol = "TCP"
  
  load_balancing_scheme = "EXTERNAL"
}

# 出力
output "backend_url" {
  value = google_cloud_run_service.backend.status[0].url
}

output "frontend_bucket" {
  value = google_storage_bucket.frontend.url
}

output "frontend_lb_ip" {
  value = google_compute_global_forwarding_rule.frontend.ip_address
}