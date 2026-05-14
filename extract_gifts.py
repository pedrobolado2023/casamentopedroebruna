import re
import json

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract select options
options = re.findall(r'<option value="([^"]+)">([^<]+)</option>', html)
gifts = []
for val, text in options:
    if val: # skip empty value
        gifts.append({
            "id": val,
            "nome_presente": text,
            "status": "disponivel",
            "comprador_nome": "",
            "comprador_telefone": ""
        })

# Extract Lua de Mel (which is a card, not in select)
# <div class="gift-card" data-id="lua_mel">
if 'data-id="lua_mel"' in html:
    gifts.append({
        "id": "lua_mel",
        "nome_presente": "Cota de Lua de Mel",
        "status": "disponivel",
        "comprador_nome": "",
        "comprador_telefone": ""
    })

# Remove duplicates (lua_mel might be in both if I'm not careful, though it isn't in select)
seen_ids = set()
unique_gifts = []
for g in gifts:
    if g['id'] not in seen_ids:
        unique_gifts.append(g)
        seen_ids.add(g['id'])

with open('gifts_payload.json', 'w', encoding='utf-8') as f:
    json.dump({"data": unique_gifts}, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(unique_gifts)} gifts.")
