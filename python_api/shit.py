from telethon.sync import TelegramClient
from telethon.sessions import StringSession

API_ID = 123456  # your API ID
API_HASH = 'your_api_hash'  # your API hash

with TelegramClient('me', API_ID, API_HASH) as client:
    print("String session:")
    print(client.session.save())