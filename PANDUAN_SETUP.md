# PANDUAN LENGKAP APLIKASI CAPAIAN HASIL ASESMEN ONLINE SMP
### Versi Digital Resmi Terproteksi Keamanan Siber & Siap untuk 600+ Siswa

Aplikasi web modern, murni digital, ringan, dan cepat untuk pengumuman capaian hasil asesmen siswa jenjang SMP (Sekolah Menengah Pertama) tanpa biaya server, dioptimalkan untuk 600+ siswa dan terproteksi keamanan siber.

---

## 🌟 SPESIFIKASI FORMAT LAPORAN TERBARU

Sesuai ketentuan kurikulum dan format asesmen resmi:
1. **Judul Dokumen Resmi**:
   **`LEMBAR CAPAIAN HASIL ASESMEN PESERTA DIDIK`**
2. **Kop Surat Simetris Tiga Kolom**:
   - **Sebelah Kiri**: Logo Pemerintah Daerah (Pemkot/Pemkab/Dinas Pendidikan).
   - **Di Tengah**: Identitas Lengkap Sekolah (Pemerintah Daerah, Nama Sekolah, Alamat, Kontak).
   - **Sebelah Kanan**: Logo Resmi Sekolah SMP.
3. **Kartu Ringkasan Statistik (Summary Stats)**:
   - **Rata-Rata Nilai Siswa**: Rata-rata nilai asesmen siswa yang bersangkutan.
   - **Rata-Rata Rapor Sekolah**: Rata-rata capaian seluruh siswa di sekolah (menggantikan persentase KKM).
   - **Nilai Tertinggi**: Nilai tertinggi yang diraih siswa.
   - **Jumlah Mata Pelajaran**: Total mapel yang diujikan (11 Mata Pelajaran).
4. **Tabel Capaian Hasil Asesmen**:
   - Kolom 1: **No**
   - Kolom 2: **Mata Pelajaran** (Urutan resmi: 1. PAI, 2. Pendidikan Pancasila, 3. Bahasa Indonesia, 4. Bahasa Inggris, 5. IPS, 6. Matematika, 7. IPA, 8. PJOK, 9. Seni Budaya, 10. Informatika, 11. Bahasa Jawa)
   - Kolom 3: **Nilai Asesmen Siswa**
   - Kolom 4: **Rata-Rata Nilai Mapel Satu Jenjang** (rata-rata capaian seluruh siswa pada tingkat kelas 7, 8, atau 9 untuk mapel tersebut).
   - *(Kolom KKM, Predikat, Status, Catatan Guru, serta Catatan Sekolah **tidak dimunculkan**)*.
5. **Pengesahan Resmi Sekolah**:
   - **Sebelah Kanan Bawah**: Titimangsa (Kota, Tanggal), Pengesahan Kepala Sekolah, TTD Digital Berukuran Besar & Jelas, Nama Lengkap & NIP.
   - **Stempel Sekolah**: Ditiadakan agar dokumen digital tampil bersih, rapi, dan modern.
   - *(Tidak memerlukan tanda tangan Wali Kelas dan Orang Tua)*.
6. **Murni Digital & Tanpa Fitur Cetak**:
   - Tidak ada tombol cetak/print dialog untuk memastikan aplikasi murni dilihat secara online oleh 600+ siswa.
7. **Satu Tombol Keluar Admin**:
   - Tombol "Keluar Admin" hanya ada tepat satu di bilah navigasi kanan atas untuk kemudahan penggunaan.

---

## 📊 DUA CARA SUPER MUDAH INPUT NILAI SEKELAS (LEGER NILAI)

Bapak/Ibu Guru sering kali memiliki format nilai per kelas dalam bentuk **Leger Nilai** (tabel horizontal: setiap baris berisi NISN, Nama, Kelas, dan kolom nilai seluruh mapel). Aplikasi ini menyediakan **2 metode super cepat**:

