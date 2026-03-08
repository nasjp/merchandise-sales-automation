"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type TargetRefreshActionProps = {
  targetId: string;
};

export function TargetRefreshAction({ targetId }: TargetRefreshActionProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const refresh = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/targets/${targetId}/refresh`, {
          method: "POST",
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `request failed: ${response.status}`);
        }

        const body = (await response.json()) as { runId: string };
        setMessage(`更新ジョブ投入: ${body.runId}`);
      } catch {
        setMessage("更新に失敗しました");
      }
    });
  };

  return (
    <div className="space-y-1">
      <Button type="button" size="sm" variant="outline" onClick={refresh} disabled={pending}>
        相場更新
      </Button>
      {message ? (
        <p className="max-w-[16rem] break-all text-xs text-muted-foreground" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
