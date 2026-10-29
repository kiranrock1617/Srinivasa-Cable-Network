import { ZodError } from "zod";

/**
 * Convert any thrown value into a safe, human-friendly message.
 * Never leaks stack traces, connection strings, or internal identifiers.
 */
export function toUserMessage(err: unknown, fallback = "Something went wrong"): string {
  if (!err) return fallback;

  if (err instanceof ZodError) {
    const first = err.issues[0];
    return first?.message ?? "Please check the form fields and try again.";
  }

  if (err instanceof Error) {
    const msg = err.message || fallback;
    // Filter obviously internal / noisy messages
    if (/ECONN|ENOTFOUND|ETIMEDOUT|MongoNetwork|getaddrinfo|failed to fetch/i.test(msg)) {
      return "Network problem — please check your connection and try again.";
    }
    if (/MongoServerSelection|MongoTopology|MongoServerError/i.test(msg)) {
      return "The database is unreachable right now. Please try again in a moment.";
    }
    return msg;
  }

  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

/** Convert a server-thrown error into a plain Error whose message is user-safe. */
export function toServerError(err: unknown, fallback = "Request failed"): Error {
  if (err instanceof Error) {
    // Keep known duplicate-key and not-found messages verbatim.
    if (/already exists|not found/i.test(err.message)) return err;
  }
  return new Error(toUserMessage(err, fallback));
}
