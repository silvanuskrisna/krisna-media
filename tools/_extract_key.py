import re
with open('D:\\projects\\krisna-media\\.env.local', 'r') as f:
    content = f.read()
match = re.search(r'SUPABASE_SERVICE_ROLE_KEY=(.+)', content)
if match:
    key = match.group(1).strip()
    with open('D:\\tmp\\_supa_key.txt', 'w') as out:
        out.write(key)
    print(f"OK len={len(key)}")
else:
    print("NOT FOUND")