# Main Terraform configuration for Harvest Like on GCP
# Optimized for FREE TIER usage (¥0 ~ ¥1,000/month)

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

# API有効化（無料枠モードでは最小限のAPIのみ）
resource "google_project_service" "required_apis" {
  for_each = toset(
    var.enable_free_tier ? [
      "run.googleapis.com",                # Cloud Run
      "firestore.googleapis.com",          # Firestore
      "artifactregistry.googleapis.com",   # Docker registry
      "cloudscheduler.googleapis.com",     # Scheduler (3 jobs free)
      "cloudbilling.googleapis.com",       # Budget alerts
    ] : [
      "run.googleapis.com",
      "cloudbuild.googleapis.com",
      "firestore.googleapis.com",
      "secretmanager.googleapis.com",
      "artifactregistry.googleapis.com",
      "compute.googleapis.com",
    ]
  )
  
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

# Firestore データベース（通常版 - 無料枠では作成されない）
resource "google_firestore_database" "database" {
  count       = var.enable_free_tier ? 0 : 1
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  concurrency_mode = "PESSIMISTIC"
  
  depends_on = [google_project_service.required_apis]
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

# Secret Manager - JWT Secret（無料枠では環境変数を使用）
resource "google_secret_manager_secret" "jwt_secret" {
  count     = var.enable_free_tier ? 0 : 1
  secret_id = "jwt-secret"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "jwt_secret_version" {
  count       = var.enable_free_tier ? 0 : 1
  secret      = google_secret_manager_secret.jwt_secret[0].id
  secret_data = var.jwt_secret
}

# Secret Manager アクセス権限（無料枠では不要）
resource "google_project_iam_member" "secret_accessor" {
  count   = var.enable_free_tier ? 0 : 1
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# Cloud Run サービス（通常版 - 無料枠では作成されない）
resource "google_cloud_run_service" "backend" {
  count    = var.enable_free_tier ? 0 : 1
  name     = "harvest-backend"
  location = var.region
  
  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/harvest-backend/api:latest"
        
        ports {
          container_port = 8080
        }
        
        # 環境変数
        env {
          name  = "NODE_ENV"
          value = var.environment
        }
        
        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }
        
        env {
          name  = "CORS_ORIGIN"
          value = var.frontend_url
        }
        
        # 無料枠モードではJWT_SECRETを環境変数として設定
        dynamic "env" {
          for_each = var.enable_free_tier ? [1] : []
          content {
            name  = "JWT_SECRET"
            value = var.jwt_secret
          }
        }
        
        # 通常モードではSecret Managerを使用
        dynamic "env" {
          for_each = var.enable_free_tier ? [] : [1]
          content {
            name = "JWT_SECRET"
            value_from {
              secret_key_ref {
                name = google_secret_manager_secret.jwt_secret[0].secret_id
                key  = "latest"
              }
            }
          }
        }
        
        # キャッシュ設定（無料枠では必須）
        env {
          name  = "CACHE_ENABLED"
          value = var.enable_free_tier ? "true" : "false"
        }
        
        env {
          name  = "CACHE_TTL"
          value = var.enable_free_tier ? "3600" : "300"
        }
        
        # リソース制限（無料枠では最小構成）
        resources {
          limits = {
            cpu    = var.enable_free_tier ? "1" : "2"
            memory = var.enable_free_tier ? "256Mi" : "512Mi"
          }
          
          # 無料枠モードではリクエストを低く設定
          requests = var.enable_free_tier ? {
            cpu    = "0.08"
            memory = "128Mi"
          } : null
        }
      }
      
      service_account_name = google_service_account.backend.email
      timeout_seconds      = 60
    }
    
    metadata {
      annotations = merge(
        {
          "autoscaling.knative.dev/maxScale" = var.enable_free_tier ? "1" : "10"
          "autoscaling.knative.dev/minScale" = var.enable_free_tier ? "0" : "1"
        },
        var.enable_free_tier ? {
          "autoscaling.knative.dev/target"            = "100"  # 1インスタンスで100並行リクエスト
          "run.googleapis.com/cpu-throttling"         = "true"
          "run.googleapis.com/execution-environment"  = "gen1"
          "run.googleapis.com/startup-cpu-boost"      = "false"
        } : {
          "autoscaling.knative.dev/target" = "80"
          "run.googleapis.com/execution-environment" = "gen2"
        }
      )
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [
    google_project_service.required_apis,
  ]
}

# Cloud Run を公開
resource "google_cloud_run_service_iam_member" "public" {
  service  = var.enable_free_tier ? google_cloud_run_service.backend_free[0].name : google_cloud_run_service.backend[0].name
  location = var.enable_free_tier ? google_cloud_run_service.backend_free[0].location : google_cloud_run_service.backend[0].location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Scheduler - ウォームアップジョブ（通常版のみ）
resource "google_cloud_scheduler_job" "warmup" {
  count            = var.enable_free_tier ? 0 : 1
  name             = "backend-warmup"
  description      = "Keep backend warm during business hours"
  schedule         = "*/30 9-18 * * MON-FRI"  # 平日9-18時、30分ごと
  time_zone        = "Asia/Tokyo"
  attempt_deadline = "30s"
  
  retry_config {
    retry_count = 1
  }
  
  http_target {
    http_method = "GET"
    uri         = "${google_cloud_run_service.backend[0].status[0].url}/health"
    
    headers = {
      "User-Agent" = "Google-Cloud-Scheduler"
    }
  }
  
  depends_on = [google_cloud_run_service.backend]
}

# Cloud Storage バケット（無料枠では使用しない - Firebase Hostingを推奨）
resource "google_storage_bucket" "frontend" {
  count         = var.enable_free_tier ? 0 : 1
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

# バケットを公開（無料枠では不要）
resource "google_storage_bucket_iam_member" "public_read" {
  count  = var.enable_free_tier ? 0 : 1
  bucket = google_storage_bucket.frontend[0].name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Load Balancer（無料枠では使用しない）
resource "google_compute_backend_bucket" "frontend_backend" {
  count       = var.enable_free_tier ? 0 : 1
  name        = "harvest-frontend-backend"
  bucket_name = google_storage_bucket.frontend[0].name
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
  count           = var.enable_free_tier ? 0 : 1
  name            = "harvest-frontend-urlmap"
  default_service = google_compute_backend_bucket.frontend_backend[0].id
}

resource "google_compute_target_https_proxy" "frontend" {
  count   = var.enable_free_tier ? 0 : 1
  name    = "harvest-frontend-https-proxy"
  url_map = google_compute_url_map.frontend[0].id
  
  ssl_certificates = [google_compute_managed_ssl_certificate.frontend[0].id]
}

resource "google_compute_managed_ssl_certificate" "frontend" {
  count = var.enable_free_tier ? 0 : 1
  name  = "harvest-frontend-cert"
  
  managed {
    domains = [var.frontend_domain]
  }
}

resource "google_compute_global_forwarding_rule" "frontend" {
  count       = var.enable_free_tier ? 0 : 1
  name        = "harvest-frontend-forwarding-rule"
  target      = google_compute_target_https_proxy.frontend[0].id
  port_range  = "443"
  ip_protocol = "TCP"
  
  load_balancing_scheme = "EXTERNAL"
}

# # 予算アラート（無料枠では必須）
# resource "google_billing_budget" "monthly_budget" {
#   count = var.enable_free_tier ? 1 : 0
#   
#   billing_account = var.billing_account
#   display_name    = "Harvest Monthly Budget"
#   
#   budget_filter {
#     projects = ["projects/${var.project_id}"]
#   }
#   
#   amount {
#     specified_amount {
#       currency_code = "JPY"
#       units         = var.monthly_budget_jpy
#     }
#   }
#   
#   threshold_rules {
#     threshold_percent = 0.5
#   }
#   
#   threshold_rules {
#     threshold_percent = 0.8
#   }
#   
#   threshold_rules {
#     threshold_percent = 1.0
#   }
# }
# 
# # 出力
# output "backend_url" {
#   value = var.enable_free_tier ? google_cloud_run_service.backend_free[0].status[0].url : google_cloud_run_service.backend[0].status[0].url
# }
# 
# output "frontend_url" {
#   value = var.enable_free_tier ? "Please deploy to Firebase Hosting for free tier" : google_storage_bucket.frontend[0].url
# }
# 
# output "deployment_mode" {
#   value = var.enable_free_tier ? "FREE_TIER" : "STANDARD"
# }
# 
# output "monthly_budget" {
#   value = var.enable_free_tier ? "¥${var.monthly_budget_jpy}" : "No budget limit set"
# }