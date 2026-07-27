export type LngLat = [number, number];

const LNG_HEADERS = new Set(['longitude', 'lng', 'lon', 'long', 'x']);
const LAT_HEADERS = new Set(['latitude', 'lat', 'y']);

function parseNumber(value: string): number | null {
  const n = Number(value.trim());
  if (Number.isNaN(n)) {
    return null;
  }
  return n;
}

function isValidLngLat(lng: number, lat: number): boolean {
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells.map(c => c.trim());
}

/**
 * Parses CSV text into [longitude, latitude] pairs.
 * Accepts headers: longitude/lng/lon/long + latitude/lat (any order),
 * or headerless rows as lng,lat or lat,lng when values are unambiguous.
 */
export function parseCsvCoordinates(csvText: string): {
  positions: LngLat[];
  skippedRows: number;
} {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return { positions: [], skippedRows: 0 };
  }

  const firstCells = splitCsvLine(lines[0]).map(c => c.toLowerCase());
  const lngIdx = firstCells.findIndex(c => LNG_HEADERS.has(c));
  const latIdx = firstCells.findIndex(c => LAT_HEADERS.has(c));
  const hasHeader = lngIdx >= 0 && latIdx >= 0;

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const positions: LngLat[] = [];
  let skippedRows = 0;

  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    let lng: number | null = null;
    let lat: number | null = null;

    if (hasHeader) {
      lng = parseNumber(cells[lngIdx] ?? '');
      lat = parseNumber(cells[latIdx] ?? '');
    } else if (cells.length >= 2) {
      const a = parseNumber(cells[0] ?? '');
      const b = parseNumber(cells[1] ?? '');
      if (a == null || b == null) {
        skippedRows += 1;
        continue;
      }
      // Prefer lng,lat; if first looks like latitude-only range and second like longitude, swap.
      if (Math.abs(a) <= 90 && Math.abs(b) > 90 && Math.abs(b) <= 180) {
        lat = a;
        lng = b;
      } else {
        lng = a;
        lat = b;
      }
    }

    if (lng == null || lat == null || !isValidLngLat(lng, lat)) {
      skippedRows += 1;
      continue;
    }
    positions.push([lng, lat]);
  }

  return { positions, skippedRows };
}
