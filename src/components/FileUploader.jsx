import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle } from 'lucide-react';
import api from '../services/api';
import useEmailStore from '../store/emailStore';
import { formatBytes } from '../utils/helpers';

export default function FileUploader({ onSuccess }) {
  const { addToast, setSheetData } = useEmailStore();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const handleFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      addToast('Only .xlsx, .xls, and .csv files are supported', 'error');
      return;
    }
    setFile(selectedFile);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      const { data } = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log(data,"data");
      
      setSheetData(data);
      addToast(`Parsed ${data.totalRows} rows successfully!`, 'success');
      onSuccess && onSuccess(data);
    } catch (err) {
      addToast(err.message, 'error');
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, [addToast, setSheetData, onSuccess]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onInputChange = (e) => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  };

  return (
    <div
      className={`dropzone${dragOver ? ' drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => !loading && document.getElementById('sheet-file-input').click()}
    >
      <input
        id="sheet-file-input"
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={onInputChange}
      />

      {loading ? (
        <>
          <div className="dropzone-icon">
            <div className="spinner" />
          </div>
          <h3>Parsing spreadsheet...</h3>
          <p>Please wait while we extract your data</p>
        </>
      ) : file ? (
        <>
          <div className="dropzone-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <CheckCircle size={28} />
          </div>
          <h3 style={{ color: 'var(--success)' }}>File loaded!</h3>
          <p style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <FileSpreadsheet size={14} />
            {file.name} • {formatBytes(file.size)}
          </p>
          <button
            className="btn btn-ghost btn-sm mt-3"
            onClick={(e) => { e.stopPropagation(); setFile(null); setSheetData(null); }}
          >
            <X size={14} /> Remove
          </button>
        </>
      ) : (
        <>
          <div className="dropzone-icon">
            <Upload size={28} />
          </div>
          <h3>Drop your spreadsheet here</h3>
          <p>Supports .xlsx, .xls, and .csv files up to 10MB</p>
          <button className="btn btn-primary btn-sm mt-3" onClick={(e) => e.stopPropagation()}>
            <FileSpreadsheet size={14} /> Browse Files
          </button>
        </>
      )}
    </div>
  );
}
