"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  runId: string;
};

export function RunReprocessAction({ runId }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");

  const reprocess = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/trigger/runs/${runId}/reprocess`, {
          method: "POST",
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `request failed: ${response.status}`);
        }

        const body = (await response.json()) as { runId: string };
        setMessage(`再投入しました: ${body.runId}`);
      } catch {
        setMessage("再実行に失敗しました");
      }
    });
  };

  return (
    <div className="space-y-1">
      <Button type="button" size="sm" variant="outline" onClick={reprocess} disabled={pending}>
        再実行
      </Button>
      {message ? (
        <p className="max-w-[16rem] break-all text-xs text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
