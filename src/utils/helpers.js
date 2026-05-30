/**
 * Validate email address format
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/**
 * Format time only
 */
export function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

/**
 * Compile a template string with recipient data
 * Replaces {{key}} with actual values
 */
export function compileTemplate(template, data) {
  if (!template) return '';
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const cleanKey = key.trim();
    const foundKey = Object.keys(data).find(k => k.toLowerCase() === cleanKey.toLowerCase());
    return foundKey ? data[foundKey] : match;
  });
}

/**
 * Map sheet rows using column mapping
 */
export function mapRecipients(rows, columnMap) {
  return rows.map(row => {
    const mapped = { ...row }; // preserve all original data
    // Remap columns
    if (columnMap.email && columnMap.email !== 'email') {
      mapped.email = row[columnMap.email] || '';
    }
    if (columnMap.name && columnMap.name !== 'name') {
      mapped.name = row[columnMap.name] || '';
    }
    return mapped;
  });
}

/**
 * Convert bytes to human-readable file size
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate a quick color from a string (for avatar/icons)
 */
export function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 55%)`;
}

/**
 * Truncate long text
 */
export function truncate(str, len = 40) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '…' : str;
}

/**
 * Get status badge variant
 */
export function statusVariant(status) {
  const map = {
    sent: 'success', completed: 'success',
    failed: 'error', stopped: 'error',
    sending: 'info', pending: 'warning',
    paused: 'warning', draft: 'default'
  };
  return map[status] || 'default';
}

/**
 * Extract template variables from a string
 */
export function extractVariables(text) {
  const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
  return [...new Set(matches.map(m => m.replace(/^\{\{|\}\}$/g, '').trim()))];
}
