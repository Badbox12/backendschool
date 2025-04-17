// roleMiddleware.ts
export const adminRoleMiddleware = async (ctx: any, next: () => Promise<void>) => {
    if (ctx.user?.role !== "admin" && ctx.user?.role !== "superadmin") {
      ctx.throw(403, "Forbidden: Admin role required");
    }
    await next();
  };