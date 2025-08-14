# Firestore インデックス作成コマンド

## 🚀 インデックス作成方法

### 方法1: Firebase Console から作成（推奨）

以下のURLをクリックすると、自動的にインデックス作成画面が開きます。
「インデックスを作成」ボタンをクリックするだけで完了します。

#### 1. Expenses（経費）インデックス
```bash
# ブラウザで開く
open "https://console.firebase.google.com/v1/r/project/harvest-a82c0/firestore/indexes?create_composite=Ck5wcm9qZWN0cy9oYXJ2ZXN0LWE4MmMwL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9leHBlbnNlcy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoICgRkYXRlEAIaDAoIX19uYW1lX18QAg"
```

**インデックス内容:**
- コレクション: `expenses`
- フィールド1: `userId` (昇順)
- フィールド2: `date` (降順)
- フィールド3: `__name__` (降順)

#### 2. Clients（クライアント）インデックス
```bash
# エラーメッセージから取得したURLを使用
# APIを実行してエラーメッセージからURLを取得
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkdjVFd3amlOVnFxWk1oOGNLVktlIiwiaWF0IjoxNzU0ODg1NTM4LCJleHAiOjE3NTU0OTAzMzh9.vBy8NGZYJfOdNCa03bYwYMaWRcn8cqWhOP33xLvQbC4" \
  https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2/clients 2>/dev/null | \
  jq -r '.error' | \
  grep -o 'https://[^"]*'
```

**インデックス内容:**
- コレクション: `clients`
- フィールド1: `userId` (昇順)
- フィールド2: `createdAt` (降順)

#### 3. Invoices（請求書）インデックス
```bash
# エラーメッセージから取得したURLを使用
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IkdjVFd3amlOVnFxWk1oOGNLVktlIiwiaWF0IjoxNzU0ODg1NTM4LCJleHAiOjE3NTU0OTAzMzh9.vBy8NGZYJfOdNCa03bYwYMaWRcn8cqWhOP33xLvQbC4" \
  https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2/invoices 2>/dev/null | \
  jq -r '.error' | \
  grep -o 'https://[^"]*'
```

**インデックス内容:**
- コレクション: `invoices`
- フィールド1: `userId` (昇順)
- フィールド2: `createdAt` (降順)

---

### 方法2: gcloud コマンドライン（上級者向け）

gcloudコマンドを使用してインデックスを作成することも可能です。

#### 1. インデックス設定ファイルを作成

```bash
cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "expenses",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "clients",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "invoices",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "timeEntries",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF
```

#### 2. Firebase CLIでインデックスをデプロイ

```bash
# Firebase CLIでインデックスをデプロイ
firebase deploy --only firestore:indexes --project harvest-a82c0
```

---

### 方法3: Terraform で管理（Infrastructure as Code）

Terraformを使用してインデックスを管理する場合：

```hcl
# firestore_indexes.tf

resource "google_firestore_index" "expenses_user_date" {
  project    = "harvest-a82c0"
  database   = "(default)"
  collection = "expenses"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "date"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "clients_user_created" {
  project    = "harvest-a82c0"
  database   = "(default)"
  collection = "clients"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "invoices_user_created" {
  project    = "harvest-a82c0"
  database   = "(default)"
  collection = "invoices"

  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}
```

実行コマンド：
```bash
cd deploy/terraform
terraform apply
```

---

## 📋 インデックス作成状況の確認

### Firebase Console で確認

```bash
# Firebase Console のインデックス管理画面を開く
open "https://console.firebase.google.com/project/harvest-a82c0/firestore/indexes"
```

### gcloud コマンドで確認

```bash
# 現在のインデックス一覧を表示
gcloud firestore indexes list --project=harvest-a82c0
```

---

## ⏱️ インデックス作成時間

- 通常: **5-10分**
- 大量データがある場合: **最大30分**

インデックスのステータス：
1. `CREATING` - 作成中
2. `READY` - 利用可能
3. `ERROR` - エラー（再作成が必要）

---

## 🔍 インデックスが必要かどうかの確認方法

### 1. エラーメッセージで確認
```bash
# 各エンドポイントをテスト
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2/expenses/me

# エラーレスポンスの例
{
  "success": false,
  "error": "9 FAILED_PRECONDITION: The query requires an index..."
}
```

### 2. Cloud Runログで確認
```bash
# エラーログを確認
gcloud run services logs read harvest-backend \
  --region asia-northeast1 \
  --limit 50 | grep "FAILED_PRECONDITION"
```

---

## ✅ 作成完了後の確認

インデックス作成完了後、各APIが正常に動作することを確認：

```bash
# トークンを取得
TOKEN=$(curl -s -X POST https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' | jq -r '.token')

# 各エンドポイントをテスト
echo "Testing expenses..."
curl -s -H "Authorization: Bearer $TOKEN" \
  https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2/expenses/me | jq '.success'

echo "Testing clients..."
curl -s -H "Authorization: Bearer $TOKEN" \
  https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2/clients | jq '.success'

echo "Testing invoices..."
curl -s -H "Authorization: Bearer $TOKEN" \
  https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2/invoices | jq '.success'

echo "Testing projects..."
curl -s -H "Authorization: Bearer $TOKEN" \
  https://harvest-backend-sxoezkwvgq-an.a.run.app/api/v2/projects | jq '.success'
```

すべてのAPIが `"success": true` を返せば、インデックス作成は完了です！

---

*作成日: 2025年8月11日*
*プロジェクト: Harvest-like*