"""
FastAPI server for the LangGraph agent with CopilotKit integration.
This replaces the LangGraph CLI serving approach.
"""

import os
import warnings
from contextlib import asynccontextmanager
from typing import Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uvicorn

from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint
from ag_ui_langgraph.agent import LangGraphAgent
from ag_ui_langgraph.utils import langchain_messages_to_agui
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

# Import all agent versions
from agent_v5 import create_agent_graph, create_agent_with_opik

# Import Supabase authentication utilities
from auth_utils import get_user_context_for_copilotkit

# Load environment variables
load_dotenv()

print(f"✓ Using Agent V5 with PostgreSQL persistence")

warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

# Patch: guard against missing message IDs in history when the client
# sends only the latest message. Fall back to a safe merge of history + input.
_ORIGINAL_PREPARE_STREAM = LangGraphAgent.prepare_stream


async def _safe_prepare_stream(self, input, agent_state, config):
    try:
        return await _ORIGINAL_PREPARE_STREAM(self, input, agent_state, config)
    except ValueError as exc:
        if "Message ID not found in history" not in str(exc):
            raise

        history_messages = agent_state.values.get("messages", [])
        merged_messages = langchain_messages_to_agui(history_messages) if history_messages else []

        if input.messages:
            merged_ids = {msg.id for msg in merged_messages if getattr(msg, "id", None)}
            merged_messages.extend(
                [msg for msg in input.messages if getattr(msg, "id", None) not in merged_ids]
            )

        fallback_input = input.copy(update={"messages": merged_messages})
        return await _ORIGINAL_PREPARE_STREAM(self, fallback_input, agent_state, config)


LangGraphAgent.prepare_stream = _safe_prepare_stream

# Global variable to store the agent (initialized in lifespan)
agent_graph = None


def validate_environment():
    """
    Validate that required environment variables are set.
    Raises ValueError if any required variables are missing.
    """
    # Check for either OpenRouter or Google API key
    openrouter_key = os.getenv("OPEN_ROUTER_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")
    
    if not openrouter_key and not google_key:
        error_msg = (
            "Missing required environment variables:\n"
            "  Please set one of the following:\n"
            "  - OPEN_ROUTER_API_KEY: OpenRouter API key (preferred)\n"
            "  - GOOGLE_API_KEY: Google Generative AI API key\n"
            "\nPlease set one of these in your aura-chef/agent/.env file"
        )
        raise ValueError(error_msg)
    
    print("✓ All required environment variables are set")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    Initializes PostgreSQL checkpoint saver for message persistence.
    """
    global agent_graph
    
    # Startup: Validate environment
    print("🚀 Starting FastAPI server for LangGraph agent...")
    try:
        validate_environment()
    except ValueError as e:
        print(f"\n❌ Environment validation failed:\n{e}\n")
        raise
    
    # Get DATABASE_URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError(
            "Missing DATABASE_URL environment variable.\n"
            "Please set it in your agent/.env file:\n"
            "DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres\n"
            "Get your database password from Supabase Dashboard > Settings > Database"
        )
    
    print(f"✓ Connecting to PostgreSQL database...")
    
    # Initialize AsyncPostgresSaver for checkpoint persistence
    async with AsyncPostgresSaver.from_conn_string(database_url) as checkpointer:
        # Setup database schema on first run (creates checkpoint tables)
        print(f"✓ Setting up checkpoint tables...")
        await checkpointer.setup()
        
        # Create agent graph with checkpointer
        print(f"✓ Compiling agent graph with persistence...")
        base_graph = create_agent_graph(checkpointer)
        
        # Wrap with Opik tracing
        agent_graph = create_agent_with_opik(base_graph)

        # Configure the LangGraph agent with CopilotKit now that graph is ready
        add_langgraph_fastapi_endpoint(
            app=app,
            agent=LangGraphAGUIAgent(
                name="sample_agent",
                description="A specialized recipe extraction assistant that extracts and formats recipes from URLs.",
                graph=agent_graph,
                config=agent_graph.config,
            ),
            path="/",
        )

        print("✓ Agent graph compiled with PostgreSQL persistence")
        yield
    
    # Shutdown
    print("👋 Shutting down FastAPI server...")


# Create FastAPI app with lifespan
app = FastAPI(
    title="Aura Chef Agent",
    description="LangGraph agent with CopilotKit integration, served via FastAPI",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware for frontend communication
# Get allowed origins from environment variable or use defaults
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# Default allowed origins for development and production
if not allowed_origins:
    allowed_origins = [
        "http://localhost:3000",  # Local development
        "https://*.vercel.app",   # Vercel preview deployments
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add LangGraph endpoint with CopilotKit integration and authentication
# Custom middleware to inject user context into LangGraph config
@app.middleware("http")
async def add_auth_context_middleware(request: Request, call_next):
    """
    Middleware to extract authentication info and make it available to the agent.
    This allows the LangGraph agent to access user context via config.
    """
    # Get authorization header
    auth_header = request.headers.get("authorization")
    
    # Extract user context for the agent
    user_context = get_user_context_for_copilotkit(auth_header)
    
    # Store in request state for the agent to access
    request.state.user_context = user_context
    
    response = await call_next(request)
    return response


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for monitoring and deployment verification.
    
    Returns:
        dict: Health status and basic information
    """
    return {
        "status": "healthy",
        "service": "aura-chef-agent",
        "version": "1.0.0",
        "agent": "sample_agent",
        "agent_version": "v5",
    }


@app.get("/auth/me")
async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Get current authenticated user information.
    
    Validates the Supabase JWT token and returns user details.
    
    Args:
        authorization: Bearer token in Authorization header
    
    Returns:
        dict: Current user information
    """
    user_context = get_user_context_for_copilotkit(authorization)
    return {
        "user_id": user_context.get("user_id"),
        "user_role": user_context.get("user_role"),
        "user_email": user_context.get("user_email"),
        "user_metadata": user_context.get("user_metadata", {}),
        "authenticated": user_context.get("authenticated", False),
    }


def main():
    """
    Run the uvicorn server.
    """
    port = int(os.getenv("PORT", "8080"))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"\n{'='*60}")
    print(f"🎯 Aura Chef Agent Server")
    print(f"{'='*60}")
    print(f"🤖 Agent Version: V5")
    print(f"📍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🌐 Agent endpoint: http://localhost:{port}/")
    print(f"💚 Health check: http://localhost:{port}/health")
    print(f"👤 Current user: http://localhost:{port}/auth/me")
    print(f"{'='*60}")
    print(f"🔐 Authentication: Supabase (required)")
    print(f"   Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
    print(f"\n💡 Tip: Set AGENT_VERSION=v5 (default), v4, v3, or v2 in .env")
    print(f"💡 Agent V5: Unified extraction tool with automatic follow-up links")
    print(f"💡 Supabase: Configure auth providers in Supabase dashboard")
    print(f"{'='*60}\n")
    
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=True,
    )


if __name__ == "__main__":
    main()
