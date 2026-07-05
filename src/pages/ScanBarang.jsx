import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useData } from '../context/DataContext';
import { parseScannedCode } from '../lib/qrPayload';

const NEXT_STATUS = { tersedia: 'terpakai', terpakai: 'terpasang' };
const AKSI_TEXT = {
  terpakai: 'Diambil dari gudang (scan sopir)',
  terpasang: 'Dipasang di lokasi (scan sopir)',
};

export default function ScanBarang() {
  const { fiberList, tripList, sopirList, profile, setBarangStatus, advanceTrip } = useData();
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState(null);
  const scannerRef = useRef(null);
  const divId = 'qr-scan-region';

  const mySopir = sopirList.find(s => s.userId === profile?.id);
  const myActiveTrips = tripList.filter(
    t => t.sopirId === mySopir?.id && (t.status === 'dijadwalkan' || t.status === 'berjalan')
  );

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  function processCode(raw) {
    const code = parseScannedCode(raw);
    const item = fiberList.find(f => f.barcode.toLowerCase() === code.toLowerCase());

    if (!item) {
      setMessage({ type: 'error', text: `Barang dengan kode "${code}" tidak ditemukan.` });
      return;
    }

    // Validasi: barang ini harus termasuk salah satu trip aktif milik sopir yang login
    const trip = myActiveTrips.find(t => (t.fiberIds || []).includes(item.id));
    if (!trip) {
      setMessage({
        type: 'error',
        text: `${item.jenis} (${item.barcode}) tidak termasuk trip Anda saat ini. Pastikan trip sudah ditugaskan oleh admin.`,
      });
      return;
    }

    const next = NEXT_STATUS[item.status];
    if (!next) {
      setMessage({ type: 'info', text: `${item.jenis} (${item.barcode}) sudah berstatus "terpasang".` });
      return;
    }

    setBarangStatus(item.id, next, `${AKSI_TEXT[next]} — trip ${trip.dari} → ${trip.ke}`);

    const trigMulaiTrip = trip.status === 'dijadwalkan';
    if (trigMulaiTrip) advanceTrip(trip);

    setMessage({
      type: 'success',
      text: trigMulaiTrip
        ? `${item.jenis} (${item.barcode}): status → "${next}". Trip ${trip.dari} → ${trip.ke} mulai berjalan.`
        : `${item.jenis} (${item.barcode}): status → "${next}" (trip ${trip.dari} → ${trip.ke}).`,
    });
  }

  async function startScanning() {
    setMessage(null);
    setScanning(true);
    const scanner = new Html5Qrcode(divId);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (decodedText) => {
          processCode(decodedText);
          scanner.stop().then(() => setScanning(false)).catch(() => {});
        },
        () => {}
      );
    } catch (e) {
      setMessage({ type: 'error', text: 'Tidak bisa mengakses kamera: ' + e.message });
      setScanning(false);
    }
  }

  async function stopScanning() {
    await scannerRef.current?.stop().catch(() => {});
    setScanning(false);
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processCode(manualCode.trim());
    setManualCode('');
  }

  return (
    <section className="section active">
      <div className="topbar">
        <div><h1>Scan Barang</h1><p>Scan QR/barcode untuk update status barang & mulai trip</p></div>
      </div>

      {myActiveTrips.length === 0 && (
        <div className="panel scan-message scan-info">
          Anda belum punya trip yang ditugaskan admin. Hubungi admin untuk menugaskan trip terlebih dahulu.
        </div>
      )}

      <div className="panel">
        <h3>Scan lewat kamera</h3>
        <div id={divId} style={{ width: '100%', maxWidth: 320, margin: '0 auto' }} />
        <div className="modal-actions" style={{ justifyContent: 'center' }}>
          {!scanning
            ? <button className="btn" onClick={startScanning}>📷 Mulai scan</button>
            : <button className="btn ghost" onClick={stopScanning}>Hentikan scan</button>}
        </div>
      </div>

      <div className="panel">
        <h3>Atau input manual</h3>
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            className="mono"
            style={{ flex: 1 }}
            placeholder="cth. FBR-00123"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
          />
          <button className="btn" type="submit">Proses</button>
        </form>
      </div>

      {message && <div className={`panel scan-message scan-${message.type}`}>{message.text}</div>}
    </section>
  );
}