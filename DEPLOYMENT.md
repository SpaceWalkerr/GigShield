# 🚀 GigShield Deployment Guide

## Architecture

- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Node.js Express)
- **Database**: Supabase (PostgreSQL)
- **AI**: Groq (CookieBytes chatbot)
- **Weather**: OpenWeatherMap API

---

## Step 1: Deploy Backend to Render

### Prerequisites

- GitHub account with gigshield repository
- Render account (free tier available)
- Environment variables ready

### Deployment Steps

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com/
   - Click **"New +"** → **"Web Service"**

2. **Connect GitHub Repository**
   - Click **"Connect account"** under GitHub
   - Authorize Render to access your GitHub
   - Select **`gigshield`** repository
   - Click **"Connect"**

3. **Configure Web Service**
   - **Name:** `gigshield-backend`
   - **Environment:** `Node`
   - **Region:** `Oregon` (or closest to your location)
   - **Branch:** `main` (or your default branch)
   - **Build Command:** `npm install --include=dev`
   - **Start Command:** `npm start`
   - **Plan:** `Free` (sufficient for development)

4. **Add Environment Variables**
   - Click **"Advanced"** or scroll to **"Environment"**
   - Add each variable individually:

   | Key               | Value                         | Notes                      |
   | ----------------- | ----------------------------- | -------------------------- |
   | `GROQ_API_KEY`    | `your-groq-api-key`           | Groq API key for LLM       |
   | `WEATHER_API_KEY` | `your-openweathermap-api-key` | OpenWeatherMap key         |
   | `PORT`            | `10000`                       | Render assigns dynamically |
   | `NODE_ENV`        | `production`                  | Optimization flag          |

5. **Deploy**
   - Scroll to bottom → Click **"Create Web Service"**
   - Wait 2-3 minutes for build and deployment
   - You'll see a URL like: `https://gigshield-backend-xxxxx.onrender.com`

6. **Verify Deployment**
   - Visit `https://gigshield-backend-xxxxx.onrender.com/health`
   - Expected response: `{"status":"ok"}`

---

## Step 2: Deploy Frontend to Vercel

### Prerequisites

- Vercel account (free tier)
- Backend URL from Step 1

### Deployment Steps

1. **Import Project to Vercel**
   - Go to https://vercel.com/dashboard
   - Click **"Add New..."** → **"Project"**
   - Select **"Import Git Repository"**
   - Find and select **`gigshield`**

2. **Configure Project**
   - **Project Name:** `gigshield` (or your choice)
   - **Framework Preset:** `Vite` (auto-detected)
   - **Root Directory:** `./`

3. **Set Environment Variables**
   - In the **"Environment Variables"** section, add:

   | Key                        | Value                                   | Notes                        |
   | -------------------------- | --------------------------------------- | ---------------------------- |
   | `VITE_API_URL`             | `https://your-backend-url.onrender.com` | Replace with your Render URL |
   | `VITE_SUPABASE_URL`        | `https://your-project-ref.supabase.co`  | Supabase project URL         |
   | `VITE_SUPABASE_ANON_KEY`   | `your-supabase-anon-key`                | Supabase anon key            |
   | `VITE_OPENWEATHER_API_KEY` | `your-openweathermap-api-key`           | OpenWeatherMap key           |

4. **Deploy**
   - Click **"Deploy"**
   - Wait 2-5 minutes for build
   - You'll get a URL like: `https://gigshield.vercel.app`

5. **Update for Production**
   - Once deployed, go to **Settings** → **Environment Variables**
   - Update `VITE_API_URL` to your **final Render backend URL**
   - Go to **Deployments** → Click **"Redeploy"** on latest build

---

## Step 3: Verify Everything Works

### Health Checks

1. **Backend Health**

   ```
   GET https://gigshield-backend-xxxxx.onrender.com/health
   Response: {"status":"ok"}
   ```

2. **Frontend Access**

   ```
   Visit https://gigshield.vercel.app
   Should load without errors
   ```

3. **API Communication**
   - Go to Dashboard on frontend
   - Trigger any risk check
   - Monitor **Network** tab in browser DevTools
   - Should see request to backend URL

4. **Chatbot (CookieBytes)**
   - Click the chat button
   - Send a message
   - Should receive AI response

### Troubleshooting

- **API calls failing?** Check `VITE_API_URL` matches your Render URL
- **Chatbot not responding?** Verify `GROQ_API_KEY` is set on Render
- **Weather not updating?** Check `WEATHER_API_KEY` on Render backend

---

## Important Notes

### Security

⚠️ **Never commit `.env.local` to GitHub** - it's already in `.gitignore`

- Sensitive keys should only be in Render/Vercel dashboards
- Rotate keys if accidentally exposed

### Cold Starts

- Free Render tier may sleep after 15 min of inactivity
- First request after sleep may take 30-60 seconds
- Upgrade to Starter plan ($7/month) for 24/7 uptime

### CORS

- Backend allows requests from any origin (not recommended for production)
- Update `cors()` in `server.js` for production security

---

## Next Steps

1. ✅ Backend on Render
2. ✅ Frontend on Vercel
3. ⏭️ Set up CI/CD for auto-deployments on git push
4. ⏭️ Monitor logs: Render Dashboard → Logs tab

---

**Questions?** Check:

- Render logs: https://dashboard.render.com/services
- Vercel logs: https://vercel.com/dashboard
- Network DevTools (F12) on frontend
