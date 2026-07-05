import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useData } from './context/DataContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Mobil from './pages/Mobil';
import Sopir from './pages/Sopir';
import Barang from './pages/Barang';
import Trip from './pages/Trip';
import Riwayat from './pages/Riwayat';
import ScanBarang from './pages/ScanBarang';

export default function App() {
  const { profile, loadingAuth } = useData();

  if (loadingAuth) return <div className="empty">Memuat...</div>;
  if (!profile) return <Login />;

  const isAdmin = profile.role === 'admin';

  return (
    <div className="app">
      <Sidebar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trip" element={<Trip />} />
          {isAdmin && <Route path="/mobil" element={<Mobil />} />}
          {isAdmin && <Route path="/sopir" element={<Sopir />} />}
          {isAdmin && <Route path="/barang" element={<Barang />} />}
          {isAdmin && <Route path="/riwayat" element={<Riwayat />} />}
          {!isAdmin && <Route path="/scan" element={<ScanBarang />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
