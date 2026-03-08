# UIアーキテクチャ設計（apps/web）

最終更新: 2026年3月8日 20:20 (JST)

## 1. 背景と課題

現行の `apps/web` UI には以下の課題がある。

- `apps/web/.next` が Git 追跡対象になっている（ビルド成果物が 178 ファイル）
- ページごとに `<main>` 直書き、`<table>` 直書き、インライン style 直書きが混在している
- ログイン画面（`/unlock`）を除き、全画面共通のヘッダー/ナビゲーションがない
- 画面構造（タイトル、説明、フィルタ、テーブル、エラー表示）が統一されていない
- アクション UI（承認/却下/再実行）が最低限で、状態表示や操作導線が弱い

このため、保守性・拡張性・見た目品質のすべてが頭打ちになっている。

## 2. 目的

以下を満たす UI 基盤を設計する。

1. `shadcn/ui` を導入して見た目と実装の標準化を行う
2. 認証後に意図した画面へ戻れる導線を維持しつつ、ヘッダーから主要画面へ遷移可能にする
3. 各画面のページ骨格を共通化する
4. 不要要素・重複要素・生成物コミットを整理する
5. 設計を `docs/ui-archtecture.md` に固定し、実装の受け皿にする

## 3. スコープ

### 対象

- `apps/web/src/app` 配下の UI 画面
- UI レイヤーの共通コンポーネント
- UI 用スタイル基盤（Tailwind + shadcn）
- UI 認証導線（`proxy.ts`, `/unlock`, `/api/ui-auth`）
- UI ドキュメントと運用ルール

### 非対象

- バックエンドの業務ロジック（domain/db/jobs）
- Android 側実装
- API 仕様変更（UI が必要とする軽微な応答形式整理を除く）

## 4. 設計方針

### 4.1 デザインシステム方針

- `apps/web` に `shadcn/ui` を導入し、UI primitive を `apps/web/src/components/ui/*` に配置する
- テーマ変数は `apps/web/src/app/globals.css` で一元管理する
- 新規 UI は原則 `shadcn/ui` + Tailwind utility で構築し、インライン style を禁止する
- 既存 `@merchandise/ui` は段階的に縮小する
  - 当面は利用継続可能
  - 新規追加は禁止
  - 置き換え完了後に廃止を検討

### 4.2 画面構造共通化方針

- ルートグループを分離する
  - `src/app/(auth)/unlock/page.tsx`: 認証専用
  - `src/app/(app)/*`: 認証後画面群
- `src/app/(app)/layout.tsx` で `AppShell` を適用する
  - `AppHeader`（ロゴ/主要ナビ/クイックアクション）
  - `AppContent`（共通幅コンテナ）
- 各画面は `PageScaffold` を使用する
  - `title`, `description`, `actions`, `children` を標準 props 化

### 4.3 ログイン遷移方針

現状の `next` パラメータ設計（`normalizeNextPath`）は妥当なため維持する。その上で以下を追加する。

- `/unlock` には明示的に「ログイン後に遷移する画面」を表示する（ユーザーの不安軽減）
- 認証済み状態で `/unlock` に来た場合は `next` があれば `next`、なければ `/` へ遷移
- ヘッダーに常時主要画面ナビを持たせ、ログイン直後でも迷わず遷移できる状態を作る
- 任意で `POST /api/ui-auth/logout` を追加し、ヘッダーからログアウト可能にする

## 5. 画面情報設計（IA）

### 5.1 グローバルナビゲーション

ヘッダーに以下を固定表示する。

- Dashboard (`/`)
- Candidates (`/candidates`)
- Targets (`/targets`)
- Price Snapshots (`/price-snapshots`)
- Runs (`/runs`)
- Raw Events (`/raw-events`)
- Settings (`/settings`)

要件:

- 現在ページを `active` 表示
- モバイル時は `Sheet` ベースのメニューにフォールバック
- 全ページで同一のキー操作順序とフォーカス可視化

### 5.2 各ページの共通骨格

全ページを以下の並びに統一する。

1. `PageHeader`（タイトル・説明・右上アクション）
2. `Toolbar`（件数、フィルタ、更新ボタン）
3. `DataCard`（テーブル本体）
4. `DataState`（空・エラー・ローディング）

## 6. コンポーネント設計

### 6.1 新規共通コンポーネント

- `src/components/layout/app-shell.tsx`
- `src/components/layout/app-header.tsx`
- `src/components/layout/app-nav.tsx`
- `src/components/page/page-scaffold.tsx`
- `src/components/page/data-section.tsx`
- `src/components/feedback/empty-state.tsx`
- `src/components/feedback/error-state.tsx`

