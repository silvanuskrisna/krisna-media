import subprocess, json

with open('D:/tmp/anon_key.txt') as f:
    key = f.read().strip()

url = 'https://bgihthisppcacqvclemo.supabase.co/rest/v1/promos?select=*&name=eq.Promo%20Gajian'
api = 'apikey: ' + key
auth = 'Authorization: Bearer ' + key

cmd = ['curl', '-s', url, '-H', api, '-H', auth]
r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
data = json.loads(r.stdout)
print(json.dumps(data, indent=2, default=str))