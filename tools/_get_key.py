import re

with open('D:\\projects\\krisna-media\\.env.local') as f:
    content = f.read()

# Get service_role key
match = re.search(r'SUPABASE_SERVICE_ROLE_KEY=(.+)', content)
if match:
    key = match.group(1).strip()
    # Save to a temp file that curl can read
    with open('D:\\tmp\\_supabase_key.txt', 'w') as out:
        out.write(key)
    print(f"Saved! Key length: {len(key)}")
else:
    print("Key not found!")