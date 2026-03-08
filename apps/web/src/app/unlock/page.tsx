import { normalizeNextPath } from "@/server/uiPasswordGate";

type UnlockPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function UnlockPage({ searchParams }: UnlockPageProps) {
  const params = await searchParams;
  const next = normalizeNextPath(params?.next);
  const hasError = params?.error === "1";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <form
        action="/api/ui-auth"
        method="post"
        style={{
          width: "100%",
          maxWidth: "360px",
          display: "grid",
          gap: "12px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          background: "#fff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "18px" }}>パスワードを入力</h1>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          この環境はアクセス制限されています。
        </p>
        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="password"
          placeholder="PASSWORD"
          required
          autoFocus
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        />
        {hasError ? (
          <p style={{ margin: 0, color: "#b91c1c", fontSize: "13px" }}>
            パスワードが正しくありません。
          </p>
        ) : null}
        <button
          type="submit"
          style={{
            padding: "10px",
            border: "none",
            borderRadius: "8px",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          ログイン
        </button>
      </form>
    </main>
  );
}

