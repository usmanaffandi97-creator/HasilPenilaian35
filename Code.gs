/**
 * ==========================================================================
 * SISTEM INFORMASI CAPAIAN HASIL ASESMEN PESERTA DIDIK SMP (RESMI)
 * Backend Google Apps Script (GAS) + Google Sheets Database
 * 
 * FITUR UTAMA & KEAMANAN:
 * 1. Judul: Lembar Capaian Hasil Asesmen Peserta Didik
 * 2. Perhitungan Rata-rata Rapor Satu Sekolah
 * 3. Perhitungan Rata-rata Nilai Mapel Satu Jenjang (Tingkat Kelas 7, 8, atau 9)
 * 4. Mendukung Pengisian Nilai Langsung (Bulk / Paste) di Google Sheets
 * 5. Pengesahan Tunggal Kepala Sekolah + Stempel Resmi (Tanpa TTD Walikelas)
 * 6. Proteksi Keamanan Siber: Anti-Brute Force, Token Session, Anti-Formula Injection
 * ==========================================================================
 */

// Konstanta Nama Sheet
const SHEET_SISWA = "Data_Siswa";
const SHEET_NILAI = "Data_Nilai";
const SHEET_LEGER = "Leger_Nilai";
const SHEET_PENGATURAN = "Pengaturan";
const SHEET_MEDIA = "Data_Media";

/**
 * Menu Kustom di Google Sheets untuk Kemudahan Guru
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("🎓 Menu Nilai SMP")
      .addItem("⚡ Sinkronkan dari Leger_Nilai ke Sistem", "menuSyncLeger")
      .addItem("⚡ Perbaiki Angka 0 di Depan NISN (Auto-Fix)", "menuRepairNisn")
      .addItem("🔧 Perbaiki Kolom Kelas & Wali Kelas yang Tertukar", "menuRepairKelasWali")
      .addSeparator()
      .addItem("🔄 Setup / Reset Struktur Database", "setupSpreadsheet")
      .addToUi();
  } catch (e) {}
}

function menuSyncLeger() {
  const res = syncLegerDataInternal();
  try {
    SpreadsheetApp.getUi().alert(res.message);
  } catch (e) {}
}

/**
 * Menu pemulihan mandiri jika kolom Kelas dan Wali Kelas pada sheet Data_Siswa tertukar
 */
function menuRepairKelasWali() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    if (!sheetSiswa || sheetSiswa.getLastRow() <= 1) {
      SpreadsheetApp.getUi().alert("Sheet 'Data_Siswa' masih kosong atau belum ada data siswa.");
      return;
    }
    const data = sheetSiswa.getDataRange().getValues();
    const colS = detectSiswaColumns(data[0]);
    let fixedCount = 0;

    for (let i = 1; i < data.length; i++) {
      let curKelas = String(data[i][colS.kelas] || "").trim();
      let curWali = String(data[i][colS.wali] || "").trim();

      if (isLikelyTeacherName(curKelas) && (isLikelyClassName(curWali) || !curWali)) {
        data[i][colS.kelas] = curWali;
        data[i][colS.wali] = curKelas;
        fixedCount++;
      }
    }

    if (fixedCount > 0) {
      sheetSiswa.getRange(1, 1, data.length, data[0].length).setNumberFormat("@").setValues(data);
      clearAllCache();
      SpreadsheetApp.getUi().alert("Sukses! Berhasil memperbaiki " + fixedCount + " baris siswa yang kolom Kelas dan Wali Kelasnya sempat tertukar.");
    } else {
      SpreadsheetApp.getUi().alert("Struktur data siswa sudah benar. Tidak ditemukan kolom Kelas yang berisi nama guru wali.");
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert("Terjadi kendala saat perbaikan: " + err.toString());
  }
}

// Keamanan: Konstanta Batas Percobaan Login
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 900; // 15 menit
const SESSION_TTL_SECONDS = 7200; // 2 jam

/**
 * Endpoint Utama Web App (doGet)
 * Kebal error: mendukung file 'Index' / 'index' dan penanganan XFrame aman
 */
