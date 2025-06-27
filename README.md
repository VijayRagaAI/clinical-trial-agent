# 🎤 Clinical Trial Voice Agent

> AI-powered voice interviewer for clinical trial participant screening

<div align="center">

![Voice Interview](https://img.shields.io/badge/Voice-Interview-blue?style=for-the-badge&logo=microphone)
![AI Powered](https://img.shields.io/badge/AI-Powered-green?style=for-the-badge&logo=robot)
![Real Time](https://img.shields.io/badge/Real-Time-orange?style=for-the-badge&logo=clock)

</div>

## ✨ Features

- 🗣️ **Natural Voice Conversations** - Conduct eligibility assessments through speech
- ⚡ **Real-time Processing** - Instant transcription and response generation
- 🎯 **Smart Evaluation** - Automatic eligibility scoring based on trial criteria
- 🎨 **Modern Interface** - Clean, responsive web application

## 🚀 Quick Start

### 1. API Keys Setup
```bash
# Required API keys
export OPENAI_API_KEY="your-openai-key"
export ASSEMBLYAI_API_KEY="your-assemblyai-key"  
export ELEVENLABS_API_KEY="your-elevenlabs-key"

# Optional: Custom voice
export ELEVENLABS_VOICE_ID="21m00Tcm4TlvDq8ikWAM"
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python start.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

🌐 **Access:** http://localhost:5173

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Python + FastAPI |
| **Frontend** | React + TypeScript + Vite |
| **Speech-to-Text** | AssemblyAI |
| **Text-to-Speech** | ElevenLabs |
| **AI Agent** | OpenAI GPT |
| **Styling** | Tailwind CSS |

## 🎵 Audio Processing

- **🎙️ AssemblyAI**: Fast, accurate speech transcription
- **🔊 ElevenLabs**: High-quality voice synthesis
- **🌐 Web-based**: No local audio dependencies needed

## 📁 Project Structure

```
clinical-trial-agent/
├── 🐍 backend/
│   ├── main.py
│   ├── conversation_agent.py
│   ├── audio_processor.py
│   └── data/
└── ⚛️ frontend/
    ├── src/components/
    ├── src/hooks/
    └── src/services/
```

## 🔧 Development

1. **Backend**: http://localhost:8000
2. **Frontend**: http://localhost:5173
3. **API Docs**: http://localhost:8000/docs

## 📋 Requirements

- Python 3.8+
- Node.js 16+
- Modern browser with microphone access
- API keys for OpenAI, AssemblyAI, and ElevenLabs

---

<div align="center">
Made with ❤️ for better clinical trial participant screening
</div> 