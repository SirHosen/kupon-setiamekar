import { supabase } from './supabaseClient'

// Simple hash function untuk development (ganti dengan proper solution di production)
async function simpleHash(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ===== AUTH SERVICE =====
export const authService = {
  // Login dengan username dan password
  async login(username, password) {
    // Cari user berdasarkan username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
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

    // Simpan ke localStorage
    localStorage.setItem('user', JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role
    }))

    return user
  },

  // Logout
  logout() {
    localStorage.removeItem('user')
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }
}

// ===== KUPON SERVICE =====
export const kuponService = {
  // Get semua kupon
  async getAllKupons() {
    const { data, error } = await supabase
      .from('kupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
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
    // nomor_kupon sekarang adalah array, validasi akan dilakukan oleh trigger database
    const { data, error } = await supabase
      .from('kupons')
      .insert([kuponData])
      .select()

    if (error) throw error
    return data[0]
  },

  // Update kupon
  async updateKupon(id, kuponData) {
    // Validasi akan dilakukan oleh trigger database
    const { data, error } = await supabase
      .from('kupons')
      .update(kuponData)
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0]
  },

  // Delete kupon
  async deleteKupon(id) {
    const { error } = await supabase
      .from('kupons')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get kupon yang sudah digunakan
  async getUsedKuponNumbers() {
    const { data, error } = await supabase
      .from('kupons')
      .select('nomor_kupon')

    if (error) throw error
    
    // Flatten array karena sekarang nomor_kupon adalah array
    const allNumbers = []
    data.forEach(k => {
      if (Array.isArray(k.nomor_kupon)) {
        allNumbers.push(...k.nomor_kupon)
      } else {
        allNumbers.push(k.nomor_kupon)
      }
    })
    return allNumbers
  },

  // Get statistik
  async getStatistics() {
    const { data: kupons } = await supabase
      .from('kupons')
      .select('*')

    // Total Partisipan = jumlah total transaksi (bukan keluarga unik)
    const totalPartisipan = kupons?.length || 0
    
    // Hitung total kupon dari jumlah_kupon atau array length
    const totalKupon = kupons?.reduce((sum, k) => {
      return sum + (k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1))
    }, 0) || 0
    
    const totalLunas = kupons?.filter(k => k.status_pembayaran === 'Lunas')
      .reduce((sum, k) => sum + (k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)), 0) || 0
    
    const totalDP = kupons?.filter(k => k.status_pembayaran === 'DP')
      .reduce((sum, k) => sum + (k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)), 0) || 0
    
    const totalBelumBayar = kupons?.filter(k => k.status_pembayaran === 'Belum Bayar' || k.status_pembayaran === 'Belum Lunas')
      .reduce((sum, k) => sum + (k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)), 0) || 0
    
    // Total pemasukan: Lunas (positif penuh) + DP (jumlah dibayar saja)
    const totalPemasukan = kupons?.reduce((sum, k) => {
      if (k.status_pembayaran === 'Lunas') {
        return sum + Math.abs(k.harga || 0) // Ambil nilai absolut
      } else if (k.status_pembayaran === 'DP') {
        return sum + (k.jumlah_dibayar || 0) // Ambil jumlah yang sudah dibayar
      }
      return sum // Belum Bayar tidak dihitung
    }, 0) || 0

    // Statistik penerimaan kupon
    const totalDiterima = kupons?.filter(k => k.status_penerimaan === 'Diterima')
      .reduce((sum, k) => sum + (k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)), 0) || 0
    
    const totalBelumDiterima = kupons?.filter(k => k.status_penerimaan === 'Belum Diterima' || !k.status_penerimaan)
      .reduce((sum, k) => sum + (k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1)), 0) || 0

    return {
      totalPartisipan, // Jumlah transaksi
      totalKupon,
      totalLunas,
      totalDP,
      totalBelumLunas: totalBelumBayar, // Backward compatible
      totalPemasukan,
      totalDiterima,
      totalBelumDiterima
    }
  }
}

// ===== UNDIAN SERVICE =====
export const undianService = {
  // Get kupon yang bisa diundi (status Lunas DAN Diterima)
  async getEligibleKupons() {
    const { data, error } = await supabase
      .from('kupons')
      .select('*')
      .eq('status_pembayaran', 'Lunas')
      .eq('status_penerimaan', 'Diterima') // CRITICAL: Hanya kupon yang sudah diterima

    if (error) throw error
    
    // Hitung total kupon (bukan total record)
    const totalKuponLunas = data?.reduce((sum, k) => {
      return sum + (k.jumlah_kupon || (Array.isArray(k.nomor_kupon) ? k.nomor_kupon.length : 1))
    }, 0) || 0
    
    return { data, totalKuponLunas }
  },

  // Undi kupon secara acak
  async drawRandomKupon() {
    const { data: eligibleKupons } = await this.getEligibleKupons()
    
    if (eligibleKupons.length === 0) {
      throw new Error('Tidak ada kupon yang berstatus Lunas untuk diundi')
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
        // Skip jika nomor sudah pernah menang
        if (!wonNumbers.includes(num)) {
          allEligibleNumbers.push({
            nomor_kupon: num,
            nama_keluarga: kupon.nama_keluarga,
            nama_remaja: kupon.nama_remaja,
            kategori_pembelian: kupon.kategori_pembelian,
            wijk: kupon.wijk,
            harga: kupon.harga,
          })
        }
      })
    })

    if (allEligibleNumbers.length === 0) {
      throw new Error('Tidak ada nomor kupon yang tersedia untuk diundi (semua sudah menang atau sudah diundi)')
    }

    const randomIndex = Math.floor(Math.random() * allEligibleNumbers.length)
    return allEligibleNumbers[randomIndex]
  },

  // Simpan pemenang
  async saveWinner(kupon) {
    const winnerData = {
      nomor_kupon: kupon.nomor_kupon,
      nama_keluarga: kupon.nama_keluarga,
      nama_remaja: kupon.nama_remaja,
      kategori_pembelian: kupon.kategori_pembelian,
      wijk: kupon.wijk,
    }

    const { data, error } = await supabase
      .from('winners')
      .insert([winnerData])
      .select()

    if (error) throw error
    return data[0]
  }
}

// ===== WINNER SERVICE =====
export const winnerService = {
  // Get semua pemenang
  async getAllWinners() {
    const { data, error } = await supabase
      .from('winners')
      .select('*')
      .order('waktu_undi', { ascending: false })

    if (error) throw error
    return data
  },

  // Delete pemenang
  async deleteWinner(id) {
    const { error } = await supabase
      .from('winners')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
