#!/usr/bin/env python3
"""
Google Cloud Credentials Setup for Production Deployment
"""

import os
import json
import tempfile
from pathlib import Path

def setup_google_credentials():
    """Setup Google Cloud credentials from environment variable"""
    
    # Check if credentials JSON is provided as environment variable
    credentials_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    
    if not credentials_json:
        print("ℹ️  No GOOGLE_APPLICATION_CREDENTIALS_JSON found - Google Cloud services may not work")
        return False
    
    try:
        # Parse the JSON to validate it
        credentials_data = json.loads(credentials_json)
        
        # Create a temporary credentials file
        temp_dir = Path(tempfile.gettempdir())
        credentials_file = temp_dir / 'google_credentials.json'
        
        # Write credentials to file
        with open(credentials_file, 'w') as f:
            json.dump(credentials_data, f)
        
        # Set the environment variable to point to the file
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(credentials_file)
        
        print(f"✅ Google Cloud credentials configured: {credentials_file}")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid Google credentials JSON: {e}")
        return False
    except Exception as e:
        print(f"❌ Failed to setup Google credentials: {e}")
        return False

if __name__ == "__main__":
    setup_google_credentials() 