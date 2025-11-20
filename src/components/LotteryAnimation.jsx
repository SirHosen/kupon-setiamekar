import React from 'react'
import { motion } from 'framer-motion'

const LotteryAnimation = ({ isDrawing, result, onComplete }) => {
  const [displayNumber, setDisplayNumber] = React.useState('0000')
  const [showConfetti, setShowConfetti] = React.useState(false)

  React.useEffect(() => {
    if (isDrawing) {
      setShowConfetti(false)
      // Animasi angka berputar dengan efek dramatis
      const interval = setInterval(() => {
        const randomNum = Math.floor(Math.random() * 1000) + 1
        setDisplayNumber(randomNum.toString().padStart(4, '0'))
      }, 80) // Lebih cepat untuk efek dramatis

      // Stop setelah 10 detik (lebih lama untuk suspense)
      setTimeout(() => {
        clearInterval(interval)
        if (result) {
          setDisplayNumber(result.nomor_kupon)
          setShowConfetti(true) // Tampilkan confetti saat selesai
        }
        if (onComplete) {
          onComplete()
        }
      }, 10000) // 10 detik

      return () => clearInterval(interval)
    } else if (result) {
      setDisplayNumber(result.nomor_kupon)
      setShowConfetti(true)
    } else {
      setDisplayNumber('0000')
      setShowConfetti(false)
    }
  }, [isDrawing, result, onComplete])

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12 relative overflow-hidden">
      {/* Subtle Confetti Effect - Minimalis */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Particles - lebih sedikit dan subtle */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                top: -20, 
                left: `${Math.random() * 100}%`,
                rotate: 0,
                scale: 0,
                opacity: 0
              }}
              animate={{ 
                top: '100%', 
                rotate: Math.random() * 360,
                scale: [0, 0.8, 0.8, 0],
                opacity: [0, 0.6, 0.6, 0]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                delay: Math.random() * 0.3,
                ease: "easeOut"
              }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: ['#6366f1', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 3)]
              }}
            />
          ))}
        </div>
      )}
      
      {/* Nomor Kupon Display */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {/* Glow effect - minimalis */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 blur-2xl opacity-20 rounded-full"></div>
        
        <div className="relative bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-2xl p-12 border border-primary-400/30">
          <motion.div
            animate={
              isDrawing 
                ? { 
                    scale: [1, 1.05, 1], 
                  } 
                : result 
                  ? {
                      scale: [1, 1.1, 1],
                    }
                  : {}
            }
            transition={{ 
              repeat: isDrawing ? Infinity : 0, 
              duration: isDrawing ? 0.5 : 0.8,
              ease: "easeInOut"
            }}
            className="text-8xl font-bold text-white tracking-wider font-mono"
          >
            {displayNumber}
          </motion.div>
        </div>
      </motion.div>

      {/* Status Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        {isDrawing ? (
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                className="w-2 h-2 bg-primary-600 rounded-full"
              ></motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                className="w-2 h-2 bg-primary-600 rounded-full"
              ></motion.div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                className="w-2 h-2 bg-primary-600 rounded-full"
              ></motion.div>
            </div>
            <p className="text-xl font-medium text-gray-700">Mengundi kupon...</p>
          </div>
        ) : result ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Selamat dengan desain minimalis & profesional */}
            <div className="space-y-3">
              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-700"
              >
                SELAMAT
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-primary-500 to-transparent rounded-full"
              />
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-medium text-gray-600"
              >
                Pemenang Telah Dipilih
              </motion.p>
            </div>
          </motion.div>
        ) : (
          <p className="text-xl text-gray-500">Klik tombol di bawah untuk memulai undian</p>
        )}
      </motion.div>

      {/* Winner Details */}
      {!isDrawing && result && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, type: "spring", stiffness: 100 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-5">
              <h3 className="text-2xl font-bold text-white text-center">
                Detail Pemenang
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nomor Kupon - Featured */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="col-span-1 md:col-span-2 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-600 mb-1">Nomor Kupon Pemenang</p>
                      <p className="text-4xl font-bold text-primary-700 font-mono tracking-wider">{result.nomor_kupon}</p>
                    </div>
                    <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* Wijk */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Wijk</p>
                      <p className="text-xl font-bold text-gray-900">{result.wijk}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Kategori (jika ada) */}
                {result.kategori_pembelian && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gray-50 rounded-xl p-5 border border-gray-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Kategori</p>
                        <p className="text-xl font-bold text-gray-900">{result.kategori_pembelian}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Nama Keluarga */}
                {result.nama_keluarga && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="col-span-1 md:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Nama Keluarga</p>
                        <p className="text-2xl font-bold text-green-900">{result.nama_keluarga}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Nama Remaja/Naposo */}
                {result.nama_remaja && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="col-span-1 md:col-span-2 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-orange-700 uppercase tracking-wide mb-1">Remaja/Naposo</p>
                        <p className="text-2xl font-bold text-orange-900">{result.nama_remaja}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default LotteryAnimation
