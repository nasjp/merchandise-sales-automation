import { describe, expect, test, vi } from "vitest";
import { sendCandidateNeedsReviewSlackNotification } from "./slack";

describe("sendCandidateNeedsReviewSlackNotification", () => {
  test("正常系: channel 解決後に chat.postMessage で通知する", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          channels: [
            {
              id: "C12345",
              name: "candidate-alerts",
              name_normalized: "candidate-alerts",
            },
          ],
          response_metadata: {
            next_cursor: "",
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          channel: "C12345",
          ts: "1700000000.000100",
        }),
      } as Response);

    const result = await sendCandidateNeedsReviewSlackNotification(
      {
        candidateId: "cand-1",
        listingTitle: "PlayStation 5 CFI-2000 本体",
        listingPriceYen: 49800,
        score: 78,
        reason: "match:title,llm:success,snapshot:available",
      },
      {
        env: {
          databaseUrl: "postgresql://dummy",
          nodeEnv: "test",
          slackSigningSecret: "signing",
          slackBotToken: "xoxb-test",
          slackChannelName: "candidate-alerts",
          webBaseUrl: "https://merchandise-sales-automation-web.vercel.app",
        },
        fetch: fetchMock,
      },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      channelId: "C12345",
      detailUrl: "https://merchandise-sales-automation-web.vercel.app/candidates/cand-1",
      messageTs: "1700000000.000100",
    });
  });

  test("異常系: WEB_BASE_URL 未設定なら失敗する", async () => {
    await expect(
      sendCandidateNeedsReviewSlackNotification(
        {
          candidateId: "cand-1",
          listingTitle: "PlayStation 5 CFI-2000 本体",
          listingPriceYen: 49800,
          score: 78,
          reason: null,
        },
        {
          env: {
            databaseUrl: "postgresql://dummy",
            nodeEnv: "test",
            slackSigningSecret: "signing",
            slackBotToken: "xoxb-test",
            slackChannelName: "candidate-alerts",
            webBaseUrl: null,
          },
          fetch: vi.fn(),
        },
      ),
    ).rejects.toThrow("WEB_BASE_URL is not set");
  });
});
