import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  androidIngestPayloadSchema,
  androidIngestResponseSchema,
  candidateApprovePayloadSchema,
  candidateRejectPayloadSchema,
  candidateReviewResponseSchema,
  targetRefreshResponseSchema,
  triggerRunReprocessResponseSchema,
  triggerRunResponseSchema,
} from "../packages/contracts/src";

const OUTPUT_DIR = resolve(process.cwd(), "generated/contracts");
const OPENAPI_PATH = resolve(OUTPUT_DIR, "openapi.json");
const JSON_SCHEMA_PATH = resolve(OUTPUT_DIR, "schemas.json");

const toJsonSchema = (name: string, schema: ZodTypeAny) => {
  const converted = zodToJsonSchema(schema, {
    name,
    target: "openApi3",
  });

  const definition = converted.definitions?.[name];
  if (!definition) {
    throw new Error(`schema definition not found: ${name}`);
  }

  return definition;
};

const main = async () => {
  const schemas = {
    AndroidIngestPayload: toJsonSchema(
      "AndroidIngestPayload",
      androidIngestPayloadSchema,
    ),
    AndroidIngestResponse: toJsonSchema(
      "AndroidIngestResponse",
      androidIngestResponseSchema,
    ),
    CandidateApprovePayload: toJsonSchema(
      "CandidateApprovePayload",
      candidateApprovePayloadSchema,
    ),
    CandidateRejectPayload: toJsonSchema(
      "CandidateRejectPayload",
      candidateRejectPayloadSchema,
    ),
    CandidateReviewResponse: toJsonSchema(
      "CandidateReviewResponse",
      candidateReviewResponseSchema,
    ),
    TargetRefreshResponse: toJsonSchema(
      "TargetRefreshResponse",
      targetRefreshResponseSchema,
    ),
    TriggerRunResponse: toJsonSchema(
      "TriggerRunResponse",
      triggerRunResponseSchema,
    ),
    TriggerRunReprocessResponse: toJsonSchema(
      "TriggerRunReprocessResponse",
      triggerRunReprocessResponseSchema,
    ),
  };

  const openapi = {
    openapi: "3.1.0",
    info: {
      title: "Merchandise Sales Automation API",
      version: "0.0.0",
    },
    paths: {
      "/api/ingest/android": {
        post: {
          summary: "Ingest Android notification payload",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AndroidIngestPayload" },
              },
            },
          },
          responses: {
            "202": {
              description: "Accepted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AndroidIngestResponse" },
                },
              },
            },
          },
        },
      },
      "/api/candidates/{candidateId}/approve": {
        post: {
          summary: "Approve candidate",
          parameters: [
            {
              in: "path",
              name: "candidateId",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: false,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CandidateApprovePayload" },
              },
            },
          },
          responses: {
            "200": {
              description: "Candidate updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CandidateReviewResponse" },
                },
              },
            },
          },
        },
      },
      "/api/candidates/{candidateId}/reject": {
        post: {
          summary: "Reject candidate",
          parameters: [
            {
              in: "path",
              name: "candidateId",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CandidateRejectPayload" },
              },
            },
          },
          responses: {
            "200": {
              description: "Candidate updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CandidateReviewResponse" },
                },
              },
            },
          },
        },
      },
      "/api/targets/{targetId}/refresh": {
        post: {
          summary: "Queue target snapshot refresh",
          parameters: [
            {
              in: "path",
              name: "targetId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "202": {
              description: "Refresh queued",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TargetRefreshResponse" },
                },
              },
            },
          },
        },
      },
      "/api/trigger/runs/{runId}": {
        get: {
          summary: "Get run status",
          parameters: [
            {
              in: "path",
              name: "runId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Run found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TriggerRunResponse" },
                },
              },
            },
          },
        },
      },
      "/api/trigger/runs/{runId}/reprocess": {
        post: {
          summary: "Requeue run by runId",
          parameters: [
            {
              in: "path",
              name: "runId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "202": {
              description: "Run requeued",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TriggerRunReprocessResponse",
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas,
    },
  };

  const jsonSchemaBundle = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties: schemas,
    additionalProperties: false,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OPENAPI_PATH, `${JSON.stringify(openapi, null, 2)}\n`, "utf8");
  await writeFile(
    JSON_SCHEMA_PATH,
    `${JSON.stringify(jsonSchemaBundle, null, 2)}\n`,
    "utf8",
  );

  console.log(`exported: ${OPENAPI_PATH}`);
  console.log(`exported: ${JSON_SCHEMA_PATH}`);
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
