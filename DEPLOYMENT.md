# Deployment Guide - Render

This guide will help you deploy the SF Lap Swim Finder to Render.

## Prerequisites

1. GitHub account
2. Render account (sign up at https://render.com)
3. Your code pushed to a GitHub repository

## Step 1: Push to GitHub

If you haven't already, push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit - SF Lap Swim Finder MVP"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Deploy Backend to Render

1. Go to https://render.com and sign in
2. Click **"New +"** and select **"Web Service"**
3. Connect your GitHub repository
4. Configure the backend service:
   - **Name**: `sf-lap-swim-finder-backend` (or any name you prefer)
   - **Region**: Choose closest to you
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **"Create Web Service"**
6. **Important**: Copy the backend URL (it will look like: `https://sf-lap-swim-finder-backend.onrender.com`)

## Step 3: Deploy Frontend to Render

1. Click **"New +"** and select **"Static Site"**
2. Connect the same GitHub repository
3. Configure the frontend service:
   - **Name**: `sf-lap-swim-finder` (or any name you prefer)
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://YOUR-BACKEND-URL.onrender.com/api` (use the URL from Step 2)
5. Click **"Create Static Site"**

## Step 4: Verify Deployment

1. Wait for both services to deploy (usually 5-10 minutes for first deployment)
2. Once complete, click on your frontend service URL
3. Test the app:
   - Select a day and time
   - Verify pools are displayed
   - Check that clicking "Refresh Schedules" works

## Important Notes

### Free Tier Limitations

- Backend will sleep after 15 minutes of inactivity
- First request after sleeping may take 30-60 seconds to wake up
- Consider upgrading to paid tier ($7/month) for always-on service

### Updating Your App

When you push changes to GitHub:
1. Render will automatically redeploy your services
2. No manual intervention needed

### Environment Variables

If you need to update the API URL:
1. Go to your frontend service in Render dashboard
2. Navigate to "Environment" tab
3. Update `VITE_API_URL`
4. Trigger manual deploy

## Troubleshooting

### Backend not responding
- Check Render logs for errors
- Verify the backend is running (not sleeping)
- Check that PORT environment variable is set (Render does this automatically)

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly with `/api` at the end
- Check CORS is enabled in backend (already configured)
- Look at browser console for errors

### Schedules not loading
- Check server logs in Render dashboard
- Verify manual schedules file is included in the deployment
- PDF parsing may fail for some pools (expected behavior)

## Cost Estimate

- **Free Tier**: $0/month
  - Backend sleeps after inactivity
  - 750 hours/month free

- **Starter Tier**: $7/month for backend
  - Always on
  - Better for production use

## Alternative: Single Service Deployment

If you want to simplify and deploy both frontend and backend together:
1. I can help you create a production build where the backend serves the frontend
2. This would be a single web service on Render
3. Simpler to manage but requires code changes

Would you like me to set that up instead?
