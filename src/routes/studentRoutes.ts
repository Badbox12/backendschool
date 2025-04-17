import { t, Elysia } from "elysia";
import {
  createStudent,
  getAllStudentsByAdmin,
  findStudentById,
  editStudentById,
  studentExists,
  studentExistsById,
  deleteStudentById,
  calculateAggregateMarks,
} from "../controllers/studentController";
import { getStudentsSortedByTotalScore } from "../controllers/markController";
import { authMiddleware } from "~middlewares/authMiddleware";

export default (app: Elysia) => {
  app
    .get("/student/all", async ({ user }: any) => {
      const result = await getAllStudentsByAdmin(user._id);
      if (result.success) {
        return new Response(JSON.stringify(result), { status: 200 });
      }
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
      });
    },{
      beforeHandle: authMiddleware
    }
  )
    // Find student by ID using search parameters
    .get("/student", async ({ query, user }: any) => {
      const { id } = query;
      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: "ID parameter is required" }),
          { status: 400 }
        );
      }

      const result = await findStudentById(user._id, id);
      if (result.success) {
        return new Response(JSON.stringify(result), { status: 200 });
      }
      return new Response(JSON.stringify(result), { status: 404 });
    },
    {
      beforeHandle: authMiddleware
    }
  )
    .post(
      "/student/create",
      async ({body, user}: any) => {
        try {
          if (
            !body.studentId ||
            !body.FirstName ||
            !body.LastName ||
            !body.dateOfBirth ||
            !body.gender ||
            !body.guardianName ||
            !body.guardianContact
          ) {
            throw new Error("Missing required fields");
          }
          const { studentId } = body;
          //console.log(user._id)
          if (!user || !user._id) {
            return new Response(JSON.stringify({ error: "User not authenticated" }), { status: 401 });
          }
          // Check if the student already exists
          if (await studentExists(studentId)) {
            return new Response(
              JSON.stringify({ error: "Student already exists" }),
              { status: 400 }
            );
          }
          const result = await createStudent(user._id,{ body} );
          if (result) {
            return { success: true, data: result.data };
          } else {
            return {
              success: false,
              error: "Student creation failed.",
              status: 500,
            };
          }
        } catch (error: any) {
          console.log({ error: error.message });
        }
      },
      {
        body: t.Object({
          studentId: t.String(),
          LastName: t.String(),
          FirstName: t.String(),
          dateOfBirth: t.String({ format: "date-time" }), // Elysia doesn't support t.Date(), use ISO date format
          gender: t.Enum({ Male: "Male", Female: "Female", Other: "Other" }),
          placeOfBirth: t.String(),
          grade: t.Optional(t.String()),
          class: t.Optional(t.String()),
          guardianName: t.Optional(t.String()),
          admin: t.Optional(t.String()),
          guardianContact: t.String(),
        }),
        beforeHandle: authMiddleware,
      }
    )
    // Update student by ID using search parameters
    .patch(
      "/student/:id",
      async ({ params, body, user} : any) => {
        const { id } = params;
        
        if (!id) {
          return new Response(JSON.stringify({ error: "Missing student ID" }), {
            status: 400,
          });
        }
        // Check if the student exists in the database
        const studentExists = await studentExistsById(id);
        
        if (!studentExists) {
          return new Response(JSON.stringify({ error: "Student not found" }), {
            status: 404,
          }); // Return 404 if student doesn't exist
        }
        const result = await editStudentById(user._id,id, body);
       
        if (result.success) {
          return new Response(JSON.stringify(result), { status: 200 });
          
        }
        return new Response(JSON.stringify(result), { status: 404 });
      },
      {
        params: t.Object({
          id: t.String(), // Validate student ID in query params
        }),
        body: t.Partial(
          t.Object({
            studentId: t.String(),
            LastName: t.String(),
            FirstName: t.String(),
            dateOfBirth: t.String({ format: "date-time" }), // Elysia doesn't support t.Date(), use ISO date format
            gender: t.Enum({ Male: "Male", Female: "Female", Other: "Other" }),
            placeOfBirth: t.String(),
            grade: t.Optional(t.String()),
            class: t.Optional(t.String()),
            guardianName: t.Optional(t.String()),
            guardianContact: t.String(),
          })
        ),
        beforeHandle: authMiddleware
      }
    )
    .delete(
      "/student/:id",
      async ({ params, user }: any) => {
        const { id } = params;
        if (!id) {
          return new Response(
            JSON.stringify({ error: "Student ID is required in query." }),
            { status: 400 }
          );
        }
        const result = await deleteStudentById(user._id,id);

        if (result.success) {
          return new Response(
            JSON.stringify({ success: true, message: result.data }),
            { status: 200 }
          );
        }
        return new Response(JSON.stringify({ error: result.error }), {
          status: 404,
        });
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        beforeHandle: authMiddleware
      }
    )
    .get("/student/aggregate/:studentId", async ({ params }) => {
      const { studentId } = params;

      // Call the controller function to calculate aggregate marks
      const result = await calculateAggregateMarks(studentId);

      if (result.success) {
        return { aggregate: result.aggregate };
      } else {
        return { error: result.error };
      }
    })
    .get("/students/sorted-by-score", async () => {
      const result = await getStudentsSortedByTotalScore();
      if (result.success) {
        return { status: 200, body: result.data };
      } else {
        return { status: 500, body: { error: result.error } };
      }
    });
};

// Response formatter helper

interface ControllerResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}

const formatResponse = (result: ControllerResponse) => {
  if (result.success) {
    return new Response(JSON.stringify(result.data), { 
      status: result.statusCode || 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ error: result.error }), { 
    status: result.statusCode || 500,
    headers: { "Content-Type": "application/json" }
  });
};
// Define a TypeScript type for better clarity
interface StudentData {
  studentId: string;
  LastName: string;
  FirstName: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  placeOfBirth: string;
  grade?: string;
  class?: string;
  guardianName?: string;
  guardianContact: string;
}
