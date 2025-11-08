import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// tRPC API endpoint
app.use(
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Export as serverless function
export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any);
};
