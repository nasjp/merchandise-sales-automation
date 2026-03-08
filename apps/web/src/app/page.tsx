import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Merchandise Sales Automation</h1>
      <p>Ingest API: /api/ingest/android</p>
      <ul>
        <li>
          <Link href="/raw-events">Raw Events</Link>
        </li>
        <li>
          <Link href="/candidates">Candidates</Link>
        </li>
        <li>
          <Link href="/targets">Targets</Link>
        </li>
        <li>
          <Link href="/price-snapshots">Price Snapshots</Link>
        </li>
        <li>
          <Link href="/settings">Settings</Link>
        </li>
        <li>
          <Link href="/runs">Task Runs</Link>
        </li>
      </ul>
    </main>
  );
}
