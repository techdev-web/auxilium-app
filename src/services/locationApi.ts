import {
  stateDistricts as stateDistrictsUrl,
  states as statesUrl,
  subDistrictsSearch as subDistrictsSearchUrl,
  villagesSearch as villagesSearchUrl,
} from '../constants/urls';
import type {
  AdminPlaceNames,
  District,
  ResolvedLocation,
  State,
  SubDistrict,
  Village,
} from '../types/location';
import { reverseGeocodeAdminNames } from './geocode';

export function normalizePlaceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(district|taluka|tehsil|sub[-\s]?district|subdivision)\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Minimum fuzzy score (0–100) required to accept a match. */
const FUZZY_MATCH_THRESHOLD = 60;

function levenshteinDistance(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (!a.length) {
    return b.length;
  }
  if (!b.length) {
    return a.length;
  }

  const rows = a.length + 1;
  const cols = b.length + 1;
  const prev = new Array<number>(cols);
  const curr = new Array<number>(cols);

  for (let j = 0; j < cols; j++) {
    prev[j] = j;
  }

  for (let i = 1; i < rows; i++) {
    curr[0] = i;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    for (let j = 0; j < cols; j++) {
      prev[j] = curr[j];
    }
  }

  return prev[b.length];
}

/** Similarity ratio in 0–1 from Levenshtein distance. */
function stringSimilarity(a: string, b: string): number {
  if (!a && !b) {
    return 1;
  }
  if (!a || !b) {
    return 0;
  }
  if (a === b) {
    return 1;
  }
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Token-aware fuzzy score (0–100).
 * Handles near-misses like "Gautam Buddha Nagar" ↔ "Gautam Buddh Nagar".
 */
function fuzzyPlaceScore(normalizedQuery: string, normalizedName: string): number {
  if (!normalizedQuery || !normalizedName) {
    return 0;
  }
  if (normalizedQuery === normalizedName) {
    return 100;
  }

  if (
    normalizedName.startsWith(normalizedQuery) ||
    normalizedQuery.startsWith(normalizedName)
  ) {
    return 90 + 10 * stringSimilarity(normalizedQuery, normalizedName);
  }

  if (
    normalizedName.includes(normalizedQuery) ||
    normalizedQuery.includes(normalizedName)
  ) {
    return 75 + 15 * stringSimilarity(normalizedQuery, normalizedName);
  }

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const nameTokens = normalizedName.split(' ').filter(Boolean);
  if (!queryTokens.length || !nameTokens.length) {
    return Math.round(100 * stringSimilarity(normalizedQuery, normalizedName));
  }

  // Match each query token to its best unused name token (greedy).
  const used = new Set<number>();
  let tokenSimilaritySum = 0;

  for (const qToken of queryTokens) {
    let bestIdx = -1;
    let bestSim = 0;
    for (let i = 0; i < nameTokens.length; i++) {
      if (used.has(i)) {
        continue;
      }
      const sim = stringSimilarity(qToken, nameTokens[i]);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      used.add(bestIdx);
      tokenSimilaritySum += bestSim;
    }
  }

  const avgTokenSim = tokenSimilaritySum / queryTokens.length;
  // Penalize large token-count mismatches (e.g. 1-word vs 4-word names).
  const lengthRatio =
    Math.min(queryTokens.length, nameTokens.length) /
    Math.max(queryTokens.length, nameTokens.length);
  const fullSim = stringSimilarity(normalizedQuery, normalizedName);

  // Weighted blend: token matching dominates for multi-word place names.
  const blended = 0.7 * avgTokenSim + 0.2 * fullSim + 0.1 * lengthRatio;
  return Math.round(100 * blended);
}

export function findBestNameMatch<T>(
  items: T[],
  getName: (item: T) => string,
  query: string,
): T | null {
  const normalizedQuery = normalizePlaceName(query);
  if (!normalizedQuery || !items?.length) {
    return null;
  }

  const scored = items
    .filter(Boolean)
    .map(item => {
      const name = getName(item);
      if (!name) {
        return { item, score: 0, length: 0 };
      }
      const normalized = normalizePlaceName(name);
      return {
        item,
        score: fuzzyPlaceScore(normalizedQuery, normalized),
        length: normalized.length,
      };
    })
    .filter(entry => entry.score >= FUZZY_MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score || a.length - b.length);

  return scored[0]?.item ?? null;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export async function fetchStates(): Promise<State[]> {
  const data = await readJson<State[] | null>(await fetch(statesUrl));
  return Array.isArray(data) ? data.filter(Boolean) : [];
}

export async function fetchDistricts(stateId: number): Promise<District[]> {
  const data = await readJson<District[] | null>(
    await fetch(stateDistrictsUrl(stateId)),
  );
  return Array.isArray(data) ? data.filter(Boolean) : [];
}

export async function searchSubDistricts(params: {
  name?: string;
  districtId?: number;
  stateId?: number;
  limit?: number;
}): Promise<SubDistrict[]> {
  const query = new URLSearchParams();
  if (params.name) {
    query.set('name', params.name);
  }
  if (params.districtId != null) {
    query.set('district_id', String(params.districtId));
  }
  if (params.stateId != null) {
    query.set('state_id', String(params.stateId));
  }
  query.set('limit', String(params.limit ?? 50));

  const data = await readJson<SubDistrict[] | null>(
    await fetch(`${subDistrictsSearchUrl}?${query.toString()}`),
  );
  return Array.isArray(data) ? data.filter(Boolean) : [];
}

export async function searchVillages(params: {
  villageName?: string;
  subDistrictId?: number;
  districtId?: number;
  stateId?: number;
  limit?: number;
}): Promise<Village[]> {
  const query = new URLSearchParams();
  if (params.villageName) {
    query.set('village_name', params.villageName);
  }
  if (params.subDistrictId != null) {
    query.set('sub_district_id', String(params.subDistrictId));
  }
  if (params.districtId != null) {
    query.set('district_id', String(params.districtId));
  }
  if (params.stateId != null) {
    query.set('state_id', String(params.stateId));
  }
  query.set('limit', String(params.limit ?? 50));

  const data = await readJson<Village[] | null>(
    await fetch(`${villagesSearchUrl}?${query.toString()}`),
  );
  return Array.isArray(data) ? data.filter(Boolean) : [];
}

export async function resolveLocationFromNames(
  names: AdminPlaceNames,
): Promise<ResolvedLocation | null> {
  if (!names.state) {
    return null;
  }

  const states = await fetchStates();
  const state = findBestNameMatch(states, s => s.state_name, names.state);
  if (!state) {
    return null;
  }

  const districts = await fetchDistricts(state.state_id);
  const district = names.district
    ? findBestNameMatch(districts, d => d.district_name, names.district)
    : null;
  if (!district) {
    return { state, district: null, subDistrict: null, village: null };
  }

  const subDistricts = await searchSubDistricts({
    districtId: district.district_id,
    name: names.subDistrict,
    limit: 50,
  });
  const subDistrict = names.subDistrict
    ? findBestNameMatch(subDistricts, s => s.name, names.subDistrict)
    : subDistricts[0] ?? null;
  if (!subDistrict) {
    return { state, district, subDistrict: null, village: null };
  }

  const villages = await searchVillages({
    subDistrictId: subDistrict.id,
    villageName: names.village,
    limit: 50,
  });
  const village = names.village
    ? findBestNameMatch(villages, v => v.name, names.village)
    : villages[0] ?? null;
  if (!village) {
    return { state, district, subDistrict, village: null };
  }

  return { state, district, subDistrict, village };
}

export async function resolveLocationFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<ResolvedLocation | null> {
  const names = await reverseGeocodeAdminNames(latitude, longitude);
  console.log('names', names);
  const resolved = await resolveLocationFromNames(names);
  console.log('resolved', resolved);
  return resolved;
}

export function parseListingCenter(
  value: string,
): { latitude: number; longitude: number } | null {
  const match = value
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

export function formatListingCenter(
  latitude: number,
  longitude: number,
): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

export function villageCoordinates(
  village: Village,
): { latitude: number; longitude: number } | null {
  if (village.latitude == null || village.longitude == null) {
    return null;
  }
  const latitude = Number(village.latitude);
  const longitude = Number(village.longitude);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }
  return { latitude, longitude };
}
