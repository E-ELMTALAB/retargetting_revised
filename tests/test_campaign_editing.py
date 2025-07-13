#!/usr/bin/env python3
"""
Test campaign resuming functionality
"""

import requests
import json

# Configuration
PYTHON_API_URL = "http://localhost:5000"

def test_campaign_editing_and_resuming():
    """Test the complete flow of campaign editing and resuming."""
    
    print("Testing campaign resuming functionality without edit route...")
    
    # Test data
    test_campaign_data = {
        "session": "test_session_string",
        "message": "Test message for campaign editing",
        "account_id": 1,
        "campaign_id": 999,
        "limit": 5
    }
    
    try:
        # 1. Start a campaign
        print("\n1. Starting test campaign...")
        response = requests.post(f"{PYTHON_API_URL}/execute_campaign", 
                               json=test_campaign_data)
        
        if response.status_code == 200:
            print("✓ Campaign started successfully")
        else:
            print(f"✗ Failed to start campaign: {response.text}")
            return False
        
        campaign_id = test_campaign_data["campaign_id"]
        
        # 2. Ensure edit endpoints are not available
        print("\n2. Checking removed edit endpoints...")
        r1 = requests.get(f"{PYTHON_API_URL}/campaign_data/{campaign_id}")
        r2 = requests.post(f"{PYTHON_API_URL}/update_campaign/{campaign_id}")
        if r1.status_code == 404 and r2.status_code == 404:
            print("✓ Edit routes return 404 as expected")
        else:
            print("✗ Edit routes still exist")
            return False
        
        # 3. Stop the campaign
        print("\n3. Stopping campaign...")
        response = requests.post(f"{PYTHON_API_URL}/stop_campaign/{campaign_id}")
        
        if response.status_code == 200:
            print("✓ Campaign stopped successfully")
        else:
            print(f"✗ Failed to stop campaign: {response.text}")
            return False
        
        # 4. Resume the campaign
        print("\n4. Resuming campaign...")
        response = requests.post(f"{PYTHON_API_URL}/resume_campaign/{campaign_id}")
        
        if response.status_code == 200:
            print("✓ Campaign resumed successfully")
        else:
            print(f"✗ Failed to resume campaign: {response.text}")
            return False
        
        # 5. Check final status
        print("\n5. Checking final campaign status...")
        response = requests.get(f"{PYTHON_API_URL}/campaign_status/{campaign_id}")
        
        if response.status_code == 200:
            status_data = response.json()
            print("✓ Campaign status retrieved successfully")
            print(f"  - Final status: {status_data.get('status')}")
            print(f"  - Total sent: {status_data.get('sent_count')}")
            print(f"  - Total failed: {status_data.get('failed_count')}")
        else:
            print(f"✗ Failed to get campaign status: {response.text}")
            return False
        
        print("\n🎉 All tests passed! Campaign editing and resuming functionality is working correctly.")
        return True
        
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to Python API. Make sure it's running on localhost:5000")
        return False
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        return False

if __name__ == "__main__":
    success = test_campaign_editing_and_resuming()
    exit(0 if success else 1) 