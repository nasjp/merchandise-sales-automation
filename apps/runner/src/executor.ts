import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import type { JobQueue } from "@merchandise/db";
import { config } from "./config";
import { buildPrompt, buildSystemPrompt } from "./prompts";

export const executeWithClaude = async (
  job: JobQueue,
): Promise<Record<string, unknown>> => {
  const prompt = buildPrompt(job);
  const systemPrompt = buildSystemPrompt(job);

  let resultMessage: SDKResultMessage | null = null;

  for await (const event of query({
    prompt,
    options: {
      systemPrompt,
      maxTurns: 15,
      allowedTools: ["Bash", "Read", "Grep", "Glob"],
      cwd: config.projectRoot,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
    },
  })) {
    if (event.type === "result") {
      resultMessage = event;
    }
  }

  return parseClaudeResult(resultMessage);
};

const parseClaudeResult = (
  result: SDKResultMessage | null,
): Record<string, unknown> => {
  if (!result) return { status: "error", message: "no result from Claude" };

  if (result.is_error) {
    const errors = "errors" in result ? result.errors : [];
    return { status: "error", message: errors.join("; ") || "unknown error" };
  }

  const text = "result" in result && typeof result.result === "string"
    ? result.result
    : "";

  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {
      // fall through
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      status: "completed",
      rawOutput: text,
      costUsd: result.total_cost_usd,
      numTurns: result.num_turns,
    };
  }
};
