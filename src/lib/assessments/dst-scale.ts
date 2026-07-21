/**
 * Bharath Raj Developmental Screening Test (DST) – 88 scored items (ages 0–15 years).
 *
 * Scoring follows the psychologists' manual worksheet method:
 *   - Work in days. Every passed item earns partial credit for its age band
 *     (span_months * passed / total, in 30-day months); all bands are summed
 *     (no Binet "stop at the first gap" ceiling).
 *   - A developmental year is 365 days, so +5 days (365 - 12*30) is added for
 *     each developmental year that receives credit.
 *   - months = days * 12 / 365. Chronological age is whole months (as on the
 *     worksheet); developmental age keeps one decimal.
 *
 * Must stay in sync with backend app/services/dst_scoring.py.
 */
import dstItemsJson from '@/data/dst_items.json';

export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;
/** A developmental year is a real 365-day year, not 12 * 30 = 360. */
export const DAYS_PER_YEAR = 365;
/** The +5 days added per credited developmental year (365 - 12 * 30). */
export const LEAP_DAYS_PER_YEAR = DAYS_PER_YEAR - MONTHS_PER_YEAR * DAYS_PER_MONTH;

/** Highest norm age on the DST scale (item 88, 15 years). */
export const DST_MAX_SCALE_MONTHS = 180;

export type DSTClassification =
  | 'normal'
  | 'borderline'
  | 'mild_delay'
  | 'moderate_delay'
  | 'severe_delay';

export const DST_CLASSIFICATION_LABELS: Record<DSTClassification, string> = {
  normal: 'Normal',
  borderline: 'Borderline delay',
  mild_delay: 'Mild delay',
  moderate_delay: 'Moderate delay',
  severe_delay: 'Severe delay',
};

export interface DSTItem {
  id: number;
  text: string;
  pass_age_months: number;
  pass_age_days: number;
  age_band_label: string;
  is_language: boolean;
}

export const DST_ITEMS: DSTItem[] = (dstItemsJson as Omit<DSTItem, 'pass_age_days'>[]).map(
  item => ({
    ...item,
    pass_age_days: item.pass_age_months * DAYS_PER_MONTH,
  })
);

export const DST_ITEM_IDS = DST_ITEMS.map(item => String(item.id));

function parseDate(value: string): Date {
  const cleaned = value.includes('T') ? value.split('T')[0] : value;
  return new Date(`${cleaned}T00:00:00`);
}

