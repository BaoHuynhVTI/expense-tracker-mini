import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatJPY, VINTAGE_SWATCHES } from "../../utils/format.js";
import "./CategoryPieChart.scss";

function buildChartData(totalsByCategory = {}) {
  const entries = Object.entries(totalsByCategory).map(([name, amount]) => ({
    name,
    value: Number(amount),
  }));
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  if (total <= 0) return { data: [], total: 0 };

  const data = entries
    .sort((a, b) => b.value - a.value)
    .map((entry, index) => ({
      ...entry,
      color: VINTAGE_SWATCHES[index % VINTAGE_SWATCHES.length],
      percent: (entry.value / total) * 100,
    }));

  return { data, total };
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div className="category-pie-chart__tooltip">
      <span className="category-pie-chart__tooltip-name">{item.name}</span>
      <span>{formatJPY(item.value)}</span>
      <span className="category-pie-chart__tooltip-pct">{item.percent.toFixed(1)}%</span>
    </div>
  );
}

function renderLabel({ name, percent, cx, cy, midAngle, outerRadius }) {
  if (percent < 5) return null;

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#4a3f35"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="category-pie-chart__label"
    >
      {`${name} ${percent.toFixed(0)}%`}
    </text>
  );
}

export default function CategoryPieChart({ totalsByCategory }) {
  const { data, total } = buildChartData(totalsByCategory);

  if (!data.length) {
    return <p className="muted">No category spending yet.</p>;
  }

  return (
    <div className="category-pie-chart">
      <ResponsiveContainer width="100%" height={320}>
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={104}
            paddingAngle={2}
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="#faf6f0" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            formatter={(value, entry) => {
              const pct = entry.payload?.percent ?? 0;
              return `${value} (${pct.toFixed(1)}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="category-pie-chart__total muted">
        Total spending: {formatJPY(total)} (wallet + card charges)
      </p>
    </div>
  );
}
