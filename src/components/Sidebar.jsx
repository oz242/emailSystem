import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Mail, Settings, History,
  Send, Moon, Sun, LogOut, Users
} from 'lucide-react';
import useEmailStore from '../store/emailStore';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Import Sheet', icon: Upload, path: '/import' },
  { label: 'Compose', icon: Mail, path: '/compose' },
  { label: 'History', icon: History, path: '/history' },
  { label: 'SMTP Settings', icon: Settings, path: '/smtp' },
];

const adminItems = [
  { label: 'Users', icon: Users, path: '/admin/users' }
];

export default function Sidebar() {
  const { theme, toggleTheme, campaigns, user, logout } = useEmailStore();
  const sendingCount = campaigns.filter(c => c.status === 'sending').length;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>
          <div className="logo-icon">
            <Send size={18} color="white" />
          </div>
          MailBlast
        </h1>
        <p>Bulk Email Sender Pro</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" size={18} />
            {label}
            {label === 'Dashboard' && sendingCount > 0 && (
              <span className="nav-badge">{sendingCount}</span>
            )}
          </NavLink>
        ))}
        {user?.is_admin && (
          <>
            <div className="nav-section-label">Admin</div>
            {adminItems.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <Icon className="nav-icon" size={18} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        {user?.email && (
          <div className="sidebar-user">
            <span>{user.name || user.email}</span>
            <small>{user.email}</small>
          </div>
        )}

        <button
          className="nav-item w-full"
          onClick={toggleTheme}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {theme === 'dark'
            ? <><Sun className="nav-icon" size={18} /> Light Mode</>
            : <><Moon className="nav-icon" size={18} /> Dark Mode</>
          }
        </button>

        <button
          className="nav-item w-full"
          onClick={() => logout()}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <LogOut className="nav-icon" size={18} /> Log out
        </button>

        <div style={{ padding: '10px 12px 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
          MailBlast v1.0 - Production Ready
        </div>
      </div>
    </aside>
  );
}
