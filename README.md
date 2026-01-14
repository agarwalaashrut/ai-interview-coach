# AI Interview Coach

An AI-powered interview coaching platform built with Cloudflare Workers, featuring real-time chat interactions and persistent conversation history using Durable Objects.

## Overview

AI Interview Coach provides an interactive chat interface where users can practice interview scenarios with an AI coach. The application maintains conversation context across sessions, allowing for meaningful and continuous interview preparation experiences.

## Features

- **Real-time AI Chat**: Interactive conversation with an AI interview coach
- **Session Persistence**: Maintains conversation history across multiple interactions using Cloudflare Durable Objects
- **RESTful API**: OpenAPI 3.1 compliant endpoints with automatic documentation
- **Static Frontend**: Serves a web interface for easy interaction
- **Scalable Architecture**: Built on Cloudflare's edge network for global performance

## Tech Stack

- **Runtime**: Cloudflare Workers
- **API Framework**: [Hono](https://hono.dev/) - Fast, lightweight web framework
- **API Documentation**: [Chanfana](https://github.com/cloudflare/chanfana) - OpenAPI 3.1 schema generation and validation
- **Validation**: Zod - TypeScript-first schema validation
- **State Management**: Cloudflare Durable Objects - Consistent, low-latency coordination
- **Language**: TypeScript

## Prerequisites

- Node.js (v18 or higher recommended)
- A Cloudflare account
- Wrangler CLI (installed via npm)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/agarwalaashrut/ai-interview-coach.git
cd ai-interview-coach
```

2. Install dependencies:
```bash
npm install
```

3. Login to Cloudflare:
```bash
npx wrangler login
```

## Development

Start the local development server:

```bash
npm run dev
# or
npm start
```

The application will be available at `http://localhost:8787/`

- **API Documentation**: Visit `http://localhost:8787/docs` to see the interactive Swagger UI
- **Frontend**: The main interface is served from the root path

## API Endpoints

### POST `/api/chat`

Send a message to the AI interview coach and receive a response.

**Request Body:**
```json
{
  "sessionId": "string",
  "userInput": "string"
}
```

**Response:**
```json
{
  "aiResponse": "string",
  "history": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ]
}
```

**Parameters:**
- `sessionId`: Unique identifier for the conversation session
- `userInput`: The user's message or question

## Project Structure

```
ai-interview-coach/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── chatSession.ts        # Durable Object for session management
│   └── endpoints/
│       └── chat.ts           # Chat endpoint implementation
├── public/                   # Static frontend assets
├── .github/                  # GitHub configuration
├── .vscode/                  # VS Code settings
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── wrangler.jsonc           # Cloudflare Workers configuration
└── README.md
```

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

After deployment, your application will be available at your Cloudflare Workers URL (e.g., `https://ai-interview-coach.<your-subdomain>.workers.dev`)

## Configuration

The application is configured via `wrangler.jsonc`:

- **Durable Objects**: `CHAT_SESSION` binding for conversation state management
- **Static Assets**: Serves files from the `./public/` directory
- **Compatibility Date**: Set to `2026-01-03`

## How It Works

1. **Session Management**: Each conversation is identified by a unique `sessionId`
2. **Durable Objects**: The `ChatSession` Durable Object maintains conversation history and state
3. **Request Flow**:
   - Client sends a POST request to `/api/chat` with `sessionId` and `userInput`
   - The endpoint creates/retrieves a Durable Object instance for that session
   - The Durable Object processes the message and maintains conversation context
   - Response includes AI's reply and full conversation history

## Development Tips

- **Hot Reload**: Changes to files in `src/` automatically reload the development server
- **API Testing**: Use the Swagger UI at `/docs` to test endpoints interactively
- **TypeScript**: Enable strict type checking for better code quality
- **OpenAPI Schema**: Automatically generated from code annotations

## Environment Variables

Currently, the project uses Cloudflare Workers bindings and doesn't require traditional environment variables. Sensitive data should be stored as [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is available under the [MIT License](LICENSE).

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Durable Objects Documentation](https://developers.cloudflare.com/durable-objects/)
- [Hono Framework](https://hono.dev/)
- [Chanfana Documentation](https://chanfana.pages.dev/)
- [OpenAPI 3.1 Specification](https://swagger.io/specification/)

## Support

For issues, questions, or contributions, please [open an issue](https://github.com/agarwalaashrut/ai-interview-coach/issues) on GitHub.

---

Built with ❤️ using Cloudflare Workers
