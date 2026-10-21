import { useState } from "react";
import { CATALOG } from "../catalog";
import { SAMPLE, baseballGet, type MsdataResult } from "../msdata";
import { JsonPanel } from "../components/JsonPanel";

const defaults: Record<string, string> = {
  eventId: String(SAMPLE.eventId),
  teamId: String(SAMPLE.teamId),
  playerId: String(SAMPLE.playerId),
  tournamentId: String(SAMPLE.tournamentId),
  managerId: "62643844",
  seasonId: "68144200",
  type: "h2h_events",
  direction: "last",
  date: new Date().toISOString().slice(0, 10),
  round: "1",
};

function fill(path: string, ids: Record<string, string>) {
  return path.replace(/\{([^}]+)\}/g, (_, key) => ids[key] || `{${key}}`);
}

export function EndpointLabPage() {
  const [ids, setIds] = useState(defaults);
  const [selected, setSelected] = useState<(typeof CATALOG)[number]>(CATALOG[15]);
  const [result, setResult] = useState<MsdataResult | null>(null);
  const [q, setQ] = useState("Yankees");

  async function run(path: (typeof CATALOG)[number]) {
    setSelected(path);
    const filled = fill(path, ids).replace(/^\/v1\/baseball\//, "");
    const params: Record<string, string | number | undefined> = {};
    if (path.endsWith("/search")) params.q = q;
    if (path.includes("/events") && !path.includes("{")) params.limit = 5;
    setResult(await baseballGet(filled, params));
  }

  return (
    <>
      <h1>42 deployed routes</h1>
      <p className="meta">Each button calls SportsAPI365 `GET /v1/baseball/...` with the IDs below.</p>
      <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
        {Object.entries(ids).map(([key, value]) => (
          <label className="meta" key={key}>
            {key}{" "}
            <input
              className="field"
              value={value}
              onChange={(e) => setIds({ ...ids, [key]: e.target.value })}
            />
          </label>
        ))}
        <label className="meta">
          search q <input className="field" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <div className="cards" style={{ marginTop: 16 }}>
        {CATALOG.map((path) => (
          <button
            key={path}
            className={selected === path ? "card active" : "card"}
            onClick={() => run(path)}
            style={{ textAlign: "left" }}
          >
            <code>{path}</code>
          </button>
        ))}
      </div>
      {result && <JsonPanel label={selected} result={result} />}
    </>
  );
}
