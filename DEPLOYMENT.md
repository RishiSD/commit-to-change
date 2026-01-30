# Deployment Guide: Aura Chef to Google Cloud Run + Vercel

This guide walks you through deploying the Aura Chef application with:
- **Backend (FastAPI + LangGraph)** → Google Cloud Run
- **Frontend (Next.js)** → Vercel

## Prerequisites

- [x] Google Cloud account with billing enabled
- [x] Vercel account
- [x] gcloud CLI installed
- [x] Vercel CLI installed (`npm i -g vercel`)
- [x] API Keys ready: OPEN_ROUTER_API_KEY, TAVILY_API_KEY, OPIK_API_KEY

## Part 1: Deploy Backend to Google Cloud Run

### Step 1: Setup Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project (replace with your project ID)
gcloud config set project aura-chef-prod

# Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Set default region
gcloud config set run/region us-central1
```

### Step 2: Deploy FastAPI Backend

```bash
# Navigate to agent directory
cd agent

# Deploy to Cloud Run (this will build and deploy automatically)
gcloud run deploy aura-chef-agent \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "AGENT_VERSION=v5" \
  --set-env-vars "OPEN_ROUTER_API_KEY=YOUR_OPEN_ROUTER_KEY_HERE" \
  --set-env-vars "TAVILY_API_KEY=YOUR_TAVILY_KEY_HERE" \
  --set-env-vars "OPIK_API_KEY=YOUR_OPIK_KEY_HERE" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --max-instances 10 \
  --min-instances 0

# ⚠️ IMPORTANT: Copy the Service URL from the output!
# Example: https://aura-chef-agent-xxxxx-uc.a.run.app
```

**What this does:**
- Automatically detects Python and builds a container
- Installs dependencies from requirements.txt
- Deploys to Cloud Run with proper configuration
- Gives you a public HTTPS URL

### Step 3: Test the Backend

```bash
# Replace with your actual Cloud Run URL
export BACKEND_URL="https://aura-chef-agent-xxxxx-uc.a.run.app"

# Test health endpoint
curl $BACKEND_URL/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "aura-chef-agent",
#   "version": "1.0.0",
#   "agent": "sample_agent",
#   "agent_version": "v5"
# }
```

### Step 4: Update CORS After Frontend Deployment

After deploying to Vercel (Part 2), come back and update CORS:

```bash
# Get your Vercel domain, then run:
gcloud run services update aura-chef-agent \
  --region us-central1 \
  --set-env-vars "ALLOWED_ORIGINS=https://YOUR-APP.vercel.app,https://YOUR-APP-*.vercel.app,http://localhost:3000"
```

## Part 2: Deploy Frontend to Vercel

### Step 1: Login to Vercel

```bash
# From project root directory (not agent/)
cd ..

# Login to Vercel
vercel login
```

### Step 2: Set Environment Variables

Before deploying, set the backend URL:

```bash
# Set AGENT_URL for all environments
vercel env add AGENT_URL

# When prompted:
# - What's the value of AGENT_URL? → Enter your Cloud Run URL
# - Add to Production? → Yes
# - Add to Preview? → Yes  
# - Add to Development? → Yes

# Example: https://aura-chef-agent-xxxxx-uc.a.run.app
```

### Step 3: Deploy to Vercel

```bash
# Initial deployment (preview)
vercel

# Follow the prompts:
# ? Set up and deploy "~/proj/opik/aura-chef"? [Y/n] → Y
# ? Which scope do you want to deploy to? → Select your account
# ? Link to existing project? [y/N] → N
# ? What's your project's name? → aura-chef
# ? In which directory is your code located? → ./
# ? Want to override the settings? [y/N] → N

# Vercel will:
# 1. Build your Next.js app
# 2. Deploy to a preview URL
# 3. Give you a URL to test

# After testing preview, deploy to production
vercel --prod
```

### Step 4: Update Backend CORS (Do this now!)

```bash
# Copy your Vercel production domain (e.g., aura-chef.vercel.app)
# Then update backend CORS:

cd agent
gcloud run services update aura-chef-agent \
  --region us-central1 \
  --set-env-vars "ALLOWED_ORIGINS=https://aura-chef.vercel.app,https://aura-chef-*.vercel.app,http://localhost:3000"
```

## Part 3: Verification & Testing

### Test Full Stack

1. **Visit your Vercel URL**: https://YOUR-APP.vercel.app
2. **Open the CopilotKit chat interface**
3. **Send a test message**: "Extract a recipe from https://example.com"
4. **Verify the response works**

### Check Logs

**Cloud Run Logs:**
```bash
# View recent logs
gcloud run logs read aura-chef-agent --region us-central1 --limit 50

# Stream logs in real-time
gcloud run logs tail aura-chef-agent --region us-central1

# Filter errors only
gcloud run logs read aura-chef-agent --region us-central1 --filter="severity>=ERROR"
```

**Vercel Logs:**
- Visit: https://vercel.com/dashboard
- Select your project → Logs tab

## Part 4: Local Development Setup

After deployment, update your local .env for development:

```bash
# Create/update .env.local in project root
cat > .env.local << EOF
AGENT_URL=http://localhost:8123
EOF

