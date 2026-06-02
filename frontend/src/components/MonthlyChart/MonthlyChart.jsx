import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatJPY, formatJPYKanji } from "../../utils/format.js";
import "./MonthlyChart.scss";

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

// "2026-03" -> "Mar"
function monthLabel(key) {
  const [, month] = key.split("-").map(Number);
  return MONTHS[month - 1] || key;
}

export default function MonthlyChart({ data = [] }) {
  if (!data.length) {
    return <p className="muted">No data yet.</p>;
  }

  const chartData = data.map((row) => ({
    month: monthLabel(row.month),
    Income: Number(row.income),
    Spending: Number(row.expense),
  }));

  return (
    <div className="monthly-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3d5c1" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={formatJPYKanji}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            formatter={(value) => formatJPY(value)}
            cursor={{ fill: "rgba(214, 78, 56, 0.08)" }}
          />
          <Legend />
          <Bar dataKey="Income" fill="#6f6f4b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Spending" fill="#d64e38" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
