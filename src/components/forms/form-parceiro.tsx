"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parceiroSchema, type ParceiroFormData } from "@/lib/validations/schemas";
import { formatDocument, digitsOnly } from "@/lib/masks";
import { api } from "@/lib/api";
import { buscarCep } from "@/lib/viacep";
import { useState } from "react";
import { cn } from "@/lib/utils";

const defaultValues: Partial<ParceiroFormData> = {
  document: "",
  name: "",
  phoneNumber1: "",
  phoneNumber2: "",
  address: undefined,
};

export interface FormParceiroProps {
  onSuccess?: () => void;
  /** Chamado com o documento (CPF/CNPJ) do parceiro recém-criado. */
  onSuccessWithCpf?: (document: string) => void;
  insideModal?: boolean;
  initialData?: Partial<ParceiroFormData>;
  isEdit?: boolean;
}

function formatarCep(cep: string): string {
  const apenasDigitos = cep.replace(/\D/g, "");
  if (apenasDigitos.length <= 5) return apenasDigitos;
  return `${apenasDigitos.slice(0, 5)}-${apenasDigitos.slice(5, 8)}`;
}

const ESTADOS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function FormParceiro({ 
  onSuccess, 
  onSuccessWithCpf,
  insideModal, 
  initialData,
  isEdit = false 
}: FormParceiroProps = {}) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [incluirEndereco, setIncluirEndereco] = useState(!!initialData?.address);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepBuscado, setCepBuscado] = useState<string | null>(null);

  const form = useForm<ParceiroFormData>({
    resolver: zodResolver(parceiroSchema),
    defaultValues: initialData || defaultValues,
  });

  const onSubmit = async (data: ParceiroFormData) => {
    setSuccess(null);
    setError(null);
    
    // Validação manual: se o checkbox está marcado, o endereço deve estar completo
    // Nota: streetName é opcional (pode ser vazio para CEPs de cidade)
    if (incluirEndereco && data.address) {
      const addressErrors: string[] = [];
      if (!data.address.number?.trim()) addressErrors.push("Número é obrigatório");
      if (!data.address.city?.trim()) addressErrors.push("Cidade é obrigatória");
      if (!data.address.state?.trim() || data.address.state.length !== 2) {
        addressErrors.push("Estado (UF) é obrigatório");
      }
      if (!data.address.zipCode?.replace(/\D/g, "") || data.address.zipCode.replace(/\D/g, "").length !== 8) {
        addressErrors.push("CEP é obrigatório e deve ter 8 dígitos");
      }
      
      if (addressErrors.length > 0) {
        setError(addressErrors.join(", "));
        return;
      }
    }
    
    try {
      const addressData = incluirEndereco && data.address
        ? {
            streetName: data.address.streetName?.trim() || "",
            number: data.address.number.trim(),
            city: data.address.city.trim(), // Garantir que não está vazio (já validado acima)
            state: data.address.state.trim().toUpperCase(),
            reference: data.address.reference?.trim() || undefined,
            zipCode: data.address.zipCode.replace(/\D/g, ""),
          }
        : undefined;
      
      // Validação adicional antes de enviar
      if (addressData) {
        if (!addressData.city || addressData.city.length === 0) {
          setError("Cidade é obrigatória");
          return;
        }
        if (!addressData.number || addressData.number.length === 0) {
          setError("Número é obrigatório");
          return;
        }
        if (!addressData.state || addressData.state.length !== 2) {
          setError("Estado é obrigatório");
          return;
        }
        if (!addressData.zipCode || addressData.zipCode.length !== 8) {
          setError("CEP é obrigatório e deve ter 8 dígitos");
          return;
        }
      }
      
      const docDigits = digitsOnly(data.document);
      const payload = {
        document: docDigits,
        name: data.name.trim(),
        phoneNumber1: data.phoneNumber1?.trim() || undefined,
        phoneNumber2: data.phoneNumber2?.trim() || undefined,
        address: addressData,
      };

      if (isEdit && docDigits) {
        await api.customers.atualizar(docDigits, payload);
        setSuccess("Parceiro atualizado com sucesso.");
        onSuccess?.();
      } else {
        await api.customers.criar(payload);
        setSuccess("Parceiro cadastrado com sucesso.");
        if (!isEdit) {
          form.reset(defaultValues);
          setIncluirEndereco(false);
        }
        if (onSuccessWithCpf) {
          onSuccessWithCpf(docDigits);
        } else {
          onSuccess?.();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao cadastrar parceiro.");
    }
  };

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-3 text-sm text-green-800 dark:text-green-200">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          name="document"
          label="CPF/CNPJ"
          required
          error={form.formState.errors.document}
        >
          <Controller
            control={form.control}
            name="document"
            render={({ field }) => (
              <Input
                id="document"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                disabled={isEdit}
                value={field.value}
                onChange={(e) => field.onChange(formatDocument(e.target.value))}
                onBlur={field.onBlur}
                className={cn(form.formState.errors.document && "border-destructive")}
                maxLength={18}
              />
            )}
          />
        </FormField>

        <FormField
          name="name"
          label="Nome completo"
          required
          error={form.formState.errors.name}
        >
          <Input
            id="name"
            placeholder="Nome do parceiro"
            {...form.register("name")}
            className={cn(form.formState.errors.name && "border-destructive")}
          />
        </FormField>

        <FormField
          name="phoneNumber1"
          label="Telefone 1"
          error={form.formState.errors.phoneNumber1}
        >
          <Input
            id="phoneNumber1"
            placeholder="(00) 00000-0000"
            {...form.register("phoneNumber1")}
            className={cn(form.formState.errors.phoneNumber1 && "border-destructive")}
          />
        </FormField>

        <FormField
          name="phoneNumber2"
          label="Telefone 2"
          error={form.formState.errors.phoneNumber2}
        >
          <Input
            id="phoneNumber2"
            placeholder="(00) 00000-0000"
            {...form.register("phoneNumber2")}
            className={cn(form.formState.errors.phoneNumber2 && "border-destructive")}
          />
        </FormField>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="incluirEndereco"
            checked={incluirEndereco}
            onChange={(e) => {
              setIncluirEndereco(e.target.checked);
              if (!e.target.checked) {
                form.setValue("address", undefined);
                // Limpar erros de endereço
                form.clearErrors("address");
                setCepBuscado(null);
              } else {
                form.setValue("address", {
                  streetName: "",
                  number: "",
                  city: "",
                  state: "",
                  zipCode: "",
                  reference: "",
                }, { shouldValidate: false });
                setCepBuscado(null);
              }
            }}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="incluirEndereco" className="text-sm font-medium">
            Incluir endereço
          </label>
        </div>

        {incluirEndereco && (
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="text-sm font-semibold">Endereço</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                name="address.zipCode"
                label="CEP"
                required
                error={form.formState.errors.address?.zipCode}
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="zipCode"
                      placeholder="00000-000"
                      {...form.register("address.zipCode", {
                        onChange: (e) => {
                          const formatted = formatarCep(e.target.value);
                          form.setValue("address.zipCode", formatted);
                          // Resetar flag quando CEP muda
                          const cepLimpo = formatted.replace(/\D/g, "");
                          if (cepLimpo.length !== 8) {
                            setCepBuscado(null);
                          }
                          form.clearErrors("address.zipCode");
                        },
                      })}
                      className={cn(
                        form.formState.errors.address?.zipCode && "border-destructive"
                      )}
                      maxLength={9}
                      disabled={buscandoCep}
                    />
                    {buscandoCep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const cepAtual = form.getValues("address.zipCode");
                      const cepLimpo = cepAtual?.replace(/\D/g, "") || "";
                      
                      if (cepLimpo.length !== 8) {
                        form.setError("address.zipCode", {
                          type: "manual",
                          message: "CEP deve ter 8 dígitos",
                        });
                        return;
                      }
                      
                      if (!cepAtual) {
                        form.setError("address.zipCode", {
                          type: "manual",
                          message: "CEP é obrigatório",
                        });
                        return;
                      }
                      
                      setBuscandoCep(true);
                      try {
                        const dadosCep = await buscarCep(cepAtual);
                        if (dadosCep) {
                          // Preencher apenas campos que estão vazios ou que foram preenchidos automaticamente
                          const cepJaBuscado = cepBuscado === cepLimpo;
                          const ruaAtual = form.getValues("address.streetName");
                          const cidadeAtual = form.getValues("address.city");
                          const estadoAtual = form.getValues("address.state");
                          const referenciaAtual = form.getValues("address.reference");
                          
                          // Preencher rua apenas se estiver vazia ou se foi preenchida automaticamente antes
                          if (!ruaAtual?.trim() || cepJaBuscado) {
                            form.setValue("address.streetName", dadosCep.logradouro || "");
                          }
                          
                          // Preencher cidade apenas se estiver vazia ou se foi preenchida automaticamente antes
                          if (!cidadeAtual?.trim() || cepJaBuscado) {
                            form.setValue("address.city", dadosCep.localidade || "");
                          }
                          
                          // Preencher estado apenas se estiver vazio ou se foi preenchido automaticamente antes
                          if (!estadoAtual?.trim() || cepJaBuscado) {
                            form.setValue("address.state", dadosCep.uf || "");
                          }
                          
                          // Preencher referência com bairro apenas se estiver vazio
                          if (!referenciaAtual?.trim() && dadosCep.bairro) {
                            form.setValue("address.reference", dadosCep.bairro);
                          }
                          
                          setCepBuscado(cepLimpo);
                          form.clearErrors("address.zipCode");
                        } else {
                          // CEP não encontrado - permitir preenchimento manual
                          form.setError("address.zipCode", {
                            type: "manual",
                            message: "CEP não encontrado. Você pode preencher manualmente.",
                          });
                          setCepBuscado(null);
                        }
                      } catch (err) {
                        console.error("Erro ao buscar CEP:", err);
                        form.setError("address.zipCode", {
                          type: "manual",
                          message: "Erro ao buscar CEP. Você pode preencher manualmente.",
                        });
                        setCepBuscado(null);
                      } finally {
                        setBuscandoCep(false);
                      }
                    }}
                    disabled={buscandoCep}
                    className="shrink-0"
                  >
                    {buscandoCep ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buscando
                      </>
                    ) : (
                      "Buscar CEP"
                    )}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {buscandoCep 
                    ? "Buscando endereço..." 
                    : cepBuscado 
                    ? "CEP encontrado. Você pode editar os campos manualmente se necessário."
                    : "Digite o CEP e clique em 'Buscar CEP' para preencher automaticamente, ou preencha manualmente."}
                </p>
              </FormField>

              <FormField
                name="address.streetName"
                label="Rua (opcional)"
                error={form.formState.errors.address?.streetName}
              >
                <Input
                  id="streetName"
                  placeholder="Nome da rua (opcional - pode estar vazio para CEPs de cidade)"
                  {...form.register("address.streetName")}
                  className={cn(
                    form.formState.errors.address?.streetName && "border-destructive"
                  )}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Para CEPs de cidade, este campo pode ficar vazio. Preencha manualmente se necessário.
                </p>
              </FormField>

              <FormField
                name="address.number"
                label="Número"
                required
                error={form.formState.errors.address?.number}
              >
                <Input
                  id="number"
                  placeholder="123"
                  {...form.register("address.number")}
                  className={cn(
                    form.formState.errors.address?.number && "border-destructive"
                  )}
                />
              </FormField>

              <FormField
                name="address.city"
                label="Cidade"
                required
                error={form.formState.errors.address?.city}
              >
                <Input
                  id="city"
                  placeholder="Nome da cidade"
                  {...form.register("address.city")}
                  className={cn(
                    form.formState.errors.address?.city && "border-destructive"
                  )}
                />
              </FormField>

              <FormField
                name="address.state"
                label="Estado (UF)"
                required
                error={form.formState.errors.address?.state}
              >
                <Controller
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="state"
                        className={cn(
                          form.formState.errors.address?.state && "border-destructive"
                        )}
                      >
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS_BRASIL.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                name="address.reference"
                label="Referência (opcional)"
                error={form.formState.errors.address?.reference}
              >
                <Input
                  id="reference"
                  placeholder="Ponto de referência"
                  {...form.register("address.reference")}
                  className={cn(
                    form.formState.errors.address?.reference && "border-destructive"
                  )}
                />
              </FormField>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.reset(defaultValues);
            setIncluirEndereco(false);
            setCepBuscado(null);
          }}
        >
          Limpar
        </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Atualizando…" : "Cadastrando…"}
                </>
              ) : (
                isEdit ? "Atualizar parceiro" : "Cadastrar parceiro"
              )}
            </Button>
      </div>
    </form>
  );

  if (insideModal) {
    return formContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastrar parceiro</CardTitle>
        <CardDescription>
          Preencha os dados do parceiro (cliente ou fornecedor). O endereço é opcional.
        </CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
}
