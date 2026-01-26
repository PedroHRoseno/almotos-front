import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-provider";
import { MainContent } from "@/components/layout/main-content";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlMotos - Sistema de Gerenciamento de Motos",
  description: "Sistema completo para gestão de concessionária de motos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <SidebarProvider>
          <AppSidebar />
          <MainContent>{children}</MainContent>
        </SidebarProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
