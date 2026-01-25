import { Bike, TrendingUp, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const stats = [
    {
      title: "Total de Motos",
      value: "124",
      description: "+12% em relação ao mês anterior",
      icon: Bike,
    },
    {
      title: "Vendas do Mês",
      value: "R$ 284.500",
      description: "+8% em relação ao mês anterior",
      icon: DollarSign,
    },
    {
      title: "Clientes Ativos",
      value: "89",
      description: "+5 novos este mês",
      icon: Users,
    },
    {
      title: "Taxa de Conversão",
      value: "68%",
      description: "+2% em relação ao mês anterior",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema de gerenciamento de motos AlMotos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão geral</CardTitle>
          <p className="text-sm text-muted-foreground">
            Utilize o menu lateral para navegar entre as seções do sistema:
            Motos, Clientes, Vendas, Relatórios e Configurações.
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
