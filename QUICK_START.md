# 🚀 Harvest クイックスタートガイド

## 最速で起動する方法

### 1. 自動起動スクリプト
```bash
./scripts/quick-start-local.sh
```

メニューから選択：
- `1` → MongoDB版を起動（現在の本番版）
- `2` → Firestore版をテスト
- `3` → 両方起動（移行テスト用）

### 2. デモアカウントでログイン
```
URL: http://localhost:5173
Email: demo@example.com
Password: password123
```

## 手動起動手順

### MongoDB版（現在の本番版）

**ターミナル1: MongoDBコンテナ起動**
```bash
cd server
docker-compose up -d mongo
cd ..
```

**ターミナル2: バックエンド起動**
```bash
cd server
npm run dev
```

**ターミナル3: フロントエンド起動**
```bash
npm run dev
```

### Firestore版（テスト用）

**ターミナル1: Firestoreエミュレータ**
```bash
./scripts/setup-firestore-local.sh
```

**ターミナル2: テスト実行**
```bash
cd server
npm run test:firestore
```

## サービスURL一覧

| サービス | URL | 説明 |
|---------|-----|------|
| フロントエンド | http://localhost:5173 | Reactアプリケーション |
| バックエンドAPI | http://localhost:5001 | Express API |
| Firestore UI | http://localhost:4000 | エミュレータ管理画面 |

## 主な機能の確認

### 1. タイムトラッキング (/time)
- プロジェクト/タスク選択
- タイマー開始/停止
- 手動時間入力
- 全エントリー表示（All Entriesタブ）

### 2. プロジェクト管理 (/projects)
- プロジェクト一覧
- 新規作成/編集/削除
- クライアント紐付け

### 3. レポート (/reports)
- 期間指定
- プロジェクト別集計
- 請求可能/非請求可能時間

### 4. ダッシュボード (/)
- 今日の時間
- 週/月の集計
- 最近のエントリー

## トラブルシューティング

### ポートが使用中の場合
```bash
# 使用中のプロセスを確認
lsof -i :5173  # フロントエンド
lsof -i :5001  # バックエンド
lsof -i :8080  # Firestore

# プロセスを終了
kill -9 [PID]
```

### MongoDBコンテナが起動しない
```bash
# コンテナの状態を確認
docker ps -a | grep mongo

# ログを確認
docker logs harvest-like-mongo

# 再起動
cd server
docker-compose restart mongo

# 完全に削除して再作成
docker-compose down
docker-compose up -d mongo
```

### 依存関係エラー
```bash
# ルートディレクトリで
npm install

# サーバーディレクトリで
cd server && npm install
```

## データのリセット

### MongoDBのデータを削除
```bash
# コンテナ内でmongoshを実行
docker exec -it harvest-like-mongo mongosh

# データベース選択
use harvest-like
db.dropDatabase()

# または、コンテナごと削除して再作成
cd server
docker-compose down -v  # ボリュームも削除
docker-compose up -d mongo
```

### 初期データを作成
```bash
cd server
npm run create-admin
```

## ログの確認

### バックエンドログ
サーバー起動したターミナルに表示

### フロントエンドログ
ブラウザの開発者ツール → Console

### ネットワークログ
ブラウザの開発者ツール → Network

## よくある質問

**Q: ログインできない**
A: デモアカウントの情報が正しいか確認。MongoDBが起動しているか確認。

**Q: 時間が1800.0のように表示される**
A: 修正済み。最新のコードをpullしてください。

**Q: 削除しても一覧が更新されない**
A: 修正済み。最新のコードをpullしてください。

**Q: CORSエラーが出る**
A: server/.envでCORS_ALLOWED_ORIGINSにhttp://localhost:5173が含まれているか確認。