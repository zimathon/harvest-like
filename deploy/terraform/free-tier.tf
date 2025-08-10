# Free Tier Optimized Configuration for Harvest Like
# 月額コストを最小限（¥0〜¥1,000）に抑える設定

variable "enable_free_tier" {
  description = "Enable free tier optimizations"
  type        = bool
  default     = true
}

# Cloud Run - 無料枠最適化設定
resource "google_cloud_run_service" "backend_free" {
  count    = var.enable_free_tier ? 1 : 0
  name     = "${var.project_name}-backend"
  location = var.region

  template {
    spec {
      # コンテナ設定
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.backend.name}/api:latest"
        
        # 最小限のリソース割り当て
        resources {
          limits = {
            memory = "256Mi"  # 最小メモリ
            cpu    = "1"      # 1 vCPU
          }
          
          # CPUスロットリングを許可してコスト削減
          requests = {
            memory = "128Mi"
            cpu    = "0.08"   # 最小CPU（8%）
          }
        }
        
        # 環境変数
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        env {
          name  = "CACHE_ENABLED"
          value = "true"
        }
        
        env {
          name  = "CACHE_TTL"
          value = "3600"  # 1時間のキャッシュ
        }
        
        # ヘルスチェックの間隔を長くしてリクエスト削減
        liveness_probe {
          http_get {
            path = "/health"
            port = 8080
          }
          initial_delay_seconds = 60
          period_seconds        = 300  # 5分ごと
          timeout_seconds       = 10
          failure_threshold     = 3
        }
        
        startup_probe {
          http_get {
            path = "/health"
            port = 8080
          }
          initial_delay_seconds = 0
          period_seconds        = 10
          timeout_seconds       = 5
          failure_threshold     = 10
        }
      }
      
      # サービスアカウント
      service_account_name = google_service_account.backend.email
      
      # タイムアウト設定
      timeout_seconds = 60
    }
    
    metadata {
      annotations = {
        # オートスケーリング設定 - 無料枠内に収める
        "autoscaling.knative.dev/minScale"      = "0"  # 常時起動しない
        "autoscaling.knative.dev/maxScale"      = "1"  # スケールアウトしない
        "autoscaling.knative.dev/target"        = "100" # 1インスタンスで100並行リクエストまで処理
        "run.googleapis.com/cpu-throttling"     = "true"
        "run.googleapis.com/execution-environment" = "gen1"  # 第1世代（より安価）
        
        # コールドスタート最適化
        "run.googleapis.com/startup-cpu-boost"  = "false"  # CPU ブーストなし（コスト削減）
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Firebase Hosting - フロントエンド無料配信
resource "null_resource" "firebase_hosting_init" {
  count = var.enable_free_tier ? 1 : 0
  
  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/../..
      
      # Firebase設定ファイルの作成
      cat > firebase.json <<EOF
      {
        "hosting": {
          "public": "dist",
          "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
          ],
          "rewrites": [
            {
              "source": "**",
              "destination": "/index.html"
            }
          ],
          "headers": [
            {
              "source": "**/*.@(js|css)",
              "headers": [
                {
                  "key": "Cache-Control",
                  "value": "public, max-age=31536000, immutable"
                }
              ]
            },
            {
              "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
              "headers": [
                {
                  "key": "Cache-Control",
                  "value": "public, max-age=31536000"
                }
              ]
            }
          ]
        }
      }
      EOF
      
      # .firebaserc の作成
      cat > .firebaserc <<EOF
      {
        "projects": {
          "default": "${var.project_id}"
        }
      }
      EOF
    EOT
  }
}

# Cloud Scheduler - ウォームアップジョブ（無料枠: 3ジョブまで）
resource "google_cloud_scheduler_job" "warmup_free" {
  count            = var.enable_free_tier ? 1 : 0
  name             = "backend-warmup-business-hours"
  description      = "Keep backend warm during business hours only"
  schedule         = "*/30 9-18 * * MON-FRI"  # 平日9-18時、30分ごと
  time_zone        = "Asia/Tokyo"
  attempt_deadline = "30s"

  retry_config {
    retry_count          = 1
    min_backoff_duration = "5s"
    max_backoff_duration = "10s"
  }

  http_target {
    http_method = "GET"
    uri         = google_cloud_run_service.backend_free[0].status[0].url != "" ? "${google_cloud_run_service.backend_free[0].status[0].url}/health" : "https://example.com"
    
    headers = {
      "User-Agent" = "Google-Cloud-Scheduler"
    }
  }
}

# Firestore - 単一リージョン設定（マルチリージョンより安価）
resource "google_firestore_database" "main_free" {
  count       = var.enable_free_tier ? 1 : 0
  name        = "(default)"
  location_id = var.region  # 単一リージョン
  type        = "FIRESTORE_NATIVE"

  # 同時実行制限でコスト削減
  concurrency_mode = "OPTIMISTIC"
  
  # 必要最小限の設定
  app_engine_integration_mode = "DISABLED"
  
  # 削除保護は無効（開発環境用）
  deletion_policy = "DELETE"
}