export function dstAgeDaysFromDates(dateOfBirth: string, assessmentDate: string): number | null {
  if (!dateOfBirth?.trim() || !assessmentDate?.trim()) return null;
  const dob = parseDate(dateOfBirth);
  const dot = parseDate(assessmentDate);
  const days = Math.floor((dot.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  return days;
}

export function dstDaysToMonths(days: number, whole = false): number {
  const months = (days * MONTHS_PER_YEAR) / DAYS_PER_YEAR;
  if (whole) return Math.round(months);
  return Math.round(months * 10) / 10;
}

export function dstClassificationFromDq(dq: number): DSTClassification {
  if (dq >= 90) return 'normal';
  if (dq >= 70) return 'borderline';
  if (dq >= 55) return 'mild_delay';
  if (dq >= 40) return 'moderate_delay';
  return 'severe_delay';
}

function groupByPassAge(catalog: DSTItem[]): Array<[number, number[]]> {
  const levels = new Map<number, number[]>();
  for (const item of catalog) {
    const existing = levels.get(item.pass_age_months) ?? [];
    existing.push(item.id);
    levels.set(item.pass_age_months, existing);
  }
  return [...levels.entries()].sort((a, b) => a[0] - b[0]);
}

function allItemsPassed(items: Record<string, number>, catalog: DSTItem[]): boolean {
  return catalog.every(item => items[String(item.id)] === 1);
}

/**
 * Worksheet developmental age in days: sum partial credit for every band with at
 * least one passed item, then add LEAP_DAYS_PER_YEAR for each developmental year
 * that received credit.
 */
function developmentalAgeDays(items: Record<string, number>, catalog: DSTItem[]): number {
  const levels = groupByPassAge(catalog);
  if (levels.length === 0) return 0;

  let totalDays = 0;
  let previousAgeMonths = 0;
  const creditedYearBuckets = new Set<number>();

  for (const [ageMonths, itemIds] of levels) {
    const spanMonths = ageMonths - previousAgeMonths;
    const passed = itemIds.filter(id => items[String(id)] === 1).length;
    if (passed > 0) {
      const creditMonths = (spanMonths * passed) / itemIds.length;
      totalDays += creditMonths * DAYS_PER_MONTH;
      // Bucket a band into its developmental year (3-12M -> 1, 18-24M -> 2, …);
      // each credited year adds +5 days.
      creditedYearBuckets.add(Math.ceil(ageMonths / MONTHS_PER_YEAR));
    }
    previousAgeMonths = ageMonths;
  }

  totalDays += LEAP_DAYS_PER_YEAR * creditedYearBuckets.size;
  return Math.round(totalDays * 10) / 10;
}

function maxDevelopmentalAgeDays(catalog: DSTItem[]): number {
  const allPass: Record<string, number> = {};
  for (const item of catalog) allPass[String(item.id)] = 1;
  return developmentalAgeDays(allPass, catalog);
}

function dstQuotient(
  daMonths: number,
  caMonths: number,
  items?: Record<string, number>,
  catalog?: DSTItem[]
): number | null {
  if (caMonths < 1) return null;
  if (items && catalog) {
    const maxDaMonths = dstDaysToMonths(maxDevelopmentalAgeDays(catalog));
    if (caMonths > maxDaMonths && daMonths >= maxDaMonths && allItemsPassed(items, catalog)) {
      return 100;
    }
  }
  return Math.round((daMonths / caMonths) * 100);
}

export interface DSTScoreResult {
  chronological_age_days: number | null;
  developmental_age_days: number | null;
  chronological_age_months: number | null;
  developmental_age_months: number | null;
  developmental_quotient: number | null;
  classification: DSTClassification | null;
  language_developmental_age_days: number | null;
  language_developmental_age_months: number | null;
  language_developmental_quotient: number | null;
  language_classification: DSTClassification | null;
}

export function dstScoreFromItems(
  items: Record<string, number>,
  dateOfBirth: string,
  assessmentDate: string
): DSTScoreResult {
  const caDays = dstAgeDaysFromDates(dateOfBirth, assessmentDate);
  if (caDays === null) {
    return {
      chronological_age_days: null,
      developmental_age_days: null,
      chronological_age_months: null,
      developmental_age_months: null,
      developmental_quotient: null,
      classification: null,
      language_developmental_age_days: null,
      language_developmental_age_months: null,
      language_developmental_quotient: null,
      language_classification: null,
    };
  }

  const daDays = developmentalAgeDays(items, DST_ITEMS);
  const caMonths = dstDaysToMonths(caDays, true);
  const daMonths = dstDaysToMonths(daDays);
  const dq = dstQuotient(daMonths, caMonths, items, DST_ITEMS);
  const classification = dq !== null ? dstClassificationFromDq(dq) : null;

  const languageCatalog = DST_ITEMS.filter(item => item.is_language);
  const languageDaDays = developmentalAgeDays(items, languageCatalog);
  const languageDaMonths = dstDaysToMonths(languageDaDays);
  const languageDq = dstQuotient(languageDaMonths, caMonths, items, languageCatalog);
  const languageClassification = languageDq !== null ? dstClassificationFromDq(languageDq) : null;

  return {
    chronological_age_days: caDays,
    developmental_age_days: daDays,
    chronological_age_months: caMonths,
    developmental_age_months: daMonths,
    developmental_quotient: dq,
    classification,
    language_developmental_age_days: languageDaDays,
    language_developmental_age_months: languageDaMonths,
    language_developmental_quotient: languageDq,
    language_classification: languageClassification,
  };
}

/** Unique age bands sorted by months (for UI grouping). */
export const DST_AGE_BANDS = [...new Set(DST_ITEMS.map(item => item.age_band_label))];

export interface DSTAgeBandGroup {
  label: string;
  months: number;
  items: DSTItem[];
}

/** Age bands with items, ordered youngest → oldest. */
export function getDstAgeBandGroups(): DSTAgeBandGroup[] {
  const order: string[] = [];
  const map = new Map<string, DSTItem[]>();
  for (const item of DST_ITEMS) {
    if (!map.has(item.age_band_label)) {
      order.push(item.age_band_label);
      map.set(item.age_band_label, []);
    }
    map.get(item.age_band_label)!.push(item);
  }
  return order.map(label => ({
    label,
    months: map.get(label)![0]!.pass_age_months,
    items: map.get(label)!,
  }));
}

export function getBandCompletion(
  items: Record<string, number>,
  band: DSTAgeBandGroup
): { answered: number; total: number; passed: number } {
  let answered = 0;
  let passed = 0;
  for (const item of band.items) {
    const key = String(item.id);
    if (items[key] === 0 || items[key] === 1) {
      answered += 1;
      if (items[key] === 1) passed += 1;
    }
  }
  return { answered, total: band.items.length, passed };
}

export function findNearestBandIndex(caMonths: number | null, bands: DSTAgeBandGroup[]): number {
  if (caMonths === null || bands.length === 0) return 0;
  let best = 0;
  let bestDiff = Math.abs(bands[0]!.months - caMonths);
  for (let i = 1; i < bands.length; i++) {
    const diff = Math.abs(bands[i]!.months - caMonths);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

export function dstItemsNearChronologicalAge(caMonths: number | null, window = 2): DSTItem[] {
  if (caMonths === null) return DST_ITEMS;
  const uniqueBands = [...new Set(DST_ITEMS.map(i => i.pass_age_months))].sort((a, b) => a - b);
  const nearest = uniqueBands.reduce((prev, curr) =>
    Math.abs(curr - caMonths) < Math.abs(prev - caMonths) ? curr : prev
  );
  const nearestIdx = uniqueBands.indexOf(nearest);
  const minIdx = Math.max(0, nearestIdx - window);
  const maxIdx = Math.min(uniqueBands.length - 1, nearestIdx + window);
  const allowedMonths = new Set(uniqueBands.slice(minIdx, maxIdx + 1));
  return DST_ITEMS.filter(item => allowedMonths.has(item.pass_age_months));
}
