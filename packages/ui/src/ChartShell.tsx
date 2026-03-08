import type { ReactNode } from "react";

type ChartShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export const ChartShell = (props: ChartShellProps) => {
  return (
    <section
      style={{
        border: "1px solid #d0d7de",
        borderRadius: "8px",
        padding: "12px",
        background: "#ffffff",
      }}
    >
      <header style={{ marginBottom: "12px" }}>
        <h2 style={{ margin: 0 }}>{props.title}</h2>
        {props.subtitle ? (
          <p style={{ margin: "4px 0 0", color: "#59636e" }}>{props.subtitle}</p>
        ) : null}
      </header>
      {props.children}
    </section>
  );
};
