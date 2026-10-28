# 🚀 Panduan Lengkap Deploy ke GitHub & Vercel
### Terhubung ke Database Google Sheets (Real-Time) & Terintegrasi Portal

Aplikasi ini menggunakan arsitektur **Modern Decoupled / Serverless**:
- **Frontend**: Di-host di **Vercel** melalui **GitHub** (akses super cepat via CDN Global, gratis HTTPS, custom domain).
- **Backend API**: Di-host di **Google Apps Script (GAS)** via endpoint Web App (`doGet` & `doPost`).
- **Database**: **Google Sheets** resmi sekolah (`Data_Siswa`, `Data_Nilai`, `Leger_Nilai`, `Pengaturan`, `Data_Media`).

---

## 📋 LANGKAH 1: Setup Backend Google Apps Script (5 Menit)

1. Buka [Google Sheets](https://sheets.google.com) database sekolah Anda (atau buat spreadsheet baru).
2. Di menu atas, klik **Ekstensi (Extensions)** &gt; **Apps Script**.
3. Di editor Apps Script:
   - Hapus kode default di file `Code.gs`.
   - Buka file [`Code.gs`](file:///F:/aplikasi-nilai-smp/Code.gs) di folder proyek ini, salin seluruh kodenya, lalu tempel ke editor Apps Script.
   - Klik tombol **Simpan** (`Ctrl + S`).
4. **Inisialisasi Database**:
   - Di bilah menu fungsi atas, pilih fungsi `setupSpreadsheet` lalu klik **Jalankan (Run)**.
   - Berikan izin akses (*authorization*) jika diminta oleh Google.
   - Sheet database (`Data_Siswa`, `Data_Nilai`, `Leger_Nilai`, `Pengaturan`, `Data_Media`) akan otomatis terbuat dengan rapi dan terproteksi teks murni.
5. **Dapatkan URL Web App**:
   - Di pojok kanan atas editor Apps Script, klik tombol biru **Terapkan (Deploy)** &gt; **Penerapan baru (New deployment)**.
   - Klik ikon gerigi ⚙️ di samping *Select type*, pilih **Aplikasi Web (Web app)**.
   - Isi formulir:
     - **Deskripsi**: `API Portal Asesmen SMP Vercel`
     - **Jalankan sebagai (Execute as)**: `Saya (email Anda)`
     - **Siapa yang memiliki akses (Who has access)**: **`Siapa saja (Anyone)`** *(WAJIB 'Anyone' agar Vercel dapat membaca data tanpa blokir izin Google)*.
   - Klik **Terapkan (Deploy)**.
   - **Salin URL Aplikasi Web** yang muncul (formatnya: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 🔗 LANGKAH 2: Hubungkan URL Backend ke Frontend

Anda memiliki 2 cara mudah:

### Cara A (Paling Mudah — Langsung via Tampilan Web):
1. Buka file [`Index.html`](file:///F:/aplikasi-nilai-smp/Index.html) di browser Anda (atau setelah live di Vercel).
2. Klik tombol status di pojok kanan atas: **`🟡 Hubungkan Spreadsheet`**.
3. Tempelkan URL Web App Google Apps Script yang Anda salin tadi.
4. Klik **"Uji & Hubungkan"**.
5. Sistem otomatis menguji koneksi, menyimpan URL, dan badge akan berubah menjadi **`🟢 Terhubung ke Sheets`**.

### Cara B (Permanen di Kode Sumber):
Buka file [`Index.html`](file:///F:/aplikasi-nilai-smp/Index.html), cari baris konfigurasi berikut di bagian atas `<script>`:
```javascript
const DEFAULT_GAS_API_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```
Ganti string kosong dengan URL Web App Anda. Dengan cara ini, semua pengunjung di Vercel otomatis langsung terhubung tanpa perlu mengisi modal.

---

## 🐙 LANGKAH 3: Upload Proyek ke GitHub

Pilih salah satu metode yang paling nyaman bagi Anda:

### Metode 1: Menggunakan Web GitHub (Tanpa Perlu Instal Git di Komputer)
1. Buka [github.com](https://github.com) dan login ke akun Anda.
2. Buat repository baru di [github.com/new](https://github.com/new):
   - Nama Repository: `portal-asesmen-smp`
   - Visibilitas: **Public** atau **Private** (Vercel mendukung keduanya secara gratis).
   - Jangan centang "Add a README file" (karena kita sudah punya file README).
   - Klik **Create repository**.
3. Pada halaman repository kosong yang muncul, klik tautan **"uploading an existing file"**.
4. Tarik dan lepaskan (*drag and drop*) file-file berikut dari folder `F:\aplikasi-nilai-smp`:
   - `Index.html`
   - `Code.gs`
   - `vercel.json`
   - `.gitignore`
   - `README.md`
   - `PANDUAN_SETUP.md`
   - `PANDUAN_DEPLOY_VERCEL_GITHUB.md`
   - File template CSV jika diperlukan
5. Tulis pesan commit: `feat: rilis portal asesmen smp siap vercel`, lalu klik **Commit changes**.

### Metode 2: Menggunakan Git Command Line
Jika komputer Anda sudah memiliki Git terpasang:
```bash
cd F:\aplikasi-nilai-smp
git init
git add .
git commit -m "feat: initial commit portal asesmen smp vercel"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/portal-asesmen-smp.git
git push -u origin main
```

### Metode 3: Menggunakan GitHub Desktop
1. Buka aplikasi **GitHub Desktop**.
2. Klik menu **File &gt; Add Local Repository...**.
3. Pilih folder `F:\aplikasi-nilai-smp`.
4. Jika muncul konfirmasi *create a repository*, klik **Create Repository**.
5. Klik tombol **Publish repository** ke akun GitHub Anda.

---

## ⚡ LANGKAH 4: Deploy ke Vercel (1 Menit)

1. Buka [vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Di dashboard Vercel, klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Cari repository `portal-asesmen-smp`, lalu klik **"Import"**.
4. Di halaman konfigurasi:
   - **Project Name**: Biarkan default atau sesuaikan (misal: `asesmen-smpn1`).
   - **Framework Preset**: Pilih **Other**.
   - **Root Directory**: `./` (default).
   - Pengaturan lainnya biarkan kosong.
5. Klik tombol **"Deploy"**.
6. Tunggu sekitar 15–30 detik. Vercel akan menampilkan kembang api 🎉 tanda deploy berhasil!
7. Klik tautan domain yang diberikan Vercel (misal: `https://asesmen-smpn1.vercel.app`).

---

## 🌐 LANGKAH 5: Integrasi ke Portal Sekolah yang Sudah Ada

Aplikasi ini sudah dilengkapi sistem integrasi otomatis (*portal integration hook*):

### 1. Integrasi Langsung via URL Parameter (SSO Ringan)
Jika sekolah memiliki portal utama (misal: `https://portal.sekolah.sch.id`), portal utama Anda dapat membuat tautan tombol ke aplikasi Vercel dengan format:
```
https://asesmen-smpn1.vercel.app/?role=siswa&nisn=0081234567&portal_url=https://portal.sekolah.sch.id
```

**Fitur Otomatis yang Terpicu**:
1. **Auto-Lookup Siswa**: Aplikasi langsung otomatis mencari dan menampilkan Lembar Capaian Asesmen siswa dengan NISN `0081234567` tanpa siswa perlu mengetik ulang NISN.
2. **Tombol "⬅️ Ke Portal"**: Di bilah navigasi kanan atas aplikasi, otomatis muncul tombol **"Ke Portal"** yang mengarahkan kembali ke `https://portal.sekolah.sch.id`.

### 2. Integrasi Semat Halaman (iFrame)
Karena konfigurasi keamanan frame sudah diset ke `ALLOWALL`, Anda dapat menyematkan aplikasi Vercel ini ke dalam halaman web portal/CMS sekolah mana pun:
```html
<iframe 
  src="https://asesmen-smpn1.vercel.app/" 
  width="100%" 
  height="900px" 
  style="border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);"
  allow="clipboard-write"
></iframe>
```

---

## 🛡️ Keamanan & Akses Admin di Vercel

- **Password Admin**: Kata sandi admin tersimpan aman di sheet `Pengaturan` Google Spreadsheet (default: `admin123`).
- **Session Token**: Setelah guru/admin login, sistem menerbitkan UUID Token sementara. Kata sandi tidak pernah disimpan di cookies atau dikirim berulang kali.
- **Proteksi Brute-Force**: Batas 5x percobaan salah dengan penguncian otomatis 15 menit.
