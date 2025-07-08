import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  changeType?: "positive" | "negative";
}

export function StatCard({
  title,
  value,
  change,
  icon,
  changeType = "positive",
}: StatCardProps) {
  return (
    <Card className="flex flex-col justify-between p-4 min-w-[200px] shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">{title}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-3xl font-bold">{value}</span>
        <span
          className={cn(
            "ml-2 text-sm font-medium flex items-center",
            changeType === "positive" ? "text-green-600" : "text-red-600"
          )}
        >
          {changeType === "positive" ? "▲" : "▼"} {change}
        </span>
      </div>
    </Card>
  );
} 