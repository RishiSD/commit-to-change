# Agent Development Guide

AI coding agent instructions for the Aura Chef repository.

## Project Overview

CopilotKit + LangGraph project with Next.js frontend and Python agent. Extracts recipes from URLs using AI with generative UI, shared state, and Supabase auth.

**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind 4 + CopilotKit 1.51 | Python 3.12 + LangGraph + FastAPI

## Directory Structure

```
 aura-chef/
├── src/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks (useSupabaseAuth)
│   └── lib/                 # Types, Supabase clients
├── agent/                   # Python LangGraph agent
│   ├── server.py           # FastAPI server entry
│   ├── agent_v5.py         # Main agent graph
│   ├── tools/              # LangGraph tools
│   └── utils/              # Python utilities
└── public/
```

## Build, Lint, and Test Commands

### Frontend (Next.js)

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start UI + agent concurrently
pnpm dev:ui               # Next.js only (port 3000)
pnpm dev:agent            # Agent only (port 8123)
pnpm dev:debug            # With debug logging
pnpm build                # Production build
pnpm start                # Production server
pnpm lint                 # ESLint
pnpm lint -- --fix        # Auto-fix issues
```

### Python Agent

```bash
cd agent && uv sync       # Install Python deps
python server.py          # Start FastAPI server
```

### Single Test Commands

**No test framework configured yet.**

Frontend would use: `pnpm test path/to/file.test.ts`
Python would use: `pytest agent/tests/test_file.py::test_func`

## Code Style Guidelines

### TypeScript/React

**Imports:**
- Absolute imports with `@/` prefix: `import { RecipeJSON } from "@/lib/types"`
- Group: React/Next → Third-party → Internal
- Named imports from `@copilotkit/react-core`, `@copilotkit/react-ui`

**Formatting:**
- 2 spaces indentation
- Double quotes for strings
- Semicolons required
- Trailing commas in multiline

**Types:**
- Strict mode enabled (`strict: true`)
- Define prop interfaces: `interface RecipeCardProps { recipe: RecipeJSON }`
- Avoid `any`, use `unknown` or specific types
- Align TypeScript types with Python `AgentState`

**Naming:**
- Components: PascalCase (`RecipeCard.tsx`)
- Files: lowercase-with-hyphens for non-components
- Hooks: camelCase with `use` prefix
- Constants: UPPER_SNAKE_CASE

**Patterns:**
- Functional components with hooks
- `"use client"` for client components
- Destructure props in parameters
- `useLayoutEffect` for hydration detection
- CopilotKit hooks: `useCoAgent`, `useRenderToolCall`

**Error Handling:**
- try/catch for async operations
- `toast` from react-hot-toast for user feedback
- Console.error for debugging

### Python (LangGraph)

**Imports:**
```python
import os                           # Standard library
from langchain.chat_models import init_chat_model  # Third-party
from tools.unified_extraction import extract_and_process_recipe  # Local
```

**Formatting:**
- 4 spaces indentation
- PEP 8 style
- Double quotes for docstrings, single for strings

**Types:**
- Type hints required: `def func(url: str) -> dict:`
- Use `typing` module: `Optional`, `List`, `Dict`
- State schemas extend `CopilotKitState`

**Naming:**
- Functions/variables: snake_case
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE
- Tools: descriptive snake_case

**LangGraph Patterns:**
- Extend `CopilotKitState` for state
- `@tool` decorator for tools
- Detailed docstrings (agent reads them)
- `create_agent()` with tools array

**Error Handling:**
- try/except for external APIs
- Return descriptive error dicts: `{"success": False, "error": "..."}`

## Key Configuration

- **tsconfig.json:** Strict mode, `@/*` path aliases
- **eslint.config.mjs:** Next.js + TypeScript rules
- **next.config.ts:** `serverExternalPackages: ["@copilotkit/runtime"]`
- **pyproject.toml:** Python >=3.12, uv package manager

## Important Notes

- **API Keys:** Store in `agent/.env` (OPEN_ROUTER_API_KEY or GOOGLE_API_KEY)
- **Ports:** UI on 3000, agent on 8123
- **State Sync:** Keep `src/lib/types.ts` aligned with Python `AgentState` class
- **Auth:** Supabase JWT passed via CopilotKit properties
- **Agent:** Must be running for CopilotKit to function

## Common Tasks

**Add frontend tool:**
1. Use `useFrontendTool()` hook
2. Define name, description, parameters
3. Implement handler

**Add backend tool:**
1. Create `@tool` decorated function in `agent/tools/`
2. Add to tools array in `agent_v5.py`
3. Import and use in agent

**Add generative UI:**
1. Create component (e.g., `RecipeCard.tsx`)
2. Use `useRenderToolCall()` with tool name
3. Backend tool triggers UI render via state

**Update shared state:**
1. Update Python `AgentState` class
2. Update TypeScript `AgentState` type
3. Use `setState()` from `useCoAgent()` hook

## Resources

- [CopilotKit Docs](https://docs.copilotkit.ai)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [Next.js Docs](https://nextjs.org/docs)
