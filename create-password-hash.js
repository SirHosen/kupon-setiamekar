import crypto from 'crypto'

// Function untuk hash password dengan SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Daftar password yang ingin di-hash
const passwords = [
  { username: 'hosea', password: 'hosea123' },
  { username: 'bgyos', password: 'neslitehijau' },
  { username: 'sianturi', password: 'sianturi' },
]

console.log('='.repeat(60))
console.log('HASH PASSWORD UNTUK SUPABASE')
console.log('='.repeat(60))
console.log()

passwords.forEach(({ username, password }) => {
  const hash = hashPassword(password)
  console.log(`Username: ${username}`)
  console.log(`Password: ${password}`)
  console.log(`Hash: ${hash}`)
  console.log()
  console.log(`SQL Query:`)
  console.log(`INSERT INTO users (username, password, role) VALUES ('${username}', '${hash}', 'panitia');`)
  console.log('-'.repeat(60))
  console.log()
})

console.log('Copy SQL query di atas dan jalankan di Supabase SQL Editor')
console.log('='.repeat(60))
