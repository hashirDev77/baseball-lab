import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { asMatch, asRecord, baseballGet, unwrapList, type MsdataResult } from "../msdata";
import { DataState } from "../components/DataState";
import { JsonPanel } from "../components/JsonPanel";

const tabs = [
  ["overview", ""],
  ["at-bats", "at-bats"],
  ["lineups", "lineups"],
  ["statistics", "statistics"],
  ["players", "player-statistics"],
  ["top-performers", "top-performers"],
  ["umpires", "umpires"],
  ["h2h", "h2h"],
  ["best-players", "best-players"],
  ["pregame-form", "pregame-form"],
  ["team-streaks", "team-streaks"],
  ["weather", "weather"],
  ["enrichments", "enrichments"],
] as const;

export function MatchPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") || "overview") as (typeof tabs)[number][0];
  const type = params.get("type") || "";
  const [header, setHeader] = useState<MsdataResult | null>(null);
  const [panel, setPanel] = useState<MsdataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    baseballGet(`event/${id}`).then(setHeader).catch((err: Error) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!id || tab === "overview") {
      setPanel(null);
      return;
    }
    const suffix = tabs.find((row) => row[0] === tab)?.[1] || tab;
    const path = tab === "enrichments" && type ? `event/${id}/enrichments/${type}` : `event/${id}/${suffix}`;
    baseballGet(path).then(setPanel).catch((err: Error) => setError(err.message));
  }, [id, tab, type]);

  const match = asMatch(header?.body);
  const types = tab === "enrichments" ? unwrapList(panel?.body).map((item) => (typeof item === "string" ? item : String(asRecord(item)?.type || asRecord(item)?.name || ""))).filter(Boolean) : [];

  return (
    <DataState loading={!header && !error} error={error || header?.error}>
      {header && (
        <>
          <div className="header-match card">
            <div className="meta">
              {match?.tournament.id ? <Link to={`/competition/${match.tournament.id}`}>{match.tournament.name}</Link> : match?.tournament.name}
            </div>
            <div className="teams">
              <div>
                <div>
                  {match?.homeTeam.id ? <Link to={`/team/${match.homeTeam.id}`}>{match.homeTeam.name}</Link> : match?.homeTeam.name}
                </div>
                <div className="score">{match?.score.home}</div>
              </div>
              <div className="meta">vs</div>
              <div>
                <div>
                  {match?.awayTeam.id ? <Link to={`/team/${match.awayTeam.id}`}>{match.awayTeam.name}</Link> : match?.awayTeam.name}
                </div>
                <div className="score">{match?.score.away}</div>
              </div>
            </div>
            <div className="meta">
              {match?.status.label} {match?.startTime ? `· ${new Date(match.startTime).toLocaleString()}` : ""} {match?.venue ? `· ${match.venue}` : ""}
            </div>
            <p className="meta">{header.endpoint} · HTTP {header.status}</p>
          </div>
          <div className="tabs">
            {tabs.map(([item]) => (
              <button key={item} className={tab === item ? "active" : ""} onClick={() => setParams({ tab: item })}>
                {item}
              </button>
            ))}
          </div>
          {tab === "overview" && <JsonPanel label="GET /event/{id}" result={header} />}
          {tab !== "overview" && panel && (
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
        </>
      )}
    </DataState>
  );
}
