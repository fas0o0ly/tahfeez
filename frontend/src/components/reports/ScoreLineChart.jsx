import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';

const ScoreLineChart = ({ data = [], title = 'Assessment Score Trend' }) => {
  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <p className="text-sm font-semibold text-forest-900 mb-4">{title}</p>
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
          No assessment data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 print:break-inside-avoid">
      <p className="text-sm font-semibold text-forest-900 mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-4">Score out of 100</p>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#d4af37" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            formatter={(val) => [`${val}`, 'Avg Score']}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
          />
          <ReferenceLine y={70} stroke="#bbddd0" strokeDasharray="4 4"
                         label={{ value: 'Good', position: 'right', fontSize: 10, fill: '#9ca3af' }} />
          <Area
            type="monotone"
            dataKey="avg_score"
            stroke="#d4af37"
            strokeWidth={2.5}
            fill="url(#scoreGrad)"
            dot={{ r: 4, fill: '#d4af37', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreLineChart;
