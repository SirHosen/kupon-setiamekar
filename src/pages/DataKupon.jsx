import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import DataTable from '../components/DataTable'
import { kuponService } from '../services/kuponService'
import { wijkList, statusPembayaran, statusPenerimaan, kategoriPembelian, formatCurrency, HARGA_PER_KUPON } from '../utils/helpers'
import { Plus, Search, X, List, Grid } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const DataKupon = () => {
  const [kupons, setKupons] = useState([])
  const [usedCoupons, setUsedCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingKupon, setEditingKupon] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterWijk, setFilterWijk] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPenerimaan, setFilterPenerimaan] = useState('')
  const [viewMode, setViewMode] = useState('table') // 'table' atau 'list'
  const [filterKuponStatus, setFilterKuponStatus] = useState('all') // 'all', 'taken', 'available'
  const [isBookingMode, setIsBookingMode] = useState(false) // Toggle antara Tambah Kupon dan Booking

  const [formData, setFormData] = useState({
    nama_keluarga: '',
    nama_remaja: '',
    kategori_pembelian: 'Remaja', // Default Remaja
    nomor_kupon_input: '', // Input untuk nomor kupon (bisa range atau list)
    wijk: '',
    harga: 0, // Akan dihitung otomatis
    jumlah_dibayar: 0, // Untuk DP
    jumlah_kupon_booking: 0, // Untuk booking mode
    status_pembayaran: 'Belum Bayar',
    status_penerimaan: 'Belum Diterima', // Default belum diterima
  })
  
  const [jumlahKupon, setJumlahKupon] = useState(0) // Track jumlah kupon untuk perhitungan

  useEffect(() => {
    loadData()
  }, [])

  // Auto-calculate jumlah kupon saat input nomor berubah
  useEffect(() => {
    if (formData.nomor_kupon_input.trim()) {
      try {
        const parsed = parseKuponInput(formData.nomor_kupon_input)
        setJumlahKupon(parsed.length)
      } catch {
        setJumlahKupon(0)
      }
    } else {
      setJumlahKupon(0)
    }
  }, [formData.nomor_kupon_input])

  // Fungsi untuk format harga dengan warna
  const getHargaColor = (status) => {
    if (status === 'Lunas') return 'text-green-600'
    if (status === 'DP') return 'text-yellow-600'
    return 'text-red-600' // Belum Bayar
  }

  const loadData = async () => {
    try {
      const [kuponsData, usedNumbers] = await Promise.all([
        kuponService.getAllKupons(),
        kuponService.getUsedKuponNumbers(),
      ])
      setKupons(kuponsData)
      setUsedCoupons(usedNumbers)
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Gagal memuat data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk parse input kupon
  // Support format: 1, 2, 3 atau 1-5 atau kombinasi: 1-3, 5, 7-9
  const parseKuponInput = (input) => {
    const numbers = new Set()
    const parts = input.split(',').map(p => p.trim())
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Range: 1-5
        const [start, end] = part.split('-').map(n => parseInt(n.trim()))
        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Format tidak valid: ${part}`)
        }
        if (start < 1 || end > 1000 || start > end) {
          throw new Error(`Range tidak valid: ${part}. Range harus 1-1000 dan start <= end`)
        }
        for (let i = start; i <= end; i++) {
          numbers.add(i)
        }
      } else {
        // Single number
        const num = parseInt(part.trim())
        if (isNaN(num)) {
          throw new Error(`Nomor tidak valid: ${part}`)
        }
        if (num < 1 || num > 1000) {
          throw new Error(`Nomor ${num} di luar range 1-1000`)
        }
        numbers.add(num)
      }
    }
    
    return Array.from(numbers).sort((a, b) => a - b)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validasi: minimal salah satu harus diisi (keluarga atau remaja)
    if (!formData.nama_keluarga.trim() && !formData.nama_remaja.trim()) {
      alert('Harap isi minimal Nama Keluarga atau Nama Remaja/Naposo!')
      return
    }

    try {
      let formattedNumbers = []
      let jumlahKuponFinal = 0
      let hargaFinal = 0
      let jumlahDibayarFinal = 0
      
      if (isBookingMode) {
        // BOOKING MODE: Different logic per status
        formattedNumbers = [] // Empty array for booking
        jumlahKuponFinal = formData.jumlah_kupon_booking || 0
        
        if (jumlahKuponFinal <= 0) {
          alert('Jumlah kupon harus lebih dari 0!')
          return
        }
        
        const totalHarga = jumlahKuponFinal * HARGA_PER_KUPON
        
        if (formData.status_pembayaran === 'Lunas') {
          // Lunas: Payment determines quantity (already calculated in form)
          hargaFinal = formData.jumlah_dibayar
          jumlahDibayarFinal = formData.jumlah_dibayar
          
          // Recalculate quantity to ensure consistency
          jumlahKuponFinal = Math.floor(formData.jumlah_dibayar / HARGA_PER_KUPON)
          
          if (jumlahKuponFinal <= 0) {
            alert('Jumlah pembayaran tidak cukup untuk 1 kupon!')
            return
          }
        } else if (formData.status_pembayaran === 'DP') {
          // DP: Payment + quantity entered, calculate remaining
          if (formData.jumlah_dibayar <= 0) {
            alert('Jumlah DP harus lebih dari 0!')
            return
          }
          if (formData.jumlah_dibayar >= totalHarga) {
            alert('Jumlah DP tidak boleh sama atau lebih dari total harga. Pilih status "Lunas".')
            return
          }
          hargaFinal = formData.jumlah_dibayar
          jumlahDibayarFinal = formData.jumlah_dibayar
        } else { // Belum Bayar
          // Belum Bayar: Quantity entered, calculate total debt
          hargaFinal = -totalHarga
          jumlahDibayarFinal = 0
        }
        
        // Booking otomatis belum diterima
        formData.status_penerimaan = 'Belum Diterima'
        
      } else {
        // NORMAL MODE: Enter kupon numbers
        if (!formData.nomor_kupon_input.trim()) {
          alert('Harap masukkan nomor kupon!')
          return
        }
        
        // Parse nomor kupon
        const kuponNumbers = parseKuponInput(formData.nomor_kupon_input)
        
        if (kuponNumbers.length === 0) {
          alert('Tidak ada nomor kupon yang valid!')
          return
        }

        // Format nomor kupon dengan leading zeros
        formattedNumbers = kuponNumbers.map(n => n.toString().padStart(4, '0'))
        jumlahKuponFinal = formattedNumbers.length

        // Cek kupon yang sudah digunakan
        const alreadyUsed = formattedNumbers.filter(num => 
          usedCoupons.includes(num)
        )
        
        if (alreadyUsed.length > 0 && !editingKupon) {
          alert(`Nomor kupon berikut sudah digunakan: ${alreadyUsed.join(', ')}`)
          return
        }

        // Konfirmasi jika banyak kupon
        if (formattedNumbers.length > 1) {
          const confirm = window.confirm(
            `Anda akan menambahkan data dengan ${formattedNumbers.length} kupon:\n${formattedNumbers.join(', ')}\n\nLanjutkan?`
          )
          if (!confirm) return
        }
        
        // Calculate price based on payment status
        const totalHarga = formattedNumbers.length * HARGA_PER_KUPON
        
        if (formData.status_pembayaran === 'Lunas') {
          hargaFinal = totalHarga
          jumlahDibayarFinal = 0
        } else if (formData.status_pembayaran === 'DP') {
          if (formData.jumlah_dibayar <= 0) {
            alert('Jumlah DP harus lebih dari 0!')
            return
          }
          if (formData.jumlah_dibayar > totalHarga) {
            alert(`Jumlah DP tidak boleh melebihi total harga (${formatCurrency(totalHarga)})`)
            return
          }
          hargaFinal = formData.jumlah_dibayar
          jumlahDibayarFinal = formData.jumlah_dibayar
        } else { // Belum Bayar
          hargaFinal = -totalHarga
          jumlahDibayarFinal = 0
        }
      }

      // Buat data kupon
      const kuponData = {
        nama_keluarga: formData.nama_keluarga,
        nama_remaja: formData.nama_remaja,
        kategori_pembelian: formData.kategori_pembelian,
        nomor_kupon: formattedNumbers, // Empty array for booking, filled for normal
        jumlah_kupon: jumlahKuponFinal,
        wijk: formData.wijk,
        harga: hargaFinal,
        jumlah_dibayar: jumlahDibayarFinal,
        status_pembayaran: formData.status_pembayaran,
        status_penerimaan: formData.status_penerimaan,
      }
      
      if (editingKupon) {
        await kuponService.updateKupon(editingKupon.id, kuponData)
        alert('Data berhasil diupdate!')
      } else {
        const message = isBookingMode
          ? `Berhasil menambahkan booking untuk ${jumlahKuponFinal} kupon!`
          : `Berhasil menambahkan data dengan ${formattedNumbers.length} kupon!`
        await kuponService.createKupon(kuponData)
        alert(message)
      }
      
      await loadData()
      closeModal()
    } catch (error) {
      alert(error.message)
    }
  }

  const handleEdit = (kupon) => {
    setEditingKupon(kupon)
    
    // Check if this is a booking record (empty nomor_kupon array)
    const isBookingRecord = Array.isArray(kupon.nomor_kupon) && kupon.nomor_kupon.length === 0
    
    // nomor_kupon sekarang array, join jadi string untuk edit
    const kuponInput = Array.isArray(kupon.nomor_kupon) 
      ? kupon.nomor_kupon.join(', ') 
      : kupon.nomor_kupon
    
    setIsBookingMode(isBookingRecord)
    setFormData({
      nama_keluarga: kupon.nama_keluarga,
      nama_remaja: kupon.nama_remaja,
      kategori_pembelian: kupon.kategori_pembelian || 'Remaja',
      nomor_kupon_input: kuponInput,
      wijk: kupon.wijk,
      harga: kupon.harga,
      jumlah_dibayar: kupon.jumlah_dibayar || 0,
      jumlah_kupon_booking: kupon.jumlah_kupon || 0,
      status_pembayaran: kupon.status_pembayaran,
      status_penerimaan: kupon.status_penerimaan || 'Belum Diterima',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return
    try {
      await kuponService.deleteKupon(id)
      await loadData()
    } catch (error) {
      alert('Gagal menghapus: ' + error.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingKupon(null)
    setIsBookingMode(false)
    setJumlahKupon(0)
    setFormData({
      nama_keluarga: '',
      nama_remaja: '',
      kategori_pembelian: 'Remaja',
      nomor_kupon_input: '',
      wijk: '',
      harga: 0,
      jumlah_dibayar: 0,
      jumlah_kupon_booking: 0,
      status_pembayaran: 'Belum Bayar',
      status_penerimaan: 'Belum Diterima',
    })
  }

  // Filter data
  const filteredKupons = kupons.filter((kupon) => {
    // Handle array atau string untuk nomor_kupon
    const kuponNumbers = Array.isArray(kupon.nomor_kupon) 
      ? kupon.nomor_kupon.join(' ') 
      : kupon.nomor_kupon
    
    const matchSearch =
      kupon.nama_keluarga.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kupon.nama_remaja.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kuponNumbers.includes(searchTerm)
    const matchWijk = !filterWijk || kupon.wijk === filterWijk
    const matchPenerimaan = !filterPenerimaan || kupon.status_penerimaan === filterPenerimaan
    const matchStatus = !filterStatus || kupon.status_pembayaran === filterStatus
    return matchSearch && matchWijk && matchStatus && matchPenerimaan
  })

  // Generate expanded list untuk list view (kupon per nomor) dengan filter terintegrasi
  const getExpandedKuponList = () => {
    const expanded = []
    
    // Semua kupon yang sudah terisi DARI FILTERED KUPONS (sudah ter-filter)
    filteredKupons.forEach(kupon => {
      const numbers = Array.isArray(kupon.nomor_kupon) ? kupon.nomor_kupon : [kupon.nomor_kupon]
      numbers.forEach(num => {
        expanded.push({
          nomor: num,
          nama_keluarga: kupon.nama_keluarga,
          nama_remaja: kupon.nama_remaja,
          wijk: kupon.wijk,
          status_pembayaran: kupon.status_pembayaran,
          status_penerimaan: kupon.status_penerimaan,
          isTaken: true
        })
      })
    })
    
    // Jika filter 'available', tambahkan kupon yang belum terisi
    if (filterKuponStatus === 'available' || filterKuponStatus === 'all') {
      for (let i = 1; i <= 1000; i++) {
        const formatted = String(i).padStart(4, '0')
        if (!usedCoupons.includes(formatted)) {
          expanded.push({
            nomor: formatted,
            nama_keluarga: '-',
            nama_remaja: '-',
            wijk: '-',
            status_pembayaran: '-',
            status_penerimaan: '-',
            isTaken: false
          })
        }
      }
    }
    
    // Filter by kupon status (taken/available)
    let filtered = expanded
    if (filterKuponStatus === 'taken') {
      filtered = expanded.filter(k => k.isTaken)
    } else if (filterKuponStatus === 'available') {
      filtered = expanded.filter(k => !k.isTaken)
    }
    
    // Sort by nomor
    return filtered.sort((a, b) => a.nomor.localeCompare(b.nomor))
  }

  const columns = [
    { header: 'No', render: (_, index) => <span className="text-sm text-gray-900">{index + 1}</span> },
    { 
      header: 'Nomor Kupon', 
      key: 'nomor_kupon', 
      render: (row) => {
        // nomor_kupon sekarang array
        if (Array.isArray(row.nomor_kupon)) {
          // Booking record: empty array
          if (row.nomor_kupon.length === 0) {
            return (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                BOOKING
              </span>
            )
          }
          if (row.nomor_kupon.length <= 3) {
            return <span className="font-mono font-semibold text-primary-600">{row.nomor_kupon.join(', ')}</span>
          }
          return (
            <span className="font-mono font-semibold text-primary-600">
              {row.nomor_kupon.slice(0, 3).join(', ')}
              <span className="text-gray-500 ml-1">+{row.nomor_kupon.length - 3}</span>
            </span>
          )
        }
        return <span className="font-mono font-semibold text-primary-600">{row.nomor_kupon}</span>
      }
    },
    { 
      header: 'Jumlah', 
      key: 'jumlah_kupon',
      render: (row) => (
        <span className="text-sm font-medium text-gray-900">
          {row.jumlah_kupon || (Array.isArray(row.nomor_kupon) ? row.nomor_kupon.length : 1)} kupon
        </span>
      )
    },
    { 
      header: 'Keluarga', 
      key: 'nama_keluarga',
      render: (row) => <span className="text-sm text-gray-900">{row.nama_keluarga || '-'}</span>
    },
    { 
      header: 'Remaja/Naposo', 
      key: 'nama_remaja',
      render: (row) => {
        const nama = row.nama_remaja || '-'
        const kategori = row.kategori_pembelian
        if (nama !== '-' && kategori) {
          return <span className="text-sm text-gray-900">{nama} <span className="text-xs text-gray-500">({kategori})</span></span>
        }
        return <span className="text-sm text-gray-900">{nama}</span>
      }
    },
    { header: 'Wijk', key: 'wijk' },
    { 
      header: 'Harga', 
      key: 'harga', 
      render: (row) => {
        const hargaColor = getHargaColor(row.status_pembayaran)
        return <span className={`text-sm font-semibold ${hargaColor}`}>{formatCurrency(row.harga)}</span>
      }
    },
    {
      header: 'Status',
      key: 'status_pembayaran',
      render: (row) => {
        const statusColors = {
          'Lunas': 'bg-green-100 text-green-800',
          'DP': 'bg-yellow-100 text-yellow-800',
          'Belum Bayar': 'bg-red-100 text-red-800',
          'Belum Lunas': 'bg-red-100 text-red-800', // backward compatible
        }
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[row.status_pembayaran]}`}>
            {row.status_pembayaran}
          </span>
        )
      },
    },
    {
      header: 'Penerimaan',
      key: 'status_penerimaan',
      render: (row) => {
        const penerimaanColors = {
          'Diterima': 'bg-blue-100 text-blue-800',
          'Belum Diterima': 'bg-gray-100 text-gray-800',
        }
        const status = row.status_penerimaan || 'Belum Diterima'
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${penerimaanColors[status]}`}>
            {status}
          </span>
        )
      },
    },
    { header: 'Tanggal', key: 'created_at' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Data Kupon</h1>
            <p className="text-gray-600 mt-1">Kelola data kupon undian</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 sm:mt-0 flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Tambah Kupon</span>
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Tampilan Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Tampilan List Per Nomor</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau nomor kupon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select value={filterWijk} onChange={(e) => setFilterWijk(e.target.value)} className="input-field">
              <option value="">Semua Wijk</option>
              {wijkList.map((wijk) => (
                <option key={wijk} value={wijk}>
                  {wijk}
                </option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field">
              <option value="">Semua Status Bayar</option>
              {statusPembayaran.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select value={filterPenerimaan} onChange={(e) => setFilterPenerimaan(e.target.value)} className="input-field">
              <option value="">Semua Penerimaan</option>
              {statusPenerimaan.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filter untuk list view */}
          {viewMode === 'list' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status Kupon</label>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setFilterKuponStatus('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterKuponStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Semua Kupon
                </button>
                <button
                  onClick={() => setFilterKuponStatus('taken')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterKuponStatus === 'taken'
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Sudah Terisi
                </button>
                <button
                  onClick={() => setFilterKuponStatus('available')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterKuponStatus === 'available'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  Belum Terisi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <DataTable data={filteredKupons} columns={columns} onEdit={handleEdit} onDelete={handleDelete} />
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                List Kupon Per Nomor ({getExpandedKuponList().length} kupon)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nomor Kupon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keluarga
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaja/Naposo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wijk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Bayar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Terima
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getExpandedKuponList().map((item, index) => (
                    <tr key={item.nomor} className={item.isTaken ? '' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-mono font-semibold ${item.isTaken ? 'text-primary-600' : 'text-gray-400'}`}>
                          {item.nomor}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.nama_keluarga}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.nama_remaja}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.wijk}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isTaken ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.status_pembayaran === 'Lunas' ? 'bg-green-100 text-green-800' :
                            item.status_pembayaran === 'DP' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {item.status_pembayaran}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.isTaken ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.status_penerimaan === 'Diterima' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status_penerimaan}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.isTaken ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.isTaken ? 'Sudah Terisi' : 'Belum Terisi'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity -z-10"
                onClick={closeModal}
              />

              {/* Center alignment helper */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                &#8203;
              </span>

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-10"
              >
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {editingKupon ? 'Edit Kupon' : isBookingMode ? 'Booking Kupon' : 'Tambah Kupon Baru'}
                      </h3>
                      <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Toggle Mode: Tambah Kupon / Booking - hanya tampil saat bukan edit */}
                    {!editingKupon && (
                      <div className="mb-6 flex items-center justify-center space-x-4 bg-gray-100 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setIsBookingMode(false)}
                          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                            !isBookingMode
                              ? 'bg-white text-primary-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Tambah Kupon
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsBookingMode(true)}
                          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                            isBookingMode
                              ? 'bg-white text-primary-600 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Booking
                        </button>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Info peringatan */}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Keluarga <span className="text-gray-400 text-xs"></span>
                        </label>
                        <input
                          type="text"
                          value={formData.nama_keluarga}
                          onChange={(e) => setFormData({ ...formData, nama_keluarga: e.target.value })}
                          className="input-field"
                          placeholder="Contoh: Keluarga Sitorus"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Remaja/Naposo <span className="text-gray-400 text-xs"></span>
                        </label>
                        <input
                          type="text"
                          value={formData.nama_remaja}
                          onChange={(e) => setFormData({ ...formData, nama_remaja: e.target.value })}
                          className="input-field"
                          placeholder="Contoh: Maruli Sitorus"
                        />
                      </div>

                      {/* Radio Button Kategori Pembelian */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Kategori Pembelian</label>
                        <div className="flex space-x-6">
                          {kategoriPembelian.map((kategori) => (
                            <label key={kategori} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="kategori_pembelian"
                                value={kategori}
                                checked={formData.kategori_pembelian === kategori}
                                onChange={(e) => setFormData({ ...formData, kategori_pembelian: e.target.value })}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">{kategori}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Nomor Kupon - hanya untuk mode Tambah Kupon */}
                      {!isBookingMode && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nomor Kupon <span className="text-gray-400 text-xs">(optional untuk booking)</span>
                          </label>
                          <input
                            type="text"
                            value={formData.nomor_kupon_input}
                            onChange={(e) => setFormData({ ...formData, nomor_kupon_input: e.target.value })}
                            className="input-field"
                            placeholder="Contoh: 1-10, 123, 78"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Format: 1-10 (range), 123 (single), atau 1,5,10 (list). Tekan Enter atau pisah dengan koma.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Wijk</label>
                        <select
                          value={formData.wijk}
                          onChange={(e) => setFormData({ ...formData, wijk: e.target.value })}
                          className="input-field"
                          required
                        >
                          <option value="">Pilih Wijk</option>
                          {wijkList.map((wijk) => (
                            <option key={wijk} value={wijk}>
                              {wijk}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Pembayaran */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status Pembayaran</label>
                        <select
                          value={formData.status_pembayaran}
                          onChange={(e) => {
                            const status = e.target.value
                            setFormData({ ...formData, status_pembayaran: status })
                          }}
                          className="input-field"
                          required
                        >
                          {statusPembayaran.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* BOOKING MODE: Different calculation logic per status */}
                      {isBookingMode && (
                        <>
                          {/* Lunas: Input payment → auto-calc quantity */}
                          {formData.status_pembayaran === 'Lunas' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jumlah Dibayar
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                  Rp
                                </span>
                                <input
                                  type="text"
                                  value={formData.jumlah_dibayar === 0 ? '' : formData.jumlah_dibayar.toLocaleString('id-ID')}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '')
                                    const numValue = parseInt(value) || 0
                                    const kuponQty = Math.floor(numValue / HARGA_PER_KUPON)
                                    setFormData({ ...formData, jumlah_dibayar: numValue, jumlah_kupon_booking: kuponQty })
                                  }}
                                  className="input-field pl-10"
                                  placeholder="100.000"
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Jumlah Kupon: <span className="font-semibold text-primary-600">{formData.jumlah_kupon_booking} kupon</span>
                                {' '}(Rp {HARGA_PER_KUPON.toLocaleString('id-ID')} per kupon)
                              </p>
                            </div>
                          )}

                          {/* DP: Input payment → input quantity → show remaining */}
                          {formData.status_pembayaran === 'DP' && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Jumlah Dibayar (DP)
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                    Rp
                                  </span>
                                  <input
                                    type="text"
                                    value={formData.jumlah_dibayar === 0 ? '' : formData.jumlah_dibayar.toLocaleString('id-ID')}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/\D/g, '')
                                      const numValue = parseInt(value) || 0
                                      setFormData({ ...formData, jumlah_dibayar: numValue })
                                    }}
                                    className="input-field pl-10"
                                    placeholder="50.000"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Jumlah Kupon
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={formData.jumlah_kupon_booking || ''}
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value) || 0
                                    setFormData({ ...formData, jumlah_kupon_booking: qty })
                                  }}
                                  className="input-field"
                                  placeholder="5"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Total Harga: <span className="font-semibold">{formatCurrency(formData.jumlah_kupon_booking * HARGA_PER_KUPON)}</span>
                                  {' | '}
                                  Sisa: <span className="font-semibold text-red-600">
                                    {formatCurrency((formData.jumlah_kupon_booking * HARGA_PER_KUPON) - formData.jumlah_dibayar)}
                                  </span>
                                </p>
                              </div>
                            </>
                          )}

                          {/* Belum Bayar: Input quantity → show total amount */}
                          {formData.status_pembayaran === 'Belum Bayar' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jumlah Kupon
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={formData.jumlah_kupon_booking || ''}
                                onChange={(e) => {
                                  const qty = parseInt(e.target.value) || 0
                                  setFormData({ ...formData, jumlah_kupon_booking: qty })
                                }}
                                className="input-field"
                                placeholder="5"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Total yang harus dibayar: <span className="font-semibold text-red-600">
                                  {formatCurrency(formData.jumlah_kupon_booking * HARGA_PER_KUPON)}
                                </span>
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* NORMAL MODE: DP field only */}
                      {!isBookingMode && formData.status_pembayaran === 'DP' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Jumlah Dibayar (DP)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                              Rp
                            </span>
                            <input
                              type="text"
                              value={formData.jumlah_dibayar === 0 ? '' : formData.jumlah_dibayar.toLocaleString('id-ID')}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '')
                                const numValue = parseInt(value) || 0
                                
                                // Validasi: tidak boleh lebih dari total
                                const totalHarga = jumlahKupon * HARGA_PER_KUPON
                                if (numValue > totalHarga) {
                                  alert(`Jumlah DP tidak boleh melebihi total harga (${formatCurrency(totalHarga)})`)
                                  return
                                }
                                
                                setFormData({ ...formData, jumlah_dibayar: numValue })
                              }}
                              className="input-field pl-10"
                              placeholder="10.000"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Total: {formatCurrency(jumlahKupon * HARGA_PER_KUPON)} | 
                            Kurang: <span className={formData.jumlah_dibayar < (jumlahKupon * HARGA_PER_KUPON) ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                              {formatCurrency((jumlahKupon * HARGA_PER_KUPON) - formData.jumlah_dibayar)}
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Info Harga - hanya untuk mode Tambah Kupon */}
                      {!isBookingMode && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Jumlah Kupon:</span>
                            <span className="text-sm font-semibold text-gray-900">{jumlahKupon} kupon</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Harga per Kupon:</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(HARGA_PER_KUPON)}</span>
                          </div>
                          <div className="border-t border-gray-300 pt-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">
                                {formData.status_pembayaran === 'Lunas' && 'Total Harga:'}
                                {formData.status_pembayaran === 'DP' && 'Sudah Dibayar:'}
                                {formData.status_pembayaran === 'Belum Bayar' && 'Total Hutang:'}
                              </span>
                              <span className={`text-lg font-bold ${getHargaColor(formData.status_pembayaran)}`}>
                                {formData.status_pembayaran === 'Lunas' && formatCurrency(jumlahKupon * HARGA_PER_KUPON)}
                                {formData.status_pembayaran === 'DP' && formatCurrency(formData.jumlah_dibayar)}
                                {formData.status_pembayaran === 'Belum Bayar' && formatCurrency(-(jumlahKupon * HARGA_PER_KUPON))}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Info Booking - untuk booking mode */}
                     

                      {/* Status Penerimaan Kupon */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Status Penerimaan Kupon</label>
                        <div className="flex space-x-6">
                          {statusPenerimaan.map((status) => (
                            <label key={status} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="status_penerimaan"
                                value={status}
                                checked={formData.status_penerimaan === status}
                                onChange={(e) => setFormData({ ...formData, status_penerimaan: e.target.value })}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                              />
                              <span className="ml-2 text-sm text-gray-700">{status}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                    <button type="button" onClick={closeModal} className="btn-secondary">
                      Batal
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingKupon ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DataKupon
