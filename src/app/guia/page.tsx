"use client";

import { BookOpen, Bike, Users, ShoppingBag, ShoppingCart, Repeat, ArrowUpDown, BarChart3, Wallet, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GuiaPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Guia do Sistema AlMotos
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Entenda o funcionamento e a lógica do sistema para aproveitar ao máximo todas as funcionalidades.
        </p>
      </div>

      {/* Visão Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
          <CardDescription>
            O AlMotos é um ERP financeiro para lojas de motos. Ele controla veículos, clientes/parceiros, compras, vendas, trocas, custos adicionais e transações operacionais da loja, gerando um fluxo de caixa unificado e relatórios para apoio à decisão.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos e Funcionalidades</CardTitle>
          <CardDescription>
            Cada seção do menu lateral corresponde a um conjunto de operações. A ordem recomendada de uso está abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Users className="h-5 w-5" />
              Clientes (Parceiros)
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Cadastre clientes e fornecedores antes de registrar compras ou vendas. O sistema usa CPF como identificador único. Em compras, o parceiro é o fornecedor; em vendas e trocas, é o cliente.
            </p>
            <Badge variant="secondary">Recomendado cadastrar primeiro</Badge>
          </section>

          <section>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Bike className="h-5 w-5" />
              Veículos (Motos)
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Liste e cadastre veículos. A placa é o identificador único. Cada veículo pode ter status <strong>Disponível</strong>, <strong>Vendido</strong> ou <strong>Inativo</strong>. Na tela de detalhes (ícone de olho na tabela) você vê histórico de compras, vendas, trocas, custos adicionais e o cálculo de lucro por veículo.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Lucro por veículo:</strong> Valor de Venda − (Valor de Compra + soma dos Custos Adicionais).
            </p>
          </section>

          <section>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <ShoppingBag className="h-5 w-5" />
              Compras
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Registre a compra de um veículo. O veículo e o parceiro (fornecedor) devem existir. Ao criar uma compra, o veículo fica <strong>Disponível</strong>. &quot;Excluir&quot; na prática <strong>cancela</strong> a compra: o registro permanece com status <strong>Cancelada</strong> e o veículo é marcado como <strong>Inativo</strong> (ou removido do estoque se você marcar a opção correspondente).
            </p>
          </section>

          <section>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5" />
              Vendas
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Registre a venda de um veículo disponível. O veículo passa para <strong>Vendido</strong>. Ao &quot;excluir&quot;, a venda é <strong>cancelada</strong> e o veículo volta a <strong>Disponível</strong>. Transações canceladas não entram nos totais financeiros.
            </p>
          </section>

          <section>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Repeat className="h-5 w-5" />
              Trocas
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Registre trocas: o cliente entrega um veículo (entrada) e leva outro (saída). O valor da diferença pode ser entrada ou saída de caixa. Ao cancelar uma troca, o veículo de saída volta a <strong>Disponível</strong>.
            </p>
          </section>

          <section>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <ArrowUpDown className="h-5 w-5" />
              Fluxo de Caixa
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Visão unificada de todas as movimentações: vendas, compras, trocas, custos de veículos e transações gerais da loja. Use os filtros &quot;Este Mês&quot;, &quot;Entradas&quot;, &quot;Saídas&quot; e &quot;Categoria&quot;. Valores de entrada em verde, saída em vermelho; itens cancelados aparecem riscados.
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              O botão <strong>Novo Lançamento</strong> serve para registrar despesas ou receitas da loja (aluguel, salários, marketing etc.), escolhendo tipo (Entrada/Saída) e categoria (Operacional, Administrativo, Marketing, Infraestrutura, Pessoal, Serviços Prestados, Outros).
            </p>
          </section>

          <section>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5" />
              Relatórios
            </h3>
            <p className="text-sm text-muted-foreground">
              Relatório financeiro por período (padrão: últimos 30 dias) com Total de Vendas, Compras, Trocas, Custos Adicionais e Saldo Geral. O saldo considera apenas transações <strong>ativas</strong> e já desconta os custos adicionais.
            </p>
          </section>
        </CardContent>
      </Card>

      {/* Lógica Financeira */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Lógica Financeira e Dashboard
          </CardTitle>
          <CardDescription>
            Como os números do dashboard e dos relatórios são calculados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Fórmulas principais</h4>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
              <li><strong>Lucro Bruto:</strong> Total Vendas (ativas) − Total Compras (ativas) + Total Trocas (ativas) − Custos Adicionais de Veículos.</li>
              <li><strong>Despesas Operacionais:</strong> Soma das transações da loja do tipo Saída nas categorias Operacional, Administrativo, Marketing e Infraestrutura (apenas ativas).</li>
              <li><strong>Lucro Líquido:</strong> Lucro Bruto − Despesas Operacionais.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Status das transações</h4>
            <p className="text-sm text-muted-foreground">
              Todas as transações (vendas, compras, trocas, transações da loja) podem estar <strong>Ativas</strong> ou <strong>Canceladas</strong>. Apenas as ativas entram nos totais. &quot;Excluir&quot; no sistema significa cancelar: o registro continua no banco com status cancelado, para histórico e auditoria.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custos e Detalhes do Veículo */}
      <Card>
        <CardHeader>
          <CardTitle>Custos Adicionais e Detalhes do Veículo</CardTitle>
          <CardDescription>
            Na tela de detalhes do veículo (acesso pelo ícone de olho na lista de motos) você pode:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Ver e adicionar <strong>Custos Adicionais</strong> (manutenção, documentação, etc.). Eles entram no custo real do veículo e no cálculo de lucro.</li>
            <li>Ver o <strong>histórico</strong> de compras, vendas e trocas daquele veículo.</li>
            <li>Ver o <strong>resumo financeiro</strong>: totais de compras e vendas ativas, custos adicionais e lucro líquido daquele veículo.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Dicas Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Cadastre clientes/fornecedores e veículos antes de gerar compras ou vendas.</li>
            <li>Use o Fluxo de Caixa para despesas fixas (aluguel, luz, marketing) e o módulo de Custos Adicionais nos veículos para gastos ligados a cada moto.</li>
            <li>O dashboard é atualizado automaticamente após criar, editar ou cancelar vendas, compras e trocas.</li>
            <li>Credenciais padrão de acesso: <strong>admin</strong> / <strong>admin123</strong>. Altere na primeira utilização em produção.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
