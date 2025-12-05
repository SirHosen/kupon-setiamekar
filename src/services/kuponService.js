import { supabase } from './supabaseClient'

// PRODUCTION WARNING: Use proper backend authentication!
// This client-side hash is NOT secure for production use.
// Implement server-side authentication with bcrypt/argon2 + JWT tokens
async function simpleHash(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ===== AUTH SERVICE =====
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

export const authService = {
  // Login dengan username dan password
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Username dan password harus diisi')
    }

    try {
      // Cari user berdasarkan username
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .single()

      if (error || !user) {
        throw new Error('Username atau password salah')
      }

      // Hash password yang diinput
      const hashedPassword = await simpleHash(password)
      
      // Verifikasi password
      if (hashedPassword !== user.password) {
        throw new Error('Username atau password salah')
      }

      // Simpan ke localStorage dengan timestamp
      const sessionData = {
        id: user.id,
        username: user.username,
        role: user.role,
        loginTime: Date.now()
      }
      
      localStorage.setItem('user', JSON.stringify(sessionData))
      localStorage.setItem('sessionStart', Date.now().toString())

      return user
    } catch (error) {
      if (error.message === 'Username atau password salah') {
        throw error
      }
      console.error('Login error:', error)
      throw new Error('Terjadi kesalahan saat login. Silakan coba lagi.')
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('user')
    localStorage.removeItem('sessionStart')
  },

  // Get current user dengan session check
  getCurrentUser() {
    const userStr = localStorage.getItem('user')
    const sessionStart = localStorage.getItem('sessionStart')
    
    if (!userStr || !sessionStart) {
      return null
    }

    // Check session timeout
    const sessionAge = Date.now() - parseInt(sessionStart)
    if (sessionAge > SESSION_TIMEOUT) {
      this.logout()
      return null
    }

    try {
      return JSON.parse(userStr)
    } catch (error) {
      console.error('Error parsing user data:', error)
      this.logout()
      return null
    }
  },

  // Check if session is still valid
  isSessionValid() {
    const sessionStart = localStorage.getItem('sessionStart')
    if (!sessionStart) return false
    
    const sessionAge = Date.now() - parseInt(sessionStart)
    return sessionAge <= SESSION_TIMEOUT
  }
}

// ===== KUPON SERVICE =====
export const kuponService = {
  // Get semua kupon
  async getAllKupons() {
    try {
      const { data, error } = await supabase
        .from('kupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching kupons:', error)
      throw new Error('Gagal memuat data kupon. Silakan refresh halaman.')
    }
  },

  // Get kupon by ID
  async getKuponById(id) {
    const { data, error } = await supabase
      .from('kupons')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Tambah kupon baru
  async createKupon(kuponData) {
    try {
      // Validasi basic
      if (!kuponData.wijk) {
        throw new Error('Wijk harus diisi')
      }
      if (!kuponData.nama_keluarga && !kuponData.nama_remaja) {
        throw new Error('Minimal salah satu nama harus diisi')
      }

      const { data, error } = await supabase
        .from('kupons')
        .insert([kuponData])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Gagal menyimpan data kupon')
      }
      
      return data?.[0] || data
    } catch (error) {
      console.error('Error creating kupon:', error)
      throw error
    }
  },

  // Update kupon
  async updateKupon(id, kuponData) {
    try {
      if (!id) {
        throw new Error('ID kupon tidak valid')
      }

      const { data, error } = await supabase
        .from('kupons')
        .update(kuponData)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Gagal update data kupon')
      }
      
      return data?.[0] || data
    } catch (error) {
      console.error('Error updating kupon:', error)
      throw error
    }
  },

  // Delete kupon
  async deleteKupon(id) {
    try {
      if (!id) {
        throw new Error('ID kupon tidak valid')
      }

      const { error } = await supabase
        .from('kupons')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase error:', error)
        throw new Error('Gagal menghapus data kupon')
      }
    } catch (error) {
      console.error('Error deleting kupon:', error)
      throw error
    }
  },

  // Get kupon yang sudah digunakan
  async getUsedKuponNumbers() {
    try {
      const { data, error } = await supabase
        .from('kupons')
        .select('nomor_kupon')

      if (error) throw error
      
      // Flatten array karena sekarang nomor_kupon adalah array
      const allNumbers = []
      if (data && Array.isArray(data)) {
        data.forEach(k => {
          if (Array.isArray(k.nomor_kupon)) {
            allNumbers.push(...k.nomor_kupon)
          } else if (k.nomor_kupon) {
            allNumbers.push(k.nomor_kupon)
          }
        })
      }
      return allNumbers
    } catch (error) {
      console.error('Error fetching used kupons:', error)
      return [] // Return empty array on error untuk prevent crash
    }
  },

  // Get statistik
  async getStatistics() {
    try {
      const { data: kupons, error } = await supabase
        .from('kupons')
        .select('*')

      if (error) throw error

      const kuponList = kupons || []

      // Total Partisipan = jumlah total transaksi (bukan keluarga unik)
      const totalPartisipan = kuponList.length
      
      // Hitung total kupon dari jumlah_kupon atau array length
      const totalKupon = kuponList.reduce((sum, k) => {
        const count = k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)
        return sum + count
      }, 0)
      
      const totalLunas = kuponList
        .filter(k => k.status_pembayaran === 'Lunas')
        .reduce((sum, k) => {
          const count = k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)
          return sum + count
        }, 0)
      
      const totalDP = kuponList
        .filter(k => k.status_pembayaran === 'DP')
        .reduce((sum, k) => {
          const count = k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)
          return sum + count
        }, 0)
      
      const totalBelumBayar = kuponList
        .filter(k => k.status_pembayaran === 'Belum Bayar' || k.status_pembayaran === 'Belum Lunas')
        .reduce((sum, k) => {
          const count = k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)
          return sum + count
        }, 0)
      
      // Total pemasukan: Lunas (positif penuh) + DP (jumlah dibayar saja)
      const totalPemasukan = kuponList.reduce((sum, k) => {
        if (k.status_pembayaran === 'Lunas') {
          return sum + Math.abs(k.harga || 0) // Ambil nilai absolut
        } else if (k.status_pembayaran === 'DP') {
          return sum + (k.jumlah_dibayar || 0) // Ambil jumlah yang sudah dibayar
        }
        return sum // Belum Bayar tidak dihitung
      }, 0)

      // Statistik penerimaan kupon
      const totalDiterima = kuponList
        .filter(k => k.status_penerimaan === 'Diterima')
        .reduce((sum, k) => {
          const count = k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)
          return sum + count
        }, 0)
      
      const totalBelumDiterima = kuponList
        .filter(k => k.status_penerimaan === 'Belum Diterima' || !k.status_penerimaan)
        .reduce((sum, k) => {
          const count = k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)
          return sum + count
        }, 0)

      return {
        totalPartisipan,
        totalKupon,
        totalLunas,
        totalDP,
        totalBelumLunas: totalBelumBayar, // Backward compatible
        totalPemasukan,
        totalDiterima,
        totalBelumDiterima
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
      // Return default values on error
      return {
        totalPartisipan: 0,
        totalKupon: 0,
        totalLunas: 0,
        totalDP: 0,
        totalBelumLunas: 0,
        totalPemasukan: 0,
        totalDiterima: 0,
        totalBelumDiterima: 0
      }
    }
  }
}

