import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { asMatches, asRecord, baseballGet, unwrapList, unwrapNamed, type MsdataResult } from "../msdata";
import { DataState } from "../components/DataState";
import { MatchCard } from "../components/MatchCard";
import { JsonPanel } from "../components/JsonPanel";

const tabs: Array<[string, string]> = [
  ["overview", "team/{id}"],
  ["squad", "team/{id}/players"],
  ["last", "team/{id}/events/last"],
  ["next", "team/{id}/events/next"],
  ["featured-event", "team/{id}/featured-event"],
  ["near-events", "team/{id}/near-events"],
  ["performance", "team/{id}/performance"],
  ["rankings", "team/{id}/rankings"],
  ["competitions", "team/{id}/unique-tournaments"],
  ["standings-seasons", "team/{id}/standings-seasons"],
  ["media", "team/{id}/media"],
  ["enrichments", "team/{id}/enrichments"],
];

export function TeamPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const type = params.get("type") || "";
  const [profile, setProfile] = useState<MsdataResult | null>(null);
  const [panel, setPanel] = useState<MsdataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    baseballGet(`team/${id}`).then(setProfile).catch((err: Error) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!id || tab === "overview") {
      setPanel(null);
      return;
    }
    const path =
      tab === "squad"
        ? `team/${id}/players`
        : tab === "last" || tab === "next"
          ? `team/${id}/events/${tab}`
          : tab === "competitions"
            ? `team/${id}/unique-tournaments`
            : tab === "enrichments" && type
              ? `team/${id}/enrichments/${type}`
              : `team/${id}/${tab}`;
    baseballGet(path).then(setPanel).catch((err: Error) => setError(err.message));
  }, [id, tab, type]);

  const team = unwrapNamed(profile?.body, "team");
  const types = tab === "enrichments" ? unwrapList(panel?.body).map((item) => (typeof item === "string" ? item : String(asRecord(item)?.type || ""))).filter(Boolean) : [];

  return (
    <DataState loading={!profile && !error} error={error || profile?.error}>
      <h1>{String(team?.name || `Team ${id}`)}</h1>
      <p className="meta">{String(asRecord(team?.country)?.name || team?.country || "")}</p>
      <div className="tabs">
        {tabs.map(([item]) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setParams({ tab: item })}>
            {item}
          </button>
        ))}
      </div>
      {tab === "overview" && <JsonPanel label="GET /team/{id}" result={profile} />}
      {tab === "squad" && (
        <div className="cards">
          {unwrapList(panel?.body)
            .map((row) => unwrapNamed(row, "player") || asRecord(row))
            .filter((row): row is NonNullable<typeof row> => Boolean(row?.id))
            .map((player) => (
              <Link className="card" key={Number(player.id)} to={`/player/${player.id}`}>
                {String(player.name)} <div className="meta">{String(player.position || "")}</div>
              </Link>
            ))}
        </div>
      )}
      {(tab === "last" || tab === "next") && (
        <div className="cards">
          {asMatches(panel?.body).map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
      {tab !== "overview" && tab !== "squad" && tab !== "last" && tab !== "next" && panel && (
        <>
          {tab === "enrichments" && types.length > 0 && (
            <div className="tabs">
              {types.map((item) => (
                <button key={item} className={type === item ? "active" : ""} onClick={() => setParams({ tab: "enrichments", type: item })}>
                  {item}
                </button>
              ))}
            </div>
          )}
          <JsonPanel result={panel} />
        </>
      )}
    </DataState>
  );
}

export function TeamsPage() {
  const [page, setPage] = useState(1);
  const [endpoint, setEndpoint] = useState("");
  const [items, setItems] = useState<Array<{ id: number; name: string }>>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    baseballGet("teams", { page, limit: 20 }).then((result) => {
      setEndpoint(result.endpoint);
      if (result.error) setError(result.error);
      setHasMore(Boolean(asRecord(result.body)?.hasMore));
      setItems(
        unwrapList(result.body)
          .map((row) => unwrapNamed(row, "team") || asRecord(row))
          .filter((row): row is NonNullable<typeof row> => Boolean(row?.id))
          .map((row) => ({ id: Number(row.id), name: String(row.name || row.id) })),
      );
    });
  }, [page]);

  return (
    <>
      <h1>Teams</h1>
      <p className="meta">{endpoint}</p>
      <DataState loading={!endpoint && !error} error={error}>
        <div className="cards">
          {items.map((team) => (
            <Link className="card" key={team.id} to={`/team/${team.id}`}>
              <strong>{team.name}</strong>
              <div className="meta">ID {team.id}</div>
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

export function ManagerPage() {
  const { id } = useParams();
  const [result, setResult] = useState<MsdataResult | null>(null);
  useEffect(() => {
    if (!id) return;
    baseballGet(`manager/${id}`).then(setResult);
  }, [id]);
  const manager = unwrapNamed(result?.body, "manager");
  return (
    <DataState loading={!result} error={result?.error}>
      <h1>{String(manager?.name || `Manager ${id}`)}</h1>
      <JsonPanel label="GET /manager/{id}" result={result} />
    </DataState>
  );
}
