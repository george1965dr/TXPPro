import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  totalPlans: number;
  acceptedPlans: number;
}

export function StatsCards({ totalPlans, acceptedPlans }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">Total plans</p>
          <p className="text-2xl font-medium">{totalPlans}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">Accepted plans</p>
          <p className="text-2xl font-medium">{acceptedPlans}</p>
        </CardContent>
      </Card>
    </div>
  );
}
