import { getJobsEnv } from "../runtime/env";

const SLACK_CONVERSATIONS_LIST_URL = "https://slack.com/api/conversations.list";
const SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";
const CONVERSATIONS_LIST_LIMIT = 200;
const MAX_CONVERSATIONS_LIST_PAGES = 20;

type SlackChannel = {
  id: string;
  name?: string;
  name_normalized?: string;
};

type SlackConversationsListResponse = {
  ok: boolean;
  channels?: SlackChannel[];
  error?: string;
  response_metadata?: {
    next_cursor?: string;
  };
};

type SlackPostMessageResponse = {
  ok: boolean;
  channel?: string;
  ts?: string;
  error?: string;
};

type SlackNotificationDeps = {
  env: ReturnType<typeof getJobsEnv>;
  fetch: typeof fetch;
};

const resolveMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const requireNonEmpty = (value: string | null, key: string) => {
  if (!value || value.trim().length === 0) {
    throw new Error(`${key} is not set`);
  }
  return value.trim();
};

const normalizeChannelName = (channelName: string) =>
  channelName.trim().replace(/^#/, "").toLowerCase();

const parseUrl = (raw: string) => {
  try {
    return new URL(raw);
  } catch {
    throw new Error(`WEB_BASE_URL is invalid: ${raw}`);
  }
};

const buildHeaders = (slackBotToken: string) => ({
  authorization: `Bearer ${slackBotToken}`,
  "content-type": "application/json; charset=utf-8",
});

const fetchSlackJson = async <T>(params: {
  fetchImpl: typeof fetch;
  url: string;
  init: RequestInit;
}) => {
  const response = await params.fetchImpl(params.url, params.init);
  const body = (await response.json()) as T;
  if (!response.ok) {
    throw new Error(`Slack API request failed: ${response.status}`);
  }
  return body;
};

const resolveChannelIdByName = async (params: {
  fetchImpl: typeof fetch;
  slackBotToken: string;
  slackChannelName: string;
}) => {
  const target = normalizeChannelName(params.slackChannelName);
  let cursor = "";

  for (let page = 0; page < MAX_CONVERSATIONS_LIST_PAGES; page += 1) {
    const url = new URL(SLACK_CONVERSATIONS_LIST_URL);
    url.searchParams.set("exclude_archived", "true");
    url.searchParams.set("types", "public_channel,private_channel");
    url.searchParams.set("limit", String(CONVERSATIONS_LIST_LIMIT));
    if (cursor.length > 0) {
      url.searchParams.set("cursor", cursor);
    }

    const body = await fetchSlackJson<SlackConversationsListResponse>({
      fetchImpl: params.fetchImpl,
      url: url.toString(),
      init: {
        method: "GET",
        headers: buildHeaders(params.slackBotToken),
      },
    });

    if (!body.ok) {
      throw new Error(`Slack conversations.list failed: ${body.error ?? "unknown_error"}`);
    }

    const matched = body.channels?.find((channel) => {
      const name = channel.name?.toLowerCase();
      const normalizedName = channel.name_normalized?.toLowerCase();
      return name === target || normalizedName === target;
    });
    if (matched?.id) {
      return matched.id;
    }

    const next = body.response_metadata?.next_cursor?.trim() ?? "";
    if (!next) {
      break;
    }
    cursor = next;
  }

  throw new Error(`Slack channel not found: ${params.slackChannelName}`);
};

const buildDetailUrl = (params: {
  webBaseUrl: string;
  candidateId: string;
}) => {
  const base = parseUrl(params.webBaseUrl);
  return new URL(`/candidates/${encodeURIComponent(params.candidateId)}`, base).toString();
};

const buildMessageText = (params: {
  listingTitle: string;
  listingPriceYen: number;
  score: number;
  reason: string | null;
  detailUrl: string;
}) => {
  return [
    "[Candidate needs_review]",
    `title: ${params.listingTitle}`,
    `price: ${params.listingPriceYen.toLocaleString("ja-JP")}円`,
    `score: ${params.score}`,
    `reason: ${params.reason ?? "-"}`,
    `detail: ${params.detailUrl}`,
  ].join("\n");
};

export const sendCandidateNeedsReviewSlackNotification = async (
  input: {
    candidateId: string;
    listingTitle: string;
    listingPriceYen: number;
    score: number;
    reason: string | null;
  },
  deps?: Partial<SlackNotificationDeps>,
) => {
  const env = deps?.env ?? getJobsEnv();
  const fetchImpl = deps?.fetch ?? fetch;

  const slackBotToken = requireNonEmpty(env.slackBotToken, "SLACK_BOT_TOKEN");
  const slackChannelName = requireNonEmpty(
    env.slackChannelName,
    "SLACK_CHANNEL_NAME",
  );
  const webBaseUrl = requireNonEmpty(env.webBaseUrl, "WEB_BASE_URL");
  const detailUrl = buildDetailUrl({
    webBaseUrl,
    candidateId: input.candidateId,
  });

  const channelId = await resolveChannelIdByName({
    fetchImpl,
    slackBotToken,
    slackChannelName,
  });
  const text = buildMessageText({
    listingTitle: input.listingTitle,
    listingPriceYen: input.listingPriceYen,
    score: input.score,
    reason: input.reason,
    detailUrl,
  });

  const body = await fetchSlackJson<SlackPostMessageResponse>({
    fetchImpl,
    url: SLACK_POST_MESSAGE_URL,
    init: {
      method: "POST",
      headers: buildHeaders(slackBotToken),
      body: JSON.stringify({
        channel: channelId,
        text,
      }),
    },
  });
  if (!body.ok) {
    throw new Error(`Slack chat.postMessage failed: ${body.error ?? "unknown_error"}`);
  }

  return {
    channelId,
    messageTs: body.ts ?? null,
    detailUrl,
    text,
  };
};

export const toSlackErrorMessage = (error: unknown) => resolveMessage(error);
