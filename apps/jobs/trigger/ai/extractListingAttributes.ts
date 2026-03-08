import { llmFactory } from "../../src/factories/llm";

export const extractListingAttributes = async (input: {
  title: string;
  body: string;
}) => {
  return await llmFactory.extractListingAttributes(input);
};
