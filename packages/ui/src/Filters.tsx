import type { ReactNode } from "react";

type FiltersProps = {
  children: ReactNode;
};

export const Filters = (props: FiltersProps) => {
  return (
    <section
      aria-label="filters"
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "12px",
      }}
    >
      {props.children}
    </section>
  );
};
