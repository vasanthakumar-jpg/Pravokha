import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SalesChartProps {
  data: { date: string; sales: number }[];
}

export function SalesChart({ data }: SalesChartProps) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-500 rounded-2xl shadow-none">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-sm font-medium">Sales Trend (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              tick={{
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 500
              }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              tick={{
                fill: 'hsl(var(--foreground))',
                fontSize: 13,
                fontWeight: 500
              }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
                fontWeight: 500
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#8884d8"
              strokeWidth={3}
              dot={{ fill: '#8884d8', r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
