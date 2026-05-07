import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GmailCleaner | Nettoyage intelligent par IA",
  description: "Automatisez le nettoyage de votre boîte Gmail avec l'aide de l'IA Kimi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-[#050505] text-white min-h-screen antialiased`}>
        <Toaster position="bottom-right" />
        {children}
      </body>
    </html>
  );
}
