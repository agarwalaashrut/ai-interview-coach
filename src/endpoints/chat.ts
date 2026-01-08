import { OpenAPIRoute, contentJson } from "chanfana";
import { z } from "zod";

export class ChatEndpoint extends OpenAPIRoute {
  static schema = {
    summary: "Chat with AI interview coach",

    request: {
      body: contentJson(
        z.object({
          sessionId: z.string(),
          userInput: z.string(),
        })
      ),
    },

    responses: {
      200: {
        description: "AI response",
        content: contentJson(
          z.object({
            aiResponse: z.string(),
            history: z.array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            ),
          })
        ),
      },
    },
  };

  async handle(c: any) {
    // Manually parse request body
    let requestBody: any;
    try {
      requestBody = await c.req.json();
    } catch (error) {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    // Safely extract and validate fields
    const sessionId = requestBody?.sessionId;
    const userInput = requestBody?.userInput;

    if (!sessionId || typeof sessionId !== "string") {
      return c.json({ error: "Missing or invalid sessionId" }, 400);
    }

    if (!userInput || typeof userInput !== "string") {
      return c.json({ error: "Missing or invalid userInput" }, 400);
    }

    // Create Durable Object instance and call it
    const id = c.env.CHAT_SESSION.idFromName(sessionId);
    const stub = c.env.CHAT_SESSION.get(id);

    return stub.fetch("http://do/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput }),
    });
  }
}