### 6.2 shadcn で採用する primitive（初期）

- `button`
- `card`
- `badge`
- `table`
- `dropdown-menu`
- `sheet`
- `separator`
- `alert`
- `input`
- `form`
- `toast`（任意、アクション結果通知で使用）

### 6.3 既存画面ごとの置換方針

- `page.tsx`（ホーム）
  - リンク羅列を廃止し、各画面へのカード型ダッシュボードに置換
  - 「Ingest API: /api/ingest/android」の露出は削除（運用情報は Settings へ）
- `raw-events`, `targets`, `price-snapshots`
  - 生 `<table>` を共通 `DataTable`（shadcn `Table` ベース）へ統一
- `candidates`, `runs`
  - 既存の `@merchandise/ui` 依存を `PageScaffold` + shadcn ベースに置換
- `unlock`
  - インライン style を廃止し、中央カード型レイアウトで統一
  - エラー表示を `Alert` で明示

## 7. 不要要素整理

### 7.1 `.next` 追跡解除

実装時に必ず以下を実施する。

- `.gitignore` に `apps/web/.next` を追加
- 追跡済み成果物を Git インデックスから除外
  - `git rm -r --cached apps/web/.next`
- CI/ローカルで `build` 再実行し、成果物再コミットが発生しないことを確認

### 7.2 UI 実装ルール整理

- インライン style を禁止
- 画面内の生英語/日本語の揺れを統一（ラベル辞書化）
- `prompt()` 依存 UI（却下理由入力）は `Dialog` + `Textarea` に置換
- 成功/失敗メッセージは `toast` か `inline alert` に統一

## 8. ディレクトリ設計（実装後の想定）

```txt
apps/web/src/
  app/
    (auth)/
      unlock/page.tsx
    (app)/
      layout.tsx
      page.tsx
      candidates/page.tsx
      targets/page.tsx
      price-snapshots/page.tsx
      runs/page.tsx
      raw-events/page.tsx
      settings/page.tsx
    globals.css
  components/
    ui/*                # shadcn generated
    layout/*
    page/*
    feedback/*
    features/
      candidates/*
      runs/*
  lib/
    navigation.ts       # nav items, labels
    format.ts           # 日付・金額フォーマット
```

## 9. 品質基準（言われなくてもやる項目）

- アクセシビリティ
  - ヘッダー、ナビ、テーブルに適切な role/label を付与
  - キーボード操作のみで主要操作が完結すること
- レスポンシブ
  - 375px 幅で崩れないこと
  - テーブルは横スクロール可 + ヘッダー可読性維持
- 一貫したデータ状態
  - loading / empty / error を全ページで同じ UI にする
- テスト
  - 既存 API テストを維持
  - UI の最低限のレンダリングテストを追加（`PageScaffold`, `AppHeader`）
  - `normalizeNextPath` を含む認証リダイレクト回帰を維持

## 10. 実装フェーズ

### Phase 0: 事前整理

- `.next` 追跡解除
- `apps/web/.gitignore` 整備

### Phase 1: 基盤導入

- Tailwind + shadcn 初期セットアップ
- `globals.css` とテーマトークン定義

### Phase 2: レイアウト共通化

- route group 分離（`(auth)` / `(app)`）
- `AppShell`, `AppHeader`, `PageScaffold` 導入

### Phase 3: 各画面移行

- `raw-events`, `targets`, `price-snapshots` を統一テーブル化
- `candidates`, `runs` のアクション UI 改修
- `settings`, `home` の情報整理

### Phase 4: 導線・品質仕上げ

- ログイン/ログアウト導線最終化
- 文言統一、アクセシビリティ確認、テスト追加

## 11. 受け入れ基準

- shadcn コンポーネントが `apps/web` で利用され、インライン style が主要画面から排除されている
- 認証後に `next` で元画面へ戻れる（回帰なし）
- 全画面が共通ヘッダーと共通ページ骨格を持つ
- 不要要素（トップの生リンク一覧、露出不要情報、`prompt()` UI）が整理されている
- `docs/ui-archtecture.md` と実装が乖離しない

## 12. リスクと緩和策

- リスク: 既存 `@merchandise/ui` と shadcn の二重管理が長期化する
  - 緩和: 新規 UI は shadcn のみ許可し、置換完了期限を設定
- リスク: レイアウト変更で認証リダイレクトが壊れる
  - 緩和: `proxy` と `/api/ui-auth` のテストを先に固定
- リスク: テーブル UI 変更で操作手順が分かりづらくなる
  - 緩和: 既存列順を維持しつつ、操作列だけ改善する段階移行にする
