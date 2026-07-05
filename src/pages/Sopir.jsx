import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Modal, Field, Badge } from '../components/Modal';

const EMPTY = { nama: '', hp: '', foto: null };
const PHONE_RE = /^[0-9+ ]{6,20}$/;

export default function Sopir() {
  const { sopirList, saveSopir, deleteSopir, uploadPhoto } = useData();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const filtered = sopirList.filter(s =>
    !query || s.nama.toLowerCase().includes(query.toLowerCase()) || (s.hp || '').includes(query)
  );

  function openAdd() { setForm(EMPTY); setFile(null); setErrors({}); setOpen(true); }
  function openEdit(s) { setForm(s); setFile(null); setErrors({}); setOpen(true); }

  async function handleSave() {
    const err = {};
    if (!form.nama?.trim()) err.nama = 'Nama wajib diisi.';
    if (form.hp && !PHONE_RE.test(form.hp)) err.hp = 'Format no. HP tidak valid.';
    setErrors(err);
    if (Object.keys(err).length) return;

    setSaving(true);
    try {
      let foto = form.foto;
      if (file) foto = await uploadPhoto(file, 'sopir');
      await saveSopir({ ...form, foto });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section active">
      <div className="topbar">
        <div><h1>Sopir</h1><p>Data dan status sopir</p></div>
        <button className="btn" onClick={openAdd}>+ Tambah sopir</button>
      </div>
      <div className="panel">
        <div className="search-row">
          <input placeholder="Cari nama atau no. HP..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Foto</th><th>Nama</th><th>No. HP</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>{s.foto ? <img className="thumb" src={s.foto} alt="" /> : <div className="thumb-placeholder">👤</div>}</td>
                  <td>{s.nama}</td>
                  <td className="mono">{s.hp || '—'}</td>
                  <td><Badge status={s.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openEdit(s)}>✎</button>
                      <button className="icon-btn" onClick={() => { if (confirm('Hapus data sopir ini?')) deleteSopir(s.id); }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="empty">Belum ada data sopir.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit sopir' : 'Tambah sopir'}>
        <Field label="Nama" error={errors.nama}>
          <input value={form.nama || ''} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="cth. Budi Santoso" />
        </Field>
        <Field label="No. HP" error={errors.hp}>
          <input value={form.hp || ''} onChange={e => setForm({ ...form, hp: e.target.value })} placeholder="cth. 0812xxxxxxx" />
        </Field>
        <Field label="Foto sopir">
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
        </Field>
        <div className="modal-actions">
          <button className="btn ghost" onClick={() => setOpen(false)}>Batal</button>
          <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </Modal>
    </section>
  );
}
