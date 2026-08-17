import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  totalPlans: number;
  acceptedPlans: number;
}

export function StatsCards({ totalPlans, acceptedPlans }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="border-l-4 border-l-primary">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-muted-foreground">Total plans</p>
          <p className="text-3xl font-bold text-primary">{totalPlans}</p>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-muted-foreground">Accepted plans</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{acceptedPlans}</p>
        </CardContent>
      </Card>
    </div>
  );
}
