import { recordSystemEvent } from "@/db/events";
import type { LogEventInput } from "./types";
import { getClientMeta } from "./request";

export function logEvent(input: LogEventInput): void {
  try {
    recordSystemEvent(input);
  } catch (err) {
    console.error("[monitoring] Failed to write system event:", err);
  }
}

export function logEventFromRequest(
  request: Request,
  input: Omit<LogEventInput, "ipAddress" | "userAgent">,
): void {
  const meta = getClientMeta(request);
  logEvent({ ...input, ...meta });
}
