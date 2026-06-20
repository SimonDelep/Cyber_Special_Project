import { Prisma } from "@prisma/client";

/** Shown when PostgreSQL is down or unreachable (not a form-validation issue). */
export const DB_UNAVAILABLE_MESSAGE =
  "The database is not ready. Please try again later.";

export function isPrismaUnavailable(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientInitializationError ||
    (err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2021" || err.code === "P2022"))
  );
}

const PRISMA_ACTION_MESSAGES: Record<string, string> = {
  P2000: "A value is too long for the database.",
  P2001: "Record not found.",
  P2002: "This value is already in use.",
  P2003: "Related record not found.",
  P2011: "A required value is missing.",
  P2014: "This change would break a required relation.",
  P2015: "Related record not found.",
  P2016: "Query interpretation error.",
  P2021: "The database is not ready. Please try again later.",
  P2022: "The database is not ready. Please try again later.",
  P2025: "Record not found.",
};

const PRISMA_API_STATUS: Record<string, number> = {
  P2002: 409,
  P2003: 400,
  P2025: 404,
  P2021: 503,
  P2022: 503,
};

export type PrismaMessageOverrides = Partial<Record<string, string>>;

export function toActionError(
  err: unknown,
  overrides?: PrismaMessageOverrides
): { error: string } {
  if (isPrismaUnavailable(err)) {
    return { error: DB_UNAVAILABLE_MESSAGE };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const override = overrides?.[err.code];
    if (override) {
      return { error: override };
    }
    const mapped = PRISMA_ACTION_MESSAGES[err.code];
    if (mapped) {
      return { error: mapped };
    }
    return { error: "A database error occurred. Please try again." };
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return { error: "Invalid data submitted. Please check your input." };
  }

  return { error: "Something went wrong. Please try again." };
}

export function toApiError(
  err: unknown,
  overrides?: PrismaMessageOverrides
): { body: { error: string }; status: number } {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const message =
      overrides?.[err.code] ??
      PRISMA_ACTION_MESSAGES[err.code] ??
      "A database error occurred.";
    const status = PRISMA_API_STATUS[err.code] ?? 500;
    return { body: { error: message }, status };
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      body: { error: "Invalid request data." },
      status: 400,
    };
  }

  return { body: { error: "Internal server error" }, status: 500 };
}

export function cartErrorMessage(
  error?: string,
  max?: string
): string | null {
  switch (error) {
    case "invalid":
      return "Invalid cart update. Please try again.";
    case "quantity":
      return "Quantity must be a whole number between 1 and 99.";
    case "not-found":
      return "That cart item was not found.";
    case "stock":
      return max
        ? `Not enough stock. Maximum available: ${max}.`
        : "Not enough stock for this quantity.";
    default:
      return null;
  }
}
