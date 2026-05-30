import React, { useEffect, useState } from 'react';
import { Shield, UserPlus } from 'lucide-react';
import useEmailStore from '../store/emailStore';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  is_active: true,
  is_admin: false
};

export default function AdminUsersPage() {
  const {
    adminUsers,
    fetchAdminUsers,
    createAdminUser,
    updateAdminUser,
    addToast
  } = useEmailStore();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminUsers().catch((e) => setError(e.message));
  }, []);

  const submitUser = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createAdminUser(form);
      setForm(emptyForm);
      addToast('User created', 'success');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = async (user, field) => {
    if (field === 'is_active') {
      const action = user.is_active ? 'deactivate' : 'activate';
      const confirmed = window.confirm(`Are you sure you want to ${action} ${user.email}?`);
      if (!confirmed) return;
    }

    if (field === 'is_admin') {
      const action = user.is_admin ? 'remove admin access from' : 'make admin';
      const confirmed = window.confirm(`Are you sure you want to ${action} ${user.email}?`);
      if (!confirmed) return;
    }

    try {
      await updateAdminUser(user.id, { [field]: !user[field] });
      addToast('User updated', 'success');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2>Admin Users</h2>
        <p>Create users and control platform access.</p>
      </div>

      <div className="grid-2">
        <form className="card" onSubmit={submitUser}>
          <div className="card-header">
            <h3 className="card-title"><UserPlus size={18} /> Create User</h3>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="name">Name</label>
            <input
              id="name"
              className="form-input"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="form-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              minLength={8}
              required
            />
          </div>

          <div className="toggle-wrap mb-3">
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
            <span className="text-sm">Active</span>
          </div>

          <div className="toggle-wrap mb-4">
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.is_admin}
                onChange={(event) => setForm({ ...form, is_admin: event.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
            <span className="text-sm">Admin</span>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <UserPlus size={16} />}
            Create
          </button>
        </form>

        <section className="card">
          <div className="card-header">
            <h3 className="card-title"><Shield size={18} /> Existing Users</h3>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Admin</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="font-semibold">{user.name || user.email}</div>
                      <div className="text-xs text-muted">{user.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-error'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.is_admin ? 'badge-purple' : 'badge-default'}`}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <div className="control-deck">
                        <button className="btn btn-sm btn-ghost" onClick={() => toggleUser(user, 'is_active')}>
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => toggleUser(user, 'is_admin')}>
                          {user.is_admin ? 'Remove admin' : 'Make admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!adminUsers.length && (
                  <tr>
                    <td colSpan="4" className="text-muted">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