# 最小限のFirestoreインデックス（複合インデックスのみ）
resource "google_firestore_index" "essential_only" {
  for_each = var.enable_free_tier ? {
    time_entries_user_date = {
      collection = "timeEntries"
      fields = [
        { field_path = "userId", order = "ASCENDING" },
        { field_path = "date", order = "DESCENDING" }
      ]
    }
  } : {}

  project    = var.project_id
  database   = google_firestore_database.main_free[0].name
  collection = each.value.collection

  dynamic "fields" {
    for_each = each.value.fields
    content {
      field_path = fields.value.field_path
      order      = fields.value.order
    }
  }
}

# 予算アラート設定
resource "google_billing_budget" "free_tier_alert" {
  count = var.enable_free_tier ? 1 : 0
  
  billing_account = var.billing_account
  display_name    = "Free Tier Budget Alert"
  
  budget_filter {
    projects = ["projects/${var.project_id}"]
    
    # 監視するサービス
    services = [
      "services/24E6-581D-38E5",  # Cloud Run
      "services/95FF-2EF5-5EA1",  # Firestore
      "services/95E7-47C1-48E0",  # Cloud Storage
    ]
  }
  
  amount {
    specified_amount {
      currency_code = "JPY"
      units         = "1000"  # 1,000円
    }
  }
  
  # 閾値アラート
  threshold_rules {
    threshold_percent = 0.5  # 50%
    spend_basis       = "CURRENT_SPEND"
  }
  
  threshold_rules {
    threshold_percent = 0.8  # 80%
    spend_basis       = "CURRENT_SPEND"
  }
  
  threshold_rules {
    threshold_percent = 1.0  # 100%
    spend_basis       = "CURRENT_SPEND"
  }
  
  # 通知設定
  all_updates_rule {
    monitoring_notification_channels = []
    disable_default_iam_recipients   = false
  }
}

# コスト超過時の自動スケールダウン（Cloud Function）
resource "google_cloudfunctions2_function" "cost_guard" {
  count    = var.enable_free_tier ? 1 : 0
  name     = "cost-guard-auto-shutdown"
  location = var.region

  build_config {
    runtime     = "nodejs18"
    entry_point = "costGuard"
    
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = google_storage_bucket_object.cost_guard_source.name
      }
    }
  }

  service_config {
    max_instance_count = 1
    min_instance_count = 0
    available_memory   = "128Mi"
    timeout_seconds    = 60
    
    environment_variables = {
      PROJECT_ID      = var.project_id
      REGION          = var.region
      BUDGET_LIMIT    = "1000"
      SERVICE_NAME    = google_cloud_run_service.backend_free[0].name
    }
    
    service_account_email = google_service_account.cost_guard[0].email
  }

  event_trigger {
    trigger_region = var.region
    event_type     = "google.cloud.pubsub.topic.v1.messagePublished"
    pubsub_topic   = google_pubsub_topic.budget_alerts[0].id
    retry_policy   = "RETRY_POLICY_DO_NOT_RETRY"
  }
}

# コストガード用のサービスアカウント
resource "google_service_account" "cost_guard" {
  count        = var.enable_free_tier ? 1 : 0
  account_id   = "cost-guard-sa"
  display_name = "Cost Guard Service Account"
  description  = "Service account for automatic cost control"
}

# Cloud Run管理権限
resource "google_project_iam_member" "cost_guard_run_admin" {
  count   = var.enable_free_tier ? 1 : 0
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.cost_guard[0].email}"
}

# Pub/Subトピック（予算アラート用）
resource "google_pubsub_topic" "budget_alerts" {
  count = var.enable_free_tier ? 1 : 0
  name  = "budget-alerts"
  
  message_retention_duration = "86400s"  # 1日
}

# コストガード関数のソースコード
resource "google_storage_bucket_object" "cost_guard_source" {
  count  = var.enable_free_tier ? 1 : 0
  name   = "cost-guard-function.zip"
  bucket = google_storage_bucket.functions.name
  
  content = base64encode(templatefile("${path.module}/functions/cost-guard.js", {
    project_id   = var.project_id
    region       = var.region
    service_name = google_cloud_run_service.backend_free[0].name
  }))
}

# 出力
output "free_tier_status" {
  value = var.enable_free_tier ? {
    enabled = true
    backend_url = var.enable_free_tier ? google_cloud_run_service.backend_free[0].status[0].url : ""
    monthly_budget = "¥1,000"
    optimizations = [
      "Cloud Run: Min instances = 0",
      "Cloud Run: Max instances = 1", 
      "Firestore: Single region",
      "Frontend: Firebase Hosting (free)",
      "Monitoring: Budget alerts enabled"
    ]
  } : {
    enabled = false
  }
}

output "cost_saving_tips" {
  value = [
    "1. Use client-side caching aggressively",
    "2. Batch Firestore operations",
    "3. Use Cloud Scheduler for warmup only during business hours",
    "4. Implement rate limiting",
    "5. Monitor daily usage against free tier limits"
  ]
}