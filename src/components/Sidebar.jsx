import React from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';

const NAV = [
  { to: '/', label: 'Dashboard', end: true, roles: ['admin', 'sopir'] },
  { to: '/mobil', label: 'Mobil', roles: ['admin'] },
  { to: '/sopir', label: 'Sopir', roles: ['admin'] },
  { to: '/barang', label: 'Barang', roles: ['admin'] },
  { to: '/trip', label: 'Trip', roles: ['admin', 'sopir'] },
  { to: '/scan', label: 'Scan Barang', roles: ['sopir'] },
  { to: '/riwayat', label: 'Riwayat', roles: ['admin'] },
];

export default function Sidebar() {
  const { profile, logout } = useData();
  const role = profile?.role || 'sopir';

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"></div>
        <div>
          <div className="brand-name">Rute</div>
          <div className="brand-sub">Kelola trip mobil</div>
        </div>
      </div>
      <nav>
        {NAV.filter(n => n.roles.includes(role)).map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        Masuk sebagai <strong>{profile?.nama}</strong> ({role})
        <button onClick={logout}>Keluar</button>
      </div>
    </aside>
  );
}
