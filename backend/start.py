#!/usr/bin/env python3
"""
Clinical Trial Voice Interviewer Backend Startup Script
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

def init_json_storage():
    """Initialize JSON storage directories"""
    print("📁 Initializing JSON storage...")
    
    try:
        # Create data directory
        data_dir = Path("data")
        data_dir.mkdir(exist_ok=True)
        
        # Initialize JSON data manager
        from models import JsonDataManager
        json_manager = JsonDataManager()
        
        print("✅ JSON storage initialized successfully")
        return True
    except Exception as e:
        print(f"❌ JSON storage initialization failed: {e}")
        return False

def check_api_keys():
    """Check if required API keys are available"""
    print("🔑 Checking API configuration...")
    
    missing_keys = []
    
    # Check OpenAI API key for the main conversation agent
    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        missing_keys.append("OPENAI_API_KEY")
    
    # Check AssemblyAI API key for speech-to-text
    assembly_key = os.getenv("ASSEMBLYAI_API_KEY")
    if not assembly_key:
        missing_keys.append("ASSEMBLYAI_API_KEY")
    
    # Check ElevenLabs API key for text-to-speech
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    if not elevenlabs_key:
        missing_keys.append("ELEVENLABS_API_KEY")
    
    if missing_keys:
        print("⚠️  Missing API keys:")
        for key in missing_keys:
            print(f"   - {key}")
        print("\n   Set your API keys:")
        if "OPENAI_API_KEY" in missing_keys:
            print("   export OPENAI_API_KEY='your-openai-api-key'")
        if "ASSEMBLYAI_API_KEY" in missing_keys:
            print("   export ASSEMBLYAI_API_KEY='your-assemblyai-api-key'")
        if "ELEVENLABS_API_KEY" in missing_keys:
            print("   export ELEVENLABS_API_KEY='your-elevenlabs-api-key'")
        return False
    
    print("✅ All API keys configured")
    return True

def start_server(host="0.0.0.0", port=8000, reload=True):
    """Start the FastAPI server"""
    print(f"🚀 Starting server on {host}:{port}")
    print(f"   API docs will be available at: http://localhost:{port}/docs")
    print(f"   Health check: http://localhost:{port}/health")
    print("\n🎤 Clinical Trial Voice Interviewer Backend")
    print("=" * 50)
    
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

def main():
    """Main startup function"""
    print("🎤 Clinical Trial Voice Interviewer - Backend Startup")
    print("=" * 60)
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Initialize JSON storage
    if not init_json_storage():
        sys.exit(1)
    
    # Check API keys
    has_api_keys = check_api_keys()
    
    print("\n✅ Startup checks completed!")
    if not has_api_keys:
        print("\n⚠️  Note: Voice features require all API keys to be configured")
    
    print("\n📋 Next steps:")
    print("   1. Server will start at http://localhost:8000")
    print("   2. API documentation: http://localhost:8000/docs") 
    print("   3. Start the frontend with: cd ../frontend && npm run dev")
    print("   4. Frontend will be at: http://localhost:5173")
    print("\n💡 Audio Processing:")
    print("   - Speech-to-Text: AssemblyAI")
    print("   - Text-to-Speech: ElevenLabs")
    print("\n" + "=" * 60)
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main() 