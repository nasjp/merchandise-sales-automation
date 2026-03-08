import { listRecentRawEvents } from "@/server/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function RawEventsPage() {
  try {
    const rows = await listRecentRawEvents(50);

    return (
      <main>
        <h1>Raw Events</h1>
        <p>最新 50 件</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Source</th>
              <th>Title</th>
              <th>Received At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.source}</td>
                <td>{row.title}</td>
                <td>{row.receivedAt.toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    );
  } catch (error) {
    return (
      <main>
        <h1>Raw Events</h1>
        <p>データ取得に失敗しました。</p>
        <pre>{error instanceof Error ? error.message : "unknown error"}</pre>
      </main>
    );
  }
}
