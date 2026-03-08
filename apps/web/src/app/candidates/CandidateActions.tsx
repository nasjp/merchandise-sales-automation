"use client";

import { useState, useTransition } from "react";

type Props = {
  candidateId: string;
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
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");

  const approve = () => {
    startTransition(async () => {
      try {
        await postJson(`/api/candidates/${candidateId}/approve`, {});
        setMessage("approved");
      } catch {
        setMessage("approve failed");
      }
    });
  };

  const reject = () => {
    const promptFn = (globalThis as { prompt?: (message?: string, defaultValue?: string) => string | null })
      .prompt;
    const reason = promptFn?.("却下理由を入力してください", "manual reject");
    if (!reason || reason.trim().length === 0) {
      return;
    }

    startTransition(async () => {
      try {
        await postJson(`/api/candidates/${candidateId}/reject`, {
          reason,
        });
        setMessage("rejected");
      } catch {
        setMessage("reject failed");
      }
    });
  };

  return (
    <div>
      <button type="button" onClick={approve} disabled={pending}>
        承認
      </button>
      <button type="button" onClick={reject} disabled={pending}>
        却下
      </button>
      <span>{message}</span>
    </div>
  );
}
