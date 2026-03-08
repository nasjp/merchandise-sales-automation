import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { DataSection } from "@/components/page/data-section";
import { PageScaffold } from "@/components/page/page-scaffold";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatYen } from "@/lib/format";
import { listRecentSnapshots } from "@/server/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function PriceSnapshotsPage() {
  try {
    const rows = await listRecentSnapshots(50);

    return (
      <PageScaffold title="Price Snapshots" description="相場データの履歴を確認できます。">
        <DataSection
          title="Price Snapshots"
          subtitle="最新 50 件"
          toolbar={<Badge variant="secondary">件数: {rows.length}</Badge>}
        >
          {rows.length === 0 ? (
            <EmptyState description="相場データがまだありません。`/targets` の「相場更新」を実行してください。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Target ID</TableHead>
                  <TableHead className="text-right">Sell Estimate</TableHead>
                  <TableHead className="text-right">Buy Limit</TableHead>
                  <TableHead className="text-right">Liquidity</TableHead>
                  <TableHead>Observed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.id}</TableCell>
                    <TableCell className="font-mono text-xs">{row.targetId}</TableCell>
                    <TableCell className="text-right">{formatYen(row.sellEstimateYen)}</TableCell>
                    <TableCell className="text-right">{formatYen(row.buyLimitYen)}</TableCell>
                    <TableCell className="text-right">{row.liquidityScore.toFixed(2)}</TableCell>
                    <TableCell>{formatDateTime(row.observedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DataSection>
      </PageScaffold>
    );
  } catch (error) {
    return (
      <PageScaffold title="Price Snapshots" description="相場データの履歴を確認できます。">
        <ErrorState message={error instanceof Error ? error.message : "unknown error"} />
      </PageScaffold>
    );
  }
}
