import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import LotteryAnimation from '../components/LotteryAnimation'
import { undianService } from '../services/kuponService'
import { Play, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const Undian = () => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [result, setResult] = useState(null)
  const [eligibleCount, setEligibleCount] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadEligibleCount()
  }, [])

  const loadEligibleCount = async () => {
    try {
      const { totalKuponLunas } = await undianService.getEligibleKupons()
      setEligibleCount(totalKuponLunas)
    } catch (error) {
      console.error('Error loading eligible kupons:', error)
    }
  }

  const handleDraw = async () => {
    if (eligibleCount === 0) {
      alert('Tidak ada kupon yang berstatus Lunas untuk diundi!')
      return
    }

    setSaved(false)
    setResult(null)
    setIsDrawing(true)
    
    try {
      const winner = await undianService.drawRandomKupon()
      setResult(winner)
    } catch (error) {
      alert(error.message)
      setIsDrawing(false)
    }
  }

  const handleAnimationComplete = () => {
    setIsDrawing(false)
  }

  const handleSaveWinner = async () => {
    if (!result) return

    try {
      await undianService.saveWinner(result)
      setSaved(true)
      alert('Pemenang berhasil disimpan!')
      await loadEligibleCount()
    } catch (error) {
      alert('Gagal menyimpan pemenang: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Undian Kupon</h1>
          <p className="text-gray-600">Sistem pengundian kupon doorprize gereja</p>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Kupon yang Dapat Diundi</p>
                <p className="text-2xl font-bold text-gray-900">{eligibleCount} Kupon</p>
              </div>
            </div>
            {eligibleCount === 0 && (
              <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">
                  Tidak ada kupon lunas
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Lottery Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="card bg-gradient-to-br from-white to-gray-50"
        >
          <LotteryAnimation
            isDrawing={isDrawing}
            result={result}
            onComplete={handleAnimationComplete}
          />

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-8 pt-8 border-t border-gray-200">
            {!result || saved ? (
              <button
                onClick={handleDraw}
                disabled={isDrawing || eligibleCount === 0}
                className="btn-primary px-8 py-4 text-lg flex items-center space-x-3 disabled:opacity-50"
              >
                <Play className="w-6 h-6" />
                <span>{isDrawing ? 'Mengundi...' : 'Mulai Undian'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setResult(null)
                    setSaved(false)
                  }}
                  className="btn-secondary px-6 py-3"
                >
                  Undi Ulang
                </button>
                <button
                  onClick={handleSaveWinner}
                  disabled={saved}
                  className="btn-primary px-6 py-3 flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>{saved ? 'Sudah Disimpan' : 'Simpan Pemenang'}</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Undian
