import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { buildScanValue } from '../lib/qrPayload';

// Menampilkan barcode (Code128) atau QR code kecil di dalam tabel/label.
// Menerima seluruh objek `item` (bukan cuma value) karena QR sekarang
// membutuhkan data tambahan (jenis, jumlah, lokasi) untuk di-encode sebagai JSON.
export default function CodePreview({ item, width = 1.4, height = 24 }) {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);
  const type = item?.tipe || 'barcode';
  const scanValue = buildScanValue(item);

  useEffect(() => {
    if (!item) return;
    if (type === 'qr' && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, scanValue, { width: 26, margin: 0 }).catch(() => {});
    } else if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, item.barcode, { format: 'CODE128', width, height, displayValue: false, margin: 0 });
      } catch {
        // barcode tidak valid untuk format Code128 — biarkan kosong, teks tetap tampil di sebelahnya
      }
    }
  }, [item, type, scanValue, width, height]);

  if (!item) return null;
  if (type === 'qr') return <canvas ref={canvasRef} />;
  return <svg ref={svgRef} className="barcode-preview" />;
}