// src/middlewares/authorizeRoles.ts
import { t } from "elysia";

// In Elysia, middleware functions receive a context object.
// Here we assume that your `authMiddleware` sets `context.user` to the authenticated user.
export const authorizeRoles = (allowedRoles: string[]) => {
  return async ({ user }: { user?: { role: string } }) => {
    if (!user || !allowedRoles.includes(user.role)) {
      return {
        status: 403,
        error: "Forbidden: You do not have permission to access this resource",
      };
    }
    // If authorized, simply return; Elysia will continue to the next handler.
  };
};
