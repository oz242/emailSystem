import React, { useState, useRef } from 'react';
import {
  Mail, Paperclip, Send, Eye, EyeOff, Sparkles,
  X, ChevronLeft, ChevronRight, Clock, Zap,
  AlertCircle, CheckCircle, FileText
} from 'lucide-react';
import api from '../services/api';
import useEmailStore from '../store/emailStore';
import { compileTemplate, mapRecipients, isValidEmail, formatBytes, extractVariables } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

// AI suggestions for common email types
const AI_TEMPLATES = [
  {
    label: '🎉 Welcome Email',
    subject: 'Welcome to our platform, {{name}}!',
    body: `Hi {{name}},\n\nWelcome aboard! We're thrilled to have you with us.\n\nYour account has been successfully created with the email address {{email}}.\n\nGet started by exploring our features and don't hesitate to reach out if you need any help.\n\nBest regards,\nThe Team`
  },
  {
    label: '📢 Promotional Offer',
    subject: 'Exclusive offer just for you, {{name}}!',
    body: `Dear {{name}},\n\nAs a valued customer, we're excited to share an exclusive offer with you!\n\n🎁 Get 30% OFF on all premium plans this week only.\n\nUse code: EXCLUSIVE30 at checkout.\n\nThis offer is valid until Sunday. Don't miss out!\n\nCheers,\nThe Sales Team`
  },
  {
    label: '🔔 Event Invitation',
    subject: "{{name}}, you're invited to our upcoming event!",
    body: `Hello {{name}},\n\nWe're excited to invite you to our upcoming webinar!\n\n📅 Date: Next Tuesday at 3:00 PM IST\n📍 Location: Online (Zoom)\n\nTopics covered:\n• Latest industry trends\n• Live Q&A session\n• Networking opportunities\n\nRSVP by replying to this email.\n\nLooking forward to seeing you there!\n\nWarm regards,\nEvent Team`
  },
  {
    label: '📧 Follow-up Email',
    subject: 'Following up on our conversation, {{name}}',
    body: `Hi {{name}},\n\nI wanted to follow up on our recent conversation and see if you had any questions.\n\nWe believe our solution can genuinely help your team achieve better results. I'd love to schedule a quick 15-minute call to address any concerns.\n\nWould you be available this week?\n\nLooking forward to hearing from you.\n\nBest,\nThe Team`
  },
  {
    label: '⚠️ Important Notice',
    subject: 'Important update for your account — {{name}}',
    body: `Dear {{name}},\n\nThis is an important notice regarding your account ({{email}}).\n\nWe've made some updates to our terms of service and privacy policy that will take effect soon.\n\nPlease review the changes at your earliest convenience by visiting your account settings.\n\nIf you have any questions or concerns, please don't hesitate to contact our support team.\n\nThank you for your understanding.\n\nSincerely,\nThe Support Team`
  }
];

