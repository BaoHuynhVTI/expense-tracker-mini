export const NAV_ITEMS = [
  { to: "/", label: "Overview", end: true },
  { to: "/expenses", label: "Expenses" },
  { to: "/income", label: "Income" },
  { to: "/transfers", label: "Transfers" },
  { to: "/debts", label: "Debts" },
  { to: "/credit", label: "Credit" },
  { to: "/settings", label: "Settings" },
];

export function getPageTitle(pathname) {
  if (pathname === "/") {
    return NAV_ITEMS.find((item) => item.end)?.label ?? "Overview";
  }

  const match = [...NAV_ITEMS]
    .filter((item) => item.to !== "/")
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));

  return match?.label ?? "Expense Tracker Mini";
}
