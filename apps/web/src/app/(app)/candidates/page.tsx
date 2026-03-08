import Link from "next/link";
import { CandidateActions } from "./CandidateActions";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { DataSection } from "@/components/page/data-section";
import { PageScaffold } from "@/components/page/page-scaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatYen } from "@/lib/format";
import { listRecentCandidatesWithContext } from "@/server/queries/candidates";

export const dynamic = "force-dynamic";

const stateBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  needs_review: "outline",
  approved: "default",
  rejected: "destructive",
  excluded: "secondary",
};

export default async function CandidatesPage() {
  try {
    const rows = await listRecentCandidatesWithContext(50);

    return (
      <PageScaffold title="Candidates" description="レビュー候補の最新 50 件を確認します。">
        <DataSection
          title="Candidates"
          subtitle="最新 50 件"
          toolbar={<Badge variant="secondary">件数: {rows.length}</Badge>}
        >
          {rows.length === 0 ? (
            <EmptyState description="候補データはまだありません。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.id}</TableCell>
                    <TableCell className="max-w-[24rem] truncate">{row.listingTitle}</TableCell>
                    <TableCell className="text-right">{formatYen(row.listingPriceYen)}</TableCell>
                    <TableCell>
                      <Badge variant={stateBadgeVariant[row.reviewState] ?? "secondary"}>
                        {row.reviewState}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(row.updatedAt)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <a href={row.mercariLink.href} target="_blank" rel="noreferrer">
                          {row.mercariLink.type === "item" ? "商品ページ" : "検索"}
                        </a>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/candidates/${row.id}`}>詳細</Link>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <CandidateActions candidateId={row.id} />
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
      <PageScaffold title="Candidates" description="レビュー候補の最新 50 件を確認します。">
        <ErrorState message={error instanceof Error ? error.message : "unknown error"} />
      </PageScaffold>
    );
  }
}
