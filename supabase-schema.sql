-- =========================================================
-- SKEMA DATABASE APLIKASI "RUTE" (Kelola Trip Mobil)
-- Jalankan seluruh file ini di Supabase > SQL Editor > New query
-- =========================================================

-- ---------- TABEL PROFIL (login admin & sopir) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role text not null check (role in ('admin','sopir')),
  hp text,
  created_at timestamptz default now()
);

-- ---------- TABEL MOBIL ----------
create table if not exists mobil (
  id bigint generated always as identity primary key,
  plat text not null,
  jenis text not null,
  kapasitas int,
  tarif numeric default 0,
  foto_url text,
  status text not null default 'tersedia' check (status in ('tersedia','dipakai','servis')),
  created_at timestamptz default now()
);

-- ---------- TABEL SOPIR (data operasional, terhubung ke profil login) ----------
create table if not exists sopir (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id) on delete set null,
  nama text not null,
  hp text,
  foto_url text,
  status text not null default 'tersedia' check (status in ('tersedia','bertugas')),
  created_at timestamptz default now()
);

-- ---------- TABEL BARANG (fiber/ikan/dll dengan barcode) ----------
create table if not exists barang (
  id bigint generated always as identity primary key,
  jenis text not null default 'Barang',
  barcode text not null unique,
  tipe text not null default 'barcode' check (tipe in ('barcode','qr')),
  jumlah text,          -- contoh: "500 meter", "20 kg"
  lokasi text,
  status text not null default 'tersedia' check (status in ('tersedia','terpakai','terpasang')),
  created_at timestamptz default now()
);

create table if not exists riwayat_barang (
  id bigint generated always as identity primary key,
  barang_id bigint references barang(id) on delete cascade,
  tanggal date default current_date,
  aksi text not null
);

-- ---------- TABEL TRIP ----------
create table if not exists trip (
  id bigint generated always as identity primary key,
  dari text not null,
  ke text not null,
  tanggal date,
  mobil_id bigint references mobil(id) on delete set null,
  sopir_id bigint references sopir(id) on delete set null,
  tarif numeric default 0,
  biaya numeric default 0,
  status text not null default 'dijadwalkan'
    check (status in ('dijadwalkan','berjalan','selesai','dibatalkan')),
  created_at timestamptz default now()
);

-- relasi banyak-ke-banyak: satu trip bisa bawa banyak barang
create table if not exists trip_barang (
  trip_id bigint references trip(id) on delete cascade,
  barang_id bigint references barang(id) on delete cascade,
  primary key (trip_id, barang_id)
);

-- =========================================================
-- FUNGSI BANTUAN: cek apakah user yang login adalah admin
-- =========================================================
create or replace function is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function my_sopir_id()
returns bigint language sql stable as $$
  select id from sopir where user_id = auth.uid();
$$;

-- =========================================================
-- ROW LEVEL SECURITY (aturan siapa boleh akses apa)
-- =========================================================
alter table profiles enable row level security;
alter table mobil enable row level security;
alter table sopir enable row level security;
alter table barang enable row level security;
alter table riwayat_barang enable row level security;
alter table trip enable row level security;
alter table trip_barang enable row level security;

-- PROFILES: setiap user lihat profil sendiri, admin lihat semua
create policy "profil sendiri" on profiles for select using (id = auth.uid() or is_admin());
create policy "admin kelola profil" on profiles for all using (is_admin());

-- MOBIL & SOPIR & BARANG: semua yang login boleh lihat, hanya admin boleh ubah
create policy "lihat mobil" on mobil for select using (auth.uid() is not null);
create policy "admin kelola mobil" on mobil for insert with check (is_admin());
create policy "admin update mobil" on mobil for update using (is_admin());
create policy "admin hapus mobil" on mobil for delete using (is_admin());

create policy "lihat sopir" on sopir for select using (auth.uid() is not null);
create policy "admin kelola sopir" on sopir for insert with check (is_admin());
create policy "admin/sopir update sopir" on sopir for update using (is_admin() or user_id = auth.uid());
create policy "admin hapus sopir" on sopir for delete using (is_admin());

create policy "lihat barang" on barang for select using (auth.uid() is not null);
create policy "admin kelola barang" on barang for insert with check (is_admin());
create policy "admin/sopir update barang" on barang for update using (auth.uid() is not null);
create policy "admin hapus barang" on barang for delete using (is_admin());

create policy "lihat riwayat barang" on riwayat_barang for select using (auth.uid() is not null);
create policy "tambah riwayat barang" on riwayat_barang for insert with check (auth.uid() is not null);

-- TRIP: admin lihat & kelola semua; sopir hanya lihat & update trip miliknya
create policy "admin lihat semua trip" on trip for select using (is_admin() or sopir_id = my_sopir_id());
create policy "admin buat trip" on trip for insert with check (is_admin());
create policy "admin/sopir update trip" on trip for update using (is_admin() or sopir_id = my_sopir_id());
create policy "admin hapus trip" on trip for delete using (is_admin());

create policy "lihat trip_barang" on trip_barang for select using (auth.uid() is not null);
create policy "kelola trip_barang" on trip_barang for all using (auth.uid() is not null);

-- =========================================================
-- AKTIFKAN REALTIME (biar dashboard admin auto-update saat sopir ubah status)
-- =========================================================
alter publication supabase_realtime add table trip, mobil, sopir, barang;


-- =========================================================
-- STORAGE: bucket untuk foto (mobil, sopir, dll)
-- =========================================================

-- Buat bucket 'photos' kalau belum ada, dan jadikan public
-- (supaya getPublicUrl() di kode bisa diakses tanpa auth)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Izinkan user yang sudah login (admin/sopir) meng-upload file ke bucket 'photos'
create policy "user login boleh upload foto"
on storage.objects for insert
to authenticated
with check (bucket_id = 'photos');

-- Izinkan user yang sudah login meng-update/overwrite foto (karena pakai upsert: true)
create policy "user login boleh update foto"
on storage.objects for update
to authenticated
using (bucket_id = 'photos');

-- Izinkan siapa saja membaca/melihat foto (karena bucket public & dipakai getPublicUrl)
create policy "publik boleh lihat foto"
on storage.objects for select
using (bucket_id = 'photos');

-- (opsional) izinkan admin menghapus foto
create policy "admin boleh hapus foto"
on storage.objects for delete
to authenticated
using (bucket_id = 'photos' and is_admin());