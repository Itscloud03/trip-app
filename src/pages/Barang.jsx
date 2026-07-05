import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Modal, Field, Badge } from '../components/Modal';
import CodePreview from '../components/CodePreview';
import CodeModal from '../components/CodeModal';
import { fmtDate } from '../utils';

const EMPTY = { jenis: '', barcode: '', tipe: 'barcode', panjang: '', lokasi: '' };

export default function Barang() {
  const { fiberList, saveBarang, deleteBarang, setBarangStatus, profile } = useData();
  const isAdmin = profile?.role === 'admin';

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [codeItem, setCodeItem] = useState(null);

  const filtered = fiberList.filter(f => {
    const q = query.toLowerCase();
    const matchesQ = !q || f.barcode.toLowerCase().includes(q) || (f.jenis || '').toLowerCase().includes(q) || (f.lokasi || '').toLowerCase().includes(q);
    return matchesQ && (!statusFilter || f.status === statusFilter);
  });

  function openAdd() { setForm(EMPTY); setErrors({}); setOpen(true); }
  function openEdit(f) { setForm(f); setErrors({}); setOpen(true); }

  function generateBarcode() {
    let code;
    do { code = 'FBR-' + Math.floor(10000 + Math.random() * 89999); }
    while (fiberList.some(f => f.barcode === code && f.id !== form.id));
    setForm({ ...form, barcode: code });
  }

  async function handleSave() {
    const err = {};
    const dup = fiberList.find(f => f.barcode.toLowerCase() === form.barcode?.trim().toLowerCase() && f.id !== form.id);
    if (!form.barcode?.trim() || dup) err.barcode = 'Barcode wajib diisi dan belum boleh dipakai barang lain.';
    setErrors(err);
    if (Object.keys(err).length) return;

    setSaving(true);
    try {
      await saveBarang({ ...form, jenis: form.jenis?.trim() || 'Barang' });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function handleStatusChange(f, newStatus) {
    setBarangStatus(f.id, newStatus, `Status diubah manual oleh admin menjadi "${newStatus}"`);
  }

  return (
    <section className="section active">
      <div className="topbar">
        <div><h1>Barang</h1><p>Stok barang dengan barcode/QR masing-masing</p></div>
        <button className="btn" onClick={openAdd}>+ Tambah barang</button>
      </div>
      <div className="panel">
        <div className="search-row">
          <input placeholder="Cari barcode, jenis, atau lokasi..." value={query} onChange={e => setQuery(e.target.value)} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Semua status</option>
            <option value="tersedia">Tersedia</option>
            <option value="terpakai">Terpakai</option>
            <option value="terpasang">Terpasang</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Barcode</th><th>Jenis</th><th>Jumlah</th><th>Lokasi</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id}>
                  <td>
                    <div
                      className="barcode-cell-wrap"
                      onClick={() => setCodeItem(f)}
                      style={{ cursor: 'pointer' }}
                      title="Klik untuk lihat detail, unduh, atau cetak"
                    >
                      <CodePreview item={f} />
                      <span className="barcode-code-text">{f.barcode}</span>
                    </div>
                  </td>
                  <td><span className="jenis-pill">{f.jenis || 'Barang'}</span></td>
                  <td>{f.panjang || '—'}</td>
                  <td>{f.lokasi ? `📍 ${f.lokasi}` : '—'}</td>
                  <td>
                    {isAdmin ? (
                      <select
                        className="status-select"
                        value={f.status}
                        onChange={e => handleStatusChange(f, e.target.value)}
                      >
                        <option value="tersedia">Tersedia</option>
                        <option value="terpakai">Terpakai</option>
                        <option value="terpasang">Terpasang</option>
                      </select>
                    ) : (
                      <Badge status={f.status} />
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      {f.status === 'terpasang' && (
                        <button className="icon-btn" title="Kembalikan ke stok" onClick={() => setBarangStatus(f.id, 'tersedia', 'Dikembalikan ke stok secara manual')}>↩</button>
                      )}
                      <button className="icon-btn" onClick={() => setHistoryItem(f)}>🕑</button>
                      <button className="icon-btn" onClick={() => openEdit(f)}>✎</button>
                      <button className="icon-btn" onClick={() => { if (confirm('Hapus data barang ini?')) deleteBarang(f.id); }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="empty">Belum ada data barang.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit barang' : 'Tambah barang'}>
        <Field label="Jenis barang">
          <input value={form.jenis || ''} onChange={e => setForm({ ...form, jenis: e.target.value })} placeholder="cth. Fiber optik, Ikan, dll" />
        </Field>
        <Field label="Barcode" error={errors.barcode}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="mono" style={{ flex: 1 }} value={form.barcode || ''} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="cth. FBR-00123" />
            <button type="button" className="btn ghost sm" onClick={generateBarcode}>Acak</button>
          </div>
        </Field>
        <Field label="Tipe kode">
          <select value={form.tipe || 'barcode'} onChange={e => setForm({ ...form, tipe: e.target.value })}>
            <option value="barcode">Barcode (Code128)</option>
            <option value="qr">QR Code</option>
          </select>
        </Field>
        <div className="field-row">
          <Field label="Jumlah / satuan">
            <input value={form.panjang || ''} onChange={e => setForm({ ...form, panjang: e.target.value })} placeholder="cth. 500 meter, 20 kg" />
          </Field>
          <Field label="Lokasi / gudang">
            <input value={form.lokasi || ''} onChange={e => setForm({ ...form, lokasi: e.target.value })} placeholder="cth. Gudang A" />
          </Field>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Batal</button>
          <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </Modal>

      <Modal open={!!historyItem} onClose={() => setHistoryItem(null)} title={historyItem ? `Riwayat — ${historyItem.jenis} (${historyItem.barcode})` : ''}>
        <ul className="history-list">
          {(historyItem?.riwayat || []).length === 0 && <li>Belum ada riwayat pemakaian.</li>}
          {(historyItem?.riwayat || []).slice().reverse().map((h, i) => (
            <li key={i}><div className="h-date">{fmtDate(h.tanggal)}</div>{h.aksi}</li>
          ))}
        </ul>
      </Modal>

      <CodeModal item={codeItem} onClose={() => setCodeItem(null)} />
    </section>
  );
}