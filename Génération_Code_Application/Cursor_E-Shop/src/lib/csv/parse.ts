type CsvDelimiter = "," | ";";

/** Map header cell text to canonical field names used by product import. */
function canonicalHeaderName(raw: string): string {
  const key = raw.replace(/^\uFEFF/, "").trim().toLowerCase();
  const aliases: Record<string, string> = {
    name: "name",
    slug: "slug",
    description: "description",
    price: "price",
    imageurl: "imageUrl",
    "image url": "imageUrl",
    image_url: "imageUrl",
    category: "category",
    stock: "stock",
  };
  return aliases[key] ?? key;
}

function detectDelimiter(headerLine: string): CsvDelimiter {
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  const semiCount = (headerLine.match(/;/g) ?? []).length;
  return semiCount > commaCount ? ";" : ",";
}

/** Parse a single CSV line respecting double-quoted fields. */
function parseCsvLine(line: string, delimiter: CsvDelimiter = ","): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

/** Split CSV text into non-empty lines (handles \\r\\n and UTF-8 BOM). */
export function splitCsvLines(text: string): string[] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  return normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Parse CSV text into an array of row objects keyed by header names. */
export function parseCsvToRecords(
  text: string,
  expectedHeaders: readonly string[]
): { headers: string[]; rows: Record<string, string>[] } | { error: string } {
  const lines = splitCsvLines(text);

  if (lines.length < 2) {
    return {
      error: "The CSV must include a header row and at least one product row.",
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map(canonicalHeaderName);

  const missing = expectedHeaders.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    const hint =
      delimiter === ";"
        ? " Your file uses semicolons (;). Save as comma-separated CSV, or keep semicolons with all column headers present."
        : " Use comma (,) as the separator with every column in the header row.";
    return {
      error: `Missing required column(s): ${missing.join(", ")}. Expected headers: ${expectedHeaders.join(", ")}.${hint}`,
    };
  }

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], delimiter);
    if (values.every((v) => v === "")) continue;

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = values[index] ?? "";
    });
    rows.push(record);
  }

  if (rows.length === 0) {
    return { error: "No product rows found in the CSV file." };
  }

  return { headers, rows };
}