// ===== UNDIAN SERVICE =====
export const undianService = {
  // Get kupon yang bisa diundi (status Lunas DAN Diterima)
  async getEligibleKupons() {
    try {
      const { data, error } = await supabase
        .from('kupons')
        .select('*')
        .eq('status_pembayaran', 'Lunas')
        .eq('status_penerimaan', 'Diterima') // CRITICAL: Hanya kupon yang sudah diterima

      if (error) throw error
      
      const kupons = data || []
      
      // Hitung total kupon (bukan total record)
      const totalKuponLunas = kupons.reduce((sum, k) => {
        return sum + (k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1))
      }, 0)
      
      return { data: kupons, totalKuponLunas }
    } catch (error) {
      console.error('Error fetching eligible kupons:', error)
      throw new Error('Gagal memuat data kupon untuk undian')
    }
  },

  // Undi kupon secara acak
  async drawRandomKupon() {
    try {
      const { data: eligibleKupons } = await this.getEligibleKupons()
      
      if (!eligibleKupons || eligibleKupons.length === 0) {
        throw new Error('Tidak ada kupon yang berstatus Lunas dan Diterima untuk diundi')
      }

      // Get nomor kupon yang sudah menang
      const { data: winners } = await supabase
        .from('winners')
        .select('nomor_kupon')
      const wonNumbers = winners ? winners.map(w => w.nomor_kupon) : []

      // Flatten semua nomor kupon dari record yang Lunas dan belum menang
      const allEligibleNumbers = []
      eligibleKupons.forEach(kupon => {
        const numbers = Array.isArray(kupon.nomor_kupon) ? kupon.nomor_kupon : [kupon.nomor_kupon]
        numbers.forEach(num => {
          // Skip jika nomor sudah pernah menang atau nomor kosong
          if (num && !wonNumbers.includes(num)) {
            allEligibleNumbers.push({
              nomor_kupon: num,
              nama_keluarga: kupon.nama_keluarga || '',
              nama_remaja: kupon.nama_remaja || '',
              kategori_pembelian: kupon.kategori_pembelian || '',
              wijk: kupon.wijk || '',
              harga: kupon.harga || 0,
            })
          }
        })
      })

      if (allEligibleNumbers.length === 0) {
        throw new Error('Semua kupon yang memenuhi syarat sudah pernah menang')
      }

      const randomIndex = Math.floor(Math.random() * allEligibleNumbers.length)
      return allEligibleNumbers[randomIndex]
    } catch (error) {
      console.error('Error drawing kupon:', error)
      throw error
    }
  },

  // Simpan pemenang
  async saveWinner(kupon) {
    try {
      if (!kupon || !kupon.nomor_kupon) {
        throw new Error('Data kupon tidak valid')
      }

      const winnerData = {
        nomor_kupon: kupon.nomor_kupon,
        nama_keluarga: kupon.nama_keluarga || '',
        nama_remaja: kupon.nama_remaja || '',
        kategori_pembelian: kupon.kategori_pembelian || '',
        wijk: kupon.wijk || '',
      }

      const { data, error } = await supabase
        .from('winners')
        .insert([winnerData])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error('Gagal menyimpan pemenang')
      }
      
      return data?.[0] || data
    } catch (error) {
      console.error('Error saving winner:', error)
      throw error
    }
  }
}

// ===== WINNER SERVICE =====
export const winnerService = {
  // Get semua pemenang
  async getAllWinners() {
    try {
      const { data, error } = await supabase
        .from('winners')
        .select('*')
        .order('waktu_undi', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching winners:', error)
      throw new Error('Gagal memuat data pemenang')
    }
  },

  // Delete pemenang
  async deleteWinner(id) {
    try {
      if (!id) {
        throw new Error('ID pemenang tidak valid')
      }

      const { error } = await supabase
        .from('winners')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase error:', error)
        throw new Error('Gagal menghapus pemenang')
      }
    } catch (error) {
      console.error('Error deleting winner:', error)
      throw error
    }
  }
}
