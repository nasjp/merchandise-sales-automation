import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageScaffold } from "@/components/page/page-scaffold";
import { formatDateTime } from "@/lib/format";
import { getDataHealthSummary } from "@/server/queries/settings";
import { shouldProtectUi } from "@/server/uiPasswordGate";

export const dynamic = "force-dynamic";

const envState = (enabled: boolean) =>
  enabled ? <Badge>configured</Badge> : <Badge variant="destructive">missing</Badge>;

export default async function SettingsPage() {
  const summary = await getDataHealthSummary();
  const authProtectionEnabled = shouldProtectUi(process.env);

  const settings = [
    {
      name: "DATABASE_URL",
      state: envState(Boolean(process.env.DATABASE_URL)),
      note: "DB接続（未設定だと各画面で取得失敗）",
    },
    {
      name: "ANDROID_INGEST_SHARED_SECRET",
      state: envState(Boolean(process.env.ANDROID_INGEST_SHARED_SECRET)),
      note: "Android ingest署名検証",
    },
    {
      name: "TRIGGER_API_BASE_URL",
      state: envState(Boolean(process.env.TRIGGER_API_BASE_URL)),
      note: "Trigger API ベースURL（未指定時は https://api.trigger.dev）",
    },
    {
      name: "TRIGGER_API_KEY",
      state: envState(
        Boolean(
          process.env.TRIGGER_API_KEY ??
            process.env.TRIGGER_SECRET_KEY ??
            process.env.TRIGGER_ACCESS_TOKEN,
        ),
      ),
      note: "Trigger 実行キー（project API key 推奨）",
    },
    {
      name: "PASSWORD",
      state: authProtectionEnabled
        ? envState(Boolean(process.env.PASSWORD))
        : <Badge variant="secondary">non-production</Badge>,
      note: "本番UIのログイン保護",
    },
  ] as const;

  return (
    <PageScaffold title="Settings" description="運用時の診断情報と設定状態を確認します。">
      {summary.activeTargetCount === 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Targets が 0 件です</AlertTitle>
          <AlertDescription>
            `targets` が空のため `/targets` と `/price-snapshots` が空表示になります。README の
            `pnpm db:seed` 手順を確認してください。
          </AlertDescription>
        </Alert>
      ) : null}

      {summary.activeTargetCount > 0 && summary.recentSnapshotCount === 0 ? (
        <Alert>
          <AlertTitle>Price Snapshots が 0 件です</AlertTitle>
          <AlertDescription>
            ターゲットは存在しますがスナップショットが未生成です。`/targets` で「相場更新」を実行してください。
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Environment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {settings.map((item) => (
              <div key={item.name} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs">{item.name}</p>
                  {item.state}
                </div>
                <p className="mt-2 text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Runbook</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Link href="/runs" className="underline underline-offset-4">
            `/runs` で失敗 run の再処理を実行
          </Link>
          <Link href="/targets" className="underline underline-offset-4">
            `/targets` で相場更新ジョブを投入
          </Link>
          <p className="text-muted-foreground">
            運用手順: `docs/runbook.md` / `docs/operations.md`
          </p>
        </CardContent>
      </Card>
    </PageScaffold>
  );
}
