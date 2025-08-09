# MongoDB から Firestore への移行ガイド

## 主な変更点

### 1. データモデルの変更

#### MongoDB (現在)
```javascript
// _id フィールドを使用
{
  _id: ObjectId("..."),
  name: "Project Name",
  createdAt: ISODate("...")
}
```

#### Firestore (移行後)
```javascript
// ドキュメントID と id フィールドを使用
{
  id: "auto-generated-id",
  name: "Project Name",
  createdAt: Timestamp
}
```

### 2. クエリの変更

#### MongoDB
```javascript
// Find
const projects = await Project.find({ userId: userId });

// Populate
const timeEntry = await TimeEntry.findById(id)
  .populate('project')
  .populate('user');
```

#### Firestore
```javascript
// クエリ
const projectsRef = db.collection('projects');
const snapshot = await projectsRef.where('userId', '==', userId).get();
const projects = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));

// 参照の解決（手動）
const timeEntryDoc = await db.collection('timeEntries').doc(id).get();
const timeEntry = { id: timeEntryDoc.id, ...timeEntryDoc.data() };
const projectDoc = await db.collection('projects').doc(timeEntry.projectId).get();
timeEntry.project = { id: projectDoc.id, ...projectDoc.data() };
```

### 3. インデックス

Firestore では複合クエリ用のインデックスを明示的に作成する必要があります：

```yaml
# firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "timeEntries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## 移行手順

### 1. バックエンドコードの更新

1. Firestore クライアントのインストール：
   ```bash
   cd server
   npm install @google-cloud/firestore
   ```

2. モデルファイルを Firestore 用に更新（例: `server/src/models/Project.firestore.ts`）

3. コントローラーを Firestore API に対応するよう更新

### 2. データの移行

移行スクリプトの例：

```javascript
// scripts/migrate-to-firestore.js
const { MongoClient } = require('mongodb');
const { Firestore } = require('@google-cloud/firestore');

async function migrate() {
  // MongoDB接続
  const mongoClient = await MongoClient.connect(process.env.MONGODB_URI);
  const mongodb = mongoClient.db();
  
  // Firestore接続
  const firestore = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT
  });
  
  // コレクションごとに移行
  const collections = ['users', 'projects', 'clients', 'timeEntries'];
  
  for (const collectionName of collections) {
    console.log(`Migrating ${collectionName}...`);
    
    const documents = await mongodb.collection(collectionName).find({}).toArray();
    const batch = firestore.batch();
    
    documents.forEach(doc => {
      // _id を id に変換
      const { _id, ...data } = doc;
      const ref = firestore.collection(collectionName).doc(_id.toString());
      
      // 日付フィールドを Timestamp に変換
      if (data.createdAt) {
        data.createdAt = Firestore.Timestamp.fromDate(new Date(data.createdAt));
      }
      if (data.updatedAt) {
        data.updatedAt = Firestore.Timestamp.fromDate(new Date(data.updatedAt));
      }
      
      batch.set(ref, { ...data, id: _id.toString() });
    });
    
    await batch.commit();
    console.log(`${collectionName} migrated: ${documents.length} documents`);
  }
  
  await mongoClient.close();
}

migrate().catch(console.error);
```

### 3. 環境変数の更新

```bash
# 削除
MONGODB_URI=mongodb://...

# 追加
GOOGLE_CLOUD_PROJECT=your-project-id
```

## 注意事項

1. **トランザクション**: Firestore のトランザクションは最大500ドキュメントまで
2. **リアルタイム更新**: Firestore はリアルタイムリスナーを標準サポート
3. **料金**: 読み取り・書き込み・削除の操作数に基づく課金

## ロールバック計画

1. MongoDB のバックアップを保持
2. 移行後も一定期間 MongoDB を稼働状態に保つ
3. Firestore のエクスポート機能を使用して定期バックアップ

```bash
# Firestore バックアップ
gcloud firestore export gs://your-bucket/firestore-backup
```