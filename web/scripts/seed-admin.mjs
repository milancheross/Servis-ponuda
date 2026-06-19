/**
 * Run: node scripts/seed-admin.mjs
 * Creates admin user in Supabase.
 * Requires .env.local with SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET
 */
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'

// Load .env.local manually
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('=').map(p => p.trim()))
)

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const email = 'milancheross@gmail.com'
const password = 'Admin123!'
const company_name = 'Milan Servis'

const password_hash = await bcrypt.hash(password, 10)

const { data, error } = await supabase
  .from('users')
  .upsert({ email, password_hash, company_name }, { onConflict: 'email' })
  .select('id, email, company_name')
  .single()

if (error) {
  console.error('Greška:', error.message)
} else {
  console.log('Admin korisnik kreiran:')
  console.log('  Email:', email)
  console.log('  Lozinka:', password)
  console.log('  ID:', data.id)
}
