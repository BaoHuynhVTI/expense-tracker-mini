import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatJPY, formatJPYKanji } from "../../utils/format.js";
import {
  formatDifference,
  formatDiffPct,
  diffPctValue,
  monthDifference,
  monthLabel,
} from "../../utils/monthlyStats.js";
import "./MonthlyChart.scss";

const COLOR_INCOME = "#6f6f4b";
const COLOR_SPENDING = "#d64e38";
const COLOR_PCT_LINE = "#5a7b9c";
const BAR_SIZE = 40;

/** Symmetric domains so y=0 on ¥ (left) and % (right) share the same horizontal line. */
function computeDomains(chartData) {
  let maxAmount = 0;
  let maxPct = 0;

  for (const row of chartData) {
    maxAmount = Math.max(maxAmount, row.income, row.spending);
    if (row.diffPct != null) {
      maxPct = Math.max(maxPct, Math.abs(row.diffPct));
    }
  }

  const amountLimit = Math.max(Math.ceil((maxAmount * 1.1) / 1000) * 1000, 1000);
  const pctLimit = Math.max(Math.ceil((maxPct * 1.15) / 5) * 5, 10);

  return {
    amount: [-amountLimit, amountLimit],
    pct: [-pctLimit, pctLimit],
  };
}

function buildChartData(data = []) {
  return data.map((row) => {
    const income = Number(row.income);
    const spending = Number(row.expense);
    const diff = monthDifference(income, spending);
    const pct = diffPctValue(income, spending);

    return {
      month: monthLabel(row.month),
      income,
      spending,
      spendingNeg: -spending,
      diff,
      diffPct: pct,
      diffPctLine: formatDiffPct(pct),
      gapTone: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
    };
  });
}

function amountTick(value) {
  return formatJPYKanji(Math.abs(Number(value)));
}

function PctDot({ cx, cy, payload }) {
  if (cx == null || cy == null || payload?.diffPct == null) return null;

  const fill = payload.diffPct >= 0 ? COLOR_INCOME : COLOR_SPENDING;

  return <circle cx={cx} cy={cy} r={4} fill={fill} stroke="#faf6f0" strokeWidth={2} />;
}

function pctTick(value) {
  return `${Number(value).toFixed(0)}%`;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload;

  return (
    <div className="monthly-chart__tooltip">
      <p className="monthly-chart__tooltip-title">{row.month}</p>
      <div className="monthly-chart__tooltip-row">
        <span className="monthly-chart__tooltip-label">Income</span>
        <span className="monthly-chart__tooltip-value">{formatJPY(row.income)}</span>
      </div>
      <div className="monthly-chart__tooltip-row">
        <span className="monthly-chart__tooltip-label">Spending</span>
        <span className="monthly-chart__tooltip-value">{formatJPY(row.spending)}</span>
      </div>
      <div className="monthly-chart__tooltip-row monthly-chart__tooltip-row--net">
        <span className="monthly-chart__tooltip-label">Difference</span>
        <span className={`monthly-chart__tooltip-value monthly-chart__tooltip-value--${row.gapTone}`}>
          {formatDifference(row.diff)} ({row.diffPctLine})
        </span>
      </div>
    </div>
  );
}

export default function MonthlyChart({ data = [] }) {
  if (!data.length) {
    return <p className="muted">No data yet.</p>;
  }

  const chartData = buildChartData(data);
  const domains = computeDomains(chartData);

  return (
    <div className="monthly-chart">
      <p className="monthly-chart__legend-note muted">
        One column per month: income up, spending down from the center. Line: savings % of income (right).
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={chartData}
          margin={{ top: 12, right: 48, left: 8, bottom: 4 }}
          barCategoryGap="20%"
          barGap={-BAR_SIZE}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3d5c1" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} interval={0} />
          <YAxis
            yAxisId="amount"
            domain={domains.amount}
            tickFormatter={amountTick}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            domain={domains.pct}
            tickFormatter={pctTick}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{
              fill: "rgba(214, 78, 56, 0.08)",
              width: BAR_SIZE + 16,
              radius: 4,
            }}
            wrapperStyle={{ outline: "none" }}
          />
          <Legend />
          <ReferenceLine
            yAxisId="amount"
            y={0}
            stroke="#8a7b6b"
            strokeWidth={2}
            ifOverflow="extendDomain"
          />
          <ReferenceLine
            yAxisId="pct"
            y={0}
            stroke="#8a7b6b"
            strokeWidth={1}
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
          />
          <Bar
            yAxisId="amount"
            dataKey="spendingNeg"
            name="Spending"
            fill={COLOR_SPENDING}
            radius={[0, 0, 4, 4]}
            barSize={BAR_SIZE}
          />
          <Bar
            yAxisId="amount"
            dataKey="income"
            name="Income"
            fill={COLOR_INCOME}
            radius={[4, 4, 0, 0]}
            barSize={BAR_SIZE}
          />
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="diffPct"
            name="Savings % of income"
            stroke={COLOR_PCT_LINE}
            strokeWidth={2}
            connectNulls
            dot={<PctDot />}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
