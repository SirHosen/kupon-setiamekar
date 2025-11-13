// Generate nomor kupon dari 0001 sampai 1000
export const generateCoupons = () => {
  const coupons = []
  for (let i = 1; i <= 1000; i++) {
    coupons.push(i.toString().padStart(4, '0'))
  }
  return coupons
}

// Format nomor ke format kupon (0001, 0002, dst)
export const formatKuponNumber = (number) => {
  return number.toString().padStart(4, '0')
}

// List Wijk
export const wijkList = [
  'Wijk Betlehem',
  'Wijk Jerusalem',
  'Wijk Galilea',
  'Wijk Sion',
  'Wijk Yudea',
  'Wijk Kana',
  'Wijk Efrata',
  'Wijk Betsaida',
  'Wijk Siloam',
  'Wijk Jerikho',
  'Wijk Bethania',
  'DLL'
]

// Kategori Pembelian
export const kategoriPembelian = [
  'Remaja',
  'Naposo',
  'DLL'
]

// Status Pembayaran
export const statusPembayaran = [
  'Lunas',
  'DP',
  'Belum Bayar'
]

// Harga per kupon (konstanta)
export const HARGA_PER_KUPON = 20000

// Status Penerimaan Kupon
export const statusPenerimaan = [
  'Diterima',
  'Belum Diterima'
]

// Format currency ke Rupiah
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format tanggal
export const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

// Export data ke CSV
export const exportToCSV = (data, filename) => {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let value = row[header]
        
        // Handle array (untuk nomor_kupon)
        if (Array.isArray(value)) {
          value = value.join('; ')
        }
        
        // Escape comma and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
