# Terraform Infrastructure for Harvest Like

## 🎯 概要

このディレクトリには、Harvest LikeアプリケーションをGCPにデプロイするためのTerraform設定が含まれています。
**無料枠最適化モード**により、月額¥0〜¥1,000での運用が可能です。

## 💰 コストモード

### 1. FREE TIER モード（推奨）
- **月額コスト**: ¥0〜¥1,000
- **ユーザー数**: 最大50人
- **特徴**:
  - Cloud Run: 最小インスタンス0（常時起動なし）
  - Firebase Hosting使用（フロントエンド無料）
  - 積極的キャッシュ（1時間）
  - 予算アラート（¥1,000）

### 2. STANDARD モード
- **月額コスト**: ¥8,000〜
- **ユーザー数**: 無制限
- **特徴**:
  - Cloud Run: オートスケーリング（1-10インスタンス）
  - Cloud Storage + CDN
  - Load Balancer + SSL証明書
  - 完全な監視機能

## 📋 前提条件

1. **GCPアカウント**
   - プロジェクトの作成
   - 請求先アカウントの設定（無料枠でも必要）

2. **必要なツール**
   ```bash
   # Terraform
   brew install terraform
   
   # Google Cloud SDK
   brew install google-cloud-sdk
   
   # Firebase CLI（無料枠用）
   npm install -g firebase-tools
   
   # Docker
   brew install docker
   ```

3. **認証設定**
   ```bash
   # GCP認証
   gcloud auth login
   gcloud auth application-default login
   
   # Firebase認証
   firebase login
   ```

## 🚀 デプロイ手順（無料枠版）

### 1. プロジェクト設定

```bash
# プロジェクトIDを設定
export PROJECT_ID="your-project-id"

# プロジェクトを作成
gcloud projects create $PROJECT_ID

# 請求先アカウントをリンク
gcloud beta billing accounts list
gcloud beta billing projects link $PROJECT_ID \
  --billing-account=XXXXXX-XXXXXX-XXXXXX

# プロジェクトを設定
gcloud config set project $PROJECT_ID
```

### 2. Terraform状態管理用バケット作成

```bash
# 状態管理用バケット作成（一度だけ実行）
gsutil mb -p $PROJECT_ID -l asia-northeast1 gs://${PROJECT_ID}-terraform-state
```

### 3. Terraform設定ファイル準備

```bash
# 設定ファイルをコピー
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvarsを編集
# 必須項目:
# - project_id: あなたのGCPプロジェクトID
# - jwt_secret: セキュアなランダム文字列（以下で生成）
# - billing_account: 請求先アカウントID

# JWT Secretの生成
openssl rand -base64 32
```

### 4. Terraformでインフラ構築

```bash
# 初期化
terraform init -backend-config="bucket=${PROJECT_ID}-terraform-state"

# プランの確認（無料枠モード）
terraform plan

# デプロイ実行
terraform apply -auto-approve

# 出力を確認
terraform output
```

### 5. アプリケーションのデプロイ

#### バックエンド（Cloud Run）

```bash
# Dockerイメージのビルドとプッシュ
cd ../../server
gcloud builds submit \
  --tag asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest \
  -f Dockerfile.production

# または手動でDockerビルド
docker build -f Dockerfile.production \
  -t asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest .
  
docker push asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest
```

#### フロントエンド（Firebase Hosting - 無料）

```bash
# プロジェクトルートに戻る
cd ..

# Firebase初期化
firebase init hosting

# 以下を選択:
# - Use an existing project → あなたのプロジェクトID
# - Public directory: dist
# - Single-page app: Yes
# - GitHub Actions: No

# ビルド
npm run build

# デプロイ
firebase deploy --only hosting
```

### 6. 初期データ設定

```bash
# 管理者ユーザー作成
cd server
npm run create-admin:firestore

# ヘルスチェック
BACKEND_URL=$(terraform output -raw backend_url)
curl ${BACKEND_URL}/health
```

## 📊 コスト管理

### 予算アラート確認
```bash
# GCPコンソールで確認
open https://console.cloud.google.com/billing/budgets?project=${PROJECT_ID}
```

