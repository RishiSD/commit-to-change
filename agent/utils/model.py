"""Shared model initialization for agent tools."""

import os

from langchain.chat_models import init_chat_model


def get_model():
    """Initialize the LLM model used by agent tools."""
    openrouter_key = os.getenv("OPEN_ROUTER_API_KEY")
    openrouter_model = os.getenv("OPEN_ROUTER_MODEL", "openai/gpt-oss-120b")
    openrouter_provider = os.getenv("OPEN_ROUTER_PROVIDER", "openai")
    openrouter_base_url = os.getenv("OPEN_ROUTER_BASE_URL", "https://api.groq.com/openai/v1")
    gemini_model = os.getenv("GEMINI_MODEL", "google_genai:gemini-2.5-flash-lite")

    if openrouter_key:
        print("✓ Using OpenRouter for LLM (Agent V5)")
        return init_chat_model(
            model=openrouter_model,
            model_provider=openrouter_provider,
            api_key=openrouter_key,
            base_url=openrouter_base_url,
        )

    print("✓ Using Google Gemini for LLM (Agent V5)")
    return init_chat_model(gemini_model)
