import json
import requests

SHEETDB_URL = "https://sheetdb.io/api/v1/1s3fjdvm70pve"

# 1. Load the site's valid IDs
with open('gifts_payload.json', 'r', encoding='utf-8') as f:
    payload = json.load(f)
valid_ids = [g['id'] for g in payload['data'] if g['id'] not in ['sim', 'nao']]

# 2. Get current data from SheetDB
response = requests.get(SHEETDB_URL)
current_data = response.json()

# 3. Identify orphan IDs
orphans = [item['id'] for item in current_data if item['id'] not in valid_ids]

if not orphans:
    print("No orphan items found.")
else:
    print(f"Removing {len(orphans)} orphan items from SheetDB: {orphans}")
    for oid in orphans:
        del_res = requests.delete(f"{SHEETDB_URL}/id/{oid}")
        if del_res.status_code == 200:
            print(f"Deleted {oid}")
        else:
            print(f"Failed to delete {oid}: {del_res.status_code}")

print("Cleanup complete.")
