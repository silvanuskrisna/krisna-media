import urllib.request, json, sys

key = open('/d/Projects/krisna-media/.supabase-sr-key.txt').read().strip()
url = 'https://bgihthisppcacqvclemo.supabase.co/rest/v1/admin_templates?select=id,name,content&order=sort_order.asc&limit=20'
req = urllib.request.Request(url)
req.add_header('apikey', key)
req.add_header('Authorization', f'Bearer {key}')

try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    for t in data:
        has_bank = 'BCA' in t['content'] or '1234567890' in t['content']
        has_rekening = '{{rekening}}' in t['content']
        print(f"{t['name']}: bank_manual={has_bank} rekening_var={has_rekening}")
except Exception as e:
    print(f'Error: {e}')