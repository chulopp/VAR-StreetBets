// src/lib/apiOracleService.ts
// Hakim API (Oracle) — resolves DISPUTED_FROZEN markets by fetching
// real match event data from API-Football when the device is online.
//
// Matching Strategy:
//   1. Fetch fixture events from API-Football.
//   2. Filter events within [incidentMinute - 2, incidentMinute + 2] range.
//   3. Match event type/detail against keyword map for each incident type.
//   4. Return verdict: matched event detail or "NO_INCIDENT_FOUND".

const API_BASE = "https://v3.football.api-sports.io";
const API_KEY = "a3034296d983da213a14290d6e331b42";

interface OracleVerdict {
  resolved: boolean;
  truth: string;
}

const INCIDENT_KEYWORDS: Record<string, string[]> = {
  VAR_INCIDENT: ["var", "video assistant referee", "cancelled", "review"],
  PENALTY: ["penalty"],
  CARD: ["card", "yellow", "red"],
  SURPRISE: ["own goal", "cancelled"],
};

export async function fetchTruthFromAPI(
  fixtureId: string,
  incidentMinute: number,
  incidentType: string,
): Promise<OracleVerdict> {
  const url = `${API_BASE}/fixtures/events?fixture=${encodeURIComponent(fixtureId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-apisports-key": API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`API-Football returned HTTP ${res.status}`);
  }

  const data = await res.json();
  const events: any[] = data?.response ?? [];

  if (!Array.isArray(events) || events.length === 0) {
    return { resolved: false, truth: "NO_INCIDENT_FOUND" };
  }

  const keywords = INCIDENT_KEYWORDS[incidentType] ?? [incidentType.toLowerCase()];
  const minRange = incidentMinute - 2;
  const maxRange = incidentMinute + 2;

  for (const event of events) {
    const elapsed = event?.time?.elapsed;
    if (typeof elapsed !== "number" || elapsed < minRange || elapsed > maxRange) {
      continue;
    }

    const typeStr = (event?.type ?? "").toLowerCase();
    const detailStr = (event?.detail ?? "").toLowerCase();
    const combined = `${typeStr} ${detailStr}`;

    if (keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      const detail = event?.detail
        ? `${event.type} - ${event.detail}`
        : `${event.type} - confirmed by match officials`;

      return { resolved: true, truth: detail };
    }
  }

  return { resolved: false, truth: "NO_INCIDENT_FOUND" };
}