function doGet(e) {
  if (e && e.parameter && e.parameter.action) {
    return handleApiRequest(e.parameter);
  }

  var html;
  try {
    html = HtmlService.createTemplateFromFile("Index").evaluate();
  } catch (err1) {
    try {
      html = HtmlService.createTemplateFromFile("index").evaluate();
    } catch (err2) {
      try {
        html = HtmlService.createHtmlOutputFromFile("Index");
      } catch (err3) {
        try {
          html = HtmlService.createHtmlOutputFromFile("index");
        } catch (err4) {
          return HtmlService.createHtmlOutput(
            "<div style='font-family:sans-serif;padding:30px;line-height:1.6;color:#1e293b;max-width:600px;margin:40px auto;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);'>" +
            "<h2 style='color:#e11d48;margin-top:0;'>⚠️ File HTML 'Index' Belum Dibuat</h2>" +
            "<p>Google Apps Script tidak menemukan file antarmuka web. Silakan ikuti langkah berikut:</p>" +
            "<ol style='padding-left:20px;'>" +
            "<li>Buka editor Google Apps Script Anda.</li>" +
            "<li>Di sebelah kiri (bagian <b>Files</b>), klik tombol <b>+</b> lalu pilih <b>HTML</b>.</li>" +
            "<li>Beri nama persis: <b>Index</b> (tanpa ekstensi .html).</li>" +
            "<li>Buka file <code>Index.html</code> dari folder komputer Anda, salin seluruh isinya, lalu tempel ke file tersebut.</li>" +
            "<li>Klik tombol <b>Simpan</b>, lalu lakukan <b>Deploy > New deployment (Penerapan baru)</b>.</li>" +
            "</ol></div>"
          );
        }
      }
    }
  }

  html.setTitle("Portal Capaian Hasil Asesmen Peserta Didik")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");

  try {
    if (HtmlService.XFrameOptionsMode && HtmlService.XFrameOptionsMode.ALLOWALL) {
      html.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
  } catch (eFrame) {}

  return html;
}

/**
 * API Request handler (Mendukung GET dan POST untuk deployment Vercel/GitHub/Web Eksternal)
 */
function handleApiRequest(params) {
  let result = { success: false, message: "Aksi tidak dikenali" };
  try {
    params = params || {};
    const action = params.action;
    const auth = params.auth || params.arg0;
    
    // 1. Publik: Ambil Konfigurasi Identitas Sekolah & Media
    if (action === "getConfig" || action === "getSchoolConfig") {
      result = getSchoolConfig();
    }
    // 2. Publik: Ambil Nilai Asesmen Siswa (Pencarian NISN)
    else if (action === "getStudentScores" || action === "getStudentByNisn") {
      const targetNisn = params.nisn || params.arg0;
      result = getStudentByNisn(targetNisn);
    }
    // 3. Admin: Login
    else if (action === "loginAdmin") {
      const pass = params.password || params.arg0;
      result = loginAdmin(pass);
    }
    // 4. Admin: Verifikasi Token Sesi
    else if (action === "verifySession" || action === "verifyAdminSession") {
      const isValid = verifyAdminSession(auth);
      result = { success: isValid, valid: isValid };
    }
    // 5. Admin: Muat Seluruh Data Dashboard
    else if (action === "getAdminDashboardData") {
      result = getAdminDashboardData(auth);
    }
    // 6. Admin: Simpan/Perbarui Siswa
    else if (action === "saveStudent") {
      const studentData = params.studentData || params.arg1;
      result = saveStudent(auth, studentData);
    }
    // 7. Admin: Hapus Siswa
    else if (action === "deleteStudent") {
      const delNisn = params.nisn || params.arg1;
      result = deleteStudent(auth, delNisn);
    }
    // 8. Admin: Simpan Nilai Satuan
    else if (action === "saveGrade") {
      const gradeData = params.gradeData || params.arg1;
      result = saveGrade(auth, gradeData);
    }
    // 9. Admin: Hapus Nilai Satuan
    else if (action === "deleteGrade") {
      const gradeId = params.id || params.gradeId || params.arg1;
      result = deleteGrade(auth, gradeId);
    }
    // 10. Admin: Simpan Nilai Massal (Batch)
    else if (action === "batchSaveGrades") {
      const gradesList = params.gradesArray || params.gradesToSave || params.arg1;
      result = batchSaveGrades(auth, gradesList);
    }
    // 11. Admin: Simpan Matriks Leger Sekelas
    else if (action === "saveLegerMatrix") {
      const matrix = params.matrixData || params.currentParsedMatrix || params.arg1;
      result = saveLegerMatrix(auth, matrix);
    }
    // 12. Admin: Sinkronkan Sheet Leger_Nilai
    else if (action === "syncLegerData") {
      result = syncLegerData(auth);
    }
    // 13. Admin: Simpan Aset Media (Logo Pemda / Logo Sekolah / TTD)
    else if (action === "saveMediaAsset") {
      const key = params.key || params.arg1;
      const mediaData = params.dataUrl || params.mediaData || params.arg2;
      const label = params.label || params.arg3;
      const kategori = params.kategori || params.arg4;
      result = saveMediaAsset(auth, key, mediaData, label, kategori);
    }
    // 14. Admin: Hapus Aset Media
    else if (action === "deleteMediaAsset") {
      const key = params.key || params.arg1;
      result = deleteMediaAsset(auth, key);
    }
    // 15. Admin: Perbarui Pengaturan Sekolah
    else if (action === "updateSchoolConfig") {
      const newConfig = params.newConfig || params.arg1;
      result = updateSchoolConfig(auth, newConfig);
    }
    // 16. Admin: Reset / Inisialisasi Database
    else if (action === "setupSpreadsheet") {
      if (verifyAdminSession(auth)) {
        setupSpreadsheet();
        result = { success: true, message: "Database spreadsheet berhasil disiapkan ulang." };
      } else {
        result = { success: false, message: "Akses ditolak: Hanya admin yang dapat menyiapkan spreadsheet." };
      }
    }
  } catch (err) {
    result = { success: false, message: "Terjadi kesalahan pada sistem: " + err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Endpoint POST Web App (doPost)
 * Menangani payload JSON dari Vercel/frontend eksternal tanpa masalah CORS
 */
function doPost(e) {
  let params = {};
  try {
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (eParse) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }
  } catch (err) {
    params = (e && e.parameter) || {};
  }
  return handleApiRequest(params);
}

/**
 * FUNGSI SETUP OTOMATIS SPREADSHEET
 * Menyiapkan sheet database yang rapi dan mudah diisi manual/bulk oleh guru
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet Pengaturan
  let sheetConfig = ss.getSheetByName(SHEET_PENGATURAN);
  if (!sheetConfig) sheetConfig = ss.insertSheet(SHEET_PENGATURAN);
  sheetConfig.clear();
  sheetConfig.getRange("A:B").setNumberFormat("@"); // Format teks murni agar tidak pernah terjadi formula error
  sheetConfig.getRange("A1:B1").setValues([["Kunci_Pengaturan", "Nilai"]]).setFontWeight("bold").setBackground("#4F46E5").setFontColor("#FFFFFF");
  const defaultConfigs = [
    ["PEMERINTAH_DAERAH", "PEMERINTAH DAERAH / DINAS PENDIDIKAN"],
    ["NAMA_SEKOLAH", "SMP NEGERI 1 HARAPAN BANGSA"],
    ["ALAMAT_SEKOLAH", "Jl. Pendidikan No. 45, Kota Harapan"],
    ["TELP_SEKOLAH", "(021) 555-1234"],
    ["TAHUN_AJARAN", "2025/2026"],
    ["SEMESTER", "Ganjil"],
    ["JENIS_ASESMEN_AKTIF", "Penilaian Akhir Semester (PAS)"],
    ["PASSWORD_ADMIN", "admin123"],
    ["TANGGAL_BAGI_RAPOR", "18 Desember 2025"],
    ["KOTA_TERBIT", "Jakarta"],
    ["NAMA_KEPALA_SEKOLAH", "Drs. H. Mulyadi, M.Pd."],
    ["NIP_KEPALA_SEKOLAH", "19720315 199802 1 004"]
  ];
  sheetConfig.getRange(2, 1, defaultConfigs.length, 2).setValues(defaultConfigs);
  sheetConfig.autoResizeColumns(1, 2);

  // 2. Sheet Data Siswa
  let sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (!sheetSiswa) sheetSiswa = ss.insertSheet(SHEET_SISWA);
  sheetSiswa.clear();
  const headerSiswa = ["NISN", "Nama_Siswa", "Kelas", "Jenis_Kelamin", "Wali_Kelas", "Status_Siswa"];
  sheetSiswa.getRange(1, 1, 1, headerSiswa.length).setValues([headerSiswa]).setFontWeight("bold").setBackground("#0EA5E9").setFontColor("#FFFFFF");
  const sampleSiswa = [
    ["0081234567", "Ahmad Fauzan Pratama", "8-A", "L", "Budi Santoso, S.Pd.", "Aktif"],
    ["0082345678", "Siti Aisyah Rahmawati", "8-A", "P", "Budi Santoso, S.Pd.", "Aktif"],
    ["0083456789", "Muhammad Rizky Kurniawan", "8-B", "L", "Dewi Lestari, S.Pd.", "Aktif"],
    ["0084567890", "Cantika Putri Maharani", "8-B", "P", "Dewi Lestari, S.Pd.", "Aktif"],
    ["0085678901", "Dimas Arya Wicaksana", "9-A", "L", "Agus Setiawan, M.Pd.", "Aktif"]
  ];
  sheetSiswa.getRange(2, 1, sampleSiswa.length, headerSiswa.length).setNumberFormat("@").setValues(sampleSiswa);
  sheetSiswa.autoResizeColumns(1, headerSiswa.length);

  // 3. Sheet Data Nilai (Format Ringkas & Praktis untuk Copy-Paste / Bulk Langsung di Spreadsheet)
  let sheetNilai = ss.getSheetByName(SHEET_NILAI);
  if (!sheetNilai) sheetNilai = ss.insertSheet(SHEET_NILAI);
  sheetNilai.clear();
  const headerNilai = ["ID_Nilai", "NISN", "Mata_Pelajaran", "Jenis_Asesmen", "Nilai"];
  sheetNilai.getRange(1, 1, 1, headerNilai.length).setValues([headerNilai]).setFontWeight("bold").setBackground("#10B981").setFontColor("#FFFFFF");

  const mapelList = [
    { mapel: "PAI", n1: 88, n2: 92 },
    { mapel: "Pendidikan Pancasila", n1: 82, n2: 86 },
    { mapel: "Bahasa Indonesia", n1: 85, n2: 90 },
    { mapel: "Bahasa Inggris", n1: 86, n2: 94 },
    { mapel: "IPS", n1: 84, n2: 87 },
    { mapel: "Matematika", n1: 78, n2: 95 },
    { mapel: "IPA", n1: 80, n2: 89 },
    { mapel: "PJOK", n1: 85, n2: 88 },
    { mapel: "Seni Budaya", n1: 83, n2: 85 },
    { mapel: "Informatika", n1: 90, n2: 96 },
    { mapel: "Bahasa Jawa", n1: 88, n2: 91 }
  ];

  const sampleNilai = [];
  let counter = 1;
  mapelList.forEach(m => {
    sampleNilai.push([
      "NL-" + ("000" + counter++).slice(-4),
      "0081234567",
      m.mapel,
      "Penilaian Akhir Semester (PAS)",
      m.n1
    ]);
  });
  mapelList.forEach(m => {
    sampleNilai.push([
      "NL-" + ("000" + counter++).slice(-4),
      "0082345678",
      m.mapel,
      "Penilaian Akhir Semester (PAS)",
      m.n2
    ]);
  });
  sheetNilai.getRange(2, 1, sampleNilai.length, headerNilai.length).setValues(sampleNilai);
  sheetNilai.autoResizeColumns(1, headerNilai.length);

  // 4. Sheet Data Media (Logo & Stempel Sekolah)
  let sheetMedia = ss.getSheetByName(SHEET_MEDIA);
  if (!sheetMedia) sheetMedia = ss.insertSheet(SHEET_MEDIA);
  sheetMedia.clear();
  const headerMedia = ["Key", "Kategori", "Label", "Media_Data", "Update_At"];
  sheetMedia.getRange(1, 1, 1, headerMedia.length).setValues([headerMedia]).setFontWeight("bold").setBackground("#8B5CF6").setFontColor("#FFFFFF");
  sheetMedia.autoResizeColumns(1, headerMedia.length);

  // 5. Sheet Leger Nilai (Format Matriks Sekelas Praktis untuk Copy-Paste Langsung Guru)
  let sheetLeger = ss.getSheetByName(SHEET_LEGER);
  if (!sheetLeger) sheetLeger = ss.insertSheet(SHEET_LEGER);
  sheetLeger.clear();
  const headerLeger = [
    "NISN", "Nama_Siswa", "Kelas",
    "PAI", "Pendidikan Pancasila", "Bahasa Indonesia", "Bahasa Inggris",
    "IPS", "Matematika", "IPA", "PJOK", "Seni Budaya", "Informatika", "Bahasa Jawa"
  ];
  sheetLeger.getRange(1, 1, 1, headerLeger.length)
    .setValues([headerLeger])
    .setFontWeight("bold")
    .setBackground("#F59E0B")
    .setFontColor("#FFFFFF");

  const sampleLeger = [
    ["0081234567", "Ahmad Fauzan Pratama", "8-A", 88, 82, 85, 86, 84, 78, 80, 85, 83, 90, 88],
    ["0082345678", "Siti Aisyah Rahmawati", "8-A", 92, 86, 90, 94, 87, 95, 89, 88, 85, 96, 91],
    ["0083456789", "Muhammad Rizky Kurniawan", "8-B", 85, 80, 82, 84, 80, 75, 82, 86, 80, 88, 85],
    ["0084567890", "Cantika Putri Maharani", "8-B", 86, 84, 88, 90, 85, 82, 85, 87, 86, 92, 89],
    ["0085678901", "Dimas Arya Wicaksana", "9-A", 84, 82, 85, 85, 83, 80, 82, 84, 82, 88, 86]
  ];
  sheetLeger.getRange(2, 1, sampleLeger.length, headerLeger.length).setNumberFormat("@").setValues(sampleLeger);
  sheetLeger.autoResizeColumns(1, headerLeger.length);

  clearAllCache();
  return "Setup Berhasil! Struktur Database Asesmen & Leger Telah Siap Digunakan.";
}

/**
 * ==========================================================================
 * SISTEM KEAMANAN & SANITASI INPUT
 * ==========================================================================
 */
function sanitizeSheetInput(val) {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  return str;
}

function isValidImageDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return false;
  return /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl);
}

/**
 * Normalisasi NISN: Menjaga angka 0 di depan NISN (10 digit) tidak hilang akibat auto-format Google Sheets
 */
function formatNisn(val) {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  if (str.startsWith("'")) str = str.substring(1).trim();
  if (str.includes("E+") || str.includes("e+")) {
    str = Number(str).toFixed(0);
  }
  str = str.replace(/\.0+$/, "").replace(/[^0-9]/g, "");
  if (!str) return "";
  // Di Indonesia standar NISN adalah 10 digit. Jika terpotong menjadi 7-9 digit di spreadsheet, lengkapi kembali
  if (str.length >= 7 && str.length < 10) {
    str = str.padStart(10, "0");
  }
  return str;
}

function isValidNisn(nisn) {
  if (!nisn) return false;
  const clean = formatNisn(nisn);
  return /^[0-9]{5,15}$/.test(clean);
}

/**
 * Menu Mandiri di Spreadsheet: Otomatis memulihkan angka nol di depan NISN pada Data_Siswa, Data_Nilai, dan Leger_Nilai
 */
function menuRepairNisn() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let totalFixed = 0;

    // 1. Perbaiki Data_Siswa
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
      sheetSiswa.getRange("A2:A" + sheetSiswa.getLastRow()).setNumberFormat("@");
      const dataS = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 1).getValues();
      for (let i = 0; i < dataS.length; i++) {
        const raw = dataS[i][0];
        const fixed = formatNisn(raw);
        if (fixed && fixed !== String(raw)) {
          sheetSiswa.getRange(i + 2, 1).setValue("'" + fixed);
          totalFixed++;
        }
      }
    }

    // 2. Perbaiki Data_Nilai
    const sheetNilai = ss.getSheetByName(SHEET_NILAI);
    if (sheetNilai && sheetNilai.getLastRow() > 1) {
      sheetNilai.getRange("B2:B" + sheetNilai.getLastRow()).setNumberFormat("@");
      const dataN = sheetNilai.getRange(2, 2, sheetNilai.getLastRow() - 1, 1).getValues();
      for (let j = 0; j < dataN.length; j++) {
        const raw = dataN[j][0];
        const fixed = formatNisn(raw);
        if (fixed && fixed !== String(raw)) {
          sheetNilai.getRange(j + 2, 2).setValue("'" + fixed);
          totalFixed++;
        }
      }
    }

    // 3. Perbaiki Leger_Nilai jika ada kolom NISN
    const sheetLeger = ss.getSheetByName(SHEET_LEGER);
    if (sheetLeger && sheetLeger.getLastRow() > 1) {
      const headerL = sheetLeger.getRange(1, 1, 1, sheetLeger.getLastColumn()).getValues()[0];
      let colNisnIdx = -1;
      for (let c = 0; c < headerL.length; c++) {
        if (String(headerL[c]).toLowerCase().includes("nisn") || String(headerL[c]).toLowerCase() === "nis") {
          colNisnIdx = c + 1;
          break;
        }
      }
      if (colNisnIdx > 0) {
        sheetLeger.getRange(2, colNisnIdx, sheetLeger.getLastRow() - 1, 1).setNumberFormat("@");
        const dataL = sheetLeger.getRange(2, colNisnIdx, sheetLeger.getLastRow() - 1, 1).getValues();
        for (let k = 0; k < dataL.length; k++) {
          const raw = dataL[k][0];
          const fixed = formatNisn(raw);
          if (fixed && fixed !== String(raw)) {
            sheetLeger.getRange(k + 2, colNisnIdx).setValue("'" + fixed);
            totalFixed++;
          }
        }
      }
    }

    SpreadsheetApp.getUi().alert("Perbaikan NISN Selesai! Sebanyak " + totalFixed + " data NISN yang kehilangan angka 0 di depannya telah berhasil dipulihkan.");
  } catch (err) {
    SpreadsheetApp.getUi().alert("Error: " + err.message);
  }
}

