import { appRouter } from "../dist/index.js";
import { createContext } from "../dist/index.js";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  // Handle tRPC requests
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: new Request(new URL(req.url || "/", `http://${req.headers.host}`), {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
    }),
    router: appRouter,
    createContext: () => createContext({ req, res }),
  });

  // Convert fetch Response to Vercel response
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const body = await response.text();
  res.send(body);
}
