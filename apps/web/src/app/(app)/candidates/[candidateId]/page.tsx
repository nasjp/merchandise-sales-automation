import Link from "next/link";
import { notFound } from "next/navigation";
import { CandidateActions } from "../CandidateActions";
import { ErrorState } from "@/components/feedback/error-state";
import { PageScaffold } from "@/components/page/page-scaffold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDateTime, formatYen } from "@/lib/format";
import { findCandidateDetail } from "@/server/queries/candidates";

export const dynamic = "force-dynamic";

type CandidateDetailPageProps = {
  params: Promise<{
    candidateId: string;
  }>;
};

const stateBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  needs_review: "outline",
  approved: "default",
  rejected: "destructive",
  excluded: "secondary",
};

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  try {
    const { candidateId } = await params;
    const candidate = await findCandidateDetail(candidateId);
    if (!candidate) {
      notFound();
    }

    return (
      <PageScaffold
        title="Candidate Detail"
        description="候補の根拠と元データを確認して最終判断します。"
        actions={
          <Button variant="outline" asChild>
            <Link href="/candidates">一覧へ戻る</Link>
          </Button>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{candidate.listingTitle}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Candidate ID:</span>{" "}
                <span className="font-mono">{candidate.id}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Raw Event ID:</span>{" "}
                <span className="font-mono">{candidate.rawEventId}</span>
              </p>
              <p>
                <span className="text-muted-foreground">価格:</span> {formatYen(candidate.listingPriceYen)}
              </p>
              <p>
                <span className="text-muted-foreground">更新時刻:</span> {formatDateTime(candidate.updatedAt)}
              </p>
              <p>
                <span className="text-muted-foreground">score:</span> {candidate.score}
              </p>
              <p className="flex items-center gap-2">
                <span className="text-muted-foreground">review state:</span>
                <Badge variant={stateBadgeVariant[candidate.reviewState] ?? "secondary"}>
                  {candidate.reviewState}
                </Badge>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild>
                <a href={candidate.mercariLink.href} target="_blank" rel="noreferrer">
                  {candidate.mercariLink.type === "item" ? "商品ページを開く" : "メルカリ検索を開く"}
                </a>
              </Button>
              <CandidateActions candidateId={candidate.id} />
            </div>

            <Separator />

            <div className="grid gap-2 text-sm">
              <p className="font-medium">判定理由</p>
              <p className="whitespace-pre-wrap break-words text-muted-foreground">
                {candidate.reason ?? "-"}
              </p>
              <p className="font-medium">モデル推定</p>
              <p className="text-muted-foreground">{candidate.matchedModel ?? "-"}</p>
            </div>

            <Separator />

            <div className="grid gap-2 text-sm">
              <p className="font-medium">ターゲット情報</p>
              <p className="text-muted-foreground">
                {candidate.targetId
                  ? `${candidate.targetSku ?? "-"} / ${candidate.targetTitleKeyword ?? "-"} / ${candidate.targetModelKeyword ?? "-"}`
                  : "ターゲット未一致"}
              </p>
              <p className="font-medium">最新スナップショット</p>
              {candidate.latestSnapshot ? (
                <p className="text-muted-foreground">
                  観測: {formatDateTime(candidate.latestSnapshot.observedAt)} / 売値推定:{" "}
                  {formatYen(candidate.latestSnapshot.sellEstimateYen)} / 買値上限:{" "}
                  {formatYen(candidate.latestSnapshot.buyLimitYen)} / 流動性:{" "}
                  {candidate.latestSnapshot.liquidityScore.toFixed(2)}
                </p>
              ) : (
                <p className="text-muted-foreground">スナップショット未作成</p>
              )}
            </div>

            <Separator />

            <div className="grid gap-2 text-sm">
              <p className="font-medium">元通知</p>
              <p className="text-muted-foreground">受信時刻: {formatDateTime(candidate.rawReceivedAt)}</p>
              <p className="text-muted-foreground">タイトル: {candidate.rawTitle}</p>
              <p className="whitespace-pre-wrap break-words text-muted-foreground">
                本文: {candidate.rawBody}
              </p>
            </div>
          </CardContent>
        </Card>
      </PageScaffold>
    );
  } catch (error) {
    return (
      <PageScaffold title="Candidate Detail" description="候補の詳細を表示します。">
        <ErrorState message={error instanceof Error ? error.message : "unknown error"} />
      </PageScaffold>
    );
  }
}
