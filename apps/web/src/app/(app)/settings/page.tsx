import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageScaffold } from "@/components/page/page-scaffold";
import { formatDateTime } from "@/lib/format";
import { getDataHealthSummary } from "@/server/queries/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const summary = await getDataHealthSummary();

  return (
    <PageScaffold title="Settings" description="運用状況の確認と対応手順の参照ができます。">
      {summary.activeTargetCount === 0 ? (
        <Alert variant="destructive">
          <AlertTitle>監視対象が登録されていません</AlertTitle>
          <AlertDescription>
            監視対象が未登録のため、`/targets` と `/price-snapshots` は空になります。初期設定を完了してください。
          </AlertDescription>
        </Alert>
      ) : null}

      {summary.activeTargetCount > 0 && summary.recentSnapshotCount === 0 ? (
        <Alert>
          <AlertTitle>相場データがまだ作成されていません</AlertTitle>
          <AlertDescription>
            監視対象は登録済みですが、相場データがありません。`/targets` で「相場更新」を実行してください。
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Health (latest 50)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p>active targets: {summary.activeTargetCount}</p>
          <p>recent snapshots: {summary.recentSnapshotCount}</p>
          <p>recent candidates: {summary.recentCandidateCount}</p>
          <p>recent raw events: {summary.recentRawEventCount}</p>
          <p>
            latest snapshot:{" "}
            {summary.latestSnapshotObservedAt
              ? formatDateTime(summary.latestSnapshotObservedAt)
              : "-"}
          </p>
          <p>
            latest raw event:{" "}
            {summary.latestRawEventReceivedAt
              ? formatDateTime(summary.latestRawEventReceivedAt)
              : "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Runbook</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p className="text-muted-foreground">
            日次確認、障害トリアージ、再処理基準、エスカレーション基準を Runbook に集約しています。
          </p>
          <Link href="/runs" className="underline underline-offset-4">
            `/runs` で失敗した実行を再処理する
          </Link>
          <Link href="/targets" className="underline underline-offset-4">
            `/targets` で相場データを更新する
          </Link>
          <p className="text-muted-foreground">運用手順: `docs/runbook.md` / `docs/operations.md`</p>
        </CardContent>
      </Card>
    </PageScaffold>
  );
}
