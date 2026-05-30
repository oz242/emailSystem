import React, { useState, useEffect } from 'react';
import {
  Upload, FileSpreadsheet, Table, ArrowRight,
  CheckCircle, AlertCircle, RefreshCw, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import useEmailStore from '../store/emailStore';
import { isValidEmail, truncate } from '../utils/helpers';

export default function ImportPage() {
  const navigate = useNavigate();
  const { sheetData, columnMap, setColumnMap, clearSheet, addToast } = useEmailStore();
  const [step, setStep] = useState(1); // 1=upload, 2=map, 3=preview

  useEffect(() => {
    if (sheetData) {
      // Auto-detect common column names
      const headers = sheetData.headers.map(h => h.toLowerCase());
      const emailCol = sheetData.headers.find(h =>
        ['email', 'e-mail', 'email address', 'emailaddress', 'mail'].includes(h.toLowerCase())
      ) || '';
      const nameCol = sheetData.headers.find(h =>
        ['name', 'full name', 'fullname', 'first name', 'firstname', 'recipient'].includes(h.toLowerCase())
      ) || '';
      setColumnMap({ email: emailCol, name: nameCol });
      setStep(2);
    }
  }, [sheetData]);

  const validRecipients = sheetData?.preview?.filter(row => {
    const emailValue = row[columnMap.email];
    return emailValue && isValidEmail(emailValue);
  }) || [];

  const invalidCount = sheetData
    ? sheetData.preview.filter(row => !isValidEmail(row[columnMap.email] || '')).length
    : 0;

  const handleConfirmMapping = () => {
    if (!columnMap.email) {
      addToast('Please select the column containing email addresses', 'error');
      return;
    }
    setStep(3);
  };

  const handleReset = () => {
    clearSheet();
    setStep(1);
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2>📂 Import Recipients</h2>
        <p>Upload your Excel or CSV file to extract recipient data</p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32, maxWidth: 500 }}>
        {[
          { n: 1, label: 'Upload File' },
          { n: 2, label: 'Map Columns' },
          { n: 3, label: 'Preview Data' }
        ].map(({ n, label }, i) => (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem',
                background: step >= n ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'var(--border-color)',
                color: step >= n ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s'
              }}>
                {step > n ? <CheckCircle size={16} /> : n}
              </div>
              <span style={{
                fontSize: '0.72rem', fontWeight: 600, whiteSpace: 'nowrap',
                color: step >= n ? 'var(--accent)' : 'var(--text-muted)'
              }}>{label}</span>
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 20,
                background: step > n ? 'var(--accent)' : 'var(--border-color)',
                transition: 'background 0.3s'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Upload size={18} color="var(--accent)" /> Upload Spreadsheet</div>
          </div>
          <FileUploader onSuccess={() => setStep(2)} />
          <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>💡 File Requirements</div>
            <ul style={{ fontSize: '0.82rem', color: 'var(--text-muted)', paddingLeft: 18, lineHeight: 2 }}>
              <li>Supported formats: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong></li>
              <li>First row should be the header row (column names)</li>
              <li>Must include a column with email addresses</li>
              <li>Optional: name, company, phone, or any custom columns</li>
              <li>Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 2 && sheetData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <FileSpreadsheet size={18} color="var(--accent)" />
                Map Columns
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-purple">{sheetData.totalRows} rows</span>
                <span className="badge badge-info">{sheetData.headers.length} columns</span>
              </div>
            </div>

            <div style={{ marginBottom: 20, padding: 14, background: 'var(--success-light)', borderRadius: 8, border: '1px solid var(--success)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: '0.83rem', color: 'var(--success)' }}>
                <strong>File loaded:</strong> {sheetData.originalName} — {sheetData.totalRows} recipient rows detected.
                Map each required field to the matching column in your file.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">
                  📧 Email Column <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <select
                  className="form-select"
                  value={columnMap.email}
                  onChange={e => setColumnMap({ ...columnMap, email: e.target.value })}
                >
                  <option value="">— Select column —</option>
                  {sheetData.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <div className="text-xs text-muted mt-1">Column containing recipient email addresses</div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">👤 Name Column</label>
                <select
                  className="form-select"
                  value={columnMap.name}
                  onChange={e => setColumnMap({ ...columnMap, name: e.target.value })}
                >
                  <option value="">— Select column —</option>
                  {sheetData.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <div className="text-xs text-muted mt-1">Column containing recipient names (for {'{'}{'{'} name {'}'}{'}'})</div>
              </div>
            </div>

            <div style={{ marginTop: 20, padding: 14, background: 'var(--accent-light)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600, marginBottom: 6 }}>
                Available Template Variables
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sheetData.headers.map(h => (
                  <span key={h} className="tag">{'{{'}{h}{'}}'}</span>
                ))}
              </div>
              <div className="text-xs text-muted mt-2">Use these in your email subject and body to personalize each email</div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn btn-ghost btn-sm" onClick={handleReset}>
                <RefreshCw size={14} /> Upload Different File
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmMapping}
                disabled={!columnMap.email}
              >
                Confirm Mapping <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && sheetData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Table size={18} color="var(--accent)" /> Data Preview</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-success">{sheetData.totalRows} total rows</span>
                {invalidCount > 0 && (
                  <span className="badge badge-error">{invalidCount} invalid emails</span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
              <div style={{
                flex: 1, padding: 12, background: 'var(--success-light)',
                borderRadius: 8, border: '1px solid var(--success)',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <CheckCircle size={16} color="var(--success)" />
                <span style={{ fontSize: '0.83rem', color: 'var(--success)', fontWeight: 600 }}>
                  {sheetData.totalRows - invalidCount} valid recipients
                </span>
              </div>
              {invalidCount > 0 && (
                <div style={{
                  flex: 1, padding: 12, background: 'var(--warning-light)',
                  borderRadius: 8, border: '1px solid var(--warning)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <AlertCircle size={16} color="var(--warning)" />
                  <span style={{ fontSize: '0.83rem', color: 'var(--warning)', fontWeight: 600 }}>
                    {invalidCount} rows have invalid / missing emails (will be skipped)
                  </span>
                </div>
              )}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    {sheetData.headers.map(h => <th key={h}>{h}</th>)}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sheetData.preview.map((row, i) => {
                    const emailVal = row[columnMap.email] || '';
                    const valid = isValidEmail(emailVal);
                    return (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-muted)', width: 40 }}>{i + 1}</td>
                        {sheetData.headers.map(h => (
                          <td key={h} style={{ color: h === columnMap.email && !valid ? 'var(--error)' : undefined }}>
                            {truncate(String(row[h] ?? ''), 35)}
                          </td>
                        ))}
                        <td>
                          {valid
                            ? <span className="badge badge-success">Valid</span>
                            : <span className="badge badge-error">Invalid Email</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sheetData.totalRows > 10 && (
              <div className="text-xs text-muted mt-2" style={{ textAlign: 'center', padding: 8 }}>
                Showing first 10 of {sheetData.totalRows} rows
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>
                ← Back to Mapping
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/compose')}>
                <Users size={16} /> Proceed to Compose <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
