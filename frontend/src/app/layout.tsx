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
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen selection:bg-indigo-500/30 relative`}>
        {/* Premium 3D Background */}
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-slate-950">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[120px] mix-blend-screen pointer-events-none"></div>
          <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] rounded-full bg-violet-600/10 blur-[100px] mix-blend-screen pointer-events-none"></div>
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="absolute inset-0 bg-slate-950 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_0%,#020617_100%)] pointer-events-none"></div>
        </div>

        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/20 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-md">
              ExInternBooks
            </Link>
            <div className="flex gap-6 text-sm font-medium">
              <Link href="/" className="hover:text-indigo-300 transition-colors">Library</Link>
              <Link href="/qa" className="hover:text-indigo-300 transition-colors">Ask AI</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 pt-24 pb-12 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
