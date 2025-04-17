import { Elysia } from "elysia";
import { randomBytes } from "crypto";

function generateCsrfToken() {
  return randomBytes(32).toString("hex");
}

export const csrfPlugin = () =>
  new Elysia({ name: "csrf-plugin" }).onBeforeHandle((ctx: any) => {
    const { request, cookie, headers, setCookie } = ctx;
    const method = request.method;
    const protectedMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (!protectedMethods.includes(method)) {
      let csrfToken = cookie["csrfToken"]?.value;
      if (!csrfToken) {
        csrfToken = generateCsrfToken();
        setCookie("csrfToken", csrfToken, {
          httpOnly: false,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
          path: "/"
        });
      }
      return;
    }

    const csrfTokenCookie = cookie["csrfToken"]?.value;
    const csrfTokenHeader =
      headers["x-csrf-token"] ||
      headers["csrf-token"] ||
      headers["x-xsrf-token"];

    if (!csrfTokenCookie || !csrfTokenHeader || csrfTokenCookie !== csrfTokenHeader) {
      throw new Error("Invalid or missing CSRF token");
    }
  });