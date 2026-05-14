import json
import requests

SHEETDB_URL = "https://sheetdb.io/api/v1/1s3fjdvm70pve"

# 1. Load the extracted gifts
with open('gifts_payload.json', 'r', encoding='utf-8') as f:
    payload = json.load(f)

# 2. Filter out RSVP options (sim, nao)
gifts_to_sync = [g for g in payload['data'] if g['id'] not in ['sim', 'nao']]

# 3. Get current data from SheetDB to see what's already there
response = requests.get(SHEETDB_URL)
current_data = response.json()
current_ids = [item['id'] for item in current_data]

# 4. Identify new gifts
new_gifts = [g for g in gifts_to_sync if g['id'] not in current_ids]

if not new_gifts:
    print("No new gifts to add.")
else:
    # 5. POST new gifts in bulk
    print(f"Adding {len(new_gifts)} new gifts to SheetDB...")
    post_response = requests.post(SHEETDB_URL, json={"data": new_gifts})
    
    if post_response.status_code == 201:
        print("Successfully added new gifts!")
    else:
        print(f"Error adding gifts: {post_response.status_code}")
        print(post_response.text)

# 6. (Optional) Check for differences in names for existing ones
# For this task, we just added the missing ones as requested.
