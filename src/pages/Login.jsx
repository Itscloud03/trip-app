import React, { useState } from 'react';
import { useData } from '../context/DataContext';

export default function Login() {
  const { login } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay show">
      <form className="modal" onSubmit={handleSubmit}>
        <h3>Masuk ke Rute</h3>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <div className="err" style={{ display: 'block', marginBottom: 12 }}>{error}</div>}
        <div className="modal-actions">
          <button className="btn" type="submit" disabled={loading} style={{ flex: 'none', width: '100%' }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </div>
      </form>
    </div>
  );
}