/**
 * Mendeteksi apakah suatu nilai adalah nama guru / wali kelas (mengandung gelar atau format nama orang)
 */
function isLikelyTeacherName(str) {
  if (!str) return false;
  const s = String(str).trim();
  // Deteksi gelar akademik Indonesia
  if (/\b(S\.Pd|M\.Pd|S\.Ag|M\.Ag|S\.Si|M\.Si|S\.Kom|M\.Kom|S\.E|M\.M|S\.T|M\.T|S\.Sos|Drs|Dra|Dr|Prof|H\.|Hj\.)\b/i.test(s)) {
    return true;
  }
  // Deteksi nama orang (terdiri dari 2 kata atau lebih tanpa angka kelas atau romawi jenjang)
  if (/^[A-Za-z\s\.,\']+$/.test(s) && s.indexOf(' ') !== -1 && !/\b(VII|VIII|IX|X|XI|XII)\b/i.test(s)) {
    if (s.split(/\s+/).length >= 2 && !/^(kelas|kls|rombel|tingkat)\b/i.test(s)) {
      return true;
    }
  }
  return false;
}

/**
 * Mendeteksi apakah suatu nilai adalah nama kelas (misal: "8-A", "Kelas 7", "VII B", "9.1")
 */
function isLikelyClassName(str) {
  if (!str) return false;
  const s = String(str).trim();
  if (/\b(VII|VIII|IX|7|8|9)\b/i.test(s) || /^\d+[\s\-_]?[A-Za-z0-9]*$/.test(s) || /^(kelas|kls|rombel)\b/i.test(s)) {
    return true;
  }
  return false;
}

/**
 * Helper untuk menentukan Jenjang (Tingkat Kelas) dari string kelas siswa
 * Contoh: "8-A", "VIII B", "Kelas 8", "IX.1" -> Jenjang "8", "9", "7"
 */
function extractJenjang(kelasStr) {
  if (!kelasStr) return "8";
  if (isLikelyTeacherName(kelasStr)) return "8";
  const str = String(kelasStr).trim().toUpperCase();
  if (/\b(IX|9)\b/.test(str) || str.indexOf("IX") !== -1 || str.indexOf("9") !== -1) return "9";
  if (/\b(VIII|8)\b/.test(str) || str.indexOf("VIII") !== -1 || str.indexOf("8") !== -1) return "8";
  if (/\b(VII|7)\b/.test(str) || str.indexOf("VII") !== -1 || str.indexOf("7") !== -1) return "7";
  const match = str.match(/\d+/);
  return match ? match[0] : "8";
}

/**
 * Helper fleksibel untuk membaca kolom dari sheet Data_Nilai
 * Memungkinkan guru copy-paste langsung di Google Sheets meski urutan kolom beda
 */
function detectNilaiColumns(headers) {
  const map = { id: 0, nisn: 1, mapel: 2, jenis: 3, nilai: 4 };
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i]).toLowerCase().trim().replace(/[\s_]+/g, "");
    if (h.indexOf("nisn") !== -1) map.nisn = i;
    else if (h.indexOf("mapel") !== -1 || h.indexOf("matapelajaran") !== -1 || h.indexOf("pelajaran") !== -1) map.mapel = i;
    else if (h === "nilai" || h === "skor" || h.indexOf("angka") !== -1) map.nilai = i;
    else if (h.indexOf("jenis") !== -1 || h.indexOf("asesmen") !== -1 || h.indexOf("ulangan") !== -1) map.jenis = i;
    else if (h.indexOf("id") !== -1) map.id = i;
  }
  return map;
}

/**
 * Helper fleksibel untuk membaca kolom dari sheet Data_Siswa
 * PENTING: Mendeteksi Wali Kelas secara terpisah agar tidak tertukar dengan Kelas
 */
function detectSiswaColumns(headers) {
  const map = { nisn: 0, nama: 1, kelas: 2, jk: 3, wali: 4, status: 5 };
  for (let i = 0; i < headers.length; i++) {
    const raw = String(headers[i] || "").trim();
    if (!raw) continue;
    const h = raw.toLowerCase().replace(/[\s_\.\-]+/g, "");

    if (h.indexOf("nisn") !== -1) {
      map.nisn = i;
    } else if (h.indexOf("wali") !== -1) {
      // PENTING: Wali_Kelas harus dideteksi sebelum Kelas agar tidak tertukar!
      map.wali = i;
    } else if ((h.indexOf("nama") !== -1 || h === "siswa" || h === "pesertadidik") && h.indexOf("wali") === -1) {
      map.nama = i;
    } else if (h.indexOf("kelas") !== -1 || h.indexOf("rombel") !== -1 || h === "tingkat") {
      map.kelas = i;
    } else if (h.indexOf("kelamin") !== -1 || h === "jk") {
      map.jk = i;
    } else if (h.indexOf("status") !== -1) {
      map.status = i;
    }
  }
  return map;
}

/**
 * Parsing Nilai Angka Aman (Mendukung koma desimal Indonesia: "85,5" -> 85.5)
 */
function parseNumericScore(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === 'number') return val;
  const cleanStr = String(val).trim().replace(',', '.');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
}

/**
 * Helper fleksibel untuk membaca kolom dari sheet Leger_Nilai atau clipboard Excel
 * Mendeteksi kolom NISN, Nama, Kelas, Wali, dan otomatis mendeteksi kolom seluruh mata pelajaran
 */
function detectLegerColumns(headers) {
  let colNisn = -1;
  let colNama = -1;
  let colKelas = -1;
  let colWali = -1;
  const mapelCols = []; // array of { colIndex: number, mapelName: string }

  for (let i = 0; i < headers.length; i++) {
    const raw = String(headers[i] || "").trim();
    if (!raw) continue;
    const h = raw.toLowerCase().replace(/[\s_\.\-]+/g, "");

    if (h.indexOf("nisn") !== -1 && colNisn === -1) {
      colNisn = i;
    } else if (h.indexOf("wali") !== -1) {
      // PENTING: Deteksi kolom wali secara mandiri agar tidak tertukar dengan nama siswa atau kelas
      if (colWali === -1) colWali = i;
    } else if ((h.indexOf("nama") !== -1 || h.indexOf("siswa") !== -1) && colNama === -1) {
      colNama = i;
    } else if (
      h === "no" || h === "nomor" || 
      h === "jk" || h === "kelamin" || h === "jeniskelamin" || 
      h === "ket" || h === "keterangan" || h === "status"
    ) {
      // Abaikan kolom metadata tambahan
      continue;
    } else if ((h.indexOf("kelas") !== -1 || h.indexOf("rombel") !== -1 || h === "tingkat") && colKelas === -1) {
      colKelas = i;
    } else {
      mapelCols.push({ colIndex: i, mapelName: raw });
    }
  }

  return { colNisn: colNisn, colNama: colNama, colKelas: colKelas, colWali: colWali, mapelCols: mapelCols };
}

/**
 * Urutan Resmi Mata Pelajaran Sesuai Ketentuan Kurikulum:
 * 1. PAI (Pendidikan Agama Islam / Budi Pekerti)
 * 2. Pendidikan Pancasila (PPKn / PKn)
 * 3. Bahasa Indonesia
 * 4. Bahasa Inggris
 * 5. IPS (Ilmu Pengetahuan Sosial)
 * 6. Matematika
 * 7. IPA (Ilmu Pengetahuan Alam)
 * 8. PJOK (Pendidikan Jasmani, Olahraga & Kesehatan)
 * 9. Seni Budaya
 * 10. Informatika
 * 11. Bahasa Jawa (Muatan Lokal)
 */
