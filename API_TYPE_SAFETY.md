# API Type Safety with OpenAPI

このプロジェクトでは、OpenAPI仕様から自動生成された型定義を使用して、フロントエンドとバックエンド間の型安全性を実現しています。

## セットアップ

### 1. 型定義の生成

```bash
# OpenAPI仕様から型定義を生成
npm run generate:types

# ファイル変更を監視して自動生成
npm run generate:types:watch
```

### 2. 生成されるファイル

- `api/openapi.yaml` - OpenAPI仕様書（ソース）
- `src/types/api.generated.ts` - 自動生成された型定義
- `src/lib/api-client.ts` - 型安全なAPIクライアント
- `src/hooks/useApi.ts` - React Hooks

## 使用方法

### 基本的な使用例

```tsx
import { useTimeEntries, useStartTimer, useStopTimer } from '@/hooks/useApi';

function TimeTracker() {
  // 型安全なデータ取得
  const { data: entries, loading, error, refetch } = useTimeEntries({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  // 型安全なミューテーション
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const handleStart = async () => {
    try {
      // TypeScriptが必須フィールドをチェック
      const result = await startTimer.execute({
        projectId: 'project-123',
        task: 'Development',
        isBillable: true
      });
      console.log('Timer started:', result);
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handleStop = async () => {
    try {
      const result = await stopTimer.execute('完了しました');
      await refetch(); // データを再取得
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {entries?.data?.map(entry => (
        <div key={entry.id}>
          {entry.project?.name} - {entry.task}
        </div>
      ))}
      <button onClick={handleStart}>Start Timer</button>
      <button onClick={handleStop}>Stop Timer</button>
    </div>
  );
}
```

### 直接APIクライアントを使用

```tsx
import { apiClient } from '@/lib/api-client';
import type { CreateProjectRequest } from '@/lib/api-client';

async function createProject() {
  const projectData: CreateProjectRequest = {
    name: 'New Project',
    description: 'Project description',
    client: 'Client Name',
    status: 'active', // TypeScriptが有効な値をチェック
    tasks: [
      {
        name: 'Design',
        isBillable: true,
        rate: 100
      }
    ]
  };

  try {
    const response = await apiClient.createProject(projectData);
    console.log('Project created:', response);
  } catch (error) {
    console.error('Failed to create project:', error);
  }
}
```

### カスタムフックの作成

```tsx
import { useApiCall } from '@/hooks/useApi';
import { apiClient } from '@/lib/api-client';
import type { TimeEntry } from '@/lib/api-client';

// カスタムビジネスロジックを含むフック
export function useWeeklyReport() {
  const getEntries = useApiCall(() => {
    const startDate = getWeekStart();
    const endDate = getWeekEnd();
    return apiClient.getMyTimeEntries({ startDate, endDate });
  });

  const calculateTotal = (entries: TimeEntry[]) => {
    return entries.reduce((total, entry) => {
      return total + (entry.duration || 0);
    }, 0);
  };

  const generateReport = async () => {
    const response = await getEntries.execute();
    if (response?.data) {
      const totalHours = calculateTotal(response.data) / 3600;
      return {
        entries: response.data,
        totalHours,
        weekStart: getWeekStart(),
        weekEnd: getWeekEnd()
      };
    }
    return null;
  };

  return {
    generateReport,
    loading: getEntries.loading,
    error: getEntries.error
  };
}
```

## 型定義の利点

### 1. 自動補完

IDEが利用可能なプロパティとメソッドを自動的に提案します。

### 2. コンパイル時エラー検出

```tsx
// ❌ TypeScriptエラー：必須フィールドが不足
const result = await startTimer.execute({
  projectId: 'project-123'
  // 'task' フィールドが必須です
});

// ❌ TypeScriptエラー：無効な値
const project = await apiClient.createProject({
  name: 'Project',
  status: 'invalid-status' // 'active' | 'completed' | 'on-hold' のみ許可
});
```

### 3. リファクタリングの安全性

OpenAPI仕様を変更して型を再生成すると、変更の影響を受けるすべてのコードがTypeScriptによって検出されます。

## ワークフロー

### 1. API変更時のワークフロー

1. `api/openapi.yaml`を更新
2. `npm run generate:types`を実行
3. TypeScriptエラーを確認・修正
4. テストを実行

### 2. 新しいエンドポイント追加時

1. OpenAPI仕様にエンドポイントを追加
2. 型を生成
3. `api-client.ts`にメソッドを追加（必要に応じて）
4. `useApi.ts`にフックを追加（必要に応じて）
5. コンポーネントで使用

## トラブルシューティング

### 型が生成されない

```bash
# OpenAPIツールを再インストール
npm install --save-dev openapi-typescript@latest

# キャッシュをクリア
rm -rf node_modules/.cache
npm run generate:types
```

### 型の不一致

バックエンドのAPIレスポンスとOpenAPI仕様が一致していない可能性があります。実際のAPIレスポンスを確認し、OpenAPI仕様を更新してください。

### Firestoreタイムスタンプの扱い

Firestoreのタイムスタンプは特殊な形式のため、OpenAPI仕様では以下のように定義しています：

```yaml
startTime:
  oneOf:
    - type: string
      format: date-time
    - type: object
      properties:
        _seconds:
          type: number
        _nanoseconds:
          type: number
```

## ベストプラクティス

1. **型を信頼する** - 生成された型を`any`でバイパスしない
2. **エラーハンドリング** - すべてのAPI呼び出しでエラーを適切に処理
3. **ローディング状態** - ユーザーにフィードバックを提供
4. **キャッシング** - 必要に応じてReact QueryやSWRを導入
5. **再利用** - 共通のロジックをカスタムフックに抽出

## 今後の改善案

1. **React Query統合** - より高度なキャッシングとデータ同期
2. **WebSocket対応** - リアルタイム更新の型安全性
3. **モックサーバー** - OpenAPI仕様からモックAPIを自動生成
4. **E2Eテスト** - 型定義を使用した統合テスト