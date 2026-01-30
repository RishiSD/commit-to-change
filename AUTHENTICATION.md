# Authentication Guide for Aura Chef

This guide explains how Supabase authentication works in the Aura Chef application and how to set it up for development and production use.

## Overview

Aura Chef uses **Supabase Authentication** for secure, production-ready user authentication. Supabase provides:

- **Email/Password authentication** with email verification
- **OAuth providers** (Google, GitHub, etc.)
- **JWT token management** with automatic refresh
- **Row Level Security (RLS)** for database access control
- **User session management** across devices

```
Frontend (Next.js) → Supabase Auth → JWT Token → Backend (FastAPI) → LangGraph Agent
                                                                        ↓
                                                              User Context Available
```

## Architecture

### Supabase (Authentication Provider)
- Manages user accounts and credentials
- Issues JWT tokens signed with Supabase secret
- Handles OAuth flows (Google, GitHub, etc.)
- Provides auth UI components and client libraries

### Frontend (Next.js)
- **Supabase Client**: Browser-side authentication
- **Auth Hook**: `useSupabaseAuth()` for session management
- **Login Modal**: Email/Password + Google OAuth UI
- **User Menu**: Display user info and sign out
- **Token Passing**: Access token sent to backend via CopilotKit

### Backend (FastAPI)
- **Token Validation**: Validates Supabase JWT tokens
- **User Context Extraction**: Extracts user info from JWT
- **Middleware**: Injects user context into LangGraph agents
- **Protected Routes**: Optional authentication enforcement

### Database (Supabase Postgres)
- **User Saved Recipes**: Table with Row Level Security
- **RLS Policies**: Users can only access their own data
- **Auth Schema**: Managed by Supabase (auth.users table)

## Prerequisites

Before starting, you need a Supabase account and project:

