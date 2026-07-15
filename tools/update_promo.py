import subprocess, json

with open('D:/tmp/anon_key.txt') as f:
    key = f.read().strip()

url = 'https://bgihthisppcacqvclemo.supabase.co/rest/v1/promos?id=eq.262a3967-aedb-43ae-8847-7f9301573140'
api = 'apikey: ' + key
auth = 'Authorization: Bearer *** + key
ctype = 'Content-Type: application/json'
prefer = 'Prefer: return=minimal'

# Update end_date to next month (2026-07-31)
data = json.dumps({"end_date": "2026-07-31"})

cmd = ['curl', '-s', '-X', 'PATCH', url, '-H', api, '-H', auth, '-H', ctype, '-H', prefer, '-d', data]
r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
print("Status:", r.stdout if r.stdout else "OK (no content)")
print("Error:", r.stderr if r.stderr else "none")