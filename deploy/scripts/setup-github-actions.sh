#!/bin/bash

# GitHub Actions用のGCPサービスアカウント設定スクリプト
# 
# このスクリプトは以下を実行します:
# 1. GitHub Actions用のサービスアカウント作成
# 2. 必要な権限の付与
# 3. サービスアカウントキーの生成
# 4. GitHubシークレット設定用の値を出力

set -e

# 設定
PROJECT_ID="harvest-a82c0"
SERVICE_ACCOUNT_NAME="github-actions"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
REGION="asia-northeast1"

echo "🚀 GitHub Actions用のGCPサービスアカウント設定を開始します..."
echo "Project ID: ${PROJECT_ID}"
echo ""

# 1. サービスアカウントの作成
echo "📝 サービスアカウントを作成中..."
if gcloud iam service-accounts describe ${SERVICE_ACCOUNT_EMAIL} --project=${PROJECT_ID} &>/dev/null; then
    echo "✅ サービスアカウントは既に存在します"
else
    gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
        --display-name="GitHub Actions Deploy" \
        --project=${PROJECT_ID}
    echo "✅ サービスアカウントを作成しました"
fi

# 2. 必要な権限を付与
echo ""
echo "🔐 権限を付与中..."

# Cloud Run Admin権限（デプロイ用）
echo "  - Cloud Run Admin権限を付与..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/run.admin" \
    --quiet

# Artifact Registry Writer権限（Dockerイメージpush用）
echo "  - Artifact Registry Writer権限を付与..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/artifactregistry.writer" \
    --quiet

# Service Account User権限（サービスアカウントとして実行用）
echo "  - Service Account User権限を付与..."
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/iam.serviceAccountUser" \
    --quiet

echo "✅ 権限の付与が完了しました"

# 3. サービスアカウントキーの生成
echo ""
echo "🔑 サービスアカウントキーを生成中..."
KEY_FILE="github-actions-key.json"

if [ -f ${KEY_FILE} ]; then
    echo "⚠️  既存のキーファイルが見つかりました。バックアップを作成します..."
    mv ${KEY_FILE} ${KEY_FILE}.backup.$(date +%Y%m%d%H%M%S)
fi

gcloud iam service-accounts keys create ${KEY_FILE} \
    --iam-account=${SERVICE_ACCOUNT_EMAIL} \
    --project=${PROJECT_ID}

echo "✅ キーファイルを生成しました: ${KEY_FILE}"

# 4. JWT Secretの生成
echo ""
echo "🔐 JWT Secretを生成中..."
JWT_SECRET=$(openssl rand -base64 32)
echo "✅ JWT Secretを生成しました"

# 5. Firebaseサービスアカウントの確認
echo ""
echo "🔥 Firebaseサービスアカウントを確認中..."
FIREBASE_SA=$(gcloud iam service-accounts list --project=${PROJECT_ID} --format="value(email)" | grep firebase-adminsdk || echo "")

if [ -z "${FIREBASE_SA}" ]; then
    echo "⚠️  Firebaseサービスアカウントが見つかりません"
    echo "Firebase Consoleで確認してください: https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk"
else
    echo "✅ Firebaseサービスアカウント: ${FIREBASE_SA}"
    
    # Firebaseサービスアカウントキーの生成
    FIREBASE_KEY_FILE="firebase-sa-key.json"
    if [ -f ${FIREBASE_KEY_FILE} ]; then
        echo "⚠️  既存のFirebaseキーファイルが見つかりました。バックアップを作成します..."
        mv ${FIREBASE_KEY_FILE} ${FIREBASE_KEY_FILE}.backup.$(date +%Y%m%d%H%M%S)
    fi
    
    gcloud iam service-accounts keys create ${FIREBASE_KEY_FILE} \
        --iam-account=${FIREBASE_SA} \
        --project=${PROJECT_ID}
    
    echo "✅ Firebaseキーファイルを生成しました: ${FIREBASE_KEY_FILE}"
fi

# 6. GitHub Secretsの設定方法を表示
echo ""
echo "======================================"
echo "📋 GitHub Secrets設定方法"
echo "======================================"
echo ""
echo "以下の手順でGitHub Secretsを設定してください:"
echo ""
echo "1. GitHubリポジトリページを開く"
echo "2. Settings → Secrets and variables → Actions"
echo "3. 'New repository secret' をクリック"
echo "4. 以下のSecretを追加:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【Secret 1: GCP_SA_KEY】"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Name: GCP_SA_KEY"
echo "Value: 以下のコマンドの出力をコピー&ペースト"
echo ""
echo "cat ${KEY_FILE}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【Secret 2: FIREBASE_SERVICE_ACCOUNT】"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f ${FIREBASE_KEY_FILE} ]; then
    echo "Name: FIREBASE_SERVICE_ACCOUNT"
    echo "Value: 以下のコマンドの出力をコピー&ペースト"
    echo ""
    echo "cat ${FIREBASE_KEY_FILE}"
else
    echo "⚠️  Firebaseサービスアカウントキーの手動作成が必要です"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【Secret 3: JWT_SECRET】"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Name: JWT_SECRET"
echo "Value: ${JWT_SECRET}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【Secret 4: CORS_ALLOWED_ORIGINS】"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Name: CORS_ALLOWED_ORIGINS"
echo "Value: https://harvest-a82c0.web.app,https://harvest-a82c0.firebaseapp.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "【Secret 5: SLACK_WEBHOOK_URL (オプション)】"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Name: SLACK_WEBHOOK_URL"
echo "Value: https://hooks.slack.com/services/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"
echo ""
echo "======================================"
echo ""
echo "⚠️  重要: キーファイルには機密情報が含まれています。"
echo "         Secretsの設定後は必ず削除してください:"
echo ""
echo "rm -f ${KEY_FILE} ${FIREBASE_KEY_FILE}"
echo ""
echo "✅ 設定スクリプトが完了しました！"