import { fromHono } from "chanfana";
import { Hono } from "hono";

import { ChatEndpoint } from "./endpoints/chat";

// Export the chat session type
export { ChatSession } from "./chatSession";


interface Env {
  CHAT_SESSION: DurableObjectNamespace;
  ASSETS: Fetcher;
}
// Start a Hono app
const app = new Hono<{ Bindings: Env }>();


// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/docs",
});
openapi.post("/api/chat", ChatEndpoint);

// Serve static assets for all other routes
app.all("*", async (c) => {
  // Try to serve from ASSETS binding
  const response = await c.env.ASSETS.fetch(c.req.raw);
  return response;
});

// Export the Hono app
export default app;
