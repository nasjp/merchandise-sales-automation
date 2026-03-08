import { listRecentSnapshots } from "@/server/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function PriceSnapshotsPage() {
  try {
    const rows = await listRecentSnapshots(50);

    return (
      <main>
        <h1>Price Snapshots</h1>
        <p>最新 50 件</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Target ID</th>
              <th>Sell Estimate</th>
              <th>Buy Limit</th>
              <th>Liquidity</th>
              <th>Observed At</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.targetId}</td>
                <td>{row.sellEstimateYen}</td>
                <td>{row.buyLimitYen}</td>
                <td>{row.liquidityScore}</td>
                <td>{row.observedAt.toISOString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    );
  } catch (error) {
    return (
      <main>
        <h1>Price Snapshots</h1>
        <p>データ取得に失敗しました。</p>
        <pre>{error instanceof Error ? error.message : "unknown error"}</pre>
      </main>
    );
  }
}
