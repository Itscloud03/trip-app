import React from 'react';

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="overlay show" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal' + (wide ? ' wide' : '')}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <div className={'field' + (error ? ' has-err' : '')}>
      <label>{label}</label>
      {children}
      {error && <div className="err">{error}</div>}
    </div>
  );
}

export function Badge({ status }) {
  const text = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`badge ${status}`}>{text}</span>;
}
