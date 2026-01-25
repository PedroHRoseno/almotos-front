import { FormTroca } from "@/components/forms/form-troca";

export default function TrocasPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trocas</h1>
        <p className="text-muted-foreground">
          Registre trocas de veículos: o cliente entrega um veículo como parte do pagamento de outro.
        </p>
      </div>
      <FormTroca />
    </div>
  );
}
