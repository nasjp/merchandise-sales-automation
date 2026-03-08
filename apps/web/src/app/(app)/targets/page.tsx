import { TargetRefreshAction } from "./TargetRefreshAction";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { DataSection } from "@/components/page/data-section";
import { PageScaffold } from "@/components/page/page-scaffold";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatYen } from "@/lib/format";
import { listActiveTargets } from "@/server/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function TargetsPage() {
  try {
    const rows = await listActiveTargets();

    return (
      <PageScaffold title="Targets" description="監視対象と最新の相場情報を確認できます。">
        <DataSection
          title="Active Targets"
          subtitle="有効ターゲット"
          toolbar={<Badge variant="secondary">件数: {rows.length}</Badge>}
        >
          {rows.length === 0 ? (
            <EmptyState description="監視対象がまだ登録されていません。登録後にここへ表示されます。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Title Keyword</TableHead>
                  <TableHead>Model Keyword</TableHead>
                  <TableHead className="text-right">Sell Estimate</TableHead>
                  <TableHead className="text-right">Buy Limit</TableHead>
                  <TableHead className="text-right">Liquidity</TableHead>
                  <TableHead>Observed At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="w-[10rem]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.id}</TableCell>
                    <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                    <TableCell>{row.titleKeyword}</TableCell>
                    <TableCell>{row.modelKeyword ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {row.latestSnapshot ? formatYen(row.latestSnapshot.sellEstimateYen) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.latestSnapshot ? formatYen(row.latestSnapshot.buyLimitYen) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.latestSnapshot ? row.latestSnapshot.liquidityScore.toFixed(2) : "-"}
                    </TableCell>
                    <TableCell>
                      {row.latestSnapshot ? formatDateTime(row.latestSnapshot.observedAt) : "-"}
                    </TableCell>
                    <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
                    <TableCell>
                      <TargetRefreshAction targetId={row.id} />
                    </TableCell>
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
      <PageScaffold title="Targets" description="監視対象と最新の相場情報を確認できます。">
        <ErrorState message={error instanceof Error ? error.message : "unknown error"} />
      </PageScaffold>
    );
  }
}
