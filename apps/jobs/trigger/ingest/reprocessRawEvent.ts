import { processRawEvent } from "./processRawEvent";

export const reprocessRawEvent = async (input: { rawEventId: string }) =>
  processRawEvent(input);
