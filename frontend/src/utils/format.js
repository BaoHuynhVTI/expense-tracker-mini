// Formatting helpers + shared color palette.

const jpyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

// Drop trailing zeros, keep up to 1 decimal (e.g. 1.2億, 35万, 8千).
function trimUnit(value) {
  return (Math.round(value * 10) / 10).toLocaleString("ja-JP");
}

// Compact 千 / 万 / 億 units — used on chart axes where space is tight.
export function formatJPYKanji(value) {
  const n = Number(value || 0);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1e8) return `${sign}¥${trimUnit(abs / 1e8)}億`;
  if (abs >= 1e4) return `${sign}¥${trimUnit(abs / 1e4)}万`;
  if (abs >= 1e3) return `${sign}¥${trimUnit(abs / 1e3)}千`;
  return `${sign}¥${Math.round(abs).toLocaleString("ja-JP")}`;
}

// Full grouped number everywhere else in the UI.
export function formatJPY(value) {
  return jpyFormatter.format(Number(value || 0));
}

// Color palette (from the reference vintage swatches)
export const VINTAGE_SWATCHES = [
  "#d64e38", // terracotta
  "#f2b03f", // mustard
  "#6f6f4b", // olive
  "#702c37", // burgundy
  "#e19e6a", // tan-orange
  "#e8d4b9", // cream
  "#b5764a", // clay brown
  "#8a9b5f", // sage green
  "#5a7b9c", // dusty blue
  "#8a5b7d", // mauve
];

export const DEFAULT_CATEGORY_COLOR = VINTAGE_SWATCHES[0]; // terracotta
export const DEFAULT_WALLET_COLOR = VINTAGE_SWATCHES[3]; // burgundy
export const DEFAULT_INCOME_COLOR = VINTAGE_SWATCHES[2]; // olive
export const DEFAULT_CREDIT_COLOR = VINTAGE_SWATCHES[4]; // tan-orange
