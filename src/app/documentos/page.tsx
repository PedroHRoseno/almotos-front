import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { DocumentosWorkspace } from "@/components/documents/documentos-workspace";

export const metadata: Metadata = {
  title: "Documentos | AL Motos",
};

export default function DocumentosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DocumentosWorkspace />
    </Suspense>
  );
}