# For local development, run:
npm run dev        # Runs both frontend and agent locally
# OR
npm run dev:ui     # Frontend only (connects to deployed backend)
npm run dev:agent  # Agent only
```

## Useful Commands Reference

### Cloud Run Commands

```bash
# View service details
gcloud run services describe aura-chef-agent --region us-central1

# Update environment variables
gcloud run services update aura-chef-agent \
  --region us-central1 \
  --set-env-vars "KEY=VALUE"

# View revisions
gcloud run revisions list --service aura-chef-agent --region us-central1

# Delete service
gcloud run services delete aura-chef-agent --region us-central1
```

### Vercel Commands

```bash
# View deployments
vercel ls

# View environment variables
vercel env ls

# Add/update environment variable
vercel env add VARIABLE_NAME
vercel env rm VARIABLE_NAME

# Promote a deployment to production
vercel promote DEPLOYMENT_URL

# Rollback to previous deployment
vercel rollback
```

## Troubleshooting

### Issue: CORS errors in browser console

**Solution:**
```bash
# Make sure backend CORS includes your Vercel domain
gcloud run services update aura-chef-agent \
  --region us-central1 \
  --set-env-vars "ALLOWED_ORIGINS=https://YOUR-APP.vercel.app,https://YOUR-APP-*.vercel.app,http://localhost:3000"
```

### Issue: Frontend can't connect to backend

**Check:**
1. Verify AGENT_URL is set in Vercel: `vercel env ls`
2. Test backend directly: `curl https://YOUR-BACKEND-URL/health`
3. Check Vercel logs for connection errors
4. Verify Cloud Run allows unauthenticated access

### Issue: Build fails on Cloud Run

**Check:**
1. Ensure requirements.txt exists in agent/ directory
2. Verify Python version compatibility (3.12)
3. Check build logs: `gcloud builds list --limit 5`

### Issue: Environment variables not working

**Cloud Run:**
```bash
# View current env vars
gcloud run services describe aura-chef-agent \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

**Vercel:**
```bash
# List env vars
vercel env ls

# Pull env vars to local
vercel env pull
```

### Issue: Cold starts are slow

**Solution:** Set minimum instances (increases cost)
```bash
gcloud run services update aura-chef-agent \
  --region us-central1 \
  --min-instances 1
```

## Cost Monitoring

### Google Cloud Run
```bash
# View estimated costs
gcloud beta run services describe aura-chef-agent \
  --region us-central1 \
  --format="value(metadata.labels)"
```

Visit: https://console.cloud.google.com/billing

### Vercel
Visit: https://vercel.com/dashboard → Usage

## Security Best Practices

1. **Never commit API keys**: Use environment variables only
2. **Restrict CORS**: Update ALLOWED_ORIGINS after deployment
3. **Monitor usage**: Set up billing alerts in Google Cloud
4. **Rate limiting**: Consider adding rate limiting to your API
5. **Authentication**: Add user authentication if needed

## Updating the Application

### Update Backend:
```bash
cd agent
# Make your changes, then redeploy:
gcloud run deploy aura-chef-agent --source . --region us-central1
```

### Update Frontend:
```bash
# From project root
vercel --prod
```

## Quick Deploy Script

Create a deploy script for faster updates:

```bash
# deploy.sh
#!/bin/bash

echo "🚀 Deploying Aura Chef..."

# Deploy backend
echo "📦 Deploying backend to Cloud Run..."
cd agent
gcloud run deploy aura-chef-agent \
  --source . \
  --region us-central1 \
  --quiet

if [ $? -eq 0 ]; then
    echo "✅ Backend deployed successfully"
else
    echo "❌ Backend deployment failed"
    exit 1
fi

# Deploy frontend
echo "📦 Deploying frontend to Vercel..."
cd ..
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo "✅ Frontend deployed successfully"
    echo "🎉 Deployment complete!"
else
    echo "❌ Frontend deployment failed"
    exit 1
fi
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Monitoring & Alerts

### Set up Cloud Run alerts:
```bash
# Create alert for high error rate
# Visit: https://console.cloud.google.com/monitoring/alerting
```

### Vercel alerts:
- Visit: https://vercel.com/dashboard → Settings → Notifications

## Next Steps

1. **Custom Domain**: Add your domain in Vercel settings
2. **SSL Certificate**: Automatic with Vercel
3. **CDN**: Automatic with Vercel
4. **Database**: Add if needed (Supabase, Firebase, etc.)
5. **Authentication**: Add user auth (Clerk, Auth0, etc.)
6. **Analytics**: Add monitoring (PostHog, Mixpanel, etc.)

## Support & Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [CopilotKit Documentation](https://docs.copilotkit.ai/)

## Summary Checklist

Backend (Cloud Run):
- [x] Created requirements.txt
- [x] Updated CORS configuration
- [ ] Deployed to Cloud Run
- [ ] Tested health endpoint
- [ ] Set environment variables
- [ ] Updated CORS with Vercel domain

Frontend (Vercel):
- [x] Created vercel.json
- [x] Updated copilotkit route.ts
- [ ] Set AGENT_URL environment variable
- [ ] Deployed to Vercel
- [ ] Tested full application

## Deployment Complete! 🎉

Your application is now live at:
- Backend: https://aura-chef-agent-xxxxx-uc.a.run.app
- Frontend: https://YOUR-APP.vercel.app

Enjoy your deployed application!
