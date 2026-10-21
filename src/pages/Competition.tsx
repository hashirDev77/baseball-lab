import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { asMatches, asRecord, baseballGet, unwrapList, unwrapNamed, type MsdataResult } from "../msdata";
import { DataState } from "../components/DataState";
import { MatchCard } from "../components/MatchCard";
import { JsonPanel } from "../components/JsonPanel";

export function CompetitionPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const standingType = params.get("type") || "total";
  const [profile, setProfile] = useState<MsdataResult | null>(null);
  const [seasons, setSeasons] = useState<Array<{ id: number; name: string }>>([]);
  const [seasonId, setSeasonId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [round, setRound] = useState("1");
  const [panel, setPanel] = useState<MsdataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([baseballGet(`unique-tournament/${id}`), baseballGet(`unique-tournament/${id}/seasons`, { limit: 20 })]).then(
      ([tour, seasonList]) => {
        setProfile(tour);
        const rows = unwrapList(seasonList.body)
          .map((row) => asRecord(row))
          .filter((row): row is NonNullable<typeof row> => Boolean(row?.id))
          .map((row) => ({ id: Number(row.id), name: String(row.name || row.year || row.id) }));
        setSeasons(rows);
        const current = Number(unwrapNamed(tour.body, "uniqueTournament")?.currentSeasonId);
        setSeasonId(String(current || rows[0]?.id || ""));
      },
    );
  }, [id]);

  useEffect(() => {
    if (!id || tab === "overview") return;
    if (tab === "fixtures") baseballGet(`unique-tournament/${id}/events`, { limit: 20 }).then(setPanel);
    if (tab === "calendar") baseballGet(`unique-tournament/${id}/scheduled-events/${date}`).then(setPanel);
    if (tab === "seasons") baseballGet(`unique-tournament/${id}/seasons`, { limit: 20 }).then(setPanel);
    if (tab === "standings" && seasonId) {
      baseballGet(`unique-tournament/${id}/season/${seasonId}/standings/${standingType}`).then(setPanel);
    }
    if (tab === "rounds" && seasonId) {
      baseballGet(`unique-tournament/${id}/season/${seasonId}/round/${round}`).then(setPanel);
    }
  }, [id, tab, seasonId, date, round, standingType]);

  const tournament = unwrapNamed(profile?.body, "uniqueTournament");

  return (
    <DataState loading={!profile && !error} error={error || profile?.error}>
      <h1>{String(tournament?.name || "Competition")}</h1>
      <p className="meta">{profile?.endpoint}</p>
      <label className="meta">
        Season{" "}
        <select value={seasonId} onChange={(e) => setSeasonId(e.target.value)}>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
            </option>
          ))}
        </select>
      </label>
      <div className="tabs">
        {["overview", "fixtures", "calendar", "standings", "rounds", "seasons"].map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setParams({ tab: item })}>
            {item}
          </button>
        ))}
      </div>
      {tab === "overview" && <JsonPanel result={profile} />}
      {tab === "fixtures" && (
        <div className="cards">
          {asMatches(panel?.body).map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
      {tab === "calendar" && (
        <>
          <div className="row">
            <input className="field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="cards">
            {asMatches(panel?.body).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
          {panel && !asMatches(panel.body).length && <JsonPanel result={panel} />}
        </>
      )}
      {tab === "standings" && (
        <>
          <div className="tabs">
            {["total", "home", "away"].map((item) => (
              <button key={item} className={standingType === item ? "active" : ""} onClick={() => setParams({ tab: "standings", type: item })}>
                {item}
              </button>
            ))}
          </div>
          <JsonPanel result={panel} />
        </>
      )}
      {tab === "rounds" && (
        <>
          <label className="meta">
            Round <input className="field" value={round} onChange={(e) => setRound(e.target.value)} />
          </label>
          <div className="cards">
            {asMatches(panel?.body).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
          {panel && !asMatches(panel.body).length && <JsonPanel result={panel} />}
        </>
      )}
      {tab === "seasons" && (
        <div className="cards">
          {seasons.map((season) => (
            <div className="card" key={season.id}>
              {season.name} · {season.id}
            </div>
          ))}
        </div>
      )}
    </DataState>
  );
}

export function CompetitionsPage() {
  const [items, setItems] = useState<Array<{ id: number; name: string }>>([]);
  const [endpoint, setEndpoint] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    baseballGet("tournaments", { limit: 30 }).then((result) => {
      setEndpoint(result.endpoint);
      if (result.error) setError(result.error);
      setItems(
        unwrapList(result.body)
          .map((row) => unwrapNamed(row, "uniqueTournament") || unwrapNamed(row, "tournament") || asRecord(row))
          .filter((row): row is NonNullable<typeof row> => Boolean(row?.id))
          .map((row) => ({ id: Number(row.id), name: String(row.name || row.id) })),
      );
    });
  }, []);
  return (
    <>
      <h1>Competitions</h1>
      <p className="meta">{endpoint}</p>
      <DataState loading={!endpoint && !error} error={error}>
        <div className="cards">
          {items.map((item) => (
            <Link className="card" key={item.id} to={`/competition/${item.id}`}>
              <strong>{item.name}</strong>
              <div className="meta">ID {item.id}</div>
            </Link>
          ))}
        </div>
      </DataState>
    </>
  );
}
