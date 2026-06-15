import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, auth } from '../api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@bookflow.app');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { accessToken } = await api.login(email, password);
      auth.set(accessToken);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Staff login</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-xs text-gray-400">
        Demo: owner@bookflow.app / owner123 · staff@bookflow.app / staff123
      </p>
    </div>
  );
}