export default function ComposePage() {
  const navigate = useNavigate();
  const {
    sheetData, columnMap, compose, setCompose, clearCompose,
    addToast, fetchCampaigns, setActiveCampaign, sendCampaign
  } = useEmailStore();
  console.log(sheetData,"sheetData",columnMap,compose);
  

  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(2);
  const attachRef = useRef();

  // Build recipients from sheet data
  const recipients = sheetData
    ? mapRecipients(sheetData.preview, columnMap)
    : [];
  const totalRecipients = sheetData?.totalRows || 0;

  // Preview compiled email for current previewIndex
  const previewRecipient = recipients[previewIndex] || {};
  const compiledSubject = compileTemplate(compose.subject, previewRecipient);
  const compiledBody = compileTemplate(compose.body, previewRecipient);

  const templateVars = extractVariables((compose.subject || '') + ' ' + (compose.body || ''));

  const handleAttachFiles = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(f => ({
      file: f,
      name: f.name,
      size: f.size,
      id: `${Date.now()}-${Math.random()}`
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const applyTemplate = (tpl) => {
    setCompose({ subject: tpl.subject, body: tpl.body });
    setShowAI(false);
    addToast('Template applied!', 'success');
  };

  const handleCreateAndSend = async () => {
    if (!compose.name.trim()) {
      addToast('Please enter a campaign name', 'error');
      return;
    }
    if (!compose.subject.trim()) {
      addToast('Please enter an email subject', 'error');
      return;
    }
    if (!compose.body.trim()) {
      addToast('Please enter an email body', 'error');
      return;
    }
    if (!sheetData || !sheetData.totalRows) {
      addToast('Please import a recipients sheet first', 'error');
      return;
    }
    if (!columnMap.email) {
      addToast('Please map the email column in Import Sheet', 'error');
      return;
    }

    setLoading(true);
    try {
      // Build all recipients from full sheet data
      const allRecipients = mapRecipients(sheetData.preview, columnMap); // preview only for now
      // In production, the backend would re-parse from the saved filePath

      const form = new FormData();
      form.append('name', compose.name);
      form.append('subject', compose.subject);
      form.append('body', compose.body);
      form.append('recipients', JSON.stringify(allRecipients));
      form.append('delaySeconds', String(delaySeconds));
      attachments.forEach(a => form.append('attachments', a.file));

      const { data } = await api.post('/campaigns', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!data.success) throw new Error(data.message);

      addToast('Campaign created!', 'success');
      await fetchCampaigns();

      // Start sending
      await sendCampaign(data.campaign.id, delaySeconds);
      addToast('Campaign started! Monitor progress on Dashboard.', 'success');
      setActiveCampaign(data.campaign.id);
      clearCompose();
      navigate('/');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!compose.name || !sheetData) {
      addToast('Campaign name and recipients required', 'error');
      return;
    }
    try {
      const allRecipients = mapRecipients(sheetData.preview, columnMap);
      const form = new FormData();
      form.append('name', compose.name);
      form.append('subject', compose.subject || '(No subject)');
      form.append('body', compose.body || '');
      form.append('recipients', JSON.stringify(allRecipients));
      form.append('delaySeconds', String(delaySeconds));
      const { data } = await api.post('/campaigns', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast('Draft saved to History!', 'success');
      await fetchCampaigns();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header flex justify-between items-center">
        <div>
          <h2>✍️ Compose Email</h2>
          <p>Write your campaign email with dynamic personalization</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAI(!showAI)}>
            <Sparkles size={14} /> AI Templates
          </button>
          <button
            className={`btn btn-ghost btn-sm`}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* AI Templates Panel */}
      {showAI && (
        <div className="card mb-4 fade-in">
          <div className="card-header">
            <div className="card-title"><Sparkles size={18} color="var(--accent)" /> Quick Templates</div>
            <button className="btn btn-ghost btn-icon" onClick={() => setShowAI(false)}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {AI_TEMPLATES.map((tpl, i) => (
              <div
                key={i}
                onClick={() => applyTemplate(tpl)}
                style={{
                  padding: '12px 14px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: 'var(--bg-primary)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ fontWeight: 600, fontSize: '0.87rem', marginBottom: 4 }}>{tpl.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {tpl.subject}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Compose Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Campaign Info */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>
              <Zap size={16} color="var(--accent)" /> Campaign Settings
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Campaign Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Newsletter June 2025"
                  value={compose.name}
                  onChange={e => setCompose({ name: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Delay Between Emails (seconds)</label>
                <input
                  className="form-input"
                  type="number"
                  min={1} max={60}
                  value={delaySeconds}
                  onChange={e => setDelaySeconds(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Recipients info */}
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: sheetData ? 'var(--success-light)' : 'var(--warning-light)',
              borderRadius: 8,
              border: `1px solid ${sheetData ? 'var(--success)' : 'var(--warning)'}`,
              display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem'
            }}>
              {sheetData
                ? <><CheckCircle size={15} color="var(--success)" />
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                      {totalRecipients} recipients loaded from {sheetData.originalName}
                    </span>
                  </>
                : <><AlertCircle size={15} color="var(--warning)" />
                    <span style={{ color: 'var(--warning)' }}>
                      No recipients loaded. <a href="/import" style={{ color: 'var(--accent)', fontWeight: 600 }}>Import a sheet first →</a>
                    </span>
                  </>
              }
            </div>
          </div>

          {/* Email Compose */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>
              <Mail size={16} color="var(--accent)" /> Email Content
            </div>

            <div className="form-group">
              <label className="form-label">Subject Line *</label>
              <input
                className="form-input"
                placeholder="e.g. Hello {{name}}, your invoice is ready!"
                value={compose.subject}
                onChange={e => setCompose({ subject: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Body *</label>
              <textarea
                className="form-input form-textarea"
                placeholder={`Hi {{name}},\n\nWrite your email here...\n\nBest regards,\nYour Name`}
                style={{ minHeight: 280, fontFamily: 'inherit' }}
                value={compose.body}
                onChange={e => setCompose({ body: e.target.value })}
              />
            </div>

            {/* Template Variables Hint */}
            {sheetData && (
              <div style={{ marginTop: -8, marginBottom: 16 }}>
                <div className="text-xs text-muted mb-2">Click to insert variable:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {sheetData.headers.map(h => (
                    <span
                      key={h}
                      className="tag"
                      onClick={() => setCompose({ body: compose.body + `{{${h}}}` })}
                    >
                      {'{{'}{h}{'}}'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detected variables */}
            {templateVars.length > 0 && (
              <div style={{ padding: '8px 12px', background: 'var(--info-light)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--info)', marginBottom: 14 }}>
                🔍 Detected variables: {templateVars.map(v => `{{${v}}}`).join(', ')}
              </div>
            )}

            {/* Attachments */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <Paperclip size={13} style={{ display: 'inline', marginRight: 4 }} />
                Attachments
              </label>
              <input
                ref={attachRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleAttachFiles}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => attachRef.current?.click()}
                type="button"
              >
                <Paperclip size={13} /> Add Attachment
              </button>
              {attachments.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {attachments.map(a => (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', background: 'var(--bg-primary)',
                      borderRadius: 8, border: '1px solid var(--border-color)'
                    }}>
                      <FileText size={14} color="var(--accent)" />
                      <span style={{ flex: 1, fontSize: '0.82rem' }}>{a.name}</span>
                      <span className="text-xs text-muted">{formatBytes(a.size)}</span>
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ padding: 2 }}
                        onClick={() => removeAttachment(a.id)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleCreateAndSend}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? <div className="spinner" /> : <Send size={16} />}
              {loading ? 'Creating Campaign...' : 'Create & Send Campaign'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleSaveDraft}
              disabled={loading}
            >
              <FileText size={14} /> Save Draft
            </button>
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>⚡ Send Settings:</strong>{' '}
            {totalRecipients} recipients • {delaySeconds}s delay • ≈{Math.ceil((totalRecipients * delaySeconds) / 60)} min estimated
          </div>
        </div>

        {/* Live Preview Panel */}
        {showPreview && (
          <div className="card fade-in" style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
            <div className="card-header">
              <div className="card-title"><Eye size={16} color="var(--accent)" /> Email Preview</div>
              {recipients.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    disabled={previewIndex === 0}
                    onClick={() => setPreviewIndex(i => Math.max(0, i - 1))}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {previewIndex + 1}/{recipients.length}
                  </span>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    disabled={previewIndex >= recipients.length - 1}
                    onClick={() => setPreviewIndex(i => Math.min(recipients.length - 1, i + 1))}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Recipient Info */}
            {recipients.length > 0 ? (
              <div style={{ marginBottom: 16, padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Previewing for:</div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{previewRecipient[columnMap.name] || '(no name)'}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{previewRecipient[columnMap.email] || '(no email)'}</div>
              </div>
            ) : (
              <div style={{ marginBottom: 16, padding: '10px 12px', background: 'var(--warning-light)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--warning)' }}>
                Import a sheet to preview personalized emails
              </div>
            )}

            {/* Simulated Email */}
            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              overflow: 'hidden',
              background: '#fff',
              color: '#1a1a1a'
            }}>
              <div style={{ background: '#f5f5f5', padding: '12px 16px', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 4 }}>Subject:</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {compiledSubject || '(No subject yet)'}
                </div>
              </div>
              <div style={{ padding: '20px', fontSize: '0.87rem', lineHeight: 1.8, minHeight: 200, whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', color: '#333' }}>
                {compiledBody || '(Start typing your email body to see preview...)'}
              </div>
              {attachments.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #e0e0e0', background: '#f9f9f9' }}>
                  {attachments.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#666' }}>
                      <Paperclip size={12} /> {a.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
