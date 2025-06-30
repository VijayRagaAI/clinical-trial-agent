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


def start_server(host="0.0.0.0", port=8000, reload=True):
    """Start the FastAPI server"""
    print(f"🚀 Starting server on {host}:{port}")
    print("\n🎤 Clinical Trial Voice Interviewer Backend")
    print("=" * 50)
    
    try:
        import uvicorn
        uvicorn.run(
            "api_server:app",
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
    

    print("\n" + "=" * 60)
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main() 