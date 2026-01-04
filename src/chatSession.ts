/**
 * ChatSession Durable Object
 * Manages conversational memory and AI response generation per session
 */

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

    // Format history for Gemini API
    const contents = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const requestBody = {
      contents,
    };

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    // Parse response defensively
    let responseData: unknown;
    try {
      const text = await response.text();
      responseData = JSON.parse(text);
    } catch (error) {
      throw new Error("Failed to parse Gemini API response");
    }

    // Extract text from response
    if (
      typeof responseData === "object" &&
      responseData !== null &&
      "candidates" in responseData
    ) {
      const candidates = responseData.candidates;
      if (Array.isArray(candidates) && candidates.length > 0) {
        const candidate = candidates[0];
        if (
          typeof candidate === "object" &&
          candidate !== null &&
          "content" in candidate
        ) {
          const content = candidate.content;
          if (
            typeof content === "object" &&
            content !== null &&
            "parts" in content
          ) {
            const parts = content.parts;
            if (Array.isArray(parts) && parts.length > 0) {
              const part = parts[0];
              if (typeof part === "object" && part !== null && "text" in part) {
                const text = part.text;
                if (typeof text === "string") {
                  return text;
                }
              }
            }
          }
        }
      }
    }

    throw new Error("Unable to extract text from Gemini API response");
  }
}
