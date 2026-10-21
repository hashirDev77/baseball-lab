import type { MsdataResult } from "../msdata";

export function JsonPanel({ label, result }: { label?: string; result: MsdataResult | null }) {
  if (!result) return <div className="state">Loading…</div>;
  return (
    <div className="panel">
      {label ? <h2>{label}</h2> : null}
      <p className="meta">
        <code>{result.endpoint}</code> · HTTP {result.status}
        {result.error ? ` · ${result.error}` : ""}
      </p>
      <pre className="meta">{JSON.stringify(result.body, null, 2)}</pre>
    </div>
  );
}