function getMapelOrderIndex(mapelName) {
  if (!mapelName) return 999;
  const m = String(mapelName).toLowerCase().trim().replace(/[\s_\.\-\&]+/g, " ");

  // 1. PAI
  if (m === "pai" || m.indexOf("agama") !== -1 || m.indexOf("budi pekerti") !== -1 || m.indexOf("islam") !== -1) return 1;
  // 2. Pendidikan Pancasila
  if (m.indexOf("pancasila") !== -1 || m === "pkn" || m === "ppkn" || m.indexOf("kewarganegaraan") !== -1) return 2;
  // 3. Bahasa Indonesia
  if (m.indexOf("indonesia") !== -1 || m === "bin" || m === "b indo") return 3;
  // 4. Bahasa Inggris
  if (m.indexOf("inggris") !== -1 || m === "big" || m === "b ing" || m === "english") return 4;
  // 5. IPS
  if (m === "ips" || m.indexOf("sosial") !== -1) return 5;
  // 6. Matematika
  if (m.indexOf("matematika") !== -1 || m === "mtk" || m === "math") return 6;
  // 7. IPA
  if (m === "ipa" || m.indexOf("alam") !== -1 || m.indexOf("sains") !== -1) return 7;
  // 8. PJOK
  if (m.indexOf("pjok") !== -1 || m.indexOf("jasmani") !== -1 || m.indexOf("olahraga") !== -1 || m === "penjas") return 8;
  // 9. Seni Budaya
  if (m.indexOf("seni") !== -1 || m.indexOf("budaya") !== -1 || m === "sbk") return 9;
  // 10. Informatika
  if (m.indexOf("informatika") !== -1 || m === "inf" || m === "tik" || m.indexOf("komputer") !== -1) return 10;
  // 11. Bahasa Jawa
  if (m.indexOf("jawa") !== -1 || m === "bjawa" || m === "b jawa") return 11;

  return 100;
}

/**
 * ==========================================================================
 * AUTENTIKASI ADMIN & RATE-LIMITING BRUTE-FORCE
 * ==========================================================================
 */
function getStoredAdminPassword() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PENGATURAN);
  let adminPass = "admin123";

  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === "PASSWORD_ADMIN") {
        adminPass = String(data[i][1]).trim();
        break;
      }
    }
  }
  return adminPass;
}

function verifyAdminSession(authCredential) {
  if (!authCredential) return false;
  const cred = String(authCredential).trim();

  const cache = CacheService.getScriptCache();
  if (cache.get("ADMIN_SESSION_" + cred) === "VALID") {
    return true;
  }

  const actualPass = getStoredAdminPassword();
  return cred === actualPass;
}

function loginAdmin(password) {
  const cache = CacheService.getScriptCache();

  const isLocked = cache.get("ADMIN_LOGIN_LOCKED");
  if (isLocked) {
    return {
      success: false,
      message: "Akses diblokir sementara karena terlalu banyak percobaan salah. Silakan coba kembali dalam 15 menit demi keamanan sistem."
    };
  }

  const cleanPass = String(password || "").trim();
  const actualPass = getStoredAdminPassword();

  if (cleanPass === actualPass) {
    cache.remove("ADMIN_FAIL_COUNT");
    cache.remove("ADMIN_LOGIN_LOCKED");

    const sessionToken = "TOK_" + Utilities.getUuid() + "_" + String(new Date().getTime());
    cache.put("ADMIN_SESSION_" + sessionToken, "VALID", SESSION_TTL_SECONDS);

    return {
      success: true,
      token: sessionToken,
      message: "Login Berhasil."
    };
  } else {
    let failCount = parseInt(cache.get("ADMIN_FAIL_COUNT") || "0", 10) + 1;
    cache.put("ADMIN_FAIL_COUNT", String(failCount), LOCKOUT_DURATION_SECONDS);

    if (failCount >= MAX_LOGIN_ATTEMPTS) {
      cache.put("ADMIN_LOGIN_LOCKED", "LOCKED", LOCKOUT_DURATION_SECONDS);
      return {
        success: false,
        message: "Peringatan Keamanan: Terlalu banyak percobaan gagal (5x). Akses login dikunci selama 15 menit."
      };
    }

    const sisa = MAX_LOGIN_ATTEMPTS - failCount;
    return {
      success: false,
      message: "Kata sandi salah. Sisa kesempatan: " + sisa + " kali sebelum sistem terkunci."
    };
  }
}

function logoutAdminApi(token) {
  if (token) {
    const cache = CacheService.getScriptCache();
    cache.remove("ADMIN_SESSION_" + String(token).trim());
  }
  return { success: true, message: "Sesi admin telah berakhir." };
}

/**
 * ==========================================================================
 * SISTEM CACHING GAS UNTUK 600+ SISWA
 * ==========================================================================
 */
function getCacheKeyVersion() {
  const cache = CacheService.getScriptCache();
  let ver = cache.get("CACHE_VERSION");
  if (!ver) {
    ver = String(new Date().getTime());
    cache.put("CACHE_VERSION", ver, 21600);
  }
  return ver;
}

function clearAllCache() {
  const cache = CacheService.getScriptCache();
  const newVer = String(new Date().getTime());
  cache.put("CACHE_VERSION", newVer, 21600);
}

/**
 * Mengambil Pengaturan Sekolah Publik
 */
function getSchoolConfig() {
  const cache = CacheService.getScriptCache();
  const ver = getCacheKeyVersion();
  const cached = cache.get("SCHOOL_CONFIG_" + ver);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (!parsed.media || !parsed.media.logoSekolah) {
        parsed.media = getPublicMediaAssets();
      }
      return parsed;
    } catch(e) {}
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_PENGATURAN);
  const config = {
    PEMERINTAH_DAERAH: "PEMERINTAH DAERAH / DINAS PENDIDIKAN",
    NAMA_SEKOLAH: "SMP NEGERI 1 HARAPAN BANGSA",
    ALAMAT_SEKOLAH: "Jl. Pendidikan No. 45, Kota Harapan",
    TELP_SEKOLAH: "(021) 555-1234",
    TAHUN_AJARAN: "2025/2026",
    SEMESTER: "Ganjil",
    JENIS_ASESMEN_AKTIF: "Penilaian Akhir Semester (PAS)",
    TANGGAL_BAGI_RAPOR: "18 Desember 2025",
    KOTA_TERBIT: "Jakarta",
    NAMA_KEPALA_SEKOLAH: "Drs. H. Mulyadi, M.Pd.",
    NIP_KEPALA_SEKOLAH: "19720315 199802 1 004"
  };

  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const key = String(data[i][0]).trim();
      let val = String(data[i][1]).trim();
      if (val.startsWith("'")) val = val.substring(1).trim();
      if (/^#(ERROR|NAME|REF|VALUE|N\/A)\b/i.test(val) || val.toLowerCase() === "undefined" || val.toLowerCase() === "null") {
        val = "";
      }
      if (key && key !== "PASSWORD_ADMIN") {
        config[key] = val;
      }
    }
  }

  // Normalisasi & perbaikan otomatis jika kontak telepon menggunakan alias atau terkena error formula
  if (!config.TELP_SEKOLAH) {
    config.TELP_SEKOLAH = config.TELPON_SEKOLAH || config.TELEPON_SEKOLAH || config.NO_TELP || config.TELP || config.TELEPON || "(021) 555-1234";
  }
  if (/^#(ERROR|NAME|REF|VALUE|N\/A)\b/i.test(config.TELP_SEKOLAH)) {
    config.TELP_SEKOLAH = "(021) 555-1234";
  }

  const media = getPublicMediaAssets();
  const result = { success: true, config: config, media: media };

  // Keamanan Apps Script: Jangan simpan jika ukuran melebihi limit kuota 100KB CacheService
  try {
    const strRes = JSON.stringify(result);
    if (strRes.length < 80000) {
      cache.put("SCHOOL_CONFIG_" + ver, strRes, 3600);
    } else {
      const lightConfig = { success: true, config: config, media: {} };
      cache.put("SCHOOL_CONFIG_" + ver, JSON.stringify(lightConfig), 3600);
    }
  } catch (eCache) {}

  return result;
}

function getPublicMediaAssets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_MEDIA);
  const media = {
    logoPemkot: "",
    logoSekolah: "",
    stempel: "",
    ttdKepsek: ""
  };

  if (!sheet) return media;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const val = String(data[i][3]).trim();
    if (!key || !val) continue;

    if (key === "LOGO_PEMKOT") media.logoPemkot = val;
    else if (key === "LOGO_SEKOLAH") media.logoSekolah = val;
    else if (key === "STEMPEL_SEKOLAH") media.stempel = ""; // Stempel resmi ditiadakan
    else if (key === "TTD_KEPSEK") media.ttdKepsek = val;
  }

  return media;
}

/**
 * PENCARIAN HASIL ASESMEN PESERTA DIDIK
 * Menghitung Rata-Rata Rapor Satu Sekolah dan Rata-Rata Mapel Satu Jenjang
 */
