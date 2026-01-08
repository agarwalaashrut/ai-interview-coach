/**
 * ChatSession Durable Object
 * Manages conversational memory and AI response generation per session
 */
import { INTERVIEW_COACH_CONTEXT } from "./context";

export interface Env {
  GEMINI_API_KEY: string;
}


interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSessionRequest {
  userInput: string;
}

interface ChatSessionResponse {
  aiResponse: string;
  history: Message[];
}

export class ChatSession implements DurableObject {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  /**
   * Handle incoming requests to the Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      // Parse request body defensively
      let requestData: ChatSessionRequest;
      try {
        const body = await request.text();
        requestData = JSON.parse(body);
      } catch (error) {
        return new Response("Invalid JSON", { status: 400 });
      }

      // Validate required fields
      if (!requestData.userInput || typeof requestData.userInput !== "string") {
        return new Response("Missing or invalid userInput field", { status: 400 });
      }

      // Load existing conversation history
      const history = await this.state.storage.get<Message[]>("history") || [];

      // Append user input to history
      history.push({
        role: "user",
        content: requestData.userInput,
      });

      // Call Google Gemini API
      const aiResponse = await this.callGeminiAPI(history);

      // Append assistant response to history
      history.push({
        role: "assistant",
        content: aiResponse,
      });

      // Persist updated history
      await this.state.storage.put("history", history);

      // Return response
      const response: ChatSessionResponse = {
        aiResponse,
        history,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  }

  /**
   * Call Google Gemini API with full conversation history
   */
  private async callGeminiAPI(history: Message[]): Promise<string> {
  const apiKey = this.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const contents = history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const model = "models/gemini-2.0-flash-lite";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: INTERVIEW_COACH_CONTEXT }],
        },
        contents,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") {
    throw new Error("Invalid Gemini response format");
  }

  return text;
}

}
