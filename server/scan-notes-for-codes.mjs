/**
 * 既存の時間記録のメモ（notes）からプロジェクトコード候補を抽出するスクリプト
 *
 * このスクリプトはデータの確認のみ（読み取り専用）で、変更は行いません。
 *
 * 実行方法:
 *   cd server
 *   GOOGLE_CLOUD_PROJECT=harvest-a82c0 node scan-notes-for-codes.mjs
 */

import { Firestore } from '@google-cloud/firestore';

const projectId = 'harvest-a82c0';
const db = new Firestore({ projectId });

async function scanNotesForCodes() {
  try {
    console.log('=== 既存データスキャン開始 ===\n');

    // 1. 全プロジェクトを取得
    const projectsSnapshot = await db.collection('projects').get();
    const projects = [];
    projectsSnapshot.forEach(doc => {
      projects.push({ id: doc.id, ...doc.data() });
    });

    console.log(`📁 プロジェクト数: ${projects.length}`);
    console.log('---');

    // プロジェクト一覧と現在のコード状況
    console.log('\n📋 プロジェクト一覧（現在のコード設定状況）:');
    projects.forEach(p => {
      const code = p.code || '(未設定)';
      const taskInfo = (p.tasks || []).map(t => {
        const subCode = t.subCode || '(未設定)';
        return `    タスク: ${t.name} → サブコード: ${subCode}`;
      }).join('\n');
      console.log(`  [${code}] ${p.name} (ID: ${p.id})`);
      if (taskInfo) console.log(taskInfo);
    });

    // 2. 全時間記録を取得
    const timeEntriesSnapshot = await db.collection('timeEntries').get();
    const timeEntries = [];
    timeEntriesSnapshot.forEach(doc => {
      timeEntries.push({ id: doc.id, ...doc.data() });
    });

    console.log(`\n⏱️  時間記録数: ${timeEntries.length}`);
    console.log('---');

    // 3. メモにコード的なパターンが含まれるエントリを抽出
    // よくあるコードパターン: PRJ-001, ABC-123, #1234, [CODE], 等
    const codePatterns = [
      /([A-Z]{2,10}[-_]\d{1,5})/g,           // PRJ-001, ABC-123 形式
      /\[([A-Z0-9]{2,10}[-_]?\d{0,5})\]/g,   // [PRJ001] [CODE-1] 形式
      /#([A-Z0-9]{2,10}[-_]?\d{0,5})/g,      // #PRJ001 形式
    ];

    const notesWithCodes = new Map(); // projectId → Set of code candidates
    const projectNotesSample = new Map(); // projectId → sample notes

    timeEntries.forEach(entry => {
      const notes = entry.notes || entry.description || '';
      if (!notes.trim()) return;

      const projectId = entry.projectId;
      if (!projectId) return;

      // メモのサンプルを保存（各プロジェクト最大5件）
      if (!projectNotesSample.has(projectId)) {
        projectNotesSample.set(projectId, []);
      }
      const samples = projectNotesSample.get(projectId);
      if (samples.length < 5) {
        samples.push(notes.substring(0, 100));
      }

      // コードパターンを検索
      for (const pattern of codePatterns) {
        const matches = notes.matchAll(pattern);
        for (const match of matches) {
          const code = match[1] || match[0];
          if (!notesWithCodes.has(projectId)) {
            notesWithCodes.set(projectId, new Set());
          }
          notesWithCodes.get(projectId).add(code);
        }
      }
    });

    // 4. 結果を表示
    console.log('\n📝 プロジェクト別メモサンプル:');
    for (const project of projects) {
      const samples = projectNotesSample.get(project.id) || [];
      if (samples.length > 0) {
        console.log(`\n  プロジェクト: ${project.name} (ID: ${project.id})`);
        console.log(`  現在のコード: ${project.code || '(未設定)'}`);
        samples.forEach((s, i) => {
          console.log(`    メモ${i + 1}: "${s}"`);
        });
      }
    }

    console.log('\n\n🔍 メモからコード候補を検出:');
    if (notesWithCodes.size === 0) {
      console.log('  コードパターンは検出されませんでした。');
      console.log('  → メモの内容を確認して、手動でコードを設定するか、');
      console.log('    register-project-codes.mjs でプロジェクト名ベースの自動生成を使用してください。');
    } else {
      for (const [pid, codes] of notesWithCodes) {
        const project = projects.find(p => p.id === pid);
        console.log(`  プロジェクト: ${project?.name || pid}`);
        console.log(`    検出コード候補: ${[...codes].join(', ')}`);
      }
    }

    // 5. コード未設定のプロジェクト一覧
    const projectsWithoutCode = projects.filter(p => !p.code);
    console.log(`\n\n⚠️  コード未設定のプロジェクト: ${projectsWithoutCode.length}件`);
    projectsWithoutCode.forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id})`);
    });

    // 6. 推奨アクション
    console.log('\n\n💡 推奨アクション:');
    console.log('  1. 上記の情報を確認してください');
    console.log('  2. register-project-codes.mjs を使ってコードを一括登録できます');
    console.log('     使い方:');
    console.log('     GOOGLE_CLOUD_PROJECT=harvest-a82c0 node register-project-codes.mjs');
    console.log('');

  } catch (error) {
    console.error('エラー:', error);
  }

  process.exit(0);
}

scanNotesForCodes();
