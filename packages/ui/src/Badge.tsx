import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

type BadgeProps = {
  tone?: BadgeTone;
  children: ReactNode;
};

const toneMap: Record<BadgeTone, { background: string; color: string }> = {
  neutral: {
    background: "#f2f4f7",
    color: "#1f2328",
  },
  info: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  success: {
    background: "#dcfce7",
    color: "#166534",
  },
  warning: {
    background: "#fef3c7",
    color: "#92400e",
  },
  danger: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
};

export const Badge = (props: BadgeProps) => {
  const tone = props.tone ?? "neutral";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "999px",
        padding: "2px 8px",
        fontSize: "12px",
        fontWeight: 600,
        background: toneMap[tone].background,
        color: toneMap[tone].color,
      }}
    >
      {props.children}
    </span>
  );
};
