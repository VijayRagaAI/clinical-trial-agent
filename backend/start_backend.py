#!/usr/bin/env python3
"""
Clinical Trial Voice Interviewer Backend Startup Script
"""

import os
import sys
import subprocess
import logging
import argparse
from pathlib import Path

def setup_production_environment():
    """Setup production environment configurations"""
    try:
        # Setup Google Cloud credentials if provided
        from setup_google_credentials import setup_google_credentials
        setup_google_credentials()
        
        # Set other production configurations
        if os.getenv('NODE_ENV') == 'production' or os.getenv('RENDER'):
            os.environ['LOG_LEVEL'] = os.getenv('LOG_LEVEL', 'INFO')
            print("🏭 Production environment detected")
        
        return True
    except Exception as e:
        print(f"⚠️  Production setup warning: {e}")
        return True  # Don't fail startup for this

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
    parser = argparse.ArgumentParser(description='Clinical Trial Voice Interviewer Backend')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind to')
    parser.add_argument('--reload', type=str, default='true', help='Enable auto-reload (true/false)')
    
    args = parser.parse_args()
    
    # Convert PORT environment variable if set (for Render deployment)
    if 'PORT' in os.environ:
        args.port = int(os.environ['PORT'])
    
    # Convert reload string to boolean
    reload_enabled = args.reload.lower() in ('true', '1', 'yes', 'on')
    
    print("🎤 Clinical Trial Voice Interviewer - Backend Startup")
    print("=" * 60)
    print(f"Host: {args.host}")
    print(f"Port: {args.port}")
    print(f"Reload: {reload_enabled}")
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Setup production environment
    setup_production_environment()
    
    # Initialize JSON storage
    if not init_json_storage():
        sys.exit(1)
    

    print("\n" + "=" * 60)
    
    # Start the server
    start_server(host=args.host, port=args.port, reload=reload_enabled)

if __name__ == "__main__":
    main() 