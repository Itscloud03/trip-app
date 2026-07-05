import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Modal, Field, Badge } from '../components/Modal';
import { formatRupiah } from '../utils';

const EMPTY = { plat: '', jenis: '', kapasitas: '', tarif: '', foto: null };

export default function Mobil() {
  const { mobilList, saveMobil, deleteMobil, uploadPhoto } = useData();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = mobilList.filter(m =>
    !query || m.plat.toLowerCase().includes(query.toLowerCase()) || m.jenis.toLowerCase().includes(query.toLowerCase())
  );

  function openAdd() { setForm(EMPTY); setFile(null); setErrors({}); setOpen(true); }
  function openEdit(m) { setForm(m); setFile(null); setErrors({}); setOpen(true); }

  async function handleSave() {
    const err = {};
    if (!form.plat?.trim()) err.plat = 'Plat nomor wajib diisi.';
    if (!form.jenis?.trim()) err.jenis = 'Jenis mobil wajib diisi.';
    setErrors(err);
    if (Object.keys(err).length) return;

    setSaving(true);
    try {
      let foto = form.foto;
      if (file) foto = await uploadPhoto(file, 'mobil');
      await saveMobil({ ...form, kapasitas: parseInt(form.kapasitas) || null, tarif: parseInt(form.tarif) || 0, foto });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section active">
      <div className="topbar">
        <div><h1>Mobil</h1><p>Data dan status armada</p></div>
        <button className="btn" onClick={openAdd}>+ Tambah mobil</button>
      </div>
      <div className="panel">
        <div className="search-row">
          <input placeholder="Cari plat atau jenis mobil..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Foto</th><th>Plat</th><th>Jenis</th><th>Kapasitas</th><th>Tarif / trip</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>{m.foto ? <img className="thumb" src={m.foto} alt="" /> : <div className="thumb-placeholder">🚗</div>}</td>
                  <td className="plate">{m.plat}</td>
                  <td>{m.jenis}</td>
                  <td>{m.kapasitas || '—'} orang</td>
                  <td className="mono">{formatRupiah(m.tarif)}</td>
                  <td><Badge status={m.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openEdit(m)}>✎</button>
                      <button className="icon-btn" onClick={() => { if (confirm('Hapus data mobil ini?')) deleteMobil(m.id); }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="empty">Belum ada data mobil.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit mobil' : 'Tambah mobil'}>
        <Field label="Plat nomor" error={errors.plat}>
          <input value={form.plat || ''} onChange={e => setForm({ ...form, plat: e.target.value })} placeholder="cth. BK 1234 XY" />
        </Field>
        <Field label="Jenis mobil" error={errors.jenis}>
          <input value={form.jenis || ''} onChange={e => setForm({ ...form, jenis: e.target.value })} placeholder="cth. Toyota Avanza" />
        </Field>
        <Field label="Kapasitas (orang)">
          <input type="number" min="1" value={form.kapasitas || ''} onChange={e => setForm({ ...form, kapasitas: e.target.value })} />
        </Field>
        <Field label="Foto mobil">
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
        </Field>
        <Field label="Tarif per trip (Rp)">
          <input type="number" min="0" value={form.tarif || ''} onChange={e => setForm({ ...form, tarif: e.target.value })} />
        </Field>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Batal</button>
          <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </Modal>
    </section>
  );
}
