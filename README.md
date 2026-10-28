# 🎓 Portal Capaian Hasil Asesmen Peserta Didik SMP Online
### Siap Deploy Vercel / GitHub & Google Apps Script (Google Sheets Database)

Aplikasi web modern, murni digital, ringan, dan cepat untuk pengumuman capaian hasil asesmen peserta didik jenjang SMP (Sekolah Menengah Pertama) tanpa biaya server, dioptimalkan untuk 600+ siswa dan terproteksi keamanan siber.

---

## 🚀 Opsi Penerapan (Deployment)

Aplikasi ini mendukung arsitektur hybrid fleksibel:
1. **Frontend di Vercel (via GitHub)**: Akses super cepat lewat CDN global Vercel, gratis SSL, dan custom domain sekolah (misal: `asesmen.smpn1.sch.id`).
2. **Backend API di Google Apps Script**: Berfungsi sebagai REST API yang membaca & menulis data ke Google Sheets secara real-time.
3. **Deploy Langsung di Google Apps Script**: Bisa juga dibuka langsung via URL Web App Google tanpa Vercel.

> 📖 **Panduan Langkah Demi Langkah**:
> - Panduan Deploy Vercel & GitHub: [**`PANDUAN_DEPLOY_VERCEL_GITHUB.md`**](file:///F:/aplikasi-nilai-smp/PANDUAN_DEPLOY_VERCEL_GITHUB.md)
> - Panduan Setup Database Spreadsheet: [**`PANDUAN_SETUP.md`**](file:///F:/aplikasi-nilai-smp/PANDUAN_SETUP.md)

---

## 🌐 Integrasi ke Portal Sekolah yang Sudah Ada

Aplikasi ini sudah dilengkapi **Portal Integration Hook**:
1. **Tautan Langsung SSO Ringan dari Portal Utama**:
   ```
   https://domain-asesmen-anda.vercel.app/?role=siswa&nisn=0081234567&portal_url=https://portal-sekolah.sch.id
   ```
   - Otomatis langsung mencari nilai siswa bersangkutan tanpa perlu mengetik NISN.
   - Otomatis memunculkan tombol **`⬅️ Ke Portal`** di pojok kanan atas untuk kembali ke portal utama sekolah.
2. **Sematkan (iFrame) di Halaman Portal Sekolah**:
   ```html
   <iframe src="https://domain-asesmen-anda.vercel.app/" width="100%" height="900px" frameborder="0"></iframe>
   ```

---

## 🛡️ Keamanan Siber (Cyber Security Hardened)
- **Anti-Brute Force Protection**: Maksimal 5x percobaan salah, otomatis lockout 15 menit.
- **Token-Based Authentication**: Menggunakan UUID Session Token; kata sandi tidak dikirim berulang kali.
- **Formula Injection Defense**: Mencegah eksploitasi formula lembar kerja (`=`, `+`, `-`, `@`).
- **XSS & Injection Protection**: Validasi ketat NISN numerik dan pembersihan karakter HTML.
- **Validasi Media**: Hanya menerima data gambar Base64 sah (PNG, JPEG, WEBP).

---

## 🌟 Tata Letak Dokumen Resmi & Antarmuka
- **Judul Dokumen**: `LEMBAR CAPAIAN HASIL ASESMEN PESERTA DIDIK`
- **Kop Surat Simetris Tiga Kolom**:
  - Kiri: Logo Pemerintah Daerah (Pemkot/Pemkab/Dinas Pendidikan)
  - Tengah: Identitas Lengkap Sekolah
  - Kanan: Logo Resmi Sekolah SMP
- **Statistik Capaian**: Rata-Rata Nilai Siswa, **Rata-Rata Rapor Satu Sekolah**, Nilai Tertinggi, Jumlah Mapel.
- **Tabel Capaian Asesmen**:
  - Kolom: `No` | `Mata Pelajaran` | `Nilai Asesmen Siswa` | `Rata-Rata Nilai Mapel Satu Jenjang`
  - *(KKM, Predikat, Status, Catatan Guru, dan Catatan Sekolah ditiadakan)*.
- **Pengesahan Digital**: Tanda tangan Kepala Sekolah berukuran besar & jelas di sebelah kanan bawah (tampilan bersih tanpa stempel).
- **Input Matriks Leger Sekelas (< 10 Detik)**:
  - **Di Web Admin**: Salin tabel Excel sekelas lalu tekan `Ctrl + V` di Web Admin (auto-register siswa baru + simpan seluruh mapel sekelas).
  - **Di Google Spreadsheet**: Sheet `Leger_Nilai` dengan menu kustom `🎓 Menu Nilai SMP` $\rightarrow$ `⚡ Sinkronkan dari Leger_Nilai ke Sistem`.
  - **Template Siap Pakai**: Tersedia file [**`Template_Leger_Nilai_Per_Kelas.csv`**](file:///F:/aplikasi-nilai-smp/Template_Leger_Nilai_Per_Kelas.csv).
- **Navigasi Bersih**: Tepat **1 tombol Keluar Admin** yang konsisten di bilah atas.
