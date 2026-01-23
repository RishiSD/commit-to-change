"""
FastAPI server for the LangGraph agent with CopilotKit integration.
This replaces the LangGraph CLI serving approach.
"""

import os
import warnings
from contextlib import asynccontextmanager
from typing import Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

# Import all agent versions
from agent_v5 import agent_with_opik as agent_v5

# Load environment variables
load_dotenv()

agent_with_opik = agent_v5

print(f"✓ Using Agent V5")

warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")


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
    """
    # Startup: Validate environment
    print("🚀 Starting FastAPI server for LangGraph agent...")
    try:
        validate_environment()
    except ValueError as e:
        print(f"\n❌ Environment validation failed:\n{e}\n")
        raise
    
    print("✓ Agent graph compiled and ready")
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add LangGraph endpoint with CopilotKit integration
add_langgraph_fastapi_endpoint(
    app=app,
    agent=LangGraphAGUIAgent(
        name="sample_agent",
        description="A specialized recipe extraction assistant that extracts and formats recipes from URLs.",
        graph=agent_with_opik,
        config=agent_with_opik.config,
    ),
    path="/",
)


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


def main():
    """
    Run the uvicorn server.
    """
    port = int(os.getenv("PORT", "8123"))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"\n{'='*60}")
    print(f"🎯 Aura Chef Agent Server")
    print(f"{'='*60}")
    print(f"🤖 Agent Version: V5")
    print(f"📍 Host: {host}")
    print(f"🔌 Port: {port}")
    print(f"🌐 Agent endpoint: http://localhost:{port}/")
    print(f"💚 Health check: http://localhost:{port}/health")
    print(f"{'='*60}")
    print(f"\n💡 Tip: Set AGENT_VERSION=v5 (default), v4, v3, or v2 in .env")
    print(f"💡 Agent V5: Unified extraction tool with automatic follow-up links")
    print(f"{'='*60}\n")
    
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=True,
    )


if __name__ == "__main__":
    main()
