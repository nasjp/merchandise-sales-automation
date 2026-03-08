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

type CandidatesPageProps = {
  searchParams: Promise<{
    scope?: string;
  }>;
};

export default async function CandidatesPage({ searchParams }: CandidatesPageProps) {
  try {
    const params = await searchParams;
    const scope = params.scope === "all" ? "all" : "open";
    const rows = await listRecentCandidatesWithContext({
      limit: 50,
      scope,
    });

    return (
      <PageScaffold title="Candidates" description="既定では未処理候補のみ表示します。">
        <DataSection
          title="Candidates"
          subtitle="最新 50 件"
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">件数: {rows.length}</Badge>
              <Button size="sm" variant={scope === "open" ? "secondary" : "outline"} asChild>
                <Link href="/candidates">未処理のみ</Link>
              </Button>
              <Button size="sm" variant={scope === "all" ? "secondary" : "outline"} asChild>
                <Link href="/candidates?scope=all">全件</Link>
              </Button>
            </div>
          }
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
                  <TableHead className="w-[22rem]">URL</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead className="w-[15rem]">Review</TableHead>
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
                      {row.listingUrl ? (
                        <a
                          href={row.listingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block max-w-[22rem] truncate text-xs underline underline-offset-4"
                        >
                          {row.listingUrl}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">URL未抽出</span>
                      )}
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
      <PageScaffold title="Candidates" description="候補一覧を表示します。">
        <ErrorState message={error instanceof Error ? error.message : "unknown error"} />
      </PageScaffold>
    );
  }
}
