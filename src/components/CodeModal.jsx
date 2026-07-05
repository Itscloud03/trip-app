import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { buildScanValue } from '../lib/qrPayload';

export default function CodeModal({ item, onClose }) {
  const svgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!item) return;
    if (item.tipe === 'qr' && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, buildScanValue(item), { width: 240, margin: 1 }).catch(() => {});
    } else if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, item.barcode, { format: 'CODE128', width: 3, height: 100, displayValue: true, fontSize: 16 });
      } catch {
        // barcode tidak valid untuk Code128 — biarkan kosong
      }
    }
  }, [item]);

  if (!item) return null;

  function svgToPngDataUrl() {
    const svg = svgRef.current;
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = 'data:image/svg+xml;base64,' + svg64;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 320;
        canvas.height = img.height || 120;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = image64;
    });
  }

  async function getDataUrl() {
    return item.tipe === 'qr' ? canvasRef.current.toDataURL('image/png') : await svgToPngDataUrl();
  }

  async function handleDownload() {
    const dataUrl = await getDataUrl();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${item.barcode}.png`;
    a.click();
  }

  async function handlePrint() {
    const dataUrl = await getDataUrl();
    const win = window.open('', '_blank', 'width=400,height=500');
    win.document.write(`
      <html><head><title>Cetak label — ${item.barcode}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 24px; }
        img { max-width: 100%; margin-bottom: 12px; }
        h2 { margin: 0 0 4px; }
        p { margin: 0; color: #555; font-family: monospace; }
      </style></head>
      <body>
        <h2>${item.jenis || 'Barang'}</h2>
        <img src="${dataUrl}" />
        <p>${item.barcode}</p>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <div className="code-modal-overlay" onClick={onClose}>
      <div className="code-modal-box" onClick={e => e.stopPropagation()}>
        <button className="code-modal-close" onClick={onClose}>✕</button>
        <h3>{item.jenis || 'Barang'}</h3>
        <div className="code-modal-preview">
          {item.tipe === 'qr' ? <canvas ref={canvasRef} /> : <svg ref={svgRef} />}
        </div>
        <p className="mono">{item.barcode}</p>
        <div className="modal-actions" style={{ justifyContent: 'center' }}>
          <button className="btn ghost" onClick={handleDownload}>⬇ Unduh PNG</button>
          <button className="btn" onClick={handlePrint}>🖨 Cetak label</button>
        </div>
      </div>
    </div>
  );
}