// src/middleware/authMiddleware.ts
export const authMiddleware = async (context: any) => {

   // Extract the token from the Authorization header
   const authHeader = context.headers.authorization;
   if (!authHeader || !authHeader.startsWith("Bearer ")) {
     context.throw(401, "Unauthorized: Missing or invalid token");
   }

  const token = authHeader?.split(" ")[1];
  //console.log("Auth middleware: token extracted:", token);
  // If no token is provided in the Authorization header
  if (!token) {
    throw new Error("Token missing or not provided");
  }

  try {
    // Verify the token (you can also pass in options like expiration)
    const decoded = await context.jwt.verify(token, { secret: process.env.JWT_SECRET});
   
      // Ensure the decoded token has an _id or id field
      if (!decoded._id && !decoded.id) {
        context.throw(401, "Unauthorized: Invalid user ID in token");
      }
  
    // Attach the decoded user info to the context (for later use in routes)
    context.user = { 
      _id: decoded._id || decoded.id, ...decoded,
     };

     // Proceed to the next middleware/route handler
    // await context.next();
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
