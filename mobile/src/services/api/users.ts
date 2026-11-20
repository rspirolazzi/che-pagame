import { apiRequest } from "./client";
import type { UpdateMeRequest, UserResponse } from "./types";

export const usersApi = {
  getMe: () => apiRequest<UserResponse>("/users/me", { authenticated: true }),
  updateMe: (patch: UpdateMeRequest) =>
    apiRequest<UserResponse>("/users/me", { method: "PATCH", body: patch, authenticated: true }),
  requestEmailChange: (newEmail: string) =>
    apiRequest<void>("/users/me/email-change", {
      method: "POST",
      body: { newEmail },
      authenticated: true,
    }),
  confirmEmailChange: (code: string) =>
    apiRequest<UserResponse>("/users/me/email-change/confirm", {
      method: "POST",
      body: { code },
      authenticated: true,
    }),
  /** Feature 015: email the code that confirms deleting the current user. */
  requestDeletion: () =>
    apiRequest<void>("/users/me/deletion", { method: "POST", authenticated: true }),
  /** Feature 015: delete the current user with the emailed code (204). */
  confirmDeletion: (code: string) =>
    apiRequest<void>("/users/me/deletion/confirm", {
      method: "POST",
      body: { code },
      authenticated: true,
    }),
};
