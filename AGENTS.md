# Agent Development Guide

This document provides essential information for AI coding agents working in this repository.

## Project Overview

This is a CopilotKit + LangGraph starter project with a Next.js frontend (`aura-chef/`) and Python LangGraph agent (`aura-chef/agent/`). The project demonstrates AI agent integration with generative UI, frontend tools, human-in-the-loop patterns, and shared state management.

## Directory Structure

```
aura-chef/
├── src/                    # Next.js frontend
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   └── lib/               # Types and utilities
├── agent/                 # Python LangGraph agent
│   ├── main.py           # Agent entry point
│   ├── pyproject.toml    # Python dependencies
│   └── langgraph.json    # LangGraph configuration
└── public/               # Static assets
```

## Build, Lint, and Test Commands

### Frontend (Next.js/TypeScript)

```bash
# Install dependencies (from aura-chef/)
pnpm install              # Recommended
npm install               # Alternative

# Development
pnpm dev                  # Start both UI and agent
pnpm dev:ui               # Start only Next.js UI
pnpm dev:agent            # Start only LangGraph agent
pnpm dev:debug            # Start with debug logging

# Build and Production
pnpm build                # Build Next.js for production
pnpm start                # Start production server

# Linting
pnpm lint                 # Run ESLint on all files
pnpm lint -- --fix        # Auto-fix linting issues
```

### Python Agent

```bash
# Install dependencies (from aura-chef/agent/)
uv sync                   # Install/sync Python dependencies

# Development
cd agent && npx @langchain/langgraph-cli dev --port 8123

# No test framework currently configured
```

### Running Single Tests

Currently, no test framework is configured. To add testing:

**Frontend (Jest/Vitest):**
```bash
# Would run: pnpm test path/to/file.test.ts
# Not yet implemented
```

**Python (pytest):**
```bash
# Would run: pytest agent/tests/test_specific.py::test_function
# Not yet implemented
```

## Code Style Guidelines

### TypeScript/React

**Imports:**
- Use absolute imports with `@/` prefix: `import { Foo } from "@/lib/types"`
- Group imports: React/Next.js → Third-party → Internal
- Use named imports from `@copilotkit/react-core` and `@copilotkit/react-ui`

**Formatting:**
- Use 2 spaces for indentation
- Double quotes for strings
- Semicolons required
- Trailing commas in multiline objects/arrays

**Types:**
- Use TypeScript strict mode (`strict: true`)
- Always define prop types for components
- Avoid `any` - use specific types or `unknown`
- Define state types that align with Python agent state

**Naming Conventions:**
- Components: PascalCase (`WeatherCard.tsx`)
- Files: lowercase with hyphens for non-components
- Hooks: camelCase starting with `use`
- Constants: UPPER_SNAKE_CASE

**React Patterns:**
- Use functional components with hooks
- Use `"use client"` directive for client components
- Destructure props in function parameters
- Use CopilotKit hooks: `useCoAgent`, `useFrontendTool`, `useRenderToolCall`, `useHumanInTheLoop`

**Error Handling:**
- Handle async operations with try/catch
- Provide user feedback for errors
- Log errors for debugging

### Python (LangGraph Agent)

**Imports:**
- Group: Standard library → Third-party → Local
- One import per line for clarity

**Formatting:**
- Use 4 spaces for indentation
- Follow PEP 8 style guide
- Use double quotes for docstrings, single quotes for strings

**Types:**
- Use type hints for function parameters and return values
- Use `typing` module for complex types (`List`, `Dict`, etc.)
- Define state schemas with Pydantic/CopilotKitState

**Naming Conventions:**
- Functions/variables: snake_case
- Classes: PascalCase
- Constants: UPPER_SNAKE_CASE
- Tools: descriptive snake_case names

**LangGraph Patterns:**
- Extend `CopilotKitState` for shared state
- Use `@tool` decorator for tool definitions
- Include detailed docstrings for tools (agent uses them)
- Use `create_agent()` with CopilotKitMiddleware

**Error Handling:**
- Use try/except for external API calls
- Return descriptive error messages
- Log errors appropriately

## Configuration Files

- **tsconfig.json**: TypeScript strict mode, path aliases with `@/*`
- **eslint.config.mjs**: Next.js ESLint rules, TypeScript support
- **next.config.ts**: Server external packages for CopilotKit
- **pyproject.toml**: Python dependencies, requires Python >=3.12
- **langgraph.json**: Agent configuration, graph definitions

## Important Notes

- **Package Manager**: Project ignores lock files to support multiple managers (pnpm recommended)
- **API Keys**: Store in `agent/.env` (OPENAI_API_KEY or other LLM keys)
- **Ports**: UI runs on 3000, agent on 8123
- **State Sync**: Keep TypeScript types in `src/lib/types.ts` aligned with Python `AgentState`
- **CopilotKit Version**: Using v1.51.0 - check docs at docs.copilotkit.ai
- **Agent Runtime**: LangGraph agent must be running for CopilotKit to function

## Common Tasks

**Adding a frontend tool:**
1. Use `useFrontendTool()` hook in component
2. Define name, description, and parameters
3. Implement handler function

**Adding a backend tool:**
1. Define tool with `@tool` decorator in `agent/main.py`
2. Add to tools array in `create_agent()`
3. Tool will be automatically available to agent

**Adding generative UI:**
1. Create component for UI rendering
2. Use `useRenderToolCall()` hook with tool name
3. Backend tool triggers UI render

**Updating shared state:**
1. Update `AgentState` class in Python
2. Update `AgentState` type in TypeScript
3. Use `setState()` from `useCoAgent()` hook

## Resources

- [CopilotKit Docs](https://docs.copilotkit.ai)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [Next.js Docs](https://nextjs.org/docs)
