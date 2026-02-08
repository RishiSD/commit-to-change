# Aura Chef: AI-Powered Recipe Extraction

Aura Chef is an AI-powered platform that extracts recipes from URLs using advanced natural language processing. Built with [LangGraph](https://www.langchain.com/langgraph) and [CopilotKit](https://copilotkit.ai), it features a modern Next.js frontend and a Python-based agent backend.

## Prerequisites

- Node.js 18+
- Python 3.12+
- [pnpm](https://pnpm.io/installation) (recommended)
- Supabase account for authentication and database
- Google Cloud CLI for deployment
- API Keys:
  - OpenAI API Key
  - Supabase Service Key
  - Open Router API Key

## Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `agent/` directory with the following:
   ```env
   OPEN_ROUTER_API_KEY=your-open-router-api-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   DATABASE_URL=your-database-url
   INSTAGRAM_USERNAME=your-instagram-username
   INSTAGRAM_PASSWORD=your-instagram-password
   ```

3. **Start the development server:**
   ```bash
   pnpm dev
   ```
   This will start both the Next.js UI (port 3000) and the Python agent (port 8123).

## Available Scripts

- `dev` - Starts both UI and agent servers in development mode
- `dev:ui` - Starts only the Next.js UI server
- `dev:agent` - Starts only the Python agent server
- `dev:debug` - Starts development servers with debug logging enabled
- `build` - Builds the Next.js application for production
- `start` - Starts the production server
- `lint` - Runs ESLint for code linting
- `lint --fix` - Auto-fixes linting issues
- `install:agent` - Installs Python dependencies for the agent

## Documentation

- [AGENTS.md](AGENTS.md) - Guide to developing the Python agent
- [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md) - Instructions for setting up Supabase
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions for Google Cloud Run
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [Next.js Documentation](https://nextjs.org/docs)

## Troubleshooting

### Agent Connection Issues
If you encounter issues connecting to the agent:
1. Ensure the Python agent is running on port 8123.
2. Verify that all environment variables are set correctly.
3. Check the logs for errors using:
   ```bash
   pnpm dev:debug
   ```

### Python Dependencies
If you encounter Python import errors:
```bash
pnpm install:agent
```

### Deployment Errors
If deployment to Google Cloud Run fails:
1. Verify that the `gcloud` CLI is authenticated.
2. Ensure all required environment variables are set in the deployment command.
3. Check the `DEPLOYMENT.md` file for detailed steps.

## Contributing

Feel free to submit issues and enhancement requests! This project is designed to be easily extensible.

## License

This project is licensed under the MIT License - see the LICENSE file for details.