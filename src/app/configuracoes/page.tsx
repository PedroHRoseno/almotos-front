import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Configurações</h1>
        <p className="text-muted-foreground">
          Ajuste preferências e parâmetros do sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Em breve: usuários, integrações, preferências e backup.
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
