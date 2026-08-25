function escapeCsv(value: string | number) { const text = String(value); return /[";,\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text }
function escapeHtml(value: string | number) { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]!) }

export function downloadCsv(name: string, headers: string[], rows: Array<Array<string | number>>) {
  const content = ['sep=;', headers.map(escapeCsv).join(';'), ...rows.map((row) => row.map(escapeCsv).join(';'))].join('\n')
  const url = URL.createObjectURL(new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${name}.csv`; anchor.click(); URL.revokeObjectURL(url)
}

export function printReport(title: string, subtitle: string, headers: string[], rows: Array<Array<string | number>>, metrics: Array<[string, string | number]>) {
  const target = window.open('', '_blank')
  if (!target) throw new Error('El navegador bloqueó la ventana de impresión.')
  target.opener = null
  const cards = metrics.map(([label, value]) => `<article><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></article>`).join('')
  const table = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
  target.document.open()
  target.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font:12px Arial;color:#183b36;padding:28px}h1{margin:0 0 5px}p{color:#607a75}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:20px 0}.metrics article{border:1px solid #dbe7e4;border-radius:8px;padding:10px}.metrics small{display:block;color:#708681}.metrics strong{font-size:18px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #e2eae8;text-align:left}th{background:#eff6f4}@media print{body{padding:0}}</style></head><body><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p><section class="metrics">${cards}</section><table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${table}</tbody></table></body></html>`)
  target.document.close()
  target.focus()
  window.setTimeout(() => target.print(), 250)
}
