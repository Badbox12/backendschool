import { Elysia, t } from "elysia"; // Import Elysia for typing
import {
  createMark,
  getAllMarks,
  getMarksByStudentId,
  updateMarkById,
  deleteMarkById,
  getStudentRankings,
  getStudentMarks,
} from "../controllers/markController";
import { allowedSubjects } from "../utils/allowedSubjects";
import { isValidMonth } from "../utils/allowedMonth";
import { authMiddleware } from "~middlewares/authMiddleware";

// Export the route function and type the app parameter as Elysia
export default (app: Elysia) => {
  app
    // Get all marks
    .get("/marks", async () => {
      const result = await getAllMarks();
      return result.success ? result.data : { error: result.error };
    })
    // Get marks for a specific student by query parameter (studentId)
    .get(
      "/marks/student/:studentId",
      async ({ params }: any) => {
        const { studentId } = params;
        if (!studentId) {
          return { error: "Student ID is required" };
        }
        const result = await getMarksByStudentId(studentId);
        return result.success ? result.data : { error: result.error };
      },
      {
        params: t.Object({
          studentId: t.String(),
        }),
      }
    )
    // backend/routes/studentRoutes.ts
    .get(
      "/student/:id/marks",
      async ({ params, user }: any) => {
        const { id } = params;
        if (!user || !user._id) {
          return { success: false, error: "Unauthorized", status: 401 };
        }

        const result = await getStudentMarks(user._id, id);
        return result;
      },
      {
        params: t.Object({ id: t.String() }), // Validate student ID
        beforeHandle: authMiddleware, // Ensure admin is authenticated
      }
    )
    // Create a new mark
    .post(
      "/marks",
      async ({ body }: any) => {
        const { subjectName, month, year } = body;
        console.log(month, year, subjectName);
        if (!allowedSubjects.includes(subjectName)) {
          return {
            success: false,
            error: `${subjectName} is not a valid subject.`,
          };
        }
        // Validate the month
        if (!isValidMonth(month)) {
          return { success: false, error: `${month} is not a valid month.` };
        }
        const result = await createMark(body);
        if (result.success) return { success: true, data: result.data };
        return { success: false, error: result.error };
      },
      {
        body: t.Object({
          studentId: t.String(),
          subjectName: t.String(),
          marksObtained: t.Number(),
          maxMarks: t.Optional(t.Number()),
          month: t.Optional(t.String()),
          year: t.Optional(t.Number()),
          teacherComments: t.Optional(t.String()),
        }),
      }
    )
    // Update a mark by ID
    .patch(
      "/marks/:markId",
      async ({ params, body }: any) => {
        const result = await updateMarkById(params.markId, body);
        console.log("Update result:", result);
        if (result.success) {
          return new Response(JSON.stringify(result), { status: 200 });
        }
        return new Response(JSON.stringify(result), { status: 404 });
      },
      {
        params: t.Object({
          markId: t.String(), // Validate student ID in query params
        }),
        body: t.Object({
          subjectName: t.String(),
          marksObtained: t.Number(),
          maxMarks: t.Number(),
          month: t.String(),
          year: t.Number({
            minimum: 2000,
            maximum: new Date().getFullYear(),
          }),
          teacherComments: t.String(),
        }),
      }
    )
    // Delete a mark by ID
    .delete("/marks/:markId", async ({ params }: any) => {
      const result = await deleteMarkById(params.markId);
      if (result.success) {
        return new Response(JSON.stringify(result), { status: 200 });
      } else {
        return new Response(JSON.stringify(result), { status: 404 });
      }
    })
    .get("/marks/rankings", async () => {
      return await getStudentRankings();
    });
};
