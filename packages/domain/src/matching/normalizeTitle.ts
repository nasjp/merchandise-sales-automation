export const normalizeTitle = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\s\u3000]+/g, "")
    .replace(/[【】[\]（）()]/g, "");
