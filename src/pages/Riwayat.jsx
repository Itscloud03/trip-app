import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Badge } from '../components/Modal';
import { formatRupiah, fmtDate, mobilName, sopirName } from '../utils';

export default function Riwayat() {
  const { mobilList, sopirList, tripList } = useData();
  const [query, setQuery] = useState('');

  const done = tripList.filter(t =>
    (t.status === 'selesai' || t.status === 'dibatalkan') &&
    (!query ||
      `${t.dari} ${t.ke}`.toLowerCase().includes(query.toLowerCase()) ||
      mobilName(mobilList, t.mobilId).toLowerCase().includes(query.toLowerCase()) ||
      sopirName(sopirList, t.sopirId).toLowerCase().includes(query.toLowerCase()))
  );

  const totalTarif = done.filter(t => t.status === 'selesai').reduce((s, t) => s + (t.tarif || 0), 0);
  const totalProfit = done.filter(t => t.status === 'selesai').reduce((s, t) => s + ((t.tarif || 0) - (t.biaya || 0)), 0);

  function exportCSV() {
    const rows = [['Rute', 'Mobil', 'Sopir', 'Tanggal', 'Tarif', 'Biaya', 'Profit', 'Status']];
    done.forEach(t => rows.push([
      `${t.dari} -> ${t.ke}`, mobilName(mobilList, t.mobilId), sopirName(sopirList, t.sopirId),
      t.tanggal, t.tarif || 0, t.biaya || 0, (t.tarif || 0) - (t.biaya || 0), t.status,
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'riwayat-trip.csv';
    a.click();
  }

  return (
    <section className="section active">
      <div className="topbar">
        <div><h1>Riwayat</h1><p>Trip yang sudah selesai atau dibatalkan</p></div>
        <button className="btn ghost" onClick={exportCSV}>Ekspor CSV</button>
      </div>
      <div className="panel">
        <div className="search-row">
          <input placeholder="Cari rute, mobil, atau sopir..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Rute</th><th>Mobil</th><th>Sopir</th><th>Tanggal</th><th>Tarif</th><th>Biaya</th><th>Profit</th><th>Status</th></tr></thead>
            <tbody>
              {done.map(t => (
                <tr key={t.id}>
                  <td>{t.dari} → {t.ke}</td>
                  <td className="plate">{mobilName(mobilList, t.mobilId)}</td>
                  <td>{sopirName(sopirList, t.sopirId)}</td>
                  <td>{fmtDate(t.tanggal)}</td>
                  <td className="mono">{formatRupiah(t.tarif)}</td>
                  <td className="mono">{formatRupiah(t.biaya)}</td>
                  <td className="mono">{formatRupiah((t.tarif || 0) - (t.biaya || 0))}</td>
                  <td><Badge status={t.status} /></td>
                </tr>
              ))}
              {done.length > 0 && (
                <tr className="total-row">
                  <td colSpan={4}>Total (trip selesai)</td>
                  <td className="num-cell">{formatRupiah(totalTarif)}</td>
                  <td></td>
                  <td className="num-cell">{formatRupiah(totalProfit)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {done.length === 0 && <div className="empty">Belum ada trip yang selesai.</div>}
      </div>
    </section>
  );
}
