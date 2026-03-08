"use client";

import { useState, useTransition } from "react";

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
        setMessage(`queued: ${body.runId}`);
      } catch {
        setMessage("reprocess failed");
      }
    });
  };

  return (
    <div>
      <button type="button" onClick={reprocess} disabled={pending}>
        再実行
      </button>
      <span>{message}</span>
    </div>
  );
}
