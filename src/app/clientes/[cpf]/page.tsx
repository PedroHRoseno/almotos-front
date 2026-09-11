import { redirect } from "next/navigation";

export default async function LegacyClienteDetailPage({
  params,
}: {
  params: Promise<{ cpf: string }>;
}) {
  await params;
  redirect("/contatos");
}
