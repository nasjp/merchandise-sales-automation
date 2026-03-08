import type { ReactNode } from "react";

export type DataTableColumn<TRow> = {
  key: string;
  header: ReactNode;
  cell: (row: TRow) => ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
};

type DataTableProps<TRow> = {
  columns: readonly DataTableColumn<TRow>[];
  rows: readonly TRow[];
  rowKey: (row: TRow) => string;
  emptyMessage?: ReactNode;
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  border: "1px solid #d0d7de",
  fontSize: "14px",
};

const headerCellStyle = {
  borderBottom: "1px solid #d0d7de",
  borderRight: "1px solid #d0d7de",
  padding: "8px 10px",
  textAlign: "left" as const,
  background: "#f6f8fa",
  whiteSpace: "nowrap" as const,
};

const bodyCellStyle = {
  borderBottom: "1px solid #d0d7de",
  borderRight: "1px solid #d0d7de",
  padding: "8px 10px",
  verticalAlign: "top" as const,
};

export const DataTable = <TRow,>(props: DataTableProps<TRow>) => {
  if (props.rows.length === 0) {
    return <p>{props.emptyMessage ?? "データがありません。"}</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {props.columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...headerCellStyle,
                  textAlign: column.align ?? "left",
                  width: column.width,
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row) => (
            <tr key={props.rowKey(row)}>
              {props.columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    ...bodyCellStyle,
                    textAlign: column.align ?? "left",
                  }}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
