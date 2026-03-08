import { normalizeModel } from "./normalizeModel";
import { normalizeTitle } from "./normalizeTitle";

export type MatchTargetInput = {
  title: string;
  modelText?: string | null;
  target: {
    id: string;
    titleKeyword: string;
    modelKeyword?: string | null;
    isActive: boolean;
  };
};

export type MatchTargetResult = {
  matched: boolean;
  targetId?: string;
  reason: "inactive" | "title_mismatch" | "model_mismatch" | "matched";
};

export const matchTarget = (input: MatchTargetInput): MatchTargetResult => {
  if (!input.target.isActive) {
    return { matched: false, reason: "inactive" };
  }

  const normalizedTitle = normalizeTitle(input.title);
  const normalizedTitleKeyword = normalizeTitle(input.target.titleKeyword);

  if (!normalizedTitle.includes(normalizedTitleKeyword)) {
    return { matched: false, reason: "title_mismatch" };
  }

  if (input.target.modelKeyword) {
    const source = `${input.title} ${input.modelText ?? ""}`;
    const normalizedSource = normalizeModel(source);
    const normalizedModelKeyword = normalizeModel(input.target.modelKeyword);
    if (!normalizedSource.includes(normalizedModelKeyword)) {
      return { matched: false, reason: "model_mismatch" };
    }
  }

  return {
    matched: true,
    targetId: input.target.id,
    reason: "matched",
  };
};
