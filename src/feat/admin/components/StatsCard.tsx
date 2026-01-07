import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string | {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  color?: string; // This will now control the background of the icon container
}

export function StatsCard({ title, value, icon: Icon, trend, description, color = "bg-primary" }: StatsCardProps) {
  const isPositive = typeof trend === 'object' ? trend.isPositive : true;
  const trendValue = typeof trend === 'object' ? `${Math.abs(trend.value)}%` : trend;

  return (
    <Card className="group overflow-hidden border-border/40 bg-card/40 backdrop-blur-xl hover:border-primary/40 transition-all duration-500 rounded-2xl relative shadow-none border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
        <CardTitle className="text-sm font-medium transition-colors group-hover:text-foreground/90">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-xl text-white shadow-sm transition-transform duration-500 group-hover:scale-110",
          color
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="flex flex-col gap-1 mt-1">
          {trend && (
            <p className="text-xs text-muted-foreground flex items-center">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-500 mr-1" />
              )}
              <span className={isPositive ? "text-green-500" : "text-rose-500"}>
                {trendValue}
              </span>
              <span className="ml-1 text-[10px] opacity-70">from last period</span>
            </p>
          )}
          {description && (
            <span className="text-[10px] text-muted-foreground font-medium opacity-60">
              {description}
            </span>
          )}
        </div>
      </CardContent>
      {/* Radiant Glow Effect */}
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 blur-2xl rounded-full -mr-12 -mt-12",
        color
      )} />
    </Card>
  );
}

