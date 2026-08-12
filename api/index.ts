// Vercel Serverless Function entry for the MaayMaxaa DataHub API.
// The whole Express app is re-exported so Vercel runs it as one serverless function.
// Requests reach this function via vercel.json rewrites (`/api/(.*) -> /api`).
import app from "../backend/src/server.js";

export default app;