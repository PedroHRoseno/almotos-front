import { redirect } from "next/navigation";

export default async function LegacyClienteDetailPage({
  params,
}: {
  params: Promise<{ cpf: string }>;
}) {
  const { cpf } = await params;
  redirect(`/contatos/${cpf}`);
}
