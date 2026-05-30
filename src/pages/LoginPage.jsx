import React, { useState } from 'react';
import { Lock, Mail, Send } from 'lucide-react';
import useEmailStore from '../store/emailStore';

export default function LoginPage() {
  const { login, authError, theme } = useEmailStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(authError || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-screen" data-theme={theme}>
      <section className="login-panel">
        <div className="login-brand">
          <div className="logo-icon">
            <Send size={20} color="white" />
          </div>
          <div>
            <h1>MailBlast</h1>
            <p>Secure access</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                id="email"
                className="form-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                id="password"
                className="form-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <Lock size={18} />}
            Log in
          </button>
        </form>
      </section>
    </main>
  );
}
