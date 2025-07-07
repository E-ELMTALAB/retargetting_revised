# Campaign Editing and Resuming Features

This document describes the new campaign editing and resuming functionality that has been implemented in the retargeting system.

## Overview

The system now supports:
1. **Campaign Editing**: Users can edit campaign parameters (message, limit) at any time
2. **Campaign Resuming**: Users can resume stopped campaigns, with automatic exclusion of already sent users
3. **User Tracking**: The system tracks which users have been sent messages to avoid duplicates

## New API Endpoints

### Python API (`python_api/main.py`)

#### 1. Get Campaign Data
```
GET /campaign_data/<campaign_id>
```
Returns campaign configuration data for editing purposes.

**Response:**
```json
{
  "campaign_id": 123,
  "data": {
    "message": "Campaign message",
    "limit": 100,
    "account_id": 1,
    "session": "session_string",
    "created_at": "2024-01-01T12:00:00"
  },
  "status": "running",
  "sent_count": 50,
  "failed_count": 5,
  "total_recipients": 100
}
```

#### 2. Update Campaign
```
POST /update_campaign/<campaign_id>
```
Updates campaign configuration data.

**Request Body:**
```json
{
  "message": "Updated message",
  "limit": 150,
  "account_id": 1,
  "session": "session_string"
}
```

#### 3. Resume Campaign
```
POST /resume_campaign/<campaign_id>
```
Resumes a stopped campaign, excluding users that have already been sent messages.

## Worker API (`worker/src/index.ts`)

The worker API now includes proxy endpoints for the new Python API functionality:

- `GET /campaigns/:id/data` - Get campaign data
- `POST /campaigns/:id/update` - Update campaign data  
- `POST /campaigns/:id/resume` - Resume campaign

## Frontend Components

### CampaignMonitor.jsx

The campaign monitor now includes:

1. **Edit Button**: Allows editing of any campaign
2. **Resume Button**: Shows for stopped/completed campaigns
3. **Edit Modal**: Modal dialog for editing campaign parameters
4. **Enhanced Campaign List**: Shows all campaigns (running, stopped, completed)

**New Features:**
- Campaign editing modal with message and limit fields
- Resume functionality for stopped campaigns
- Real-time status updates
- Error handling and user feedback

### CampaignEditor.jsx

Updated to show:
- Campaign status in the existing campaigns list
- Resume button for stopped campaigns
- Edit button that navigates to campaign monitor

## How It Works

### Campaign Data Storage

Campaign data is stored in memory using these global variables:
- `CAMPAIGN_DATA`: Stores campaign configuration
- `SENT_USERS`: Tracks users that have been sent messages per campaign
- `CAMPAIGN_STATUS`: Tracks campaign execution status

### User Exclusion Logic

When resuming a campaign:
1. The system retrieves the list of users already sent messages (`SENT_USERS[campaign_id]`)
2. During recipient collection, it skips users whose IDs are in the sent users set
3. Only new users receive the message

### Campaign Editing Flow

1. User clicks "Edit" button on a campaign
2. System fetches current campaign data via `/campaigns/:id/data`
3. User modifies message and/or limit in the modal
4. System updates campaign data via `/campaigns/:id/update`
5. Campaign continues with updated parameters

### Campaign Resuming Flow

1. User clicks "Resume" button on a stopped campaign
2. System calls `/campaigns/:id/resume`
3. Python API:
   - Retrieves campaign data and sent users list
   - Starts new background thread for execution
   - Excludes already sent users from recipient list
   - Continues sending to remaining users
4. Frontend updates to show campaign as running

## Testing

A test file has been created at `tests/test_campaign_editing.py` that verifies:
- Campaign creation
- Data retrieval
- Campaign updating
- Campaign stopping
- Campaign resuming
- Status checking

Run the test with:
```bash
python tests/test_campaign_editing.py
```

## Benefits

1. **No Duplicate Messages**: Users who already received messages won't get duplicates
2. **Flexible Campaign Management**: Campaigns can be modified at any time
3. **Resume Capability**: Interrupted campaigns can be continued from where they left off
4. **Better User Experience**: Clear UI for managing campaign lifecycle
5. **Data Persistence**: Campaign data is maintained throughout the lifecycle

## Technical Notes

- Campaign data is stored in memory (not persistent across server restarts)
- User tracking uses user IDs to ensure uniqueness
- All operations are thread-safe using proper synchronization
- Error handling includes detailed logging for debugging
- Rate limiting is maintained during resume operations

## Future Enhancements

Potential improvements:
1. Persistent storage for campaign data and sent users
2. Campaign scheduling and automation
3. A/B testing capabilities
4. Advanced targeting and filtering
5. Campaign analytics and reporting 