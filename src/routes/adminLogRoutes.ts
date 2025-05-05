import { t, Elysia } from 'elysia';
import { createAdminLog, getAdminLogs } from '../controllers/adminLogController';

export default (app: Elysia) => 
  app.group('/admin', (adminGroup) =>
    adminGroup
      .get("/:adminId/logs", 
        async ({ params, query, set }) => {
           
            
            try {
              const result = await getAdminLogs({
                adminId: params.adminId,
                page: Number(query.page) || 1,
                limit: Number(query.limit) || 10
              });
              
              set.status = 200;
              return result;
              
            } catch (error: any) {
              const status = error.statusCode || 500;
              set.status = status;
              return {
                success: false,
                error: error.message || "Failed to fetch logs",
                statusCode: status
              };
            }
        },
        {
          params: t.Object({ adminId: t.String() }),
          query: t.Object({
            page: t.Optional(t.Numeric({ minimum: 1 })),
            limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 }))
          }),
          detail: {
            tags: ['Admin Logs'],
            summary: 'Get paginated admin activity logs'
          }
        }
      )
      // .post("/:adminId/logs",   // ← FIXED: Now matches GET route
      //   async ({ params, body, set }) => {
      //     try {
      //       const result = await createAdminLog({
      //         adminId: params.adminId,
      //         action: body.action,
      //         details: body.details
      //       });
            
      //       set.status = 201;
      //       return result;
      //     } catch (error: any) {
      //       const status = error.statusCode || 500;
      //       set.status = status;
      //       return {
      //         success: false,
      //         error: error.message || "Failed to create log",
      //         statusCode: status
      //       };
      //     }
      //   },
      //   {
      //     params: t.Object({ adminId: t.String() }),
      //     body: t.Object({
      //       action: t.String({ minLength: 3 }),
      //       details: t.Optional(t.String({ maxLength: 1000 }))
      //     }),
      //     detail: {
      //       tags: ['Admin Logs'],
      //       summary: 'Create a new admin activity log'
      //     }
      //   }
      // )
  );