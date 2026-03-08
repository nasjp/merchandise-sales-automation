export const normalizeModel = (value: string): string =>
  value
    .toUpperCase()
    .normalize("NFKC")
    .replace(/[^A-Z0-9]/g, "");
