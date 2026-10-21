import { useState } from "react";
import { Link } from "react-router-dom";
import { asRecord, baseballGet, unwrapList } from "../msdata";
import { DataState } from "../components/DataState";

interface Hit {
  type: string;
  id: number | null;
  name: string | null;
}

export function SearchPage() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [endpoint, setEndpoint] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await baseballGet("search", { q, page: 1, limit: 20 });
      setEndpoint(result.endpoint);
      if (result.error) setError(result.error);
      setHits(
        unwrapList(result.body).map((row) => {
          const rec = asRecord(row) || {};
          const nested = asRecord(rec.team) || asRecord(rec.player) || asRecord(rec.uniqueTournament) || rec;
          return {
            type: String(rec.type || rec.entityType || "unknown"),
            id: Number(nested.id || rec.id) || null,
            name: String(nested.name || rec.name || ""),
          };
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const players = hits.filter((h) => h.type.toLowerCase().includes("player"));
  const teams = hits.filter((h) => h.type.toLowerCase().includes("team"));
  const competitions = hits.filter((h) => h.type.toLowerCase().includes("tournament") || h.type.toLowerCase().includes("competition"));

  return (
    <>
      <h1>Search</h1>
      <p className="meta">GET /v1/baseball/search · try Yankees, MLB, Ohtani</p>
      <form className="searchbar" onSubmit={run}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Player, team, or competition" />
        <button type="submit">Search</button>
      </form>
      {endpoint ? <p className="meta">{endpoint}</p> : null}
      <DataState loading={loading} error={error}>
        <Group title="Players" items={players} to={(id) => `/player/${id}`} />
        <Group title="Teams" items={teams} to={(id) => `/team/${id}`} />
        <Group title="Competitions" items={competitions} to={(id) => `/competition/${id}`} />
      </DataState>
    </>
  );
}

function Group({ title, items, to }: { title: string; items: Hit[]; to: (id: number) => string }) {
  if (!items.length) return null;
  return (
    <section className="group">
      <h2>{title}</h2>
      <div className="cards">
        {items.map((item) =>
          item.id ? (
            <Link className="card" key={`${item.type}-${item.id}`} to={to(item.id)}>
              {item.name}
            </Link>
          ) : (
            <div className="card" key={item.name}>
              {item.name}
            </div>
          ),
        )}
      </div>
    </section>
  );
}
