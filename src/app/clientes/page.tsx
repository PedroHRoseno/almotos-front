import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Gerencie o cadastro de clientes da concessionária.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Base de Clientes
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Em breve: listagem, cadastro e histórico de clientes.
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
