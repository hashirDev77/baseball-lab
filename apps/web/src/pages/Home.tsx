import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { asMatches, baseballGet, unwrapList, unwrapNamed, type Match } from "../msdata";
import { DataState } from "../components/DataState";
import { MatchCard } from "../components/MatchCard";

export function HomePage() {
  const [today, setToday] = useState<Match[]>([]);
  const [events, setEvents] = useState<Match[]>([]);
  const [competitions, setCompetitions] = useState<Array<{ id: number; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      baseballGet("fixtures/today", { limit: 20 }),
      baseballGet("events", { limit: 20 }),
      baseballGet("tournaments", { limit: 12 }),
    ])
      .then(([fixtures, feed, tours]) => {
        setPaths([fixtures.endpoint, feed.endpoint, tours.endpoint]);
        if (fixtures.error && feed.error) setError(fixtures.error);
        setToday(asMatches(fixtures.body));
        setEvents(asMatches(feed.body));
        setCompetitions(
          unwrapList(tours.body)
            .map((row) => unwrapNamed(row, "uniqueTournament") || unwrapNamed(row, "tournament"))
            .filter((row): row is NonNullable<typeof row> => Boolean(row?.id))
            .map((row) => ({ id: Number(row.id), name: String(row.name || row.id) })),
        );
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const live = events.filter((m) => m.status.label === "Live");
  const upcoming = today.filter((m) => m.status.label === "Upcoming");
  const completed = today.filter((m) => m.status.label === "Completed");

  return (
    <DataState loading={loading} error={error}>
      <h1>Baseball</h1>
      <p className="meta">{paths.join(" · ")}</p>
      <Section title="Live" matches={live} />
      <Section title="Today" matches={today} />
      <Section title="Upcoming (from today list)" matches={upcoming} />
      <Section title="Completed (from today list)" matches={completed} />
      <section className="group">
        <h2>Competitions</h2>
        <div className="cards">
          {competitions.map((item) => (
            <Link className="card" key={item.id} to={`/competition/${item.id}`}>
              <strong>{item.name}</strong>
            </Link>
          ))}
        </div>
      </section>
    </DataState>
  );
}

function Section({ title, matches }: { title: string; matches: Match[] }) {
  return (
    <section className="group">
      <h2>{title}</h2>
      {matches.length ? (
        <div className="cards">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="state empty">No matches.</div>
      )}
    </section>
  );
}
