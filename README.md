# Clinical Trial Agent

A conversational AI agent that helps assess patient eligibility for clinical trials through voice-based interviews.

## Features

- **Voice-Based Interviews**: Conduct patient eligibility assessments through natural conversation
- **Real-time Audio Processing**: Process and analyze patient responses in real-time
- **Eligibility Evaluation**: Automatically evaluate patient eligibility based on trial criteria
- **Modern Web Interface**: Clean, responsive frontend for managing conversations and results

## Tech Stack

### Backend
- **Python**: Core backend logic
- **FastAPI/Flask**: API framework
- **Audio Processing**: Real-time voice analysis
- **JSON**: Data storage and configuration

### Frontend
- **React + TypeScript**: Modern web interface
- **Vite**: Fast development and build tool
- **Tailwind CSS**: Utility-first styling
- **Voice API**: Browser-based voice recording

## Project Structure

```
Clinical-Trial-Agent/
├── backend/                 # Python backend
│   ├── main.py             # Main application entry
│   ├── conversation_agent.py # Conversation logic
│   ├── eligibility_evaluator.py # Eligibility assessment
│   ├── audio_processor.py  # Audio handling
│   ├── models.py           # Data models
│   └── data/               # Trial data and results
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── ...
└── README.md
```

## Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python start.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Start the backend server
2. Launch the frontend development server
3. Navigate to the web interface
4. Begin a voice-based eligibility interview
5. Review assessment results in real-time

## Development

This project uses:
- Python virtual environments for backend dependencies
- Node.js package management for frontend dependencies
- TypeScript for type safety
- Modern React patterns with hooks

## Notes

- Ensure microphone permissions are enabled for voice features
- Medical data should be handled according to HIPAA compliance
- Audio recordings are processed locally for privacy 