function getStudentByNisn(nisn) {
  if (!isValidNisn(nisn)) {
    return {
      success: false,
      message: "Format NISN tidak valid. NISN harus berupa angka (10 digit)."
    };
  }

  const cleanNisn = formatNisn(nisn);
  const cache = CacheService.getScriptCache();
  const ver = getCacheKeyVersion();
  const cacheKey = "STU_ASESMEN_" + ver + "_" + cleanNisn;
  const cached = cache.get(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const confRes = getSchoolConfig();
      parsed.config = confRes.config;
      parsed.media = confRes.media || {};
      return parsed;
    } catch(e) {}
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  const sheetNilai = ss.getSheetByName(SHEET_NILAI);

  if (!sheetSiswa || !sheetNilai) {
    return { success: false, message: "Database siswa atau nilai belum dikonfigurasi." };
  }

  // 1. Ambil Seluruh Data Siswa untuk Pemetaan Jenjang (Kelas 7, 8, atau 9)
  let dataSiswa = sheetSiswa.getDataRange().getValues();
  if (dataSiswa.length <= 1) {
    const sheetLeger = ss.getSheetByName(SHEET_LEGER);
    if (sheetLeger && sheetLeger.getLastRow() > 1) {
      syncLegerDataInternal();
      dataSiswa = sheetSiswa.getDataRange().getValues();
    }
  }

  if (dataSiswa.length <= 1) {
    return { success: false, message: "Belum ada data siswa di dalam sistem." };
  }

  const colSiswa = detectSiswaColumns(dataSiswa[0]);
  const nisnToJenjangMap = {};
  let targetStudent = null;

  for (let i = 1; i < dataSiswa.length; i++) {
    const rowNisn = formatNisn(dataSiswa[i][colSiswa.nisn]);
    if (!rowNisn) continue;

    let kelas = String(dataSiswa[i][colSiswa.kelas] || "").trim();
    let wali = String(dataSiswa[i][colSiswa.wali] || "").trim();

    // Koreksi otomatis jika di sheet Data_Siswa posisi Kelas dan Wali Kelas tertukar
    if (isLikelyTeacherName(kelas) && (isLikelyClassName(wali) || !wali)) {
      const tempK = kelas;
      kelas = wali || "";
      wali = tempK;
    }

    const jenjang = extractJenjang(kelas);
    nisnToJenjangMap[rowNisn] = jenjang;

    if (rowNisn === cleanNisn) {
      targetStudent = {
        nisn: rowNisn,
        nama: String(dataSiswa[i][colSiswa.nama] || "").trim(),
        kelas: kelas,
        jenjang: jenjang,
        jenisKelamin: String(dataSiswa[i][colSiswa.jk] || "L").trim(),
        waliKelas: wali,
        status: String(dataSiswa[i][colSiswa.status] || "Aktif").trim()
      };
    }
  }

  // Jika targetStudent belum ditemukan, cek apakah ada di Leger_Nilai yang belum disinkronkan
  if (!targetStudent) {
    const sheetLeger = ss.getSheetByName(SHEET_LEGER);
    if (sheetLeger && sheetLeger.getLastRow() > 1) {
      const syncRes = syncLegerDataInternal();
      if (syncRes && syncRes.success && syncRes.countSiswa > 0) {
        dataSiswa = sheetSiswa.getDataRange().getValues();
        for (let r = 1; r < dataSiswa.length; r++) {
          const rNisn = formatNisn(dataSiswa[r][colSiswa.nisn]);
          if (rNisn === cleanNisn) {
            let rKelas = String(dataSiswa[r][colSiswa.kelas] || "").trim();
            let rWali = String(dataSiswa[r][colSiswa.wali] || "").trim();
            if (isLikelyTeacherName(rKelas) && (isLikelyClassName(rWali) || !rWali)) {
              const tempR = rKelas;
              rKelas = rWali || "";
              rWali = tempR;
            }
            targetStudent = {
              nisn: rNisn,
              nama: String(dataSiswa[r][colSiswa.nama] || "").trim(),
              kelas: rKelas,
              jenjang: extractJenjang(rKelas),
              jenisKelamin: String(dataSiswa[r][colSiswa.jk] || "L").trim(),
              waliKelas: rWali,
              status: String(dataSiswa[r][colSiswa.status] || "Aktif").trim()
            };
            break;
          }
        }
      }
    }
  }

  // Proteksi Tambahan: Jika kelas masih berisi nama guru atau kosong, ambil dari sheet Leger_Nilai
  if (targetStudent && (!targetStudent.kelas || isLikelyTeacherName(targetStudent.kelas))) {
    const sheetLeger = ss.getSheetByName(SHEET_LEGER);
    if (sheetLeger && sheetLeger.getLastRow() > 1) {
      const legerData = sheetLeger.getDataRange().getValues();
      const detectedL = detectLegerColumns(legerData[0]);
      if (detectedL.colNisn !== -1 && detectedL.colKelas !== -1) {
        for (let r = 1; r < legerData.length; r++) {
          if (formatNisn(legerData[r][detectedL.colNisn]) === cleanNisn) {
            const lk = String(legerData[r][detectedL.colKelas] || "").trim();
            if (lk && !isLikelyTeacherName(lk)) {
              if (isLikelyTeacherName(targetStudent.kelas) && !targetStudent.waliKelas) {
                targetStudent.waliKelas = targetStudent.kelas;
              }
              targetStudent.kelas = lk;
              targetStudent.jenjang = extractJenjang(lk);
              break;
            }
          }
        }
      }
    }
  }

  if (!targetStudent) {
    return {
      success: false,
      message: "Data NISN '" + cleanNisn + "' tidak ditemukan. Pastikan 10 digit NISN sudah benar atau hubungi pihak sekolah."
    };
  }

  const studentJenjang = targetStudent.jenjang;

  // 2. Ambil Seluruh Data Nilai: Hitung Rata-Rata Sekolah & Rata-Rata Jenjang Per Mapel
  let dataNilai = sheetNilai.getDataRange().getValues();
  if (dataNilai.length <= 1) {
    const sheetLeger = ss.getSheetByName(SHEET_LEGER);
    if (sheetLeger && sheetLeger.getLastRow() > 1) {
      syncLegerDataInternal();
      dataNilai = sheetNilai.getDataRange().getValues();
    }
  }
  const colNilai = detectNilaiColumns(dataNilai[0]);

  let totalSchoolScore = 0;
  let totalSchoolRecords = 0;
  const jenjangMapelAggregates = {}; // key: "jenjang_mapelLower" -> { sum: 0, count: 0 }
  const studentGrades = [];
  let studentTotalScore = 0;
  let highestScore = 0;

  for (let j = 1; j < dataNilai.length; j++) {
    const row = dataNilai[j];
    const rowNisn = formatNisn(row[colNilai.nisn] || "");
    const mapel = String(row[colNilai.mapel] || "").trim();
    const rawVal = row[colNilai.nilai];

    if (!rowNisn || !mapel || rawVal === "" || rawVal === null || rawVal === undefined) {
      continue;
    }

    const score = parseNumericScore(rawVal);
    totalSchoolScore += score;
    totalSchoolRecords++;

    // Agregasi untuk jenjang siswa
    const rowJenjang = nisnToJenjangMap[rowNisn] || extractJenjang(rowNisn);
    const aggKey = rowJenjang + "###" + mapel.toLowerCase().trim();

    if (!jenjangMapelAggregates[aggKey]) {
      jenjangMapelAggregates[aggKey] = { sum: 0, count: 0 };
    }
    jenjangMapelAggregates[aggKey].sum += score;
    jenjangMapelAggregates[aggKey].count++;

    // Jika baris ini adalah nilai milik siswa yang dicari
    if (rowNisn === cleanNisn) {
      studentGrades.push({
        id: String(row[colNilai.id] || ("NL-" + j)).trim(),
        mapel: mapel,
        jenisAsesmen: String(row[colNilai.jenis] || "Penilaian Akhir Semester (PAS)").trim(),
        nilai: score
      });

      studentTotalScore += score;
      if (score > highestScore) highestScore = score;
    }
  }

  // Daftar 11 Mata Pelajaran Resmi Sesuai Ketentuan Kurikulum
  const standardSubjects = [
    "PAI",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Bahasa Inggris",
    "IPS",
    "Matematika",
    "IPA",
    "PJOK",
    "Seni Budaya",
    "Informatika",
    "Bahasa Jawa"
  ];

  // Kumpulkan seluruh mapel yang ada di database (11 standar + mapel kustom lain jika ada)
  const allSystemSubjects = new Set(standardSubjects);
  for (let j = 1; j < dataNilai.length; j++) {
    const m = String(dataNilai[j][colNilai.mapel] || "").trim();
    if (m) allSystemSubjects.add(m);
  }

  // Petakan urutan mapel yang sudah dimiliki siswa
  const existingMapelOrder = new Set();
  studentGrades.forEach(g => {
    existingMapelOrder.add(getMapelOrderIndex(g.mapel));
  });

  // TAMPILKAN SEMUA MAPEL WALAUPUN NILAI SISWA KOSONG
  allSystemSubjects.forEach(subName => {
    const o = getMapelOrderIndex(subName);
    if (!existingMapelOrder.has(o)) {
      studentGrades.push({
        id: "NL-KOSONG-" + o,
        mapel: subName,
        jenisAsesmen: "Penilaian Akhir Semester (PAS)",
        nilai: "-",
        isEmpty: true
      });
      existingMapelOrder.add(o);
    }
  });

  // Hitung Nilai Rata-Rata Satu Sekolah
  const schoolAverageScore = totalSchoolRecords > 0 
    ? (totalSchoolScore / totalSchoolRecords).toFixed(1) 
    : "0.0";

  // Lengkapi nilai siswa dengan rata-rata nilai mapel satu jenjang
  studentGrades.forEach(g => {
    const aggKey = studentJenjang + "###" + g.mapel.toLowerCase().trim();
    let agg = jenjangMapelAggregates[aggKey];
    if (!agg || agg.count === 0) {
      const gOrder = getMapelOrderIndex(g.mapel);
      for (const k in jenjangMapelAggregates) {
        if (k.startsWith(studentJenjang + "###")) {
          const mapelPart = k.split("###")[1];
          if (getMapelOrderIndex(mapelPart) === gOrder) {
            agg = jenjangMapelAggregates[k];
            break;
          }
        }
      }
    }

    if (agg && agg.count > 0) {
      g.rataRataJenjang = (agg.sum / agg.count).toFixed(1);
    } else {
      g.rataRataJenjang = (typeof g.nilai === 'number') ? g.nilai.toFixed(1) : "-";
    }
  });

  // Urutkan nilai siswa sesuai urutan standar kurikulum resmi:
  // 1. PAI, 2. Pendidikan Pancasila, 3. Bahasa Indonesia, 4. Bahasa Inggris,
  // 5. IPS, 6. Matematika, 7. IPA, 8. PJOK, 9. Seni Budaya, 10. Informatika, 11. Bahasa Jawa
  studentGrades.sort((a, b) => {
    const oA = getMapelOrderIndex(a.mapel);
    const oB = getMapelOrderIndex(b.mapel);
    if (oA !== oB) return oA - oB;
    return a.mapel.localeCompare(b.mapel);
  });

  let studentScoredCount = 0;
  studentGrades.forEach(g => {
    if (typeof g.nilai === 'number' && !g.isEmpty) {
      studentScoredCount++;
    }
  });

  const totalSubjects = studentGrades.length;
  const studentAverageScore = studentScoredCount > 0 
    ? (studentTotalScore / studentScoredCount).toFixed(1) 
    : "0.0";

  const configRes = getSchoolConfig();
  const mediaAssets = configRes.media || {};

  const response = {
    success: true,
    student: targetStudent,
    grades: studentGrades,
    statistics: {
      totalSubjects: totalSubjects,
      studentAverageScore: studentAverageScore,
      schoolAverageScore: schoolAverageScore,
      highestScore: highestScore,
      studentTotalScore: studentTotalScore,
      jenjangLevel: studentJenjang
    },
    config: configRes.config,
    media: {
      logoPemkot: mediaAssets.logoPemkot || "",
      logoSekolah: mediaAssets.logoSekolah || "",
      stempel: "",
      ttdKepsek: mediaAssets.ttdKepsek || ""
    }
  };

  try {
    // Keamanan Kuota Apps Script: Buat salinan data tanpa gambar Base64 media yang besar
    // agar ukuran JSON selalu berada di bawah limit 100KB CacheService
    const lightResponse = Object.assign({}, response, { media: {} });
    const cacheStr = JSON.stringify(lightResponse);
    if (cacheStr.length < 80000) {
      cache.put(cacheKey, cacheStr, 3600);
    }
  } catch (eCache) {
    // Abaikan error cache agar data nilai siswa tetap berhasil ditampilkan tanpa hambatan
  }

  return response;
}

