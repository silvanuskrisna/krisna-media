import re
with open('D:\\projects\\krisna-media\\.env.local') as f:
    content = f.read()
match = re.search(r'NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)', content)
if match:
    key = match.group(1).strip()
    print(f"Key length: {len(key)}")
    print(f"Key first 20: {key[:20]}")
    print(f"Key last 10: {key[-10:]}")
