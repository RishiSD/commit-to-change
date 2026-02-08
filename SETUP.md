# Aura Chef - Setup Guide

Complete setup instructions for running Aura Chef locally or deploying to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

## Prerequisites

Before getting started, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Python 3.12+** - [Download here](https://www.python.org/downloads/)
- **pnpm** - Install with `npm install -g pnpm`
- **uv** (Python package installer) - Install with `curl -LsSf https://astral.sh/uv/install.sh | sh`

### Required Accounts & API Keys

You'll need to set up accounts and obtain API keys for the following services:

1. **Supabase** (Database & Authentication)
   - Create an account at [supabase.com](https://supabase.com)
   - See [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md) for detailed setup

2. **OpenRouter** (LLM Access)
   - Create an account at [openrouter.ai](https://openrouter.ai)
   - Get your API key from the dashboard

3. **Opik** (LLM Observability & Tracing) - *Optional but recommended*
   - Create a free account at [comet.com](https://www.comet.com/signup?from=llm)
   - Get your API key from the Opik dashboard
   - Create a project named "commit-to-change" (or update the project name in `agent/agent_v5.py`)

4. **Instagram/TikTok** (Social Media Extraction) - *Optional*
   - Instagram username/password for post extraction
   - Required only if you want to extract from Instagram posts

5. **Google Cloud** (Optional - for deployment only)
   - Google Cloud account with billing enabled
   - `gcloud` CLI installed and configured

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd aura-chef
```

### 2. Install Frontend Dependencies

```bash
pnpm install
```

### 3. Install Python Dependencies

```bash
cd agent
uv sync
cd ..
```

Or use the npm script:

```bash
pnpm install:agent
```

## Environment Configuration

### Frontend Environment Variables

Create a `.env.local` file in the project root (optional - only if you need custom configs):

```env
# Next.js will use environment variables from Supabase automatically
# Add any custom frontend configs here if needed
```

### Backend Environment Variables

Create a `.env` file in the `agent/` directory:

```env
# Required: LLM API Key (choose one or both)
OPEN_ROUTER_API_KEY=your-open-router-api-key
# OR
GOOGLE_API_KEY=your-google-api-key

# Required: Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Optional: Opik Configuration for LLM Observability
OPIK_API_KEY=your-opik-api-key
OPIK_WORKSPACE=your-opik-workspace
OPIK_PROJECT_NAME=commit-to-change

# Optional: Social Media Extraction
INSTAGRAM_USERNAME=your-instagram-username
INSTAGRAM_PASSWORD=your-instagram-password

# Optional: Server Configuration
PORT=8123
LOG_LEVEL=info
```

### Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **Service Role Key** (secret) → `SUPABASE_SERVICE_KEY`
4. For `DATABASE_URL`:
   - Go to **Settings** > **Database**
   - Copy the **Connection String** (URI format)
   - Replace `[YOUR-PASSWORD]` with your database password

### Setting Up Opik (Recommended)

Opik provides LLM observability, tracing, and prompt management for Aura Chef:

1. **Create Opik Account**
   - Sign up at [comet.com](https://www.comet.com/signup?from=llm)
   - Create a new project called `commit-to-change`

2. **Get API Key**
   - Go to your Opik dashboard
   - Navigate to **Settings** > **API Keys**
   - Create a new API key and copy it to `OPIK_API_KEY`

3. **Create Prompts in Opik Dashboard**
   
   Aura Chef loads prompts from Opik for centralized management. Create the following prompts in your Opik dashboard:

   - **Prompt Name:** `AuraChef system`
     - **Content:** The main system prompt for the agent
   
   - **Prompt Name:** `AuraChef validate and format`
     - **Content:** Prompt for validating and formatting extracted recipes
   
   - **Prompt Name:** `AuraChef extract recipe name`
     - **Content:** Prompt for extracting recipe names from content

   See `agent/utils/prompts.py` for how these prompts are loaded.

4. **Configure Tracing Tags**
   
   The agent automatically logs traces with the following tags:
   - `aura-chef`
   - `recipe-extraction`
   - `agent-v5`
   - `unified-tool`

   You can customize these in `agent/agent_v5.py` in the `create_agent_with_opik()` function.

## Running the Application

### Option 1: Run Everything (Recommended)

Start both the Next.js UI and Python agent server:

```bash
pnpm dev
```

This will start:
- **UI Server** on `http://localhost:3000`
- **Agent Server** on `http://localhost:8123`

### Option 2: Run Separately

**Terminal 1 - UI Server:**
```bash
pnpm dev:ui
```

**Terminal 2 - Agent Server:**
```bash
pnpm dev:agent
```

### Option 3: Debug Mode

Run with verbose logging enabled:

```bash
pnpm dev:debug
```

### Verify Everything is Running

1. Open `http://localhost:3000` in your browser
2. You should see the Aura Chef landing page
3. Sign up or log in with Supabase Auth
4. Try extracting a recipe from a URL

## Troubleshooting

### Agent Connection Issues

**Problem:** Frontend can't connect to the agent server

**Solutions:**
1. Verify the agent is running on port 8123:
   ```bash
   curl http://localhost:8123/health
   ```
2. Check the agent logs for errors:
   ```bash
   pnpm dev:debug
   ```
3. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set correctly in `agent/.env`

### Python Import Errors

**Problem:** `ModuleNotFoundError` when starting the agent

**Solution:**
```bash
cd agent
uv sync
```

### Supabase Authentication Issues

**Problem:** Can't log in or sign up

**Solutions:**
1. Verify Supabase credentials in `agent/.env`
2. Check that Supabase Auth is enabled in your project
3. See [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md) for detailed auth setup
4. Ensure email confirmation is disabled for development (or check your email)

### Opik Integration Issues

**Problem:** Agent fails to start with Opik errors

**Solutions:**
1. If you don't want to use Opik, you can disable it by modifying `agent/server.py`:
   ```python
   # Change this line:
   agent_graph = create_agent_with_opik(base_graph)
   
   # To this:
   agent_graph = base_graph
   ```

2. If prompts are not found in Opik:
   - Create the required prompts in the Opik dashboard
   - Or modify `agent/utils/prompts.py` to use local prompts instead

3. Check Opik API key is valid:
   ```bash
   echo $OPIK_API_KEY
   ```

### Recipe Extraction Failures

**Problem:** Can't extract recipes from certain URLs

**Solutions:**
1. **Instagram/TikTok:** Ensure credentials are set in `agent/.env`
2. **YouTube:** Requires `yt-dlp` - should be installed via `uv sync`
3. **Generic websites:** Some sites block scraping - the agent will fall back to AI generation
4. Check the agent logs for specific error messages

### Database Connection Issues

**Problem:** Can't connect to Supabase database

**Solutions:**
1. Verify `DATABASE_URL` format:
   ```
   postgresql://postgres:[password]@[host]:5432/postgres
   ```
2. Check that your IP is whitelisted in Supabase (Settings > Database > Network)
3. Ensure the database is running (check Supabase dashboard)

### Build Errors

**Problem:** `pnpm build` fails

**Solutions:**
1. Clear Next.js cache:
   ```bash
   rm -rf .next
   pnpm build
   ```
2. Verify TypeScript has no errors:
   ```bash
   pnpm lint
   ```
3. Check that all environment variables are set

### Port Already in Use

**Problem:** Port 3000 or 8123 is already in use

**Solutions:**
1. Kill the process using the port:
   ```bash
   # On macOS/Linux:
   lsof -ti:3000 | xargs kill -9
   lsof -ti:8123 | xargs kill -9
   ```
2. Or change the port in the respective config files

## Deployment

### Deploy to Google Cloud Run

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

**Quick Deploy:**

1. Ensure `gcloud` CLI is installed and authenticated
2. Set environment variables in Google Cloud Console
3. Deploy both services:
   ```bash
   # Deploy agent
   cd agent
   gcloud run deploy aura-chef-agent --source . --region us-central1
   
   # Deploy UI
   cd ..
   gcloud run deploy aura-chef-ui --source . --region us-central1
   ```

### Deploy Agent to Other Platforms

The Python agent is a standard FastAPI application and can be deployed to:
- **Railway** - Connect GitHub and deploy
- **Render** - Connect repo and set environment variables
- **AWS Lambda** - Use AWS Lambda Web Adapter
- **Azure App Service** - Deploy as Python web app
- **DigitalOcean App Platform** - Connect GitHub repo

## Next Steps

After setup is complete:

1. **Read the docs:**
   - [AGENTS.md](AGENTS.md) - Learn how to modify the agent
   - [AUTHENTICATION.md](AUTHENTICATION.md) - Understand the auth flow
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy to production

2. **Explore the codebase:**
   - `src/app/` - Next.js pages and routes
   - `src/components/` - React components
   - `agent/agent_v5.py` - Main agent logic
   - `agent/tools/` - Agent tools and utilities

3. **Customize:**
   - Modify prompts in the Opik dashboard
   - Add new agent tools in `agent/tools/`
   - Customize the UI in `src/components/`

## Getting Help

- **Issues:** [GitHub Issues](your-repo-url/issues)
- **Documentation:** [Project Docs](./docs/)
- **Opik Support:** [Opik Docs](https://www.comet.com/docs/opik/)
- **CopilotKit:** [CopilotKit Docs](https://docs.copilotkit.ai)
- **LangGraph:** [LangGraph Docs](https://langchain-ai.github.io/langgraph/)

## Additional Resources

- [Supabase Setup Guide](SUPABASE_SETUP_GUIDE.md)
- [Agent Development Guide](AGENTS.md)
- [Authentication Guide](AUTHENTICATION.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Thread Persistence](docs/THREAD_PERSISTENCE_IMPLEMENTATION.md)
