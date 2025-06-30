# 🎤 Clinical Trial Voice Interviewer

> AI-powered voice interview platform for clinical trial participant screening with real-time conversation, multi-language support, and ClinicalTrials.gov integration

<div align="center">

![Voice Interview](https://img.shields.io/badge/Voice-Interview-blue?style=for-the-badge&logo=microphone)
![AI Powered](https://img.shields.io/badge/AI-Powered-green?style=for-the-badge&logo=robot)
![ClinicalTrials.gov](https://img.shields.io/badge/ClinicalTrials.gov-Integration-purple?style=for-the-badge&logo=database)
![Real Time](https://img.shields.io/badge/Real-Time-orange?style=for-the-badge&logo=clock)

</div>

## ✨ Features

### 🎙️ **Intelligent Voice Interview System**
- **Natural Conversations** - AI-powered interviews optimised for natural, conversational interactions
- **Real-time Processing** - Instant speech-to-text with Google Cloud Speech API
- **Smart Evaluation** - Automatic eligibility scoring with detailed criteria assessment
- **Consent Management** - Intelligent consent handling with natural language understanding
- **Interview Controls** - Repeat questions, skip speaking, recording controls and many more.

### 🌍 **Multi-Language Support**
- **24+ Languages** - Comprehensive language support suing Google Cloud Speech models
- **Indian Languages** - Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati, Urdu, Kannada, and more
- **Global Languages** - English, Spanish, French, German, Japanese, Chinese, Arabic, and more
- **Intelligent Translation** - Context-aware translation with gender-specific grammar
- **Voice Variety** - Multiple voice options and speed controls for each language

### 🌐 **ClinicalTrials.gov Integration**
- **Live Study Import** - Search and import studies directly from ClinicalTrials.gov
- **AI Conversion** - Automatically convert medical eligibility criteria to interview questions
- **Real Study Data** - Work with actual clinical trial information and requirements
- **Seamless Integration** - Imported studies immediately ready for voice interviews

### 📊 **Comprehensive Admin Dashboard**
- **Study Management** - Create, edit, import, and delete clinical studies
- **Interview Analytics** - Monitor participant interviews with detailed status tracking
- **Data Export** - Download conversation transcripts and evaluation results
- **Participant Management** - View interview history and eligibility outcomes
- **Performance Insights** - Track completion rates and interview statistics

### 🎨 **Modern Interface & Experience**
- **Beautiful Animations** - Smooth transitions and breathing effects throughout the UI
- **Dark/Light Mode** - Elegant theme switching with persistent preferences
- **Glass Morphism Design** - Professional UI with backdrop blur and gradient effects
- **Responsive Layout** - Optimized for desktop and mobile devices
- **Real-time Updates** - WebSocket-based live communication during interviews

## 🚀 Quick Start

### 1. Prerequisites & API Keys

**Required:**
```bash
export OPENAI_API_KEY="your-openai-key"
export GOOGLE_APPLICATION_CREDENTIALS="path/to/google-credentials.json"
```

> **Note:** Google credentials are required for both speech-to-text and text-to-speech functionality. You'll need to enable Google Cloud Speech-to-Text and Text-to-Speech APIs.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python start_backend.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- **Admin Dashboard**: http://localhost:5173
- **Voice Interview**: http://localhost:5173/interview  
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🏗️ Architecture

### **Backend** (Python/FastAPI)
- **FastAPI** server with WebSocket support for real-time communication
- **Google Cloud** Speech-to-Text and Text-to-Speech integration
- **OpenAI GPT models** for intelligent conversation and evaluation
- **Session management** with data persistence and export capabilities
- **ClinicalTrials.gov API** integration for study imports

### **Frontend** (React/TypeScript)
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive design and animations
- **Lucide React** for beautiful icons
- **WebSocket client** for real-time voice interview communication
- **Multi-route architecture** with React Router

## 📁 Project Structure

```
clinical-trial-agent/
├── backend/                  # Python FastAPI backend
│   ├── api_server.py        # Main FastAPI application
│   ├── conversation_agent.py # AI conversation logic
│   ├── audio_processor.py   # Speech processing
│   ├── clinical_trials_api.py # ClinicalTrials.gov integration
│   ├── start_backend.py     # Server startup script
│   └── requirements.txt     # Python dependencies
|   |__ ..
├── frontend/                # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── VoiceInterface.tsx
│   │   │   └── ...
│   │   └── App.tsx         # Main application
│   └── package.json        # Node.js dependencies
└── README.md               # This file
```

## 🚀 Deployment

### Deploy to Render

This project includes a `render.yaml` configuration for easy deployment to Render.com:

#### 1. Prerequisites
- Render account
- GitHub repository connected to Render
- Required API keys

#### 2. Environment Variables
Set these in your Render dashboard:

**Backend Service:**
```bash
OPENAI_API_KEY=your-openai-api-key
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...} # Full JSON as string
```

**Frontend Service:**
```bash
# Note: VITE_API_URL is automatically set by Render using the backend service URL
# Manual override only needed if using custom domain:
VITE_API_URL=https://clinical-trial-backend.onrender.com
```

#### 3. Deploy Steps
1. Connect your GitHub repository to Render
2. Render will automatically detect the `render.yaml` file
3. Set the required environment variables
4. Deploy both services

#### 4. Custom Domain (Optional)
- Set up custom domain in Render dashboard
- Update `CORS_ORIGINS` in backend environment variables

### Manual Deployment

#### Backend (Production)
```bash
cd backend
pip install -r requirements.txt
python start_backend.py --host 0.0.0.0 --port 8000 --reload false
```

#### Frontend (Production)
```bash
cd frontend
npm ci
npm run build
npx serve -s dist -l 3000
```

### Docker Deployment

#### Quick Start with Docker Compose
```bash
# Set environment variables
export OPENAI_API_KEY="your-openai-api-key"
export GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'

# Start both services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Individual Service Deployment

**Backend:**
```bash
cd backend
docker build -t clinical-trial-backend .
docker run -p 8000:8000 \
  -e OPENAI_API_KEY="your-key" \
  -e GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}' \
  clinical-trial-backend
```

**Frontend:**
```bash
cd frontend
docker build -t clinical-trial-frontend .
docker run -p 3000:3000 \
  -e VITE_API_URL="http://localhost:8000" \
  clinical-trial-frontend
```

### Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key for conversation AI | `sk-...` |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | ✅ | Google Cloud service account JSON | `{"type":"service_account",...}` |
| `CORS_ORIGINS` | ❌ | Allowed CORS origins | `https://yourdomain.com` |
| `VITE_API_URL` | ✅ | Frontend API URL | `https://your-backend.onrender.com` or `https://api.yourdomain.com` |

### Health Checks

The backend includes a health check endpoint at `/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

---

<div align="center">
Made with ❤️ for revolutionizing clinical trial participant screening
</div>