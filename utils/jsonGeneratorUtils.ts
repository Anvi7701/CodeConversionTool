export function toJsonFile(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(data: unknown) {
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}

export function formatJson(data: unknown, indent = 2) {
  try { return JSON.stringify(data, null, indent); } catch { return ''; }
}
