import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryDistributionProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#413ea0', '#ff8042'];

export function CategoryDistribution({ data }: CategoryDistributionProps) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-500 rounded-2xl shadow-none">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-sm font-medium">Category Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-2">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
                fontWeight: 500
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

