"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  candidateId: string;
};

type Feedback = {
  type: "success" | "error";
};

async function postJson(path: string, payload: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `request failed: ${response.status}`);
  }
}

export function CandidateActions({ candidateId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("manual reject");

  const approve = () => {
    startTransition(async () => {
      try {
        await postJson(`/api/candidates/${candidateId}/approve`, {});
        setFeedback({ type: "success" });
        router.refresh();
      } catch {
        setFeedback({ type: "error" });
      }
    });
  };

  const reject = () => {
    if (!rejectReason.trim()) {
      setFeedback({ type: "error" });
      return;
    }

    startTransition(async () => {
      try {
        await postJson(`/api/candidates/${candidateId}/reject`, {
          reason: rejectReason.trim(),
        });
        setFeedback({ type: "success" });
        setRejectOpen(false);
        router.refresh();
      } catch {
        setFeedback({ type: "error" });
      }
    });
  };

  return (
    <div className="flex min-h-9 items-center gap-2 whitespace-nowrap">
      <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={approve}>
        {pending ? "処理中" : "承認"}
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button type="button" size="sm" variant="outline" disabled={pending}>
            却下
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>候補を却下する</DialogTitle>
            <DialogDescription>却下理由を入力すると履歴に保存されます。</DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.currentTarget.value)}
            placeholder="manual reject"
            disabled={pending}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)} disabled={pending}>
              キャンセル
            </Button>
            <Button type="button" variant="destructive" onClick={reject} disabled={pending}>
              却下を確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <span
        className={`inline-flex h-7 w-12 items-center justify-center rounded border text-xs ${
          feedback?.type === "error"
            ? "border-destructive/40 text-destructive"
            : feedback?.type === "success"
              ? "border-emerald-600/30 text-emerald-700"
              : "border-border text-muted-foreground"
        }`}
        aria-live="polite"
      >
        {feedback ? (feedback.type === "error" ? "失敗" : "完了") : ""}
      </span>
    </div>
  );
}
