# 🚀 Deployment Guide - Render

## Quick Deployment Steps

### 1. **Connect GitHub to Render**
1. Go to [render.com](https://render.com) and sign up/login
2. Connect your GitHub account
3. Select your repository: `VijayRagaAI/clinical-trial-agent`

### 2. **Deploy using Blueprint**
1. Click **"New"** → **"Blueprint"**
2. Select your repository
3. Render will automatically detect the `render.yaml` file
4. Click **"Apply"**

### 3. **Set Environment Variables**
During deployment, you'll need to set these secret environment variables:

#### Backend Environment Variables:
```bash
OPENAI_API_KEY=your-openai-api-key-here
ASSEMBLYAI_API_KEY=your-assemblyai-api-key-here  
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
```

### 4. **Access Your App**
- **Backend**: `https://clinical-trial-backend.onrender.com`
- **Frontend**: `https://clinical-trial-frontend.onrender.com`
- **API Docs**: `https://clinical-trial-backend.onrender.com/docs`

## ⚡ What Happens Automatically

✅ **Backend**: Python environment, dependencies installed, FastAPI server started  
✅ **Frontend**: Node.js build, static files served  
✅ **SSL**: HTTPS automatically enabled  
✅ **WebSockets**: Real-time voice features work  
✅ **Health Checks**: Automatic monitoring  

## 🎯 Important Notes

- **Free Tier**: 750 hours/month (about 25 days)
- **Sleep Mode**: Apps sleep after 15 minutes of inactivity
- **Wake Up**: First request after sleep takes ~30 seconds
- **Custom Domain**: Available on paid plans

## 🔧 Troubleshooting

**If deployment fails:**
1. Check the build logs in Render dashboard
2. Verify all API keys are set correctly
3. Ensure your repository is public or Render has access

**If voice features don't work:**
1. Check CORS settings in backend
2. Verify HTTPS is enabled (required for microphone access)
3. Test API endpoints at `/docs`

## 🎉 Success!

Your Clinical Trial Voice Agent is now live and ready to screen participants!

**Next Steps:**
- Test the voice interview flow
- Monitor usage on free tier
- Consider upgrading for production use 