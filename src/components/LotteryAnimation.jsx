import React from 'react'
import { motion } from 'framer-motion'

const LotteryAnimation = ({ isDrawing, result, onComplete }) => {
  const [displayNumber, setDisplayNumber] = React.useState('0000')

  React.useEffect(() => {
    if (isDrawing) {
      // Animasi angka berputar
      const interval = setInterval(() => {
        const randomNum = Math.floor(Math.random() * 1000) + 1
        setDisplayNumber(randomNum.toString().padStart(4, '0'))
      }, 100)

      // Stop setelah 3 detik
      setTimeout(() => {
        clearInterval(interval)
        if (result) {
          setDisplayNumber(result.nomor_kupon)
        }
        if (onComplete) {
          onComplete()
        }
      }, 7000)

      return () => clearInterval(interval)
    } else if (result) {
      setDisplayNumber(result.nomor_kupon)
    } else {
      setDisplayNumber('0000')
    }
  }, [isDrawing, result, onComplete])

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {/* Nomor Kupon Display */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 blur-3xl opacity-30 rounded-full"></div>
        <div className="relative bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl shadow-2xl p-12">
          <motion.div
            animate={isDrawing ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: isDrawing ? Infinity : 0, duration: 0.5 }}
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
            <p className="text-xl font-semibold text-gray-700">Mengundi kupon...</p>
          </div>
        ) : result ? (
          <div className="space-y-2">
            <p className="text-2xl font-bold text-primary-600">🎉 Selamat! 🎉</p>
            <p className="text-gray-600">Pemenang telah dipilih</p>
          </div>
        ) : (
          <p className="text-xl text-gray-500">Klik tombol di bawah untuk memulai undian</p>
        )}
      </motion.div>

      {/* Winner Details */}
      {!isDrawing && result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="card max-w-md w-full space-y-4"
        >
          <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
            Detail Pemenang
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nomor Kupon</p>
              <p className="text-lg font-semibold text-gray-900">{result.nomor_kupon}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Wijk</p>
              <p className="text-lg font-semibold text-gray-900">{result.wijk}</p>
            </div>
            {result.nama_keluarga && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Nama Keluarga</p>
                <p className="text-lg font-semibold text-gray-900">{result.nama_keluarga}</p>
              </div>
            )}
            {result.nama_remaja && (
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Nama Remaja/Naposo</p>
                <p className="text-lg font-semibold text-gray-900">{result.nama_remaja}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default LotteryAnimation
