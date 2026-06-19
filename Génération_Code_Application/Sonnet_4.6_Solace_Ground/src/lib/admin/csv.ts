/** Parse CSV text into rows of string cells (handles quoted fields). */
export function parseCsv(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i++;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c.length > 0));
}

export function normalizeHeader(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

export function rowsToRecords(rows: string[][]): {
  headers: string[];
  records: Record<string, string>[];
} | { error: string } {
  if (rows.length < 2) {
    return { error: 'CSV must include a header row and at least one product row.' };
  }

  const headers = rows[0].map(normalizeHeader);
  const required = ['slug', 'name', 'description', 'category'];
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      error: `Missing required column(s): ${missing.join(', ')}. Also provide price_usd or price_cents.`,
    };
  }

  if (!headers.includes('price_usd') && !headers.includes('price_cents')) {
    return { error: 'CSV must include price_usd or price_cents column.' };
  }

  const records: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const line = rows[i];
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = line[idx] ?? '';
    });
    records.push(record);
  }

  return { headers, records };
}
