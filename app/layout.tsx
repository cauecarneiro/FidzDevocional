import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FIDZ - O seu momento de se aproximar",
  description: "Conteúdos católicos diários para fortalecer sua fé",
  icons: {
    icon: [
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  // O manifest deve ser servido da raiz para evitar erros de caminho
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} m-0 p-0`}>
      <body className={`${inter.className} antialiased m-0 p-0 w-full h-full`}>
        {children}
      </body>
    </html>
  );
} 