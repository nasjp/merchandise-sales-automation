"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type TargetRefreshActionProps = {
  targetId: string;
};

export function TargetRefreshAction({ targetId }: TargetRefreshActionProps) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"success" | "error" | null>(null);

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

        await response.json();
        setStatus("success");
      } catch {
        setStatus("error");
      }
    });
  };

  return (
    <div className="flex min-h-9 items-center gap-2 whitespace-nowrap">
      <Button type="button" size="sm" variant="outline" onClick={refresh} disabled={pending}>
        {pending ? "処理中" : "相場更新"}
      </Button>
      <span
        className={`inline-flex h-7 w-14 items-center justify-center rounded border text-xs ${
          status === "error"
            ? "border-destructive/40 text-destructive"
            : status === "success"
              ? "border-emerald-600/30 text-emerald-700"
              : "border-border text-muted-foreground"
        }`}
        aria-live="polite"
      >
        {status === "success" ? "完了" : status === "error" ? "失敗" : ""}
      </span>
    </div>
  );
}
