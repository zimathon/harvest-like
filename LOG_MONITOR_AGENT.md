# ログ監視・自動修正エージェント

## 概要
サーバーログをリアルタイムで監視し、一般的なエラーを検出して自動的に修正を試みるエージェントです。

## 機能

### 自動検出・修正可能なエラー

1. **MongoDB接続エラー**
   - パターン: `ECONNREFUSED.*:27017`
   - 自動修正: MongoDB Dockerコンテナを起動

2. **ポート競合エラー**
   - パターン: `EADDRINUSE.*:(\d+)`
   - 自動修正: 競合しているポートを解放

3. **モジュール不足エラー**
   - パターン: `Cannot find module`
   - 自動修正: 不足しているnpmパッケージを自動インストール

4. **MongoDB ネットワークエラー**
   - パターン: `MongoNetworkError`
   - 自動修正: MongoDBサービスを再起動

### 検出のみ（手動修正が必要）

- **Type Error**: コードの修正が必要
- **Unhandled Promise Rejection**: 非同期エラーハンドリングの確認が必要
- **CORS Error**: 設定ファイルの確認が必要
- **Compilation Error**: シンタックスエラーの修正が必要

## 使用方法

### 🚀 推奨: サービスと監視エージェントを同時起動

```bash
# Firestore版 + 監視エージェント（推奨）
npm run dev:monitored

# MongoDB版 + 監視エージェント
npm run dev:all:monitored

# 停止（エージェントも自動停止）
npm run stop:all
```

### 基本的な使い方（個別起動）

```bash
# Firestore版の全サービスを監視（デフォルト）
npm run monitor

# バックエンドのみを監視
npm run monitor:backend

# フロントエンドのみを監視
npm run monitor:frontend

# 特定のコマンドを監視
node scripts/log-monitor-agent.js dev:all
```

### 実行例

```bash
# 推奨: 統合起動（エージェント自動起動）
npm run stop:all          # 既存のサービスを停止
npm run dev:monitored     # サービス + 監視エージェントを起動

# または個別起動
npm run stop:all          # 既存のサービスを停止
npm run monitor           # 監視エージェント付きでサービスを起動
```

## 出力

### リアルタイムログ
```
🤖 === Server Log Monitor Agent ===
Monitoring server logs for errors and attempting auto-fixes...
Press Ctrl+C to stop

❗ Error Detected: MongoDB Connection Error
   Severity: high
   Description: MongoDB connection refused - starting MongoDB container
🔧 Attempting auto-fix...
✅ Auto-fix successful!
```

### 統計情報（30秒ごとに表示）
```
📊 === Log Monitor Statistics ===
Runtime: 120 seconds
Errors Detected: 5
Errors Fixed: 3
Errors Failed: 1
Success Rate: 60%

Recent Errors:
  [2024-01-09T10:00:00.000Z] MongoDB Connection Error - ✅ Fixed
  [2024-01-09T10:01:00.000Z] Port Already in Use - ✅ Fixed
  [2024-01-09T10:02:00.000Z] Type Error - ❌ Not Fixed
```

### ログファイル
終了時に以下の形式でログが保存されます：
- 保存先: `logs/monitor-YYYY-MM-DD.json`
- 内容: エラー履歴、修正結果、統計情報

## カスタマイズ

### エラーパターンの追加

`scripts/log-monitor-agent.js` の `ERROR_PATTERNS` 配列に新しいパターンを追加：

```javascript
{
  pattern: /Your Error Pattern/i,
  type: 'Error Type Name',
  severity: 'high|medium|low',
  autoFix: async (match) => {
    // 自動修正ロジック
    return executeCommand('fix command');
  },
  description: 'エラーの説明'
}
```

## 注意事項

1. **自動修正の限界**
   - コードエラーやロジックエラーは自動修正できません
   - 設定ファイルの変更が必要な場合は手動対応が必要

2. **監視対象**
   - stdout と stderr の両方を監視
   - リアルタイムでログを解析

3. **パフォーマンス**
   - 大量のログがある場合、若干のオーバーヘッドが発生する可能性があります

4. **ログの保存**
   - 終了時に自動的にログファイルが保存されます
   - ログは日付ごとにファイル分割されます

## トラブルシューティング

### エージェントが起動しない
```bash
# Node.jsのバージョンを確認
node --version  # v14以上が必要

# 権限を確認
chmod +x scripts/log-monitor-agent.js
```

### 自動修正が機能しない
- Dockerが起動していることを確認
- 必要な権限があることを確認
- ログファイルで詳細なエラーを確認

## 今後の改善案

1. **機械学習の導入**
   - エラーパターンの自動学習
   - 修正成功率に基づく戦略の最適化

2. **通知機能**
   - Slack/Discord への通知
   - 重大エラー時のアラート

3. **Web UI**
   - リアルタイムダッシュボード
   - エラー履歴の可視化

4. **より高度な自動修正**
   - 簡単なコード修正の自動化
   - 設定ファイルの自動調整