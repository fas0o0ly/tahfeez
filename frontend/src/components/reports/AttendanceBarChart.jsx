import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const AttendanceBarChart = ({ data = [], title = 'Attendance Overview' }) => {
  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <p className="text-sm font-semibold text-forest-900 mb-4">{title}</p>
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
          No attendance data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 print:break-inside-avoid">
      <p className="text-sm font-semibold text-forest-900 mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false} tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
            cursor={{ fill: '#f9fafb' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="present" name="Present" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
          <Bar dataKey="absent"  name="Absent"  fill="#fca5a5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceBarChart;
