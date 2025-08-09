# ローカル動作確認手順書

## 事前準備

### 必要なソフトウェア
- Node.js v18以上
- Docker Desktop
- Java 11以上（Firestoreエミュレータ用）
- Firebase CLI

### インストール確認
```bash
# Node.jsバージョン確認
node --version  # v18以上

# Dockerバージョン確認
docker --version
docker-compose --version

# Docker Desktopが起動しているか確認
docker info

# Javaバージョン確認（Firestoreエミュレータ用）
java -version   # 11以上

# Firebase CLIインストール
npm install -g firebase-tools
firebase --version
```

## 1. Firestoreエミュレータのセットアップと起動

### ターミナル1: エミュレータ起動
```bash
# プロジェクトルートで実行
./scripts/setup-firestore-local.sh
```

**確認ポイント:**
- ✅ Firestore エミュレータが http://localhost:8080 で起動
- ✅ Emulator UI が http://localhost:4000 で起動
- ✅ エラーメッセージが表示されていない

## 2. Firestoreモデルの動作テスト

### ターミナル2: モデルテスト実行
```bash
cd server
npm run test:firestore
```

**期待される出力:**
```
🧪 Testing Firestore connection...
✅ Firestore initialized

📝 Testing User model...
✅ User created: [ID]
✅ User found by email: [ID]

📝 Testing Client model...
✅ Client created: [ID]

📝 Testing Project model...
✅ Project created: [ID]

📝 Testing TimeEntry model...
✅ TimeEntry created: [ID]

📝 Testing data population...
✅ TimeEntry with populated data: {
  id: [ID],
  project: 'Test Project',
  user: 'Test User',
  task: { id: 'task1', name: 'Development', isBillable: true }
}

🧹 Cleaning up test data...
✅ Test data cleaned up

🎉 All tests passed!
```

## 3. バックエンドサーバーの起動（MongoDB版）

### ターミナル3: MongoDBコンテナを起動
```bash
cd server
docker-compose up -d mongo
cd ..
```

**確認ポイント:**
- ✅ MongoDB container is running
- ✅ Port 27017 is accessible

### ターミナル4: バックエンドサーバーを起動
```bash
cd server
npm run dev
```

**確認ポイント:**
- ✅ Server running on port 5001
- ✅ MongoDB connected successfully

## 4. フロントエンドの起動

### ターミナル5: フロントエンド起動
```bash
# プロジェクトルートで
npm run dev
```

**確認ポイント:**
- ✅ Vite server running at http://localhost:5173
- ✅ ページが正常に表示される

## 5. 動作確認チェックリスト

### 基本機能の確認

1. **ログイン機能**
   - [ ] http://localhost:5173 にアクセス
   - [ ] ログイン画面が表示される
   - [ ] デモユーザーでログイン可能
   ```
   Email: demo@example.com
   Password: password123
   ```

2. **ダッシュボード**
   - [ ] ログイン後、ダッシュボードが表示される
   - [ ] 統計情報が表示される
   - [ ] 最近の時間エントリーが表示される

3. **時間記録機能 (/time)**
   - [ ] プロジェクトとタスクが選択できる
   - [ ] 時間の手動入力ができる
   - [ ] タイマーの開始・停止ができる
   - [ ] 記録した時間が一覧に表示される
   - [ ] 削除後、一覧が更新される

4. **プロジェクト管理 (/projects)**
   - [ ] プロジェクト一覧が表示される
   - [ ] 新規プロジェクトが作成できる
   - [ ] プロジェクトの編集ができる
   - [ ] プロジェクトの削除ができる

5. **レポート機能 (/reports)**
   - [ ] Generate Reportボタンで集計実行
   - [ ] プロジェクトごとの時間集計が表示される
   - [ ] 期間フィルターが動作する

## 6. Firestore移行のテスト（オプション）

### コントローラーを1つ移行してテスト

1. **テスト用エンドポイント作成**
```bash
# server/src/routes/test-firestore.ts を作成
# /api/v2/users などのエンドポイントを追加
```

2. **Postmanまたはcurlでテスト**
```bash
# ユーザー一覧取得（Firestore版）
curl http://localhost:5001/api/v2/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 7. トラブルシューティング

### よくある問題と解決方法

**問題: Firestoreエミュレータが起動しない**
```bash
# ポート確認
lsof -i :8080
# 必要に応じてプロセスを終了
kill -9 [PID]
```

**問題: MongoDBに接続できない**
```bash
# MongoDBコンテナが起動しているか確認
docker ps | grep harvest-like-mongo

# 起動していない場合
cd server
docker-compose up -d mongo

# ログを確認
docker logs harvest-like-mongo
```

**問題: フロントエンドでCORSエラー**
```bash
# .envファイルを確認
cat server/.env
# CORS_ALLOWED_ORIGINS に http://localhost:5173 が含まれているか確認
```

## 8. データの確認

### MongoDB内のデータ確認
```bash
# MongoDBコンテナに接続
docker exec -it harvest-like-mongo mongosh

# データベース選択
use harvest-like

# コレクション確認
show collections

# データ確認
db.users.find()
db.projects.find()
db.timeentries.find()

# または、ホストから直接接続
mongosh mongodb://localhost:27017/harvest-like
```

### Firestoreエミュレータのデータ確認
1. ブラウザで http://localhost:4000 を開く
2. Firestore タブを選択
3. コレクションとドキュメントを確認

## 9. ログの確認

### 各サービスのログ確認方法

**バックエンドログ:**
- ターミナル3のコンソール出力を確認
- リクエスト/レスポンスのログが表示される

**フロントエンドログ:**
- ブラウザの開発者ツール → Console
- ネットワークタブでAPIコールを確認

**Firestoreエミュレータログ:**
- ターミナル1のコンソール出力を確認
- すべてのFirestore操作がログに記録される

## 最終チェックリスト

- [ ] すべてのサービスが起動している
- [ ] 基本的なCRUD操作が動作する
- [ ] エラーログが出ていない
- [ ] データの永続性が確認できる（再起動後もデータが残る）

## 次のステップ

1. すべての動作確認が完了したら、段階的にFirestoreへ移行
2. まず1つのコントローラー（例: Users）から移行
3. フロントエンドを更新して新旧両方のAPIをテスト
4. 問題がなければ、他のコントローラーも順次移行