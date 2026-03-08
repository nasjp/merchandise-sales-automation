import { parseMercariNotification } from "@merchandise/mercari";

export type MercariAttributeExtraction = {
  modelText?: string;
  conditionText?: string;
};

export const mercariFactory = {
  extractFromNotification: (title: string, body: string): MercariAttributeExtraction => {
    const parsed = parseMercariNotification({
      title,
      body,
    });

    return {
      modelText: parsed.modelText ?? undefined,
      conditionText: parsed.condition,
    };
  },
};
