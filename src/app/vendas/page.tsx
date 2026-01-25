import { FormVenda } from "@/components/forms/form-venda";

export default function VendasPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
        <p className="text-muted-foreground">
          Registre vendas de motos. Selecione o veículo, preencha o cliente e o valor.
        </p>
      </div>
      <FormVenda />
    </div>
  );
}
