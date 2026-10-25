export function money(value) {
  return '$' + Math.floor(value).toLocaleString('de-DE');
}

export function depth(ft) {
  const rounded = Math.round(ft);
  return `${rounded > 0 ? '-' : ''}${Math.abs(rounded).toLocaleString('de-DE')} ft`;
}

export function num(value, digits = 0) {
  return value.toLocaleString('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function date(ts) {
  return new Date(ts).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
}
