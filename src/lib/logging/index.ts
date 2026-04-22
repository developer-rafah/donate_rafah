/**
 * Structured logger.
 *
 * Intentionally tiny — no dependency on a logging library. Emits single-line
 * JSON to stdout/stderr so Vercel / Cloudflare logs remain queryable.
 *
 * Usage:
 *   import { logger } from "@lib/logging";
 *   logger.info("user signed in", { userId });
 *   logger.error("db write failed", { table: "users", err });
 *
 * A request-scoped logger can be produced with `logger.child({ requestId })`.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveThreshold(): number {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  if (raw in LEVELS) return LEVELS[raw as LogLevel];
  return LEVELS.info;
}

const threshold = resolveThreshold();

function serializeError(err: unknown): unknown {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(typeof (err as { code?: unknown }).code === "string"
        ? { code: (err as { code: string }).code }
        : {}),
    };
  }
  return err;
}

function normalizeContext(ctx?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!ctx) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    out[k] = v instanceof Error ? serializeError(v) : v;
  }
  return out;
}

function emit(level: LogLevel, message: string, base: Record<string, unknown>, ctx?: Record<string, unknown>) {
  if (LEVELS[level] < threshold) return;

  const payload = {
    level,
    time: new Date().toISOString(),
    message,
    ...base,
    ...(normalizeContext(ctx) ?? {}),
  };

  const line = JSON.stringify(payload);
  if (level === "error" || level === "warn") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export interface Logger {
  debug(message: string, ctx?: Record<string, unknown>): void;
  info(message: string, ctx?: Record<string, unknown>): void;
  warn(message: string, ctx?: Record<string, unknown>): void;
  error(message: string, ctx?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}

function makeLogger(base: Record<string, unknown> = {}): Logger {
  return {
    debug: (message, ctx) => emit("debug", message, base, ctx),
    info: (message, ctx) => emit("info", message, base, ctx),
    warn: (message, ctx) => emit("warn", message, base, ctx),
    error: (message, ctx) => emit("error", message, base, ctx),
    child: (bindings) => makeLogger({ ...base, ...bindings }),
  };
}

export const logger = makeLogger({ app: "rafd" });
