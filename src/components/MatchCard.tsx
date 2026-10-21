import { Link } from "react-router-dom";
import type { Match } from "../msdata";

export function MatchCard({ match }: { match: Match }) {
  const live = match.status.label === "Live";
  return (
    <Link className="card" to={`/match/${match.id}`}>
      <div className="row">
        {match.tournament.id ? (
          <span className="meta">{match.tournament.name || "Competition"}</span>
        ) : (
          <span className="meta">{match.tournament.name || "Competition unknown"}</span>
        )}
        {live ? <span className="live">{match.status.label}</span> : <span className="badge">{match.status.label}</span>}
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <div>
          <div>{match.homeTeam.name || "Home"}</div>
          <div className="score">{match.score.home}</div>
        </div>
        <div style={{ color: "var(--muted)" }}>vs</div>
        <div style={{ textAlign: "right" }}>
          <div>{match.awayTeam.name || "Away"}</div>
          <div className="score">{match.score.away}</div>
        </div>
      </div>
      <div className="meta" style={{ marginTop: 10 }}>
        {match.status.description || ""}
        {match.startTime ? ` · ${new Date(match.startTime).toLocaleString()}` : ""}
        {match.venue ? ` · ${match.venue}` : ""}
      </div>
    </Link>
  );
}
