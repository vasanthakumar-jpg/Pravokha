import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface TopProductsChartProps {
  data: { name: string; sales: number }[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  // Show message if no data
  if (!data || data.length === 0) {
    return (
      <Card className="border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-500 rounded-2xl shadow-none">
        <CardHeader className="p-6 pb-2">
          <CardTitle className="text-sm font-medium">Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center p-6 pt-0">
          <div className="text-center text-muted-foreground/40 font-bold">
            <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-xs">No sales data available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-500 rounded-2xl shadow-none">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-sm font-medium">Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis
              type="number"
              tick={{
                fill: 'hsl(var(--foreground))',
                fontSize: 11,
                fontWeight: 600
              }}
              stroke="hsl(var(--muted-foreground))"
              opacity={0.5}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{
                fill: 'hsl(var(--foreground))',
                fontSize: 11,
                fontWeight: 600
              }}
              stroke="hsl(var(--muted-foreground))"
              width={100}
              opacity={0.5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
                fontWeight: 500
              }}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 600 }}
            />
            <Bar
              dataKey="sales"
              fill="#8884d8"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

