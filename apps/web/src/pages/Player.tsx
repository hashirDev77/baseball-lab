import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { asMatches, asRecord, baseballGet, unwrapList, unwrapNamed, type MsdataResult } from "../msdata";
import { DataState } from "../components/DataState";
import { MatchCard } from "../components/MatchCard";
import { JsonPanel } from "../components/JsonPanel";

export function PlayerPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const [profile, setProfile] = useState<MsdataResult | null>(null);
  const [last, setLast] = useState<MsdataResult | null>(null);
  const [next, setNext] = useState<MsdataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    baseballGet(`player/${id}`).then(setProfile).catch((err: Error) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!id || tab === "overview") return;
    const dir = tab === "upcoming" ? "next" : "last";
    baseballGet(`player/${id}/events/${dir}`, { limit: 10 }).then(tab === "upcoming" ? setNext : setLast);
  }, [id, tab]);

  const player = unwrapNamed(profile?.body, "player");
  const team = asRecord(player?.team);

  return (
    <DataState loading={!profile && !error} error={error || profile?.error}>
      <h1>{String(player?.name || `Player ${id}`)}</h1>
      <p className="meta">
        {team?.id ? <Link to={`/team/${team.id}`}>{String(team.name)}</Link> : String(team?.name || "")} · {String(player?.position || "")}
      </p>
      <div className="tabs">
        {["overview", "recent", "upcoming"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setParams({ tab: item })}>
            {item}
          </button>
        ))}
      </div>
      {tab === "overview" && <JsonPanel label="GET /player/{id}" result={profile} />}
      {tab === "recent" && (
        <div className="cards">
          {asMatches(last?.body).map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
      {tab === "upcoming" && (
        <div className="cards">
          {asMatches(next?.body).map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </DataState>
  );
}

export function PlayersPage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Array<{ id: number; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState("");
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    baseballGet("players", { page, limit: 20 }).then((result) => {
      setEndpoint(result.endpoint);
      if (result.error) setError(result.error);
      setHasMore(Boolean(asRecord(result.body)?.hasMore));
      setItems(
        unwrapList(result.body)
          .map((row) => unwrapNamed(row, "player") || asRecord(row))
          .filter((row): row is NonNullable<typeof row> => Boolean(row?.id))
          .map((row) => ({ id: Number(row.id), name: String(row.name || row.id) })),
      );
    });
  }, [page]);

  return (
    <>
      <h1>Players</h1>
      <p className="meta">{endpoint}</p>
      <DataState loading={!endpoint && !error} error={error}>
        <div className="cards">
          {items.map((player) => (
            <Link className="card" key={player.id} to={`/player/${player.id}`}>
              <strong>{player.name}</strong>
              <div className="meta">ID {player.id}</div>
            </Link>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <button className="btn ghost" disabled={!hasMore} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </div>
      </DataState>
    </>
  );
}
