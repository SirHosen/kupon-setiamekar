import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import DataTable from '../components/DataTable'
import { winnerService } from '../services/kuponService'
import { Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

const Pemenang = () => {
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWinners()
  }, [])

  const loadWinners = async () => {
    try {
      const data = await winnerService.getAllWinners()
      setWinners(data)
    } catch (error) {
      console.error('Error loading winners:', error)
      alert('Gagal memuat data pemenang: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data pemenang ini?')) return

    try {
      await winnerService.deleteWinner(id)
      await loadWinners()
    } catch (error) {
      alert('Gagal menghapus: ' + error.message)
    }
  }

  const columns = [
    { 
      header: 'No', 
      render: (_, index) => <span className="text-sm text-gray-900">{index + 1}</span> 
    },
    { 
      header: 'Nomor Kupon', 
      key: 'nomor_kupon',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="font-mono font-bold text-primary-600">{row.nomor_kupon}</span>
        </div>
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
    { header: 'Waktu Undi', key: 'waktu_undi' },
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900">Daftar Pemenang</h1>
            <p className="text-gray-600 mt-1">
              Total {winners.length} pemenang telah diundi
            </p>
          </motion.div>
        </div>

        {/* Stats */}
        {winners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
          >
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Total Pemenang</p>
                  <p className="text-3xl font-bold text-gray-900">{winners.length}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-xl">
                  <Trophy className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Pemenang Terakhir</p>
                  <p className="text-lg font-bold text-gray-900">{winners[0]?.nama_keluarga}</p>
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Kupon Terakhir</p>
                  <p className="text-2xl font-bold font-mono text-primary-600">{winners[0]?.nomor_kupon}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {winners.length === 0 ? (
            <div className="card text-center py-16">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Pemenang</p>
              <p className="text-gray-600">
                Lakukan undian terlebih dahulu di halaman <strong>Undian</strong>
              </p>
            </div>
          ) : (
            <DataTable
              data={winners}
              columns={columns}
              onDelete={handleDelete}
            />
          )}
        </motion.div>

        {/* Info */}
        {winners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Informasi</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Data pemenang tersimpan otomatis setelah menekan tombol "Simpan Pemenang"</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Klik tombol <strong>"Export ke CSV"</strong> untuk mengunduh data dalam format Excel</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Anda dapat menghapus data pemenang jika terjadi kesalahan</span>
              </li>
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Pemenang
