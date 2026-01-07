import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
  data: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  type?: 'line' | 'bar';
  className?: string;
}

export default function SalesChart({ data, type = 'line', className }: SalesChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Sales Overview</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your sales performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px] md:h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-[10px] sm:text-xs"
                  tick={{ fill: 'currentColor', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  className="text-[10px] sm:text-xs"
                  tick={{ fill: 'currentColor', fontSize: 10 }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Revenue (₹)"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="Orders"
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-[10px] sm:text-xs"
                  tick={{ fill: 'currentColor', fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  className="text-[10px] sm:text-xs"
                  tick={{ fill: 'currentColor', fontSize: 10 }}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    fontSize: '12px'
                  }}
                />
                <Bar
                  dataKey="sales"
                  fill="hsl(var(--primary))"
                  name="Revenue (₹)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
