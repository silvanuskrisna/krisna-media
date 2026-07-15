import subprocess, json, os

os.environ["KEY"] = open("D:/tmp/anon_key.txt").read().strip()
key = os.environ["KEY"]

cmd = [
    "curl", "-s",
    "https://bgihthisppcacqvclemo.supabase.co/rest/v1/promos?select=name,end_date&name=eq.Promo%20Gajian",
    "-H", "apikey: " + key,
    "-H", "Authorization: Bearer *** + key
]
r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
print(r.stdout)