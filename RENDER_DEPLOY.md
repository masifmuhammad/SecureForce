# 🚀 SecureForce — Deploy to Render (Free Tier)

## Prerequisites
- A **GitHub** account with this repo pushed
- A free **Render** account at [render.com](https://render.com)

---

## Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
cd c:\Users\masif\Desktop\ShehrozeBhaisProject\SecureForce-main
git add -A
git commit -m "Add Render deployment config"
git push origin main
```

### Step 2: Deploy on Render via Blueprint

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub repo (`SecureForce-main`)
4. Render will auto-detect `render.yaml` and show:
   - ✅ `secureforce-db` — PostgreSQL (Free)
   - ✅ `secureforce-redis` — Redis (Free)
   - ✅ `secureforce-api` — Backend Web Service (Free)
   - ✅ `secureforce` — Frontend Web Service (Free)
5. Click **Apply** — Render will provision everything

### Step 3: Update URLs After Deployment

Once all services are live, the actual URLs might differ from the defaults in `render.yaml`. Update them:

1. **Backend service** → Go to Environment → Set `FRONTEND_URL` to:
   ```
   https://secureforce-XXXX.onrender.com
   ```
   (Your actual frontend URL from Render dashboard)

2. **Frontend service** → Go to Environment → Set `VITE_API_URL` to:
   ```
   https://secureforce-api-XXXX.onrender.com
   ```
   (Your actual backend URL from Render dashboard)
   **NOTE: After changing this, trigger a manual re-deploy** (since Vite bakes env vars at build time)

### Step 4: Seed the Database (First Time Only)

The backend auto-runs TypeORM `synchronize: true` in dev mode. For production, you may want to seed an admin user. You can do this via the Render **Shell** tab on the backend service:

1. Open `secureforce-api` service → **Shell** tab
2. The backend auto-creates tables on first boot. Register your first admin via the API:

```bash
curl -X POST https://YOUR-BACKEND-URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@secureforce.com.au",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

---

## URLs After Deployment

| Service | URL |
|---|---|
| Frontend | `https://secureforce-XXXX.onrender.com` |
| Backend API | `https://secureforce-api-XXXX.onrender.com` |
| Swagger Docs | `https://secureforce-api-XXXX.onrender.com/api/docs` |

---

## Important Notes

| Topic | Detail |
|---|---|
| **Cold starts** | Free tier sleeps after 15min of inactivity. First request takes ~30s to wake up |
| **Database** | Free PostgreSQL is available for 90 days, then needs to be recreated or upgraded |
| **Redis** | 25MB free tier — plenty for caching/sessions |
| **Custom domain** | You can add a custom domain in Render's service settings |
| **HTTPS** | Render provides free SSL/TLS automatically |
| **Auto-deploy** | Push to `main` branch → Render auto-deploys both services |

---

## Troubleshooting

- **Frontend shows CORS errors?** → Update `FRONTEND_URL` on the backend service to match the exact frontend URL
- **Frontend API calls fail?** → Update `VITE_API_URL` on frontend service and trigger manual re-deploy
- **Database connection errors?** → Check that the DB env vars are correctly linked in Render dashboard
- **App doesn't load?** → Check the Render logs tab for build/runtime errors
