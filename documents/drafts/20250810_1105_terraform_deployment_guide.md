# Terraform デプロイメント手順書

## 現在の進捗状況

### ✅ 完了済み
1. **ツールのインストール**
   - Terraform v1.12.2
   - Google Cloud SDK v533.0.0
   - Firebase CLI v14.12.0
   - Docker v28.0.4

2. **GCPプロジェクト設定**
   - プロジェクトID: `harvest-a82c0`
   - 請求先アカウント: `017831-B01AF3-3A53DC` (siek)

3. **Terraform設定ファイル**
   - `terraform.tfvars` 作成済み
   - JWT Secret生成済み
   - 無料枠設定（月額¥0〜¥1,000）

4. **Terraform状態管理バケット**
   - `gs://harvest-a82c0-terraform-state` 作成済み

### ⚠️ 要対応
**GCP APIの有効化が必要です**

## 次のステップ

### 1. GCP APIの有効化（手動）

GCPコンソールから以下のAPIを有効化してください：

1. [GCPコンソール](https://console.cloud.google.com/apis/dashboard?project=harvest-a82c0)にアクセス
2. 「APIとサービスを有効化」をクリック
3. 以下のAPIを検索して有効化：
   - Cloud Run API
   - Cloud Firestore API
   - Artifact Registry API
   - Cloud Build API
   - Compute Engine API

### 2. Terraform初期化とデプロイ

```bash
# ディレクトリ移動
cd deploy/terraform

# Terraform初期化
terraform init -backend-config="bucket=harvest-a82c0-terraform-state"

# プランの確認
terraform plan

# デプロイ実行
terraform apply -auto-approve

# 出力を確認
terraform output
```

### 3. バックエンド（Cloud Run）デプロイ

```bash
# サーバーディレクトリへ移動
cd ../../server

# Dockerイメージのビルドとプッシュ
gcloud builds submit \
  --tag asia-northeast1-docker.pkg.dev/harvest-a82c0/harvest-backend/api:latest \
  -f Dockerfile.production

# または手動でDockerビルド
docker build -f Dockerfile.production \
  -t asia-northeast1-docker.pkg.dev/harvest-a82c0/harvest-backend/api:latest .
  
docker push asia-northeast1-docker.pkg.dev/harvest-a82c0/harvest-backend/api:latest
```

### 4. フロントエンド（Firebase Hosting）デプロイ

```bash
# プロジェクトルートに戻る
cd ..

# Firebase初期化
firebase init hosting

# 以下を選択:
# - Use an existing project → harvest-a82c0
# - Public directory: dist
# - Single-page app: Yes
# - GitHub Actions: No

# ビルド
npm run build

# デプロイ
firebase deploy --only hosting
```

### 5. 初期データ設定

```bash
# 管理者ユーザー作成
cd server
npm run create-admin:firestore

# ヘルスチェック
BACKEND_URL=$(terraform output -raw backend_url)
curl ${BACKEND_URL}/health
```

## 環境変数設定

`.env`ファイルが必要な場合：

```bash
# server/.env
FIRESTORE_PROJECT_ID=harvest-a82c0
JWT_SECRET=WMuBD6xk7Lx9h5CkxY1IXJZ1+M8L9qFW4kTDM+McXzI=
NODE_ENV=production
```

## トラブルシューティング

### APIエラーが発生した場合
```bash
# 個別にAPIを有効化
gcloud services enable cloudrun.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable compute.googleapis.com
```

### Docker認証エラーの場合
```bash
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

### Terraformエラーの場合
```bash
# 状態をリセット
terraform init -reconfigure

# 特定のリソースのみ適用
terraform apply -target=google_project_service.apis
```

## コスト管理

- 無料枠設定により月額¥0〜¥1,000で運用可能
- [請求ダッシュボード](https://console.cloud.google.com/billing/01D831-B01AF3-3A53DC/reports?project=harvest-a82c0)で使用量を監視
- 予算アラート設定済み（¥1,000）

## 参考リンク

- [GCPコンソール](https://console.cloud.google.com/home/dashboard?project=harvest-a82c0)
- [Cloud Run](https://console.cloud.google.com/run?project=harvest-a82c0)
- [Firestore](https://console.cloud.google.com/firestore?project=harvest-a82c0)
- [Firebase Console](https://console.firebase.google.com/project/harvest-a82c0)