/**
 * ==========================================================================
 * FUNGSI ADMIN: CRUD SISWA, NILAI, MEDIA & PENGATURAN
 * ==========================================================================
 */

/**
 * Ambil Dashboard Admin
 */
function getAdminDashboardData(auth) {
  if (!verifyAdminSession(auth)) {
    return { success: false, message: "Akses ditolak: Sesi tidak valid atau telah kedaluwarsa." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  const sheetNilai = ss.getSheetByName(SHEET_NILAI);
  const sheetConfig = ss.getSheetByName(SHEET_PENGATURAN);
  const sheetMedia = ss.getSheetByName(SHEET_MEDIA);

  const students = [];
  if (sheetSiswa) {
    const dataSiswa = sheetSiswa.getDataRange().getValues();
    const colS = detectSiswaColumns(dataSiswa[0]);
    for (let i = 1; i < dataSiswa.length; i++) {
      if (dataSiswa[i][colS.nisn]) {
        let k = String(dataSiswa[i][colS.kelas] || "").trim();
        let w = String(dataSiswa[i][colS.wali] || "").trim();
        if (isLikelyTeacherName(k) && (isLikelyClassName(w) || !w)) {
          const tmp = k;
          k = w;
          w = tmp;
        }
        students.push({
          nisn: formatNisn(dataSiswa[i][colS.nisn]),
          nama: String(dataSiswa[i][colS.nama] || "").trim(),
          kelas: k,
          jenisKelamin: String(dataSiswa[i][colS.jk] || "L").trim(),
          waliKelas: w,
          status: String(dataSiswa[i][colS.status] || "Aktif").trim()
        });
      }
    }
  }

  const grades = [];
  let totalScoreAll = 0;
  if (sheetNilai) {
    const dataNilai = sheetNilai.getDataRange().getValues();
    const colN = detectNilaiColumns(dataNilai[0]);
    for (let j = 1; j < dataNilai.length; j++) {
      if (dataNilai[j][colN.nisn]) {
        const val = parseNumericScore(dataNilai[j][colN.nilai]);
        totalScoreAll += val;
        grades.push({
          id: String(dataNilai[j][colN.id] || ("NL-" + j)).trim(),
          nisn: formatNisn(dataNilai[j][colN.nisn]),
          mapel: String(dataNilai[j][colN.mapel] || "").trim(),
          jenisAsesmen: String(dataNilai[j][colN.jenis] || "Penilaian Akhir Semester (PAS)").trim(),
          nilai: val
        });
      }
    }

    grades.sort((a, b) => {
      if (a.nisn !== b.nisn) return a.nisn.localeCompare(b.nisn);
      const oA = getMapelOrderIndex(a.mapel);
      const oB = getMapelOrderIndex(b.mapel);
      if (oA !== oB) return oA - oB;
      return a.mapel.localeCompare(b.mapel);
    });
  }

  const fullConfig = {};
  if (sheetConfig) {
    const dConf = sheetConfig.getDataRange().getValues();
    for (let k = 1; k < dConf.length; k++) {
      fullConfig[String(dConf[k][0]).trim()] = String(dConf[k][1]).trim();
    }
  }

  const mediaList = [];
  if (sheetMedia) {
    const dMed = sheetMedia.getDataRange().getValues();
    for (let m = 1; m < dMed.length; m++) {
      if (dMed[m][0]) {
        mediaList.push({
          key: String(dMed[m][0]).trim(),
          kategori: String(dMed[m][1]).trim(),
          label: String(dMed[m][2]).trim(),
          mediaData: String(dMed[m][3]).trim(),
          updateAt: String(dMed[m][4] || "")
        });
      }
    }
  }

  return {
    success: true,
    totalStudents: students.length,
    totalGrades: grades.length,
    averageSchoolScore: grades.length > 0 ? (totalScoreAll / grades.length).toFixed(1) : "0.0",
    students: students,
    grades: grades,
    config: fullConfig,
    media: mediaList
  };
}

/**
 * Simpan / Update Media
 */
function saveMediaAsset(auth, key, mediaData, label, kategori) {
  if (!verifyAdminSession(auth)) return { success: false, message: "Akses ditolak." };

  if (!isValidImageDataUrl(mediaData)) {
    return { success: false, message: "Format gambar tidak valid. Harap gunakan format PNG/JPEG/WEBP." };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_MEDIA);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_MEDIA);
      sheet.getRange(1, 1, 1, 5).setValues([["Key", "Kategori", "Label", "Media_Data", "Update_At"]]).setFontWeight("bold");
    }

    const cleanKey = sanitizeSheetInput(key);
    const cleanKategori = sanitizeSheetInput(kategori || "umum");
    const cleanLabel = sanitizeSheetInput(label || cleanKey);
    const timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

    const data = sheet.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === cleanKey) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, 5).setValues([[cleanKey, cleanKategori, cleanLabel, mediaData, timestamp]]);
    } else {
      sheet.appendRow([cleanKey, cleanKategori, cleanLabel, mediaData, timestamp]);
    }

    clearAllCache();
    return { success: true, message: "Aset '" + cleanLabel + "' berhasil disimpan!" };
  } catch(err) {
    return { success: false, message: "Gagal menyimpan media." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Hapus Media
 */
function deleteMediaAsset(auth, key) {
  if (!verifyAdminSession(auth)) return { success: false, message: "Akses ditolak." };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_MEDIA);
    if (!sheet) return { success: false, message: "Sheet media tidak ditemukan." };

    const cleanKey = String(key).trim();
    const data = sheet.getDataRange().getValues();
    let deleted = false;
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][0]).trim() === cleanKey) {
        sheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }

    clearAllCache();
    if (deleted) return { success: true, message: "Aset berhasil dihapus." };
    return { success: false, message: "Aset tidak ditemukan." };
  } catch(err) {
    return { success: false, message: "Gagal menghapus media." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Simpan / Update Siswa
 */
function saveStudent(auth, studentData) {
  if (!verifyAdminSession(auth)) return { success: false, message: "Akses ditolak." };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_SISWA);
    if (!sheet) {
      setupSpreadsheet();
      sheet = ss.getSheetByName(SHEET_SISWA);
    }

    const nisn = sanitizeSheetInput(studentData.nisn);
    const nama = sanitizeSheetInput(studentData.nama);
    const kelas = sanitizeSheetInput(studentData.kelas);
    const jk = sanitizeSheetInput(studentData.jenisKelamin || "L");
    const wali = sanitizeSheetInput(studentData.waliKelas || "");
    const status = sanitizeSheetInput(studentData.status || "Aktif");

    if (!nisn || !nama) {
      return { success: false, message: "NISN dan Nama Siswa wajib diisi." };
    }

    const data = sheet.getDataRange().getValues();
    const colS = detectSiswaColumns(data[0]);
    let foundRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][colS.nisn]).trim() === nisn) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, 6).setNumberFormat("@").setValues([[nisn, nama, kelas, jk, wali, status]]);
    } else {
      sheet.appendRow([nisn, nama, kelas, jk, wali, status]);
    }

    clearAllCache();
    return { success: true, message: "Data siswa '" + nama + "' berhasil disimpan." };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan siswa." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Hapus Siswa & Nilai Terkait
 */
function deleteStudent(auth, nisn) {
  if (!verifyAdminSession(auth)) return { success: false, message: "Akses ditolak." };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    const sheetNilai = ss.getSheetByName(SHEET_NILAI);
    const cleanNisn = formatNisn(nisn);

    if (sheetSiswa) {
      const data = sheetSiswa.getDataRange().getValues();
      const colS = detectSiswaColumns(data[0]);
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][colS.nisn]).trim() === cleanNisn) {
          sheetSiswa.deleteRow(i + 1);
        }
      }
    }

    if (sheetNilai) {
      const dataNilai = sheetNilai.getDataRange().getValues();
      const colN = detectNilaiColumns(dataNilai[0]);
      for (let j = dataNilai.length - 1; j >= 1; j--) {
        if (String(dataNilai[j][colN.nisn]).trim() === cleanNisn) {
          sheetNilai.deleteRow(j + 1);
        }
      }
    }

    clearAllCache();
    return { success: true, message: "Data siswa berhasil dihapus." };
  } catch (err) {
    return { success: false, message: "Gagal menghapus siswa." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Simpan / Update Nilai Tunggal
 */
function saveGrade(auth, gradeData) {
  if (!verifyAdminSession(auth)) return { success: false, message: "Akses ditolak." };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NILAI);
    if (!sheet) {
      setupSpreadsheet();
      sheet = ss.getSheetByName(SHEET_NILAI);
    }

    const nisn = sanitizeSheetInput(gradeData.nisn);
    const mapel = sanitizeSheetInput(gradeData.mapel);
    const jenis = sanitizeSheetInput(gradeData.jenisAsesmen || "Penilaian Akhir Semester (PAS)");
    const nilai = parseNumericScore(gradeData.nilai);
    let id = String(gradeData.id || "").trim();

    if (!nisn || !mapel) {
      return { success: false, message: "NISN dan Mata Pelajaran wajib diisi." };
    }

    const data = sheet.getDataRange().getValues();
    const colN = detectNilaiColumns(data[0]);
    let foundRow = -1;

    if (id) {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][colN.id]).trim() === id) {
          foundRow = i + 1;
          break;
        }
      }
    } else {
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][colN.nisn]).trim() === nisn && String(data[i][colN.mapel]).trim() === mapel) {
          foundRow = i + 1;
          id = String(data[i][colN.id]).trim();
          break;
        }
      }
    }

    if (!id) {
      id = "NL-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 100);
    }

    const rowValues = [id, nisn, mapel, jenis, nilai];
    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    clearAllCache();
    return { success: true, message: "Nilai " + mapel + " berhasil disimpan." };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan nilai." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Simpan Nilai Massal Sekelas
 */
