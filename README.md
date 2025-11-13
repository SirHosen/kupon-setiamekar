# Sistem Undian Gereja

Aplikasi web untuk sistem undian doorprize gereja dengan fitur manajemen kupon, pengundian acak, dan pencatatan pemenang.

## 🚀 Teknologi

- **Frontend:** React + Vite + TailwindCSS
- **UI Components:** Lucide React Icons + Framer Motion
- **Backend/Database:** Supabase (PostgreSQL)
- **Authentication:** Custom ID + Password (tanpa email)
- **Routing:** React Router v6

## 📋 Fitur

✅ Login panitia dengan ID dan password (tanpa email)  
✅ Dashboard dengan statistik lengkap  
✅ Manajemen data kupon (CRUD)  
✅ Pengundian kupon acak dengan animasi  
✅ Pencatatan pemenang  
✅ Export data ke CSV  
✅ Filter & search data  
✅ Responsive design  
✅ Animasi smooth dengan Framer Motion  

## 🗄️ Setup Database Supabase

### 1. Buat Project Baru di Supabase

1. Buka [https://supabase.com](https://supabase.com)
2. Login atau buat akun baru
3. Klik "New Project"
4. Isi detail project dan tunggu hingga selesai

### 2. Buat Tabel di Database

Buka **SQL Editor** di dashboard Supabase dan jalankan query berikut:

```sql
-- Tabel users untuk login panitia
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'panitia',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel kupons untuk data kupon
CREATE TABLE kupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_keluarga TEXT NOT NULL,
  nama_remaja TEXT NOT NULL,
  nomor_kupon TEXT UNIQUE NOT NULL,
  wijk TEXT NOT NULL,
  harga INTEGER DEFAULT 20000,
  status_pembayaran TEXT NOT NULL CHECK (status_pembayaran IN ('Lunas', 'DP', 'Belum Lunas')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel winners untuk pemenang undian
CREATE TABLE winners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nomor_kupon TEXT NOT NULL,
  nama_keluarga TEXT NOT NULL,
  nama_remaja TEXT NOT NULL,
  wijk TEXT NOT NULL,
  waktu_undi TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX idx_kupons_nomor ON kupons(nomor_kupon);
CREATE INDEX idx_kupons_status ON kupons(status_pembayaran);
CREATE INDEX idx_winners_waktu ON winners(waktu_undi DESC);
```

### 3. Buat User Panitia (Sample Data)

Jalankan script berikut untuk generate hash password:

```bash
node create-password-hash.js
```

Output akan menampilkan SQL query yang siap digunakan. Copy dan paste di Supabase SQL Editor:

```sql
-- Contoh output (hash akan berbeda):
INSERT INTO users (username, password, role) VALUES ('hosea', 'fc61817c923694...', 'panitia');
INSERT INTO users (username, password, role) VALUES ('bgyos', 'dc9dda2e1f9863...', 'panitia');
INSERT INTO users (username, password, role) VALUES ('bgpranto', '6e3dc661b694f8...', 'panitia');
```

**Note:** Password di-hash menggunakan SHA-256 untuk keamanan.

### 4. Setup Row Level Security (RLS)

Untuk keamanan, aktifkan RLS dan buat policy:

```sql
-- Aktifkan RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

-- Policy untuk users (bisa dibaca semua, tidak bisa dimodifikasi dari client)
CREATE POLICY "Users can be read by anyone" ON users FOR SELECT USING (true);

-- Policy untuk kupons (CRUD penuh untuk semua user yang terautentikasi)
CREATE POLICY "Kupons can be read by anyone" ON kupons FOR SELECT USING (true);
CREATE POLICY "Kupons can be inserted by anyone" ON kupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Kupons can be updated by anyone" ON kupons FOR UPDATE USING (true);
CREATE POLICY "Kupons can be deleted by anyone" ON kupons FOR DELETE USING (true);

-- Policy untuk winners (CRUD penuh)
CREATE POLICY "Winners can be read by anyone" ON winners FOR SELECT USING (true);
CREATE POLICY "Winners can be inserted by anyone" ON winners FOR INSERT WITH CHECK (true);
CREATE POLICY "Winners can be deleted by anyone" ON winners FOR DELETE USING (true);
```

**Note:** Policy di atas dibuat sederhana untuk kemudahan. Di production, sebaiknya disesuaikan dengan kebutuhan keamanan yang lebih ketat.

### 5. Dapatkan Supabase Credentials

1. Buka **Settings** > **API** di dashboard Supabase
2. Copy **Project URL** dan **anon/public key**
3. Simpan untuk digunakan di step selanjutnya

## 🛠️ Instalasi & Setup Project

### 1. Clone/Download Project

```bash
cd /home/hosea/httpd/kupon
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root project:

```bash
cp .env.example .env
```

Edit `.env` dan isi dengan credentials Supabase Anda:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**PENTING:** Ganti `your-project` dan `your-anon-key-here` dengan nilai sebenarnya dari Supabase!

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### 5. Login

Gunakan kredensial berikut untuk login:

- **Username:** panitia1
- **Password:** panitia123

(Sesuaikan dengan user yang Anda buat di database)

## 📦 Build untuk Production

```bash
npm run build
```

File hasil build ada di folder `dist/`

## 🚀 Deploy ke Netlify/Vercel

### Deploy ke Netlify:

1. Push code ke GitHub
2. Login ke [Netlify](https://netlify.com)
3. Klik "New site from Git"
4. Pilih repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Tambahkan Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Deploy!

### Deploy ke Vercel:

1. Push code ke GitHub
2. Login ke [Vercel](https://vercel.com)
3. Import repository
4. Framework preset: Vite
5. Tambahkan Environment Variables
6. Deploy!

## 📖 Cara Penggunaan

### 1. Dashboard
- Lihat statistik total keluarga, kupon, dan pemasukan
- Monitor status pembayaran (Lunas/DP/Belum Lunas)

### 2. Data Kupon
- Tambah kupon baru dengan nomor 0001-1000
- Edit data kupon yang sudah ada
- Hapus kupon jika diperlukan
- Filter berdasarkan wijk dan status pembayaran
- Search berdasarkan nama atau nomor kupon

### 3. Undian
- Pastikan ada kupon berstatus "Lunas"
- Klik "Mulai Undian" untuk mengundi secara acak
- Tunggu animasi 3 detik
- Klik "Simpan Pemenang" untuk menyimpan hasil

### 4. Pemenang
- Lihat daftar semua pemenang
- Export data ke CSV untuk arsip
- Hapus data jika terjadi kesalahan

## 🔧 Struktur Project

```
src/
├── components/
│   ├── Navbar.jsx              # Navigation bar
│   ├── DataTable.jsx           # Reusable table component
│   └── LotteryAnimation.jsx    # Animasi undian
├── pages/
│   ├── Login.jsx               # Halaman login
│   ├── Dashboard.jsx           # Dashboard utama
│   ├── DataKupon.jsx           # Manajemen kupon
│   ├── Undian.jsx              # Halaman undian
│   └── Pemenang.jsx            # Daftar pemenang
├── context/
│   └── AuthContext.jsx         # Authentication context
├── services/
│   ├── supabaseClient.js       # Supabase client setup
│   └── kuponService.js         # Service layer untuk API
├── utils/
│   └── helpers.js              # Utility functions
├── App.jsx                     # Main app component
├── main.jsx                    # Entry point
└── index.css                   # Global styles
```

## 🎨 Customization

### Mengubah Jumlah Kupon

Edit file `src/utils/helpers.js`:

```javascript
export const generateCoupons = () => {
  const coupons = []
  for (let i = 1; i <= 1000; i++) { // Ubah 1000 sesuai kebutuhan
    coupons.push(i.toString().padStart(4, '0'))
  }
  return coupons
}
```

### Menambah Wijk Baru

Edit file `src/utils/helpers.js`:

```javascript
export const wijkList = [
  'Wijk I',
  'Wijk II',
  // ... tambahkan wijk baru di sini
]
```

### Mengubah Harga Default

Edit file `src/pages/DataKupon.jsx` pada bagian `formData`:

```javascript
const [formData, setFormData] = useState({
  // ...
  harga: 20000, // Ubah nilai default di sini
  // ...
})
```

## ❓ Troubleshooting

### Error: Missing Supabase environment variables

**Solusi:** Pastikan file `.env` sudah dibuat dan berisi kredensial Supabase yang benar.

### Error: Username atau password salah

**Solusi:** 
1. Cek apakah user sudah dibuat di tabel `users`
2. Pastikan password di-hash dengan bcrypt
3. Coba login dengan kredensial yang benar

### Error: Nomor kupon sudah digunakan

**Solusi:** Pilih nomor kupon lain yang belum terpakai.

### Tidak ada kupon yang bisa diundi

**Solusi:** Pastikan ada kupon dengan status "Lunas" di database.

## 📝 License

MIT License - bebas digunakan untuk keperluan gereja.

## 👨‍💻 Support

Jika ada pertanyaan atau kendala, silakan hubungi developer atau buka issue di repository.

---

**Dibuat dengan ❤️ untuk Gereja**
