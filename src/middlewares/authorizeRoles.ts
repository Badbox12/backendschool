// src/middlewares/authorizeRoles.ts
import { t } from "elysia";

// In Elysia, middleware functions receive a context object.
// Here we assume that your `authMiddleware` sets `context.user` to the authenticated user.
export const authorizeRoles = (roles: string[]) => {
  return async (context: any) => {
    const { user } = context;
    if (!user || !roles.includes(user.role)) {
      return { status: 403, message: "Forbidden" };
    }
    return
  };
};
