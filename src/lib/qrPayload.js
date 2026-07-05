// Membangun nilai yang di-encode ke dalam QR/barcode untuk satu barang.
// Untuk tipe 'qr': JSON lengkap (id, jenis, jumlah, lokasi) — sesuai kebutuhan
// validasi & tampilan informasi saat sopir memindai.
// Untuk tipe 'barcode' (Code128): tetap teks polos, karena barcode 1D
// tidak cocok untuk menyimpan data terstruktur (kapasitas & karakter terbatas).
export function buildScanValue(item) {
  if (!item) return '';
  if (item.tipe === 'qr') {
    return JSON.stringify({
      id: item.barcode,
      jenis: item.jenis || 'Barang',
      jumlah: item.panjang || '',
      lokasi: item.lokasi || '',
    });
  }
  return item.barcode;
}

// Mengurai hasil scan dari kamera/input manual.
// Kalau hasil scan berupa JSON (dari QR baru), ambil field `id`.
// Kalau bukan JSON (barcode polos / QR lama), pakai apa adanya.
export function parseScannedCode(raw) {
  if (!raw) return '';
  try {
    const obj = JSON.parse(raw);
    if (obj && obj.id) return String(obj.id);
  } catch {
    // bukan JSON — anggap ini barcode/teks polos
  }
  return String(raw).trim();
}