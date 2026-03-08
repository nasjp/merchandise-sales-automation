import { Badge, ChartShell, DataTable, Filters, type BadgeTone } from "@merchandise/ui";
import { listRecentTaskRuns } from "@/server/queries/dashboard";
import { RunReprocessAction } from "./RunReprocessAction";

export const dynamic = "force-dynamic";

const statusToneMap: Record<string, BadgeTone> = {
  queued: "warning",
  running: "info",
  success: "success",
  failed: "danger",
};

export default async function RunsPage() {
  try {
    const rows = await listRecentTaskRuns(50);

    return (
      <main>
        <h1>Task Runs</h1>
        <ChartShell title="Task Runs" subtitle="最新 50 件">
          <Filters>
            <Badge tone="info">件数: {rows.length}</Badge>
          </Filters>
          <DataTable
            columns={[
              {
                key: "runId",
                header: "Run ID",
                cell: (row) => row.runId,
              },
              {
                key: "taskName",
                header: "Task",
                cell: (row) => row.taskName,
              },
              {
                key: "status",
                header: "Status",
                cell: (row) => (
                  <Badge tone={statusToneMap[row.status] ?? "neutral"}>{row.status}</Badge>
                ),
              },
              {
                key: "startedAt",
                header: "Started At",
                cell: (row) => row.startedAt.toISOString(),
              },
              {
                key: "finishedAt",
                header: "Finished At",
                cell: (row) => (row.finishedAt ? row.finishedAt.toISOString() : "-"),
              },
              {
                key: "actions",
                header: "Actions",
                cell: (row) => <RunReprocessAction runId={row.runId} />,
              },
            ]}
            rows={rows}
            rowKey={(row) => row.id}
          />
        </ChartShell>
      </main>
    );
  } catch (error) {
    return (
      <main>
        <h1>Task Runs</h1>
        <p>データ取得に失敗しました。</p>
        <pre>{error instanceof Error ? error.message : "unknown error"}</pre>
      </main>
    );
  }
}
