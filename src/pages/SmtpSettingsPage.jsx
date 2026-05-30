import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, Wifi, WifiOff, CheckCircle, XCircle,
  Server, Eye, EyeOff, Shield, Info, RefreshCw, Key
} from 'lucide-react';
import useEmailStore from '../store/emailStore';

const EMPTY_SMTP = {
  id: '',
  senderName: '',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  active: true
};

export default function SmtpSettingsPage() {
  const { smtps, fetchSmtps, saveSmtp, deleteSmtp, testSmtp, addToast } = useEmailStore();
  const [form, setForm] = useState({ ...EMPTY_SMTP, id: crypto.randomUUID() });
  const [showPass, setShowPass] = useState(false);
  const [editId, setEditId] = useState(null);
  const [testing, setTesting] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSmtps(); }, []);

  const updateForm = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleEdit = (smtp) => {
    setEditId(smtp.id);
    setForm({ ...smtp, pass: '' }); // don't pre-fill password for security
  };

  const handleClear = () => {
    setEditId(null);
    setForm({ ...EMPTY_SMTP, id: crypto.randomUUID() });
    setShowPass(false);
  };

  const handleSave = async () => {
    if (!form.host || !form.port || !form.user) {
      addToast('Host, Port, and Username are required', 'error');
      return;
    }
    if (!editId && !form.pass) {
      addToast('Password is required for new SMTP profiles', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveSmtp(form);
      addToast(editId ? 'SMTP profile updated!' : 'SMTP profile saved!', 'success');
      handleClear();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id) => {
    setTesting(t => ({ ...t, [id]: 'loading' }));
    try {
      const result = await testSmtp({ id });
      setTesting(t => ({ ...t, [id]: result.success ? 'ok' : 'fail' }));
      addToast(result.message, result.success ? 'success' : 'error');
    } catch (err) {
      setTesting(t => ({ ...t, [id]: 'fail' }));
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this SMTP profile?')) return;
    try {
      await deleteSmtp(id);
      addToast('SMTP profile deleted', 'info');
      if (editId === id) handleClear();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const presets = [
    { label: 'Gmail', host: 'smtp.gmail.com', port: 587, secure: false },
    { label: 'Gmail SSL', host: 'smtp.gmail.com', port: 465, secure: true },
    { label: 'Outlook', host: 'smtp-mail.outlook.com', port: 587, secure: false },
    { label: 'Yahoo', host: 'smtp.mail.yahoo.com', port: 587, secure: false },
    { label: 'Custom', host: '', port: 587, secure: false },
  ];

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2>⚙️ SMTP Configuration</h2>
        <p>Manage your email sender accounts for SMTP rotation</p>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Server size={18} color="var(--accent)" />
              {editId ? 'Edit SMTP Profile' : 'Add New SMTP Profile'}
            </div>
            {editId && (
              <button className="btn btn-ghost btn-sm" onClick={handleClear}>
                <Plus size={14} /> New
              </button>
            )}
          </div>

          {/* Info Banner */}
          <div style={{
            marginBottom: 20, padding: '12px 14px',
            background: 'var(--info-light)', borderRadius: 8,
            border: '1px solid var(--info)',
            display: 'flex', gap: 10, alignItems: 'flex-start'
          }}>
            <Info size={16} color="var(--info)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--info)', lineHeight: 1.6 }}>
              <strong>Gmail Users:</strong> Use an <strong>App Password</strong>, not your regular Gmail password.
              Go to Google Account → Security → 2-Step Verification → App passwords.
            </div>
          </div>

          {/* SMTP Presets */}
          <div className="form-group">
            <label className="form-label">Quick Presets</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {presets.map(p => (
                <button
                  key={p.label}
                  className="btn btn-ghost btn-sm"
                  onClick={() => setForm(f => ({ ...f, host: p.host, port: p.port, secure: p.secure }))}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Sender Name</label>
            <input className="form-input" placeholder="e.g. Company Newsletter"
              value={form.senderName} onChange={e => updateForm('senderName', e.target.value)} />
          </div>

          <div className="grid-2" style={{ gap: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">SMTP Host *</label>
              <input className="form-input form-mono" placeholder="smtp.gmail.com"
                value={form.host} onChange={e => updateForm('host', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Port *</label>
              <input className="form-input form-mono" type="number"
                value={form.port} onChange={e => updateForm('port', Number(e.target.value))} />
            </div>
          </div>

          <div className="form-group mt-3">
            <div className="toggle-wrap">
              <label className="toggle">
                <input type="checkbox" checked={form.secure}
                  onChange={e => updateForm('secure', e.target.checked)} />
                <span className="toggle-slider" />
              </label>
              <span className="form-label" style={{ margin: 0 }}>
                Use SSL/TLS (Port 465 only — leave off for STARTTLS on 587)
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email (Username) *</label>
            <input className="form-input form-mono" placeholder="yourname@gmail.com"
              type="email" value={form.user}
              onChange={e => updateForm('user', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
              App Password * {editId && <span className="text-muted">(leave blank to keep existing)</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input form-mono"
                placeholder={editId ? "Leave blank to keep existing password" : "Gmail App Password (16 chars)"}
                type={showPass ? 'text' : 'password'}
                value={form.pass}
                onChange={e => updateForm('pass', e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-wrap">
              <label className="toggle">
                <input type="checkbox" checked={form.active}
                  onChange={e => updateForm('active', e.target.checked)} />
                <span className="toggle-slider" />
              </label>
              <span className="form-label" style={{ margin: 0 }}>Active (include in SMTP rotation)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? <div className="spinner" /> : <Plus size={15} />}
              {editId ? 'Update Profile' : 'Save Profile'}
            </button>
            {editId && (
              <button className="btn btn-ghost" onClick={handleClear}>Cancel</button>
            )}
          </div>
        </div>

        {/* Profiles List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* SMTP Rotation Info */}
          <div className="card card-sm">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <RefreshCw size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong>SMTP Rotation:</strong> When multiple active profiles are configured,
                MailBlast automatically rotates between them for each email sent,
                distributing the load and reducing spam detection risk.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Key size={18} color="var(--accent)" />
                Saved Profiles
              </div>
              <span className="badge badge-purple">{smtps.length}</span>
            </div>

            {smtps.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <Server size={36} />
                <h3>No SMTP profiles yet</h3>
                <p>Add your first profile to start sending emails</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {smtps.map(smtp => {
                  const testState = testing[smtp.id];
                  return (
                    <div key={smtp.id} style={{
                      padding: '14px 16px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      background: 'var(--bg-primary)',
                      transition: 'border-color 0.2s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {smtp.senderName || smtp.user}
                            </span>
                            {smtp.active
                              ? <span className="badge badge-success">Active</span>
                              : <span className="badge badge-default">Inactive</span>
                            }
                            {testState === 'ok' && <CheckCircle size={14} color="var(--success)" />}
                            {testState === 'fail' && <XCircle size={14} color="var(--error)" />}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            {smtp.user}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {smtp.host}:{smtp.port} • {smtp.secure ? 'SSL' : 'STARTTLS'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleTest(smtp.id)}
                            disabled={testState === 'loading'}
                            title="Test connection"
                          >
                            {testState === 'loading'
                              ? <div className="spinner" style={{ width: 13, height: 13 }} />
                              : <Wifi size={13} />
                            }
                            Test
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(smtp)} title="Edit">
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(smtp.id)}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
