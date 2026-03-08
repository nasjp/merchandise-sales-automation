---
name: merchandise-db-and-test-spec
description: "merchandise-sales-automation の DB テスト（PGlite）と各種テストの実装規約。table-driven / data-only / 1ケース1DB を標準化する。"
---

## 目的
このドキュメントは、`merchandise-sales-automation` におけるテスト実装の共通規約です。
特に DB テストでは、`@merchandise/db/test` の PGlite helper を使い、
再現性・可読性・保守性を優先した書き方に統一します。

## 適用範囲
- DB を読む/書く repository・query・command のテスト
- `packages/domain` の pure function テスト
- `packages/mercari` の parser テスト
- `apps/web` API テスト
- `apps/jobs` task テスト

## 共通原則
- テストは仕様（契約）を確認するために書く
- 実装詳細や ORM の内部挙動を過剰に固定しない
- table-driven（`test.each`）を基本にする
- テストデータは data-only（配列/オブジェクト）で宣言する
- 配列順が不定な場合は `sort()` して比較する
- ランダム値・現在時刻依存を最小化する

## DB テスト規約（最重要）

### 対象
`packages/db/src/repositories/*.ts`（または DB 依存の query/command 実装）

### 絶対ルール
- `repositoryLocator` 経由で呼び出す（直接 new / 直接 import 呼び出しを避ける）
- 正常系/異常系は `describe` を分割する
- assert 関数をテーブルに入れない
- ケースが 1 件でも `test.each` を使う
- `toStrictEqual` は標準にしない
- `beforeAll/beforeEach/afterAll/afterEach` を使わない
- 1 ケース = 1 DB
- `setupTestContext()` を使い、`await using ctx = await setupTestContext()` で dispose する
- seed は最小限（FK/NOT NULL/unique/check に必要なものだけ）
- ID は固定文字列を使う（例: `target-1`, `raw-1`）

### DB ライフサイクル
- テスト DB は必ず `@merchandise/db/test` の `db({ migrations, cache })` を使う
- デフォルトは `db({ migrations: true, cache: true })` を推奨
- migration は `database/migrations` を正本として適用する
- 必要に応じて `DATABASE_MIGRATIONS_PATH` で migration パスを切り替える

### 推奨テンプレ
```ts
import { describe, expect, test } from "vitest";
import { db } from "@merchandise/db/test";
import { repositoryLocator } from "./locator";

const setupTestContext = async () => {
  const testDb = await db({ migrations: true, cache: true });

  const ctx = {
    testDb,
    repositoryLocator,
  };

  return Object.assign(ctx, {
    async [Symbol.asyncDispose]() {
      await testDb[Symbol.asyncDispose]();
    },
  });
};

describe("repositoryLocator.<repo>.<method>", () => {
  describe("正常系", () => {
    const cases = [
      {
        name: "returns rows",
        params: {},
        want: {},
      },
    ] as const;

    test.each(cases)("$name", async (tc) => {
      await using ctx = await setupTestContext();
      const got = await ctx.repositoryLocator.<repo>.<method>(ctx.testDb, tc.params);
      expect(got).toMatchObject(tc.want);
    });
  });

  describe("異常系", () => {
    const cases = [
      {
        name: "rejects invalid param",
        params: {},
      },
    ] as const;

    test.each(cases)("$name", async (tc) => {
      await using ctx = await setupTestContext();
      await expect(
        ctx.repositoryLocator.<repo>.<method>(ctx.testDb, tc.params),
      ).rejects.toThrow();
    });
  });
});
```

## アサーション方針

### 1. まず `toEqual` を検討
固定可能な構造は `toEqual` で比較する。

### 2. 動的フィールドは `expect.any(...)` / `toBeInstanceOf(Date)`
`id`, `createdAt`, `updatedAt`, `executedAt` などは値一致ではなく型/存在を検証する。

### 3. 重要箇所だけ見る時は `toMatchObject`
部分一致で意図を明確化する。

### 4. `toStrictEqual` は意図がある場合のみ
`undefined` と欠損を区別したい等、契約として固定する場合に限定する。

### 5. スナップショットは限定利用
巨大レスポンスの契約固定など、レビュー価値がある箇所だけに使う。

## その他テスト規約

### `packages/domain`（pure function）
- DB/HTTP/LLM モックを持ち込まない
- 入力→出力契約を table-driven で網羅する
- 境界値（0, 最小, 最大, 不正値）を必ず含める

### `packages/mercari`（parser）
- 文字列パターンごとに table-driven で網羅する
- ノイズや表記ゆれ（全角/半角、送料表現、ジャンク語）をケース化する
- parser の副作用は持たせない

### `apps/web`（API）
- ingest/approve/reject/refresh などの契約を HTTP レベルで検証する
- 認可エラー（401/403）と入力エラー（400系）を分離して検証する
- 永続化結果は DB を読んで確認する

### `apps/jobs`（Trigger task）
- task ごとに正常系・リトライ系・失敗系を分ける
- 冪等性（同一イベント再実行）を検証する
- 外部依存（LLM/API）は adapter 境界で差し替える

## 実装手順（DB テスト追加時）
1. 対象実装の公開メソッドと分岐を洗い出す
2. schema から FK/unique/not null/check を確認し最小 seed を確定する
3. `setupTestContext` を用意する
4. `describe("repositoryLocator.<repo>.<method>")` を作る
5. behavior 単位で `describe` を分割する（insert/upsert/early return/errors）
6. data-only table-driven で実装する
7. 失敗したら以下優先で修正する

修正優先順位:
1. テストデータの制約違反を直す
2. seed 不足を補う
3. アサーションを壊れにくく直す
4. 実装と仕様の矛盾を最小差分で修正する

## 実行コマンド
- 単体ファイル:
  - `pnpm --filter @merchandise/db exec vitest run src/<target>.test.ts`
- DB package 全体:
  - `pnpm --filter @merchandise/db test`
- リポジトリ全体:
  - `pnpm test`

## Done 条件
- 追加したテストが全てパスする
- table-driven / data-only / 1ケース1DB を守っている
- `repositoryLocator` 経由の呼び出しになっている
- `toStrictEqual` の乱用がない
- before/after hooks を使っていない
- 不要な本体修正をしていない（必要時は最小差分で理由を説明できる）
