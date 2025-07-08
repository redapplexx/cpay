import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  metric: string;
  label: string;
}

export function StatCard({ metric, label }: StatCardProps) {
  return (
    <Card className="bg-slate-900 text-white p-6 flex flex-col items-center shadow-md">
      <CardContent className="flex flex-col items-center">
        <span className="text-6xl font-bold mb-2">{metric}</span>
        <span className="text-slate-400 text-lg text-center font-medium">{label}</span>
      </CardContent>
    </Card>
  );
} 