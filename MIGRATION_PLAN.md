# フロントエンド型安全化移行プラン

## 移行状況

### ✅ 完了
- [x] OpenAPI仕様書の作成 (`api/openapi.yaml`)
- [x] 型定義の自動生成 (`src/types/api.generated.ts`)
- [x] 型安全なAPIクライアント (`src/lib/api-client.ts`)
- [x] React Hooks (`src/hooks/useApi.ts`)
- [x] 新しいサービス層の作成
  - [x] `authService.new.ts`
  - [x] `timeEntryService.new.ts`
  - [x] `projectService.new.ts`

### 🚧 進行中
- [ ] サービス層の置き換え
- [ ] コンテキストの更新
- [ ] コンポーネントの更新

### 📋 TODO
1. **サービス層の置き換え** (Phase 1)
   - [ ] `authService.ts` → `authService.new.ts`
   - [ ] `timeEntryService.ts` → `timeEntryService.new.ts`
   - [ ] `projectService.ts` → `projectService.new.ts`
   - [ ] 他のサービス（clients, expenses, invoices）の作成

2. **コンテキストの更新** (Phase 2)
   - [ ] `AuthContext.tsx` - 新しいauthServiceを使用
   - [ ] `TimeEntryContext.tsx` - 新しいtimeEntryServiceを使用
   - [ ] `ProjectContext.tsx` - 新しいprojectServiceを使用
   - [ ] 他のコンテキストの更新

3. **コンポーネントの更新** (Phase 3)
   - [ ] `TimeTracking.tsx` - 型安全な実装に更新
   - [ ] `Dashboard.tsx` - 型安全な実装に更新
   - [ ] `Projects.tsx` - 型安全な実装に更新
   - [ ] `Reports.tsx` - 型安全な実装に更新
   - [ ] `Expenses.tsx` - 型安全な実装に更新
   - [ ] `Clients.tsx` - 型安全な実装に更新
   - [ ] `Invoices.tsx` - 型安全な実装に更新

4. **テストの更新** (Phase 4)
   - [ ] E2Eテストの更新
   - [ ] ユニットテストの追加

5. **クリーンアップ** (Phase 5)
   - [ ] 古いサービスファイルの削除
   - [ ] 未使用の依存関係の削除
   - [ ] ドキュメントの更新

## 移行手順

### Step 1: サービス層の切り替え
```bash
# バックアップ
mv src/services/authService.ts src/services/authService.old.ts
mv src/services/timeEntryService.ts src/services/timeEntryService.old.ts
mv src/services/projectService.ts src/services/projectService.old.ts

# 新しいファイルを有効化
mv src/services/authService.new.ts src/services/authService.ts
mv src/services/timeEntryService.new.ts src/services/timeEntryService.ts
mv src/services/projectService.new.ts src/services/projectService.ts
```

### Step 2: TypeScriptエラーの修正
```bash
# TypeScriptのコンパイルエラーを確認
npm run build

# エラーが出た箇所を修正
```

### Step 3: 実行時テスト
```bash
# 開発サーバーを起動
npm run dev:firestore

# 手動テスト項目
- [ ] ログイン/ログアウト
- [ ] タイマー開始/停止
- [ ] タイムエントリーのCRUD
- [ ] プロジェクトのCRUD
- [ ] ダッシュボード表示
```

## 型安全性のメリット

### Before (従来の実装)
```typescript
// 型が不明確
const response = await axios.get('/api/time-entries');
const entries = response.data.data; // any型

// プロパティ名のタイポに気づかない
entries.forEach(entry => {
  console.log(entry.projecct); // ❌ タイポしてもエラーにならない
});
```

### After (新しい実装)
```typescript
// 型が明確
const response = await apiClient.getMyTimeEntries();
const entries = response.data; // TimeEntry[]型

// プロパティ名のタイポは即座にエラー
entries.forEach(entry => {
  console.log(entry.projecct); // ✅ TypeScriptエラー
  console.log(entry.project); // ✅ 自動補完が効く
});
```

## リスクと対策

### リスク
1. **実行時エラー** - APIレスポンスの形式が異なる可能性
2. **認証の不整合** - トークン管理の変更による影響
3. **既存機能の破損** - 想定外の依存関係

### 対策
1. **段階的移行** - 一度にすべてを変更せず、段階的に移行
2. **フィーチャーフラグ** - 新旧の実装を切り替え可能にする
3. **ロールバック計画** - 問題が発生した場合の復旧手順を準備
4. **広範なテスト** - 各段階でE2Eテストを実行

## 成功基準

- [ ] すべてのTypeScriptエラーが解消
- [ ] E2Eテストがすべてパス
- [ ] APIレスポンスの型が正しく推論される
- [ ] IDEの自動補完が機能する
- [ ] ビルドサイズが大幅に増加していない

## タイムライン

- **Phase 1** (サービス層): 1日
- **Phase 2** (コンテキスト): 1日
- **Phase 3** (コンポーネント): 2-3日
- **Phase 4** (テスト): 1日
- **Phase 5** (クリーンアップ): 0.5日

**合計見積もり**: 5-6日

## 次のステップ

1. このプランのレビューと承認
2. Phase 1の実行開始
3. 各フェーズ完了後の動作確認
4. 問題があれば修正し、次のフェーズへ