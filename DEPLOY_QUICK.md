# Quick Deployment Commands

## 🚀 Deploy Backend to Google Cloud Run

```bash
cd agent

gcloud run deploy aura-chef-agent \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "AGENT_VERSION=v5,OPEN_ROUTER_API_KEY=YOUR_KEY,TAVILY_API_KEY=YOUR_KEY,OPIK_API_KEY=YOUR_KEY" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --max-instances 10

# Copy the Service URL from output!
```

## 🌐 Deploy Frontend to Vercel

```bash
cd ..

# Set environment variable
vercel env add AGENT_URL
# Enter your Cloud Run URL when prompted

# Deploy
vercel --prod
```

## 🔄 Update CORS (After Vercel deployment)

```bash
cd agent

gcloud run services update aura-chef-agent \
  --region us-central1 \
  --set-env-vars "ALLOWED_ORIGINS=https://YOUR-APP.vercel.app,https://YOUR-APP-*.vercel.app,http://localhost:3000"
```

## ✅ Test Deployment

```bash
# Test backend
curl https://YOUR-CLOUD-RUN-URL/health

# Visit frontend
open https://YOUR-APP.vercel.app
```

## 📝 View Logs

```bash
# Cloud Run logs
gcloud run logs tail aura-chef-agent --region us-central1

# Vercel logs
# Visit: https://vercel.com/dashboard → Your Project → Logs
```

---

**See DEPLOYMENT.md for complete guide**
