# 🍳 Aura Chef

**Your AI Cooking Companion - Extract recipes from anywhere. Cook with confidence.**

[![Built with Opik](https://img.shields.io/badge/Built%20with-Opik-blue)](https://www.comet.com/site/products/opik/) [![LangGraph](https://img.shields.io/badge/Powered%20by-LangGraph-green)](https://langchain-ai.github.io/langgraph/) [![CopilotKit](https://img.shields.io/badge/UI%20with-CopilotKit-purple)](https://copilotkit.ai)

> **Built for the Commit to Change Hackathon** - Demonstrating advanced LLM observability, agent workflows, and conversational AI for recipe extraction and enhancement.

**[Live Demo](https://aura-chef.vercel.app/)**

**[Recorded Demo](https://www.youtube.com/watch?v=jUb8gWpr6yo)**

---

## 🎯 The Problem

Recipes are everywhere (Instagram, TikTok, blogs), but:
- Extraction is painful (videos, broken links, copy-paste fails)
- Formats are inconsistent (missing measurements, vague steps)
- Organization is chaos (lost bookmarks and screenshots)

**Result:** You find great recipes but can't cook from them.

**Why this matters in real life:** People trying to cook healthier, stick to budgets, or build sustainable routines often lose momentum when recipes are scattered, incomplete, or hard to follow.

---

## ✨ The Solution

**Aura Chef** transforms any recipe source into structured cooking guides with AI.

**🌐 Extract from Anywhere (Functionality):** Works with Instagram, TikTok, YouTube, recipe sites, and blogs. Automatically follows embedded links.

**🤖 AI Enhancement (Use of LLMs/Agents):** LangGraph agent chains extraction, validation, and formatting tools to turn messy inputs into structured recipes, plus conversational help like asking Aura to make the recipe healthier or even replace some ingredients.

**📚 Organized Library (Real-world relevance):** Save, search, and filter recipes so users can actually cook, repeat, and refine what works.

**📊 Evaluation & Observability:** End-to-end Opik tracing, prompt versioning, and tool-level spans make agent behavior measurable and debuggable.

**🎯 Goal Alignment:** Supports wellness goals by reducing friction to cook at home, encouraging consistent meal habits and mindful planning.

---

## 🎬 How It Works

**1. Share:** Paste any URL or ask for a recipe  
**2. AI Processing:** LangGraph agent extracts and structures content (traced with Opik)  
**3. Recipe Card:** Generative UI renders formatted recipe, save to library, chat for help

---

## 🧠 Built with Opik: LLM Observability & Optimization

Aura Chef showcases **Opik's powerful LLM evaluation and observability platform** throughout its entire agent workflow.

### Opik Integration Features

#### 📊 **Complete LLM Tracing**
- **Every agent execution** is logged with detailed traces and spans
- Track LLM calls, tool invocations, and state transitions in real-time
- Visualize the complete agent workflow with xray graphs
- Debug issues by drilling into individual traces
- Track conversational threads made up of multiple traces

```python
# Agent automatically wrapped with Opik tracing
opik_tracer = OpikTracer(
    tags=["aura-chef", "recipe-extraction", "agent-v5"],
    project_name="commit-to-change",
    graph=agent.get_graph(xray=True)
)
tracked_agent = track_langgraph(agent, opik_tracer)
```

#### 🎯 **Centralized Prompt Management**
- All agent prompts stored and versioned in Opik dashboard
- No hardcoded prompts - update without code changes
- A/B test different prompt strategies
- Track prompt performance across versions

```python
# Prompts loaded from Opik at runtime
SYSTEM_PROMPT = get_prompt('AuraChef system')
VALIDATE_AND_FORMAT_PROMPT = get_prompt('AuraChef validate and format')
```


### What Opik helped during development of the Project ?
- Eval based development, using online evals was a time saver and gave realtime feedback to agent and prompt optimisations making issues easier to debug.
  <img width="1386" height="531" alt="Screenshot 2026-02-09 at 00 11 01" src="https://github.com/user-attachments/assets/031235f9-82b6-4ad9-8875-3bae82cfd97f" />

- Thred based eval for complete conversational relevance.
  <img width="1381" height="502" alt="Screenshot 2026-02-09 at 00 12 46" src="https://github.com/user-attachments/assets/343841e9-80ed-4427-a7ea-f638cba8b3fb" />

- Prompt management helped tracked prompt version which could be used in experiments with prompt optimisations.
  <img width="1355" height="317" alt="Screenshot 2026-02-09 at 00 13 14" src="https://github.com/user-attachments/assets/249c9bb7-a713-4480-8e5c-d7016f9e9f40" />

- Experiments

  - Offline evals for tool adherence and tool schema validations
  <img width="1385" height="618" alt="Screenshot 2026-02-09 at 10 15 08" src="https://github.com/user-attachments/assets/080819eb-6592-4fa8-8bda-cbec642e347d" />

  - Agent trajectory evals for validating the order of tool selection and executions
  <img width="1382" height="601" alt="Screenshot 2026-02-09 at 10 33 59" src="https://github.com/user-attachments/assets/67e3e767-af48-4cf1-b57b-f8b996aed3c9" />

- Reducing the token usage by optimizing the system prompt using Opiks 'Improve prompt' feature.
- LLM Gateway to centralize inference API access.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with server components
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Modern styling
- **CopilotKit 1.51** - Generative UI & conversational interface

### Backend
- **Python 3.12** - Modern Python with type hints
- **LangGraph** - Advanced agent workflows and state management
- **FastAPI** - High-performance async API server
- **OpenRouter** - Access to multiple LLM providers

### Database & Auth
- **Supabase** - PostgreSQL database with Row Level Security
- **Supabase Auth** - JWT-based authentication
- **LangGraph Checkpointer** - Persistent thread state

### Observability & Monitoring
- **Opik** - LLM tracing, prompt management, and evaluation
- **OpikTracer** - LangGraph integration for automatic tracing
- **Rich logging** - Detailed console output for debugging

### Extraction & Processing
- **BeautifulSoup4** - HTML parsing
- **Instaloader** - Instagram extraction
- **yt-dlp** - YouTube video processing
- **Requests** - HTTP client for web scraping

---

## 🚀 Quick Start

### 📁 Project Structure

```
aura-chef/
├── src/
│   ├── app/                 # Next.js pages & API routes
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks (auth, threads)
│   └── lib/                 # Types, Supabase clients
├── agent/                   # Python LangGraph agent
│   ├── server.py           # FastAPI server entry
│   ├── agent_v5.py         # Main agent graph
│   ├── tools/              # LangGraph tools
│   ├── utils/              # Python utilities
│   └── eval_scripts/       # Opik evaluation scripts
└── public/                  # Static assets
```

### 🛠️ Development Commands

```bash
# Install dependencies
pnpm install

# Start both UI and agent (recommended)
pnpm dev

# Or run separately:
pnpm dev:ui               # Next.js only (port 3000)
pnpm dev:agent            # Agent only (port 8123)

# Production build
pnpm build
pnpm start

# Code quality
pnpm lint
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │  ← User Interface
│   (Port 3000)   │
└────────┬────────┘
         │
         │ CopilotKit WebSocket
         │
┌────────▼────────┐
│  FastAPI Server │  ← Agent Runtime
│   (Port 8123)   │
└────────┬────────┘
         │
         │ LangGraph Execution
         │
┌────────▼────────┐
│  LangGraph      │  ← Agent Logic
│  Agent (V5)     │
└────┬───┬───┬────┘
     │   │   │
     │   │   └──────► External APIs
     │   │              (Instagram, YouTube, etc.)
     │   │
     │   └──────────► LLMs via OpenRouter
     │                 (GPT-4, Claude, etc.)
     │
     └──────────────► Opik Platform
                       (Tracing & Observability)

┌─────────────────┐
│   Supabase      │  ← Database & Auth
│   - PostgreSQL  │
│   - Auth/JWT    │
│   - Checkpoints │
└─────────────────┘
```
---

## 🌟 What Makes Aura Chef Special?

### Unique Combination
**No other tool does all four:**
- ✅ Multi-platform extraction (social + traditional sites)
- ✅ AI enhancement (partial → complete recipes)
- ✅ Conversational interface (ask questions, get help)
- ✅ Organized library (search, filter, persist)

---

## 🎓 Learning Resources

Built with cutting-edge technologies? Learn more:

- **Opik Documentation** - [comet.com/docs/opik](https://www.comet.com/docs/opik/)
- **LangGraph Tutorials** - [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph/)
- **CopilotKit Guides** - [docs.copilotkit.ai](https://docs.copilotkit.ai)
- **Next.js 16** - [nextjs.org/docs](https://nextjs.org/docs)

---

## 🔮 Future Roadmap

### Planned Features
- 📅 **Meal planning** - Multi-recipe planning and shopping lists
- 🥗 **Nutrition info** - Automatic nutritional analysis
- 🍽️ **Dietary restrictions** - Filter by vegan, gluten-free, etc.
- 📱 **Mobile app** - Native iOS/Android for kitchen use
- 👥 **Community sharing** - Share recipes with friends
- 🎨 **Recipe images** - AI-generated images for recipes without photos

### Opik Enhancements
- 🎯 **Automated optimization** - Use Opik's agent optimization features
- 🔔 **Alerting** - Notifications for extraction failures or quality degradation

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

Special thanks to:
- **Comet ML** for building Opik
- **CopilotKit** for the amazing generative UI framework
- **LangChain** for LangGraph and agent tools
- **Supabase** for the excellent backend platform

---

## 📬 Questions or Feedback?

- **Issues:** [GitHub Issues](your-repo-url/issues)
- **Demo:** [Live Demo Link](#)
- **Opik:** [Get Started with Opik](https://www.comet.com/signup?from=llm)

---

**Made with ❤️ and AI for the Commit to Change Hackathon**

*From scattered social media posts to organized recipe collections - let's cook together!* 🍳✨