### ⚡ METODE 1: Tempel (Paste) Tabel Excel Leger Sekelas di Web Admin (Paling Cepat — < 10 Detik!)
1. Buka file Excel nilai kelas Anda.
2. Blok seluruh tabel dari baris judul: `NISN`, `Nama_Siswa`, `Kelas`, disusul seluruh kolom nama mata pelajaran (PAI, Pendidikan Pancasila, Bahasa Indonesia, Bahasa Inggris, IPS, Matematika, IPA, PJOK, Seni Budaya, Informatika, Bahasa Jawa).
3. Tekan **`Ctrl + C`** di Excel.
4. Buka Web Admin aplikasi, klik tab **`📋 Input Leger & Massal`**.
5. Klik pada kotak bergaris putus-putus dan tekan **`Ctrl + V`**.
6. Sistem **seketika membaca tabel**, menampilkan pratinjau matriks sekelas, jumlah siswa terdeteksi, dan seluruh kolom mapel.
7. Klik tombol hijau **"⚡ Simpan Semua Nilai Kelas Ini"**.
8. **Selesai!** Ratusan nilai langsung tersimpan ke database, dan siswa yang belum ada di database otomatis didaftarkan oleh sistem tanpa perlu input manual satu per satu.

---

### 📑 METODE 2: Pengisian Langsung di Sheet `Leger_Nilai` Google Spreadsheet
Bagi Guru/Admin yang lebih menyukai bekerja langsung di Google Spreadsheet:
1. Buka Google Spreadsheet database sekolah Anda.
2. Klik tab sheet **`Leger_Nilai`**.
3. Salin dan tempelkan (*copy-paste*) tabel nilai kelas Anda secara horizontal dengan urutan 11 mapel resmi:
   | NISN | Nama_Siswa | Kelas | PAI | Pendidikan Pancasila | Bahasa Indonesia | Bahasa Inggris | IPS | Matematika | IPA | PJOK | Seni Budaya | Informatika | Bahasa Jawa |
   | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
   | `0081234567` | Ahmad Fauzan | 8-A | 88 | 82 | 85 | 86 | 84 | 78 | 80 | 85 | 83 | 90 | 88 |
   | `0082345678` | Siti Aisyah | 8-A | 92 | 86 | 90 | 94 | 87 | 95 | 89 | 88 | 85 | 96 | 91 |
4. Pada bilah menu atas Google Sheets, klik menu kustom:
   - **`🎓 Menu Nilai SMP` -> `⚡ Sinkronkan dari Leger_Nilai ke Sistem`** untuk memproses nilai ke database.
   - **`🎓 Menu Nilai SMP` -> `🔧 Perbaiki Kolom Kelas & Wali Kelas yang Tertukar`** jika kolom Kelas dan Wali Kelas sempat tertukar.
5. Sistem otomatis memproses data, mendaftarkan siswa baru, menormalisasi nilai ke sheet `Data_Nilai`, dan memperbarui kalkulasi rata-rata sekolah serta jenjang secara otomatis!

