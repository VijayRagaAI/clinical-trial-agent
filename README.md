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

## 🎵 Audio Processing

- **🎙️ AssemblyAI**: Fast, accurate speech transcription
- **🔊 ElevenLabs**: High-quality voice synthesis
- **🌐 Web-based**: No local audio dependencies needed


## 🔧 Development

1. **Backend**: http://localhost:8000
2. **Frontend**: http://localhost:5173
3. **API Docs**: http://localhost:8000/docs


---

<div align="center">
Made with ❤️ for better clinical trial participant screening
</div> 