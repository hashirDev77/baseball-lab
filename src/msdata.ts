/** Direct SportsAPI365 baseball client. Paths are /v1/baseball/... */

export type Json = Record<string, unknown>;

const UPSTREAM = (import.meta.env.VITE_MSDATA_BASE_URL || "https://sports-api.sportsdata365.com/msdata").replace(
  /\/$/,
  "",
);

/** Same-origin /msdata so a static host can rewrite to the deployed API (avoids browser CORS). */
export const BASE = "/msdata";

function headers(): HeadersInit {
  const next: Record<string, string> = { accept: "application/json" };
  const apim = import.meta.env.VITE_MSDATA_API_KEY;
  const live = import.meta.env.VITE_MSDATA_LIVE_KEY;
  if (apim) next["x-apim-key"] = apim;
  if (live) next["X-Live-Key"] = live;
  return next;
}

export interface MsdataResult<T = Json> {
  endpoint: string;
  status: number;
  body: T | null;
  error?: string;
}

export async function baseballGet<T = Json>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<MsdataResult<T>> {
  const clean = path.replace(/^\//, "").replace(/^v1\/baseball\//, "");
  const url = new URL(`${BASE}/v1/baseball/${clean}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  const endpoint = `/v1/baseball/${clean}${url.search}`;
  try {
    const response = await fetch(url.toString(), { headers: headers() });
    const text = await response.text();
    let body: T | null = null;
    try {
      body = text ? (JSON.parse(text) as T) : null;
    } catch {
      return { endpoint, status: response.status, body: null, error: "Response was not JSON" };
    }
    const rec = body && typeof body === "object" ? (body as Json) : null;
    const error = !response.ok ? apiErrorText(rec, response.status) : undefined;
    return { endpoint, status: response.status, body, error };
  } catch (err) {
    return { endpoint, status: 0, body: null, error: err instanceof Error ? err.message : String(err) };
  }
}

function apiErrorText(rec: Json | null, status: number): string {
  const raw = rec?.message ?? rec?.error ?? rec?.detail;
  if (typeof raw === "string" && raw.trim()) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Json;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.code === "string") return obj.code;
    try {
      return JSON.stringify(raw);
    } catch {
      /* fall through */
    }
  }
  if (status === 401 || status === 403) {
    return `HTTP ${status}: API key missing or rejected. Set VITE_MSDATA_API_KEY and VITE_MSDATA_LIVE_KEY.`;
  }
  if (status === 404) return `HTTP 404: ${UPSTREAM} returned not found.`;
  return `HTTP ${status}`;
}

export function asRecord(value: unknown): Json | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : null;
}

const LIST_KEYS = [
  "items",
  "events",
  "players",
  "seasons",
  "types",
  "media",
  "rankings",
  "atBats",
  "playerStatistics",
  "topPerformers",
  "umpires",
  "conditions",
  "statistics",
  "uniqueTournaments",
  "uniqueTournamentSeasons",
  "standings",
] as const;

export function unwrapList(body: unknown): unknown[] {
  const rec = asRecord(body);
  if (!rec) return Array.isArray(body) ? body : [];
  for (const key of LIST_KEYS) {
    if (Array.isArray(rec[key])) return rec[key] as unknown[];
  }
  return [];
}

export function unwrapNamed(body: unknown, key: string): Json | null {
  const rec = asRecord(body);
  if (!rec) return null;
  return asRecord(rec[key]) || (rec.id != null ? rec : null);
}

export interface Match {
  id: number;
  status: { code: string; label: string; description?: string | null };
  startTime: string | null;
  tournament: { id: number | null; name: string | null };
  homeTeam: { id: number | null; name: string | null };
  awayTeam: { id: number | null; name: string | null };
  score: { home: string; away: string };
  venue: string | null;
}

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function teamRef(value: unknown): { id: number | null; name: string | null } {
  const rec = asRecord(value);
  return { id: num(rec?.id), name: str(rec?.name) || str(rec?.shortName) };
}

function scoreDisplay(block: unknown): string {
  const rec = asRecord(block);
  if (!rec) return "—";
  const innings = asRecord(rec.inningsBaseball);
  const runs = num(rec.current) ?? num(innings?.run);
  const hits = num(innings?.hits);
  const errors = num(innings?.errors);
  if (runs != null && hits != null) return `${runs} (${hits} H${errors != null ? `, ${errors} E` : ""})`;
  if (runs != null) return String(runs);
  if (rec.series != null) return `series ${rec.series}`;
  return str(rec.display) || "—";
}

function statusOf(raw: unknown): Match["status"] {
  if (typeof raw === "string") {
    const code = raw.toLowerCase();
    const label = code.includes("progress") ? "Live" : code.includes("finish") || code === "ended" ? "Completed" : code.includes("not") ? "Upcoming" : raw;
    return { code, label, description: raw };
  }
  const rec = asRecord(raw);
  const code = str(rec?.type) || str(rec?.code) || "";
  const description = str(rec?.description);
  const lower = (code + " " + (description || "")).toLowerCase();
  const label = lower.includes("progress") || lower.includes("inning") ? "Live" : lower.includes("finish") || lower.includes("ended") ? "Completed" : "Upcoming";
  return { code: code || "unknown", label, description };
}

export function asMatch(raw: unknown): Match | null {
  const rec = unwrapNamed(raw, "event") || asRecord(raw);
  if (!rec || rec.id == null) return null;
  const tournament = asRecord(rec.uniqueTournament) || asRecord(rec.tournament) || asRecord(asRecord(rec.tournament)?.uniqueTournament);
  const start = rec.startTimestamp ?? rec.startTime;
  let startTime: string | null = null;
  if (typeof start === "number") startTime = new Date(start * 1000).toISOString();
  else if (typeof start === "string") startTime = start;
  return {
    id: Number(rec.id),
    status: statusOf(rec.status ?? rec.statusType),
    startTime,
    tournament: {
      id: num(tournament?.id) ?? num(rec.tournamentId),
      name: str(tournament?.name) || str(rec.tournamentName),
    },
    homeTeam: teamRef(rec.homeTeam),
    awayTeam: teamRef(rec.awayTeam),
    score: { home: scoreDisplay(rec.homeScore), away: scoreDisplay(rec.awayScore) },
    venue: str(asRecord(rec.venue)?.name) || str(rec.venue),
  };
}

export function asMatches(body: unknown): Match[] {
  return unwrapList(body)
    .map(asMatch)
    .filter((row): row is Match => Boolean(row));
}

export const SAMPLE = {
  eventId: 67599823,
  teamId: 84917477,
  playerId: 71698966,
  tournamentId: 53168725,
};
