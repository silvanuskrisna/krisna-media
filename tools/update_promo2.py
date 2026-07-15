import subprocess, json, os

os.environ["KEY"] = open("D:/tmp/anon_key.txt").read().strip()

url = "https://bgihthisppcacqvclemo.supabase.co/rest/v1/promos"
import os
key = os.environ["KEY"]

cmd = [
    "curl", "-s", "-X", "PATCH",
    url + "?id=eq.262a3967-aedb-43ae-8847-7f9301573140",
    "-H", "apikey: " + key,
    "-H", "Authorization: Bearer " + key,
    "-H", "Content-Type: application/json",
    "-H", "Prefer: return=minimal",
    "-d", '{"end_date": "2026-07-31"}'
]
r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
print("EXIT:", r.returncode)
print("OUT:", r.stdout if r.stdout else "(empty)")
print("ERR:", r.stderr if r.stderr else "(none)")