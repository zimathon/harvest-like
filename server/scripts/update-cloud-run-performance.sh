#!/bin/bash

# Cloud Run Performance Update Script
# 本番環境のパフォーマンス改善設定

PROJECT_ID="harvest-a82c0"
SERVICE_NAME="harvest-backend"
REGION="asia-northeast1"

echo "🚀 Cloud Run パフォーマンス改善設定"
echo "=================================="
echo ""

# 現在の設定を表示
echo "📊 現在の設定:"
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="table(
    spec.template.spec.containers[0].resources.limits.cpu,
    spec.template.spec.containers[0].resources.limits.memory,
    spec.template.metadata.annotations.'autoscaling.knative.dev/minScale',
    spec.template.metadata.annotations.'autoscaling.knative.dev/maxScale'
  )"

echo ""
echo "💰 改善プランを選択してください:"
echo ""
echo "1) 最小改善 (月額 約¥1,500)"
echo "   - CPU: 0.5 vCPU"
echo "   - メモリ: 512Mi"
echo "   - インスタンス: 1-3"
echo "   - 効果: コールドスタート解消、3-5倍高速化"
echo ""
echo "2) バランス型 (月額 約¥2,900)"
echo "   - CPU: 1 vCPU"
echo "   - メモリ: 512Mi"
echo "   - インスタンス: 1-5"
echo "   - 効果: 高速レスポンス、バックグラウンド処理可"
echo ""
echo "3) 性能重視 (月額 約¥11,000)"
echo "   - CPU: 2 vCPU"
echo "   - メモリ: 1GiB"
echo "   - インスタンス: 2-10"
echo "   - 効果: エンタープライズ級性能"
echo ""
echo "4) キャンセル"
echo ""
read -p "選択 (1-4): " choice

case $choice in
  1)
    echo ""
    echo "🔧 最小改善プランを適用中..."
    gcloud run services update $SERVICE_NAME \
      --region=$REGION \
      --project=$PROJECT_ID \
      --cpu=0.5 \
      --memory=512Mi \
      --min-instances=1 \
      --max-instances=3 \
      --no-cpu-throttling \
      --cpu-boost
    ;;
  2)
    echo ""
    echo "🔧 バランス型プランを適用中..."
    gcloud run services update $SERVICE_NAME \
      --region=$REGION \
      --project=$PROJECT_ID \
      --cpu=1 \
      --memory=512Mi \
      --min-instances=1 \
      --max-instances=5 \
      --no-cpu-throttling \
      --cpu-boost \
      --cpu-always-allocated
    ;;
  3)
    echo ""
    echo "🔧 性能重視プランを適用中..."
    gcloud run services update $SERVICE_NAME \
      --region=$REGION \
      --project=$PROJECT_ID \
      --cpu=2 \
      --memory=1Gi \
      --min-instances=2 \
      --max-instances=10 \
      --no-cpu-throttling \
      --cpu-boost \
      --cpu-always-allocated
    ;;
  4)
    echo "キャンセルしました"
    exit 0
    ;;
  *)
    echo "無効な選択です"
    exit 1
    ;;
esac

echo ""
echo "✅ 設定が完了しました！"
echo ""
echo "📊 新しい設定:"
gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="table(
    spec.template.spec.containers[0].resources.limits.cpu,
    spec.template.spec.containers[0].resources.limits.memory,
    spec.template.metadata.annotations.'autoscaling.knative.dev/minScale',
    spec.template.metadata.annotations.'autoscaling.knative.dev/maxScale'
  )"

echo ""
echo "🔍 パフォーマンステスト:"
echo "1-2分待ってから、アプリケーションにアクセスして速度を確認してください"
echo "URL: https://harvest-backend-zlz2m7xbiq-an.a.run.app"