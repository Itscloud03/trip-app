import React from 'react';
import { useData } from '../context/DataContext';
import { Badge } from '../components/Modal';
import { formatRupiah, fmtDate, mobilName, sopirName } from '../utils';

const NEXT_LABEL = { tersedia: 'Perlu diambil', terpakai: 'Perlu dipasang' };

export default function Dashboard() {
  const { mobilList, sopirList, fiberList, tripList, profile } = useData();

  const isSopir = profile?.role === 'sopir';
  const mySopir = sopirList.find(s => s.userId === profile?.id);
  const visibleTrips = isSopir ? tripList.filter(t => t.sopirId === mySopir?.id) : tripList;

  const active = visibleTrips.filter(t => t.status === 'dijadwalkan' || t.status === 'berjalan');
  const selesai = tripList.filter(t => t.status === 'selesai');
  const pendapatan = selesai.reduce((sum, t) => sum + (t.tarif || 0), 0);
  const profit = selesai.reduce((sum, t) => sum + ((t.tarif || 0) - (t.biaya || 0)), 0);

  const byJenis = {};
  fiberList.forEach(f => {
    const j = f.jenis || 'Barang';
    byJenis[j] = byJenis[j] || 0;
    if (f.status === 'tersedia') byJenis[j]++;
  });
  const low = Object.entries(byJenis).filter(([, v]) => v <= 2);

  // Ringkasan barang di trip aktif sopir yang belum "terpasang"
  const barangPerluAksi = isSopir
    ? active.flatMap(t =>
        (t.fiberIds || [])
          .map(id => fiberList.find(f => f.id === id))
          .filter(f => f && f.status !== 'terpasang')
          .map(f => ({ ...f, tripId: t.id, tripLabel: `${t.dari} → ${t.ke}` }))
      )
    : [];

  return (
    <section className="section active">
      <div className="topbar">
        <div>
          <h1>Dashboard</h1>
          <p>Ringkasan operasional hari ini</p>
        </div>
      </div>

      {!isSopir && low.length > 0 && (
        <div className="alert-box stock">
          <b>Stok menipis:</b>&nbsp;{low.map(([j, v]) => `${j} (${v} tersedia)`).join(', ')}.
        </div>
      )}

      <div className="stat-grid">
        <StatCard tick="amber" num={visibleTrips.filter(t => t.status === 'berjalan').length} label="Trip berjalan" />
        {!isSopir && <StatCard tick="teal" num={mobilList.filter(m => m.status === 'tersedia').length} label="Mobil tersedia" />}
        {!isSopir && <StatCard tick="ink" num={sopirList.filter(s => s.status === 'tersedia').length} label="Sopir tersedia" />}
        <StatCard tick="coral" num={visibleTrips.filter(t => t.status === 'dijadwalkan').length} label="Trip dijadwalkan" />
        {isSopir && <StatCard tick="coral" num={barangPerluAksi.length} label="Barang perlu di-scan" />}
        {!isSopir && <StatCard tick="teal" num={formatRupiah(pendapatan)} label="Pendapatan trip selesai" small />}
        {!isSopir && <StatCard tick="coral" num={formatRupiah(profit)} label="Estimasi profit" small />}
        {!isSopir && <StatCard tick="amber" num={fiberList.filter(f => f.status === 'tersedia').length} label="Stok barang tersedia" />}
      </div>

      {isSopir && barangPerluAksi.length > 0 && (
        <div className="panel">
          <h2>Barang perlu di-scan</h2>
          <div className="road-divider"></div>
          <table>
            <thead><tr><th>Barcode</th><th>Jenis</th><th>Trip</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {barangPerluAksi.map(f => (
                <tr key={f.id + '-' + f.tripId}>
                  <td className="mono">{f.barcode}</td>
                  <td>{f.jenis}</td>
                  <td>{f.tripLabel}</td>
                  <td><Badge status={f.status} /></td>
                  <td>{NEXT_LABEL[f.status] || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 12, color: 'var(--muted, #888)', fontSize: 13.5 }}>
            Buka menu <strong>Scan Barang</strong> untuk memindai dan memperbarui status barang di atas.
          </p>
        </div>
      )}

      <div className="panel">
        <h2>Trip aktif</h2>
        <div className="road-divider"></div>
        <div className="trip-grid">
          {active.length === 0 && <div className="empty">Belum ada trip aktif.</div>}
          {active.map(t => (
            <TripCardMini key={t.id} t={t} mobilList={mobilList} sopirList={sopirList} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ tick, num, label, small }) {
  return (
    <div className="stat-card">
      <div className={`tick ${tick}`}></div>
      <div className="num" style={small ? { fontSize: 22 } : undefined}>{num}</div>
      <div className="label">{label}</div>
    </div>
  );
}

function TripCardMini({ t, mobilList, sopirList }) {
  return (
    <div className="ticket">
      <div className="ticket-main">
        <div className="ticket-route">
          <span>{t.dari}</span><span className="dot"></span><span className="line"></span><span className="dot"></span><span>{t.ke}</span>
        </div>
        <div className="ticket-date">{fmtDate(t.tanggal)}</div>
      </div>
      <div className="ticket-perf"></div>
      <div className="ticket-stub">
        <div className="meta">
          <div><strong>{mobilName(mobilList, t.mobilId)}</strong></div>
          <div>{sopirName(sopirList, t.sopirId)}</div>
        </div>
        <div className="ticket-actions">
          <Badge status={t.status} />
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{formatRupiah(t.tarif)}</span>
        </div>
      </div>
    </div>
  );
}