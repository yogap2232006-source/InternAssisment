import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Book Insights platform",
  description: "Intelligent querying and insights generation for your books.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen selection:bg-indigo-500/30`}>
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              ExInternBooks
            </Link>
            <div className="flex gap-6 text-sm font-medium">
              <Link href="/" className="hover:text-indigo-400 transition-colors">Library</Link>
              <Link href="/qa" className="hover:text-indigo-400 transition-colors">Ask AI</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 pt-24 pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
