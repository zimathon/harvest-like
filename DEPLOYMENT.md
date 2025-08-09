# 🚀 Harvest - GCPデプロイメント

## クイックスタート

1. **前提条件の確認**
   ```bash
   # 必要なツールがインストールされているか確認
   gcloud --version
   terraform --version
   docker --version
   ```

2. **初期セットアップ（初回のみ）**
   ```bash
   ./scripts/setup-gcp.sh
   ```

3. **インフラのプロビジョニング**
   ```bash
   cd deploy/terraform
   terraform init -backend-config="bucket=${STATE_BUCKET}"
   terraform apply
   ```

4. **アプリケーションのデプロイ**
   ```bash
   # Terraformの出力を環境変数に設定
   export BACKEND_URL=$(terraform output -raw backend_url)
   echo "BACKEND_URL=${BACKEND_URL}" >> ../../.env.production

   # デプロイ実行
   cd ../..
   ./scripts/deploy-backend.sh
   ./scripts/deploy-frontend.sh
   ```

## アーキテクチャ

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│ Cloud Storage│────▶│  Cloud CDN  │
│  (Browser)  │     │  (Frontend)  │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       │ API Calls
       ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Cloud Run  │────▶│  Firestore   │     │   Secret    │
│  (Backend)  │     │  (Database)  │     │   Manager   │
└─────────────┘     └──────────────┘     └─────────────┘
```

## 無料枠の活用

- **Cloud Run**: 200万リクエスト/月 無料
- **Firestore**: 1GB ストレージ、50k読み取り/日 無料
- **Cloud Storage**: 5GB 無料
- **初回クレジット**: $300（90日間）

## 主な変更点（MongoDB → Firestore）

1. データベース接続を Firestore に変更
2. `_id` フィールドを `id` に変更
3. Mongoose のモデルを Firestore のコレクション参照に変更

## トラブルシューティング

詳細は `deploy/README.md` を参照してください。

## コスト管理

月間予想コスト（小規模利用）：
- Cloud Run: $0（無料枠内）
- Firestore: $0（無料枠内）
- Cloud Storage: $0（無料枠内）
- **合計**: $0/月

## 次のステップ

- [ ] カスタムドメインの設定
- [ ] CI/CD パイプラインの構築（GitHub Actions）
- [ ] モニタリングとアラートの設定
- [ ] バックアップの自動化