import { Badge, ChartShell, DataTable, Filters, type BadgeTone } from "@merchandise/ui";
import { listRecentCandidates } from "@/server/queries/dashboard";
import { CandidateActions } from "./CandidateActions";

export const dynamic = "force-dynamic";

const reviewStateToneMap: Record<string, BadgeTone> = {
  pending: "warning",
  needs_review: "info",
  approved: "success",
  rejected: "danger",
  excluded: "neutral",
};

export default async function CandidatesPage() {
  try {
    const rows = await listRecentCandidates(50);

    return (
      <main>
        <h1>Candidates</h1>
        <ChartShell title="Candidates" subtitle="最新 50 件">
          <Filters>
            <Badge tone="info">件数: {rows.length}</Badge>
          </Filters>
          <DataTable
            columns={[
              {
                key: "id",
                header: "ID",
                cell: (row) => row.id,
              },
              {
                key: "title",
                header: "Title",
                cell: (row) => row.listingTitle,
              },
              {
                key: "price",
                header: "Price",
                align: "right",
                cell: (row) => row.listingPriceYen.toLocaleString(),
              },
              {
                key: "state",
                header: "State",
                cell: (row) => (
                  <Badge tone={reviewStateToneMap[row.reviewState] ?? "neutral"}>
                    {row.reviewState}
                  </Badge>
                ),
              },
              {
                key: "updatedAt",
                header: "Updated At",
                cell: (row) => row.updatedAt.toISOString(),
              },
              {
                key: "actions",
                header: "Actions",
                cell: (row) => <CandidateActions candidateId={row.id} />,
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
        <h1>Candidates</h1>
        <p>データ取得に失敗しました。</p>
        <pre>{error instanceof Error ? error.message : "unknown error"}</pre>
      </main>
    );
  }
}
