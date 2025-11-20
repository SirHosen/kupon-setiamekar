import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { kuponService } from '../services/kuponService'
import { formatCurrency } from '../utils/helpers'
import { Users, Ticket, Banknote, CheckCircle, Clock, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPartisipan: 0,
    totalKupon: 0,
    totalLunas: 0,
    totalDP: 0,
    totalBelumLunas: 0,
    totalPemasukan: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const data = await kuponService.getStatistics()
      setStats(data)
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Partisipan',
      value: stats.totalPartisipan,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Kupon Terisi',
      value: `${stats.totalKupon}/1000`,
      icon: Ticket,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Total Pemasukan',
      value: formatCurrency(stats.totalPemasukan),
      icon: Banknote,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
  ]

  const statusCards = [
    {
      title: 'Lunas',
      value: stats.totalLunas,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
    },
    {
      title: 'DP',
      value: stats.totalDP,
      icon: Clock,
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900',
    },
    {
      title: 'Belum Lunas',
      value: stats.totalBelumLunas,
      icon: XCircle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
    },
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Ringkasan data sistem undian gereja</p>
        </motion.div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="stat-card"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`${card.bgColor} p-4 rounded-xl`}>
                    <Icon className={`w-8 h-8 ${card.iconColor}`} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Status Pembayaran */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Status Pembayaran</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statusCards.map((card, index) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`${card.bgColor} rounded-xl p-6 border border-gray-100`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                    <span className={`text-xs font-medium ${card.textColor} bg-white px-3 py-1 rounded-full`}>
                      {stats.totalKupon > 0 ? Math.round((card.value / stats.totalKupon) * 100) : 0}%
                    </span>
                  </div>
                  <p className={`text-sm font-medium ${card.textColor} mb-1`}>{card.title}</p>
                  <p className={`text-2xl font-bold ${card.textColor}`}>{card.value} Kupon</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Status Penerimaan Kupon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Status Penerimaan Kupon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-medium text-blue-900 bg-white px-3 py-1 rounded-full">
                  {stats.totalKupon > 0 ? Math.round((stats.totalDiterima / stats.totalKupon) * 100) : 0}%
                </span>
              </div>
              <p className="text-sm font-medium text-blue-900 mb-1">Sudah Diterima</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalDiterima} Kupon</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-6 h-6 text-gray-600" />
                <span className="text-xs font-medium text-gray-900 bg-white px-3 py-1 rounded-full">
                  {stats.totalKupon > 0 ? Math.round((stats.totalBelumDiterima / stats.totalKupon) * 100) : 0}%
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">Belum Diterima</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBelumDiterima} Kupon</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Kupon</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Kupon Terisi</span>
              <span className="font-medium">{stats.totalKupon} / 1000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.totalKupon / 1000) * 100}%` }}
                transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full"
              />
            </div>
            <p className="text-xs text-gray-500 text-right">
              {((stats.totalKupon / 1000) * 100).toFixed(1)}% terisi
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard
