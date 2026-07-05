export function formatRupiah(n) {
  if (!n) return 'Rp 0';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function mobilName(mobilList, id) {
  const m = mobilList.find(x => x.id === id);
  return m ? m.plat : '—';
}

export function sopirName(sopirList, id) {
  const s = sopirList.find(x => x.id === id);
  return s ? s.nama : '—';
}

export function label(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
