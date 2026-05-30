import React, { useEffect, useState } from 'react';
import {
  Mail, Send, CheckCircle, XCircle, Clock, Play, Pause,
  Square, RotateCcw, Download, Activity, Terminal, RefreshCw
} from 'lucide-react';
import useEmailStore from '../store/emailStore';
import LogConsole from '../components/LogConsole';
import { formatDate, statusVariant, truncate } from '../utils/helpers';

function StatCard({ icon: Icon, label, value, variant }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className={`stat-icon ${variant}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-value">{value ?? 0}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const {
    campaigns, fetchCampaigns,
    activeCampaignId, campaignStatus, setActiveCampaign,
    sendCampaign, pauseCampaign, resumeCampaign, stopCampaign,
    retryFailed, exportFailed, addToast
  } = useEmailStore();

  const [loading, setLoading] = useState({});

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const stats = campaignStatus?.stats || {};
  const progress = campaignStatus?.progress || 0;
  const status = campaignStatus?.status || 'idle';
  const logs = campaignStatus?.liveLogs || [];

  // Find active campaign details
  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

  const action = async (fn, key) => {
    setLoading(l => ({ ...l, [key]: true }));
    try {
      await fn();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  };

  // Overall stats from all campaigns
  const totalAll = campaigns.reduce((a, c) => a + (c.stats?.total || 0), 0);
  const sentAll = campaigns.reduce((a, c) => a + (c.stats?.sent || 0), 0);
  const failedAll = campaigns.reduce((a, c) => a + (c.stats?.failed || 0), 0);
  const pendingAll = campaigns.reduce((a, c) => a + (c.stats?.pending || 0), 0);

  const progressBarClass = status === 'completed' ? 'completed' : status === 'stopped' ? 'stopped' : '';

  return (
    <div className="page-container fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h2>📊 Dashboard</h2>
          <p>Monitor your bulk email campaigns in real-time</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchCampaigns}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Global Stats */}
      <div className="stats-grid mb-4">
        <StatCard icon={Mail} label="Total Emails" value={totalAll} variant="total" />
        <StatCard icon={CheckCircle} label="Sent" value={sentAll} variant="sent" />
        <StatCard icon={XCircle} label="Failed" value={failedAll} variant="failed" />
        <StatCard icon={Clock} label="Pending" value={pendingAll} variant="pending" />
      </div>

      <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
        {/* Active Campaign Panel */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Activity size={18} color="var(--accent)" />
              Active Campaign
              {status === 'sending' && (
                <div className="pulse-dot" style={{ marginLeft: 6 }} />
              )}
            </div>
            {activeCampaign && (
              <span className={`badge badge-${statusVariant(status)}`}>
                {status}
              </span>
            )}
          </div>

          {!activeCampaign ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <Activity size={40} />
              <h3>No active campaign</h3>
              <p>Select a campaign from History to monitor it here</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{activeCampaign.name}</div>
                <div className="text-sm text-muted">{truncate(activeCampaign.subject, 60)}</div>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 16 }}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted">Progress</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{progress}%</span>
                </div>
                <div className="progress-wrap">
                  <div
                    className={`progress-bar ${progressBarClass}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Mini Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Total', value: stats.total, color: 'var(--accent)' },
                  { label: 'Sent', value: stats.sent, color: 'var(--success)' },
                  { label: 'Failed', value: stats.failed, color: 'var(--error)' },
                  { label: 'Pending', value: stats.pending, color: 'var(--warning)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    textAlign: 'center', padding: '10px 8px',
                    background: 'var(--bg-primary)', borderRadius: 8,
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value ?? 0}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Control Deck */}
              <div className="control-deck">
                {['idle', 'completed', 'stopped', 'paused', 'draft'].includes(status) && (
                  <button
                    className="btn btn-success btn-sm"
                    disabled={loading.send}
                    onClick={() => action(() => sendCampaign(activeCampaignId), 'send')}
                  >
                    {loading.send ? <div className="spinner" /> : <Play size={14} />}
                    {status === 'paused' ? 'Restart' : 'Start'}
                  </button>
                )}
                {status === 'sending' && (
                  <button
                    className="btn btn-warning btn-sm"
                    disabled={loading.pause}
                    onClick={() => action(() => pauseCampaign(activeCampaignId), 'pause')}
                  >
                    {loading.pause ? <div className="spinner" /> : <Pause size={14} />}
                    Pause
                  </button>
                )}
                {status === 'paused' && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={loading.resume}
                    onClick={() => action(() => resumeCampaign(activeCampaignId), 'resume')}
                  >
                    {loading.resume ? <div className="spinner" /> : <Play size={14} />}
                    Resume
                  </button>
                )}
                {['sending', 'paused'].includes(status) && (
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={loading.stop}
                    onClick={() => action(() => stopCampaign(activeCampaignId), 'stop')}
                  >
                    {loading.stop ? <div className="spinner" /> : <Square size={14} />}
                    Stop
                  </button>
                )}
                {(stats.failed > 0) && !['sending'].includes(status) && (
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={loading.retry}
                    onClick={() => action(() => retryFailed(activeCampaignId), 'retry')}
                  >
                    {loading.retry ? <div className="spinner" /> : <RotateCcw size={14} />}
                    Retry Failed ({stats.failed})
                  </button>
                )}
                {(stats.failed > 0) && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => exportFailed(activeCampaignId)}
                  >
                    <Download size={14} /> Export CSV
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Campaign Selector */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Send size={18} color="var(--accent)" /> Recent Campaigns</div>
            <span className="badge badge-purple">{campaigns.length}</span>
          </div>
          {campaigns.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <Send size={36} />
              <h3>No campaigns yet</h3>
              <p>Import a sheet and compose an email to begin</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {campaigns.slice(0, 8).map(c => (
                <div
                  key={c.id}
                  onClick={() => setActiveCampaign(c.id)}
                  style={{
                    padding: '12px 14px',
                    border: `1px solid ${activeCampaignId === c.id ? 'var(--accent)' : 'var(--border-color)'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: activeCampaignId === c.id ? 'var(--accent-light)' : 'var(--bg-primary)',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2 }}>
                      {truncate(c.name, 35)}
                    </div>
                    <div className="text-xs text-muted">{formatDate(c.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`badge badge-${statusVariant(c.status)}`}>{c.status}</span>
                    <span className="text-xs text-muted">{c.stats?.sent}/{c.stats?.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Logs */}
      <div className="card mt-4">
        <div className="card-header">
          <div className="card-title"><Terminal size={18} color="var(--accent)" /> Live Activity Logs</div>
          {status === 'sending' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--success)' }}>
              <div className="pulse-dot" />
              Live
            </div>
          )}
        </div>
        <LogConsole logs={logs} maxHeight={300} />
      </div>
    </div>
  );
}
