import { RunReprocessAction } from "./RunReprocessAction";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { DataSection } from "@/components/page/data-section";
import { PageScaffold } from "@/components/page/page-scaffold";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { listRecentTaskRuns } from "@/server/queries/dashboard";

export const dynamic = "force-dynamic";

const statusBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  queued: "secondary",
  running: "outline",
  success: "default",
  failed: "destructive",
};

export default async function RunsPage() {
  try {
    const rows = await listRecentTaskRuns(50);

    return (
      <PageScaffold title="Task Runs" description="実行履歴の最新 50 件を表示します。">
        <DataSection
          title="Task Runs"
          subtitle="最新 50 件"
          toolbar={<Badge variant="secondary">件数: {rows.length}</Badge>}
        >
          {rows.length === 0 ? (
            <EmptyState description="実行履歴はまだありません。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Finished At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.runId}</TableCell>
                    <TableCell>{row.taskName}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[row.status] ?? "secondary"}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(row.startedAt)}</TableCell>
                    <TableCell>{row.finishedAt ? formatDateTime(row.finishedAt) : "-"}</TableCell>
                    <TableCell>
                      <RunReprocessAction runId={row.runId} />
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
      <PageScaffold title="Task Runs" description="実行履歴の最新 50 件を表示します。">
        <ErrorState message={error instanceof Error ? error.message : "unknown error"} />
      </PageScaffold>
    );
  }
}
