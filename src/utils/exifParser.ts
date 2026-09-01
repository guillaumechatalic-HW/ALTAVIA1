import exifr from 'exifr';
import { GalleryPhoto, CustomStagePhotos } from '../types/trail';

export interface ParsedPhotoItem {
  id: string;
  file?: File;
  dataUrl: string;
  fileName: string;
  fileSize?: number;
  timestamp: Date | null;
  dateStr: string; // e.g. "22 juin 2025" or "2025-06-22"
  timeStr: string; // e.g. "14:32"
  assignedDay: number; // 1 to 8 (or 0 if unassigned / outside trek)
  role: 'hero' | 'middle' | 'gallery';
  caption: string;
  location: string;
  gps?: { latitude: number; longitude: number };
  source?: 'local' | 'google-photos' | 'google-drive';
}

// Default trek start date: 2025-06-22 (or 2024-06-22)
export const DEFAULT_START_DATE = '2025-06-22';

/**
 * Robustly parses a date from various string formats (EXIF, ISO, filename)
 */
export function parseDateFromAnyString(raw?: string | null, fileName?: string): Date | null {
  if (raw && typeof raw === 'string') {
    const trimmed = raw.trim();

    // 1. EXIF format: "YYYY:MM:DD HH:MM:SS" or "YYYY:MM:DD"
    const exifMatch = trimmed.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/);
    if (exifMatch) {
      const year = parseInt(exifMatch[1], 10);
      const month = parseInt(exifMatch[2], 10) - 1;
      const day = parseInt(exifMatch[3], 10);
      const hour = exifMatch[4] ? parseInt(exifMatch[4], 10) : 12;
      const min = exifMatch[5] ? parseInt(exifMatch[5], 10) : 0;
      const sec = exifMatch[6] ? parseInt(exifMatch[6], 10) : 0;
      const d = new Date(year, month, day, hour, min, sec);
      if (!isNaN(d.getTime())) return d;
    }

    // 2. Standard ISO or Date.parse
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // 3. Fallback: Parse from filename e.g. "IMG_20250622_142301.jpg", "PXL_20240623_091000", "2024-06-24 15.30"
  if (fileName) {
    // Pattern 1: YYYYMMDD_HHMMSS or YYYYMMDD
    const compactMatch = fileName.match(/(?:IMG|PXL|DSC|VID|PHOTO|PIC)?[-_]?(\d{4})(\d{2})(\d{2})[-_]?(\d{2})?(\d{2})?(\d{2})?/i);
    if (compactMatch) {
      const year = parseInt(compactMatch[1], 10);
      const month = parseInt(compactMatch[2], 10) - 1;
      const day = parseInt(compactMatch[3], 10);
      if (year >= 2000 && year <= 2035 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        const hour = compactMatch[4] ? parseInt(compactMatch[4], 10) : 12;
        const min = compactMatch[5] ? parseInt(compactMatch[5], 10) : 0;
        const sec = compactMatch[6] ? parseInt(compactMatch[6], 10) : 0;
        const d = new Date(year, month, day, hour, min, sec);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // Pattern 2: YYYY-MM-DD
    const dashMatch = fileName.match(/(\d{4})[-_](\d{2})[-_](\d{2})/);
    if (dashMatch) {
      const year = parseInt(dashMatch[1], 10);
      const month = parseInt(dashMatch[2], 10) - 1;
      const day = parseInt(dashMatch[3], 10);
      if (year >= 2000 && year <= 2035 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        const d = new Date(year, month, day, 12, 0, 0);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  return null;
}

/**
 * Extracts creation timestamp from a File using EXIF metadata or lastModified fallback
 */
export async function extractPhotoMetadata(file: File): Promise<{
  timestamp: Date;
  gps?: { latitude: number; longitude: number };
}> {
  try {
    const exifData = await exifr.parse(file, [
      'DateTimeOriginal',
      'CreateDate',
      'ModifyDate',
      'GPSLatitude',
      'GPSLongitude',
      'latitude',
      'longitude',
    ]);

    if (exifData) {
      const dateVal = exifData.DateTimeOriginal || exifData.CreateDate || exifData.ModifyDate;
      let timestamp: Date | null = null;

      if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
        timestamp = dateVal;
      } else if (typeof dateVal === 'string') {
        timestamp = parseDateFromAnyString(dateVal, file.name);
      }

      let gps: { latitude: number; longitude: number } | undefined;
      const lat = exifData.latitude || exifData.GPSLatitude;
      const lon = exifData.longitude || exifData.GPSLongitude;
      if (typeof lat === 'number' && typeof lon === 'number') {
        gps = { latitude: lat, longitude: lon };
      }

      if (timestamp) {
        return { timestamp, gps };
      }
    }
  } catch (err) {
    console.warn('Could not read EXIF data for', file.name, err);
  }

  // Try parsing from filename
  const filenameDate = parseDateFromAnyString(null, file.name);
  if (filenameDate) {
    return { timestamp: filenameDate };
  }

  // Fallback to file.lastModified
  const fallbackDate = new Date(file.lastModified || Date.now());
  return { timestamp: fallbackDate };
}

/**
 * Checks if a date falls strictly within the 8-day trek window starting at startDateStr
 */
export function isDateInTrekRange(
  date: Date | null,
  startDateStr: string = DEFAULT_START_DATE,
  numDays: number = 8
): boolean {
  if (!date || isNaN(date.getTime())) return false;
  try {
    const startParts = startDateStr.split('-');
    if (startParts.length !== 3) return false;
    const sYear = parseInt(startParts[0], 10);
    const sMonth = parseInt(startParts[1], 10) - 1;
    const sDay = parseInt(startParts[2], 10);

    const dYear = date.getFullYear();
    const dMonth = date.getMonth();
    const dDay = date.getDate();

    const startUtc = Date.UTC(sYear, sMonth, sDay);
    const photoUtc = Date.UTC(dYear, dMonth, dDay);
    const diffDays = Math.round((photoUtc - startUtc) / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays < numDays;
  } catch {
    return false;
  }
}

/**
 * Maps a timestamp to an Alta Via 1 Day (1..8) based on user specified startDate.
 * Returns 0 if the date falls OUTSIDE the 8-day trek.
 */
export function determineDayFromDate(
  date: Date,
  startDateStr: string = DEFAULT_START_DATE,
  numDays: number = 8
): number {
  if (!date || isNaN(date.getTime())) return 0;

  try {
    const startParts = startDateStr.split('-');
    if (startParts.length === 3) {
      const sYear = parseInt(startParts[0], 10);
      const sMonth = parseInt(startParts[1], 10) - 1;
      const sDay = parseInt(startParts[2], 10);

      const dYear = date.getFullYear();
      const dMonth = date.getMonth();
      const dDay = date.getDate();

      const startUtc = Date.UTC(sYear, sMonth, sDay);
      const photoUtc = Date.UTC(dYear, dMonth, dDay);

      const diffDays = Math.round((photoUtc - startUtc) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays < numDays) {
        return diffDays + 1; // 0 diff -> Jour 1, 1 diff -> Jour 2, ..., 7 diff -> Jour 8
      }
    }
  } catch (e) {
    console.warn('determineDayFromDate error', e);
  }

  // OUTSIDE the trek dates: return 0 (do NOT force into any stage)
  return 0;
}

/**
 * Reads a File into a Data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Smart batch assignment of parsed photos to custom stage structure
 */
export function buildCustomStagePhotos(
  parsedPhotos: ParsedPhotoItem[]
): Record<number, CustomStagePhotos> {
  const result: Record<number, CustomStagePhotos> = {};

  // Group photos by day (only days 1 to 8)
  const byDay: Record<number, ParsedPhotoItem[]> = {};
  for (let d = 1; d <= 8; d++) {
    byDay[d] = [];
  }

  // Sort all photos by timestamp
  const sorted = [...parsedPhotos].sort((a, b) => {
    const tA = a.timestamp?.getTime() || 0;
    const tB = b.timestamp?.getTime() || 0;
    return tA - tB;
  });

  for (const item of sorted) {
    if (item.assignedDay >= 1 && item.assignedDay <= 8) {
      byDay[item.assignedDay].push(item);
    }
  }

  for (let d = 1; d <= 8; d++) {
    const photos = byDay[d];
    if (photos.length === 0) continue;

    // Pick hero (earliest or explicitly assigned 'hero')
    const heroItem = photos.find((p) => p.role === 'hero') || photos[0];
    // Pick middle (around noon or middle index or explicitly assigned 'middle')
    const middleItem =
      photos.find((p) => p.role === 'middle') ||
      (photos.length > 2 ? photos[Math.floor(photos.length / 2)] : photos[photos.length - 1]);

    const galleryPhotos: GalleryPhoto[] = photos.map((p, idx) => ({
      url: p.dataUrl,
      alt: p.caption || `Photo J${d} - ${p.timeStr || ''}`,
      caption: p.caption || (p.timeStr ? `Prise à ${p.timeStr}` : `Jour ${d}`),
      location: p.location || `Étape ${d}`,
      aspect: idx % 3 === 0 ? 'wide' : 'square',
    }));

    result[d] = {
      heroImage: heroItem.dataUrl,
      cardImage: heroItem.dataUrl,
      middleImage: middleItem.dataUrl,
      galleryPhotos,
    };
  }

  return result;
}
