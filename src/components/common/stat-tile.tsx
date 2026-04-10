import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StatTileProps {
  title: string;
  description: string;
  value: string;
  delta?: string;
}

export function StatTile({ title, description, value, delta }: StatTileProps) {
  return (
    <Card className="border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {delta ? (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              {delta}
            </span>
          ) : null}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-3xl font-bold tracking-tight">{value}</CardContent>
    </Card>
  );
}
