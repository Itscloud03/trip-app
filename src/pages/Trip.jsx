import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Modal, Field, Badge } from '../components/Modal';
import { formatRupiah, fmtDate, mobilName, sopirName } from '../utils';

const EMPTY = { dari: '', ke: '', tanggal: '', mobilId: '', sopirId: '', tarif: '', biaya: '' };

export default function Trip() {
  const { mobilList, sopirList, fiberList, tripList, profile, saveTrip, advanceTrip, cancelTrip } = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [scanValue, setScanValue] = useState('');
  const [fiberIds, setFiberIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const isSopir = profile?.role === 'sopir';
  const mySopir = sopirList.find(s => s.userId === profile?.id);
  const visible = isSopir ? tripList.filter(t => t.sopirId === mySopir?.id) : tripList;
  const active = visible.filter(t => t.status === 'dijadwalkan' || t.status === 'berjalan');

  function openAdd() { setForm(EMPTY); setFiberIds([]); setErrors({}); setOpen(true); }
  function openEdit(t) { setForm(t); setFiberIds([...(t.fiberIds || [])]); setErrors({}); setOpen(true); }

  function handleScan(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const code = scanValue.trim();
    setScanValue('');
    if (!code) return;
    const f = fiberList.find(x => x.barcode.toLowerCase() === code.toLowerCase());
    if (!f) { alert('Barcode barang tidak ditemukan: ' + code); return; }
    if (fiberIds.includes(f.id)) return;
    if (f.status !== 'tersedia') { alert(`${f.jenis} ${f.barcode} sedang tidak tersedia (status: ${f.status}).`); return; }
    setFiberIds([...fiberIds, f.id]);
  }

  async function handleSave() {
    const err = {};
    if (!form.dari?.trim()) err.dari = 'Wajib diisi.';
    if (!form.ke?.trim()) err.ke = 'Wajib diisi.';
    setErrors(err);
    if (Object.keys(err).length) return;

    setSaving(true);
    try {
      await saveTrip({
        ...form,
        mobilId: form.mobilId ? parseInt(form.mobilId) : null,
        sopirId: form.sopirId ? parseInt(form.sopirId) : null,
        tarif: parseInt(form.tarif) || 0,
        biaya: parseInt(form.biaya) || 0,
      }, fiberIds);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section active">
      <div className="topbar">
        <div><h1>Trip</h1><p>Semua trip yang sedang berjalan atau dijadwalkan</p></div>
        {!isSopir && <button className="btn" onClick={openAdd}>+ Buat trip</button>}
      </div>
      <div className="trip-grid">
        {active.map(t => (
          <TripCard
            key={t.id} t={t} mobilList={mobilList} sopirList={sopirList} fiberList={fiberList}
            canManage={!isSopir}
            onEdit={() => openEdit(t)}
            onAdvance={() => advanceTrip(t)}
            onCancel={() => { if (confirm('Batalkan trip ini?')) cancelTrip(t); }}
          />
        ))}
      </div>
      {active.length === 0 && <div className="empty">Belum ada trip. {!isSopir && 'Buat trip baru untuk mulai.'}</div>}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit trip' : 'Buat trip baru'} wide>
        <div className="field-row">
          <Field label="Dari" error={errors.dari}>
            <input value={form.dari || ''} onChange={e => setForm({ ...form, dari: e.target.value })} placeholder="cth. Medan" />
          </Field>
          <Field label="Ke" error={errors.ke}>
            <input value={form.ke || ''} onChange={e => setForm({ ...form, ke: e.target.value })} placeholder="cth. Berastagi" />
          </Field>
        </div>
        <Field label="Tanggal">
          <input type="date" value={form.tanggal || ''} onChange={e => setForm({ ...form, tanggal: e.target.value })} />
        </Field>
        <div className="field-row">
          <Field label="Mobil">
            <select value={form.mobilId || ''} onChange={e => {
              const id = e.target.value;
              const m = mobilList.find(x => String(x.id) === id);
              setForm({ ...form, mobilId: id, tarif: m ? m.tarif : form.tarif });
            }}>
              <option value="">Pilih mobil (opsional)</option>
              {mobilList.filter(m => m.status === 'tersedia' || m.id === form.mobilId).map(m => (
                <option key={m.id} value={m.id}>{m.plat} — {m.jenis} ({formatRupiah(m.tarif)})</option>
              ))}
            </select>
          </Field>
          <Field label="Sopir">
            <select value={form.sopirId || ''} onChange={e => setForm({ ...form, sopirId: e.target.value })}>
              <option value="">Pilih sopir (opsional)</option>
              {sopirList.filter(s => s.status === 'tersedia' || s.id === form.sopirId).map(s => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="field-row">
          <Field label="Tarif trip (Rp)">
            <input type="number" min="0" value={form.tarif || ''} onChange={e => setForm({ ...form, tarif: e.target.value })} />
          </Field>
          <Field label="Biaya operasional (Rp)">
            <input type="number" min="0" value={form.biaya || ''} onChange={e => setForm({ ...form, biaya: e.target.value })} />
          </Field>
        </div>
        <Field label="Muatan / barang trip">
          <div className="scan-box">
            <input className="mono" placeholder="Scan atau ketik barcode barang, lalu Enter"
              value={scanValue} onChange={e => setScanValue(e.target.value)} onKeyDown={handleScan} />
            <div className="fiber-chips-head">
              <span>Barang terpindai</span>
              {fiberIds.length > 0 && <button type="button" className="link-btn" onClick={() => setFiberIds([])}>Hapus semua</button>}
            </div>
            <div className="fiber-chips">
              {fiberIds.map(id => {
                const f = fiberList.find(x => x.id === id);
                if (!f) return null;
                return (
                  <div className="fiber-chip" key={id}>
                    <span className="code">{f.barcode}</span>
                    <span className="len">{f.jenis}{f.panjang ? ' · ' + f.panjang : ''}</span>
                    <button type="button" onClick={() => setFiberIds(fiberIds.filter(x => x !== id))}>&times;</button>
                  </div>
                );
              })}
            </div>
          </div>
        </Field>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Batal</button>
          <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan trip'}</button>
        </div>
      </Modal>
    </section>
  );
}

function TripCard({ t, mobilList, sopirList, fiberList, canManage, onEdit, onAdvance, onCancel }) {
  const nextLabel = t.status === 'dijadwalkan' ? 'Mulai trip' : (t.status === 'berjalan' ? 'Selesaikan' : null);
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
          {(t.fiberIds || []).length > 0 && (
            <div className="ticket-fibers">
              {t.fiberIds.map(id => {
                const f = fiberList.find(x => x.id === id);
                return f ? <span className="fiber-tag" key={id}>{f.barcode}</span> : null;
              })}
            </div>
          )}
        </div>
        <div className="ticket-actions">
          <Badge status={t.status} />
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{formatRupiah(t.tarif)}</span>
          {canManage && (
            <div className="row-actions">
              <button className="icon-btn" onClick={onEdit}>✎</button>
              <button className="icon-btn" onClick={onCancel}>🗑</button>
            </div>
          )}
          {nextLabel && <button className="btn sm ghost" onClick={onAdvance}>{nextLabel}</button>}
        </div>
      </div>
    </div>
  );
}
