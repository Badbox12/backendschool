import { Elysia, t } from "elysia";
import {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  loginAdmin,
  forgotPassword,
  resetPassword,
  confirmAdmin,
  verifyOtp,
  updateAdminStatus,
} from "../controllers/adminController";
import { authMiddleware } from "~middlewares/authMiddleware";
import { authorizeRoles } from "~middlewares/authorizeRoles";
export default (app: Elysia) => {
  app
    .post(
      "/admin/forgot-password",
      async ({ body }: any) => {
        return await forgotPassword(body.email);
      },
      {
        body: t.Object({
          email: t.String({ format: "email" }),
        }),
      }
    )
    .post(
      "/admin/verify-otp",
      async ({ body }: any) => {
        return await verifyOtp(body.email, body.otp);
      },
      {
        body: t.Object({
          email: t.String({ format: "email" }),
          otp: t.String(),
        }),
      }
    )
    .post(
      "/admin/reset-password",
      async ({ body }: any) => {
        return await resetPassword(body.token, body.newPassword);
      },
      {
        body: t.Object({
          token: t.String(),
          newPassword: t.String(),
        }),
        // beforeHandle: authMiddleware,
      }
    )
    .post("/admin/register", async ({ body }: any) => {
      const result = await createAdmin(body);
      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    })
    .post(
      "/admin/login",
      async ({ body, jwt }: any) => {
        const result = await loginAdmin(body, jwt);

        if (result.success) {
          return {
            success: true,
            data: result.data,
          };
        } else {
          return {
            success: false,
            error: result.error,
          };
        }
      },
      {
        body: t.Object({
          email: t.String({
            format: "email",
          }),
          password: t.String(),
        }),
      }
    )
    .get(
      "/admin/confirm",
      async ({ query }: any) => {
        const token = query.token;
        if (!token) {
          return { success: false, error: "Missing token!! " };
        }
        const result = await confirmAdmin(token);
        if (result.success) {
          return {
            success: true,
            data: result.data,
          };
        } else {
          return {
            success: false,
            error: result.error,
          };
        }
      },
      {
        query: t.Object({
          token: t.String(),
        }),
      }
    )
    .get(
      "/admin/all",
      async ({ user }: any) => {
        return await getAllAdmins();
      },
      {
        beforeHandle: authMiddleware,
      }
    )
    // Get admin by ID (protected)
    .get(
      "/admin/:id",
      async ({ params }: any) => {
        return await getAdminById(params.id);
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        beforeHandle: authMiddleware,
      }
    )
    // Update admin by ID (protected)
    .patch(
      "/admin/:id",
      async ({ params, body }: any) => {
        return await updateAdmin(params.id, body);
      },
      {
        params: t.Object({
          id: t.String(), // Validate ID as a string
        }),
        body: t.Object({
          username: t.Optional(t.String()),
          email: t.Optional(t.String({ format: "email" })),
          password: t.Optional(t.String()),
          role: t.Optional(t.String()),
        }),
        beforeHandle: authMiddleware,
      }
    )

    // Delete admin by ID (protected)
    .delete(
      "/admins/:id",
      async ({ params }: any) => {
        return await deleteAdmin(params.id);
      },
      {
        params: t.Object({
          id: t.String(), // Validate ID as a string
        }),
        beforeHandle: authMiddleware,
      }
    )
    // Teacher Dashboard (accessible by teacher, admin, or superadmin)
    .get(
      "/teacher/dashboard",
      async ({ user }: any) => {
        // In a real-world scenario, you would return teacher-specific data.
        return {
          message: `Welcome ${user.role} ${user.username}, here is your Teacher Dashboard data.`,
          data: { classes: ["Math", "Science"], announcements: [] },
        };
      },
      {
        beforeHandle: [
          authMiddleware,
          authorizeRoles(["teacher", "admin", "superadmin"]) as any,
        ],
      }
    )
    // backend/routes/adminRoutes.ts
//     .put("/admin/:id/status", async (ctx) => {
//   const { id } = ctx.params;
//   const { action, newRole } = ctx.body;
  
//   if (!["confirm", "reject"].includes(action)) {
//     ctx.throw(400, "Invalid action. Use 'confirm' or 'reject'");
//   }

//   const result = await updateAdminStatus(
//     ctx,
//     id,
//     action,
//     newRole
//   );
//   return result;
// }, {
//   beforeHandle: [authMiddleware, superadminRoleMiddleware], // Requires superadmin role
//   body: t.Object({
//     action: t.String({ enum: ["confirm", "reject"] }),
//     newRole: t.Optional(t.String({ enum: ["admin", "superadmin", "teacher"] })),
//   }),
// });
};