function batchSaveGrades(auth, gradesArray) {
  if (!verifyAdminSession(auth)) return { success: false, message: "Akses ditolak." };
  if (!Array.isArray(gradesArray) || gradesArray.length === 0) {
    return { success: false, message: "Data nilai tidak boleh kosong." };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NILAI);
    if (!sheet) {
      setupSpreadsheet();
      sheet = ss.getSheetByName(SHEET_NILAI);
    }

    const data = sheet.getDataRange().getValues();
    const colN = detectNilaiColumns(data[0]);
    const idMap = {};
    for (let i = 1; i < data.length; i++) {
      const rowKey = String(data[i][colN.nisn]).trim() + "_" + String(data[i][colN.mapel]).trim();
      idMap[rowKey] = i + 1;
    }

    let updatedCount = 0;
    let addedCount = 0;

    gradesArray.forEach(item => {
      const nisn = sanitizeSheetInput(item.nisn);
      const mapel = sanitizeSheetInput(item.mapel);
      const jenis = sanitizeSheetInput(item.jenisAsesmen || "Penilaian Akhir Semester (PAS)");
      const nilai = parseNumericScore(item.nilai);

      const key = nisn + "_" + mapel;
      if (idMap[key]) {
        const rowNum = idMap[key];
        const existingId = String(data[rowNum - 1][colN.id] || ("NL-" + rowNum)).trim();
        sheet.getRange(rowNum, 1, 1, 5).setValues([[existingId, nisn, mapel, jenis, nilai]]);
        updatedCount++;
      } else {
        const newId = "NL-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss") + "-" + Math.floor(Math.random() * 1000);
        sheet.appendRow([newId, nisn, mapel, jenis, nilai]);
        addedCount++;
      }
    });

    clearAllCache();
    return {
      success: true,
      message: "Berhasil memproses: " + addedCount + " nilai baru, " + updatedCount + " nilai diperbarui."
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan batch nilai." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Hapus Nilai
 */
function deleteGrade(auth, gradeId) {
  if (!verifyAdminSession(auth)) return { success: false, message: "Akses ditolak." };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NILAI);
    if (!sheet) return { success: false, message: "Sheet nilai tidak ditemukan." };

    const data = sheet.getDataRange().getValues();
    const colN = detectNilaiColumns(data[0]);
    const cleanId = String(gradeId).trim();
    let deleted = false;

    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][colN.id]).trim() === cleanId) {
        sheet.deleteRow(i + 1);
        deleted = true;
        break;
      }
    }

    clearAllCache();
    if (deleted) return { success: true, message: "Nilai berhasil dihapus." };
    return { success: false, message: "ID Nilai tidak ditemukan." };
  } catch (err) {
    return { success: false, message: "Gagal menghapus nilai." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Update Pengaturan Sekolah
 */
function updateSchoolConfig(auth, newConfig) {
  if (!verifyAdminSession(auth)) return { success: false, message: "Akses ditolak." };

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_PENGATURAN);
    if (!sheet) {
      setupSpreadsheet();
      sheet = ss.getSheetByName(SHEET_PENGATURAN);
    }

    const data = sheet.getDataRange().getValues();
    const keyRowMap = {};
    for (let i = 1; i < data.length; i++) {
      keyRowMap[String(data[i][0]).trim()] = i + 1;
    }

    for (let key in newConfig) {
      if (newConfig.hasOwnProperty(key)) {
        const cleanKey = String(key).trim();
        let rawVal = String(newConfig[key] || "").trim();
        if (rawVal.startsWith("'")) rawVal = rawVal.substring(1).trim();
        const cleanVal = sanitizeSheetInput(rawVal);
        if (keyRowMap[cleanKey]) {
          sheet.getRange(keyRowMap[cleanKey], 2).setNumberFormat("@").setValue(cleanVal);
        } else {
          sheet.appendRow([cleanKey, cleanVal]);
          sheet.getRange(sheet.getLastRow(), 1, 1, 2).setNumberFormat("@");
        }
      }
    }

    clearAllCache();
    return { success: true, message: "Pengaturan sekolah berhasil diperbarui!" };
  } catch (err) {
    return { success: false, message: "Gagal memperbarui pengaturan." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * ==========================================================================
 * SISTEM PENGISIAN NILAI LEGER (MATRIKS KELAS HORIZONTAL)
 * Memungkinkan Guru Input Nilai Ratusan Siswa & Semua Mapel Sekaligus
 * ==========================================================================
 */

/**
 * Sinkronisasi Data dari Sheet 'Leger_Nilai' ke Database Sistem
 * (Dapat dipanggil dari Menu Spreadsheet maupun Web Admin)
 */
function syncLegerDataInternal() {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetLeger = ss.getSheetByName(SHEET_LEGER);
    let sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    let sheetNilai = ss.getSheetByName(SHEET_NILAI);

    if (!sheetLeger) {
      return { success: false, message: "Sheet 'Leger_Nilai' tidak ditemukan di Spreadsheet." };
    }
    if (!sheetSiswa || !sheetNilai) {
      setupSpreadsheet();
      sheetSiswa = ss.getSheetByName(SHEET_SISWA);
      sheetNilai = ss.getSheetByName(SHEET_NILAI);
    }

    const legerData = sheetLeger.getDataRange().getValues();
    if (legerData.length <= 1) {
      return { success: false, message: "Sheet 'Leger_Nilai' masih kosong atau belum ada data nilai siswa." };
    }

    const header = legerData[0];
    const detected = detectLegerColumns(header);

    if (detected.colNisn === -1) {
      return { success: false, message: "Kolom 'NISN' tidak ditemukan pada baris judul sheet 'Leger_Nilai'." };
    }
    if (detected.mapelCols.length === 0) {
      return { success: false, message: "Tidak ada kolom mata pelajaran yang terdeteksi di sheet 'Leger_Nilai'." };
    }

    // 1. Sinkronisasi Data Siswa (Otomatis Daftarkan Siswa Baru & Perbaiki Kelas Siswa)
    const dataSiswa = sheetSiswa.getDataRange().getValues();
    const colS = detectSiswaColumns(dataSiswa[0]);
    const existingSiswaMap = new Map();
    for (let i = 1; i < dataSiswa.length; i++) {
      const n = String(dataSiswa[i][colS.nisn] || "").trim();
      if (n) existingSiswaMap.set(n, i);
    }

    const newStudentsToAppend = [];
    let siswaUpdated = false;

    for (let r = 1; r < legerData.length; r++) {
      const row = legerData[r];
      const nisn = String(row[detected.colNisn] || "").trim();
      if (!nisn) continue;

      let nama = detected.colNama !== -1 ? String(row[detected.colNama] || "").trim() : ("Siswa " + nisn);
      let kelas = detected.colKelas !== -1 ? String(row[detected.colKelas] || "").trim() : "8-A";
      let wali = detected.colWali !== -1 ? String(row[detected.colWali] || "").trim() : "";

      // Proteksi jika kolom nama atau kelas tertukar dengan wali kelas di sheet Leger
      if (isLikelyTeacherName(kelas) && (isLikelyClassName(wali) || !wali)) {
        const tmp = kelas;
        kelas = wali || "8-A";
        wali = tmp;
      }

      if (!existingSiswaMap.has(nisn)) {
        newStudentsToAppend.push([nisn, nama, kelas, "L", wali, "Aktif"]);
        existingSiswaMap.set(nisn, dataSiswa.length + newStudentsToAppend.length - 1);
      } else {
        const rowIndex = existingSiswaMap.get(nisn);
        const curKelas = String(dataSiswa[rowIndex][colS.kelas] || "").trim();
        const curWali = String(dataSiswa[rowIndex][colS.wali] || "").trim();

        if (isLikelyTeacherName(curKelas)) {
          if (!curWali || isLikelyClassName(curWali)) {
            dataSiswa[rowIndex][colS.wali] = curKelas;
          }
          dataSiswa[rowIndex][colS.kelas] = kelas;
          siswaUpdated = true;
        } else if (kelas && curKelas !== kelas) {
          dataSiswa[rowIndex][colS.kelas] = kelas;
          siswaUpdated = true;
        }

        if (wali && curWali !== wali && !isLikelyClassName(wali)) {
          dataSiswa[rowIndex][colS.wali] = wali;
          siswaUpdated = true;
        }

        if (nama && nama !== ("Siswa " + nisn) && String(dataSiswa[rowIndex][colS.nama] || "").trim() !== nama) {
          dataSiswa[rowIndex][colS.nama] = nama;
          siswaUpdated = true;
        }
      }
    }

    if (siswaUpdated && dataSiswa.length > 1) {
      sheetSiswa.getRange(1, 1, dataSiswa.length, dataSiswa[0].length).setNumberFormat("@").setValues(dataSiswa);
    }

    if (newStudentsToAppend.length > 0) {
      const startRow = sheetSiswa.getLastRow() + 1;
      sheetSiswa.getRange(startRow, 1, newStudentsToAppend.length, 6).setNumberFormat("@").setValues(newStudentsToAppend);
    }

    // 2. Sinkronisasi Data Nilai (Batch 2D array update / append)
    const dataNilai = sheetNilai.getDataRange().getValues();
    const colN = detectNilaiColumns(dataNilai[0]);

    // Map: key = nisn + "_" + mapelLower -> index in dataNilai array
    const nilaiMap = new Map();
    for (let j = 1; j < dataNilai.length; j++) {
      const rowNisn = String(dataNilai[j][colN.nisn] || "").trim();
      const rowMapel = String(dataNilai[j][colN.mapel] || "").trim().toLowerCase();
      if (rowNisn && rowMapel) {
        nilaiMap.set(rowNisn + "_" + rowMapel, j);
      }
    }

    // Ambil jenis asesmen default dari config
    let jenisAsesmen = "Penilaian Akhir Semester (PAS)";
    const sheetConfig = ss.getSheetByName(SHEET_PENGATURAN);
    if (sheetConfig) {
      const dConf = sheetConfig.getDataRange().getValues();
      for (let k = 1; k < dConf.length; k++) {
        if (String(dConf[k][0]).trim() === "JENIS_ASESMEN_AKTIF") {
          const val = String(dConf[k][1]).trim();
          if (val) jenisAsesmen = val;
          break;
        }
      }
    }

    let updatedCount = 0;
    let addedCount = 0;
    let totalSiswaProcessed = 0;

    for (let r = 1; r < legerData.length; r++) {
      const row = legerData[r];
      const nisn = String(row[detected.colNisn] || "").trim();
      if (!nisn) continue;
      totalSiswaProcessed++;

      detected.mapelCols.forEach(mCol => {
        const rawScore = row[mCol.colIndex];
        if (rawScore !== "" && rawScore !== null && rawScore !== undefined) {
          const numScore = parseNumericScore(rawScore);
          const key = nisn + "_" + mCol.mapelName.toLowerCase().trim();

          if (nilaiMap.has(key)) {
            const rowIndex = nilaiMap.get(key);
            dataNilai[rowIndex][colN.nilai] = numScore;
            dataNilai[rowIndex][colN.jenis] = jenisAsesmen;
            updatedCount++;
          } else {
            const newId = "NL-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss") + "-" + (addedCount + 1);
            const newRow = [newId, nisn, mCol.mapelName, jenisAsesmen, numScore];
            dataNilai.push(newRow);
            nilaiMap.set(key, dataNilai.length - 1);
            addedCount++;
          }
        }
      });
    }

    // Tulis kembali dataNilai sekaligus ke sheet Data_Nilai
    if (dataNilai.length > 0) {
      sheetNilai.getRange(1, 1, dataNilai.length, 5).setValues(dataNilai);
    }

    clearAllCache();

    return {
      success: true,
      countSiswa: totalSiswaProcessed,
      countNilai: updatedCount + addedCount,
      newStudents: newStudentsToAppend.length,
      updatedGrades: updatedCount,
      newGrades: addedCount,
      message: "Sukses! Berhasil menyinkronkan " + totalSiswaProcessed + " siswa (" + (updatedCount + addedCount) + " nilai asesmen) dari Leger_Nilai ke sistem."
    };
  } catch (err) {
    return { success: false, message: "Gagal menyinkronkan Leger: " + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Endpoint API Web Admin untuk Sinkronisasi Leger
 */
function syncLegerData(auth) {
  if (!verifyAdminSession(auth)) return { success: false, message: "Akses ditolak: Sesi tidak valid." };
  return syncLegerDataInternal();
}

/**
 * Menyimpan Matriks Leger Sekelas Langsung dari Paste Web Admin
 * (Auto-register siswa baru + Simpan seluruh nilai mapel dalam hitungan detik)
 */
function saveLegerMatrix(auth, matrixData) {
  if (!verifyAdminSession(auth)) return { success: false, message: "Akses ditolak: Sesi tidak valid." };
  if (!matrixData || !Array.isArray(matrixData.rows) || matrixData.rows.length === 0) {
    return { success: false, message: "Data tabel matriks tidak boleh kosong." };
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    let sheetNilai = ss.getSheetByName(SHEET_NILAI);
    let sheetLeger = ss.getSheetByName(SHEET_LEGER);

    if (!sheetSiswa || !sheetNilai) {
      setupSpreadsheet();
      sheetSiswa = ss.getSheetByName(SHEET_SISWA);
      sheetNilai = ss.getSheetByName(SHEET_NILAI);
      sheetLeger = ss.getSheetByName(SHEET_LEGER);
    }

    const jenisAsesmen = sanitizeSheetInput(matrixData.jenisAsesmen || "Penilaian Akhir Semester (PAS)");
    const subjects = matrixData.subjects || [];

    // 1. Auto-register siswa ke Data_Siswa & perbaiki kelas jika ada perubahan
    const dataSiswa = sheetSiswa.getDataRange().getValues();
    const colS = detectSiswaColumns(dataSiswa[0]);
    const existingSiswaMap = new Map();
    for (let i = 1; i < dataSiswa.length; i++) {
      const n = String(dataSiswa[i][colS.nisn] || "").trim();
      if (n) existingSiswaMap.set(n, i);
    }

    const newStudentsToAppend = [];
    let siswaUpdated = false;

    matrixData.rows.forEach(r => {
      const nisn = sanitizeSheetInput(r.nisn);
      const nama = sanitizeSheetInput(r.nama || ("Siswa " + nisn));
      let kelas = sanitizeSheetInput(r.kelas || "8-A");
      if (!nisn) return;

      if (isLikelyTeacherName(kelas)) {
        kelas = "8-A";
      }

      if (!existingSiswaMap.has(nisn)) {
        newStudentsToAppend.push([nisn, nama, kelas, "L", "", "Aktif"]);
        existingSiswaMap.set(nisn, dataSiswa.length + newStudentsToAppend.length - 1);
      } else {
        const rowIndex = existingSiswaMap.get(nisn);
        const curKelas = String(dataSiswa[rowIndex][colS.kelas] || "").trim();
        const curWali = String(dataSiswa[rowIndex][colS.wali] || "").trim();

        if (isLikelyTeacherName(curKelas)) {
          if (!curWali) dataSiswa[rowIndex][colS.wali] = curKelas;
          dataSiswa[rowIndex][colS.kelas] = kelas;
          siswaUpdated = true;
        } else if (kelas && curKelas !== kelas) {
          dataSiswa[rowIndex][colS.kelas] = kelas;
          siswaUpdated = true;
        }

        if (nama && nama !== ("Siswa " + nisn) && String(dataSiswa[rowIndex][colS.nama] || "").trim() !== nama) {
          dataSiswa[rowIndex][colS.nama] = nama;
          siswaUpdated = true;
        }
      }
    });

    if (siswaUpdated && dataSiswa.length > 1) {
      sheetSiswa.getRange(1, 1, dataSiswa.length, dataSiswa[0].length).setNumberFormat("@").setValues(dataSiswa);
    }

    if (newStudentsToAppend.length > 0) {
      const startRow = sheetSiswa.getLastRow() + 1;
      sheetSiswa.getRange(startRow, 1, newStudentsToAppend.length, 6).setNumberFormat("@").setValues(newStudentsToAppend);
    }

    // 2. Batch Update / Append ke Data_Nilai
    const dataNilai = sheetNilai.getDataRange().getValues();
    const colN = detectNilaiColumns(dataNilai[0]);
    const nilaiMap = new Map();
    for (let j = 1; j < dataNilai.length; j++) {
      const rowNisn = String(dataNilai[j][colN.nisn] || "").trim();
      const rowMapel = String(dataNilai[j][colN.mapel] || "").trim().toLowerCase();
      if (rowNisn && rowMapel) {
        nilaiMap.set(rowNisn + "_" + rowMapel, j);
      }
    }

    let updatedCount = 0;
    let addedCount = 0;

    matrixData.rows.forEach(r => {
      const nisn = sanitizeSheetInput(r.nisn);
      if (!nisn) return;

      const scores = r.scores || {};
      for (const mapelName in scores) {
        if (scores.hasOwnProperty(mapelName)) {
          const val = scores[mapelName];
          if (val !== "" && val !== null && val !== undefined) {
            const numScore = parseNumericScore(val);
            const key = nisn + "_" + mapelName.toLowerCase().trim();

            if (nilaiMap.has(key)) {
              const rowIndex = nilaiMap.get(key);
              dataNilai[rowIndex][colN.nilai] = numScore;
              dataNilai[rowIndex][colN.jenis] = jenisAsesmen;
              updatedCount++;
            } else {
              const newId = "NL-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss") + "-" + (addedCount + 1);
              dataNilai.push([newId, nisn, mapelName, jenisAsesmen, numScore]);
              nilaiMap.set(key, dataNilai.length - 1);
              addedCount++;
            }
          }
        }
      }
    });

    if (dataNilai.length > 0) {
      sheetNilai.getRange(1, 1, dataNilai.length, 5).setValues(dataNilai);
    }

    // 3. Simpan juga ke sheet Leger_Nilai jika ada
    if (sheetLeger && subjects.length > 0) {
      try {
        const legerHeader = ["NISN", "Nama_Siswa", "Kelas"].concat(subjects);
        const legerRows = [legerHeader];
        matrixData.rows.forEach(r => {
          const rowVals = [r.nisn, r.nama || "", r.kelas || ""];
          subjects.forEach(sub => {
            rowVals.push(r.scores && r.scores[sub] !== undefined ? r.scores[sub] : "");
          });
          legerRows.push(rowVals);
        });

        sheetLeger.clear();
        sheetLeger.getRange(1, 1, legerRows.length, legerHeader.length).setNumberFormat("@").setValues(legerRows);
        sheetLeger.getRange(1, 1, 1, legerHeader.length).setFontWeight("bold").setBackground("#F59E0B").setFontColor("#FFFFFF");
        sheetLeger.autoResizeColumns(1, legerHeader.length);
      } catch (eLeger) {}
    }

    clearAllCache();

    return {
      success: true,
      totalStudents: matrixData.rows.length,
      totalGrades: updatedCount + addedCount,
      newStudents: newStudentsToAppend.length,
      updatedGrades: updatedCount,
      newGrades: addedCount,
      message: "Sukses! " + matrixData.rows.length + " siswa dan " + (updatedCount + addedCount) + " nilai asesmen berhasil disimpan ke sistem."
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan matriks nilai: " + err.toString() };
  } finally {
    lock.releaseLock();
  }
}
