// E2E test — Fitur Kode Diskon Krisna Media
// 1. Buat kode uji TEST10 (10%, quota unlimited, max 5x/orang)
// 2. Test validasi RPC (case-insensitive, salah kode, non-studio, harga dasar)
// 3. Test booking dengan kode via anon (jalur persis seperti halaman booking)
// 4. Test anti-manipulasi: amount salah / stack promo → ditolak trigger
// 5. Test limit 5x per nomor + kuota balik saat booking dibatalkan
// 6. Bersihkan semua data uji
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const env = fs.readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/)[1].trim()
const anonKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\n]+)"?/)[1].trim()
const serviceKey = fs.readFileSync('.supabase-sr-key.txt', 'utf8').trim()

const anon = createClient(url, anonKey)
const svc = createClient(url, serviceKey)

const TEST_EMAIL = 'e2e-discount-test@local.test'
const TEST_PHONE = '0811-0000-0000'
const TEST_DATE = '2026-12-15'
const CODE = 'TEST10'
let passed = 0
let failed = 0

function log(ok, msg) {
  if (ok) { passed++; console.log(`  ✅ ${msg}`) }
  else { failed++; console.log(`  ❌ ${msg}`) }
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let c = 'KM-'
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)]
  return c
}

async function main() {
  let testCodeId = null
  const createdBookingIds = []

  try {
    // ── Siapkan produk studio ──
    const { data: prods } = await svc.from('products').select('id,name,price,price_unit,category').eq('category', 'studio').eq('is_active', true)
    const perJam = prods.find(p => p.price_unit === 'jam')
    const paket = prods.find(p => p.price_unit === 'paket')
    if (!perJam || !paket) { console.log('❌ Produk studio tidak ditemukan'); return }
    console.log(`Produk uji: "${perJam.name}" ${perJam.price}/jam, "${paket.name}" ${paket.price}/paket\n`)

    // ── 1. Buat kode uji ──
    console.log('=== 1. Buat kode uji TEST10 (10%, unlimited, 5x/orang) ===')
    const { data: codeRow, error: codeErr } = await svc
      .from('discount_codes')
      .insert({ code: CODE, name: 'Kode Uji E2E 10%', type: 'percent', value: 10, quota: null, max_use_per_phone: 5, is_active: true })
      .select()
      .single()
    log(!codeErr && codeRow, `Kode ${CODE} dibuat (id=${codeRow?.id?.slice(0, 8)}...)`)
    if (codeErr) { console.log('STOP — gagal buat kode:', codeErr.message); return }
    testCodeId = codeRow.id

    // ── 2. RPC validasi ──
    console.log('\n=== 2. Validasi RPC (jalur persis form booking) ===')
    // 2a. Case-insensitive: ketik "test10" huruf kecil
    const r1 = await anon.rpc('validate_discount_code', { p_code: 'test10', p_booking_date: TEST_DATE, p_phone: TEST_PHONE, p_product_id: perJam.id, p_start_time: '09:00', p_end_time: '11:00' })
    const res1 = r1.data?.[0]
    log(!r1.error && res1?.ok === true, `Kode "test10" (lowercase) diterima → base=${res1?.base_price}, amount=${res1?.amount}`)
    const expBase = perJam.price * 2 // 09:00-11:00 = 2 jam
    const expAmt = Math.round(expBase * 0.1)
    log(res1?.base_price === expBase, `Harga dasar benar: ${res1?.base_price} (harus ${expBase} = 2 jam × ${perJam.price})`)
    log(res1?.amount === expAmt, `Potongan benar: ${res1?.amount} (harus ${expAmt} = 10%)`)

    // 2b. Kode salah
    const r2 = await anon.rpc('validate_discount_code', { p_code: 'GAKADA123', p_booking_date: TEST_DATE, p_phone: TEST_PHONE, p_product_id: perJam.id, p_start_time: '09:00', p_end_time: '11:00' })
    log(!r2.error && r2.data?.[0]?.ok === false && r2.data?.[0]?.err?.includes('tidak ditemukan'), `Kode salah ditolak: "${r2.data?.[0]?.err}"`)

    // 2c. Non-studio
    const senar = (await svc.from('products').select('id').eq('category', 'senar-gitar').limit(1)).data?.[0]
    if (senar) {
      const r3 = await anon.rpc('validate_discount_code', { p_code: CODE, p_booking_date: TEST_DATE, p_phone: TEST_PHONE, p_product_id: senar.id, p_start_time: null, p_end_time: null })
      log(!r3.error && r3.data?.[0]?.ok === false && r3.data?.[0]?.err?.includes('studio'), `Non-studio ditolak: "${r3.data?.[0]?.err}"`)
    }

    // 2d. Paket (base = harga paket)
    const r4 = await anon.rpc('validate_discount_code', { p_code: CODE, p_booking_date: TEST_DATE, p_phone: TEST_PHONE, p_product_id: paket.id, p_start_time: null, p_end_time: null })
    const res4 = r4.data?.[0]
    log(!r4.error && res4?.ok === true && res4?.base_price === paket.price && res4?.amount === Math.round(paket.price * 0.1), `Paket: base=${res4?.base_price} (harus ${paket.price}), amount=${res4?.amount}`)

    // ── 3. Booking dengan kode via anon (jalur persis halaman) ──
    console.log('\n=== 3. Insert booking valid (via anon, trigger memvalidasi) ===')
    async function insertBooking(overrides = {}, expectSuccess = true) {
      const base = perJam.price * 2
      const amount = Math.round(base * 0.1)
      const row = {
        customer_name: 'CUSTOMER E2E TEST',
        customer_phone: TEST_PHONE,
        customer_email: TEST_EMAIL,
        product_id: perJam.id,
        product_name: perJam.name,
        booking_code: genCode(),
        booking_date: TEST_DATE,
        start_time: '09:00',
        end_time: '11:00',
        total_price: base + (overrides.addon || 0) - amount,
        status: 'pending',
        payment_method: 'cash',
        discount_code_id: testCodeId,
        discount_code: CODE,
        discount_type: 'percent',
        discount_value: 10,
        discount_amount: amount,
        discount_base_price: base,
        ...overrides,
      }
      const { data, error } = await anon.from('bookings').insert(row).select('id,discount_code,discount_amount,discount_base_price,total_price')
      if (expectSuccess) {
        log(!error, `Booking diterima (${data?.[0]?.id?.slice(0, 8)}...) total=${data?.[0]?.total_price}`)
        if (data?.[0]) createdBookingIds.push(data[0].id)
        return data?.[0]
      } else {
        return { error }
      }
    }

    const b1 = await insertBooking()
    log(b1?.discount_code === CODE && b1?.discount_amount === expAmt && b1?.discount_base_price === expBase, `Snapshot tersimpan benar: ${b1?.discount_code} −${b1?.discount_amount} dari ${b1?.discount_base_price}`)

    // ── 4. Anti-manipulasi ──
    console.log('\n=== 4. Anti-manipulasi (harus DITOLAK trigger) ===')
    // 4a. Amount dipalsukan
    const bad1 = await insertBooking({ discount_amount: 1 }, false)
    log(bad1.error && bad1.error.message.includes('Nilai diskon'), `Amount palsu (Rp 1) ditolak ✓`)

    // 4b. Base diubah
    const bad2 = await insertBooking({ discount_base_price: 1000 }, false)
    log(bad2.error && bad2.error.message.includes('Harga dasar'), `Base palsu (1000) ditolak ✓`)

    // 4c. Stack dengan promo
    const promo = (await svc.from('promos').select('id,name').limit(1)).data?.[0]
    if (promo) {
      const bad3 = await insertBooking({ promo_id: promo.id, promo_name: promo.name }, false)
      log(bad3.error && bad3.error.message.includes('tidak bisa digabung'), `Stack dengan promo ditolak ✓`)
    } else {
      const base = perJam.price * 2
      const bad3 = await insertBooking({ promo_id: '00000000-0000-0000-0000-000000000000', promo_name: 'PROMO TEST' }, false)
      log(bad3.error, `Stack dengan promo ditolak ✓ (${bad3.error?.message || 'error'})`)
    }

    // ── 5. Limit 5x per nomor + kuota balik ──
    console.log('\n=== 5. Limit 5x per nomor WhatsApp ===')
    // b1 sudah terpakai (1)
    for (let i = 0; i < 4; i++) {
      const b = await insertBooking()
    }
    // Coba booking ke-6 (total) → harus ditolak
    const sixth = await insertBooking({}, false)
    log(sixth.error && sixth.error.message.includes('maksimal 5'), `Booking ke-6 ditolak (limit 5x): "${sixth.error?.message?.slice(0, 80)}"`)
    log(createdBookingIds.length === 5, `5 booking aktif tersimpan (${createdBookingIds.length})`)

    // 5b. Batalkan 1 booking → kuota balik → booking berikutnya berhasil
    const cancelId = createdBookingIds.shift()
    const { error: upErr } = await svc.from('bookings').update({ status: 'cancelled' }).eq('id', cancelId)
    log(!upErr, `1 booking dibatalkan (status=cancelled)`)
    const retry = await insertBooking()
    log(!!retry && !upErr, `Setelah dibatalkan, booking berikutnya diterima (kuota balik) ✓`)

    // ── 5c. Kuota total per kode (quota=3) ──
    console.log('\n=== 5c. Kuota total per kode ===')
    const { data: codeQ, error: errQ } = await svc
      .from('discount_codes')
      .insert({ code: 'TESTQ', name: 'Kode Uji Kuota', type: 'nominal', value: 25000, quota: 3, max_use_per_phone: 10, is_active: true })
      .select()
      .single()
    log(!errQ && !!codeQ, `Kode TESTQ dibuat (nominal Rp 25.000, quota 3)`)
    if (codeQ) {
      // validasi nominal: amount = min(25000, base 170000) = 25000
      const rq = await anon.rpc('validate_discount_code', { p_code: 'TESTQ', p_booking_date: TEST_DATE, p_phone: TEST_PHONE, p_product_id: perJam.id, p_start_time: '09:00', p_end_time: '11:00' })
      const resq = rq.data?.[0]
      log(!rq.error && resq?.ok === true && resq?.amount === 25000, `Nominal Rp 25.000 diterapkan benar (amount=${resq?.amount})`)

      for (let i = 0; i < 3; i++) {
        await insertBooking({
          discount_code_id: codeQ.id, discount_code: 'TESTQ', discount_type: 'nominal',
          discount_value: 25000, discount_amount: 25000, discount_base_price: perJam.price * 2,
        })
      }
      const q4 = await insertBooking({
        discount_code_id: codeQ.id, discount_code: 'TESTQ', discount_type: 'nominal',
        discount_value: 25000, discount_amount: 25000, discount_base_price: perJam.price * 2,
      }, false)
      log(q4.error && q4.error.message.includes('kuota maksimal'), `Booking ke-4 ditolak (kuota 3): "${q4.error?.message?.slice(0, 60)}"`)
      try { await svc.from('discount_codes').delete().eq('id', codeQ.id) } catch {}
    }

    // ── 5d. Periode berlaku (start date besok → ditolak hari ini) ──
    console.log('\n=== 5d. Periode start + end date ===')
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const { data: codeD, error: errD } = await svc
      .from('discount_codes')
      .insert({ code: 'TESTD', name: 'Kode Uji Periode', type: 'percent', value: 10, quota: null, max_use_per_phone: 5, start_date: tomorrow, end_date: null, is_active: true })
      .select()
      .single()
    log(!errD && !!codeD, `Kode TESTD dibuat (mulai ${tomorrow})`)
    if (codeD) {
      const today = new Date().toISOString().split('T')[0] // sebelum start_date
      const rdy = await anon.rpc('validate_discount_code', { p_code: 'TESTD', p_booking_date: today, p_phone: TEST_PHONE, p_product_id: perJam.id, p_start_time: '09:00', p_end_time: '11:00' })
      const resdy = rdy.data?.[0]
      const rdt = await anon.rpc('validate_discount_code', { p_code: 'TESTD', p_booking_date: tomorrow, p_phone: TEST_PHONE, p_product_id: perJam.id, p_start_time: '09:00', p_end_time: '11:00' })
      const resdt = rdt.data?.[0]
      log(!rdy.error && resdy?.ok === false && resdy?.err?.includes('mulai berlaku'), `Booking sebelum start_date ditolak: "${resdy?.err}"`)
      log(!rdt.error && resdt?.ok === true, `Booking di tanggal mulai diterima ✓`)
      // Verifikasi lewat TRIGGER juga (jalur insert persis seperti halaman booking)
      const baseD = perJam.price * 2
      const insD = await insertBooking({
        discount_code_id: codeD.id, discount_code: 'TESTD', discount_type: 'percent',
        discount_value: 10, discount_amount: Math.round(baseD * 0.1), discount_base_price: baseD,
        booking_date: today,
      }, false)
      log(insD.error && insD.error.message.includes('mulai berlaku'), `Trigger menolak booking sebelum start_date: "${insD.error?.message?.slice(0, 60)}"`)
      try { await svc.from('discount_codes').delete().eq('id', codeD.id) } catch {}
    }

    // ── 6. Bersihkan ──
    console.log('\n=== 6. Pembersihan data uji ===')
    const { error: delB } = await svc.from('bookings').delete().eq('customer_email', TEST_EMAIL)
    const { error: delC } = await svc.from('discount_codes').delete().eq('id', testCodeId)
    log(!delB && !delC, `Data uji dibersihkan (booking & kode ${CODE})`)

  } catch (err) {
    failed++
    console.log('❌ ERROR tak terduga:', err.message)
  } finally {
    // Pastikan bersih walau ada error
    try { await svc.from('bookings').delete().eq('customer_email', TEST_EMAIL) } catch {}
    try { if (testCodeId) await svc.from('discount_codes').delete().eq('id', testCodeId) } catch {}
    try { await svc.from('discount_codes').delete().in('code', ['TESTQ', 'TESTD']) } catch {}
    console.log(`\n══════════════════════════`)
    console.log(`HASIL: ${passed} ✅ lulus · ${failed} ❌ gagal`)
    console.log(`══════════════════════════`)
    process.exit(failed > 0 ? 1 : 0)
  }
}

main()