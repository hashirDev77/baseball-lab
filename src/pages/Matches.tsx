import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { asMatches, baseballGet, SAMPLE, type Match } from "../msdata";
import { DataState } from "../components/DataState";
import { MatchCard } from "../components/MatchCard";

const tabs = [
  ["live", "Live", "inprogress"],
  ["today", "Today", ""],
  ["upcoming", "Upcoming", "notstarted"],
  ["results", "Results", "finished"],
] as const;

export function MatchesPage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") || "today") as (typeof tabs)[number][0];
  const spec = tabs.find((row) => row[0] === tab) || tabs[1];
  const [list, setList] = useState<Match[]>([]);
  const [endpoint, setEndpoint] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNote(null);
    const run = async () => {
      if (tab === "today") {
        const result = await baseballGet("fixtures/today", { limit: 40 });
        setEndpoint(result.endpoint);
        if (result.error) setError(result.error);
        setList(asMatches(result.body));
        return;
      }
      const result = await baseballGet("events", { status: spec[2], limit: 40 });
      setEndpoint(result.endpoint);
      let rows = asMatches(result.body);
      if (tab === "results" && rows.length === 0) {
        const fallback = await baseballGet(`team/${SAMPLE.teamId}/events/last`, { limit: 20 });
        rows = asMatches(fallback.body);
        setNote(
          `${result.endpoint} returned empty (status=finished). Showing ${fallback.endpoint} (Yankees) so you can still browse completed games.`,
        );
      }
      if (result.error) setError(result.error);
      setList(rows);
    };
    run()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tab, spec]);

  return (
    <>
      <h1>Matches</h1>
      <p className="meta">{endpoint}</p>
      {note ? <p className="meta">{note}</p> : null}
      <div className="tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setParams({ tab: id })}>
            {label}
          </button>
        ))}
      </div>
      <DataState loading={loading} error={error} empty={!loading && !list.length} emptyText="No matches from this endpoint.">
        <div className="cards">
          {list.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </DataState>
    </>
  );
}
