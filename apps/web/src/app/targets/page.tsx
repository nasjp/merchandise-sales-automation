import { listActiveTargets } from "@/server/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function TargetsPage() {
  try {
    const rows = await listActiveTargets();

    return (
      <main>
        <h1>Targets</h1>
        <p>有効ターゲット</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>SKU</th>
              <th>Title Keyword</th>
              <th>Model Keyword</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.sku}</td>
                <td>{row.titleKeyword}</td>
                <td>{row.modelKeyword ?? "-"}</td>
                <td>{row.updatedAt.toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    );
  } catch (error) {
    return (
      <main>
        <h1>Targets</h1>
        <p>データ取得に失敗しました。</p>
        <pre>{error instanceof Error ? error.message : "unknown error"}</pre>
      </main>
    );
  }
}
