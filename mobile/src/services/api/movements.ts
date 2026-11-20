import { apiRequest } from "./client";
import type { MovementPage } from "./types";

const movements = (accountId: string) => `/accounts/${encodeURIComponent(accountId)}/movements`;

/** Expenses and settlements of an account together, newest first (feature 012). */
export const movementsApi = {
  list: (accountId: string, cursor?: string | null) =>
    apiRequest<MovementPage>(
      cursor
        ? `${movements(accountId)}?cursor=${encodeURIComponent(cursor)}`
        : movements(accountId),
      { authenticated: true },
    ),
};
