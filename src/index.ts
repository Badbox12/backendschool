import { Elysia } from "elysia";
import { connectDB } from "./config";
import studentRoutes from "./routes/studentRoutes";
import swagger from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import markRoutes from "./routes/markRoutes";
import adminRoutes from "./routes/adminRoutes";
import adminLogRoutes from "./routes/adminLogRoutes";
import jwt from "@elysiajs/jwt";
import Mark from "./models/markModel";
import Student from "./models/studentModel";
import { ApiError } from "./error";
import { csrfPlugin } from "~middlewares/csrfMiddlware";
import cookie from "@elysiajs/cookie";


connectDB();
const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || "";
const app = new Elysia();
app.use(cookie())
app.use(csrfPlugin());


app.use(
  jwt({
    name: "jwt",
    secret: JWT_SECRET,
    algorithms: ["HS256"], // Ensure the algorithm matches your token
  })
);
app.use(
  cors({
    // Default settings (allow all origins)
    origin: "http://localhost:3000", // Change this to specific domains for security
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization","x-csrf-token"], // Allowed headers
  })
);
app.use(
  swagger({
    documentation: {
      info: {
        title: "Primary School Mark Management API",
        version: "1.0.0",
      },
    },
  })
);
markRoutes(app);
studentRoutes(app);
adminRoutes(app);
adminLogRoutes(app);
app.onError(({ code, error }) => {
  const errorMessage =
    typeof error === "object" && "message" in error
      ? error.message
      : String(error);
  console.error(`Error: ${code}`, errorMessage);
  return { success: false, message: errorMessage };
});
// In routes:
app.onError(({ error }) => {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
      code: error.status,
    };
  }
  return { success: false, error: "Internal Server Error" };
});
app.listen(PORT, () => {
  console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
  );
});



