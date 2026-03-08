import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { DataSection } from "@/components/page/data-section";
import { PageScaffold } from "@/components/page/page-scaffold";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { listActiveTargets } from "@/server/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function TargetsPage() {
  try {
    const rows = await listActiveTargets();

    return (
      <PageScaffold title="Targets" description="現在有効な監視ターゲットを確認します。">
        <DataSection
          title="Active Targets"
          subtitle="有効ターゲット"
          toolbar={<Badge variant="secondary">件数: {rows.length}</Badge>}
        >
          {rows.length === 0 ? (
            <EmptyState description="有効なターゲットはありません。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Title Keyword</TableHead>
                  <TableHead>Model Keyword</TableHead>
                  <TableHead>Updated At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.id}</TableCell>
                    <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                    <TableCell>{row.titleKeyword}</TableCell>
                    <TableCell>{row.modelKeyword ?? "-"}</TableCell>
                    <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
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
      <PageScaffold title="Targets" description="現在有効な監視ターゲットを確認します。">
        <ErrorState message={error instanceof Error ? error.message : "unknown error"} />
      </PageScaffold>
    );
  }
}
