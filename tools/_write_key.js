require('fs').writeFileSync('D:\\tmp\\_supa_key.txt', 
  require('fs').readFileSync('D:\\projects\\krisna-media\\.env.local','utf8')
    .match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim()
)
console.log('done')