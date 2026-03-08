import { z } from "zod";

export const listingConditionSchema = z.enum([
  "new",
  "used_good",
  "used_fair",
  "junk",
  "unknown",
]);

export const listingShippingSchema = z.enum(["seller", "buyer", "unknown"]);

const listingAttributesCandidateSchema = z.object({
  modelText: z.string().trim().min(1).max(128).nullable().optional(),
  condition: listingConditionSchema.optional(),
  shipping: listingShippingSchema.optional(),
  priceYenHint: z.number().int().positive().max(5_000_000).nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export type ListingCondition = z.infer<typeof listingConditionSchema>;
export type ListingShipping = z.infer<typeof listingShippingSchema>;

export type ListingAttributes = {
  modelText: string | null;
  condition: ListingCondition;
  shipping: ListingShipping;
  priceYenHint: number | null;
  confidence: number;
};

const normalizeListingAttributes = (
  input: z.infer<typeof listingAttributesCandidateSchema>,
): ListingAttributes => {
  return {
    modelText: input.modelText ?? null,
    condition: input.condition ?? "unknown",
    shipping: input.shipping ?? "unknown",
    priceYenHint: input.priceYenHint ?? null,
    confidence: input.confidence ?? 0,
  };
};

const extractFirstJsonObject = (source: string): string | null => {
  const codeBlock = source.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = codeBlock ?? source;

  const start = candidate.indexOf("{");
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < candidate.length; i += 1) {
    const ch = candidate[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return candidate.slice(start, i + 1);
      }
    }
  }

  return null;
};

export class StructuredOutputParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StructuredOutputParseError";
  }
}

export const parseListingAttributesOutput = (text: string): ListingAttributes => {
  const jsonText = extractFirstJsonObject(text);
  if (!jsonText) {
    throw new StructuredOutputParseError("JSON object was not found in response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch {
    throw new StructuredOutputParseError("Response JSON is invalid");
  }

  const validated = listingAttributesCandidateSchema.safeParse(parsed);
  if (!validated.success) {
    throw new StructuredOutputParseError(
      `Response schema is invalid: ${validated.error.issues[0]?.message ?? "unknown"}`,
    );
  }

  return normalizeListingAttributes(validated.data);
};
