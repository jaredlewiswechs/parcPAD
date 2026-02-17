/** Display formatters for Newton data */

export function truncateHash(hash: string, chars = 12): string {
  if (!hash) return '—';
  if (hash.length <= chars) return hash;
  return `${hash.slice(0, chars)}…`;
}

export function formatTimestamp(ts: number): string {
  if (!ts) return '—';
  // Timestamps from Python can be seconds (float) or ms
  const ms = ts < 1e12 ? ts * 1000 : ts;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
    hour:  '2-digit',
    minute:'2-digit',
    second:'2-digit',
  }).format(new Date(ms));
}

export function formatNumber(n: number, decimals = 4): string {
  if (!isFinite(n)) return String(n);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function truncateText(text: string, maxLen = 60): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

export function formatLedgerStep(step: number | null | undefined): string {
  if (step == null) return '—';
  return `#${step}`;
}

export function cmfkPercent(val: number): string {
  return `${Math.round(val * 100)}%`;
}
