import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RelatoriosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize relatórios e indicadores do negócio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios e Dashboards
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Em breve: vendas por período, estoque, conversão e mais.
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