> [!TIP]
> **Template File Excel Siap Pakai**:
> Gunakan file contoh [**`Template_Leger_Nilai_Per_Kelas.csv`**](file:///F:/aplikasi-nilai-smp/Template_Leger_Nilai_Per_Kelas.csv) di folder proyek ini untuk langsung dibuka di Microsoft Excel.

---

### 📋 METODE 3: Pengisian Manual / Normal di Sheet `Data_Siswa` & `Data_Nilai`
Jika ingin mengedit nilai satuan per siswa:
- **Sheet `Data_Siswa`**: Kolom `NISN`, `Nama_Siswa`, `Kelas`, `Jenis_Kelamin`, `Wali_Kelas`, `Status_Siswa`.
- **Sheet `Data_Nilai`**: Kolom `ID_Nilai`, `NISN`, `Mata_Pelajaran`, `Jenis_Asesmen`, `Nilai`.
- Mendukung koma desimal Indonesia (`85,5` atau `85.5`) dan urutan kolom fleksibel.

---

## 🛡️ SISTEM KEAMANAN SIBER (CYBER SECURITY HARDENED)

1. **Anti-Brute Force Protection**: Maksimal 5x percobaan password salah. Jika terlampaui, sistem otomatis mengunci akses login selama 15 menit.
2. **Session Token Kriptografi (UUID)**: Password admin tidak dikirim berulang kali. Sesi terlindungi dan otomatis berakhir setelah batas waktu.
3. **Formula Injection Defense**: Mencegah serangan formula jahat (`=`, `+`, `-`, `@`) saat menyimpan data ke spreadsheet.
4. **Validasi NISN & Sanitasi XSS**: NISN diverifikasi ketat numerik, dan semua output di-escape untuk menangkal injeksi skrip.
5. **Validasi Media Aman**: Upload logo dan stempel hanya menerima format gambar Base64 sah (PNG, JPEG, WEBP).
6. **Proteksi Kuota Apps Script CacheService**: Payload gambar Base64 dipisahkan secara otomatis sehingga bebas dari error kuota `Exception: Argumen terlalu besar: value`.

---

## 🚀 LANGKAH DEPLOYMENT KE GOOGLE APPS SCRIPT (3 MENIT)

### Langkah 1: Buat Spreadsheet Baru
1. Buka [Google Drive](https://drive.google.com).
2. Buat Spreadsheet baru, beri nama: **`DATABASE NILAI ASESMEN SMP`**.

### Langkah 2: Buka Apps Script
1. Pada menu atas Spreadsheet, klik **Ekstensi (Extensions)** > pilih **Apps Script**.

### Langkah 3: Salin Kode `Code.gs` dan `Index.html`
1. Pada file **`Code.gs`**, hapus kode bawaan, lalu salin seluruh isi file [**`Code.gs`**](file:///F:/aplikasi-nilai-smp/Code.gs) dan tempelkan.
2. Klik tombol **+** di sebelah kiri > pilih **HTML** > beri nama: **`Index`** (tanpa ekstensi .html).
3. Hapus kode bawaan di `Index.html`, lalu salin seluruh isi file [**`Index.html`**](file:///F:/aplikasi-nilai-smp/Index.html) dan tempelkan.
4. Klik tombol ikon **Disket (Save project)**.

### Langkah 4: Jalankan Setup Otomatis Sekali
1. Di bilah menu atas Apps Script, pilih fungsi **`setupSpreadsheet`**, lalu klik **Run (Jalankan)**.
2. Berikan izin otorisasi (*Review permissions* > Pilih Akun Google > *Advanced / Lanjutan* > *Buka Portal Nilai (tidak aman)* > *Allow / Izinkan*).
3. Spreadsheet akan otomatis membentuk 5 sheet terstruktur: `Data_Siswa`, `Data_Nilai`, `Leger_Nilai`, `Pengaturan`, dan `Data_Media`.

### Langkah 5: Deploy Sebagai Web App
1. Klik tombol biru **Terapkan (Deploy)** di pojok kanan atas > **Penerapan baru (New deployment)**.
2. Klik ikon roda gigi di sebelah kiri > pilih **Aplikasi web (Web app)**.
3. Konfigurasi:
   - **Deskripsi**: `Aplikasi Capaian Asesmen SMP v2`
   - **Jalankan sebagai (Execute as)**: **Saya (email Anda)**
   - **Yang memiliki akses (Who has access)**: **Siapa saja (Anyone)**
4. Klik **Terapkan (Deploy)**.
5. Salin URL Web App yang diberikan Google, lalu bagikan ke siswa!

> [!IMPORTANT]
> **Cara Update Kode Apps Script di Kemudian Hari**:
> Jika Anda melakukan perubahan kode di Apps Script:
> Klik **Terapkan (Deploy)** > **Kelola penerapan (Manage deployments)** > klik ikon **Pensil (Edit)** > pada bagian **Versi**, pilih **Versi baru (New version)** > klik **Terapkan (Deploy)**. Ini wajib dilakukan agar perubahan langsung aktif dan tidak tertahan cache Google.

---

## 💻 CARA MENGUJI COBA SECARA LOKAL DI KOMPUTER

1. Buka folder [**`F:\aplikasi-nilai-smp\`**](file:///F:/aplikasi-nilai-smp/).
2. Klik dua kali file [**`Index.html`**](file:///F:/aplikasi-nilai-smp/Index.html) untuk membukanya di browser Chrome / Edge.
3. Masukkan NISN uji coba: `0081234567` (Ahmad) atau `0082345678` (Siti).
4. Amati tampilan resmi:
   - Judul: **LEMBAR CAPAIAN HASIL ASESMEN PESERTA DIDIK**
   - Kolom Kelas menampilkan kelas siswa secara tepat (misal `8-A`).
   - Urutan 11 mapel resmi: PAI, Pendidikan Pancasila, Bahasa Indonesia, Bahasa Inggris, IPS, Matematika, IPA, PJOK, Seni Budaya, Informatika, Bahasa Jawa.
   - Rata-Rata Rapor Sekolah dan Rata-Rata Nilai Mapel Satu Jenjang tampil presisi.
   - Pengesahan oleh Kepala Sekolah dan Stempel Resmi Sekolah.
5. Klik **Akses Guru/Admin** (password: `admin123`) untuk menguji pengelolaan data, input massal, dan upload logo/stempel.