### 使用量モニタリング
```bash
# 現在の請求額確認
gcloud beta billing accounts get-iam-policy $(gcloud beta billing accounts list --format="value(name)")

# Firestoreの使用量
gcloud firestore operations list

# Cloud Runのメトリクス
gcloud run services describe harvest-backend --region=asia-northeast1
```

### コスト削減のヒント

1. **キャッシュの活用**
   - `cache_ttl = 3600`（1時間）でFirestore読み取りを削減

2. **ウォームアップの最適化**
   - ビジネスアワーのみ: `*/30 9-18 * * MON-FRI`

3. **インスタンス管理**
   - 最小インスタンス: 0（コールドスタート許容）
   - 最大インスタンス: 1（スケールアウト禁止）

## 🔧 カスタマイズ

### 無料枠から標準モードへの切り替え

```hcl
# terraform.tfvars
enable_free_tier = false

# 標準設定
cloud_run_min_instances = 1
cloud_run_max_instances = 10
cloud_run_memory = "512Mi"
cache_enabled = false
enable_cdn = true
enable_load_balancer = true
```

```bash
# 変更を適用
terraform apply
```

### 環境変数の追加

```hcl
# main.tf のCloud Runセクションに追加
env {
  name  = "YOUR_ENV_VAR"
  value = "your-value"
}
```

## 🚨 トラブルシューティング

### よくある問題

1. **APIが有効になっていない**
   ```bash
   gcloud services enable cloudrun.googleapis.com
   gcloud services enable firestore.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   ```

2. **権限エラー**
   ```bash
   # サービスアカウントの権限確認
   gcloud projects get-iam-policy $PROJECT_ID
   
   # 必要な権限を付与
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="user:your-email@example.com" \
     --role="roles/editor"
   ```

3. **Dockerプッシュエラー**
   ```bash
   # Docker認証設定
   gcloud auth configure-docker asia-northeast1-docker.pkg.dev
   ```

4. **予算超過**
   ```bash
   # サービスを一時停止
   gcloud run services update harvest-backend \
     --min-instances=0 \
     --max-instances=0 \
     --region=asia-northeast1
   ```

## 📝 設定ファイル一覧

| ファイル | 説明 |
|---------|------|
| `main.tf` | メインのTerraform設定（無料枠最適化済み） |
| `variables.tf` | 変数定義（デフォルト値は無料枠用） |
| `outputs.tf` | 出力定義（デプロイ情報表示） |
| `free-tier.tf` | 無料枠専用の追加設定 |
| `terraform.tfvars.example` | 設定例（コピーして使用） |

## 🔄 更新とメンテナンス

### アプリケーション更新
```bash
# バックエンド更新
cd server
gcloud builds submit --tag asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest
gcloud run deploy harvest-backend --image asia-northeast1-docker.pkg.dev/${PROJECT_ID}/harvest-backend/api:latest

# フロントエンド更新
cd ..
npm run build
firebase deploy --only hosting
```

### インフラ更新
```bash
cd deploy/terraform
terraform plan
terraform apply
```

### クリーンアップ（削除）
```bash
# リソースをすべて削除（注意！）
terraform destroy

# プロジェクト自体を削除
gcloud projects delete $PROJECT_ID
```

## 📚 参考リンク

- [GCP無料枠](https://cloud.google.com/free)
- [Cloud Run料金](https://cloud.google.com/run/pricing)
- [Firestore料金](https://cloud.google.com/firestore/pricing)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Terraform GCPプロバイダー](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

## 💡 ベストプラクティス

1. **開発環境では常に無料枠モードを使用**
2. **本番環境でも最初は無料枠から開始**
3. **毎日の使用量を監視**
4. **予算アラートは必ず設定**
5. **不要なリソースは即座に削除**

## サポート

問題が発生した場合は、以下を確認してください：

1. Terraform出力のエラーメッセージ
2. GCPコンソールのログ
3. `terraform.tfstate`の状態

それでも解決しない場合は、Issueを作成してください。