import { formatJPY } from "./format.js";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function monthLabel(key) {
  const [, month] = key.split("-").map(Number);
  return MONTHS[month - 1] || key;
}

export function monthDifference(income, spending) {
  return Number(income) - Number(spending);
}

/** Numeric % for (income − spending); null when undefined (no base). */
export function diffPctValue(income, spending) {
  const diff = monthDifference(income, spending);
  if (diff === 0) return 0;

  const base = spending > 0 ? spending : income;
  if (base === 0) return null;

  return (diff / base) * 100;
}

export function formatDifference(diff) {
  if (diff === 0) return "¥0";
  if (diff > 0) return `+${formatJPY(diff)}`;
  return formatJPY(diff);
}

export function formatDiffPct(pct) {
  if (pct === null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}
