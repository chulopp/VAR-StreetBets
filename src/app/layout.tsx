import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GlobalToast from "@/components/GlobalToast";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VAR-Street Bets | P2P Micro-Betting",
  description:
    "Aplikasi micro-betting P2P offline untuk momen nonton bareng sepak bola. Ubah jeda VAR menjadi pasar taruhan instan. Powered by Pears, QVAC, WDK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-white font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <GlobalToast />
      </body>
    </html>
  );
}
