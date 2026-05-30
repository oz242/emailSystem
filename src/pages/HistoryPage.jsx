import React, { useEffect, useState } from 'react';
import {
  History, Play, Pause, Square, RotateCcw, Download,
  Terminal, ChevronDown, ChevronUp, Trash2, RefreshCw,
  CheckCircle, XCircle, Clock, Send, Filter
} from 'lucide-react';
import api from '../services/api';
import useEmailStore from '../store/emailStore';
import LogConsole from '../components/LogConsole';
import { formatDate, statusVariant, truncate } from '../utils/helpers';

export default function HistoryPage() {
  const {
    campaigns, fetchCampaigns, setActiveCampaign,
    sendCampaign, pauseCampaign, resumeCampaign,
    stopCampaign, retryFailed, exportFailed, addToast
  } = useEmailStore();

  const [expandedId, setExpandedId] = useState(null);
  const [campaignLogs, setCampaignLogs] = useState({});
  const [loadingLogs, setLoadingLogs] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchCampaigns(); }, []);

  const toggleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!campaignLogs[id]) {
      setLoadingLogs(l => ({ ...l, [id]: true }));
      try {
        const { data } = await api.get(`/campaigns/${id}/logs`);
        setCampaignLogs(prev => ({ ...prev, [id]: data.logs || [] }));
      } catch (e) {
        addToast('Failed to load logs', 'error');
      } finally {
        setLoadingLogs(l => ({ ...l, [id]: false }));
      }
    }
  };

  const act = async (fn, key) => {
    setActionLoading(l => ({ ...l, [key]: true }));
    try { await fn(); }
    catch (e) { addToast(e.message, 'error'); }
    finally {
      setActionLoading(l => ({ ...l, [key]: false }));
      fetchCampaigns();
    }
  };

  const filtered = campaigns.filter(c =>
    filterStatus === 'all' || c.status === filterStatus
  );

  const statusOptions = ['all', 'sending', 'completed', 'failed', 'stopped', 'paused', 'draft'];

  return (
    <div className="page-container fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h2>📋 Campaign History</h2>
          <p>View, manage, and analyze all your email campaigns</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchCampaigns}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} color="var(--text-muted)" />
        {statusOptions.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {s}
          </button>
        ))}
        <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
          {filtered.length} campaign{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Campaign List */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <History size={48} />
            <h3>No campaigns found</h3>
            <p>Start by importing a sheet and composing your first email</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(campaign => {
            const isExpanded = expandedId === campaign.id;
            const stats = campaign.stats || {};
            const progress = stats.total > 0
              ? Math.round(((stats.sent + stats.failed) / stats.total) * 100)
              : 0;
            const logs = campaignLogs[campaign.id] || [];
            const ak = campaign.id;

            return (
              <div key={campaign.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Campaign Header */}
                <div
                  style={{ padding: '16px 20px', cursor: 'pointer' }}
                  onClick={() => toggleExpand(campaign.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Status Icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: campaign.status === 'completed' ? 'var(--success-light)'
                        : campaign.status === 'failed' || campaign.status === 'stopped' ? 'var(--error-light)'
                        : campaign.status === 'sending' ? 'var(--info-light)'
                        : 'var(--accent-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {campaign.status === 'completed' && <CheckCircle size={18} color="var(--success)" />}
                      {campaign.status === 'failed' && <XCircle size={18} color="var(--error)" />}
                      {campaign.status === 'stopped' && <Square size={18} color="var(--error)" />}
                      {campaign.status === 'sending' && <div className="pulse-dot" />}
                      {campaign.status === 'paused' && <Pause size={18} color="var(--warning)" />}
                      {(campaign.status === 'draft' || campaign.status === 'pending') && <Clock size={18} color="var(--accent)" />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {truncate(campaign.name, 50)}
                        </span>
                        <span className={`badge badge-${statusVariant(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {truncate(campaign.subject, 60)} • Created {formatDate(campaign.createdAt)}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)' }}>{stats.sent || 0}</div>
                        <div className="text-xs text-muted">Sent</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--error)' }}>{stats.failed || 0}</div>
                        <div className="text-xs text-muted">Failed</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{stats.total || 0}</div>
                        <div className="text-xs text-muted">Total</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>{progress}%</span>
                      {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div style={{ marginTop: 10 }}>
                    <div className="progress-wrap" style={{ height: 4 }}>
                      <div
                        className={`progress-bar ${campaign.status === 'completed' ? 'completed' : campaign.status === 'stopped' ? 'stopped' : ''}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px 20px' }} className="fade-in">
                    {/* Control Actions */}
                    <div className="control-deck mb-4">
                      {['draft', 'stopped', 'completed', 'failed'].includes(campaign.status) && (
                        <button
                          className="btn btn-success btn-sm"
                          disabled={actionLoading[`send-${ak}`]}
                          onClick={() => {
                            setActiveCampaign(campaign.id);
                            act(() => sendCampaign(campaign.id), `send-${ak}`);
                          }}
                        >
                          {actionLoading[`send-${ak}`] ? <div className="spinner" /> : <Play size={13} />}
                          {campaign.status === 'completed' ? 'Re-send' : 'Start'}
                        </button>
                      )}
                      {campaign.status === 'sending' && (
                        <button
                          className="btn btn-warning btn-sm"
                          disabled={actionLoading[`pause-${ak}`]}
                          onClick={() => act(() => pauseCampaign(campaign.id), `pause-${ak}`)}
                        >
                          {actionLoading[`pause-${ak}`] ? <div className="spinner" /> : <Pause size={13} />}
                          Pause
                        </button>
                      )}
                      {campaign.status === 'paused' && (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={actionLoading[`resume-${ak}`]}
                          onClick={() => {
                            setActiveCampaign(campaign.id);
                            act(() => resumeCampaign(campaign.id), `resume-${ak}`);
                          }}
                        >
                          {actionLoading[`resume-${ak}`] ? <div className="spinner" /> : <Play size={13} />}
                          Resume
                        </button>
                      )}
                      {['sending', 'paused'].includes(campaign.status) && (
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={actionLoading[`stop-${ak}`]}
                          onClick={() => act(() => stopCampaign(campaign.id), `stop-${ak}`)}
                        >
                          {actionLoading[`stop-${ak}`] ? <div className="spinner" /> : <Square size={13} />}
                          Stop
                        </button>
                      )}
                      {stats.failed > 0 && campaign.status !== 'sending' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          disabled={actionLoading[`retry-${ak}`]}
                          onClick={() => {
                            setActiveCampaign(campaign.id);
                            act(() => retryFailed(campaign.id), `retry-${ak}`);
                          }}
                        >
                          {actionLoading[`retry-${ak}`] ? <div className="spinner" /> : <RotateCcw size={13} />}
                          Retry Failed ({stats.failed})
                        </button>
                      )}
                      {stats.failed > 0 && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => exportFailed(campaign.id)}
                        >
                          <Download size={13} /> Export Failed CSV
                        </button>
                      )}
                    </div>

                    {/* Logs */}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Terminal size={14} color="var(--accent)" /> Activity Logs
                        {loadingLogs[campaign.id] && <div className="spinner" />}
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ marginLeft: 'auto', padding: '3px 10px' }}
                          onClick={async () => {
                            setLoadingLogs(l => ({ ...l, [campaign.id]: true }));
                            try {
                              const { data } = await api.get(`/campaigns/${campaign.id}/logs`);
                              setCampaignLogs(prev => ({ ...prev, [campaign.id]: data.logs || [] }));
                            } catch (e) {}
                            finally { setLoadingLogs(l => ({ ...l, [campaign.id]: false })); }
                          }}
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                      <LogConsole logs={logs} maxHeight={220} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
