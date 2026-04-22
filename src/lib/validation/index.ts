import { z, type ZodSchema, type ZodError } from "zod";
import { ValidationError } from "@lib/errors";

/**
 * Validation helpers.
 *
 * Single Zod-based entry point for all request parsing. Route handlers and
 * services should use these helpers instead of calling `schema.parse()`
 * directly — this guarantees every validation failure surfaces as the
 * standard error envelope via the response builder.
 */

function formatZodError(err: ZodError): Array<{ path: string; message: string }> {
  return err.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Validate arbitrary data against a schema. Throws `ValidationError` on failure.
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Invalid input", formatZodError(result.error));
  }
  return result.data;
}

/**
 * Parse and validate a JSON request body. Throws `ValidationError` on either
 * malformed JSON or schema failure.
 */
export async function parseJsonBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
  return validate(schema, raw);
}

/**
 * Validate the `URLSearchParams` of a request against a schema.
 * Keys appearing multiple times collapse to arrays; single values stay scalar.
 */
export function parseSearchParams<T>(req: Request, schema: ZodSchema<T>): T {
  const url = new URL(req.url);
  const raw: Record<string, string | string[]> = {};
  for (const key of url.searchParams.keys()) {
    const all = url.searchParams.getAll(key);
    raw[key] = all.length > 1 ? all : (all[0] ?? "");
  }
  return validate(schema, raw);
}

export { z };
