/**
 * Units & Measurement Conversion Module
 * Canonical internal unit: Millimeters (mm) for length, Square Millimeters (mm²) for area.
 * Precision: 64-bit IEEE floating point with controlled formatting.
 */

export const MM_PER_INCH = 25.4;
export const MM_PER_FOOT = 304.8;
export const MM_PER_METER = 1000.0;
export const MM_PER_YARD = 914.4;

export const SQMM_PER_SQFT = MM_PER_FOOT * MM_PER_FOOT;       // ~92,903.04 mm²
export const SQMM_PER_SQM = MM_PER_METER * MM_PER_METER;      // 1,000,000 mm²
export const SQMM_PER_SQYD = MM_PER_YARD * MM_PER_YARD;       // ~836,127.36 mm²
export const SQMM_PER_CENT = 435.6 * SQMM_PER_SQFT;           // 1 Cent = 435.6 sq ft
export const SQMM_PER_GUNTA = 1089.0 * SQMM_PER_SQFT;         // 1 Gunta = 1089 sq ft (33ft x 33ft)
export const SQMM_PER_ANKANAM = 72.0 * SQMM_PER_SQFT;         // 1 Ankanam = 72 sq ft (Andhra/Telangana)

/**
 * Length conversion functions to mm
 */
export function feetToMm(feet) {
  return feet * MM_PER_FOOT;
}

export function feetInchesToMm(feet, inches = 0) {
  return (feet * 12 + inches) * MM_PER_INCH;
}

export function metersToMm(meters) {
  return meters * MM_PER_METER;
}

export function mmToFeet(mm) {
  return mm / MM_PER_FOOT;
}

export function mmToMeters(mm) {
  return mm / MM_PER_METER;
}

export function mmToFeetAndInches(mm) {
  const totalInches = mm / MM_PER_INCH;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches % 12) * 10) / 10;
  if (inches >= 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

/**
 * Area conversion functions
 */
export function sqmmToSqFt(sqmm) {
  return sqmm / SQMM_PER_SQFT;
}

export function sqmmToSqM(sqmm) {
  return sqmm / SQMM_PER_SQM;
}

export function sqmmToSqYards(sqmm) {
  return sqmm / SQMM_PER_SQYD;
}

export function sqmmToCents(sqmm) {
  return sqmm / SQMM_PER_CENT;
}

export function sqmmToGuntas(sqmm) {
  return sqmm / SQMM_PER_GUNTA;
}

export function sqftToSqmm(sqft) {
  return sqft * SQMM_PER_SQFT;
}

export function sqmToSqmm(sqm) {
  return sqm * SQMM_PER_SQM;
}

export function sqydToSqmm(sqyd) {
  return sqyd * SQMM_PER_SQYD;
}

export function centsToSqmm(cents) {
  return cents * SQMM_PER_CENT;
}

export function guntasToSqmm(guntas) {
  return guntas * SQMM_PER_GUNTA;
}

/**
 * Architectural formatting utilities
 */
export function formatDimension(mm, unitSystem = 'ft-in') {
  if (typeof mm !== 'number' || isNaN(mm)) return '0';

  if (unitSystem === 'metric-m') {
    return `${(mm / 1000).toFixed(2)} m`;
  }
  if (unitSystem === 'metric-mm') {
    return `${Math.round(mm)} mm`;
  }

  // Default 'ft-in'
  const { feet, inches } = mmToFeetAndInches(mm);
  if (inches === 0) {
    return `${feet}′-0″`;
  }
  return `${feet}′-${inches}″`;
}

export function formatArea(sqmm, unitSystem = 'sqft') {
  if (typeof sqmm !== 'number' || isNaN(sqmm)) return '0';

  switch (unitSystem) {
    case 'sqm':
      return `${sqmmToSqM(sqmm).toFixed(2)} sq.m`;
    case 'sqyd':
      return `${sqmmToSqYards(sqmm).toFixed(2)} sq.yd`;
    case 'cent':
      return `${sqmmToCents(sqmm).toFixed(2)} cents`;
    case 'gunta':
      return `${sqmmToGuntas(sqmm).toFixed(2)} guntas`;
    case 'sqft':
    default:
      return `${sqmmToSqFt(sqmm).toFixed(1)} sq.ft`;
  }
}

/**
 * Flexible dimension parser:
 * Accepts: "12' 6\"", "12-6", "12.5ft", "12 ft", "3.5m", "3500mm", "3500"
 */
export function parseDimension(str, defaultUnit = 'ft') {
  if (typeof str === 'number') {
    return defaultUnit === 'ft' ? feetToMm(str) : metersToMm(str);
  }
  if (!str || typeof str !== 'string') return 0;

  const trimmed = str.trim().toLowerCase();

  // Pattern: 12' 6" or 12'6 or 12'-6"
  const ftInMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*['′\-]\s*(?:(\d+(?:\.\d+)?)\s*["″]?\s*)?$/);
  if (ftInMatch) {
    const feet = parseFloat(ftInMatch[1]);
    const inches = ftInMatch[2] ? parseFloat(ftInMatch[2]) : 0;
    return feetInchesToMm(feet, inches);
  }

  // Pattern: 3500mm
  const mmMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*mm$/);
  if (mmMatch) return parseFloat(mmMatch[1]);

  // Pattern: 3.5m or 3.5 meters
  const mMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*m(?:eters?)?$/);
  if (mMatch) return metersToMm(parseFloat(mMatch[1]));

  // Pattern: 12.5ft or 12.5 feet
  const ftMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:ft|feet)$/);
  if (ftMatch) return feetToMm(parseFloat(ftMatch[1]));

  // Plain number
  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    return defaultUnit === 'ft' ? feetToMm(num) : metersToMm(num);
  }

  return 0;
}
