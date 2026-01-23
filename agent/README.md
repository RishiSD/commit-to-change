# Aura Chef Agent - FastAPI Migration

This agent has been migrated from LangGraph CLI to FastAPI serving for better deployment flexibility and control.

## 🚀 Quick Start

### Local Development

From the project root (`aura-chef/`):

```bash
# Start both UI and agent
pnpm dev

# Or start them separately:
pnpm dev:ui      # Start Next.js UI on port 3000
pnpm dev:agent   # Start FastAPI agent on port 8123
```

### Agent Only

From the `agent/` directory:

```bash
# Install dependencies
uv sync

# Run the server
uv run python server.py

# Or with uvicorn directly
uv run uvicorn server:app --reload --port 8123
```

## 📁 Project Structure

```
agent/
├── server.py              # FastAPI server with agent, tools, and CopilotKit integration
├── pyproject.toml        # Python dependencies
├── .env                  # Environment variables
└── main.py.backup        # Old LangGraph CLI entry point (backup)
```

## 🔧 Configuration

### Environment Variables

Create/update `agent/.env`:

```bash
# Required
GOOGLE_API_KEY=your_google_api_key_here

# Optional - Opik LLM Observability
OPIK_API_KEY=your_opik_api_key_here     # For LLM tracing and observability
OPIK_WORKSPACE=your_workspace_name       # Your Opik workspace (optional)

# Optional - Server Configuration
PORT=8123                 # FastAPI server port (default: 8123)
HOST=0.0.0.0             # Server host (default: 0.0.0.0)
```

**Getting Opik API Key:**
1. Sign up for free at [comet.com/opik](https://www.comet.com/opik)
2. Navigate to your workspace settings
3. Copy your API key
4. Add it to `agent/.env`

With Opik enabled, you'll get:
- Full LLM call tracing and observability
- Cost tracking for all LLM calls
- Performance metrics and latency tracking
- Conversation threading and replay
- View traces at [comet.com/opik](https://www.comet.com/opik)

### Frontend Configuration

The frontend automatically connects to the agent at `http://localhost:8123` during development.

For production, set the `AGENT_URL` environment variable in your frontend deployment.

## 🎯 Key Changes from LangGraph CLI

### What Changed

1. **Server**: Now using FastAPI instead of LangGraph CLI
2. **Dependencies**: Removed `langgraph-cli`, `langsmith`, and `langgraph-api`
3. **Frontend Adapter**: Changed from `LangGraphAgent` to `LangGraphHttpAgent`
4. **No LangSmith Required**: No longer needs `LANGSMITH_API_KEY`
5. **Simpler Deployment**: Can deploy to any platform that supports Python/FastAPI

### What Stayed the Same

- Agent logic and behavior
- State management
- Tool definitions
- Frontend integration via CopilotKit
- All features (shared state, generative UI, frontend tools, etc.)

## 📦 Dependencies

### Python (agent/)

- `langchain` - LangChain framework
- `langgraph` - LangGraph for agent workflows
- `langchain-google-genai` - Google Gemini integration
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `copilotkit` - CopilotKit Python SDK
- `ag-ui-langgraph` - CopilotKit FastAPI integration
- `python-dotenv` - Environment variable management
- `opik` - LLM observability and tracing (optional)

### JavaScript (frontend)

- `@copilotkit/runtime` with `LangGraphHttpAgent`

## 🚢 Deployment

### Local Development
Already configured! Just run `pnpm dev`.

### Production Deployment Options

#### Option 1: Railway / Render / Fly.io
1. Deploy the `agent/` directory as a Python app
2. Set environment variables (`GOOGLE_API_KEY`, `PORT`)
3. Use the provided health check endpoint: `/health`
4. Update frontend `AGENT_URL` to your deployed agent URL

#### Option 2: Docker (Coming Soon)
Docker configuration will be added in a future update.

#### Option 3: Vercel (Frontend) + Separate Agent Hosting
- Deploy Next.js frontend to Vercel
- Deploy Python agent to Railway/Render/Fly.io
- Connect them via `AGENT_URL` environment variable

## 🔍 API Endpoints

- `GET /health` - Health check endpoint
- `POST /` - Main agent endpoint (used by CopilotKit)

## 🛠️ Troubleshooting

### Server won't start

**Issue**: Missing environment variables
```bash
❌ Environment validation failed:
Missing required environment variables:
  - GOOGLE_API_KEY: Google Generative AI API key for the LLM
```

**Solution**: Create `agent/.env` and add your `GOOGLE_API_KEY`

### Import errors

**Issue**: `ImportError: cannot import name 'graph' from 'src.agent'`

**Solution**: Make sure you're in the `agent/` directory and run `uv sync`

### Port already in use

**Issue**: `Address already in use: 127.0.0.1:8123`

**Solution**: 
- Stop other processes using port 8123, or
- Change the port: `PORT=8124 uv run python server.py`

### Frontend can't connect to agent

**Issue**: Frontend shows connection errors

**Solution**: 
1. Ensure agent is running on port 8123
2. Check agent logs for errors
3. Test health endpoint: `curl http://localhost:8123/health`

## 📝 Development Notes

### Adding New Tools

Add tools in `server.py`:

```python
@tool
def my_new_tool(param: str):
    """Tool description for the LLM."""
    return f"Result: {param}"

# Update the agent creation to include the new tool
agent = create_agent(
    model=model,
    tools=[get_weather, my_new_tool],  # Add your new tool here
    middleware=[CopilotKitMiddleware()],
    state_schema=AgentState,
    system_prompt="You are a helpful research assistant."
)
```

### Modifying Agent State

Update `AgentState` class in `server.py`:

```python
class AgentState(CopilotKitState):
    proverbs: List[str]
    my_new_field: str = ""  # Add your field
```

Don't forget to update the TypeScript type in `src/lib/types.ts`:

```typescript
export type AgentState = {
  proverbs: string[];
  my_new_field: string;  // Match Python state
};
```

## 🤝 Support

For issues or questions:
- Check CopilotKit docs: https://docs.copilotkit.ai
- Review LangGraph docs: https://langchain-ai.github.io/langgraph/

## ✨ Features

- ✅ Health check endpoint for monitoring
- ✅ Environment variable validation on startup
- ✅ CORS configured for frontend communication
- ✅ Hot reload enabled for development
- ✅ Detailed startup logs
- ✅ Memory-based checkpointing for conversation history
- ✅ Support for frontend tools via CopilotKit
- ✅ Human-in-the-loop ready (for future implementation)
- ✅ LLM observability with Opik integration (optional)
- ✅ Automatic cost and performance tracking