1. **Create Supabase account**: Visit [supabase.com](https://supabase.com)
2. **Create project**: Name it "aura-chef" (or any name you prefer)
3. **Get credentials**: Find them in Project Settings > API

You'll need these values:
- `SUPABASE_URL`: Your project URL (e.g., `https://xyz.supabase.co`)
- `SUPABASE_ANON_KEY`: Anonymous/public key (safe for frontend)
- `SUPABASE_SERVICE_KEY`: Service role key (backend only, keep secret!)

## Setup Guide

For detailed step-by-step setup instructions, see **[SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)**.

The setup guide covers:
1. Creating a Supabase project
2. Configuring Email/Password authentication
3. Setting up Google OAuth
4. Creating the database schema with RLS policies
5. Configuring environment variables

## Development Setup

### 1. Backend Configuration

Create `agent/.env` with your Supabase credentials:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# LLM API Keys
OPEN_ROUTER_API_KEY=your-open-router-api-key-here
TAVILY_API_KEY=your-tavily-api-key-here  # Optional
OPIK_API_KEY=your-opik-api-key-here      # Optional

# Agent Configuration
AGENT_VERSION=1.0.0
```

**Important**: Use `.env.example` as a template. Never commit `.env` to version control!

### 2. Install Backend Dependencies

```bash
cd agent
uv sync
```

This installs:
- `supabase>=2.0.0` - Python client for Supabase
- `gotrue>=2.0.0` - Authentication library
- All other agent dependencies

### 3. Frontend Configuration

Create `.env.local` in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend Agent URL
AGENT_URL=http://localhost:8123
NEXT_PUBLIC_AGENT_URL=http://localhost:8123
```

**Note**: `NEXT_PUBLIC_*` variables are exposed to the browser. Use the **anon key** (not service key!) for frontend.

### 4. Start the Application

```bash
# Terminal 1: Start backend
cd agent
python server.py

# Terminal 2: Start frontend
pnpm dev
```

Visit `http://localhost:3000` - you'll see the login modal.

## Authentication Endpoints

The backend provides these authentication-related endpoints:

### GET /auth/me
Get current authenticated user information.

**Request:**
```bash
curl -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  http://localhost:8123/auth/me
```

**Response:**
```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_role": "authenticated",
  "user_email": "user@example.com",
  "user_name": "John Doe",
  "authenticated": true
}
```

**Response (Unauthenticated):**
```json
{
  "user_id": "anonymous",
  "user_role": null,
  "user_email": null,
  "user_name": null,
  "authenticated": false
}
```

### GET /health
Health check endpoint.

**Request:**
```bash
curl http://localhost:8123/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "aura-chef-agent",
  "version": "1.0.0",
  "agent": "sample_agent",
  "agent_version": "v5"
}
```

## User Authentication Flow

### Email/Password Sign Up

1. User opens app → `LoginModal` appears (cannot be dismissed)
2. User enters email and password → clicks "Sign Up"
3. Supabase creates account → sends verification email
4. User clicks verification link in email
5. User returns to app → logs in with verified credentials
6. `useSupabaseAuth()` hook detects session → `LoginModal` disappears
7. `UserMenu` appears in top-right corner
8. Access token passed to backend via CopilotKit

### Google OAuth Sign In

1. User opens app → `LoginModal` appears
2. User clicks "Continue with Google"
3. Redirected to Google consent screen
4. User authorizes → redirected back to app
5. `useSupabaseAuth()` hook detects session → `LoginModal` disappears
6. `UserMenu` appears with Google profile info
7. Access token passed to backend via CopilotKit

### Session Management

- **Auto-refresh**: Supabase automatically refreshes tokens before expiry
- **Persistence**: Sessions stored in browser localStorage (key: `aura-chef-auth-token`)
- **Multi-tab sync**: Auth state syncs across browser tabs
- **Sign out**: Clears session from Supabase and localStorage

## Accessing User Context in Agents

Your LangGraph agents can access authenticated user information through the config object:

```python
# agent/main.py or any agent node
from langgraph.types import RunnableConfig

async def my_agent_node(state: AgentState, config: RunnableConfig):
    # Extract user context from config (injected by middleware)
    user_id = config["configurable"].get("user_id", "anonymous")
    user_email = config["configurable"].get("user_email")
    user_role = config["configurable"].get("user_role")
    user_metadata = config["configurable"].get("user_metadata", {})
    authenticated = config["configurable"].get("authenticated", False)
    
    # Use user context in your agent logic
    if authenticated:
        print(f"Processing request for user: {user_email} (ID: {user_id})")
        
        # Example: Personalized responses
        if user_metadata.get("preferences", {}).get("dietary") == "vegan":
            # Suggest vegan recipes
            pass
    else:
        print("Processing anonymous request")
    
    return state
```

### Available User Context Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | str | Supabase user UUID | `"123e4567-..."` |
| `user_email` | str \| None | User's email | `"user@example.com"` |
| `user_role` | str \| None | Supabase role | `"authenticated"` |
| `user_metadata` | dict | User metadata | `{"full_name": "John"}` |
| `authenticated` | bool | Auth status | `True` or `False` |

## Database Access with Row Level Security

### User Saved Recipes Table

The `user_saved_recipes` table uses Row Level Security to ensure users can only access their own data:

```sql
-- Table structure
CREATE TABLE user_saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_url TEXT NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_url)
);

-- RLS Policies
ALTER TABLE user_saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipes"
  ON user_saved_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON user_saved_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON user_saved_recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON user_saved_recipes FOR DELETE
  USING (auth.uid() = user_id);
```

### Using the Saved Recipes Service (Frontend)

```typescript
import { saveRecipe, getSavedRecipes, deleteRecipe } from "@/lib/supabase/savedRecipes";

// Save a recipe
await saveRecipe({
  recipe_url: "https://example.com/recipe/123",
  recipe_name: "Chocolate Chip Cookies",
  recipe_content: { ingredients: [...], steps: [...] }
});

// Get all saved recipes
const recipes = await getSavedRecipes();

// Delete a recipe
await deleteRecipe(recipeId);
```

**Note**: The service functions are placeholder stubs. Implement them by following the TODO comments in `src/lib/supabase/savedRecipes.ts`.

## Backend Token Validation

The backend validates Supabase JWT tokens using two methods:

### Method 1: JWT Decode (Basic, Faster)

```python
from agent.supabase_auth import validate_supabase_token

# Basic validation - decodes JWT without signature verification
user_info = validate_supabase_token(access_token)
print(user_info.user_id, user_info.email)
```

**Pros**: Fast, no API call
**Cons**: Doesn't verify token hasn't been revoked

### Method 2: Supabase API Validation (Secure, Recommended)

```python
from agent.supabase_auth import validate_supabase_token_with_api

# Validates token with Supabase API - checks signature and revocation
user_info = await validate_supabase_token_with_api(access_token)
print(user_info.user_id, user_info.email)
```

**Pros**: Secure, verifies token is still valid
**Cons**: Requires API call (slightly slower)

**Current Implementation**: The backend uses **Method 2** (API validation) by default in `server.py`.

## Environment Variables Reference

### Frontend (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
AGENT_URL=http://localhost:8123
NEXT_PUBLIC_AGENT_URL=http://localhost:8123
```

### Backend (agent/.env)

```bash
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPEN_ROUTER_API_KEY=sk-or-v1-...
TAVILY_API_KEY=tvly-...  # Optional
OPIK_API_KEY=...          # Optional
AGENT_VERSION=1.0.0
```

**Security Note**: Never expose `SUPABASE_SERVICE_KEY` to the frontend or commit it to git!

## Security Best Practices

### 1. Environment Variable Security

```bash
# ✅ DO: Use anon key for frontend
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...

# ❌ DON'T: Never expose service key to frontend
# NEXT_PUBLIC_SUPABASE_SERVICE_KEY=... # NEVER DO THIS!

# ✅ DO: Use service key only in backend
# agent/.env
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1...
```

### 2. Row Level Security

Always enable RLS on tables with user data:

```sql
-- Enable RLS
ALTER TABLE user_saved_recipes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (auth.uid() = user_id);
```

### 3. Email Verification

**Recommendation**: Require email verification for email/password signups.

In Supabase Dashboard → Authentication → Providers → Email:
- ✅ Enable "Confirm email"
- ✅ Set email templates with your branding
- ❌ Disable "Allow unverified email sign-ins" for production

### 4. OAuth Configuration

For Google OAuth in production:
1. Use your own Google Cloud Project (not Supabase's)
2. Configure authorized redirect URIs for your domain
3. Set up OAuth consent screen with privacy policy
4. Request only necessary scopes (email, profile)

### 5. Token Storage

The frontend stores tokens in localStorage with key `aura-chef-auth-token`.

**Considerations**:
- ✅ Tokens are httpOnly in Supabase cookies (secure)
- ✅ Automatic refresh prevents expiration
- ⚠️ XSS attacks can access localStorage
- 💡 Consider using Supabase SSR for server-side auth

### 6. CORS Configuration

```python
# agent/server.py
allowed_origins = [
    "https://your-production-domain.vercel.app",
    "http://localhost:3000",  # Development only
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 7. Rate Limiting

Consider adding rate limiting to prevent abuse:

```python
# Install: pip install slowapi
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/endpoint")
@limiter.limit("10/minute")
async def endpoint(request: Request):
    # ... your logic
```

## Production Deployment

### 1. Deploy Backend (Google Cloud Run)

```bash
# Set environment variables
gcloud run services update aura-chef-agent \
  --set-env-vars "SUPABASE_URL=https://xyz.supabase.co" \
  --set-env-vars "SUPABASE_SERVICE_KEY=your-service-key" \
  --set-env-vars "OPEN_ROUTER_API_KEY=your-api-key"

# Deploy
gcloud run deploy aura-chef-agent --source ./agent
```

### 2. Deploy Frontend (Vercel)

```bash
# Set environment variables in Vercel dashboard or CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add AGENT_URL production
vercel env add NEXT_PUBLIC_AGENT_URL production

# Deploy
vercel --prod
```

### 3. Update Supabase Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://your-app.vercel.app
```

**Redirect URLs (allow list):**
```
http://localhost:3000/**
https://your-app.vercel.app/**
```

### 4. Update Google OAuth

In Google Cloud Console → OAuth 2.0 Client:

**Authorized redirect URIs:**
```
https://your-project.supabase.co/auth/v1/callback
https://your-app.vercel.app
```

### 5. Test Production Flow

1. Visit your production URL
2. Sign up with email/password or Google
3. Verify email (if email/password)
4. Test authentication with backend
5. Verify RLS policies work correctly

## Troubleshooting

### Issue: "Invalid token" error

**Causes**:
- Token expired (tokens last 1 hour by default)
- Token from different Supabase project
- Backend using wrong Supabase URL/keys

**Solutions**:
```bash
# Check environment variables match
echo $SUPABASE_URL  # Frontend
cat agent/.env | grep SUPABASE_URL  # Backend

# Sign out and sign in again to get fresh token
```

### Issue: Login modal won't close

**Causes**:
- `useSupabaseAuth()` not detecting session
- Session not persisting to localStorage
- Browser blocking localStorage (private mode)

**Solutions**:
```typescript
// Check browser console for errors
// Verify session is set
console.log(supabase.auth.getSession());

// Check localStorage
console.log(localStorage.getItem('aura-chef-auth-token'));
```

### Issue: User can't sign up

**Causes**:
- Email provider not enabled in Supabase
- Email confirmation required but email not sent
- Rate limit reached on email sends

**Solutions**:
1. Check Supabase Dashboard → Authentication → Providers
2. Verify email provider is enabled
3. Check email templates are configured
4. Check Supabase logs for errors

### Issue: OAuth redirect fails

**Causes**:
- Redirect URL not in Supabase allowlist
- OAuth provider not configured correctly
- OAuth consent screen not published

**Solutions**:
1. Add redirect URL to Supabase → Authentication → URL Configuration
2. Verify OAuth client ID/secret in Supabase
3. Check Google Cloud Console OAuth consent screen status

### Issue: RLS policies blocking access

**Causes**:
- Policy using wrong user_id check
- RLS enabled but no policies created
- Service role key not bypassing RLS

**Solutions**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- List policies
SELECT * FROM pg_policies WHERE tablename = 'user_saved_recipes';

-- Disable RLS temporarily for debugging (NOT for production!)
ALTER TABLE user_saved_recipes DISABLE ROW LEVEL SECURITY;
```

### Issue: Agent not receiving user context

**Causes**:
- Middleware not extracting user context
- Config not passed to agent nodes
- Token not sent from frontend

**Solutions**:
```python
# Add logging to middleware
@app.middleware("http")
async def add_auth_context_middleware(request: Request, call_next):
    auth_header = request.headers.get("authorization")
    print(f"Auth header: {auth_header}")  # Debug
    
    user_context = get_user_context_for_copilotkit(auth_header)
    print(f"User context: {user_context}")  # Debug
    
    request.state.user_context = user_context
    return await call_next(request)
```

## Testing Authentication

### Manual Testing

1. **Sign up with email/password**
   ```
   - Open app
   - Enter email + password
   - Click "Sign Up"
   - Check email for verification link
   - Click link → verify account
   - Sign in with credentials
   ```

2. **Sign in with Google**
   ```
   - Open app
   - Click "Continue with Google"
   - Select Google account
   - Authorize app
   - Should redirect back signed in
   ```

3. **Test session persistence**
   ```
   - Sign in
   - Refresh page → should stay signed in
   - Close tab and reopen → should stay signed in
   - Sign out → should show login modal
   ```

4. **Test backend authentication**
   ```bash
   # Get session token
   # Open browser console
   const { data } = await supabase.auth.getSession()
   console.log(data.session.access_token)
   
   # Test with curl
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8123/auth/me
   ```

### Automated Testing (Future)

Consider adding tests for:
- Sign up flow (email/password)
- Sign in flow (email/password, Google OAuth)
- Session persistence across page reload
- Token refresh on expiry
- Sign out and session cleanup
- RLS policy enforcement
- Backend token validation

## Example Integration Patterns

### Pattern 1: User-specific Recipe Recommendations

```python
from langgraph.types import RunnableConfig

async def recommend_recipes(state: AgentState, config: RunnableConfig):
    user_id = config["configurable"].get("user_id", "anonymous")
    user_metadata = config["configurable"].get("user_metadata", {})
    
    # Get user preferences
    dietary = user_metadata.get("preferences", {}).get("dietary")
    cuisine = user_metadata.get("preferences", {}).get("cuisine")
    
    # Fetch personalized recommendations
    if user_id != "anonymous":
        saved_recipes = await db.get_saved_recipes(user_id)
        recommendations = await ai.recommend_similar(saved_recipes, dietary, cuisine)
    else:
        recommendations = await ai.recommend_popular(dietary, cuisine)
    
    return {"recommendations": recommendations}
```

### Pattern 2: Role-based Feature Access

```python
async def premium_feature(state: AgentState, config: RunnableConfig):
    user_role = config["configurable"].get("user_role")
    user_metadata = config["configurable"].get("user_metadata", {})
    
    subscription = user_metadata.get("subscription", "free")
    
    if subscription != "premium":
        return {
            "error": "This feature requires a premium subscription",
            "upgrade_url": "https://your-app.com/upgrade"
        }
    
    # Premium feature logic
    return {"result": "Premium content"}
```

### Pattern 3: Usage Tracking and Limits

```python
async def track_recipe_extraction(state: AgentState, config: RunnableConfig):
    user_id = config["configurable"].get("user_id", "anonymous")
    authenticated = config["configurable"].get("authenticated", False)
    
    if not authenticated:
        # Anonymous users: 5 extractions per day
        usage = await redis.get(f"usage:anon:{request.client.host}")
        if usage and int(usage) >= 5:
            return {"error": "Daily limit reached. Sign in for unlimited access."}
        await redis.incr(f"usage:anon:{request.client.host}")
    else:
        # Authenticated users: unlimited
        await db.track_usage(user_id, action="recipe_extraction")
    
    # Proceed with extraction
    return state
```

## Migration from JWT to Supabase

If you're migrating from the old JWT authentication system:

### What Changed

1. **Authentication provider**: JWT → Supabase
2. **Token generation**: Backend `/auth/token` → Supabase
3. **User storage**: In-memory → Supabase auth.users table
4. **Token validation**: Custom JWT → Supabase JWT
5. **Frontend**: `useAuth()` → `useSupabaseAuth()`
6. **UI**: Auto-demo-token → Login modal + User menu

### Migration Steps

1. ✅ Backend: Installed Supabase dependencies
2. ✅ Backend: Created `supabase_auth.py` module
3. ✅ Backend: Updated `server.py` middleware
4. ✅ Backend: Deleted old `auth.py` module
5. ✅ Frontend: Installed Supabase packages
6. ✅ Frontend: Created Supabase clients and hooks
7. ✅ Frontend: Created login/user UI components
8. ✅ Frontend: Updated `layout.tsx`
9. ✅ Frontend: Deleted old `useAuth.ts` hook
10. ⏳ Manual: Complete Supabase setup (see SUPABASE_SETUP_GUIDE.md)
11. ⏳ Testing: Verify end-to-end authentication flow

### Breaking Changes

- **No backwards compatibility**: Old JWT tokens won't work
- **No demo tokens**: Users must create accounts
- **Email verification**: Required for email/password signup
- **Environment variables**: Different variable names

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
- [CopilotKit Authentication](https://docs.copilotkit.ai/langgraph/auth)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)
3. Check Supabase Dashboard → Logs for auth errors
4. Review browser console for frontend errors
5. Check backend logs: `python agent/server.py` output
6. Review network requests in browser DevTools
7. Visit [Supabase Discord](https://discord.supabase.com) for community help
