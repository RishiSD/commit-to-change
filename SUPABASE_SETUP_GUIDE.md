# Supabase Setup Guide - Quick Start

This guide will walk you through setting up Supabase authentication for Aura Chef.

## ⚠️ IMPORTANT: Complete These Steps First

Before the code implementation can work, you need to complete these manual setup steps. This should take about 30-45 minutes.

---

## Step 1: Create Supabase Project (10 minutes)

### 1.1 Create Account and Project

1. Go to **https://supabase.com** and sign up/login
2. Click **"New Project"** button
3. Fill in project details:
   - **Name**: `aura-chef`
   - **Database Password**: Generate a strong password
     - Click the "Generate" button or use a password manager
     - **IMPORTANT**: Save this password securely! You'll need it for database access
   - **Region**: Choose closest to your users (e.g., `us-east-1` for East Coast USA)
   - **Pricing Plan**: Free tier is fine for development

4. Click **"Create new project"**
   - Wait ~2 minutes for provisioning (grab a coffee! ☕)

### 1.2 Save Your Credentials

Once the project is ready:

1. Go to **Settings** (gear icon in left sidebar) → **API**
2. **Copy and save these THREE values** (you'll need them in the next steps):

   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Where to save them temporarily:**
   - Create a text file named `supabase-credentials.txt` on your desktop
   - Paste all three values
   - You'll copy these into `.env` files later

---

## Step 2: Enable Email/Password Authentication (5 minutes)

1. In Supabase dashboard, go to **Authentication** (shield icon in left sidebar) → **Providers**
2. You should see **Email** provider is already enabled (green toggle)
3. Click on **Email** to expand settings
4. Configure these settings:
   - ✅ **Confirm email**: Toggle ON (require email verification)
   - ✅ **Secure email change**: Toggle ON (recommended)
   - **Mailer**: Leave as "Default Supabase mailer"
   - **Email Templates**: Leave as default (you can customize later)
5. Click **Save** at the bottom

**What this does:**
- Users must verify their email before logging in
- Verification emails are sent automatically via Supabase
- For development, emails arrive within seconds

---

## Step 3: Set Up Google OAuth (20 minutes)

This is the most involved step. Follow carefully!

### 3.1 Create Google Cloud Project

1. Go to **https://console.cloud.google.com/**
2. Sign in with your Google account
3. At the top, click the project dropdown → **"New Project"**
4. Enter project details:
   - **Project name**: `aura-chef-auth`
   - **Organization**: Leave as default (No organization)
5. Click **"Create"**
6. Wait for project creation (~30 seconds)
7. **Select your new project** from the dropdown at the top

### 3.2 Enable Required APIs

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. In the search bar, type: **"Google+ API"**
3. Click on **"Google+ API"** (or "Google Identity")
4. Click the blue **"ENABLE"** button
5. Wait for it to enable (~10 seconds)

### 3.3 Configure OAuth Consent Screen

1. In left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **User Type**:
   - Select **"External"** (allows anyone with a Google account)
   - Click **"Create"**

3. **OAuth consent screen** page - Fill in:
   - **App name**: `Aura Chef`
   - **User support email**: Select your email from dropdown
   - **App logo**: Skip (optional)
   - **App domain**: Leave blank for now
   - **Authorized domains**: Leave blank
   - **Developer contact information**: Enter your email
   - Click **"SAVE AND CONTINUE"**

4. **Scopes** page:
   - Don't add any scopes (default is fine)
   - Click **"SAVE AND CONTINUE"**

5. **Test users** page:
   - Click **"+ ADD USERS"**
   - Enter your email address (for testing)
   - Click **"Add"**
   - Click **"SAVE AND CONTINUE"**

6. **Summary** page:
   - Review your settings
   - Click **"BACK TO DASHBOARD"**

### 3.4 Get Supabase Callback URL

**Before creating OAuth credentials, you need the callback URL from Supabase:**

1. Go back to your **Supabase dashboard**
2. Navigate to **Authentication** → **Providers**
3. Scroll down to find **"Google"** provider (don't enable it yet)
4. Click on **Google** to expand it
5. **Copy the "Callback URL (for OAuth)"** - it looks like:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
6. **Save this URL** - you'll need it in the next step!

### 3.5 Create OAuth Credentials

Back in **Google Cloud Console**:

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. Fill in the form:
   - **Application type**: Select **"Web application"**
   - **Name**: `Aura Chef Web Client`
   
5. **Authorized JavaScript origins**:
   - Leave empty (not needed)
   
6. **Authorized redirect URIs**:
   - Click **"+ ADD URI"**
   - Paste the Supabase callback URL you copied earlier:
     ```
     https://xxxxx.supabase.co/auth/v1/callback
     ```
   - Click **"+ ADD URI"** again
   - Add for local testing:
     ```
     http://localhost:54321/auth/v1/callback
     ```
   
7. Click **"CREATE"** at the bottom

### 3.6 Save OAuth Credentials

A popup will appear with your credentials:

1. **Copy and save these TWO values**:
   ```
   Client ID: xxxxx.apps.googleusercontent.com
   Client Secret: GOCSPX-xxxxx
   ```
2. Add them to your `supabase-credentials.txt` file
3. Click **"OK"** to close the popup

**Don't worry if you lose them - you can always get them again from the Credentials page!**

---

## Step 4: Configure Google Provider in Supabase (3 minutes)

1. Go back to **Supabase dashboard**
2. Navigate to **Authentication** → **Providers**
3. Find **"Google"** and toggle it **ON** (enable it)
4. Click on **Google** to expand the settings
5. Paste your Google OAuth credentials:
   - **Client ID (for OAuth)**: Paste from Google Console
   - **Client Secret (for OAuth)**: Paste from Google Console
   - **Skip client verification**: Leave OFF
   - **Authorized Client IDs**: Leave empty (optional, for mobile)
6. Click **"Save"** at the bottom

---

## Step 5: Configure Redirect URLs in Supabase (3 minutes)

1. Still in Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Set these URLs:
   - **Site URL**: `http://localhost:3000` (for development)
   
3. **Redirect URLs** - Add these (click "+ Add URL" for each):
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback
   http://localhost:3000/*
   ```
   
   **For production (add later after deploying to Vercel):**
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/*
   ```

4. Click **"Save"**

---

## Step 6: Create Database Schema (5 minutes)

This creates the table to store saved recipes.

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"** button
3. **Copy and paste** this entire SQL script:

```sql
-- Create user_saved_recipes table
CREATE TABLE user_saved_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_url TEXT NOT NULL,
  recipe_name TEXT,
  recipe_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate saves
  UNIQUE(user_id, recipe_url)
);

-- Create indexes for performance
CREATE INDEX idx_user_saved_recipes_user_id ON user_saved_recipes(user_id);
CREATE INDEX idx_user_saved_recipes_created_at ON user_saved_recipes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_saved_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own recipes
CREATE POLICY "Users can read own recipes"
  ON user_saved_recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own recipes
CREATE POLICY "Users can insert own recipes"
  ON user_saved_recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own recipes
CREATE POLICY "Users can update own recipes"
  ON user_saved_recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own recipes
CREATE POLICY "Users can delete own recipes"
  ON user_saved_recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on changes
CREATE TRIGGER update_user_saved_recipes_updated_at
  BEFORE UPDATE ON user_saved_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see: **"Success. No rows returned"**
6. Verify: Go to **"Table Editor"** in left sidebar → you should see `user_saved_recipes` table

---

## Step 7: Verify Everything is Set Up

Quick checklist:

- ✅ Supabase project created and accessible
- ✅ Project URL, anon key, and service_role key saved
- ✅ Email/Password provider enabled with email confirmation ON
- ✅ Google OAuth credentials created in Google Cloud Console
- ✅ Google OAuth provider enabled in Supabase with credentials
- ✅ Redirect URLs configured in Supabase
- ✅ `user_saved_recipes` table created with RLS policies

---

## Step 8: Prepare Environment Variables

**You'll need these values for the code setup:**

Create/update these files in your project:

### Frontend: `.env.local` (in project root)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend Agent URL (keep existing or set to localhost)
AGENT_URL=http://localhost:8123
NEXT_PUBLIC_AGENT_URL=http://localhost:8123
```

### Backend: `agent/.env`

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep existing LLM API keys
OPEN_ROUTER_API_KEY=your-existing-key
TAVILY_API_KEY=your-existing-key
OPIK_API_KEY=your-existing-key
AGENT_VERSION=v5

# Remove these (no longer needed):
# JWT_SECRET=...
# REQUIRE_AUTH=...
```

---

## ✅ Setup Complete!

You're now ready for the code implementation phase!

Once you confirm these steps are complete, the automated code migration will:
1. Update backend Python code to use Supabase
2. Update frontend React code with login UI
3. Remove old JWT authentication
4. Add user menu and authentication flow
5. Update all documentation

---

## Troubleshooting

### Issue: Google OAuth redirect error
- **Check**: Google Console redirect URI exactly matches Supabase callback URL
- **Check**: No trailing slashes or typos
- **Solution**: Copy-paste the exact URL from Supabase

### Issue: Email verification emails not arriving
- **Check**: Spam folder
- **Check**: Supabase email settings in Authentication → Providers → Email
- **For development only**: You can temporarily disable email confirmation

### Issue: Cannot access Supabase dashboard
- **Check**: You're logged into the correct Supabase account
- **Check**: Project has finished provisioning (wait 2-3 minutes)

### Issue: SQL script fails
- **Check**: You're in the SQL Editor, not another page
- **Check**: Pasted the entire script (no missing lines)
- **Solution**: Try running again, or delete the table and re-run

---

## Support

If you encounter any issues during setup:
1. Check the error message carefully
2. Verify each step was completed
3. Check the Troubleshooting section above
4. Refer to [Supabase Documentation](https://supabase.com/docs)
5. Refer to [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)

---

**Ready?** Let me know when you've completed these manual steps, and I'll proceed with the code implementation!
