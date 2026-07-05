import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [mobilList, setMobilList] = useState([]);
  const [sopirList, setSopirList] = useState([]);
  const [fiberList, setFiberList] = useState([]);
  const [tripList, setTripList] = useState([]);

  /* ---------------- AUTH ---------------- */
  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProfile(null); return null; }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) { setProfile(null); return null; }
    setProfile(data);
    return data;
  }, []);

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const p = await loadProfile();
    await fetchAll();
    return p;
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  /* ---------------- FETCH SEMUA DATA ---------------- */
  const fetchAll = useCallback(async () => {
    const [mobilRes, sopirRes, barangRes, tripRes, tripBarangRes, riwayatRes] = await Promise.all([
      supabase.from('mobil').select('*').order('id'),
      supabase.from('sopir').select('*').order('id'),
      supabase.from('barang').select('*').order('id'),
      supabase.from('trip').select('*').order('id'),
      supabase.from('trip_barang').select('*'),
      supabase.from('riwayat_barang').select('*').order('id'),
    ]);
    [mobilRes, sopirRes, barangRes, tripRes, tripBarangRes, riwayatRes].forEach(r => {
      if (r.error) console.error(r.error);
    });

    setMobilList((mobilRes.data || []).map(m => ({
      id: m.id, plat: m.plat, jenis: m.jenis, kapasitas: m.kapasitas,
      tarif: m.tarif, foto: m.foto_url, status: m.status,
    })));

    setSopirList((sopirRes.data || []).map(s => ({
      id: s.id, userId: s.user_id, nama: s.nama, hp: s.hp, foto: s.foto_url, status: s.status,
    })));

    setFiberList((barangRes.data || []).map(b => ({
      id: b.id, jenis: b.jenis, barcode: b.barcode, tipe: b.tipe,
      panjang: b.jumlah, lokasi: b.lokasi, status: b.status,
      riwayat: (riwayatRes.data || []).filter(r => r.barang_id === b.id)
        .map(r => ({ tanggal: r.tanggal, aksi: r.aksi })),
    })));

    setTripList((tripRes.data || []).map(t => ({
      id: t.id, dari: t.dari, ke: t.ke, tanggal: t.tanggal,
      mobilId: t.mobil_id, sopirId: t.sopir_id, tarif: t.tarif, biaya: t.biaya,
      status: t.status,
      fiberIds: (tripBarangRes.data || []).filter(tb => tb.trip_id === t.id).map(tb => tb.barang_id),
    })));
  }, []);

  /* ---------------- BOOT + REALTIME ---------------- */
  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      if (p) await fetchAll();
      setLoadingAuth(false);
    })();

    const channel = supabase.channel('rute-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mobil' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sopir' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barang' }, fetchAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- UPLOAD FOTO ---------------- */
  async function uploadPhoto(file, folder) {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
  }

  /* ---------------- MOBIL ---------------- */
  async function saveMobil(m) {
    const row = { plat: m.plat, jenis: m.jenis, kapasitas: m.kapasitas, tarif: m.tarif, foto_url: m.foto, status: m.status || 'tersedia' };
    if (m.id) await supabase.from('mobil').update(row).eq('id', m.id);
    else await supabase.from('mobil').insert(row);
    await fetchAll();
  }
  async function deleteMobil(id) { await supabase.from('mobil').delete().eq('id', id); await fetchAll(); }

  /* ---------------- SOPIR ---------------- */
  async function saveSopir(s) {
    const row = { nama: s.nama, hp: s.hp, foto_url: s.foto, status: s.status || 'tersedia' };
    if (s.id) await supabase.from('sopir').update(row).eq('id', s.id);
    else await supabase.from('sopir').insert(row);
    await fetchAll();
  }
  async function deleteSopir(id) { await supabase.from('sopir').delete().eq('id', id); await fetchAll(); }

  /* ---------------- BARANG ---------------- */
  async function saveBarang(f) {
    const row = { jenis: f.jenis, barcode: f.barcode, tipe: f.tipe, jumlah: f.panjang, lokasi: f.lokasi, status: f.status || 'tersedia' };
    if (f.id) await supabase.from('barang').update(row).eq('id', f.id);
    else await supabase.from('barang').insert(row);
    await fetchAll();
  }
  async function deleteBarang(id) { await supabase.from('barang').delete().eq('id', id); await fetchAll(); }
  async function setBarangStatus(id, status, aksi) {
    await supabase.from('barang').update({ status }).eq('id', id);
    if (aksi) await supabase.from('riwayat_barang').insert({ barang_id: id, tanggal: new Date().toISOString().slice(0, 10), aksi });
    await fetchAll();
  }

  /* ---------------- TRIP ---------------- */
  async function saveTrip(t, fiberIds) {
    const row = {
      dari: t.dari, ke: t.ke, tanggal: t.tanggal,
      mobil_id: t.mobilId || null, sopir_id: t.sopirId || null,
      tarif: t.tarif, biaya: t.biaya, status: t.status || 'dijadwalkan',
    };
    let tripId = t.id;
    if (tripId) {
      await supabase.from('trip').update(row).eq('id', tripId);
      await supabase.from('trip_barang').delete().eq('trip_id', tripId);
    } else {
      const { data } = await supabase.from('trip').insert(row).select().single();
      tripId = data.id;
    }
    if (fiberIds && fiberIds.length) {
      await supabase.from('trip_barang').insert(fiberIds.map(bid => ({ trip_id: tripId, barang_id: bid })));
    }
    await fetchAll();
  }

  async function advanceTrip(trip) {
    if (trip.status === 'dijadwalkan') {
      await supabase.from('trip').update({ status: 'berjalan' }).eq('id', trip.id);
      if (trip.mobilId) await supabase.from('mobil').update({ status: 'dipakai' }).eq('id', trip.mobilId);
      if (trip.sopirId) await supabase.from('sopir').update({ status: 'bertugas' }).eq('id', trip.sopirId);
    } else if (trip.status === 'berjalan') {
      await supabase.from('trip').update({ status: 'selesai' }).eq('id', trip.id);
      if (trip.mobilId) await supabase.from('mobil').update({ status: 'tersedia' }).eq('id', trip.mobilId);
      if (trip.sopirId) await supabase.from('sopir').update({ status: 'tersedia' }).eq('id', trip.sopirId);
      for (const fid of trip.fiberIds || []) {
        await supabase.from('barang').update({ status: 'terpasang' }).eq('id', fid);
        await supabase.from('riwayat_barang').insert({
          barang_id: fid, tanggal: trip.tanggal || new Date().toISOString().slice(0, 10),
          aksi: `Terpasang pada trip ${trip.dari} → ${trip.ke}`,
        });
      }
    }
    await fetchAll();
  }

  async function cancelTrip(trip) {
    if (trip.mobilId) await supabase.from('mobil').update({ status: 'tersedia' }).eq('id', trip.mobilId);
    if (trip.sopirId) await supabase.from('sopir').update({ status: 'tersedia' }).eq('id', trip.sopirId);
    for (const fid of trip.fiberIds || []) {
      await supabase.from('barang').update({ status: 'tersedia' }).eq('id', fid);
      await supabase.from('riwayat_barang').insert({
        barang_id: fid, tanggal: new Date().toISOString().slice(0, 10),
        aksi: `Dikembalikan (trip ${trip.dari} → ${trip.ke} dibatalkan)`,
      });
    }
    await supabase.from('trip').update({ status: 'dibatalkan' }).eq('id', trip.id);
    await fetchAll();
  }

  async function returnFiber(id) {
    await supabase.from('barang').update({ status: 'tersedia' }).eq('id', id);
    await supabase.from('riwayat_barang').insert({
      barang_id: id, tanggal: new Date().toISOString().slice(0, 10), aksi: 'Dikembalikan ke stok secara manual',
    });
    await fetchAll();
  }

  const value = {
    profile, loadingAuth, login, logout,
    mobilList, sopirList, fiberList, tripList, fetchAll,
    uploadPhoto, saveMobil, deleteMobil, saveSopir, deleteSopir,
    saveBarang, deleteBarang, setBarangStatus,
    saveTrip, advanceTrip, cancelTrip, returnFiber,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
