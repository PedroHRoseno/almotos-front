import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/layout/sidebar-provider";
import { MainContent } from "@/components/layout/main-content";
import { Toaster } from "sonner";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AlMotos - Sistema de Gerenciamento de Motos",
  description: "Sistema completo para gestão de concessionária de motos",
};

export const viewport: Viewport = {
  themeColor: "#08080a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${syne.variable} h-full`}>
      <body className="min-h-full antialiased font-sans bg-canvas text-ink">
        <AuthProvider>
          <AuthGuard>
            <DashboardProvider>
              <SidebarProvider>
                <LayoutWrapper>
                  <MainContent>{children}</MainContent>
                </LayoutWrapper>
              </SidebarProvider>
            </DashboardProvider>
          </AuthGuard>
        </AuthProvider>
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}
